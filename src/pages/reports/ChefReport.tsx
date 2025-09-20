import React, { useState, useEffect } from 'react';
import { Calendar, BarChart3, TrendingUp, TrendingDown } from 'lucide-react';
import Header from '../../components/Layout/Header';
import SummaryCard from '../../components/UI/SummaryCard';
import DataTable from '../../components/UI/DataTable';
import { db } from '../../services/database';
import { format, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';

const ChefReport: React.FC = () => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day');
  const [reportData, setReportData] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    staffCosts: 0,
    profit: 0,
    cashSales: 0,
    cardSales: 0,
    topSellingItems: [] as Array<{ name: string; count: number; revenue: number }>,
    inventoryWarnings: [] as Array<{ name: string; stock: number; minStock: number }>,
    usingFallback: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    generateReport();
  }, [period]);

  const generateReport = async () => {
    setLoading(true);
    try {
      const now = new Date();
      let startDate: Date;
      let endDate: Date;

      switch (period) {
        case 'week':
          startDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
          endDate = endOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'month':
          startDate = startOfMonth(now);
          endDate = endOfMonth(now);
          break;
        default: // day
          startDate = startOfDay(now);
          endDate = endOfDay(now);
      }

      // Get sessions for the period - this is the PRIMARY source for revenue data
      let sessions;
      
      if (period === 'day') {
        // For daily reports, use exact date match instead of between() to avoid timezone issues
        const todayString = format(new Date(), 'yyyy-MM-dd');
        sessions = await db.sessions.where('date').equals(todayString).toArray();
        console.log(`📅 Daily Report - searching for date: ${todayString}`);
      } else {
        // For weekly/monthly, use date range
        sessions = await db.sessions
          .where('date')
          .between(format(startDate, 'yyyy-MM-dd'), format(endDate, 'yyyy-MM-dd'))
          .toArray();
        console.log(`📅 ${period.charAt(0).toUpperCase() + period.slice(1)} Report - searching between: ${format(startDate, 'yyyy-MM-dd')} and ${format(endDate, 'yyyy-MM-dd')}`);
      }

      // Filter only closed sessions (these have the correct cash/card split from SessionClosing)
      const closedSessions = sessions.filter(s => s.isClosed);

      // Calculate revenue from closed sessions (preferred method)
      const sessionTotalRevenue = closedSessions.reduce((sum, session) => sum + (session.totalRevenue || 0), 0);
      const sessionCashSales = closedSessions.reduce((sum, session) => sum + (session.cashSales || 0), 0);
      const sessionCardSales = closedSessions.reduce((sum, session) => sum + (session.cardSales || 0), 0);

      // FALLBACK: If no closed sessions, calculate from sales records (but no cash/card split available)
      let finalTotalRevenue = sessionTotalRevenue;
      let finalCashSales = sessionCashSales;
      let finalCardSales = sessionCardSales;
      let usingFallback = false;

      if (closedSessions.length === 0 && sessions.length > 0) {
        // There are sessions but none are properly closed - use sales records as fallback
        let salesForRevenue;
        
        if (period === 'day') {
          // For daily, get all sales from today
          const todayStart = startOfDay(new Date());
          const todayEnd = endOfDay(new Date());
          salesForRevenue = await db.sales
            .where('timestamp')
            .between(todayStart, todayEnd)
            .toArray();
        } else {
          // For weekly/monthly, use date range
          salesForRevenue = await db.sales
            .where('timestamp')
            .between(startDate, endDate)
            .toArray();
        }
        
        const salesRevenue = salesForRevenue.reduce((sum, sale) => sum + (sale.price * sale.amount), 0);
        
        if (salesRevenue > 0) {
          finalTotalRevenue = salesRevenue;
          // Since we don't have proper cash/card split, we can't show accurate breakdown
          finalCashSales = 0;
          finalCardSales = 0;
          usingFallback = true;
        }
      }

      // For debugging: log what we found
      console.log(`📊 Chef Report Data Source:`, {
        totalSessions: sessions.length,
        closedSessions: closedSessions.length,
        finalTotalRevenue,
        finalCashSales,
        finalCardSales,
        usingFallback
      });

      // Get expenses
      const expenses = await db.expenses
        .where('timestamp')
        .between(startDate, endDate)
        .toArray();

      const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Get staff costs
      const shifts = await db.shifts
        .where('start')
        .between(startDate, endDate)
        .toArray();

      const staffCosts = shifts
        .filter(shift => shift.end) // Only completed shifts
        .reduce((sum, shift) => sum + shift.calculatedWage, 0);

      // Calculate profit using session data
      const profit = finalTotalRevenue - totalExpenses - staffCosts;

      // Get sales records for top selling items calculation
      let salesForItems;
      
      if (period === 'day') {
        // For daily, get all sales from today
        const todayStart = startOfDay(new Date());
        const todayEnd = endOfDay(new Date());
        salesForItems = await db.sales
          .where('timestamp')
          .between(todayStart, todayEnd)
          .toArray();
      } else {
        // For weekly/monthly, use date range
        salesForItems = await db.sales
          .where('timestamp')
          .between(startDate, endDate)
          .toArray();
      }

      const menuItems = await db.menuItems.toArray();
      
      // Group sales by menu item
      const salesByItem = salesForItems.reduce((acc, sale) => {
        if (!acc[sale.menuItemId]) {
          acc[sale.menuItemId] = { count: 0, revenue: 0 };
        }
        acc[sale.menuItemId].count += sale.amount;
        acc[sale.menuItemId].revenue += sale.price * sale.amount;
        return acc;
      }, {} as Record<string, { count: number; revenue: number }>);

      const topSellingItems = Object.entries(salesByItem)
        .map(([menuItemId, data]) => {
          const menuItem = menuItems.find(item => item.id === menuItemId);
          return {
            name: menuItem?.name || 'Unknown Item',
            count: data.count,
            revenue: data.revenue
          };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get inventory warnings
      const inventoryItems = await db.inventoryItems.toArray();
      const inventoryWarnings = inventoryItems
        .filter(item => item.stock <= item.minStock)
        .map(item => ({
          name: item.name,
          stock: item.stock,
          minStock: item.minStock
        }));

      setReportData({
        totalRevenue: finalTotalRevenue,
        totalExpenses,
        staffCosts,
        profit,
        cashSales: finalCashSales,
        cardSales: finalCardSales,
        topSellingItems,
        inventoryWarnings,
        usingFallback
      });
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      default: return 'Today';
    }
  };

  const topItemsColumns = [
    { key: 'name', label: 'Item' },
    { key: 'count', label: 'Sold' },
    { 
      key: 'revenue', 
      label: 'Revenue', 
      format: (value: number) => `€${value.toFixed(2)}` 
    }
  ];

  const inventoryColumns = [
    { key: 'name', label: 'Item' },
    { key: 'stock', label: 'Current Stock' },
    { key: 'minStock', label: 'Min Stock' },
    { 
      key: 'status', 
      label: 'Status',
      format: (value: any, item: any) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          item.stock <= 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {item.stock <= 0 ? 'Empty' : 'Low Stock'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div>
        <Header title="Chef Report" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Generating report...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Chef Report" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Period Selector */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Performance Report - {getPeriodLabel()}
          </h2>
          
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(['day', 'week', 'month'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  period === p
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Financial Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Revenue"
            value={`€${reportData.totalRevenue.toFixed(2)}`}
            color="revenue"
            icon={TrendingUp}
          />
          <SummaryCard
            title="Total Expenses"
            value={`€${reportData.totalExpenses.toFixed(2)}`}
            color="expense"
            icon={TrendingDown}
          />
          <SummaryCard
            title="Staff Costs"
            value={`€${reportData.staffCosts.toFixed(2)}`}
            color="employee"
            icon={TrendingDown}
          />
          <SummaryCard
            title="Net Profit"
            value={`€${reportData.profit.toFixed(2)}`}
            color={reportData.profit >= 0 ? 'revenue' : 'expense'}
            icon={reportData.profit >= 0 ? TrendingUp : TrendingDown}
          />
        </div>

        {/* Warning for unclosed sessions */}
        {reportData.usingFallback && (
          <div className="mb-8 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded-r-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Unvollständige Session-Daten
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Die Sessions wurden nicht ordnungsgemäß über "Session beenden" geschlossen. 
                    Daher können keine genauen Bar-/Kartenzahlungs-Aufschlüsselungen angezeigt werden.
                    Bitte schließen Sie zukünftige Sessions über die SessionClosing-Seite für korrekte Berichte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <SummaryCard
            title="Cash Sales"
            value={`€${reportData.cashSales.toFixed(2)}`}
            color="revenue"
            subtitle={`${reportData.totalRevenue > 0 ? ((reportData.cashSales / reportData.totalRevenue) * 100).toFixed(1) : 0}% of total`}
          />
          <SummaryCard
            title="Card Sales"
            value={`€${reportData.cardSales.toFixed(2)}`}
            color="employee"
            subtitle={`${reportData.totalRevenue > 0 ? ((reportData.cardSales / reportData.totalRevenue) * 100).toFixed(1) : 0}% of total`}
          />
        </div>

        {/* Top Selling Items */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Top Selling Items</h3>
            <DataTable
              columns={topItemsColumns}
              data={reportData.topSellingItems}
              actions={false}
              emptyMessage="No sales recorded for this period"
            />
          </div>

          {/* Inventory Warnings */}
          <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">Inventory Warnings</h3>
            {reportData.inventoryWarnings.length > 0 ? (
              <DataTable
                columns={inventoryColumns}
                data={reportData.inventoryWarnings}
                actions={false}
                emptyMessage="All inventory levels are good"
              />
            ) : (
              <div className="card text-center py-8">
                <div className="text-green-600 mb-2">✅</div>
                <p className="text-green-800 font-medium">All inventory levels are good!</p>
                <p className="text-green-600 text-sm">No items are running low on stock.</p>
              </div>
            )}
          </div>
        </div>

        {/* Summary Insights */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">📊 Key Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Financial Performance:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Profit margin: {reportData.totalRevenue > 0 ? ((reportData.profit / reportData.totalRevenue) * 100).toFixed(1) : 0}%</li>
                <li>• Average order value: €{reportData.topSellingItems.length > 0 ? (reportData.totalRevenue / reportData.topSellingItems.reduce((sum, item) => sum + item.count, 0)).toFixed(2) : '0.00'}</li>
                <li>• Staff cost ratio: {reportData.totalRevenue > 0 ? ((reportData.staffCosts / reportData.totalRevenue) * 100).toFixed(1) : 0}%</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-2">Operational Status:</h4>
              <ul className="space-y-1 text-blue-700">
                <li>• Payment preference: {reportData.cashSales > reportData.cardSales ? 'Cash' : 'Card'} ({reportData.totalRevenue > 0 ? Math.max((reportData.cashSales / reportData.totalRevenue) * 100, (reportData.cardSales / reportData.totalRevenue) * 100).toFixed(1) : 0}%)</li>
                <li>• Inventory alerts: {reportData.inventoryWarnings.length} items need attention</li>
                <li>• Best seller: {reportData.topSellingItems[0]?.name || 'N/A'}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefReport;
import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, Save, AlertCircle } from 'lucide-react';
import Header from '../../components/Layout/Header';
import SummaryCard from '../../components/UI/SummaryCard';
import { db } from '../../services/database';
import { DayRecord } from '../../types';

const DailyClosing: React.FC = () => {
  const [todayRecord, setTodayRecord] = useState<DayRecord | null>(null);
  const [actualCash, setActualCash] = useState('');
  const [cashRevenue, setCashRevenue] = useState('');
  const [cardRevenue, setCardRevenue] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    loadTodayRecord();
  }, []);

  const loadTodayRecord = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const record = await db.dayRecords.get(today);
      
      // Calculate today's revenue from menu items
      const menuItems = await db.menuItems.toArray();
      const calculatedRevenue = menuItems.reduce((total, item) => total + (item.soldCount * item.price), 0);
      setTodayRevenue(calculatedRevenue);
      
      if (record) {
        setTodayRecord(record);
        if (record.actualCash !== undefined) {
          setActualCash(record.actualCash.toString());
        }
        // Pre-fill cash/card if already saved
        if (record.salesCash !== undefined) {
          setCashRevenue(record.salesCash.toString());
        }
        if (record.salesCard !== undefined) {
          setCardRevenue(record.salesCard.toString());
        }
      } else {
        // Create a default record if none exists
        const defaultRecord: DayRecord = {
          date: today,
          startCash: 0,
          salesCash: 0,
          salesCard: 0,
          expenses: 0,
          endCash: 0,
          dayStarted: false,
          dayClosed: false
        };
        await db.dayRecords.add(defaultRecord);
        setTodayRecord(defaultRecord);
      }
    } catch (error) {
      console.error('Error loading today\'s record:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!todayRecord || !actualCash || !cashRevenue || !cardRevenue) {
      setMessage('Please fill in all required fields');
      return;
    }

    setSaving(true);
    try {
      const actualCashAmount = parseFloat(actualCash);
      const cashRevenueAmount = parseFloat(cashRevenue);
      const cardRevenueAmount = parseFloat(cardRevenue);
      const totalRevenueEntered = cashRevenueAmount + cardRevenueAmount;
      
      // Check if manually entered revenue matches calculated revenue
      if (Math.abs(totalRevenueEntered - todayRevenue) > 0.01) {
        setMessage(`Warning: Entered revenue (€${totalRevenueEntered.toFixed(2)}) doesn't match calculated revenue (€${todayRevenue.toFixed(2)})`);
        setSaving(false);
        return;
      }
      
      const expectedCash = todayRecord.startCash + cashRevenueAmount - todayRecord.expenses;
      const difference = actualCashAmount - expectedCash;

      // Use the manually entered revenue split
      const finalRevenue = cashRevenueAmount + cardRevenueAmount;
      
      // Get staff costs for today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayShifts = await db.shifts
        .where('start')
        .between(today, tomorrow)
        .toArray();
      
      const finalStaffCosts = todayShifts
        .filter(shift => shift.end)
        .reduce((sum, shift) => sum + shift.calculatedWage, 0);

      const finalProfit = finalRevenue - todayRecord.expenses - finalStaffCosts;

      // Close the day with final results
      await db.dayRecords.update(todayRecord.date, {
        actualCash: actualCashAmount,
        difference: difference,
        salesCash: cashRevenueAmount,
        salesCard: cardRevenueAmount,
        dayClosed: true,
        finalRevenue,
        finalExpenses: todayRecord.expenses,
        finalStaffCosts,
        finalProfit
      });

      setMessage('✅ Day closed successfully! Redirecting to start new day...');
      
      // Redirect to start day page after 3 seconds
      setTimeout(() => {
        window.location.href = '/start-day';
      }, 3000);
      
    } catch (error) {
      console.error('Error saving daily closing:', error);
      setMessage('Error saving daily closing. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Daily Closing" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading daily records...</div>
        </div>
      </div>
    );
  }

  if (!todayRecord) {
    return (
      <div>
        <Header title="Daily Closing" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <p className="text-gray-600">No records found for today.</p>
          </div>
        </div>
      </div>
    );
  }

  // Calculate values based on entered data
  const totalRevenueEntered = (parseFloat(cashRevenue) || 0) + (parseFloat(cardRevenue) || 0);
  const expectedCash = todayRecord.startCash + (parseFloat(cashRevenue) || 0) - todayRecord.expenses;
  const netResult = totalRevenueEntered - todayRecord.expenses;
  const difference = (actualCash && cashRevenue) ? parseFloat(actualCash) - expectedCash : null;

  return (
    <div>
      <Header title="Daily Closing" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : message.includes('Perfect')
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {/* Daily Summary */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Daily Closing - {new Date().toLocaleDateString()}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SummaryCard
              title="Starting Cash"
              value={`€${todayRecord.startCash.toFixed(2)}`}
              color="neutral"
              icon={DollarSign}
            />
            <SummaryCard
              title="Today's Revenue (Calculated)"
              value={`€${todayRevenue.toFixed(2)}`}
              color="revenue"
              icon={DollarSign}
              subtitle="From menu item sales"
            />
            <SummaryCard
              title="Total Expenses"
              value={`€${todayRecord.expenses.toFixed(2)}`}
              color="expense"
              icon={DollarSign}
            />
          </div>
        </div>

        {/* Expected Cash Calculation */}
        {cashRevenue && (
          <div className="card mb-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Expected Cash Calculation</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">Starting Cash Balance:</span>
                <span className="font-semibold">€{todayRecord.startCash.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">+ Cash Revenue (entered):</span>
                <span className="font-semibold text-green-600">+€{parseFloat(cashRevenue).toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 border-b border-gray-200">
                <span className="text-gray-600">- Cash Expenses:</span>
                <span className="font-semibold text-red-600">-€{todayRecord.expenses.toFixed(2)}</span>
              </div>
              
              <div className="flex justify-between items-center py-3 text-lg font-bold bg-blue-50 px-4 rounded-lg">
                <span>Expected Cash in Register:</span>
                <span className="text-blue-600">€{(todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses).toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Revenue Split & Cash Count Form */}
        <div className="card mb-8">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="inline-block h-6 w-6 mr-2" />
            Revenue Split & Cash Reconciliation
          </h3>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="form-group">
                <label className="form-label text-lg">
                  Cash Revenue (€) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    €
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={cashRevenue}
                    onChange={(e) => setCashRevenue(e.target.value)}
                    className="input-field pl-8 text-lg text-center"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Revenue received in cash
                </p>
              </div>

              <div className="form-group">
                <label className="form-label text-lg">
                  Card Revenue (€) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                    €
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={cardRevenue}
                    onChange={(e) => setCardRevenue(e.target.value)}
                    className="input-field pl-8 text-lg text-center"
                    placeholder="0.00"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Revenue received by card
                </p>
              </div>
            </div>

            {/* Revenue Total Check */}
            {cashRevenue && cardRevenue && (
              <div className={`p-4 rounded-lg border-2 ${
                Math.abs((parseFloat(cashRevenue) + parseFloat(cardRevenue)) - todayRevenue) < 0.01
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start">
                  <AlertCircle className={`h-5 w-5 mr-2 mt-0.5 ${
                    Math.abs((parseFloat(cashRevenue) + parseFloat(cardRevenue)) - todayRevenue) < 0.01 
                      ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <h4 className={`font-semibold ${
                      Math.abs((parseFloat(cashRevenue) + parseFloat(cardRevenue)) - todayRevenue) < 0.01 
                        ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {Math.abs((parseFloat(cashRevenue) + parseFloat(cardRevenue)) - todayRevenue) < 0.01 
                        ? 'Revenue Match!' 
                        : 'Revenue Mismatch'
                      }
                    </h4>
                    <p className={`text-sm ${
                      Math.abs((parseFloat(cashRevenue) + parseFloat(cardRevenue)) - todayRevenue) < 0.01 
                        ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      Expected: €{todayRevenue.toFixed(2)} | 
                      Entered: €{(parseFloat(cashRevenue) + parseFloat(cardRevenue)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label text-lg">
                Actual Cash Counted (€) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg">
                  €
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={actualCash}
                  onChange={(e) => setActualCash(e.target.value)}
                  className="input-field pl-8 text-lg text-center"
                  placeholder="0.00"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Count all cash in your register and enter the total amount.
              </p>
            </div>

            {actualCash && cashRevenue && !isNaN(parseFloat(actualCash)) && !isNaN(parseFloat(cashRevenue)) && (
              <div className={`p-4 rounded-lg border-2 ${
                Math.abs(parseFloat(actualCash) - (todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses)) < 0.01
                  ? 'bg-green-50 border-green-200'
                  : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start">
                  <AlertCircle className={`h-5 w-5 mr-2 mt-0.5 ${
                    Math.abs(parseFloat(actualCash) - (todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses)) < 0.01 
                      ? 'text-green-600' : 'text-yellow-600'
                  }`} />
                  <div>
                    <h4 className={`font-semibold ${
                      Math.abs(parseFloat(actualCash) - (todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses)) < 0.01 
                        ? 'text-green-800' : 'text-yellow-800'
                    }`}>
                      {Math.abs(parseFloat(actualCash) - (todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses)) < 0.01 
                        ? 'Perfect Match!' 
                        : 'Cash Discrepancy'
                      }
                    </h4>
                    <p className={`text-sm ${
                      Math.abs(parseFloat(actualCash) - (todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses)) < 0.01 
                        ? 'text-green-700' : 'text-yellow-700'
                    }`}>
                      Expected: €{(todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses).toFixed(2)} | 
                      Actual: €{parseFloat(actualCash).toFixed(2)} | 
                      Difference: €{(parseFloat(actualCash) - (todayRecord.startCash + parseFloat(cashRevenue) - todayRecord.expenses)).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving || !actualCash}
              className="btn-primary w-full flex items-center justify-center text-lg py-6"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Complete Daily Closing
                </>
              )}
            </button>
          </form>
        </div>

        {/* Final Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            title="Total Revenue"
            value={`€${totalRevenueEntered.toFixed(2)}`}
            color="revenue"
            subtitle="Cash + Card entered"
          />
          <SummaryCard
            title="Net Result"
            value={`€${netResult.toFixed(2)}`}
            color={netResult >= 0 ? 'revenue' : 'expense'}
            subtitle="Revenue - Expenses"
          />
          {difference !== null && (
            <SummaryCard
              title="Cash Difference"
              value={`€${difference.toFixed(2)}`}
              color={Math.abs(difference) < 0.01 ? 'revenue' : 'expense'}
              subtitle={Math.abs(difference) < 0.01 ? 'Perfect match' : difference > 0 ? 'Surplus' : 'Shortage'}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyClosing;
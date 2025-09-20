import React, { useState, useEffect } from 'react';
import { ShoppingCart, Package, Receipt, Users, ArrowLeft, Clock, DollarSign } from 'lucide-react';
import { db } from '../services/database';
import { Session, Sale, Expense, Shift } from '../types';

const ManagementDashboard: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<Session | null>(null);
  const [sessionSales, setSessionSales] = useState<Sale[]>([]);
  const [sessionExpenses, setSessionExpenses] = useState<Expense[]>([]);
  const [sessionShifts, setSessionShifts] = useState<Shift[]>([]);
  const [staffCosts, setStaffCosts] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      // Get session ID from URL params or active session
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      let session: Session | null = null;
      
      if (sessionId) {
        session = await db.sessions.get(sessionId) || null;
      } else {
        // Fallback to active session
        const today = new Date().toISOString().split('T')[0];
        session = await db.sessions.where('date').equals(today).and(s => s.isActive).first() || null;
      }
      
      if (session) {
        setCurrentSession(session);
        
        // Load session-specific data
        const sales = await db.sales.where('sessionId').equals(session.id).toArray();
        const expenses = await db.expenses.where('sessionId').equals(session.id).toArray();
        
        // Load shifts that overlap with this session
        // Only calculate staff costs for shifts that occurred during or after this session started
        const sessionStart = new Date(session.startTime);
        const sessionEnd = session.endTime ? new Date(session.endTime) : new Date();
        
        const shifts = await db.shifts
          .where('start')
          .between(sessionStart, sessionEnd)
          .toArray();
        
        // Calculate staff costs from shifts that overlap with the session timeframe
        const totalStaffCosts = shifts
          .filter(shift => {
            if (!shift.end) return false; // Only completed shifts
            
            const shiftStart = new Date(shift.start);
            const shiftEnd = new Date(shift.end);
            
            // Check if shift overlaps with session timeframe
            return shiftStart >= sessionStart && shiftEnd <= sessionEnd;
          })
          .reduce((sum, shift) => sum + (shift.calculatedWage || 0), 0);
        
        setSessionSales(sales);
        setSessionExpenses(expenses);
        setSessionShifts(shifts);
        setStaffCosts(totalStaffCosts);
      }
    } catch (error) {
      console.error('Error loading session data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (startTime: Date, endTime?: Date) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : new Date();
    const diffMinutes = Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };
  const managementTiles = [
    {
      title: 'Verkäufe',
      icon: ShoppingCart,
      color: 'revenue',
      path: currentSession ? `/operations/sales?session=${currentSession.id}` : '/operations/sales',
      description: 'Verkäufe zu dieser Session hinzufügen'
    },
    {
      title: 'Inventar',
      icon: Package,
      color: 'inventory',
      path: '/operations/inventory',
      description: 'Bestandsübersicht und -verwaltung'
    },
    {
      title: 'Ausgaben',
      icon: Receipt,
      color: 'expense',
      path: currentSession ? `/operations/expenses?session=${currentSession.id}` : '/operations/expenses',
      description: 'Ausgaben zu dieser Session hinzufügen'
    },
    {
      title: 'Mitarbeiter-Zeiterfassung',
      icon: Users,
      color: 'employee',
      path: '/operations/employees',
      description: 'Ein- und Ausstempeln von Mitarbeitern'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      revenue: 'bg-revenue-600 hover:bg-revenue-700 text-white',
      expense: 'bg-expense-600 hover:bg-expense-700 text-white',
      employee: 'bg-employee-600 hover:bg-employee-700 text-white',
      inventory: 'bg-inventory-600 hover:bg-inventory-700 text-white'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Lade Session...</div>
      </div>
    );
  }

  if (!currentSession) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <div className="flex items-center">
              <a href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Management Dashboard</h1>
                <p className="text-red-600 mt-2">Keine aktive Session gefunden</p>
              </div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="card text-center py-12">
            <Clock className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Keine Session verfügbar
            </h3>
            <p className="text-gray-600 mb-6">
              Erstellen Sie zuerst eine Session, um das Management zu verwenden.
            </p>
            <a href="/" className="btn-primary">
              Zurück zu Sessions
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Session Info */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {currentSession.sessionName} - Management
                </h1>
                <div className="flex items-center mt-2 text-gray-600">
                  <Clock className="h-4 w-4 mr-2" />
                  <span>
                    Gestartet um {formatTime(currentSession.startTime)}
                    {currentSession.isActive && ` • ${formatDuration(currentSession.startTime)} aktiv`}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              <a href="/settings" className="btn-secondary">Settings</a>
            </div>
          </div>
        </div>
      </div>

      {/* Session Status Banner */}
      <div className={`${
        currentSession.isActive 
          ? 'bg-green-50 border-green-200' 
          : 'bg-gray-50 border-gray-200'
      } border-b`}>
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                €{currentSession.totalRevenue.toFixed(2)}
              </div>
              <div className="text-green-700 text-sm">Session Umsatz</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                €{currentSession.totalExpenses.toFixed(2)}
              </div>
              <div className="text-red-700 text-sm">Session Ausgaben</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                €{staffCosts.toFixed(2)}
              </div>
              <div className="text-yellow-700 text-sm">Mitarbeiterlöhne</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {sessionSales.length}
              </div>
              <div className="text-blue-700 text-sm">Verkäufe</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {sessionExpenses.length}
              </div>
              <div className="text-purple-700 text-sm">Ausgaben</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Management Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {managementTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <a
                key={tile.title}
                href={tile.path}
                className={`tile ${getColorClasses(tile.color)} transform hover:scale-105 transition-all duration-200 p-8 rounded-2xl shadow-lg`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold mb-3">{tile.title}</h3>
                    <p className="text-lg opacity-90">{tile.description}</p>
                  </div>
                  <Icon className="h-16 w-16 ml-6 opacity-80" />
                </div>
              </a>
            );
          })}
        </div>

        {/* Quick Info */}
        <div className="card mt-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Session Übersicht - {currentSession.sessionName}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="text-center p-4 bg-revenue-50 rounded-lg">
              <div className="text-2xl font-bold text-revenue-600">
                €{sessionSales.reduce((sum, sale) => sum + (sale.price * sale.amount), 0).toFixed(2)}
              </div>
              <div className="text-revenue-700">Session Verkäufe</div>
            </div>
            <div className="text-center p-4 bg-expense-50 rounded-lg">
              <div className="text-2xl font-bold text-expense-600">
                €{sessionExpenses.reduce((sum, expense) => sum + expense.amount, 0).toFixed(2)}
              </div>
              <div className="text-expense-700">Session Ausgaben</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                €{staffCosts.toFixed(2)}
              </div>
              <div className="text-yellow-700">Mitarbeiterlöhne</div>
            </div>
            <div className="text-center p-4 bg-employee-50 rounded-lg">
              <div className="text-2xl font-bold text-employee-600">
                {currentSession.isActive ? 'Aktiv' : 'Beendet'}
              </div>
              <div className="text-employee-700">Session Status</div>
            </div>
            <div className="text-center p-4 bg-inventory-50 rounded-lg">
              <div className="text-2xl font-bold text-inventory-600">
                €{(currentSession.totalRevenue - currentSession.totalExpenses - staffCosts).toFixed(2)}
              </div>
              <div className="text-inventory-700">Session Nettogewinn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagementDashboard;
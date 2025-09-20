import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, CreditCard, Banknote, Users, Receipt, ArrowLeft, CheckCircle } from 'lucide-react';
import { db } from '../services/database';
import { Session, Sale, Expense, Shift, DayRecord } from '../types';
import { useNavigate } from 'react-router-dom';

const SessionClosing: React.FC = () => {
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [sessionSales, setSessionSales] = useState<Sale[]>([]);
  const [sessionExpenses, setSessionExpenses] = useState<Expense[]>([]);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [dayRecord, setDayRecord] = useState<DayRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [isClosing, setIsClosing] = useState(false);

  // Form inputs
  const [cashRevenue, setCashRevenue] = useState<string>('');
  const [cardRevenue, setCardRevenue] = useState<string>('');
  const [actualCashCount, setActualCashCount] = useState<string>('');

  useEffect(() => {
    loadSessionData();
  }, []);

  const loadSessionData = async () => {
    try {
      // Get session ID from URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      if (!sessionId) {
        alert('Keine Session ID gefunden');
        navigate('/');
        return;
      }

      // Load session
      const sessionData = await db.sessions.get(sessionId);
      if (!sessionData) {
        alert('Session nicht gefunden');
        navigate('/');
        return;
      }

      // Load session-related data
      const sales = await db.sales.where('sessionId').equals(sessionId).toArray();
      const expenses = await db.expenses.where('sessionId').equals(sessionId).toArray();
      
      // Load today's shifts
      const today = new Date().toISOString().split('T')[0];
      const todayStart = new Date(today + 'T00:00:00.000Z');
      const todayEnd = new Date(today + 'T23:59:59.999Z');
      
      const shifts = await db.shifts
        .where('start')
        .between(todayStart, todayEnd)
        .toArray();

      // Load or create day record
      let record = await db.dayRecords.get(today);
      if (!record) {
        record = {
          date: today,
          startCash: 200.00, // Default - should come from settings
          salesCash: 0,
          salesCard: 0,
          expenses: 0,
          endCash: 200.00,
          dayStarted: true,
          dayClosed: false
        };
        await db.dayRecords.add(record);
      }

      setSession(sessionData);
      setSessionSales(sales);
      setSessionExpenses(expenses);
      setTodayShifts(shifts);
      setDayRecord(record);

      // Pre-fill with total revenue
      setCashRevenue(sessionData.totalRevenue.toFixed(2));
      setCardRevenue('0.00');
      
    } catch (error) {
      console.error('Error loading session data:', error);
      alert('Fehler beim Laden der Session-Daten');
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseSession = async () => {
    if (!session || !dayRecord) return;

    const cashRevenueNum = parseFloat(cashRevenue) || 0;
    const cardRevenueNum = parseFloat(cardRevenue) || 0;
    const actualCashNum = parseFloat(actualCashCount) || 0;

    // Validation
    if (Math.abs((cashRevenueNum + cardRevenueNum) - session.totalRevenue) > 0.01) {
      alert(`Fehler: Bar + Karte (€${(cashRevenueNum + cardRevenueNum).toFixed(2)}) muss gleich Gesamteinnahmen (€${session.totalRevenue.toFixed(2)}) sein!`);
      return;
    }

    if (!actualCashCount) {
      alert('Bitte geben Sie die tatsächlich gezählte Bargeldmenge ein');
      return;
    }

    setIsClosing(true);

    try {
      // Calculate staff costs
      const staffCosts = todayShifts
        .filter(shift => shift.end)
        .reduce((sum, shift) => sum + (shift.calculatedWage || 0), 0);

      const totalExpenses = sessionExpenses.reduce((sum, expense) => sum + expense.amount, 0);

      // Calculate expected cash (start cash + cash revenue - cash expenses)
      const expectedCash = dayRecord.startCash + cashRevenueNum - totalExpenses;
      const cashDifference = actualCashNum - expectedCash;

      // Update session with final values
      await db.sessions.update(session.id, {
        isActive: false,
        isClosed: true,
        endTime: new Date(),
        totalRevenue: session.totalRevenue,
        totalExpenses: totalExpenses,
        cashSales: cashRevenueNum,
        cardSales: cardRevenueNum
      });

      // Update day record
      await db.dayRecords.update(dayRecord.date, {
        salesCash: dayRecord.salesCash + cashRevenueNum,
        salesCard: dayRecord.salesCard + cardRevenueNum,
        expenses: dayRecord.expenses + totalExpenses,
        endCash: actualCashNum,
        actualCash: actualCashNum,
        difference: cashDifference,
        finalRevenue: dayRecord.finalRevenue ? dayRecord.finalRevenue + session.totalRevenue : session.totalRevenue,
        finalExpenses: dayRecord.finalExpenses ? dayRecord.finalExpenses + totalExpenses : totalExpenses,
        finalStaffCosts: dayRecord.finalStaffCosts ? dayRecord.finalStaffCosts + staffCosts : staffCosts,
        finalProfit: (dayRecord.finalRevenue || 0) + session.totalRevenue - (dayRecord.finalExpenses || 0) - totalExpenses - staffCosts
      });

      alert('✅ Session erfolgreich geschlossen!');
      navigate('/');

    } catch (error) {
      console.error('Error closing session:', error);
      alert('Fehler beim Schließen der Session');
    } finally {
      setIsClosing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Lade Session-Daten...</div>
      </div>
    );
  }

  if (!session || !dayRecord) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl text-red-600">Session-Daten konnten nicht geladen werden</div>
      </div>
    );
  }

  const totalExpenses = sessionExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const staffCosts = todayShifts
    .filter(shift => shift.end)
    .reduce((sum, shift) => sum + (shift.calculatedWage || 0), 0);

  const cashRevenueNum = parseFloat(cashRevenue) || 0;
  const cardRevenueNum = parseFloat(cardRevenue) || 0;
  const actualCashNum = parseFloat(actualCashCount) || 0;

  const expectedCash = dayRecord.startCash + cashRevenueNum - totalExpenses;
  const cashDifference = actualCashNum - expectedCash;
  const netProfit = session.totalRevenue - totalExpenses - staffCosts;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')} 
              className="mr-4 p-2 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Session beenden: {session.sessionName}
              </h1>
              <p className="text-gray-600 mt-2">
                Bargeld zählen und Session abschließen
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Session Overview */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Session Übersicht</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                €{dayRecord.startCash.toFixed(2)}
              </div>
              <div className="text-blue-700">Startkasse</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                €{session.totalRevenue.toFixed(2)}
              </div>
              <div className="text-green-700">Gesamteinnahmen</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                €{totalExpenses.toFixed(2)}
              </div>
              <div className="text-red-700">Ausgaben</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">
                €{staffCosts.toFixed(2)}
              </div>
              <div className="text-yellow-700">Mitarbeiterlöhne</div>
            </div>
          </div>
        </div>

        {/* Payment Split */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Calculator className="h-6 w-6 mr-2" />
            Einnahmen aufteilen (Bar / Karte)
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Banknote className="h-4 w-4 inline mr-1" />
                Bargeld-Einnahmen (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={cashRevenue}
                onChange={(e) => {
                  setCashRevenue(e.target.value);
                  const remaining = session.totalRevenue - (parseFloat(e.target.value) || 0);
                  setCardRevenue(Math.max(0, remaining).toFixed(2));
                }}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <CreditCard className="h-4 w-4 inline mr-1" />
                Karten-Einnahmen (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={cardRevenue}
                onChange={(e) => {
                  setCardRevenue(e.target.value);
                  const remaining = session.totalRevenue - (parseFloat(e.target.value) || 0);
                  setCashRevenue(Math.max(0, remaining).toFixed(2));
                }}
                className="input-field"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span>Gesamteinnahmen:</span>
              <span className="font-bold">€{session.totalRevenue.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Bar + Karte:</span>
              <span className={`font-bold ${
                Math.abs((cashRevenueNum + cardRevenueNum) - session.totalRevenue) < 0.01 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                €{(cashRevenueNum + cardRevenueNum).toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Cash Count */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <DollarSign className="h-6 w-6 mr-2" />
            Bargeld zählen
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tatsächlich gezähltes Bargeld (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={actualCashCount}
                onChange={(e) => setActualCashCount(e.target.value)}
                className="input-field"
                placeholder="0.00"
              />
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Startkasse:</span>
                  <span>€{dayRecord.startCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>+ Bargeld-Einnahmen:</span>
                  <span>€{cashRevenueNum.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>- Ausgaben:</span>
                  <span>€{totalExpenses.toFixed(2)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>Erwartetes Bargeld:</span>
                  <span>€{expectedCash.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Differenz:</span>
                  <span className={cashDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {cashDifference >= 0 ? '+' : ''}€{cashDifference.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Summary */}
        <div className="card mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Zusammenfassung</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="space-y-3">
              <div className="flex justify-between text-lg">
                <span>Gesamteinnahmen:</span>
                <span className="font-bold text-green-600">€{session.totalRevenue.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Ausgaben:</span>
                <span className="text-red-600">€{totalExpenses.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>- Mitarbeiterlöhne:</span>
                <span className="text-red-600">€{staffCosts.toFixed(2)}</span>
              </div>
              <hr className="my-3" />
              <div className="flex justify-between text-xl font-bold">
                <span>Nettogewinn:</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                  €{netProfit.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Close Session Button */}
        <div className="text-center">
          <button
            onClick={handleCloseSession}
            disabled={isClosing || Math.abs((cashRevenueNum + cardRevenueNum) - session.totalRevenue) > 0.01 || !actualCashCount}
            className="btn-success px-8 py-4 text-lg flex items-center mx-auto disabled:opacity-50"
          >
            {isClosing ? (
              'Session wird geschlossen...'
            ) : (
              <>
                <CheckCircle className="h-6 w-6 mr-2" />
                Session beenden
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionClosing;
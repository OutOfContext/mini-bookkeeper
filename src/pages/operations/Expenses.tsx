import React, { useState, useEffect } from 'react';
import { Plus, Receipt, X, RotateCcw, Settings } from 'lucide-react';
import Header from '../../components/Layout/Header';
import SummaryCard from '../../components/UI/SummaryCard';
import { db, getActiveSession } from '../../services/database';
import { Expense, QuickExpense, Session } from '../../types';

const Expenses: React.FC = () => {
  const [quickExpenses, setQuickExpenses] = useState<QuickExpense[]>([]);
  const [activeSession, setActiveSession] = useState<Session | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [customDescription, setCustomDescription] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [todayExpenses, setTodayExpenses] = useState(0);
  const [sessionExpenses, setSessionExpenses] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const categories = [
    'Food & Ingredients',
    'Supplies',
    'Utilities',
    'Maintenance',
    'Marketing',
    'Transportation',
    'Other'
  ];

  useEffect(() => {
    loadQuickExpenses();
    loadActiveSession();
    loadTodayExpenses();
  }, []);

  const loadQuickExpenses = async () => {
    try {
      const expenses = await db.quickExpenses
        .filter(expense => expense.isActive === true)
        .toArray();
      setQuickExpenses(expenses);
    } catch (error) {
      console.error('Error loading quick expenses:', error);
    }
  };

  const loadActiveSession = async () => {
    try {
      const session = await getActiveSession();
      setActiveSession(session);
      if (session) {
        loadSessionExpenses(session.id);
      }
    } catch (error) {
      console.error('Error loading active session:', error);
    }
  };

  const loadSessionExpenses = async (sessionId: string) => {
    try {
      const expenses = await db.expenses
        .where('sessionId')
        .equals(sessionId)
        .toArray();
      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setSessionExpenses(total);
    } catch (error) {
      console.error('Error loading session expenses:', error);
    }
  };

  const loadTodayExpenses = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const expenses = await db.expenses
        .where('timestamp')
        .between(today, tomorrow)
        .toArray();

      const total = expenses.reduce((sum, expense) => sum + expense.amount, 0);
      setTodayExpenses(total);
    } catch (error) {
      console.error('Error loading today expenses:', error);
    }
  };

  const handleQuickExpense = async (quickExpense: QuickExpense) => {
    if (!activeSession) {
      alert('Keine aktive Session! Bitte erstellen Sie zuerst eine Session.');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const expense: Expense = {
        id: Date.now().toString(),
        sessionId: activeSession.id,
        description: quickExpense.name,
        amount: quickExpense.defaultAmount,
        category: quickExpense.category,
        timestamp: new Date()
      };

      await db.expenses.add(expense);
      
      // Update session totals
      const sessionExpenses = await db.expenses
        .where('sessionId')
        .equals(activeSession.id)
        .toArray();
      const totalExpenses = sessionExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      await db.sessions.update(activeSession.id, {
        totalExpenses: totalExpenses
      });

      await loadTodayExpenses();
      await loadSessionExpenses(activeSession.id);
      
      setMessage(`✅ ${quickExpense.name} - €${quickExpense.defaultAmount.toFixed(2)} hinzugefügt`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding quick expense:', error);
      setMessage('❌ Fehler beim Hinzufügen der Ausgabe');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCustomExpense = async () => {
    if (!activeSession) {
      alert('Keine aktive Session! Bitte erstellen Sie zuerst eine Session.');
      return;
    }

    if (!customDescription.trim() || !customAmount || !customCategory) {
      alert('Bitte füllen Sie alle Felder aus');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const expense: Expense = {
        id: Date.now().toString(),
        sessionId: activeSession.id,
        description: customDescription.trim(),
        amount: parseFloat(customAmount),
        category: customCategory,
        timestamp: new Date()
      };

      await db.expenses.add(expense);
      
      // Update session totals
      const sessionExpenses = await db.expenses
        .where('sessionId')
        .equals(activeSession.id)
        .toArray();
      const totalExpenses = sessionExpenses.reduce((sum, exp) => sum + exp.amount, 0);
      
      await db.sessions.update(activeSession.id, {
        totalExpenses: totalExpenses
      });

      await loadTodayExpenses();
      await loadSessionExpenses(activeSession.id);
      
      setCustomDescription('');
      setCustomAmount('');
      setCustomCategory('');
      setShowCustomModal(false);
      
      setMessage(`✅ ${expense.description} - €${expense.amount.toFixed(2)} hinzugefügt`);
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error adding custom expense:', error);
      setMessage('❌ Fehler beim Hinzufügen der Ausgabe');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetTodayExpenses = async () => {
    if (!window.confirm('Alle heutigen Ausgaben löschen? Dies kann nicht rückgängig gemacht werden!')) {
      return;
    }

    setIsProcessing(true);
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      await db.expenses
        .where('timestamp')
        .between(today, tomorrow)
        .delete();

      await loadTodayExpenses();
      if (activeSession) {
        await loadSessionExpenses(activeSession.id);
      }
      
      setMessage('✅ Alle heutigen Ausgaben wurden gelöscht');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error resetting expenses:', error);
      setMessage('❌ Fehler beim Löschen der Ausgaben');
    } finally {
      setIsProcessing(false);
    }
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500 hover:bg-blue-600',
      green: 'bg-green-500 hover:bg-green-600',
      red: 'bg-red-500 hover:bg-red-600',
      yellow: 'bg-yellow-500 hover:bg-yellow-600',
      purple: 'bg-purple-500 hover:bg-purple-600',
      orange: 'bg-orange-500 hover:bg-orange-600',
      gray: 'bg-gray-500 hover:bg-gray-600'
    };
    return colorMap[color] || 'bg-blue-500 hover:bg-blue-600';
  };

  return (
    <div>
      <Header title="Ausgaben" />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Session Status */}
        {activeSession ? (
          <div className="card mb-6 bg-green-50 border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-900">
                  Aktive Session: {activeSession.sessionName}
                </h3>
                <p className="text-green-700">
                  Session-Ausgaben: €{sessionExpenses.toFixed(2)}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-600">
                  €{activeSession.totalExpenses.toFixed(2)}
                </div>
                <div className="text-green-700 text-sm">Gesamt-Ausgaben</div>
              </div>
            </div>
          </div>
        ) : (
          <div className="card mb-6 bg-yellow-50 border-yellow-200">
            <div className="text-center py-4">
              <p className="text-yellow-800 font-medium">
                ⚠️ Keine aktive Session - Bitte erstellen Sie zuerst eine Session
              </p>
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <SummaryCard
            title="Heutige Ausgaben"
            value={`€${todayExpenses.toFixed(2)}`}
            icon={Receipt}
            color="expense"
          />
          <SummaryCard
            title="Session Ausgaben"
            value={`€${sessionExpenses.toFixed(2)}`}
            icon={Receipt}
            color="expense"
          />
        </div>

        {/* Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('❌') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Quick Expenses */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">
              Quick-Expenses
            </h3>
            <a
              href="/setup/expenses"
              className="btn-secondary flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Verwalten
            </a>
          </div>

          {quickExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Receipt className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg mb-2">Keine Quick-Expenses konfiguriert</p>
              <p>Gehen Sie zu Settings → Quick-Expenses verwalten</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {quickExpenses.map((quickExpense) => (
                <button
                  key={quickExpense.id}
                  onClick={() => handleQuickExpense(quickExpense)}
                  disabled={isProcessing || !activeSession}
                  className={`${getColorClass(quickExpense.color || 'blue')} text-white p-4 rounded-xl font-semibold shadow-md transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none`}
                >
                  <div className="text-center">
                    <div className="text-lg font-bold">
                      €{quickExpense.defaultAmount.toFixed(2)}
                    </div>
                    <div className="text-sm mt-1">
                      {quickExpense.name}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            onClick={() => setShowCustomModal(true)}
            disabled={isProcessing || !activeSession}
            className="btn-primary flex items-center justify-center py-4 text-lg disabled:opacity-50"
          >
            <Plus className="h-6 w-6 mr-3" />
            Benutzerdefinierte Ausgabe
          </button>

          <button
            onClick={resetTodayExpenses}
            disabled={isProcessing || todayExpenses === 0}
            className="btn-expense flex items-center justify-center py-4 text-lg disabled:opacity-50"
          >
            <RotateCcw className="h-6 w-6 mr-3" />
            Heutige Ausgaben löschen
          </button>
        </div>

        {/* Custom Expense Modal */}
        {showCustomModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  Benutzerdefinierte Ausgabe
                </h3>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Beschreibung
                  </label>
                  <input
                    type="text"
                    value={customDescription}
                    onChange={(e) => setCustomDescription(e.target.value)}
                    className="input-field w-full"
                    placeholder="z.B. Büromaterial"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Betrag (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    className="input-field w-full"
                    placeholder="0.00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Kategorie
                  </label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="input-field w-full"
                  >
                    <option value="">Kategorie wählen</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={handleCustomExpense}
                    disabled={isProcessing}
                    className="btn-success flex-1 py-3"
                  >
                    {isProcessing ? 'Verarbeitung...' : 'Hinzufügen'}
                  </button>
                  <button
                    onClick={() => setShowCustomModal(false)}
                    className="btn-secondary flex-1 py-3"
                  >
                    Abbrechen
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Expenses;
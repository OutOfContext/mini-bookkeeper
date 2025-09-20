import React, { useState, useEffect } from 'react';
import { DollarSign, Save } from 'lucide-react';
import Header from '../../components/Layout/Header';
import { db } from '../../services/database';

const InitialCash: React.FC = () => {
  const [startCash, setStartCash] = useState('200.00');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadCurrentBalance();
  }, []);

  const loadCurrentBalance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = await db.dayRecords.get(today);
      
      if (todayRecord) {
        setStartCash(todayRecord.startCash.toString());
      }
    } catch (error) {
      console.error('Error loading current balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const today = new Date().toISOString().split('T')[0];
      const newStartCash = parseFloat(startCash);
      
      // Update or create today's record
      const existingRecord = await db.dayRecords.get(today);
      
      if (existingRecord) {
        await db.dayRecords.update(today, {
          startCash: newStartCash,
          endCash: newStartCash + existingRecord.salesCash + existingRecord.salesCard - existingRecord.expenses
        });
      } else {
        await db.dayRecords.add({
          date: today,
          startCash: newStartCash,
          salesCash: 0,
          salesCard: 0,
          expenses: 0,
          endCash: newStartCash,
          dayStarted: false,
          dayClosed: false
        });
      }

      setMessage('Initial cash balance updated successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating cash balance:', error);
      setMessage('Error updating cash balance. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Initial Cash Setup" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Initial Cash Setup" />
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="card">
          <div className="text-center mb-8">
            <DollarSign className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Set Initial Cash Balance
            </h2>
            <p className="text-gray-600">
              Set the starting cash amount in your register for today's operations.
            </p>
          </div>

          {message && (
            <div className={`p-4 rounded-lg mb-6 ${
              message.includes('Error') 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="form-group">
              <label className="form-label text-lg">
                Starting Cash Balance (€)
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
                  value={startCash}
                  onChange={(e) => setStartCash(e.target.value)}
                  className="input-field pl-8 text-lg text-center"
                  placeholder="200.00"
                />
              </div>
              <p className="text-sm text-gray-500 mt-2">
                This is the amount of cash you have in your register at the start of the day.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">Important Notes:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• This sets your starting balance for today's operations</li>
                <li>• All cash sales will be added to this amount</li>
                <li>• Use Daily Closing to reconcile actual vs expected cash</li>
                <li>• You can update this anytime before starting sales</li>
              </ul>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn-primary w-full flex items-center justify-center text-lg py-6"
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-5 w-5 mr-2" />
                  Set Initial Cash Balance
                </>
              )}
            </button>
          </form>

          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">Current Status:</h3>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Starting Cash:</span>
              <span className="font-bold text-lg text-green-600">
                €{parseFloat(startCash).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InitialCash;
import React, { useState, useEffect } from 'react';
import { Database, Trash2, Calendar, BarChart, RefreshCw, RotateCcw } from 'lucide-react';
import Header from '../components/Layout/Header';
import { clearAllTestData } from '../services/testDataGenerator';
import { initializeSampleData, db } from '../services/database';

const TestDataManager: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [message, setMessage] = useState('');
  const [months, setMonths] = useState(3);
  const [dbStats, setDbStats] = useState({
    menuItems: 0,
    employees: 0,
    inventoryItems: 0,
    dayRecords: 0,
    sales: 0,
    shifts: 0,
    expenses: 0
  });

  const checkDatabaseStats = async () => {
    try {
      const stats = {
        menuItems: await db.menuItems.count(),
        employees: await db.employees.count(),
        inventoryItems: await db.inventoryItems.count(),
        dayRecords: await db.dayRecords.count(),
        sales: await db.sales.count(),
        shifts: await db.shifts.count(),
        expenses: await db.expenses.count()
      };
      setDbStats(stats);
    } catch (error) {
      console.error('Error checking database stats:', error);
    }
  };

  useEffect(() => {
    checkDatabaseStats();
  }, [message]); // Refresh stats when message changes (after operations)

  const resetMenuItemCounts = async () => {
    if (!window.confirm('Alle Verkaufszähler der Menu Items auf 0 zurücksetzen?')) {
      return;
    }

    try {
      const menuItems = await db.menuItems.toArray();
      for (const item of menuItems) {
        await db.menuItems.update(item.id, { soldCount: 0 });
      }
      
      await checkDatabaseStats();
      setMessage('✅ Alle Menu Item Verkaufszähler wurden zurückgesetzt');
    } catch (error) {
      console.error('Error resetting menu item counts:', error);
      setMessage('❌ Fehler beim Zurücksetzen der Verkaufszähler');
    }
  };

  const handleInitializeSampleData = async () => {
    setIsInitializing(true);
    setMessage('');
    
    try {
      await initializeSampleData();
      setMessage('✅ Sample data initialized successfully! You can now generate test data.');
    } catch (error) {
      console.error('Error initializing sample data:', error);
      setMessage('❌ Error initializing sample data. Check console for details.');
    } finally {
      setIsInitializing(false);
    }
  };

  const handleGenerateData = async () => {
    setMessage('❌ Multi-month data generation currently disabled. Use Sessions instead!');
  };

  const handleClearData = async () => {
    if (!window.confirm('This will delete ALL historical data (sales, expenses, shifts, day records). This cannot be undone. Are you sure?')) {
      return;
    }

    setIsClearing(true);
    setMessage('');
    
    try {
      await clearAllTestData();
      setMessage('✅ All test data cleared successfully!');
    } catch (error) {
      console.error('Error clearing test data:', error);
      setMessage('❌ Error clearing test data. Check console for details.');
    } finally {
      setIsClearing(false);
    }
  };

  return (
    <div>
      <Header title="Test Data Manager" />
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Test Data Generator
          </h2>
          <p className="text-gray-600">
            Generate realistic restaurant data for testing the system over multiple months.
            This includes daily sales, expenses, employee shifts, and inventory changes.
          </p>
        </div>

        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('❌') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Database Statistics */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Database Statistics</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{dbStats.menuItems}</div>
              <div className="text-sm text-gray-600">Menu Items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{dbStats.employees}</div>
              <div className="text-sm text-gray-600">Employees</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{dbStats.inventoryItems}</div>
              <div className="text-sm text-gray-600">Inventory</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{dbStats.dayRecords}</div>
              <div className="text-sm text-gray-600">Day Records</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{dbStats.sales}</div>
              <div className="text-sm text-gray-600">Sales</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-indigo-600">{dbStats.shifts}</div>
              <div className="text-sm text-gray-600">Shifts</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-pink-600">{dbStats.expenses}</div>
              <div className="text-sm text-gray-600">Expenses</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Initialize Sample Data */}
          <div className="card lg:col-span-2">
            <div className="text-center mb-6">
              <RefreshCw className="h-16 w-16 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Initialize Sample Data (Required First)
              </h3>
              <p className="text-gray-600">
                Set up basic menu items, employees, and inventory items needed for test data generation
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">This will create:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• 8 sample menu items (pizzas, pasta, salads, beverages)</li>
                  <li>• 4 employees with different roles and wages</li>
                  <li>• 6 inventory items with stock levels</li>
                  <li>• Today's day record initialized</li>
                </ul>
              </div>

              <button
                onClick={handleInitializeSampleData}
                disabled={isInitializing}
                className="btn-success w-full flex items-center justify-center py-4 text-lg"
              >
                {isInitializing ? (
                  'Initializing Sample Data...'
                ) : (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2" />
                    Initialize Sample Data
                  </>
                )}
              </button>
              
              <button
                onClick={resetMenuItemCounts}
                className="btn-secondary w-full flex items-center justify-center py-3 text-base mt-2"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Menu Item Zähler zurücksetzen
              </button>
            </div>
          </div>

          {/* Generate Test Data */}
          <div className="card">
            <div className="text-center mb-6">
              <Database className="h-16 w-16 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Generate Historical Data
              </h3>
              <p className="text-gray-600">
                Create months of realistic restaurant operation data
              </p>
            </div>

            <div className="space-y-4">
              <div className="form-group">
                <label className="form-label">Number of Months</label>
                <select
                  value={months}
                  onChange={(e) => setMonths(parseInt(e.target.value))}
                  className="input-field"
                  disabled={isGenerating}
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={12}>1 Year</option>
                </select>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 mb-2">What will be generated:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Daily sales with realistic variations</li>
                  <li>• Weekend vs weekday patterns</li>
                  <li>• Employee shifts and wage calculations</li>
                  <li>• Daily expenses (ingredients, supplies, utilities)</li>
                  <li>• Inventory consumption and deliveries</li>
                  <li>• Complete day records with closing data</li>
                </ul>
              </div>

              <button
                onClick={handleGenerateData}
                disabled={isGenerating}
                className="btn-primary w-full flex items-center justify-center py-4 text-lg"
              >
                {isGenerating ? (
                  'Generating Data...'
                ) : (
                  <>
                    <Calendar className="h-5 w-5 mr-2" />
                    Generate {months} Month{months !== 1 ? 's' : ''} of Data
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Clear Test Data */}
          <div className="card">
            <div className="text-center mb-6">
              <Trash2 className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Clear All Data
              </h3>
              <p className="text-gray-600">
                Remove all historical data to start fresh
              </p>
            </div>

            <div className="space-y-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="font-semibold text-red-900 mb-2">⚠️ Warning:</h4>
                <p className="text-sm text-red-800 mb-2">
                  This will permanently delete:
                </p>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• All day records and closings</li>
                  <li>• All sales history</li>
                  <li>• All expense records</li>
                  <li>• All employee shifts</li>
                  <li>• All inventory changes</li>
                </ul>
                <p className="text-sm text-red-800 mt-2 font-semibold">
                  Menu items, employees, and inventory items will be kept.
                </p>
              </div>

              <button
                onClick={handleClearData}
                disabled={isClearing}
                className="btn-expense w-full flex items-center justify-center py-4 text-lg"
              >
                {isClearing ? (
                  'Clearing Data...'
                ) : (
                  <>
                    <Trash2 className="h-5 w-5 mr-2" />
                    Clear All Historical Data
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Links after data generation */}
        <div className="mt-8 p-6 bg-gray-50 rounded-lg">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart className="h-5 w-5 mr-2" />
            After generating data, check:
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/reports/chef"
              className="block p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Chef Report</span>
              <p className="text-sm text-gray-600">View multi-month performance</p>
            </a>
            <a
              href="/setup/inventory"
              className="block p-3 bg-white rounded border hover:bg-gray-50 transition-colors"
            >
              <span className="font-medium">Inventory Status</span>
              <p className="text-sm text-gray-600">Check stock levels after consumption</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestDataManager;
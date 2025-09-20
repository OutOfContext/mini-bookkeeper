import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { initializeSampleData } from './services/database';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Main Dashboards
import SessionDashboard from './pages/SessionDashboard';
import ManagementDashboard from './pages/ManagementDashboard';
import SettingsDashboard from './pages/SettingsDashboard';
import SessionClosing from './pages/SessionClosing';
// Setup Pages
import MenuManagement from './pages/setup/MenuManagement';
import EmployeeManagement from './pages/setup/EmployeeManagement';
import InventoryManagement from './pages/setup/InventoryManagement';
import QuickExpenseManagement from './pages/setup/QuickExpenseManagement';
import UserManagement from './pages/setup/UserManagement';
import InitialCash from './pages/setup/InitialCash';
// Operations Pages
import Sales from './pages/operations/Sales';
import Expenses from './pages/operations/Expenses';
import EmployeeShifts from './pages/operations/EmployeeShifts';
import InventoryOperations from './pages/operations/InventoryOperations';
// Reports Pages
import ChefReport from './pages/reports/ChefReport';
import DailyClosing from './pages/reports/DailyClosing';
// Test Data
import TestDataManager from './pages/TestDataManager';

function App() {
  useEffect(() => {
    initializeSampleData();
  }, []);

  return (
    <AuthProvider>
      <Router>
        <ProtectedRoute>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              {/* Main Dashboards */}
              <Route path="/" element={<SessionDashboard />} />
              <Route path="/management" element={<ManagementDashboard />} />
              <Route path="/settings" element={<SettingsDashboard />} />
              <Route path="/session/close" element={<SessionClosing />} />
              
              {/* Setup Routes */}
              <Route path="/setup/menu" element={<MenuManagement />} />
              <Route path="/setup/employees" element={<EmployeeManagement />} />
              <Route path="/setup/inventory" element={<InventoryManagement />} />
              <Route path="/setup/expenses" element={<QuickExpenseManagement />} />
              <Route path="/setup/users" element={<UserManagement />} />
              <Route path="/setup/cash" element={<InitialCash />} />
              
              {/* Operations Routes */}
              <Route path="/operations/sales" element={<Sales />} />
              <Route path="/operations/expenses" element={<Expenses />} />
              <Route path="/operations/employees" element={<EmployeeShifts />} />
              <Route path="/operations/inventory" element={<InventoryOperations />} />
              
              {/* Reports Routes */}
              <Route path="/reports/chef" element={<ChefReport />} />
              <Route path="/reports/closing" element={<DailyClosing />} />
              
              {/* Test Data */}
              <Route path="/test-data" element={<TestDataManager />} />
            </Routes>
          </div>
        </ProtectedRoute>
      </Router>
    </AuthProvider>
  );
}

export default App;
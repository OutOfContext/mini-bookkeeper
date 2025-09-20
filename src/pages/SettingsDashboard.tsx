import React from 'react';
import { Settings, User, Users, UserCheck, Package, ShoppingCart, Receipt, DollarSign, LogOut, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const SettingsDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  
  const settingsTiles = [
    {
      title: 'Mitarbeiter-Management',
      description: 'Mitarbeiter verwalten',
      icon: User,
      href: '/setup/employees',
      color: 'employee'
    },
    {
      title: 'Menü-Management',
      description: 'Speisekarte bearbeiten',
      icon: ShoppingCart,
      href: '/setup/menu',
      color: 'menu'
    },
    {
      title: 'Lager-Management',
      description: 'Inventar verwalten',
      icon: Package,
      href: '/setup/inventory',
      color: 'inventory'
    },
    {
      title: 'Quick-Expenses verwalten',
      description: 'Vordefinierte Ausgaben',
      icon: Receipt,
      href: '/setup/expenses',
      color: 'expense'
    },
    {
      title: 'Benutzer-Management',
      description: 'User verwalten und Passwörter ändern',
      icon: UserCheck,
      href: '/setup/users',
      color: 'revenue'
    },
    {
      title: 'Startkasse festlegen',
      description: 'Anfangsbargeld einstellen',
      icon: DollarSign,
      href: '/setup/cash',
      color: 'menu'
    }
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      revenue: 'bg-revenue-600 hover:bg-revenue-700 text-white',
      expense: 'bg-expense-600 hover:bg-expense-700 text-white',
      employee: 'bg-employee-600 hover:bg-employee-700 text-white',
      inventory: 'bg-inventory-600 hover:bg-inventory-700 text-white',
      menu: 'bg-blue-600 hover:bg-blue-700 text-white'
    };
    return colors[color as keyof typeof colors] || 'bg-gray-600 hover:bg-gray-700 text-white';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <a href="/" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="h-6 w-6 text-gray-600" />
              </a>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
                <p className="text-gray-600 mt-2">System-Konfiguration und Verwaltung</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                Angemeldet als: <strong>{user?.username}</strong>
              </span>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        
        {/* Settings Tiles */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
          {settingsTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <a
                key={tile.title}
                href={tile.href}
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

      </div>
    </div>
  );
};

export default SettingsDashboard;
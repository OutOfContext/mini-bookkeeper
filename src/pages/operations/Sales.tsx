import React, { useState, useEffect } from 'react';
import { Receipt, RotateCcw } from 'lucide-react';
import Header from '../../components/Layout/Header';
import ButtonGrid from '../../components/UI/ButtonGrid';
import SummaryCard from '../../components/UI/SummaryCard';
import { useMenuItems } from '../../hooks/useDatabase';
import { MenuItem, Session } from '../../types';
import { db, getActiveSession } from '../../services/database';

const Sales: React.FC = () => {
  const { menuItems, loading, updateMenuItem } = useMenuItems();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');
  const [currentSession, setCurrentSession] = useState<Session | null>(null);

  useEffect(() => {
    loadSessionFromUrl();
  }, []);

  const loadSessionFromUrl = async () => {
    try {
      // Check for session parameter in URL
      const urlParams = new URLSearchParams(window.location.search);
      const sessionId = urlParams.get('session');
      
      if (sessionId) {
        const session = await db.sessions.get(sessionId);
        if (session) {
          setCurrentSession(session);
          return;
        }
      }
      
      // Fallback to active session
      const activeSession = await getActiveSession();
      setCurrentSession(activeSession);
    } catch (error) {
      console.error('Error loading session:', error);
    }
  };

  const handleItemClick = async (itemId: string) => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    setMessage('');
    
    try {
      const item = menuItems.find(m => m.id === itemId);
      if (!item) {
        setMessage('Menu item not found');
        return;
      }

      // Get or create session for sale
      let targetSession = currentSession;
      if (!targetSession) {
        // Fallback: try to get active session
        targetSession = await getActiveSession();
        if (!targetSession) {
          setMessage('❌ Keine Session verfügbar. Bitte erstellen Sie zuerst eine Session.');
          return;
        }
        setCurrentSession(targetSession);
      }

      // Create sale record (no payment type distinction during sale)
      const sale = {
        id: Date.now().toString(),
        sessionId: targetSession.id,
        menuItemId: item.id,
        amount: 1,
        paymentType: 'cash' as const, // Placeholder - will be determined at session closing
        timestamp: new Date(),
        price: item.price
      };

      await db.sales.add(sale);

      // Update session total revenue only
      const updatedRevenue = targetSession.totalRevenue + item.price;
      
      await db.sessions.update(targetSession.id, {
        totalRevenue: updatedRevenue
      });

      // Update current session state
      setCurrentSession({
        ...targetSession,
        totalRevenue: updatedRevenue
      });

      // Handle inventory reduction (existing logic)
      if (item.ingredients && item.ingredients.length > 0) {
        for (const ingredient of item.ingredients) {
          const inventoryItem = await db.inventoryItems.get(ingredient.inventoryItemId);
          if (!inventoryItem) continue;
          
          const newStock = inventoryItem.stock - ingredient.quantity;
          if (newStock < 0) {
            setMessage(`⚠️ Warning: ${inventoryItem.name} is out of stock!`);
            continue;
          }
          
          await db.inventoryItems.update(ingredient.inventoryItemId, { stock: newStock });
          
          // Record inventory change
          await db.inventoryChanges.add({
            id: Date.now().toString() + '_' + ingredient.inventoryItemId,
            inventoryItemId: ingredient.inventoryItemId,
            change: -ingredient.quantity,
            reason: 'sale',
            timestamp: new Date(),
            notes: `Sale: ${item.name}`
          });
        }
      }

      // Increment the sold count for this menu item
      await updateMenuItem(itemId, { soldCount: item.soldCount + 1 });
      
      setMessage(`✅ ${item.name} verkauft (+€${item.price.toFixed(2)}) - Session aktualisiert`);
      
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error recording sale:', error);
      setMessage('❌ Fehler beim Verkauf. Bitte versuchen Sie es erneut.');
    } finally {
      setIsProcessing(false);
    }
  };

  const resetSessionSales = async () => {
    if (!currentSession) {
      alert('Keine aktive Session gefunden!');
      return;
    }

    if (!window.confirm(`Alle Verkäufe der Session "${currentSession.sessionName}" zurücksetzen? Dies kann nicht rückgängig gemacht werden!`)) {
      return;
    }

    setIsProcessing(true);
    try {
      // Delete all sales for this session
      await db.sales.where('sessionId').equals(currentSession.id).delete();

      // Reset session revenue totals
      await db.sessions.update(currentSession.id, {
        totalRevenue: 0,
        cashSales: 0,
        cardSales: 0
      });

      // Reset menu item sold counts (optional - depends on business logic)
      // You might want to keep soldCount for overall daily tracking
      // const sessionSales = await db.sales.where('sessionId').equals(currentSession.id).toArray();
      // Reset sold counts here if needed

      setMessage(`✅ Alle Verkäufe der Session "${currentSession.sessionName}" wurden zurückgesetzt`);
      setTimeout(() => setMessage(''), 5000);

      // Refresh current session data
      const updatedSession = await db.sessions.get(currentSession.id);
      if (updatedSession) {
        setCurrentSession(updatedSession);
      }
    } catch (error) {
      console.error('Error resetting session sales:', error);
      setMessage('❌ Fehler beim Zurücksetzen der Verkäufe');
    } finally {
      setIsProcessing(false);
    }
  };

  // Group menu items by category
  const menuByCategory = menuItems.reduce((acc, item) => {
    const category = item.category || 'Other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categories = Object.keys(menuByCategory).sort();

  if (loading) {
    return (
      <div>
        <Header title="Sales" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading menu items...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Sales" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Session Status */}
        {currentSession ? (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-blue-900">
                  Session: {currentSession.sessionName}
                </h3>
                <p className="text-blue-700">
                  Session-Umsatz: €{currentSession.totalRevenue.toFixed(2)} • 
                  Verkäufe zur dieser Session hinzufügen
                </p>
              </div>
              <button
                onClick={resetSessionSales}
                disabled={isProcessing || currentSession.totalRevenue === 0}
                className="btn-expense flex items-center px-6 py-3 disabled:opacity-50"
              >
                <RotateCcw className="h-5 w-5 mr-2" />
                Session-Verkäufe zurücksetzen
              </button>
            </div>
          </div>
        ) : (
          <div className="card mb-6 bg-yellow-50 border-yellow-200">
            <div className="text-center py-4">
              <p className="text-yellow-800 font-medium">
                ⚠️ Keine aktive Session - Verkäufe werden zur ersten verfügbaren Session hinzugefügt
              </p>
            </div>
          </div>
        )}

        {/* Daily Stats - Items Sold Counter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <SummaryCard
            title="Items Sold Today"
            value={menuItems.reduce((total, item) => total + item.soldCount, 0)}
            color="revenue"
            icon={Receipt}
            subtitle="Total quantity sold"
          />
          <SummaryCard
            title="Unique Items Sold"
            value={menuItems.filter(item => item.soldCount > 0).length}
            color="employee"
            icon={Receipt}
            subtitle="Different menu items"
          />
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Simplified - no payment modal needed */}

        {/* Menu Items by Category */}
        <div className="space-y-8">
          {categories.map((category) => (
            <div key={category}>
              <h2 className="text-2xl font-bold text-gray-900 mb-4">{category}</h2>
              <ButtonGrid
                items={menuByCategory[category].map(item => ({
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  count: item.soldCount,
                  color: 'revenue'
                }))}
                onItemClick={handleItemClick}
                columns={3}
                showPrice={true}
                showCount={true}
              />
            </div>
          ))}
        </div>

        {menuItems.length === 0 && (
          <div className="text-center py-12">
            <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Menu Items</h3>
            <p className="text-gray-600 mb-6">
              You need to add menu items before you can start recording sales.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Go to Menu Management
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sales;
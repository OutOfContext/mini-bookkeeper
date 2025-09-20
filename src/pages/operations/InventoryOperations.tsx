import React, { useState } from 'react';
import { Plus, Minus, Package, AlertTriangle, X } from 'lucide-react';
import Header from '../../components/Layout/Header';
import { useInventoryItems } from '../../hooks/useDatabase';
import { db } from '../../services/database';
import { InventoryChange } from '../../types';

const InventoryOperations: React.FC = () => {
  const { inventoryItems, loading, refetch } = useInventoryItems();
  const [showModal, setShowModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string>('');
  const [operation, setOperation] = useState<'delivery' | 'consumption'>('delivery');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const getStockStatus = (stock: number, minStock: number) => {
    if (stock <= 0) {
      return { 
        status: 'empty', 
        color: 'bg-red-100 text-red-800 border-red-200', 
        icon: '🔴',
        text: 'Empty' 
      };
    } else if (stock <= minStock) {
      return { 
        status: 'low', 
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200', 
        icon: '🟡',
        text: 'Low Stock' 
      };
    } else {
      return { 
        status: 'ok', 
        color: 'bg-green-100 text-green-800 border-green-200', 
        icon: '🟢',
        text: 'In Stock' 
      };
    }
  };

  const openModal = (itemId: string, op: 'delivery' | 'consumption') => {
    setSelectedItem(itemId);
    setOperation(op);
    setAmount('');
    setNotes('');
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem('');
    setAmount('');
    setNotes('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem || !amount) return;

    setIsProcessing(true);
    try {
      const item = inventoryItems.find(i => i.id === selectedItem);
      if (!item) return;

      const changeAmount = parseFloat(amount);
      const finalAmount = operation === 'consumption' ? -changeAmount : changeAmount;
      const newStock = item.stock + finalAmount;

      if (newStock < 0) {
        setMessage('Error: Not enough stock for this consumption');
        return;
      }

      // Record the inventory change
      const inventoryChange: InventoryChange = {
        id: Date.now().toString(),
        inventoryItemId: selectedItem,
        change: finalAmount,
        reason: operation,
        timestamp: new Date(),
        notes: notes || undefined
      };

      await db.inventoryChanges.add(inventoryChange);

      // Update the inventory item stock
      await db.inventoryItems.update(selectedItem, { stock: newStock });

      setMessage(`${operation === 'delivery' ? 'Delivery' : 'Consumption'} recorded: ${item.name} ${operation === 'delivery' ? '+' : '-'}${changeAmount} ${item.unit}`);
      
      refetch();
      closeModal();
      
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error updating inventory:', error);
      setMessage('Error updating inventory. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Header title="Inventory Operations" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading inventory...</div>
        </div>
      </div>
    );
  }

  const lowStockItems = inventoryItems.filter(item => item.stock <= item.minStock);
  const emptyItems = inventoryItems.filter(item => item.stock <= 0);

  return (
    <div>
      <Header title="Inventory Operations" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Alerts */}
        {emptyItems.length > 0 && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-red-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-red-800">
                  Out of Stock Alert
                </h3>
                <p className="text-sm text-red-700 mt-1">
                  {emptyItems.length} item(s) are completely out of stock.
                </p>
              </div>
            </div>
          </div>
        )}

        {lowStockItems.length > 0 && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-yellow-400 mr-2" />
              <div>
                <h3 className="text-sm font-medium text-yellow-800">
                  Low Stock Alert
                </h3>
                <p className="text-sm text-yellow-700 mt-1">
                  {lowStockItems.length} item(s) are running low on stock.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Inventory Items */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryItems.map((item) => {
            const status = getStockStatus(item.stock, item.minStock);
            return (
              <div key={item.id} className={`card border-2 ${status.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.name}
                    </h3>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>Current: {item.stock} {item.unit}</p>
                      <p>Min Stock: {item.minStock} {item.unit}</p>
                    </div>
                  </div>
                  <div className="text-center">
                    <span className="text-2xl">{status.icon}</span>
                    <p className="text-xs font-medium mt-1">{status.text}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => openModal(item.id, 'delivery')}
                    disabled={isProcessing}
                    className="btn-inventory flex-1 flex items-center justify-center py-3"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Delivery
                  </button>
                  
                  <button
                    onClick={() => openModal(item.id, 'consumption')}
                    disabled={isProcessing || item.stock <= 0}
                    className={`flex-1 flex items-center justify-center py-3 rounded-lg font-semibold ${
                      item.stock <= 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-expense'
                    }`}
                  >
                    <Minus className="h-4 w-4 mr-2" />
                    Consume
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {inventoryItems.length === 0 && (
          <div className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Inventory Items</h3>
            <p className="text-gray-600 mb-6">
              You need to add inventory items before you can track stock.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Go to Inventory Management
            </button>
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {operation === 'delivery' ? 'Record Delivery' : 'Record Consumption'}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {selectedItem && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold">
                      {inventoryItems.find(i => i.id === selectedItem)?.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      Current Stock: {inventoryItems.find(i => i.id === selectedItem)?.stock} {inventoryItems.find(i => i.id === selectedItem)?.unit}
                    </p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">
                      Amount ({inventoryItems.find(i => i.id === selectedItem)?.unit}) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.01"
                      required
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Notes (Optional)</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="input-field resize-none"
                      rows={3}
                      placeholder="Additional notes..."
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      disabled={isProcessing}
                      className={operation === 'delivery' ? 'btn-inventory flex-1' : 'btn-expense flex-1'}
                    >
                      {isProcessing ? 'Recording...' : `Record ${operation === 'delivery' ? 'Delivery' : 'Consumption'}`}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryOperations;
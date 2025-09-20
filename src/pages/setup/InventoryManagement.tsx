import React, { useState } from 'react';
import { Plus, X, AlertTriangle } from 'lucide-react';
import Header from '../../components/Layout/Header';
import DataTable from '../../components/UI/DataTable';
import { useInventoryItems } from '../../hooks/useDatabase';
import { InventoryItem } from '../../types';

const InventoryManagement: React.FC = () => {
  const { inventoryItems, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventoryItems();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    unit: '',
    stock: '',
    minStock: '',
    purchasePrice: ''
  });

  const units = ['kg', 'L', 'piece', 'box', 'bottle', 'can', 'pack'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: formData.name,
        unit: formData.unit,
        stock: parseFloat(formData.stock),
        minStock: parseFloat(formData.minStock),
        purchasePrice: parseFloat(formData.purchasePrice)
      };

      if (editingItem) {
        await updateInventoryItem(editingItem.id, itemData);
      } else {
        await addInventoryItem(itemData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving inventory item:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', unit: '', stock: '', minStock: '', purchasePrice: '' });
    setEditingItem(null);
    setShowModal(false);
  };

  const handleEdit = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      unit: item.unit,
      stock: item.stock.toString(),
      minStock: item.minStock.toString(),
      purchasePrice: item.purchasePrice.toString()
    });
    setShowModal(true);
  };

  const handleDelete = async (item: InventoryItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await deleteInventoryItem(item.id);
    }
  };

  const getStockStatus = (item: InventoryItem) => {
    if (item.stock <= 0) {
      return { status: 'empty', color: 'bg-red-100 text-red-800', text: 'Empty' };
    } else if (item.stock <= item.minStock) {
      return { status: 'low', color: 'bg-yellow-100 text-yellow-800', text: 'Low Stock' };
    } else {
      return { status: 'ok', color: 'bg-green-100 text-green-800', text: 'In Stock' };
    }
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { 
      key: 'stock', 
      label: 'Current Stock',
      format: (value: number, item: InventoryItem) => item ? `${value} ${item.unit}` : `${value}`
    },
    { 
      key: 'minStock', 
      label: 'Min Stock',
      format: (value: number, item: InventoryItem) => item ? `${value} ${item.unit}` : `${value}`
    },
    { 
      key: 'purchasePrice', 
      label: 'Purchase Price', 
      format: (value: number) => `€${value.toFixed(2)}` 
    },
    { 
      key: 'status', 
      label: 'Status',
      format: (value: any, item: InventoryItem) => {
        if (!item) return 'Unknown';
        const status = getStockStatus(item);
        return (
          <div className="flex items-center">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
            {status.status !== 'ok' && (
              <AlertTriangle className="h-4 w-4 ml-2 text-yellow-500" />
            )}
          </div>
        );
      }
    }
  ];

  if (loading) {
    return (
      <div>
        <Header title="Inventory Management" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  const lowStockItems = inventoryItems.filter(item => item.stock <= item.minStock);

  return (
    <div>
      <Header title="Inventory Management" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
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

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Inventory Items</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Inventory Item
          </button>
        </div>

        <DataTable
          columns={columns}
          data={inventoryItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No inventory items yet. Add your first inventory item!"
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {editingItem ? 'Edit Inventory Item' : 'Add Inventory Item'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Tomatoes"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit *</label>
                    <select
                      required
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Unit</option>
                      {units.map((unit) => (
                        <option key={unit} value={unit}>
                          {unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Current Stock *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Minimum Stock *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Purchase Price (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.purchasePrice}
                      onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      {editingItem ? 'Update' : 'Add'} Item
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
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

export default InventoryManagement;
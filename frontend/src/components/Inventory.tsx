import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

interface InventoryItem {
  id: string
  name: string
  unit: string
  stock: number
  minStock: number
  purchasePrice: number
  status: 'ok' | 'low' | 'empty'
}

const Inventory: React.FC = () => {
  const navigate = useNavigate()
  const [items, setItems] = useState<InventoryItem[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newItem, setNewItem] = useState({
    name: '',
    unit: '',
    stock: '',
    minStock: '',
    purchasePrice: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchInventory()
  }, [])

  const fetchInventory = async () => {
    try {
      const response = await apiService.getInventoryItems()
      setItems(response.data)
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await apiService.createInventoryItem({
        name: newItem.name,
        unit: newItem.unit,
        stock: parseFloat(newItem.stock),
        minStock: parseFloat(newItem.minStock),
        purchasePrice: parseFloat(newItem.purchasePrice)
      })
      
      setNewItem({ name: '', unit: '', stock: '', minStock: '', purchasePrice: '' })
      setShowAddForm(false)
      fetchInventory()
    } catch (error) {
      console.error('Error adding inventory item:', error)
    }
  }

  const handleDelivery = async (itemId: string, amount: number) => {
    try {
      await apiService.addDelivery(itemId, amount, 'Delivery')
      fetchInventory()
    } catch (error) {
      console.error('Error adding delivery:', error)
    }
  }

  const handleConsumption = async (itemId: string, amount: number) => {
    try {
      await apiService.addConsumption(itemId, amount, 'Consumption')
      fetchInventory()
    } catch (error) {
      console.error('Error adding consumption:', error)
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return

    try {
      await apiService.deleteInventoryItem(id)
      fetchInventory()
    } catch (error) {
      console.error('Error deleting inventory item:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok': return 'bg-success-100 text-success-800'
      case 'low': return 'bg-warning-100 text-warning-800'
      case 'empty': return 'bg-danger-100 text-danger-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ok': return '✅'
      case 'low': return '⚠️'
      case 'empty': return '🔴'
      default: return '❓'
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading inventory...</div>
  }

  const okItems = items.filter(item => item.status === 'ok')
  const lowItems = items.filter(item => item.status === 'low')
  const emptyItems = items.filter(item => item.status === 'empty')

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/management')}
            className="btn-large btn-secondary"
          >
            ← Zurück zum Management
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Inventar</h1>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-large btn-primary"
        >
          + Add Item
        </button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-success-600">✅ OK Items</h3>
          <p className="text-2xl font-bold">{okItems.length}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-warning-600">⚠️ Low Stock</h3>
          <p className="text-2xl font-bold">{lowItems.length}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-danger-600">🔴 Empty</h3>
          <p className="text-2xl font-bold">{emptyItems.length}</p>
        </div>
      </div>

      {/* Add Item Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Inventory Item</h2>
          <form onSubmit={handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <input
                  type="text"
                  className="input-large w-full"
                  value={newItem.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  placeholder="Item name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Unit</label>
                <input
                  type="text"
                  className="input-large w-full"
                  value={newItem.unit}
                  onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                  placeholder="kg, pieces, liters..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Current Stock</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full"
                  value={newItem.stock}
                  onChange={(e) => setNewItem({ ...newItem, stock: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Stock</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full"
                  value={newItem.minStock}
                  onChange={(e) => setNewItem({ ...newItem, minStock: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Purchase Price (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full"
                  value={newItem.purchasePrice}
                  onChange={(e) => setNewItem({ ...newItem, purchasePrice: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                Add Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewItem({ name: '', unit: '', stock: '', minStock: '', purchasePrice: '' })
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Inventory Items */}
      <div className="space-y-6">
        {/* Warning Items First */}
        {(lowItems.length > 0 || emptyItems.length > 0) && (
          <div className="card">
            <h2 className="text-lg font-semibold text-danger-600 mb-4">⚠️ Items Needing Attention</h2>
            <div className="space-y-3">
              {[...emptyItems, ...lowItems].map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-danger-50 border border-danger-200 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-2xl">{getStatusIcon(item.status)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Stock: {item.stock} {item.unit} (Min: {item.minStock} {item.unit})
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        const amount = prompt(`Add delivery for ${item.name} (${item.unit}):`)
                        if (amount) handleDelivery(item.id, parseFloat(amount))
                      }}
                      className="btn-large btn-success text-sm px-3 py-2 min-h-[40px]"
                    >
                      + Delivery
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All Items */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">All Inventory Items</h2>
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <span className="text-xl">{getStatusIcon(item.status)}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600">
                        Stock: {item.stock} {item.unit} | Min: {item.minStock} {item.unit} | Price: €{item.purchasePrice.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(item.status)}`}>
                      {item.status.toUpperCase()}
                    </span>
                    <button
                      onClick={() => {
                        const amount = prompt(`Add delivery for ${item.name} (${item.unit}):`)
                        if (amount) handleDelivery(item.id, parseFloat(amount))
                      }}
                      className="btn-large btn-success text-sm px-3 py-2 min-h-[40px]"
                    >
                      + Delivery
                    </button>
                    <button
                      onClick={() => {
                        const amount = prompt(`Add consumption for ${item.name} (${item.unit}):`)
                        if (amount) handleConsumption(item.id, parseFloat(amount))
                      }}
                      className="btn-large btn-warning text-sm px-3 py-2 min-h-[40px]"
                    >
                      - Consumption
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="text-danger-600 hover:text-danger-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No inventory items added yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Inventory
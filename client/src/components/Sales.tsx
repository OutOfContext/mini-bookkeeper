import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface MenuCategory {
  id: string
  name: string
  menuItems: MenuItem[]
}

interface MenuItem {
  id: string
  name: string
  price: number
  soldCount: number
  category: { name: string }
}

interface SalesTotals {
  overall: number
  cash: number
  card: number
  itemCount: number
}

const Sales: React.FC = () => {
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [todayTotals, setTodayTotals] = useState<SalesTotals>({ overall: 0, cash: 0, card: 0, itemCount: 0 })
  const [selectedPaymentType, setSelectedPaymentType] = useState<'CASH' | 'CARD'>('CASH')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [categoriesRes, totalsRes] = await Promise.all([
        apiService.getMenuCategories(),
        apiService.getTodaySalesTotals()
      ])
      setCategories(categoriesRes.data)
      setTodayTotals(totalsRes.data)
    } catch (error) {
      console.error('Error fetching sales data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSale = async (menuItem: MenuItem) => {
    try {
      await apiService.createSale({
        menuItemId: menuItem.id,
        amount: 1,
        paymentType: selectedPaymentType
      })
      
      // Refresh totals
      const totalsRes = await apiService.getTodaySalesTotals()
      setTodayTotals(totalsRes.data)
    } catch (error) {
      console.error('Error recording sale:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading sales...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Sales</h1>
        <div className="text-sm text-gray-500">
          Tap items to sell
        </div>
      </div>

      {/* Payment Type Selector */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Payment Method</h2>
        <div className="flex space-x-4">
          <button
            onClick={() => setSelectedPaymentType('CASH')}
            className={`btn-large flex-1 ${
              selectedPaymentType === 'CASH' ? 'btn-success' : 'btn-secondary'
            }`}
          >
            💵 Cash
          </button>
          <button
            onClick={() => setSelectedPaymentType('CARD')}
            className={`btn-large flex-1 ${
              selectedPaymentType === 'CARD' ? 'btn-primary' : 'btn-secondary'
            }`}
          >
            💳 Card
          </button>
        </div>
      </div>

      {/* Today's Totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-700">Total Sales</h3>
          <p className="text-2xl font-bold text-success-600">€{todayTotals.overall.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-700">Cash</h3>
          <p className="text-xl font-bold text-gray-900">€{todayTotals.cash.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-700">Card</h3>
          <p className="text-xl font-bold text-gray-900">€{todayTotals.card.toFixed(2)}</p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-700">Items Sold</h3>
          <p className="text-xl font-bold text-gray-900">{todayTotals.itemCount}</p>
        </div>
      </div>

      {/* Menu Categories */}
      <div className="space-y-6">
        {categories.map((category) => (
          <div key={category.id} className="card">
            <h2 className="text-xl font-bold text-gray-900 mb-4">{category.name}</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {category.menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSale(item)}
                  className="btn-large btn-primary p-6 h-auto flex flex-col items-center justify-center min-h-[100px] hover:scale-105 transform transition-all"
                >
                  <div className="text-lg font-bold">{item.name}</div>
                  <div className="text-sm opacity-90">€{item.price.toFixed(2)}</div>
                  <div className="text-xs opacity-75 mt-1">Sold: {item.soldCount}</div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {categories.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500">No menu items available. Add categories and items in Menu Management.</p>
        </div>
      )}
    </div>
  )
}

export default Sales
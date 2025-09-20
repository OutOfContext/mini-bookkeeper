import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  const navigate = useNavigate()
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [todayTotals, setTodayTotals] = useState<SalesTotals>({ overall: 0, cash: 0, card: 0, itemCount: 0 })
  const [sessionSoldCounts, setSessionSoldCounts] = useState<{[itemId: string]: number}>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      // Get active session first
      const sessionRes = await apiService.getActiveSession()
      const activeSession = sessionRes.data
      
      const categoriesRes = await apiService.getMenuCategories()
      setCategories(categoriesRes.data)
      
      // Calculate session-specific data if there's an active session
      if (activeSession) {
        const sessionStartTime = new Date(activeSession.startTime)
        const sessionSalesRes = await apiService.getSalesByRange(
          sessionStartTime.toISOString(),
          new Date().toISOString()
        )
        
        // Calculate session-specific totals
        let sessionTotals = { overall: 0, cash: 0, card: 0, itemCount: 0 }
        const soldCounts: {[itemId: string]: number} = {}
        
        sessionSalesRes.data.forEach((sale: any) => {
          const saleAmount = sale.menuItem.price * sale.amount
          sessionTotals.overall += saleAmount
          sessionTotals.itemCount += sale.amount
          
          if (sale.paymentType === 'CASH') {
            sessionTotals.cash += saleAmount
          } else {
            sessionTotals.card += saleAmount
          }
          
          // Count sold items per menu item for this session
          const itemId = sale.menuItemId
          soldCounts[itemId] = (soldCounts[itemId] || 0) + sale.amount
        })
        
        setTodayTotals(sessionTotals)
        setSessionSoldCounts(soldCounts)
      } else {
        // No active session - reset to zeros
        setTodayTotals({ overall: 0, cash: 0, card: 0, itemCount: 0 })
        setSessionSoldCounts({})
      }
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
        paymentType: 'CASH' // Standard: Alle Verkäufe als Bar, da manuelles Counting beim Session Closing
      })
      
      // Refresh both totals and categories to update soldCount
      await fetchData()
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
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/management')}
            className="btn-large btn-secondary"
          >
            ← Zurück zum Management
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Verkauf</h1>
        </div>
        <div className="text-sm text-gray-500">
          Artikel antippen zum Verkaufen
        </div>
      </div>

      {/* Today's Totals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-700">Session-Umsatz</h3>
          <p className="text-3xl font-bold text-success-600">€{todayTotals.overall.toFixed(2)}</p>
          <p className="text-sm text-gray-500 mt-1">Alle Verkäufe</p>
        </div>
        <div className="card text-center">
          <h3 className="text-sm font-medium text-gray-700">Verkaufte Artikel</h3>
          <p className="text-3xl font-bold text-gray-900">{todayTotals.itemCount}</p>
          <p className="text-sm text-gray-500 mt-1">Anzahl Items</p>
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
                  <div className="text-xs opacity-75 mt-1">
                    Sold: {sessionSoldCounts[item.id] || 0}
                  </div>
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
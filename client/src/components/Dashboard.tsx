import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

interface SessionData {
  id: string
  startTime: string
  endTime: string | null
  isActive: boolean
  user: { username: string }
}

interface SalesTotals {
  overall: number
  cash: number
  card: number
  itemCount: number
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState<SessionData | null>(null)
  const [todaySales, setTodaySales] = useState<SalesTotals>({ overall: 0, cash: 0, card: 0, itemCount: 0 })
  const [todayExpenses, setTodayExpenses] = useState(0)
  const [loading, setLoading] = useState(true)

  const dashboardTiles = [
    {
      title: 'Sales',
      icon: '💰',
      path: '/sales',
      color: 'bg-success-500 hover:bg-success-600',
      description: 'Record sales & track payments'
    },
    {
      title: 'Expenses',
      icon: '💸',
      path: '/expenses',
      color: 'bg-danger-500 hover:bg-danger-600',
      description: 'Track daily expenses'
    },
    {
      title: 'Employees',
      icon: '👥',
      path: '/employees',
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'Check-in/out & shifts'
    },
    {
      title: 'Inventory',
      icon: '📦',
      path: '/inventory',
      color: 'bg-warning-500 hover:bg-warning-600',
      description: 'Stock levels & deliveries'
    },
    {
      title: 'Reports',
      icon: '📊',
      path: '/reports',
      color: 'bg-purple-500 hover:bg-purple-600',
      description: 'Daily closing & analytics'
    },
    {
      title: 'Daily Closing',
      icon: '📋',
      path: '/reports?tab=closing',
      color: 'bg-gray-600 hover:bg-gray-700',
      description: 'End of day summary'
    }
  ]

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const [sessionRes, salesRes, expensesRes] = await Promise.all([
        apiService.getActiveSession(),
        apiService.getTodaySalesTotals(),
        apiService.getTodayExpensesTotal()
      ])

      setActiveSession(sessionRes.data)
      setTodaySales(salesRes.data)
      setTodayExpenses(expensesRes.data.total)
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartSession = async () => {
    try {
      await apiService.startSession()
      fetchDashboardData()
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }

  const handleEndSession = async () => {
    if (activeSession) {
      try {
        await apiService.endSession(activeSession.id)
        fetchDashboardData()
      } catch (error) {
        console.error('Error ending session:', error)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Restaurant Dashboard
        </h1>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('de-DE', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* Session Status */}
      <div className="card">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Current Session</h2>
            {activeSession ? (
              <div className="text-sm text-gray-600">
                <p>Started: {new Date(activeSession.startTime).toLocaleTimeString('de-DE')}</p>
                <p>User: {activeSession.user.username}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-600">No active session</p>
            )}
          </div>
          <div>
            {activeSession ? (
              <button
                onClick={handleEndSession}
                className="btn-large btn-warning"
              >
                End Session
              </button>
            ) : (
              <button
                onClick={handleStartSession}
                className="btn-large btn-success"
              >
                Start Session
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Sales</h3>
          <div className="space-y-1">
            <p className="text-2xl font-bold text-success-600">€{todaySales.overall.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Cash: €{todaySales.cash.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Card: €{todaySales.card.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Items sold: {todaySales.itemCount}</p>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Expenses</h3>
          <p className="text-2xl font-bold text-danger-600">€{todayExpenses.toFixed(2)}</p>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Net Profit</h3>
          <p className={`text-2xl font-bold ${
            (todaySales.overall - todayExpenses) >= 0 ? 'text-success-600' : 'text-danger-600'
          }`}>
            €{(todaySales.overall - todayExpenses).toFixed(2)}
          </p>
        </div>
      </div>

      {/* Navigation Tiles */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {dashboardTiles.map((tile) => (
          <button
            key={tile.path}
            onClick={() => navigate(tile.path)}
            className={`dashboard-tile text-white ${tile.color} min-h-[140px] transition-all duration-200 transform hover:scale-105`}
          >
            <div className="text-4xl mb-2">{tile.icon}</div>
            <h3 className="text-xl font-bold mb-1">{tile.title}</h3>
            <p className="text-sm opacity-90">{tile.description}</p>
          </button>
        ))}
      </div>
    </div>
  )
}

export default Dashboard
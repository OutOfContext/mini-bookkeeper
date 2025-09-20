import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiService } from '../services/api'

interface SalesTotals {
  overall: number
  cash: number
  card: number
  itemCount: number
}

interface SessionData {
  id: string
  name?: string
  startTime: string
  user: { username: string }
}

const ManagementDashboard: React.FC = () => {
  const navigate = useNavigate()
  const [activeSession, setActiveSession] = useState<SessionData | null>(null)
  const [todaySales, setTodaySales] = useState<SalesTotals>({ overall: 0, cash: 0, card: 0, itemCount: 0 })
  const [todayExpenses, setTodayExpenses] = useState(0)
  const [staffCosts, setStaffCosts] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [sessionRes, salesRes, expensesRes, shiftsRes] = await Promise.all([
        apiService.getActiveSession(),
        apiService.getTodaySalesTotals(),
        apiService.getTodayExpensesTotal(),
        apiService.getTodayShifts()
      ])

      const session = sessionRes.data
      setActiveSession(session)

      if (session) {
        // Nur Daten seit Session-Start holen
        const sessionStartTime = new Date(session.startTime)
        
        // Sales seit Session-Start
        const sessionSalesRes = await apiService.getSalesByRange(
          sessionStartTime.toISOString(),
          new Date().toISOString()
        )
        
        // Berechne Session-Sales-Totals
        let sessionSalesTotals = { overall: 0, cash: 0, card: 0, itemCount: 0 }
        sessionSalesRes.data.forEach((sale: any) => {
          const saleAmount = sale.menuItem.price * sale.amount
          sessionSalesTotals.overall += saleAmount
          sessionSalesTotals.itemCount += sale.amount
          
          if (sale.paymentType === 'CASH') {
            sessionSalesTotals.cash += saleAmount
          } else {
            sessionSalesTotals.card += saleAmount
          }
        })
        setTodaySales(sessionSalesTotals)

        // Expenses seit Session-Start
        const sessionExpensesRes = await apiService.getExpensesByRange(
          sessionStartTime.toISOString(),
          new Date().toISOString()
        )
        const sessionExpensesTotal = sessionExpensesRes.data.reduce((sum: number, expense: any) => sum + expense.amount, 0)
        setTodayExpenses(sessionExpensesTotal)
        
        // Staff costs seit Session-Start (nur Shifts die nach Session-Start begonnen haben)
        const sessionShifts = shiftsRes.data.filter((shift: any) => 
          new Date(shift.startTime) >= sessionStartTime
        )
        const sessionStaffCosts = sessionShifts.reduce((sum: number, shift: any) => sum + (shift.wage || 0), 0)
        setStaffCosts(sessionStaffCosts)
      } else {
        // Keine aktive Session - alle Werte auf 0 setzen
        setTodaySales({ overall: 0, cash: 0, card: 0, itemCount: 0 })
        setTodayExpenses(0)
        setStaffCosts(0)
      }
    } catch (error) {
      console.error('Error fetching management data:', error)
    } finally {
      setLoading(false)
    }
  }

  const profit = todaySales.overall - todayExpenses - staffCosts

  const managementButtons = [
    {
      title: 'Verkauf',
      icon: '💰',
      path: '/sales',
      color: 'bg-success-500 hover:bg-success-600',
      description: 'Verkäufe erfassen'
    },
    {
      title: 'Mitarbeiter-Zeiterfassung',
      icon: '👥',
      path: '/employees',
      color: 'bg-primary-500 hover:bg-primary-600',
      description: 'Ein- & Ausstempeln'
    },
    {
      title: 'Inventar',
      icon: '📦',
      path: '/inventory',
      color: 'bg-warning-500 hover:bg-warning-600',
      description: 'Lagerbestände verwalten'
    },
    {
      title: 'Ausgaben',
      icon: '💸',
      path: '/expenses',
      color: 'bg-danger-500 hover:bg-danger-600',
      description: 'Ausgaben erfassen'
    }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Management-Dashboard wird geladen...</div>
      </div>
    )
  }

  if (!activeSession) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Management-Dashboard</h1>
          <div className="card bg-warning-50 border-warning-200">
            <p className="text-warning-800 text-lg">Keine aktive Session!</p>
            <p className="text-warning-600 mt-2">Bitte starten Sie zuerst eine Session im Session-Dashboard.</p>
            <button
              onClick={() => navigate('/')}
              className="btn-large btn-primary mt-4"
            >
              Zurück zum Session-Dashboard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Active Session - Full Width */}
      <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
        <p className="text-primary-800 font-semibold text-lg">
          Aktive Session: {activeSession.name || 'Unbenannte Session'}
        </p>
        <p className="text-primary-600">
          Gestartet: {new Date(activeSession.startTime).toLocaleString('de-DE')}
        </p>
      </div>

      {/* Session Übersicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card text-center bg-success-50 border-success-200">
          <h3 className="text-lg font-semibold text-success-800 mb-2">💰 Session-Einnahmen</h3>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-success-600">€{todaySales.overall.toFixed(2)}</p>
            <p className="text-sm text-success-700">Bar: €{todaySales.cash.toFixed(2)}</p>
            <p className="text-sm text-success-700">Karte: €{todaySales.card.toFixed(2)}</p>
            <p className="text-sm text-success-700">{todaySales.itemCount} Artikel verkauft</p>
          </div>
        </div>

        <div className="card text-center bg-danger-50 border-danger-200">
          <h3 className="text-lg font-semibold text-danger-800 mb-2">💸 Session-Ausgaben</h3>
          <p className="text-3xl font-bold text-danger-600">€{todayExpenses.toFixed(2)}</p>
          <p className="text-sm text-danger-700 mt-2">Seit Session-Start</p>
        </div>

        <div className="card text-center bg-primary-50 border-primary-200">
          <h3 className="text-lg font-semibold text-primary-800 mb-2">👥 Session-Mitarbeiterlöhne</h3>
          <p className="text-3xl font-bold text-primary-600">€{staffCosts.toFixed(2)}</p>
          <p className="text-sm text-primary-700 mt-2">Seit Session-Start</p>
        </div>

        <div className={`card text-center ${profit >= 0 ? 'bg-success-50 border-success-200' : 'bg-danger-50 border-danger-200'}`}>
          <h3 className={`text-lg font-semibold mb-2 ${profit >= 0 ? 'text-success-800' : 'text-danger-800'}`}>
            📈 Session-Gewinn
          </h3>
          <p className={`text-3xl font-bold ${profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            €{profit.toFixed(2)}
          </p>
          <p className={`text-sm mt-2 ${profit >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
            {profit >= 0 ? 'Positiver Session-Gewinn' : 'Session-Verlust'}
          </p>
        </div>
      </div>

      {/* Management Buttons */}
      <div className="card">
        <div className="flex justify-start mb-6">
          <button
            onClick={() => navigate('/')}
            className="btn-large btn-secondary"
          >
            ← Zurück zum Session-Dashboard
          </button>
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
          Management-Funktionen
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {managementButtons.map((button) => (
            <button
              key={button.path}
              onClick={() => navigate(button.path)}
              className={`dashboard-tile text-white ${button.color} min-h-[140px] transition-all duration-200 transform hover:scale-105`}
            >
              <div className="text-5xl mb-3">{button.icon}</div>
              <h3 className="text-2xl font-bold mb-2">{button.title}</h3>
              <p className="text-lg opacity-90">{button.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ManagementDashboard
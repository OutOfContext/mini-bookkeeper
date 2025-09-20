import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { apiService } from '../services/api'

interface SessionClosingData {
  session: {
    id: string
    name: string
    startTime: string
  }
  startCash: number
  sales: { cash: number; card: number; total: number }
  expenses: number
  staffCosts: number
  grossProfit: number
}

const SessionClosing: React.FC = () => {
  const navigate = useNavigate()
  const { sessionId } = useParams()
  const [closingData, setClosingData] = useState<SessionClosingData | null>(null)
  const [startCash, setStartCash] = useState('')
  const [cashInput, setCashInput] = useState('')
  const [cardInput, setCardInput] = useState('')
  const [cashInRegister, setCashInRegister] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchClosingData()
  }, [sessionId])

  const fetchClosingData = async () => {
    try {
      // Get active session
      const sessionRes = await apiService.getActiveSession()
      const activeSession = sessionRes.data
      
      if (!activeSession) {
        alert('Keine aktive Session gefunden!')
        navigate('/')
        return
      }

      const sessionStartTime = new Date(activeSession.startTime)
      const now = new Date()
      
      // Get session-specific data
      const [salesRes, expensesRes, shiftsRes] = await Promise.all([
        apiService.getSalesByRange(sessionStartTime.toISOString(), now.toISOString()),
        apiService.getExpensesByRange(sessionStartTime.toISOString(), now.toISOString()),
        apiService.getTodayShifts()
      ])
      
      // Calculate session sales
      let sessionSales = { cash: 0, card: 0, total: 0 }
      salesRes.data.forEach((sale: any) => {
        const amount = sale.menuItem.price * sale.amount
        sessionSales.total += amount
        if (sale.paymentType === 'CASH') {
          sessionSales.cash += amount
        } else {
          sessionSales.card += amount
        }
      })
      
      // Calculate session expenses
      const sessionExpenses = expensesRes.data.reduce((sum: any, expense: any) => sum + expense.amount, 0)
      
      // Calculate session staff costs
      const sessionShifts = shiftsRes.data.filter((shift: any) => 
        new Date(shift.startTime) >= sessionStartTime
      )
      const sessionStaffCosts = sessionShifts.reduce((sum: any, shift: any) => sum + (shift.wage || 0), 0)
      
      // Get start cash from localStorage
      const savedStartingCash = localStorage.getItem('startingCash') || '100.00'
      setStartCash(savedStartingCash)
      
      const grossProfit = sessionSales.total - sessionExpenses - sessionStaffCosts
      
      setClosingData({
        session: activeSession,
        startCash: parseFloat(savedStartingCash),
        sales: sessionSales,
        expenses: sessionExpenses,
        staffCosts: sessionStaffCosts,
        grossProfit
      })
    } catch (error) {
      console.error('Error fetching closing data:', error)
      alert('Fehler beim Laden der Closing-Daten')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const calculateNetProfit = () => {
    if (!cashInput || !cardInput || !closingData) return 0
    const totalCounted = parseFloat(cashInput) + parseFloat(cardInput)
    return totalCounted - closingData.expenses - closingData.staffCosts
  }

  const handleCashInputChange = (value: string) => {
    setCashInput(value)
    if (value && closingData) {
      // Automatisch Karte berechnen: Gesamteinnahmen - Bargeld
      const cashAmount = parseFloat(value) || 0
      const calculatedCard = Math.max(0, closingData.sales.total - cashAmount)
      setCardInput(calculatedCard.toFixed(2))
    }
  }

  const handleCardInputChange = (value: string) => {
    setCardInput(value)
    if (value && closingData) {
      // Automatisch Bargeld berechnen: Gesamteinnahmen - Karte
      const cardAmount = parseFloat(value) || 0
      const calculatedCash = Math.max(0, closingData.sales.total - cardAmount)
      setCashInput(calculatedCash.toFixed(2))
    }
  }

  const getExpectedCashInRegister = () => {
    if (!closingData || !cashInput) return 0
    return closingData.startCash + parseFloat(cashInput)
  }

  const getCashDifference = () => {
    if (!cashInRegister) return 0
    return parseFloat(cashInRegister) - getExpectedCashInRegister()
  }

  const handleCompleteClosing = async () => {
    if (!closingData || !cashInput || !cardInput || !cashInRegister) {
      alert('Bitte füllen Sie alle Felder aus')
      return
    }

    // Validate that cash + card equals total sales
    const totalCounted = parseFloat(cashInput) + parseFloat(cardInput)
    if (Math.abs(totalCounted - closingData.sales.total) >= 0.01) {
      alert(`Fehler: Bargeld + Karte (€${totalCounted.toFixed(2)}) stimmt nicht mit den Gesamteinnahmen (€${closingData.sales.total.toFixed(2)}) überein!`)
      return
    }

    // Optional: Warn about cash register difference
    const cashDifference = getCashDifference()
    if (Math.abs(cashDifference) >= 0.01) {
      const confirmMsg = cashDifference > 0 
        ? `Es gibt einen Überschuss von €${cashDifference.toFixed(2)} in der Kasse. Trotzdem fortfahren?`
        : `Es fehlen €${Math.abs(cashDifference).toFixed(2)} in der Kasse. Trotzdem fortfahren?`
      
      if (!confirm(confirmMsg)) return
    }

    setSaving(true)
    try {
      // Save closing data
      await apiService.saveDailyClosing({
        date: new Date().toISOString().split('T')[0],
        startCash: closingData.startCash,
        actualCash: parseFloat(cashInRegister)
      })
      
      // NOW end the session - only after successful closing
      await apiService.endSession(closingData.session.id)
      
      alert('Session-Closing erfolgreich abgeschlossen! Session wurde beendet.')
      navigate('/')
    } catch (error) {
      console.error('Error completing session closing:', error)
      alert('Fehler beim Abschließen der Session')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Session-Closing wird geladen...</div>
      </div>
    )
  }

  if (!closingData) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600">Fehler beim Laden der Session-Daten</p>
        <button onClick={() => navigate('/')} className="btn-large btn-secondary mt-4">
          Zurück zum Dashboard
        </button>
      </div>
    )
  }

  const netProfit = calculateNetProfit()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/')}
            className="btn-large btn-secondary"
          >
            ← Zurück ohne Speichern
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Session-Abschluss</h1>
        </div>
        <div className="text-sm text-gray-500">
          Session: {closingData.session.name}
        </div>
      </div>

      {/* Anzeige-Bereich */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="font-semibold text-gray-800 mb-4">📊 Session-Übersicht</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div className="bg-blue-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Startkasse</div>
            <div className="font-bold text-xl">€{closingData.startCash.toFixed(2)}</div>
          </div>
          <div className="bg-green-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Einnahmen</div>
            <div className="font-bold text-xl">€{closingData.sales.total.toFixed(2)}</div>
          </div>
          <div className="bg-red-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Ausgaben</div>
            <div className="font-bold text-xl">€{closingData.expenses.toFixed(2)}</div>
          </div>
          <div className="bg-orange-100 p-4 rounded-lg">
            <div className="text-sm text-gray-600 mb-1">Löhne</div>
            <div className="font-bold text-xl">€{closingData.staffCosts.toFixed(2)}</div>
          </div>
          <div className={`p-4 rounded-lg ${closingData.grossProfit >= 0 ? 'bg-purple-100' : 'bg-red-200'}`}>
            <div className="text-sm text-gray-600 mb-1">Gewinn (brutto)</div>
            <div className={`font-bold text-xl ${closingData.grossProfit >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
              €{closingData.grossProfit.toFixed(2)}
            </div>
          </div>
        </div>
      </div>

      {/* Input-Felder */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="font-semibold text-blue-800 mb-4">💳 Geld eingeben</h3>
        
        <div className="space-y-4">
          <div className="bg-blue-100 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">💡 Einnahmen aufteilen</h4>
            <p className="text-sm text-blue-700 mb-3">
              Gesamteinnahmen: <strong>€{closingData.sales.total.toFixed(2)}</strong> - 
              Teilen Sie diese in Bargeld und Karte auf:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bargeld eingezählt (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full text-lg"
                  value={cashInput}
                  onChange={(e) => handleCashInputChange(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Karte eingezählt (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full text-lg"
                  value={cardInput}
                  onChange={(e) => handleCardInputChange(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>
            {(cashInput || cardInput) && (
              <div className="mt-3 text-sm">
                <div className="flex justify-between">
                  <span>Bargeld + Karte:</span>
                  <span className={`font-bold ${
                    Math.abs((parseFloat(cashInput || '0') + parseFloat(cardInput || '0')) - closingData.sales.total) < 0.01
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    €{(parseFloat(cashInput || '0') + parseFloat(cardInput || '0')).toFixed(2)}
                  </span>
                </div>
                {Math.abs((parseFloat(cashInput || '0') + parseFloat(cardInput || '0')) - closingData.sales.total) >= 0.01 && (
                  <p className="text-red-600 text-xs mt-1">
                    ⚠️ Summe stimmt nicht mit Gesamteinnahmen überein!
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">💰 Kassenkontrolle</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Startkasse:</span>
                <span>€{closingData.startCash.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>+ Bargeld-Einnahmen:</span>
                <span>€{parseFloat(cashInput || '0').toFixed(2)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Erwarteter Kassenstand:</span>
                <span>€{getExpectedCashInRegister().toFixed(2)}</span>
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tatsächliches Geld in Kasse (€) *
              </label>
              <input
                type="number"
                step="0.01"
                className="input-large w-full text-lg"
                value={cashInRegister}
                onChange={(e) => setCashInRegister(e.target.value)}
                placeholder="0.00"
                required
              />
              {cashInRegister && (
                <div className="mt-2 text-sm">
                  <div className="flex justify-between">
                    <span>Differenz:</span>
                    <span className={`font-bold ${
                      getCashDifference() === 0 
                        ? 'text-green-600' 
                        : getCashDifference() > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                    }`}>
                      €{getCashDifference().toFixed(2)}
                      {getCashDifference() === 0 && ' ✅'}
                      {getCashDifference() > 0 && ' (Überschuss)'}
                      {getCashDifference() < 0 && ' (Fehlbetrag)'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Berechnung Netto Gewinn */}
      {(cashInput || cardInput) && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="font-semibold text-yellow-800 mb-4">🧮 Berechnung Netto Gewinn</h3>
          <div className="space-y-3">
            <div className="flex justify-between text-lg">
              <span>Eingezähltes Bargeld:</span>
              <span className="font-medium">€{parseFloat(cashInput || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Eingezählte Karte:</span>
              <span className="font-medium">€{parseFloat(cardInput || '0').toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg border-t pt-2">
              <span className="font-semibold">Gesamte Einnahmen (eingezählt):</span>
              <span className="font-bold">€{(parseFloat(cashInput || '0') + parseFloat(cardInput || '0')).toFixed(2)}</span>
            </div>
            <hr className="my-3" />
            <div className="flex justify-between text-lg">
              <span>Abzüglich Ausgaben:</span>
              <span className="font-medium text-red-600">-€{closingData.expenses.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>Abzüglich Löhne:</span>
              <span className="font-medium text-red-600">-€{closingData.staffCosts.toFixed(2)}</span>
            </div>
            <hr className="my-3 border-yellow-400" />
            <div className="flex justify-between text-2xl border-t-2 border-yellow-400 pt-3">
              <span className="font-bold">NETTO GEWINN:</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                €{netProfit.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Abschluss Button */}
      <div className="bg-white border-2 border-green-200 rounded-lg p-6">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            ⚠️ Achtung: Mit dem Abschluss wird die Session beendet und kann nicht mehr geändert werden!
          </p>
          <button
            onClick={handleCompleteClosing}
            disabled={
              saving || 
              !cashInput || 
              !cardInput || 
              !cashInRegister ||
              Math.abs((parseFloat(cashInput || '0') + parseFloat(cardInput || '0')) - closingData.sales.total) >= 0.01
            }
            className="btn-large btn-success px-8 py-4 text-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Session wird abgeschlossen...' : '✅ Session-Abschluss durchführen & Session beenden'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default SessionClosing
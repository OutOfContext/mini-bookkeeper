import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface DailyClosingData {
  date: string
  previousBalance: number
  sales: { cash: number; card: number; total: number }
  expenses: number
  staffCosts: number
  expectedCash: number
  actualCash: number | null
  difference: number | null
  isRecorded: boolean
}

interface DailyClosingModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: () => void
  sessionStartTime?: string
}

const DailyClosingModal: React.FC<DailyClosingModalProps> = ({ isOpen, onClose, onComplete, sessionStartTime }) => {
  const [closingData, setClosingData] = useState<DailyClosingData | null>(null)
  const [startCash, setStartCash] = useState('')
  const [cashInput, setCashInput] = useState('')
  const [cardInput, setCardInput] = useState('')
  const [cashInRegister, setCashInRegister] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen) {
      fetchClosingData()
    }
  }, [isOpen])

  const fetchClosingData = async () => {
    try {
      const response = await apiService.getDailyClosingReport()
      
      // Wenn Session-Startzeit verfügbar ist, nur Session-Daten verwenden
      if (sessionStartTime) {
        const sessionStart = new Date(sessionStartTime)
        const now = new Date()
        
        // Hole Session-spezifische Daten
        const [salesRes, expensesRes, shiftsRes] = await Promise.all([
          apiService.getSalesByRange(sessionStart.toISOString(), now.toISOString()),
          apiService.getExpensesByRange(sessionStart.toISOString(), now.toISOString()),
          apiService.getTodayShifts()
        ])
        
        // Berechne Session-Sales
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
        
        // Berechne Session-Expenses
        const sessionExpenses = expensesRes.data.reduce((sum: any, expense: any) => sum + expense.amount, 0)
        
        // Berechne Session-Staff-Costs
        const sessionShifts = shiftsRes.data.filter((shift: any) => 
          new Date(shift.startTime) >= sessionStart
        )
        const sessionStaffCosts = sessionShifts.reduce((sum: any, shift: any) => sum + (shift.wage || 0), 0)
        
        // Session-spezifische Closing-Daten erstellen
        const sessionClosingData = {
          ...response.data,
          sales: sessionSales,
          expenses: sessionExpenses,
          staffCosts: sessionStaffCosts,
          expectedCash: response.data.previousBalance + sessionSales.cash - sessionExpenses
        }
        
        setClosingData(sessionClosingData)
      } else {
        // Fallback auf normale Tagesdaten
        setClosingData(response.data)
      }
      
      // Startkasse aus localStorage holen
      const savedStartingCash = localStorage.getItem('startingCash') || '100.00'
      setStartCash(savedStartingCash)
      
      // Initialize inputs
      setCashInput('')
      setCardInput('')
      setCashInRegister('')
    } catch (error) {
      console.error('Error fetching closing data:', error)
    }
  }

  const handleSaveClosing = async () => {
    if (!closingData || !cashInput || !cardInput || !cashInRegister) {
      alert('Bitte füllen Sie alle Felder aus')
      return
    }

    setLoading(true)
    try {
      await apiService.saveDailyClosing({
        date: new Date().toISOString().split('T')[0],
        startCash: parseFloat(startCash) || 0,
        actualCash: parseFloat(cashInRegister)
      })
      
      alert('Session-Abschluss erfolgreich gespeichert!')
      onComplete()
    } catch (error) {
      console.error('Error saving session closing:', error)
      alert('Fehler beim Speichern des Session-Abschlusses')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !closingData) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          📋 Session-Abschluss
        </h2>
        
        <div className="space-y-6">
          {/* Anzeige-Bereich */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-800 mb-4">📊 Session-Übersicht</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
              <div className="bg-blue-100 p-3 rounded">
                <div className="text-sm text-gray-600">Startkasse</div>
                <div className="font-bold text-lg">€{parseFloat(startCash).toFixed(2)}</div>
              </div>
              <div className="bg-green-100 p-3 rounded">
                <div className="text-sm text-gray-600">Einnahmen</div>
                <div className="font-bold text-lg">€{closingData.sales.total.toFixed(2)}</div>
              </div>
              <div className="bg-red-100 p-3 rounded">
                <div className="text-sm text-gray-600">Ausgaben</div>
                <div className="font-bold text-lg">€{closingData.expenses.toFixed(2)}</div>
              </div>
              <div className="bg-orange-100 p-3 rounded">
                <div className="text-sm text-gray-600">Löhne</div>
                <div className="font-bold text-lg">€{closingData.staffCosts.toFixed(2)}</div>
              </div>
              <div className="bg-purple-100 p-3 rounded">
                <div className="text-sm text-gray-600">Gewinn</div>
                <div className="font-bold text-lg">€{(closingData.sales.total - closingData.expenses - closingData.staffCosts).toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Input-Bereich */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-4">💳 Geld-Eingabe</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bargeld eingezählt (€) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full"
                  value={cashInput}
                  onChange={(e) => setCashInput(e.target.value)}
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
                  className="input-large w-full"
                  value={cardInput}
                  onChange={(e) => setCardInput(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Geld in Kasse (€) *
              </label>
              <input
                type="number"
                step="0.01"
                className="input-large w-full"
                value={cashInRegister}
                onChange={(e) => setCashInRegister(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
          </div>

          {/* Berechnung Netto Gewinn */}
          {cashInput && cardInput && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-4">🧮 Berechnung Netto Gewinn</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Eingezähltes Bargeld:</span>
                  <span className="font-medium">€{parseFloat(cashInput || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Eingezählte Karte:</span>
                  <span className="font-medium">€{parseFloat(cardInput || '0').toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Gesamte Einnahmen (eingezählt):</span>
                  <span className="font-medium">€{(parseFloat(cashInput || '0') + parseFloat(cardInput || '0')).toFixed(2)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between">
                  <span>Ausgaben:</span>
                  <span className="font-medium">€{closingData.expenses.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Löhne:</span>
                  <span className="font-medium">€{closingData.staffCosts.toFixed(2)}</span>
                </div>
                <hr className="my-2 border-yellow-300" />
                <div className="flex justify-between text-lg">
                  <span className="font-bold">Netto Gewinn:</span>
                  <span className={`font-bold ${
                    (parseFloat(cashInput || '0') + parseFloat(cardInput || '0') - closingData.expenses - closingData.staffCosts) >= 0
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    €{(parseFloat(cashInput || '0') + parseFloat(cardInput || '0') - closingData.expenses - closingData.staffCosts).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={handleSaveClosing}
              disabled={loading || !cashInput || !cardInput || !cashInRegister}
              className="btn-large btn-success flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Abschluss wird gespeichert...' : '✅ Session beenden & Abschluss speichern'}
            </button>
            <button
              onClick={onClose}
              className="btn-large btn-secondary flex-1"
            >
              Abbrechen
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default DailyClosingModal
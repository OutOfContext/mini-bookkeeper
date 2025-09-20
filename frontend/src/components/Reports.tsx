import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface ChefReport {
  period: string
  dateRange: { start: string; end: string }
  revenue: { total: number; cash: number; card: number }
  costs: { expenses: number; staff: number; total: number }
  profit: number
  topSellingItems: Array<{ name: string; category: string; count: number; revenue: number }>
  inventoryWarnings: Array<{ name: string; currentStock: number; minStock: number; unit: string }>
}

const Reports: React.FC = () => {
  const [chefReport, setChefReport] = useState<ChefReport | null>(null)
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(true)
  const [hasCompletedSessions, setHasCompletedSessions] = useState(false)

  useEffect(() => {
    fetchChefReport()
  }, [reportPeriod, reportDate])

  const fetchChefReport = async () => {
    setLoading(true)
    try {
      // First, get completed sessions to check if any exist
      const sessionsResponse = await apiService.getTodaySessions()
      const completedSessions = sessionsResponse.data.filter((session: any) => !session.isActive)
      
      setHasCompletedSessions(completedSessions.length > 0)
      
      if (completedSessions.length === 0) {
        // No completed sessions - return empty report
        setChefReport({
          period: reportPeriod,
          dateRange: { start: reportDate, end: reportDate },
          revenue: { total: 0, cash: 0, card: 0 },
          costs: { expenses: 0, staff: 0, total: 0 },
          profit: 0,
          topSellingItems: [],
          inventoryWarnings: []
        })
      } else {
        // Only get report data if completed sessions exist
        const response = await apiService.getChefReport(reportPeriod, reportDate)
        setChefReport(response.data)
      }
    } catch (error) {
      console.error('Error fetching chef report:', error)
      // Set empty report on error
      setChefReport({
        period: reportPeriod,
        dateRange: { start: reportDate, end: reportDate },
        revenue: { total: 0, cash: 0, card: 0 },
        costs: { expenses: 0, staff: 0, total: 0 },
        profit: 0,
        topSellingItems: [],
        inventoryWarnings: []
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
      </div>

      {/* Date and Period Controls */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Datum</label>
            <input
              type="date"
              className="input-large"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Zeitraum</label>
            <select
              className="input-large"
              value={reportPeriod}
              onChange={(e) => setReportPeriod(e.target.value as 'day' | 'week' | 'month')}
            >
              <option value="day">Tag</option>
              <option value="week">Woche</option>
              <option value="month">Monat</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Report wird geladen...</div>
      ) : !hasCompletedSessions ? (
        <div className="card text-center py-12">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Keine abgeschlossenen Sessions</h3>
          <p className="text-gray-500 mb-4">
            Reports basieren nur auf abgeschlossenen Sessions. 
            Schließen Sie zuerst eine Session ab, um Report-Daten zu erhalten.
          </p>
          <div className="text-sm text-gray-400">
            <p>• Erstellen Sie eine neue Session</p>
            <p>• Führen Sie Verkäufe durch</p>
            <p>• Schließen Sie die Session über "Session beenden" ab</p>
            <p>• Dann werden hier die Report-Daten angezeigt</p>
          </div>
        </div>
      ) : chefReport ? (
        <div className="space-y-6">
          {/* Revenue Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-success-600">💰 Gesamtumsatz</h3>
              <p className="text-3xl font-bold text-success-600">€{chefReport.revenue.total.toFixed(2)}</p>
              <div className="text-sm text-gray-600 mt-2">
                <p>Bar: €{chefReport.revenue.cash.toFixed(2)}</p>
                <p>Karte: €{chefReport.revenue.card.toFixed(2)}</p>
              </div>
            </div>
            <div className="card text-center">
              <h3 className="text-lg font-semibold text-danger-600">💸 Gesamtkosten</h3>
              <p className="text-3xl font-bold text-danger-600">€{chefReport.costs.total.toFixed(2)}</p>
              <div className="text-sm text-gray-600 mt-2">
                <p>Ausgaben: €{chefReport.costs.expenses.toFixed(2)}</p>
                <p>Personal: €{chefReport.costs.staff.toFixed(2)}</p>
              </div>
            </div>
            <div className={`card text-center ${chefReport.profit >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
              <h3 className={`text-lg font-semibold ${chefReport.profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                📈 Gewinn/Verlust
              </h3>
              <p className={`text-3xl font-bold ${chefReport.profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                €{chefReport.profit.toFixed(2)}
              </p>
            </div>
          </div>

          {/* Top Selling Items */}
          {chefReport.topSellingItems.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🏆 Bestseller</h3>
              <div className="space-y-3">
                {chefReport.topSellingItems.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                    <div>
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm text-gray-500 ml-2">({item.category})</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">€{item.revenue.toFixed(2)}</div>
                      <div className="text-sm text-gray-500">{item.count}x verkauft</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Inventory Warnings */}
          {chefReport.inventoryWarnings.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-danger-600 mb-4">⚠️ Inventar-Warnungen</h3>
              <div className="space-y-3">
                {chefReport.inventoryWarnings.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-danger-50 border border-danger-200 rounded-lg">
                    <span className="font-medium">{item.name}</span>
                    <span className="text-sm">
                      {item.currentStock} {item.unit} (Min: {item.minStock} {item.unit})
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}

export default Reports
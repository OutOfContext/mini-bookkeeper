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

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chef' | 'closing'>('chef')
  const [chefReport, setChefReport] = useState<ChefReport | null>(null)
  const [closingData, setClosingData] = useState<DailyClosingData | null>(null)
  const [reportPeriod, setReportPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0])
  const [actualCash, setActualCash] = useState('')
  const [startCash, setStartCash] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeTab === 'chef') {
      fetchChefReport()
    } else {
      fetchClosingData()
    }
  }, [activeTab, reportPeriod, reportDate])

  const fetchChefReport = async () => {
    setLoading(true)
    try {
      const response = await apiService.getChefReport(reportPeriod, reportDate)
      setChefReport(response.data)
    } catch (error) {
      console.error('Error fetching chef report:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchClosingData = async () => {
    setLoading(true)
    try {
      const response = await apiService.getDailyClosingReport(reportDate)
      setClosingData(response.data)
      setActualCash(response.data.actualCash?.toString() || '')
      setStartCash(response.data.previousBalance?.toString() || '0')
    } catch (error) {
      console.error('Error fetching closing data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveClosing = async () => {
    if (!closingData || !actualCash) return

    try {
      await apiService.saveDailyClosing({
        date: reportDate,
        startCash: parseFloat(startCash) || 0,
        actualCash: parseFloat(actualCash)
      })
      fetchClosingData()
      alert('Daily closing saved successfully!')
    } catch (error) {
      console.error('Error saving daily closing:', error)
      alert('Error saving daily closing')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('chef')}
            className={`btn-large ${activeTab === 'chef' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📊 Chef Report
          </button>
          <button
            onClick={() => setActiveTab('closing')}
            className={`btn-large ${activeTab === 'closing' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📋 Daily Closing
          </button>
        </div>
      </div>

      {/* Date and Period Controls */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
            <input
              type="date"
              className="input-large"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
            />
          </div>
          {activeTab === 'chef' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Period</label>
              <select
                className="input-large"
                value={reportPeriod}
                onChange={(e) => setReportPeriod(e.target.value as 'day' | 'week' | 'month')}
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">Loading report...</div>
      ) : (
        <>
          {/* Chef Report */}
          {activeTab === 'chef' && chefReport && (
            <div className="space-y-6">
              {/* Revenue Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card text-center">
                  <h3 className="text-lg font-semibold text-success-600">💰 Total Revenue</h3>
                  <p className="text-3xl font-bold text-success-600">€{chefReport.revenue.total.toFixed(2)}</p>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Cash: €{chefReport.revenue.cash.toFixed(2)}</p>
                    <p>Card: €{chefReport.revenue.card.toFixed(2)}</p>
                  </div>
                </div>
                <div className="card text-center">
                  <h3 className="text-lg font-semibold text-danger-600">💸 Total Costs</h3>
                  <p className="text-3xl font-bold text-danger-600">€{chefReport.costs.total.toFixed(2)}</p>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Expenses: €{chefReport.costs.expenses.toFixed(2)}</p>
                    <p>Staff: €{chefReport.costs.staff.toFixed(2)}</p>
                  </div>
                </div>
                <div className="card text-center">
                  <h3 className="text-lg font-semibold text-primary-600">📈 Net Profit</h3>
                  <p className={`text-3xl font-bold ${chefReport.profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    €{chefReport.profit.toFixed(2)}
                  </p>
                  <div className="text-sm text-gray-600 mt-2">
                    <p>Margin: {chefReport.revenue.total > 0 ? ((chefReport.profit / chefReport.revenue.total) * 100).toFixed(1) : 0}%</p>
                  </div>
                </div>
              </div>

              {/* Top Selling Items */}
              <div className="card">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Selling Items</h2>
                {chefReport.topSellingItems.length > 0 ? (
                  <div className="space-y-3">
                    {chefReport.topSellingItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <span className="font-medium">{item.name}</span>
                          <span className="text-sm text-gray-600 ml-2">({item.category})</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-success-600">€{item.revenue.toFixed(2)}</div>
                          <div className="text-sm text-gray-600">{item.count} sold</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No sales data available</p>
                )}
              </div>

              {/* Inventory Warnings */}
              {chefReport.inventoryWarnings.length > 0 && (
                <div className="card">
                  <h2 className="text-lg font-semibold text-danger-600 mb-4">⚠️ Inventory Warnings</h2>
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
          )}

          {/* Daily Closing */}
          {activeTab === 'closing' && closingData && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Daily Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Previous Balance:</span>
                      <span className="font-medium">€{closingData.previousBalance.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales (Cash):</span>
                      <span className="font-medium text-success-600">€{closingData.sales.cash.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Sales (Card):</span>
                      <span className="font-medium text-primary-600">€{closingData.sales.card.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Sales:</span>
                      <span className="font-bold text-success-600">€{closingData.sales.total.toFixed(2)}</span>
                    </div>
                    <hr className="my-2" />
                    <div className="flex justify-between">
                      <span>Expenses:</span>
                      <span className="font-medium text-danger-600">€{closingData.expenses.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Staff Costs:</span>
                      <span className="font-medium text-danger-600">€{closingData.staffCosts.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="card">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">💰 Cash Reconciliation</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Start Cash (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-large w-full"
                        value={startCash}
                        onChange={(e) => setStartCash(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Actual Cash Counted (€)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="input-large w-full"
                        value={actualCash}
                        onChange={(e) => setActualCash(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex justify-between">
                        <span>Expected Cash:</span>
                        <span className="font-bold">€{closingData.expectedCash.toFixed(2)}</span>
                      </div>
                      {actualCash && (
                        <div className="flex justify-between">
                          <span>Difference:</span>
                          <span className={`font-bold ${
                            (parseFloat(actualCash) - closingData.expectedCash) >= 0 
                              ? 'text-success-600' 
                              : 'text-danger-600'
                          }`}>
                            €{(parseFloat(actualCash) - closingData.expectedCash).toFixed(2)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Button */}
              <div className="card text-center">
                {closingData.isRecorded ? (
                  <div>
                    <p className="text-success-600 font-medium mb-2">✅ Daily closing has been recorded</p>
                    <p className="text-sm text-gray-600">
                      Actual cash: €{closingData.actualCash?.toFixed(2)}
                      {closingData.difference !== null && (
                        <span className={`ml-2 ${closingData.difference >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                          (Difference: €{closingData.difference.toFixed(2)})
                        </span>
                      )}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveClosing}
                    disabled={!actualCash}
                    className="btn-large btn-success disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    💾 Save Daily Closing
                  </button>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Reports
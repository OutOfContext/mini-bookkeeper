import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface Expense {
  id: string
  amount: number
  reason: string
  timestamp: string
  user: { username: string }
}

interface PredefinedExpense {
  name: string
  amount: number
}

const Expenses: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [predefinedExpenses, setPredefinedExpenses] = useState<PredefinedExpense[]>([])
  const [todayTotal, setTodayTotal] = useState(0)
  const [showCustomForm, setShowCustomForm] = useState(false)
  const [customAmount, setCustomAmount] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchExpenses()
    fetchPredefinedExpenses()
  }, [])

  const fetchExpenses = async () => {
    try {
      const [expensesRes, totalRes] = await Promise.all([
        apiService.getTodayExpenses(),
        apiService.getTodayExpensesTotal()
      ])
      setExpenses(expensesRes.data)
      setTodayTotal(totalRes.data.total)
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPredefinedExpenses = async () => {
    try {
      const response = await apiService.getPredefinedExpenses()
      setPredefinedExpenses(response.data)
    } catch (error) {
      console.error('Error fetching predefined expenses:', error)
    }
  }

  const handlePredefinedExpense = async (predefined: PredefinedExpense) => {
    if (predefined.amount === 0) {
      setCustomReason(predefined.name)
      setShowCustomForm(true)
      return
    }

    try {
      await apiService.createExpense({
        amount: predefined.amount,
        reason: predefined.name
      })
      fetchExpenses()
    } catch (error) {
      console.error('Error creating expense:', error)
    }
  }

  const handleCustomExpense = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!customAmount || !customReason) return

    try {
      await apiService.createExpense({
        amount: parseFloat(customAmount),
        reason: customReason
      })
      
      setCustomAmount('')
      setCustomReason('')
      setShowCustomForm(false)
      fetchExpenses()
    } catch (error) {
      console.error('Error creating custom expense:', error)
    }
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('Are you sure you want to delete this expense?')) return

    try {
      await apiService.deleteExpense(id)
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading expenses...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Expenses</h1>
        <div className="text-lg font-semibold text-danger-600">
          Today's Total: €{todayTotal.toFixed(2)}
        </div>
      </div>

      {/* Predefined Expense Buttons */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Add Expenses</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {predefinedExpenses.map((predefined, index) => (
            <button
              key={index}
              onClick={() => handlePredefinedExpense(predefined)}
              className="btn-large btn-warning p-4 h-auto flex flex-col items-center justify-center min-h-[80px]"
            >
              <div className="font-bold">{predefined.name}</div>
              {predefined.amount > 0 && (
                <div className="text-sm opacity-90">€{predefined.amount.toFixed(2)}</div>
              )}
            </button>
          ))}
        </div>
        
        <button
          onClick={() => setShowCustomForm(true)}
          className="mt-4 btn-large btn-secondary w-full"
        >
          + Add Custom Expense
        </button>
      </div>

      {/* Custom Expense Form */}
      {showCustomForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add Custom Expense</h2>
          <form onSubmit={handleCustomExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Amount (€)</label>
              <input
                type="number"
                step="0.01"
                className="input-large w-full"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <input
                type="text"
                className="input-large w-full"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter expense reason"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                Save Expense
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCustomForm(false)
                  setCustomAmount('')
                  setCustomReason('')
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Today's Expenses List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Expenses</h2>
        {expenses.length > 0 ? (
          <div className="space-y-3">
            {expenses.map((expense) => (
              <div key={expense.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{expense.reason}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(expense.timestamp).toLocaleTimeString('de-DE')} by {expense.user.username}
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-lg font-bold text-danger-600">
                    €{expense.amount.toFixed(2)}
                  </span>
                  <button
                    onClick={() => handleDeleteExpense(expense.id)}
                    className="text-danger-600 hover:text-danger-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No expenses recorded today</p>
        )}
      </div>
    </div>
  )
}

export default Expenses
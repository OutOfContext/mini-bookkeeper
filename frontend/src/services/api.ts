import axios from 'axios'

const API_BASE_URL = '/api'

class ApiService {
  private api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
      'Content-Type': 'application/json',
    },
  })

  constructor() {
    // Response interceptor for handling token refresh
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const original = error.config
        
        if (error.response?.status === 401 && !original._retry) {
          original._retry = true
          
          try {
            const refreshToken = localStorage.getItem('refreshToken')
            if (refreshToken) {
              const response = await this.api.post('/auth/refresh', { refreshToken })
              const { accessToken } = response.data
              
              localStorage.setItem('accessToken', accessToken)
              this.setAuthToken(accessToken)
              
              return this.api(original)
            }
          } catch (refreshError) {
            // Refresh failed, logout user
            localStorage.clear()
            // Use window.location.reload() instead to trigger React Router properly
            window.location.reload()
          }
        }
        
        return Promise.reject(error)
      }
    )
  }

  setAuthToken(token: string | null) {
    if (token) {
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete this.api.defaults.headers.common['Authorization']
    }
  }

  // Auth endpoints
  login(username: string, password: string) {
    return this.api.post('/auth/login', { username, password })
  }

  refreshToken(refreshToken: string) {
    return this.api.post('/auth/refresh', { refreshToken })
  }

  // User endpoints
  getUsers() {
    return this.api.get('/users')
  }

  createUser(userData: { username: string; password: string }) {
    return this.api.post('/users', userData)
  }

  updateUserPassword(userId: string, password: string) {
    return this.api.put(`/users/${userId}/password`, { password })
  }

  deleteUser(userId: string) {
    return this.api.delete(`/users/${userId}`)
  }

  // Session endpoints
  getActiveSession() {
    return this.api.get('/sessions/active')
  }

  getTodaySessions() {
    return this.api.get('/sessions/today')
  }

  startSession(data?: { name?: string }) {
    return this.api.post('/sessions/start', data)
  }

  endSession(sessionId: string) {
    return this.api.put(`/sessions/${sessionId}/end`)
  }

  deleteSession(sessionId: string) {
    return this.api.delete(`/sessions/${sessionId}`)
  }

  // Menu endpoints
  getMenuCategories() {
    return this.api.get('/menu/categories')
  }

  createMenuCategory(name: string) {
    return this.api.post('/menu/categories', { name })
  }

  updateMenuCategory(id: string, name: string) {
    return this.api.put(`/menu/categories/${id}`, { name })
  }

  deleteMenuCategory(id: string) {
    return this.api.delete(`/menu/categories/${id}`)
  }

  getMenuItems() {
    return this.api.get('/menu/items')
  }

  createMenuItem(itemData: { name: string; price: number; categoryId: string }) {
    return this.api.post('/menu/items', itemData)
  }

  updateMenuItem(id: string, itemData: Partial<{ name: string; price: number; categoryId: string }>) {
    return this.api.put(`/menu/items/${id}`, itemData)
  }

  deleteMenuItem(id: string) {
    return this.api.delete(`/menu/items/${id}`)
  }

  // Sales endpoints
  getTodaySales() {
    return this.api.get('/sales/today')
  }

  getTodaySalesTotals() {
    return this.api.get('/sales/today/totals')
  }

  createSale(saleData: { menuItemId: string; amount?: number; paymentType: 'CASH' | 'CARD' }) {
    return this.api.post('/sales', saleData)
  }

  getSalesByRange(startDate: string, endDate: string) {
    return this.api.get(`/sales/range?startDate=${startDate}&endDate=${endDate}`)
  }

  // Employee endpoints
  getEmployees() {
    return this.api.get('/employees')
  }

  createEmployee(employeeData: { name: string; hourlyWage: number }) {
    return this.api.post('/employees', employeeData)
  }

  updateEmployee(id: string, employeeData: Partial<{ name: string; hourlyWage: number }>) {
    return this.api.put(`/employees/${id}`, employeeData)
  }

  deleteEmployee(id: string) {
    return this.api.delete(`/employees/${id}`)
  }

  checkInEmployee(id: string) {
    return this.api.post(`/employees/${id}/checkin`)
  }

  checkOutEmployee(id: string) {
    return this.api.post(`/employees/${id}/checkout`)
  }

  getTodayShifts() {
    return this.api.get('/employees/shifts/today')
  }

  getShiftsByRange(startDate: string, endDate: string) {
    return this.api.get(`/employees/shifts/range?startDate=${startDate}&endDate=${endDate}`)
  }

  // Inventory endpoints
  getInventoryItems() {
    return this.api.get('/inventory')
  }

  createInventoryItem(itemData: { name: string; unit: string; stock: number; minStock: number; purchasePrice: number }) {
    return this.api.post('/inventory', itemData)
  }

  updateInventoryItem(id: string, itemData: Partial<{ name: string; unit: string; stock: number; minStock: number; purchasePrice: number }>) {
    return this.api.put(`/inventory/${id}`, itemData)
  }

  deleteInventoryItem(id: string) {
    return this.api.delete(`/inventory/${id}`)
  }

  addDelivery(id: string, amount: number, reason?: string) {
    return this.api.post(`/inventory/${id}/delivery`, { amount, reason })
  }

  addConsumption(id: string, amount: number, reason?: string) {
    return this.api.post(`/inventory/${id}/consumption`, { amount, reason })
  }

  getInventoryChanges(id: string) {
    return this.api.get(`/inventory/${id}/changes`)
  }

  // Expense endpoints
  getTodayExpenses() {
    return this.api.get('/expenses/today')
  }

  getTodayExpensesTotal() {
    return this.api.get('/expenses/today/total')
  }

  createExpense(expenseData: { amount: number; reason: string }) {
    return this.api.post('/expenses', expenseData)
  }

  getExpensesByRange(startDate: string, endDate: string) {
    return this.api.get(`/expenses/range?startDate=${startDate}&endDate=${endDate}`)
  }

  deleteExpense(id: string) {
    return this.api.delete(`/expenses/${id}`)
  }

  getPredefinedExpenses() {
    return this.api.get('/expenses/predefined')
  }

  // Report endpoints
  getChefReport(period: 'day' | 'week' | 'month' = 'day', date?: string) {
    const params = new URLSearchParams({ period })
    if (date) params.append('date', date)
    return this.api.get(`/reports/chef?${params}`)
  }

  getDailyClosingReport(date?: string) {
    const params = date ? `?date=${date}` : ''
    return this.api.get(`/reports/daily-closing${params}`)
  }

  saveDailyClosing(data: { date: string; startCash: number; actualCash: number }) {
    return this.api.post('/reports/daily-closing', data)
  }
}

export const apiService = new ApiService()
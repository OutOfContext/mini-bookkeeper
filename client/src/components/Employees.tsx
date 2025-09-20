import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface Employee {
  id: string
  name: string
  hourlyWage: number
  shifts: Shift[]
}

interface Shift {
  id: string
  employeeId: string
  startTime: string
  endTime: string | null
  duration: number | null
  wage: number | null
  employee: { name: string }
}

const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [todayShifts, setTodayShifts] = useState<Shift[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [newEmployeeName, setNewEmployeeName] = useState('')
  const [newEmployeeWage, setNewEmployeeWage] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchEmployees()
    fetchTodayShifts()
  }, [])

  const fetchEmployees = async () => {
    try {
      const response = await apiService.getEmployees()
      setEmployees(response.data)
    } catch (error) {
      console.error('Error fetching employees:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTodayShifts = async () => {
    try {
      const response = await apiService.getTodayShifts()
      setTodayShifts(response.data)
    } catch (error) {
      console.error('Error fetching shifts:', error)
    }
  }

  const handleCheckIn = async (employeeId: string) => {
    try {
      await apiService.checkInEmployee(employeeId)
      fetchEmployees()
      fetchTodayShifts()
    } catch (error) {
      console.error('Error checking in employee:', error)
      alert('Error checking in employee. They may already be checked in.')
    }
  }

  const handleCheckOut = async (employeeId: string) => {
    try {
      await apiService.checkOutEmployee(employeeId)
      fetchEmployees()
      fetchTodayShifts()
    } catch (error) {
      console.error('Error checking out employee:', error)
      alert('Error checking out employee. They may not be checked in.')
    }
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newEmployeeName || !newEmployeeWage) return

    try {
      await apiService.createEmployee({
        name: newEmployeeName,
        hourlyWage: parseFloat(newEmployeeWage)
      })
      
      setNewEmployeeName('')
      setNewEmployeeWage('')
      setShowAddForm(false)
      fetchEmployees()
    } catch (error) {
      console.error('Error adding employee:', error)
    }
  }

  const handleDeleteEmployee = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete employee "${name}"?`)) return

    try {
      await apiService.deleteEmployee(id)
      fetchEmployees()
    } catch (error) {
      console.error('Error deleting employee:', error)
    }
  }

  const isEmployeeCheckedIn = (employee: Employee) => {
    return employee.shifts.length > 0
  }

  const getTotalHoursToday = () => {
    return todayShifts.reduce((total, shift) => total + (shift.duration || 0), 0)
  }

  const getTotalWagesToday = () => {
    return todayShifts.reduce((total, shift) => total + (shift.wage || 0), 0)
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading employees...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Employees</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-large btn-primary"
        >
          + Add Employee
        </button>
      </div>

      {/* Today's Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-900">Active Employees</h3>
          <p className="text-2xl font-bold text-primary-600">
            {employees.filter(emp => isEmployeeCheckedIn(emp)).length}
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-900">Total Hours Today</h3>
          <p className="text-2xl font-bold text-success-600">
            {getTotalHoursToday().toFixed(1)}h
          </p>
        </div>
        <div className="card text-center">
          <h3 className="text-lg font-semibold text-gray-900">Total Wages Today</h3>
          <p className="text-2xl font-bold text-warning-600">
            €{getTotalWagesToday().toFixed(2)}
          </p>
        </div>
      </div>

      {/* Add Employee Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Employee</h2>
          <form onSubmit={handleAddEmployee} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
              <input
                type="text"
                className="input-large w-full"
                value={newEmployeeName}
                onChange={(e) => setNewEmployeeName(e.target.value)}
                placeholder="Enter employee name"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Wage (€)</label>
              <input
                type="number"
                step="0.01"
                className="input-large w-full"
                value={newEmployeeWage}
                onChange={(e) => setNewEmployeeWage(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                Add Employee
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewEmployeeName('')
                  setNewEmployeeWage('')
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Employee Check-in/out */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Employee Check-in/out</h2>
        {employees.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {employees.map((employee) => {
              const isCheckedIn = isEmployeeCheckedIn(employee)
              return (
                <div key={employee.id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{employee.name}</h3>
                      <p className="text-sm text-gray-600">€{employee.hourlyWage.toFixed(2)}/hour</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        isCheckedIn 
                          ? 'bg-success-100 text-success-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {isCheckedIn ? 'Active' : 'Inactive'}
                      </span>
                      <button
                        onClick={() => handleDeleteEmployee(employee.id, employee.name)}
                        className="text-danger-600 hover:text-danger-800 text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    {isCheckedIn ? (
                      <button
                        onClick={() => handleCheckOut(employee.id)}
                        className="btn-large btn-warning flex-1"
                      >
                        Check Out
                      </button>
                    ) : (
                      <button
                        onClick={() => handleCheckIn(employee.id)}
                        className="btn-large btn-success flex-1"
                      >
                        Check In
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No employees added yet</p>
        )}
      </div>

      {/* Today's Shifts */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today's Shifts</h2>
        {todayShifts.length > 0 ? (
          <div className="space-y-3">
            {todayShifts.map((shift) => (
              <div key={shift.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <div className="font-medium">{shift.employee.name}</div>
                  <div className="text-sm text-gray-600">
                    {new Date(shift.startTime).toLocaleTimeString('de-DE')} - {
                      shift.endTime 
                        ? new Date(shift.endTime).toLocaleTimeString('de-DE')
                        : 'Active'
                    }
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {shift.duration ? `${shift.duration.toFixed(1)}h` : 'Active'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {shift.wage ? `€${shift.wage.toFixed(2)}` : '-'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No shifts recorded today</p>
        )}
      </div>
    </div>
  )
}

export default Employees
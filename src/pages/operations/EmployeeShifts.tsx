import React, { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, Users } from 'lucide-react';
import Header from '../../components/Layout/Header';
import ButtonGrid from '../../components/UI/ButtonGrid';
import SummaryCard from '../../components/UI/SummaryCard';
import DataTable from '../../components/UI/DataTable';
import { useEmployees } from '../../hooks/useDatabase';
import { db } from '../../services/database';
import { Employee, Shift } from '../../types';
import { format } from 'date-fns';

const EmployeeShifts: React.FC = () => {
  const { employees, loading } = useEmployees();
  const [activeShifts, setActiveShifts] = useState<Shift[]>([]);
  const [todayShifts, setTodayShifts] = useState<Shift[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadShifts();
  }, []);

  const loadShifts = async () => {
    try {
      // Load active shifts (not ended)
      const allShifts = await db.shifts.toArray();
      const active = allShifts.filter(shift => !shift.end);
      setActiveShifts(active);

      // Load today's shifts
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayShiftsData = await db.shifts
        .where('start')
        .between(today, tomorrow)
        .toArray();

      setTodayShifts(todayShiftsData);
    } catch (error) {
      console.error('Error loading shifts:', error);
    }
  };

  const handleCheckIn = async (employeeId: string) => {
    setIsProcessing(true);
    try {
      // Check if employee is already checked in
      const existingShift = activeShifts.find(shift => shift.employeeId === employeeId);
      if (existingShift) {
        setMessage('Employee is already checked in');
        return;
      }

      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      const shift: Shift = {
        id: Date.now().toString(),
        employeeId,
        start: new Date(),
        calculatedWage: 0
      };

      await db.shifts.add(shift);
      setMessage(`${employee.name} checked in successfully`);
      loadShifts();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error checking in employee:', error);
      setMessage('Error checking in employee. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCheckOut = async (employeeId: string) => {
    setIsProcessing(true);
    try {
      const activeShift = activeShifts.find(shift => shift.employeeId === employeeId);
      if (!activeShift) {
        setMessage('Employee is not checked in');
        return;
      }

      const employee = employees.find(e => e.id === employeeId);
      if (!employee) return;

      const endTime = new Date();
      const duration = (endTime.getTime() - activeShift.start.getTime()) / (1000 * 60 * 60); // hours
      const calculatedWage = duration * employee.hourlyWage;

      await db.shifts.update(activeShift.id, {
        end: endTime,
        duration,
        calculatedWage
      });

      setMessage(`${employee.name} checked out. Duration: ${duration.toFixed(2)}h, Wage: €${calculatedWage.toFixed(2)}`);
      loadShifts();

      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      console.error('Error checking out employee:', error);
      setMessage('Error checking out employee. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getEmployeeStatus = (employeeId: string) => {
    return activeShifts.some(shift => shift.employeeId === employeeId) ? 'active' : 'inactive';
  };

  const getTotalWagesForToday = () => {
    return todayShifts
      .filter(shift => shift.end) // Only completed shifts
      .reduce((total, shift) => total + shift.calculatedWage, 0);
  };

  const getShiftTableData = () => {
    return todayShifts.map(shift => {
      const employee = employees.find(e => e.id === shift.employeeId);
      return {
        ...shift,
        employeeName: employee?.name || 'Unknown',
        startTime: format(shift.start, 'HH:mm'),
        endTime: shift.end ? format(shift.end, 'HH:mm') : 'Active',
        duration: shift.duration ? shift.duration.toFixed(2) : '-',
        wage: shift.calculatedWage.toFixed(2),
        status: shift.end ? 'Completed' : 'Active'
      };
    });
  };

  const shiftColumns = [
    { key: 'employeeName', label: 'Employee' },
    { key: 'startTime', label: 'Start Time' },
    { key: 'endTime', label: 'End Time' },
    { key: 'duration', label: 'Hours' },
    { key: 'wage', label: 'Wage (€)' },
    { 
      key: 'status', 
      label: 'Status',
      format: (value: string) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value === 'Active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`}>
          {value}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div>
        <Header title="Employee Shifts" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading employees...</div>
        </div>
      </div>
    );
  }

  const activeEmployees = employees.filter(e => e.isActive);

  return (
    <div>
      <Header title="Employee Shifts" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <SummaryCard
            title="Active Employees"
            value={activeShifts.length}
            color="employee"
            icon={Users}
          />
          <SummaryCard
            title="Today's Shifts"
            value={todayShifts.length}
            color="employee"
            icon={Clock}
          />
          <SummaryCard
            title="Today's Wages"
            value={`€${getTotalWagesForToday().toFixed(2)}`}
            color="expense"
            icon={Clock}
          />
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('Error') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Employee Check-in/out Buttons */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Employee Check-in/out</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeEmployees.map((employee) => {
              const isActive = getEmployeeStatus(employee.id) === 'active';
              return (
                <div key={employee.id} className="card">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">{employee.name}</h3>
                    <p className="text-sm text-gray-600">{employee.role}</p>
                    <p className="text-sm text-gray-600">€{employee.hourlyWage}/hr</p>
                  </div>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleCheckIn(employee.id)}
                      disabled={isActive || isProcessing}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center ${
                        isActive 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'btn-employee'
                      }`}
                    >
                      <LogIn className="h-4 w-4 mr-2" />
                      Check In
                    </button>
                    
                    <button
                      onClick={() => handleCheckOut(employee.id)}
                      disabled={!isActive || isProcessing}
                      className={`flex-1 py-3 px-4 rounded-lg font-semibold flex items-center justify-center ${
                        !isActive 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'btn-expense'
                      }`}
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Check Out
                    </button>
                  </div>
                  
                  {isActive && (
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <div className="w-2 h-2 bg-green-400 rounded-full mr-1 animate-pulse"></div>
                        Currently Working
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Today's Shifts Table */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Today's Shifts</h2>
          <DataTable
            columns={shiftColumns}
            data={getShiftTableData()}
            actions={false}
            emptyMessage="No shifts recorded today"
          />
        </div>

        {activeEmployees.length === 0 && (
          <div className="text-center py-12">
            <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Active Employees</h3>
            <p className="text-gray-600 mb-6">
              You need to add employees before you can track shifts.
            </p>
            <button
              onClick={() => window.history.back()}
              className="btn-primary"
            >
              Go to Employee Management
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeShifts;
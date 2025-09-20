import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Header from '../../components/Layout/Header';
import DataTable from '../../components/UI/DataTable';
import { useEmployees } from '../../hooks/useDatabase';
import { Employee } from '../../types';

const EmployeeManagement: React.FC = () => {
  const { employees, loading, addEmployee, updateEmployee, deleteEmployee } = useEmployees();
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    hourlyWage: '',
    isActive: true
  });

  const roles = ['Chef', 'Cook', 'Waiter', 'Waitress', 'Manager', 'Cashier', 'Kitchen Assistant'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const employeeData = {
        name: formData.name,
        role: formData.role,
        hourlyWage: parseFloat(formData.hourlyWage),
        isActive: formData.isActive
      };

      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, employeeData);
      } else {
        await addEmployee(employeeData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', role: '', hourlyWage: '', isActive: true });
    setEditingEmployee(null);
    setShowModal(false);
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setFormData({
      name: employee.name,
      role: employee.role,
      hourlyWage: employee.hourlyWage.toString(),
      isActive: employee.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (employee: Employee) => {
    if (window.confirm(`Are you sure you want to delete "${employee.name}"?`)) {
      await deleteEmployee(employee.id);
    }
  };

  const toggleActiveStatus = async (employee: Employee) => {
    await updateEmployee(employee.id, { isActive: !employee.isActive });
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { 
      key: 'hourlyWage', 
      label: 'Hourly Wage', 
      format: (value: number) => `€${value.toFixed(2)}/hr` 
    },
    { 
      key: 'isActive', 
      label: 'Status',
      format: (value: boolean) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        }`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div>
        <Header title="Employee Management" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Employee Management" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Employee
          </button>
        </div>

        <DataTable
          columns={columns}
          data={employees}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No employees yet. Add your first employee!"
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {editingEmployee ? 'Edit Employee' : 'Add Employee'}
                  </h3>
                  <button
                    onClick={resetForm}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="form-group">
                    <label className="form-label">Name *</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="input-field"
                      placeholder="e.g., Mario Rossi"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Role *</label>
                    <select
                      required
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Role</option>
                      {roles.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Hourly Wage (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.hourlyWage}
                      onChange={(e) => setFormData({ ...formData, hourlyWage: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="form-group">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="mr-2"
                      />
                      <span className="form-label mb-0">Active Employee</span>
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      {editingEmployee ? 'Update' : 'Add'} Employee
                    </button>
                    <button
                      type="button"
                      onClick={resetForm}
                      className="btn-secondary flex-1"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmployeeManagement;
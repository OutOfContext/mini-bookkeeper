import React, { useState, useEffect } from 'react'
import { apiService } from '../services/api'

interface User {
  id: string
  username: string
  createdAt: string
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showPasswordForm, setShowPasswordForm] = useState<string | null>(null)
  const [newUser, setNewUser] = useState({ username: '', password: '' })
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      const response = await apiService.getUsers()
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (newUser.password.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      await apiService.createUser(newUser)
      setNewUser({ username: '', password: '' })
      setShowAddForm(false)
      fetchUsers()
      alert('User created successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating user')
    }
  }

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!showPasswordForm || newPassword.length < 6) {
      alert('Password must be at least 6 characters long')
      return
    }

    try {
      await apiService.updateUserPassword(showPasswordForm, newPassword)
      setNewPassword('')
      setShowPasswordForm(null)
      alert('Password updated successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating password')
    }
  }

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) return

    try {
      await apiService.deleteUser(id)
      fetchUsers()
      alert('User deleted successfully!')
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting user')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading users...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="btn-large btn-primary"
        >
          + Add User
        </button>
      </div>

      {/* Add User Form */}
      {showAddForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h2>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                className="input-large w-full"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                placeholder="Enter username"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                className="input-large w-full"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                placeholder="Enter password (min 6 characters)"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                Create User
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setNewUser({ username: '', password: '' })
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Update Password Form */}
      {showPasswordForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Update Password</h2>
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
              <input
                type="password"
                className="input-large w-full"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password (min 6 characters)"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                Update Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(null)
                  setNewPassword('')
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users List */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">All Users</h2>
        {users.length > 0 ? (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                <div>
                  <h3 className="font-semibold text-gray-900">{user.username}</h3>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(user.createdAt).toLocaleDateString('de-DE')}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowPasswordForm(user.id)}
                    className="btn-large btn-warning text-sm px-4 py-2 min-h-[40px]"
                  >
                    Change Password
                  </button>
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    className="btn-large btn-danger text-sm px-4 py-2 min-h-[40px]"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">No users found</p>
        )}
      </div>

      {/* Security Note */}
      <div className="card bg-warning-50 border border-warning-200">
        <h3 className="text-lg font-semibold text-warning-800 mb-2">⚠️ Security Note</h3>
        <p className="text-sm text-warning-700">
          All users have the same access level. There are no role-based permissions in this system.
          Make sure to only create accounts for trusted staff members.
        </p>
      </div>
    </div>
  )
}

export default UserManagement
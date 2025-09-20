import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft, User, Lock, Eye, EyeOff } from 'lucide-react';
import { User as UserType } from '../../types';
import { createUser, getAllUsers, changeUserPassword, deleteUser } from '../../services/database';
import { useAuth } from '../../contexts/AuthContext';

const UserManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const allUsers = await getAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      setMessage('❌ Fehler beim Laden der Benutzer');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!formData.username.trim() || !formData.password) {
      setMessage('❌ Benutzername und Passwort sind erforderlich');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('❌ Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    try {
      await createUser(formData.username, formData.password);
      await loadUsers();
      
      setFormData({ username: '', password: '', confirmPassword: '' });
      setShowAddForm(false);
      setMessage(`✅ Benutzer "${formData.username}" wurde erfolgreich erstellt`);
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error: any) {
      console.error('Error adding user:', error);
      setMessage(`❌ Fehler beim Erstellen des Benutzers: ${error.message || error}`);
    }
  };

  const handleChangePassword = async (userId: string) => {
    if (!formData.password || !formData.confirmPassword) {
      setMessage('❌ Beide Passwort-Felder sind erforderlich');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setMessage('❌ Passwörter stimmen nicht überein');
      return;
    }

    if (formData.password.length < 6) {
      setMessage('❌ Passwort muss mindestens 6 Zeichen haben');
      return;
    }

    try {
      await changeUserPassword(userId, formData.password);
      await loadUsers();
      
      setEditingId(null);
      setFormData({ username: '', password: '', confirmPassword: '' });
      setMessage('✅ Passwort wurde erfolgreich geändert');
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error changing password:', error);
      setMessage('❌ Fehler beim Ändern des Passworts');
    }
  };

  const handleDelete = async (userId: string, username: string) => {
    if (userId === currentUser?.id) {
      setMessage('❌ Sie können Ihren eigenen Account nicht löschen');
      return;
    }

    if (!window.confirm(`Benutzer "${username}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`)) {
      return;
    }

    try {
      await deleteUser(userId);
      await loadUsers();
      setMessage(`✅ Benutzer "${username}" wurde gelöscht`);
      
      setTimeout(() => setMessage(''), 5000);
    } catch (error) {
      console.error('Error deleting user:', error);
      setMessage('❌ Fehler beim Löschen des Benutzers');
    }
  };

  const startEdit = (user: UserType) => {
    setEditingId(user.id);
    setFormData({
      username: user.username,
      password: '',
      confirmPassword: ''
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ username: '', password: '', confirmPassword: '' });
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-xl">Lade Benutzer...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Custom Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center">
            <a href="/settings" className="mr-4 p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </a>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Benutzerverwaltung</h1>
              <p className="text-gray-600 mt-2">Benutzer erstellen, bearbeiten und löschen</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Benutzerverwaltung</h2>
              <p className="text-gray-600 mt-2">
                Verwalten Sie Benutzerkonten für den Zugriff auf das System
              </p>
            </div>
            <button
              onClick={() => {
                setShowAddForm(true);
                setEditingId(null);
              }}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Benutzer hinzufügen
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.includes('❌') 
              ? 'bg-red-50 text-red-700 border border-red-200' 
              : 'bg-green-50 text-green-700 border border-green-200'
          }`}>
            {message}
          </div>
        )}

        {/* Add Form */}
        {showAddForm && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Neuen Benutzer hinzufügen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Benutzername
                </label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="input-field"
                  placeholder="Benutzername"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-field pr-10"
                    placeholder="Passwort"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Passwort bestätigen
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="input-field"
                  placeholder="Passwort bestätigen"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  onClick={handleAdd}
                  className="btn-success flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Hinzufügen
                </button>
                <button
                  onClick={cancelEdit}
                  className="btn-secondary flex items-center"
                >
                  <X className="h-4 w-4 mr-2" />
                  Abbrechen
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Benutzer ({users.length})
          </h3>

          {users.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <User className="h-16 w-16 mx-auto mb-4 text-gray-400" />
              <p className="text-xl mb-2">Keine Benutzer gefunden</p>
              <p>Fügen Sie einen neuen Benutzer hinzu</p>
            </div>
          ) : (
            <div className="space-y-4">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`border rounded-lg p-4 transition-all ${
                    user.isActive 
                      ? 'border-gray-200 bg-white' 
                      : 'border-gray-100 bg-gray-50 opacity-75'
                  } ${user.id === currentUser?.id ? 'border-blue-300 bg-blue-50' : ''}`}
                >
                  {editingId === user.id ? (
                    /* Password Change Form */
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-gray-900 flex items-center">
                          <Lock className="h-4 w-4 mr-2" />
                          Passwort ändern für: {user.username}
                        </h4>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Neues Passwort
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            className="input-field w-full"
                            placeholder="Neues Passwort"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Passwort bestätigen
                          </label>
                          <input
                            type={showPassword ? 'text' : 'password'}
                            value={formData.confirmPassword}
                            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                            className="input-field w-full"
                            placeholder="Passwort bestätigen"
                          />
                        </div>
                        <div className="flex items-end gap-2">
                          <button
                            onClick={() => handleChangePassword(user.id)}
                            className="btn-success flex items-center"
                          >
                            <Save className="h-4 w-4 mr-2" />
                            Speichern
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="btn-secondary flex items-center"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Abbrechen
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* User Display */
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <User className="h-5 w-5 text-gray-500" />
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                              {user.username}
                              {user.id === currentUser?.id && (
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                  Sie
                                </span>
                              )}
                            </h4>
                            <div className="text-sm text-gray-500 space-y-1">
                              <div>Erstellt: {formatDate(user.createdAt)}</div>
                              {user.lastLogin && (
                                <div>Letzter Login: {formatDate(user.lastLogin)}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEdit(user)}
                          className="p-2 hover:bg-gray-100 rounded text-blue-600"
                          title="Passwort ändern"
                        >
                          <Lock className="h-4 w-4" />
                        </button>
                        {user.id !== currentUser?.id && (
                          <button
                            onClick={() => handleDelete(user.id, user.username)}
                            className="p-2 hover:bg-gray-100 rounded text-red-600"
                            title="Benutzer löschen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
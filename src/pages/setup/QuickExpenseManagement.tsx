import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, ArrowLeft } from 'lucide-react';
import { db } from '../../services/database';
import { QuickExpense } from '../../types';

const QuickExpenseManagement: React.FC = () => {
  const [quickExpenses, setQuickExpenses] = useState<QuickExpense[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    defaultAmount: '',
    category: 'Food & Ingredients',
    color: 'blue'
  });

  const categories = [
    'Food & Ingredients',
    'Supplies',
    'Utilities',
    'Maintenance',
    'Marketing',
    'Other'
  ];

  const colors = [
    { name: 'blue', class: 'bg-blue-500' },
    { name: 'green', class: 'bg-green-500' },
    { name: 'red', class: 'bg-red-500' },
    { name: 'yellow', class: 'bg-yellow-500' },
    { name: 'purple', class: 'bg-purple-500' },
    { name: 'orange', class: 'bg-orange-500' },
    { name: 'gray', class: 'bg-gray-500' }
  ];

  useEffect(() => {
    loadQuickExpenses();
  }, []);

  const loadQuickExpenses = async () => {
    try {
      const expenses = await db.quickExpenses.orderBy('name').toArray();
      setQuickExpenses(expenses);
    } catch (error) {
      console.error('Error loading quick expenses:', error);
    }
  };

  const handleAdd = async () => {
    if (!formData.name.trim() || !formData.defaultAmount) {
      alert('Name und Betrag sind erforderlich');
      return;
    }

    try {
      const newExpense: QuickExpense = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        defaultAmount: parseFloat(formData.defaultAmount),
        category: formData.category,
        color: formData.color,
        isActive: true
      };

      await db.quickExpenses.add(newExpense);
      console.log('✅ Quick-Expense successfully added:', newExpense);
      
      await loadQuickExpenses();
      
      setFormData({ name: '', defaultAmount: '', category: 'Food & Ingredients', color: 'blue' });
      setShowAddForm(false);
      
      alert(`✅ Quick-Expense "${newExpense.name}" wurde erfolgreich hinzugefügt!`);
    } catch (error) {
      console.error('❌ Error adding quick expense:', error);
      alert(`❌ Fehler beim Hinzufügen der Quick-Expense: ${error}`);
    }
  };

  const handleEdit = async (expense: QuickExpense) => {
    if (!formData.name.trim() || !formData.defaultAmount) {
      alert('Name und Betrag sind erforderlich');
      return;
    }

    try {
      await db.quickExpenses.update(expense.id, {
        name: formData.name.trim(),
        defaultAmount: parseFloat(formData.defaultAmount),
        category: formData.category,
        color: formData.color
      });

      await loadQuickExpenses();
      setEditingId(null);
      setFormData({ name: '', defaultAmount: '', category: 'Food & Ingredients', color: 'blue' });
    } catch (error) {
      console.error('Error updating quick expense:', error);
      alert('Fehler beim Aktualisieren der Quick-Expense');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Quick-Expense wirklich löschen?')) return;

    try {
      await db.quickExpenses.delete(id);
      await loadQuickExpenses();
    } catch (error) {
      console.error('Error deleting quick expense:', error);
      alert('Fehler beim Löschen der Quick-Expense');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      await db.quickExpenses.update(id, { isActive: !isActive });
      await loadQuickExpenses();
    } catch (error) {
      console.error('Error toggling quick expense status:', error);
    }
  };

  const startEdit = (expense: QuickExpense) => {
    setEditingId(expense.id);
    setFormData({
      name: expense.name,
      defaultAmount: expense.defaultAmount.toString(),
      category: expense.category,
      color: expense.color || 'blue'
    });
    setShowAddForm(false);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowAddForm(false);
    setFormData({ name: '', defaultAmount: '', category: 'Food & Ingredients', color: 'blue' });
  };

  const getColorClass = (color: string) => {
    const colorMap: { [key: string]: string } = {
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      red: 'bg-red-500',
      yellow: 'bg-yellow-500',
      purple: 'bg-purple-500',
      orange: 'bg-orange-500',
      gray: 'bg-gray-500'
    };
    return colorMap[color] || 'bg-blue-500';
  };

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
              <h1 className="text-3xl font-bold text-gray-900">Quick-Expenses verwalten</h1>
              <p className="text-gray-600 mt-2">Häufige Ausgaben konfigurieren</p>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Quick-Expenses Verwaltung</h2>
              <p className="text-gray-600 mt-2">
                Häufige Ausgaben konfigurieren für schnellen Zugriff im Management-Bereich
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
              Quick-Expense hinzufügen
            </button>
          </div>
        </div>

        {/* Add Form */}
        {showAddForm && (
          <div className="card mb-6 bg-blue-50 border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">
              Neue Quick-Expense hinzufügen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  placeholder="z.B. Gemüse"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Standard-Betrag (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.defaultAmount}
                  onChange={(e) => setFormData({ ...formData, defaultAmount: e.target.value })}
                  className="input-field"
                  placeholder="25.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kategorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="input-field"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Farbe
                </label>
                <div className="flex gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => setFormData({ ...formData, color: color.name })}
                      className={`w-8 h-8 rounded-full ${color.class} ${
                        formData.color === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                      }`}
                    />
                  ))}
                </div>
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

        {/* Quick Expenses List */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Konfigurierte Quick-Expenses ({quickExpenses.length})
          </h3>

          {quickExpenses.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-xl mb-2">Noch keine Quick-Expenses konfiguriert</p>
              <p>Fügen Sie häufige Ausgaben hinzu für schnellen Zugriff</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    expense.isActive 
                      ? 'border-gray-200 bg-white' 
                      : 'border-gray-100 bg-gray-50 opacity-75'
                  }`}
                >
                  {editingId === expense.id ? (
                    /* Editing Form */
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="input-field w-full"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={formData.defaultAmount}
                        onChange={(e) => setFormData({ ...formData, defaultAmount: e.target.value })}
                        className="input-field w-full"
                      />
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="input-field w-full"
                      >
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <div className="flex gap-2 mb-3">
                        {colors.map((color) => (
                          <button
                            key={color.name}
                            type="button"
                            onClick={() => setFormData({ ...formData, color: color.name })}
                            className={`w-6 h-6 rounded-full ${color.class} ${
                              formData.color === color.name ? 'ring-2 ring-offset-2 ring-gray-400' : ''
                            }`}
                          />
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(expense)}
                          className="btn-success flex-1 flex items-center justify-center"
                        >
                          <Save className="h-4 w-4 mr-2" />
                          Speichern
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="btn-secondary flex-1 flex items-center justify-center"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* Display Form */
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center">
                          <div className={`w-4 h-4 rounded-full ${getColorClass(expense.color || 'blue')} mr-2`}></div>
                          <h4 className="font-semibold text-gray-900">{expense.name}</h4>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => startEdit(expense)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Edit className="h-4 w-4 text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleDelete(expense.id)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </button>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm text-gray-600">Betrag:</span>
                          <div className="font-bold text-lg text-green-600">
                            €{expense.defaultAmount.toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <span className="text-sm text-gray-600">Kategorie:</span>
                          <div className="font-medium">{expense.category}</div>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t">
                        <button
                          onClick={() => toggleActive(expense.id, expense.isActive)}
                          className={`w-full py-2 px-3 rounded font-medium text-sm ${
                            expense.isActive
                              ? 'bg-green-100 text-green-700 hover:bg-green-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {expense.isActive ? 'Aktiv' : 'Inaktiv'}
                        </button>
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

export default QuickExpenseManagement;
import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import Header from '../../components/Layout/Header';
import DataTable from '../../components/UI/DataTable';
import { useMenuItems, useInventoryItems } from '../../hooks/useDatabase';
import { MenuItem, MenuItemIngredient } from '../../types';

const MenuManagement: React.FC = () => {
  const { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem } = useMenuItems();
  const { inventoryItems } = useInventoryItems();
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    category: ''
  });
  const [ingredients, setIngredients] = useState<MenuItemIngredient[]>([]);

  const categories = ['Pizza', 'Pasta', 'Salad', 'Dessert', 'Beverage', 'Appetizer', 'Main Course'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const itemData = {
        name: formData.name,
        price: parseFloat(formData.price),
        category: formData.category,
        soldCount: editingItem?.soldCount || 0,
        ingredients: ingredients.filter(ing => ing.inventoryItemId && ing.quantity > 0)
      };

      if (editingItem) {
        await updateMenuItem(editingItem.id, itemData);
      } else {
        await addMenuItem(itemData);
      }

      resetForm();
    } catch (error) {
      console.error('Error saving menu item:', error);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', category: '' });
    setIngredients([]);
    setEditingItem(null);
    setShowModal(false);
  };

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      price: item.price.toString(),
      category: item.category || ''
    });
    setIngredients(item.ingredients || []);
    setShowModal(true);
  };

  const handleDelete = async (item: MenuItem) => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      await deleteMenuItem(item.id);
    }
  };

  const addIngredient = () => {
    setIngredients([...ingredients, { inventoryItemId: '', quantity: 0 }]);
  };

  const updateIngredient = (index: number, field: keyof MenuItemIngredient, value: string | number) => {
    const newIngredients = [...ingredients];
    if (field === 'quantity') {
      newIngredients[index][field] = Number(value);
    } else {
      newIngredients[index][field] = value as string;
    }
    setIngredients(newIngredients);
  };

  const removeIngredient = (index: number) => {
    setIngredients(ingredients.filter((_, i) => i !== index));
  };

  const getIngredientName = (inventoryItemId: string) => {
    const item = inventoryItems.find(inv => inv.id === inventoryItemId);
    return item ? `${item.name} (${item.unit})` : 'Unknown';
  };

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'category', label: 'Category' },
    { 
      key: 'price', 
      label: 'Price', 
      format: (value: number) => `€${value.toFixed(2)}` 
    },
    { 
      key: 'ingredients', 
      label: 'Ingredients',
      format: (value: MenuItemIngredient[], item: MenuItem) => {
        if (!value || value.length === 0) return 'No ingredients';
        return value.map(ing => {
          const invItem = inventoryItems.find(inv => inv.id === ing.inventoryItemId);
          return invItem ? `${ing.quantity} ${invItem.unit} ${invItem.name}` : '';
        }).filter(Boolean).join(', ');
      }
    },
    { 
      key: 'soldCount', 
      label: 'Sold Today', 
      format: (value: number) => value.toString() 
    }
  ];

  if (loading) {
    return (
      <div>
        <Header title="Menu Management" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header title="Menu Management" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Menu Items</h2>
          <button
            onClick={() => setShowModal(true)}
            className="btn-primary flex items-center"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Menu Item
          </button>
        </div>

        <DataTable
          columns={columns}
          data={menuItems}
          onEdit={handleEdit}
          onDelete={handleDelete}
          emptyMessage="No menu items yet. Add your first menu item!"
        />

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold">
                    {editingItem ? 'Edit Menu Item' : 'Add Menu Item'}
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
                      placeholder="e.g., Margherita Pizza"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="input-field"
                    >
                      <option value="">Select Category</option>
                      {categories.map((category) => (
                        <option key={category} value={category}>
                          {category}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Price (€) *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="input-field"
                      placeholder="0.00"
                    />
                  </div>

                  {/* Ingredients Section */}
                  <div className="form-group">
                    <div className="flex justify-between items-center mb-2">
                      <label className="form-label">Ingredients/Recipe</label>
                      <button
                        type="button"
                        onClick={addIngredient}
                        className="btn-inventory text-sm py-1 px-3"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add Ingredient
                      </button>
                    </div>
                    
                    {ingredients.length === 0 ? (
                      <p className="text-sm text-gray-500 italic">No ingredients added yet</p>
                    ) : (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {ingredients.map((ingredient, index) => (
                          <div key={index} className="flex space-x-2 items-center bg-gray-50 p-2 rounded">
                            <select
                              value={ingredient.inventoryItemId}
                              onChange={(e) => updateIngredient(index, 'inventoryItemId', e.target.value)}
                              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1"
                            >
                              <option value="">Select Ingredient</option>
                              {inventoryItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} ({item.unit})
                                </option>
                              ))}
                            </select>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={ingredient.quantity}
                              onChange={(e) => updateIngredient(index, 'quantity', e.target.value)}
                              className="w-20 text-sm border border-gray-300 rounded px-2 py-1"
                              placeholder="Qty"
                            />
                            <button
                              type="button"
                              onClick={() => removeIngredient(index)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="btn-primary flex-1"
                    >
                      {editingItem ? 'Update' : 'Add'} Item
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

export default MenuManagement;
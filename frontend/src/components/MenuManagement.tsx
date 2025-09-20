import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiService } from '../services/api'

interface MenuCategory {
  id: string
  name: string
  menuItems: MenuItem[]
}

interface MenuItem {
  id: string
  name: string
  price: number
  soldCount: number
  categoryId: string
  category: { name: string }
}

const MenuManagement: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [activeTab, setActiveTab] = useState<'items' | 'categories'>('items')
  const [categories, setCategories] = useState<MenuCategory[]>([])
  const [items, setItems] = useState<MenuItem[]>([])
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showItemForm, setShowItemForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<string | null>(null)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [newCategory, setNewCategory] = useState('')
  const [newItem, setNewItem] = useState({
    name: '',
    price: '',
    categoryId: ''
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check URL parameter for tab
    const tab = searchParams.get('tab')
    if (tab === 'categories') {
      setActiveTab('categories')
    }
    fetchData()
  }, [searchParams])

  const fetchData = async () => {
    try {
      const [categoriesRes, itemsRes] = await Promise.all([
        apiService.getMenuCategories(),
        apiService.getMenuItems()
      ])
      setCategories(categoriesRes.data)
      setItems(itemsRes.data)
    } catch (error) {
      console.error('Error fetching menu data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await apiService.createMenuCategory(newCategory)
      setNewCategory('')
      setShowCategoryForm(false)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating category')
    }
  }

  const handleUpdateCategory = async (id: string, name: string) => {
    try {
      await apiService.updateMenuCategory(id, name)
      setEditingCategory(null)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating category')
    }
  }

  const handleDeleteCategory = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete category "${name}" and all its items?`)) return

    try {
      await apiService.deleteMenuCategory(id)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting category')
    }
  }

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      await apiService.createMenuItem({
        name: newItem.name,
        price: parseFloat(newItem.price),
        categoryId: newItem.categoryId
      })
      setNewItem({ name: '', price: '', categoryId: '' })
      setShowItemForm(false)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error creating menu item')
    }
  }

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingItem) return

    try {
      await apiService.updateMenuItem(editingItem.id, {
        name: editingItem.name,
        price: editingItem.price,
        categoryId: editingItem.categoryId
      })
      setEditingItem(null)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error updating menu item')
    }
  }

  const handleDeleteItem = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete menu item "${name}"?`)) return

    try {
      await apiService.deleteMenuItem(id)
      fetchData()
    } catch (error: any) {
      alert(error.response?.data?.error || 'Error deleting menu item')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading menu...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Menü-Verwaltung</h1>
        <button
          onClick={() => navigate('/settings')}
          className="btn-large btn-secondary"
        >
          ← Zurück zu Einstellungen
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="card">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('items')}
            className={`btn-large ${activeTab === 'items' ? 'btn-primary' : 'btn-secondary'}`}
          >
            🍽️ Menu-Items
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`btn-large ${activeTab === 'categories' ? 'btn-primary' : 'btn-secondary'}`}
          >
            📋 Kategorien
          </button>
        </div>

        <div className="flex justify-end space-x-2">
          {activeTab === 'categories' ? (
            <button
              onClick={() => setShowCategoryForm(true)}
              className="btn-large btn-primary"
            >
              + Kategorie hinzufügen
            </button>
          ) : (
            <button
              onClick={() => setShowItemForm(true)}
              className="btn-large btn-success"
            >
              + Menu-Item hinzufügen
            </button>
          )}
        </div>
      </div>

      {/* Add Category Form */}
      {showCategoryForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Category</h2>
          <form onSubmit={handleAddCategory} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Category Name</label>
              <input
                type="text"
                className="input-large w-full"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                required
              />
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                Add Category
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowCategoryForm(false)
                  setNewCategory('')
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add/Edit Item Form */}
      {(showItemForm || editingItem) && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
          </h2>
          <form onSubmit={editingItem ? handleUpdateItem : handleAddItem} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Item Name</label>
                <input
                  type="text"
                  className="input-large w-full"
                  value={editingItem ? editingItem.name : newItem.name}
                  onChange={(e) => editingItem 
                    ? setEditingItem({ ...editingItem, name: e.target.value })
                    : setNewItem({ ...newItem, name: e.target.value })
                  }
                  placeholder="Enter item name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Price (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className="input-large w-full"
                  value={editingItem ? editingItem.price : newItem.price}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, price: parseFloat(e.target.value) || 0 })
                    : setNewItem({ ...newItem, price: e.target.value })
                  }
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                  className="input-large w-full"
                  value={editingItem ? editingItem.categoryId : newItem.categoryId}
                  onChange={(e) => editingItem
                    ? setEditingItem({ ...editingItem, categoryId: e.target.value })
                    : setNewItem({ ...newItem, categoryId: e.target.value })
                  }
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex space-x-4">
              <button type="submit" className="btn-large btn-success flex-1">
                {editingItem ? 'Update Item' : 'Add Item'}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (editingItem) {
                    setEditingItem(null)
                  } else {
                    setShowItemForm(false)
                    setNewItem({ name: '', price: '', categoryId: '' })
                  }
                }}
                className="btn-large btn-secondary flex-1"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Categories List */}
      {activeTab === 'categories' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Kategorien verwalten</h2>
          {categories.length > 0 ? (
            <div className="space-y-3">
              {categories.map((category) => (
                <div key={category.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  {editingCategory === category.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        const formData = new FormData(e.target as HTMLFormElement)
                        const name = formData.get('name') as string
                        handleUpdateCategory(category.id, name)
                      }}
                      className="flex-1 flex space-x-2"
                    >
                      <input
                        name="name"
                        type="text"
                        className="input-large flex-1"
                        defaultValue={category.name}
                        required
                      />
                      <button type="submit" className="btn-large btn-success text-sm px-3 py-2 min-h-[40px]">
                        Speichern
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingCategory(null)}
                        className="btn-large btn-secondary text-sm px-3 py-2 min-h-[40px]"
                      >
                        Abbrechen
                      </button>
                    </form>
                  ) : (
                    <>
                      <div>
                        <span className="font-medium">{category.name}</span>
                        <span className="text-sm text-gray-600 ml-2">
                          ({category.menuItems.length} Items)
                        </span>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setEditingCategory(category.id)}
                          className="btn-large btn-warning text-sm px-3 py-2 min-h-[40px]"
                        >
                          Bearbeiten
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(category.id, category.name)}
                          className="btn-large btn-danger text-sm px-3 py-2 min-h-[40px]"
                        >
                          Löschen
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Noch keine Kategorien erstellt</p>
          )}
        </div>
      )}

      {/* Menu Items List */}
      {activeTab === 'items' && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Menu-Items verwalten</h2>
          {items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm bg-gray-200 px-2 py-1 rounded">
                        {item.category.name}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      Preis: €{item.price.toFixed(2)} | Verkauft: {item.soldCount}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setEditingItem(item)}
                      className="btn-large btn-warning text-sm px-3 py-2 min-h-[40px]"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="btn-large btn-danger text-sm px-3 py-2 min-h-[40px]"
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Noch keine Menu-Items erstellt</p>
          )}
        </div>
      )}
    </div>
  )
}

export default MenuManagement
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  FileText,
  ChefHat,
  Package,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../../../services/api';

const RecipesTab = () => {
  const [recipes, setRecipes] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [formData, setFormData] = useState({
    menu_item_id: '',
    inventory_item_id: '',
    quantity_required: 0
  });

  useEffect(() => {
    fetchMenuItems();
    fetchInventoryItems();
  }, []);

  useEffect(() => {
    if (selectedMenuItem) {
      fetchRecipesForMenuItem(selectedMenuItem);
    }
  }, [selectedMenuItem]);

  const fetchMenuItems = async () => {
    try {
      const response = await api.get('/menu');
      setMenuItems(response.data);
      if (response.data.length > 0) {
        setSelectedMenuItem(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast.error('Failed to load menu items');
    }
  };

  const fetchInventoryItems = async () => {
    try {
      const response = await api.get('/api/inventory/items');
      setInventoryItems(response.data.filter(item => item.is_active));
    } catch (error) {
      console.error('Error fetching inventory items:', error);
      toast.error('Failed to load inventory items');
    }
  };

  const fetchRecipesForMenuItem = async (menuItemId) => {
    try {
      setLoading(true);
      const response = await api.get(`/api/inventory/recipes/menu-item/${menuItemId}`);
      setRecipes(response.data);
    } catch (error) {
      console.error('Error fetching recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecipe) {
        await api.put(`/api/inventory/recipes/${editingRecipe.id}`, {
          quantity_required: formData.quantity_required
        });
        toast.success('Recipe updated successfully');
      } else {
        await api.post('/api/inventory/recipes', formData);
        toast.success('Ingredient added to recipe');
      }
      setShowModal(false);
      resetForm();
      fetchRecipesForMenuItem(selectedMenuItem);
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error(error.response?.data?.detail || 'Failed to save recipe');
    }
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm('Remove this ingredient from the recipe?')) return;
    
    try {
      await api.delete(`/api/inventory/recipes/${recipeId}`);
      toast.success('Ingredient removed from recipe');
      fetchRecipesForMenuItem(selectedMenuItem);
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to remove ingredient');
    }
  };

  const handleEdit = (recipe) => {
    setEditingRecipe(recipe);
    setFormData({
      menu_item_id: recipe.menu_item_id,
      inventory_item_id: recipe.inventory_item_id,
      quantity_required: recipe.quantity_required
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setEditingRecipe(null);
    setFormData({
      menu_item_id: selectedMenuItem || '',
      inventory_item_id: '',
      quantity_required: 0
    });
  };

  const handleAddIngredient = () => {
    resetForm();
    setFormData({
      ...formData,
      menu_item_id: selectedMenuItem
    });
    setShowModal(true);
  };

  const currentMenuItem = menuItems.find(item => item.id === selectedMenuItem);
  const totalCost = recipes.reduce((sum, recipe) => {
    return sum + (recipe.quantity_required * (recipe.inventory_item?.unit_cost || 0));
  }, 0);

  return (
    <div className="space-y-4">
      {/* Menu Item Selector */}
      <div className="bg-white border border-slate-200 rounded-lg p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Select Menu Item to Manage Recipe
        </label>
        <div className="flex gap-4 items-center">
          <select
            value={selectedMenuItem || ''}
            onChange={(e) => setSelectedMenuItem(Number(e.target.value))}
            className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            {menuItems.map(item => (
              <option key={item.id} value={item.id}>
                {item.name} - ₹{item.price} ({item.category})
              </option>
            ))}
          </select>
          <button
            onClick={handleAddIngredient}
            disabled={!selectedMenuItem}
            className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed"
          >
            <Plus size={20} />
            <span>Add Ingredient</span>
          </button>
        </div>
      </div>

      {/* Current Recipe Info */}
      {currentMenuItem && (
        <div className="bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-white rounded-lg">
                <ChefHat className="text-primary-600" size={24} />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{currentMenuItem.name}</h3>
                <p className="text-sm text-slate-600">
                  {recipes.length} ingredient{recipes.length !== 1 ? 's' : ''} • 
                  Cost per serving: ₹{totalCost.toFixed(2)} • 
                  Selling Price: ₹{currentMenuItem.price}
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-slate-600">Profit Margin</div>
              <div className={`text-lg font-bold ${currentMenuItem.price - totalCost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                ₹{(currentMenuItem.price - totalCost).toFixed(2)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recipe Ingredients List */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 rounded-lg">
          <FileText className="mx-auto text-slate-400 mb-4" size={48} />
          <p className="text-slate-600">No ingredients in this recipe yet</p>
          <button
            onClick={handleAddIngredient}
            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
          >
            Add your first ingredient
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Ingredient
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Quantity Required
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Unit Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Total Cost
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Stock Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {recipes.map((recipe) => {
                const item = recipe.inventory_item;
                const itemCost = recipe.quantity_required * (item?.unit_cost || 0);
                const isLowStock = item && item.current_quantity < recipe.quantity_required;
                
                return (
                  <motion.tr
                    key={recipe.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="p-2 bg-slate-100 rounded-lg mr-3">
                          <Package className="text-slate-600" size={18} />
                        </div>
                        <div className="font-medium text-slate-900">
                          {item?.name || 'Unknown Item'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">{item?.category || '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">
                        {recipe.quantity_required} {item?.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-slate-700">₹{item?.unit_cost?.toFixed(2) || '0.00'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-900">₹{itemCost.toFixed(2)}</span>
                    </td>
                    <td className="px-6 py-4">
                      {item ? (
                        isLowStock ? (
                          <div className="flex items-center text-orange-600">
                            <AlertCircle size={16} className="mr-1" />
                            <span className="text-sm">
                              Low ({item.current_quantity} {item.unit})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm text-green-600">
                            ✓ Available ({item.current_quantity} {item.unit})
                          </span>
                        )
                      ) : (
                        <span className="text-slate-400 text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(recipe)}
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                          title="Edit quantity"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(recipe.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-md"
          >
            <div className="p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {editingRecipe ? 'Edit Ingredient Quantity' : 'Add Ingredient to Recipe'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingRecipe && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Inventory Item *
                  </label>
                  <select
                    required
                    value={formData.inventory_item_id}
                    onChange={(e) => setFormData({ ...formData, inventory_item_id: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select an ingredient</option>
                    {inventoryItems.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.name} ({item.current_quantity} {item.unit} available @ ₹{item.unit_cost || 0}/{item.unit})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editingRecipe && (
                <div className="bg-slate-50 rounded-lg p-3">
                  <div className="text-sm text-slate-600">Ingredient</div>
                  <div className="font-semibold text-slate-900">
                    {editingRecipe.inventory_item?.name}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity Required (per serving) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={formData.quantity_required}
                  onChange={(e) => setFormData({ ...formData, quantity_required: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="e.g., 0.5"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Amount needed to prepare one serving of {currentMenuItem?.name}
                </p>
              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  {editingRecipe ? 'Update Quantity' : 'Add Ingredient'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default RecipesTab;

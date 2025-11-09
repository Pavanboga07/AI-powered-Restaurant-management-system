import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Filter, Heart, ShoppingCart, Star, 
  X, Info, Plus, Minus, Leaf, Drumstick, Vegan,
  ChevronDown, Loader2
} from 'lucide-react';
import { customerAPI } from '../../services/api';

const MenuBrowsing = ({ onAddToCart, cart = [] }) => {
  const [menuItems, setMenuItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDietType, setSelectedDietType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    loadMenu();
    loadCategories();
    loadFavorites();
  }, []);

  useEffect(() => {
    loadMenu();
  }, [selectedCategory, selectedDietType, searchTerm]);

  const loadMenu = async () => {
    try {
      setLoading(true);
      const filters = {
        category: selectedCategory !== 'all' ? selectedCategory : null,
        diet_type: selectedDietType !== 'all' ? selectedDietType : null,
        search: searchTerm || null,
        available_only: true,
      };
      const data = await customerAPI.browseMenu(filters);
      setMenuItems(data);
      setError(null);
    } catch (err) {
      console.error('Error loading menu:', err);
      setError('Failed to load menu. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await customerAPI.getMenuCategories();
      setCategories(data);
    } catch (err) {
      console.error('Error loading categories:', err);
    }
  };

  const loadFavorites = async () => {
    try {
      const data = await customerAPI.getFavorites();
      setFavorites(data.map(item => item.id));
    } catch (err) {
      console.error('Error loading favorites:', err);
      // Non-critical, user might not be logged in
    }
  };

  const toggleFavorite = async (itemId, e) => {
    e.stopPropagation();
    try {
      if (favorites.includes(itemId)) {
        await customerAPI.removeFavorite(itemId);
        setFavorites(favorites.filter(id => id !== itemId));
      } else {
        await customerAPI.addFavorite(itemId);
        setFavorites([...favorites, itemId]);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      alert('Please log in to save favorites');
    }
  };

  const handleAddToCart = (item, quantity = 1) => {
    onAddToCart({ ...item, quantity });
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    setShowModal(true);
  };

  const getDietIcon = (dietType) => {
    switch (dietType?.toLowerCase()) {
      case 'veg':
        return <Leaf className="w-4 h-4 text-green-500" />;
      case 'non-veg':
        return <Drumstick className="w-4 h-4 text-red-500" />;
      case 'vegan':
        return <Vegan className="w-4 h-4 text-emerald-500" />;
      default:
        return null;
    }
  };

  const getItemQuantityInCart = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantity : 0;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Our Menu</h1>
          <p className="text-gray-600">Discover delicious dishes crafted with love</p>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              <Filter className="w-5 h-5" />
              Filters
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="mt-4 pt-4 border-t border-gray-200"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Category Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Categories</option>
                      {categories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Diet Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diet Type
                    </label>
                    <select
                      value={selectedDietType}
                      onChange={(e) => setSelectedDietType(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="all">All Types</option>
                      <option value="Veg">Vegetarian</option>
                      <option value="Non-Veg">Non-Vegetarian</option>
                      <option value="Vegan">Vegan</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Menu Grid */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {menuItems.map((item) => (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow cursor-pointer"
                onClick={() => openDetails(item)}
              >
                {/* Image */}
                <div className="relative h-48 bg-gradient-to-br from-orange-200 to-red-200">
                  {item.image_url ? (
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <span className="text-4xl">🍽️</span>
                    </div>
                  )}
                  
                  {/* Favorite Button */}
                  <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(item.id)
                          ? 'fill-red-500 text-red-500'
                          : 'text-gray-400'
                      }`}
                    />
                  </button>

                  {/* Diet Type Badge */}
                  <div className="absolute top-3 left-3 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                    {getDietIcon(item.diet_type)}
                    <span className="text-xs font-medium">{item.diet_type}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-gray-800 line-clamp-1">
                      {item.name}
                    </h3>
                    <span className="text-lg font-bold text-orange-600">
                      ${item.price.toFixed(2)}
                    </span>
                  </div>

                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      {item.category}
                    </span>

                    {item.preparation_time && (
                      <span className="text-xs text-gray-500">
                        ⏱️ {item.preparation_time} min
                      </span>
                    )}
                  </div>

                  {/* Add to Cart */}
                  <div className="mt-4 flex gap-2">
                    {getItemQuantityInCart(item.id) > 0 ? (
                      <div className="flex-1 flex items-center justify-between bg-orange-100 rounded-lg px-3 py-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, -1);
                          }}
                          className="p-1 hover:bg-orange-200 rounded transition-colors"
                        >
                          <Minus className="w-4 h-4 text-orange-600" />
                        </button>
                        <span className="font-bold text-orange-600">
                          {getItemQuantityInCart(item.id)}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddToCart(item, 1);
                          }}
                          className="p-1 hover:bg-orange-200 rounded transition-colors"
                        >
                          <Plus className="w-4 h-4 text-orange-600" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item, 1);
                        }}
                        className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                      >
                        <ShoppingCart className="w-4 h-4" />
                        Add to Cart
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && menuItems.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">No items found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}
      </div>

      {/* Item Details Modal */}
      <AnimatePresence>
        {showModal && selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="relative h-64 bg-gradient-to-br from-orange-200 to-red-200">
                {selectedItem.image_url ? (
                  <img
                    src={selectedItem.image_url}
                    alt={selectedItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <span className="text-6xl">🍽️</span>
                  </div>
                )}
                <button
                  onClick={() => setShowModal(false)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {getDietIcon(selectedItem.diet_type)}
                      <span className="text-sm font-medium text-gray-600">
                        {selectedItem.diet_type}
                      </span>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-800 mb-2">
                      {selectedItem.name}
                    </h2>
                    <p className="text-gray-600">{selectedItem.category}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-orange-600">
                      ${selectedItem.price.toFixed(2)}
                    </div>
                    {selectedItem.preparation_time && (
                      <div className="text-sm text-gray-500 mt-1">
                        ⏱️ {selectedItem.preparation_time} min
                      </div>
                    )}
                  </div>
                </div>

                <p className="text-gray-700 mb-6">{selectedItem.description}</p>

                <div className="flex gap-3">
                  <button
                    onClick={() => toggleFavorite(selectedItem.id, new Event('click'))}
                    className="px-6 py-3 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Heart
                      className={`w-5 h-5 ${
                        favorites.includes(selectedItem.id)
                          ? 'fill-orange-500'
                          : ''
                      }`}
                    />
                    {favorites.includes(selectedItem.id) ? 'Favorited' : 'Add to Favorites'}
                  </button>

                  <button
                    onClick={() => {
                      handleAddToCart(selectedItem, 1);
                      setShowModal(false);
                    }}
                    className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MenuBrowsing;

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, ShoppingCart, Plus, Minus, Loader2,
  Trash2, Leaf, Drumstick, Vegan
} from 'lucide-react';
import { customerAPI } from '../../services/api';

const Favorites = ({ onAddToCart, cart = [] }) => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const data = await customerAPI.getFavorites();
      setFavorites(data);
      setError(null);
    } catch (err) {
      console.error('Error loading favorites:', err);
      setError('Failed to load favorites. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (itemId) => {
    setRemovingId(itemId);
    try {
      await customerAPI.removeFavorite(itemId);
      setFavorites(favorites.filter(item => item.id !== itemId));
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove from favorites');
    } finally {
      setRemovingId(null);
    }
  };

  const handleAddToCart = (item, quantity = 1) => {
    onAddToCart({ ...item, quantity });
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <Heart className="w-10 h-10 text-red-500 fill-red-500" />
            My Favorites
          </h1>
          <p className="text-gray-600">
            {favorites.length} {favorites.length === 1 ? 'item' : 'items'} saved
          </p>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {favorites.length === 0 && !error ? (
          <div className="bg-white rounded-xl shadow-lg p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No favorites yet
            </h3>
            <p className="text-gray-500 mb-6">
              Start adding items to your favorites to see them here!
            </p>
            <a
              href="/customer/menu"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
            >
              Browse Menu
            </a>
          </div>
        ) : (
          /* Favorites Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {favorites.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow"
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

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFavorite(item.id)}
                      disabled={removingId === item.id}
                      className="absolute top-3 right-3 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 hover:scale-110 transition-all disabled:opacity-50"
                    >
                      {removingId === item.id ? (
                        <Loader2 className="w-5 h-5 text-red-500 animate-spin" />
                      ) : (
                        <Trash2 className="w-5 h-5 text-red-500" />
                      )}
                    </button>

                    {/* Diet Type Badge */}
                    <div className="absolute top-3 left-3 bg-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                      {getDietIcon(item.diet_type)}
                      <span className="text-xs font-medium">{item.diet_type}</span>
                    </div>

                    {/* Favorite Badge */}
                    <div className="absolute bottom-3 left-3 bg-red-500 text-white rounded-full px-3 py-1 flex items-center gap-1 shadow-lg">
                      <Heart className="w-3 h-3 fill-white" />
                      <span className="text-xs font-medium">Favorite</span>
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

                    <div className="flex justify-between items-center mb-4">
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
                    <div className="flex gap-2">
                      {getItemQuantityInCart(item.id) > 0 ? (
                        <div className="flex-1 flex items-center justify-between bg-orange-100 rounded-lg px-3 py-2">
                          <button
                            onClick={() => handleAddToCart(item, -1)}
                            className="p-1 hover:bg-orange-200 rounded transition-colors"
                          >
                            <Minus className="w-4 h-4 text-orange-600" />
                          </button>
                          <span className="font-bold text-orange-600">
                            {getItemQuantityInCart(item.id)}
                          </span>
                          <button
                            onClick={() => handleAddToCart(item, 1)}
                            className="p-1 hover:bg-orange-200 rounded transition-colors"
                          >
                            <Plus className="w-4 h-4 text-orange-600" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(item, 1)}
                          className="flex-1 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
                        >
                          <ShoppingCart className="w-4 h-4" />
                          Add to Cart
                        </button>
                      )}
                    </div>

                    {/* Availability Status */}
                    {!item.is_available && (
                      <div className="mt-2 text-center">
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                          Currently Unavailable
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Quick Actions */}
        {favorites.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Quick Actions</h3>
                <p className="text-sm text-gray-600">
                  Add all available favorites to cart or browse more items
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    favorites.forEach(item => {
                      if (item.is_available && !getItemQuantityInCart(item.id)) {
                        handleAddToCart(item, 1);
                      }
                    });
                  }}
                  className="px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Add All to Cart
                </button>

                <a
                  href="/customer/menu"
                  className="px-6 py-3 border-2 border-orange-500 text-orange-500 hover:bg-orange-50 rounded-lg font-semibold transition-colors"
                >
                  Browse Menu
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;

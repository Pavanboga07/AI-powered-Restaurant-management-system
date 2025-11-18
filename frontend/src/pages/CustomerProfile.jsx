import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, MapPin, Heart, Settings, Utensils, Phone, Mail,
  Home, Briefcase, Plus, Edit2, Trash2, Star, Award
} from 'lucide-react';
import api from '../services/api';

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Profile data
  const [profile, setProfile] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);

  // Edit states
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [showAddAddress, setShowAddAddress] = useState(false);

  // Form data
  const [profileForm, setProfileForm] = useState({
    phone_number: '',
    dietary_preferences: [],
    allergies: '',
    favorite_cuisines: '',
    special_instructions: '',
    preferred_payment_method: 'cash'
  });

  const [addressForm, setAddressForm] = useState({
    address_type: 'home',
    street_address: '',
    apartment: '',
    city: '',
    state: '',
    pincode: '',
    landmark: '',
    is_default: false
  });

  const dietaryOptions = [
    'Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free',
    'Nut-Free', 'Halal', 'Kosher', 'Low-Carb', 'Keto'
  ];

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await api.get('/profile/me');
      const data = response.data;
      
      setProfile(data);
      setAddresses(data.addresses || []);
      setLoyaltyAccount(data.loyalty_account);
      
      // Set profile form
      setProfileForm({
        phone_number: data.phone_number || '',
        dietary_preferences: data.dietary_preferences || [],
        allergies: data.allergies || '',
        favorite_cuisines: data.favorite_cuisines || '',
        special_instructions: data.special_instructions || '',
        preferred_payment_method: data.preferred_payment_method || 'cash'
      });

      // Fetch favorites
      const favResponse = await api.get('/profile/favorites');
      setFavorites(favResponse.data);
    } catch (err) {
      setError('Failed to load profile data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async () => {
    try {
      setSaving(true);
      await api.put('/profile/me', profileForm);
      setSuccess('Profile updated successfully');
      setEditingProfile(false);
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const saveAddress = async () => {
    try {
      setSaving(true);
      if (editingAddress) {
        await api.put(`/profile/addresses/${editingAddress.id}`, addressForm);
        setSuccess('Address updated successfully');
      } else {
        await api.post('/profile/addresses', addressForm);
        setSuccess('Address added successfully');
      }
      
      setShowAddAddress(false);
      setEditingAddress(null);
      resetAddressForm();
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to save address');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const deleteAddress = async (addressId) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    
    try {
      await api.delete(`/profile/addresses/${addressId}`);
      setSuccess('Address deleted successfully');
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete address');
      console.error(err);
    }
  };

  const removeFavorite = async (itemId) => {
    try {
      await api.delete(`/profile/favorites/${itemId}`);
      setFavorites(favorites.filter(f => f.id !== itemId));
      setSuccess('Removed from favorites');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove favorite');
      console.error(err);
    }
  };

  const resetAddressForm = () => {
    setAddressForm({
      address_type: 'home',
      street_address: '',
      apartment: '',
      city: '',
      state: '',
      pincode: '',
      landmark: '',
      is_default: false
    });
  };

  const editAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      address_type: address.address_type,
      street_address: address.street_address,
      apartment: address.apartment || '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      landmark: address.landmark || '',
      is_default: address.is_default
    });
    setShowAddAddress(true);
  };

  const toggleDietaryPreference = (pref) => {
    const current = profileForm.dietary_preferences || [];
    if (current.includes(pref)) {
      setProfileForm({
        ...profileForm,
        dietary_preferences: current.filter(p => p !== pref)
      });
    } else {
      setProfileForm({
        ...profileForm,
        dietary_preferences: [...current, pref]
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile Info', icon: User },
    { id: 'addresses', label: 'Addresses', icon: MapPin },
    { id: 'dietary', label: 'Dietary Preferences', icon: Utensils },
    { id: 'favorites', label: 'Favorites', icon: Heart },
    { id: 'loyalty', label: 'Loyalty', icon: Award }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-orange-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile?.full_name || profile?.username}
                </h1>
                <p className="text-gray-600">{profile?.email}</p>
                {loyaltyAccount && (
                  <div className="flex items-center space-x-2 mt-2">
                    <Award className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium text-orange-600">
                      {loyaltyAccount.current_tier} Member
                    </span>
                    <span className="text-sm text-gray-600">
                      • {loyaltyAccount.points_balance} points
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
            {success}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <div className="flex space-x-1 px-4 overflow-x-auto">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-4 border-b-2 transition-colors whitespace-nowrap ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-6">
            {/* Profile Info Tab */}
            {activeTab === 'profile' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Profile Information</h2>
                  {!editingProfile ? (
                    <button
                      onClick={() => setEditingProfile(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      <Edit2 className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => setEditingProfile(false)}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateProfile}
                        disabled={saving}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Phone className="w-4 h-4 inline mr-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={profileForm.phone_number}
                      onChange={(e) => setProfileForm({ ...profileForm, phone_number: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="+91 1234567890"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Preferred Payment Method
                    </label>
                    <select
                      value={profileForm.preferred_payment_method}
                      onChange={(e) => setProfileForm({ ...profileForm, preferred_payment_method: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                    >
                      <option value="cash">Cash</option>
                      <option value="card">Card</option>
                      <option value="upi">UPI</option>
                      <option value="wallet">Wallet</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Favorite Cuisines
                    </label>
                    <input
                      type="text"
                      value={profileForm.favorite_cuisines}
                      onChange={(e) => setProfileForm({ ...profileForm, favorite_cuisines: e.target.value })}
                      disabled={!editingProfile}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Italian, Chinese, Indian..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    <textarea
                      value={profileForm.allergies}
                      onChange={(e) => setProfileForm({ ...profileForm, allergies: e.target.value })}
                      disabled={!editingProfile}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="List any food allergies..."
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Instructions
                    </label>
                    <textarea
                      value={profileForm.special_instructions}
                      onChange={(e) => setProfileForm({ ...profileForm, special_instructions: e.target.value })}
                      disabled={!editingProfile}
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:bg-gray-50"
                      placeholder="Any default preferences for your orders..."
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === 'addresses' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Saved Addresses</h2>
                  <button
                    onClick={() => {
                      resetAddressForm();
                      setEditingAddress(null);
                      setShowAddAddress(true);
                    }}
                    className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Address</span>
                  </button>
                </div>

                {showAddAddress && (
                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Address Type
                        </label>
                        <select
                          value={addressForm.address_type}
                          onChange={(e) => setAddressForm({ ...addressForm, address_type: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                        >
                          <option value="home">🏠 Home</option>
                          <option value="work">💼 Work</option>
                          <option value="other">📍 Other</option>
                        </select>
                      </div>

                      <div className="flex items-end">
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={addressForm.is_default}
                            onChange={(e) => setAddressForm({ ...addressForm, is_default: e.target.checked })}
                            className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                          />
                          <span className="text-sm text-gray-700">Set as default address</span>
                        </label>
                      </div>

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Street Address *
                        </label>
                        <input
                          type="text"
                          value={addressForm.street_address}
                          onChange={(e) => setAddressForm({ ...addressForm, street_address: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="123 Main Street"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Apartment/Suite
                        </label>
                        <input
                          type="text"
                          value={addressForm.apartment}
                          onChange={(e) => setAddressForm({ ...addressForm, apartment: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="Apt 4B"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Landmark
                        </label>
                        <input
                          type="text"
                          value={addressForm.landmark}
                          onChange={(e) => setAddressForm({ ...addressForm, landmark: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="Near City Mall"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          City *
                        </label>
                        <input
                          type="text"
                          value={addressForm.city}
                          onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="Mumbai"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          State *
                        </label>
                        <input
                          type="text"
                          value={addressForm.state}
                          onChange={(e) => setAddressForm({ ...addressForm, state: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="Maharashtra"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Pincode *
                        </label>
                        <input
                          type="text"
                          value={addressForm.pincode}
                          onChange={(e) => setAddressForm({ ...addressForm, pincode: e.target.value })}
                          required
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500"
                          placeholder="400001"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-2 mt-4">
                      <button
                        onClick={() => {
                          setShowAddAddress(false);
                          setEditingAddress(null);
                          resetAddressForm();
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveAddress}
                        disabled={saving || !addressForm.street_address || !addressForm.city || !addressForm.state || !addressForm.pincode}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : editingAddress ? 'Update' : 'Save'} Address
                      </button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 ? (
                  <div className="text-center py-12">
                    <MapPin className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No saved addresses yet</p>
                    <p className="text-sm text-gray-500 mt-2">Add your delivery addresses for faster checkout</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map((address) => (
                      <div
                        key={address.id}
                        className={`p-4 rounded-lg border-2 ${
                          address.is_default ? 'border-orange-500 bg-orange-50' : 'border-gray-200 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            {address.address_type === 'home' && <Home className="w-5 h-5 text-gray-600" />}
                            {address.address_type === 'work' && <Briefcase className="w-5 h-5 text-gray-600" />}
                            {address.address_type === 'other' && <MapPin className="w-5 h-5 text-gray-600" />}
                            <span className="font-medium text-gray-900 capitalize">{address.address_type}</span>
                            {address.is_default && (
                              <span className="px-2 py-1 text-xs bg-orange-500 text-white rounded-full">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-1">
                            <button
                              onClick={() => editAddress(address)}
                              className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteAddress(address.id)}
                              className="p-1 text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <p className="text-gray-700 text-sm">
                          {address.apartment && `${address.apartment}, `}
                          {address.street_address}
                        </p>
                        {address.landmark && (
                          <p className="text-gray-600 text-sm">Near: {address.landmark}</p>
                        )}
                        <p className="text-gray-600 text-sm">
                          {address.city}, {address.state} - {address.pincode}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Dietary Preferences Tab */}
            {activeTab === 'dietary' && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Dietary Preferences</h2>
                <p className="text-gray-600">Select your dietary preferences to get personalized menu recommendations</p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dietaryOptions.map((option) => (
                    <button
                      key={option}
                      onClick={() => toggleDietaryPreference(option)}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        profileForm.dietary_preferences?.includes(option)
                          ? 'border-orange-500 bg-orange-50 text-orange-700'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <Utensils className="w-4 h-4" />
                        <span className="font-medium">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={updateProfile}
                  disabled={saving}
                  className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === 'favorites' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-900">Favorite Items</h2>
                  <button
                    onClick={() => navigate('/menu')}
                    className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                  >
                    Browse Menu
                  </button>
                </div>

                {favorites.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No favorite items yet</p>
                    <p className="text-sm text-gray-500 mt-2">Mark items as favorites while browsing the menu</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {favorites.map((item) => (
                      <div key={item.id} className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                        {item.image_url && (
                          <img
                            src={item.image_url}
                            alt={item.name}
                            className="w-full h-40 object-cover"
                          />
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                            <button
                              onClick={() => removeFavorite(item.id)}
                              className="text-red-500 hover:text-red-600"
                            >
                              <Heart className="w-5 h-5 fill-current" />
                            </button>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-orange-600">₹{item.price}</span>
                            <button
                              onClick={() => navigate('/menu')}
                              className="px-3 py-1 bg-orange-500 text-white text-sm rounded-lg hover:bg-orange-600"
                            >
                              Order Now
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Loyalty Tab */}
            {activeTab === 'loyalty' && loyaltyAccount && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Loyalty Program</h2>
                
                <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-orange-100 text-sm">Current Tier</p>
                      <h3 className="text-2xl font-bold">{loyaltyAccount.current_tier}</h3>
                    </div>
                    <Award className="w-12 h-12 text-orange-100" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-orange-100 text-sm">Points Balance</p>
                      <p className="text-2xl font-bold">{loyaltyAccount.points_balance}</p>
                    </div>
                    <div>
                      <p className="text-orange-100 text-sm">Lifetime Points</p>
                      <p className="text-2xl font-bold">{loyaltyAccount.lifetime_points}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Referral Program</h3>
                  <p className="text-gray-600 mb-4">
                    Share your referral code and earn <strong>250 points</strong> when someone signs up!
                  </p>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={loyaltyAccount.referral_code}
                      readOnly
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(loyaltyAccount.referral_code);
                        setSuccess('Referral code copied!');
                        setTimeout(() => setSuccess(''), 3000);
                      }}
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                    >
                      Copy
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/loyalty')}
                  className="w-full px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                >
                  View Full Loyalty Dashboard
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;

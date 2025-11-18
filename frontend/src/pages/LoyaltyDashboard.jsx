import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Award, TrendingUp, Gift, Users, ArrowRight, Star,
  Calendar, Check, Copy, ExternalLink, Sparkles
} from 'lucide-react';
import api from '../services/api';

const LoyaltyDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [loyaltyAccount, setLoyaltyAccount] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [redeemAmount, setRedeemAmount] = useState(100);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchLoyaltyData();
  }, []);

  const fetchLoyaltyData = async () => {
    try {
      setLoading(true);
      const [accountRes, transactionsRes, statsRes, tiersRes] = await Promise.all([
        api.get('/loyalty/account'),
        api.get('/loyalty/transactions?page=1&page_size=10'),
        api.get('/loyalty/stats'),
        api.get('/loyalty/tiers')
      ]);

      setLoyaltyAccount(accountRes.data);
      setTransactions(transactionsRes.data);
      setStats(statsRes.data);
      setTiers(tiersRes.data);
    } catch (err) {
      setError('Failed to load loyalty data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const redeemPoints = async () => {
    try {
      if (redeemAmount > loyaltyAccount.points_balance) {
        setError('Insufficient points balance');
        return;
      }

      const response = await api.post('/loyalty/redeem', { points: redeemAmount });
      setSuccess(`Redeemed ${redeemAmount} points! Discount code: ${response.data.discount_code}`);
      fetchLoyaltyData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to redeem points');
      setTimeout(() => setError(''), 3000);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${loyaltyAccount.referral_code}`;
    navigator.clipboard.writeText(link);
    setSuccess('Referral link copied to clipboard!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const getTierColor = (tier) => {
    const colors = {
      Bronze: 'from-orange-400 to-orange-600',
      Silver: 'from-gray-300 to-gray-500',
      Gold: 'from-yellow-400 to-yellow-600',
      Platinum: 'from-purple-400 to-purple-600'
    };
    return colors[tier] || 'from-gray-400 to-gray-600';
  };

  const getTierIcon = (tier) => {
    const icons = {
      Bronze: '🥉',
      Silver: '🥈',
      Gold: '🥇',
      Platinum: '💎'
    };
    return icons[tier] || '⭐';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading loyalty data...</p>
        </div>
      </div>
    );
  }

  if (!loyaltyAccount) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600">No loyalty account found</p>
        </div>
      </div>
    );
  }

  const nextTier = tiers.find(t => t.min_points > loyaltyAccount.lifetime_points);
  const pointsToNextTier = nextTier ? nextTier.min_points - loyaltyAccount.lifetime_points : 0;
  const currentTierInfo = tiers.find(t => t.name === loyaltyAccount.current_tier);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Loyalty Rewards</h1>
          <p className="text-gray-600">Track your points, tier status, and exclusive benefits</p>
        </div>

        {/* Main Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Current Tier */}
          <div className={`bg-gradient-to-r ${getTierColor(loyaltyAccount.current_tier)} rounded-lg p-6 text-white shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-white/80 text-sm mb-1">Current Tier</p>
                <h2 className="text-3xl font-bold">{loyaltyAccount.current_tier}</h2>
              </div>
              <div className="text-5xl">{getTierIcon(loyaltyAccount.current_tier)}</div>
            </div>
            {currentTierInfo && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/80">Discount</span>
                  <span className="font-semibold">{currentTierInfo.discount_percentage}%</span>
                </div>
                {currentTierInfo.benefits && (
                  <div className="pt-2 border-t border-white/20">
                    <p className="text-xs text-white/80">{currentTierInfo.benefits}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Points Balance */}
          <div className="bg-white rounded-lg p-6 shadow-lg border-2 border-orange-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Points Balance</p>
                <h2 className="text-3xl font-bold text-orange-600">{loyaltyAccount.points_balance}</h2>
              </div>
              <Sparkles className="w-12 h-12 text-orange-500" />
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Lifetime Points</span>
                <span className="font-semibold text-gray-900">{loyaltyAccount.lifetime_points}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Points Used</span>
                <span className="font-semibold text-gray-900">{loyaltyAccount.points_used}</span>
              </div>
            </div>
          </div>

          {/* Next Tier Progress */}
          <div className="bg-white rounded-lg p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-600 text-sm mb-1">Next Tier</p>
                <h2 className="text-2xl font-bold text-gray-900">
                  {nextTier ? nextTier.name : 'Max Tier! 🎉'}
                </h2>
              </div>
              <TrendingUp className="w-12 h-12 text-green-500" />
            </div>
            {nextTier ? (
              <>
                <div className="mb-2">
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress</span>
                    <span className="font-semibold text-gray-900">
                      {Math.round((loyaltyAccount.lifetime_points / nextTier.min_points) * 100)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all"
                      style={{ width: `${Math.min((loyaltyAccount.lifetime_points / nextTier.min_points) * 100, 100)}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  <strong className="text-gray-900">{pointsToNextTier}</strong> points to {nextTier.name}
                </p>
              </>
            ) : (
              <p className="text-sm text-gray-600">You've reached the highest tier!</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Redeem Points */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Gift className="w-6 h-6 text-orange-500 mr-2" />
                Redeem Points
              </h3>
              <p className="text-gray-600 mb-4">
                Convert your points into discount vouchers. <strong>100 points = ₹10</strong>
              </p>
              
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Points to Redeem
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(parseInt(e.target.value) || 100)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div className="pt-6">
                  <button
                    onClick={redeemPoints}
                    disabled={redeemAmount > loyaltyAccount.points_balance || redeemAmount < 100}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Redeem ₹{redeemAmount / 10}
                  </button>
                </div>
              </div>
              
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[100, 500, 1000].map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setRedeemAmount(amount)}
                    className="px-3 py-2 border-2 border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50 transition-colors"
                  >
                    {amount} pts = ₹{amount / 10}
                  </button>
                ))}
              </div>
            </div>

            {/* Transaction History */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Calendar className="w-6 h-6 text-orange-500 mr-2" />
                Recent Transactions
              </h3>
              
              {transactions.length === 0 ? (
                <p className="text-gray-600 text-center py-8">No transactions yet</p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div
                      key={transaction.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.transaction_type === 'earn' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {transaction.transaction_type === 'earn' ? (
                            <TrendingUp className="w-5 h-5 text-green-600" />
                          ) : (
                            <Gift className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 capitalize">
                            {transaction.transaction_type}
                          </p>
                          <p className="text-sm text-gray-600">
                            {new Date(transaction.created_at).toLocaleDateString()} • {transaction.description}
                          </p>
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${
                        transaction.transaction_type === 'earn' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.transaction_type === 'earn' ? '+' : '-'}{transaction.points}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tier Benefits */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
                <Star className="w-6 h-6 text-orange-500 mr-2" />
                All Tier Benefits
              </h3>
              
              <div className="space-y-4">
                {tiers.map((tier, index) => {
                  const isCurrentTier = tier.name === loyaltyAccount.current_tier;
                  const isAchieved = loyaltyAccount.lifetime_points >= tier.min_points;
                  
                  return (
                    <div
                      key={tier.name}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        isCurrentTier
                          ? 'border-orange-500 bg-orange-50'
                          : isAchieved
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <span className="text-3xl">{getTierIcon(tier.name)}</span>
                          <div>
                            <h4 className="font-semibold text-gray-900 flex items-center">
                              {tier.name}
                              {isCurrentTier && (
                                <span className="ml-2 px-2 py-1 text-xs bg-orange-500 text-white rounded-full">
                                  Current
                                </span>
                              )}
                              {isAchieved && !isCurrentTier && (
                                <Check className="w-5 h-5 text-green-600 ml-2" />
                              )}
                            </h4>
                            <p className="text-sm text-gray-600">
                              {tier.min_points === 0 ? 'Starting tier' : `${tier.min_points}+ points`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-600">
                            {tier.discount_percentage}%
                          </p>
                          <p className="text-xs text-gray-600">discount</p>
                        </div>
                      </div>
                      {tier.benefits && (
                        <p className="text-sm text-gray-600 mt-2">{tier.benefits}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            {/* Referral Program */}
            <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg p-6 text-white">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Refer & Earn</h3>
                <Users className="w-8 h-8 text-white/80" />
              </div>
              
              <p className="text-white/90 mb-4 text-sm">
                Share your referral code and earn <strong>250 points</strong> for each friend who signs up!
              </p>

              <div className="bg-white/20 backdrop-blur rounded-lg p-3 mb-3">
                <p className="text-white/80 text-xs mb-1">Your Referral Code</p>
                <p className="text-2xl font-bold font-mono">{loyaltyAccount.referral_code}</p>
              </div>

              <button
                onClick={copyReferralLink}
                className="w-full bg-white text-purple-600 py-2 rounded-lg hover:bg-white/90 transition-colors flex items-center justify-center space-x-2"
              >
                <Copy className="w-4 h-4" />
                <span className="font-medium">Copy Referral Link</span>
              </button>

              {stats && stats.referrals_count > 0 && (
                <div className="mt-4 pt-4 border-t border-white/20">
                  <div className="flex items-center justify-between">
                    <span className="text-white/80 text-sm">Successful Referrals</span>
                    <span className="text-xl font-bold">{stats.referrals_count}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            {stats && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Points This Month</span>
                    <span className="font-bold text-gray-900">{stats.points_earned_this_month}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Points This Year</span>
                    <span className="font-bold text-gray-900">{stats.points_earned_this_year}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Redeemed</span>
                    <span className="font-bold text-gray-900">{stats.points_redeemed}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Money Saved</span>
                    <span className="font-bold text-green-600">₹{stats.money_saved}</span>
                  </div>
                </div>
              </div>
            )}

            {/* How to Earn */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">How to Earn Points</h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Earn <strong>1 point</strong> for every ₹10 spent</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Get <strong>500 points</strong> when someone uses your referral code</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Redeem points anytime for instant discounts</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-gray-700">Higher tiers unlock bigger discounts automatically</span>
                </li>
              </ul>
            </div>

            {/* CTA */}
            <button
              onClick={() => navigate('/menu')}
              className="w-full bg-orange-500 text-white py-3 rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center space-x-2"
            >
              <span className="font-medium">Start Earning Points</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyDashboard;

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Mail,
  MessageSquare,
  Send,
  Users,
  UserCheck,
  UserPlus,
  Calendar,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';
import api from '../../services/api';

const EmailCampaignManager = () => {
  const [activeTab, setActiveTab] = useState('email'); // email or sms
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // Email Campaign State
  const [emailCampaign, setEmailCampaign] = useState({
    subject: '',
    title: '',
    subtitle: '',
    description: '',
    offer_details: [''],
    cta_text: 'Order Now',
    cta_link: 'http://localhost:5173',
    valid_until: '',
    image_url: '',
    recipient_filter: 'all',
    recipient_emails: []
  });

  // SMS Campaign State
  const [smsCampaign, setSmsCampaign] = useState({
    message: '',
    recipient_filter: 'all',
    recipient_phones: []
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await api.get('/auth/users', {
        params: { role: 'customer', is_active: true }
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    }
  };

  const handleEmailCampaignChange = (field, value) => {
    setEmailCampaign({ ...emailCampaign, [field]: value });
  };

  const handleSMSCampaignChange = (field, value) => {
    setSmsCampaign({ ...smsCampaign, [field]: value });
  };

  const addOfferDetail = () => {
    setEmailCampaign({
      ...emailCampaign,
      offer_details: [...emailCampaign.offer_details, '']
    });
  };

  const updateOfferDetail = (index, value) => {
    const newOffers = [...emailCampaign.offer_details];
    newOffers[index] = value;
    setEmailCampaign({ ...emailCampaign, offer_details: newOffers });
  };

  const removeOfferDetail = (index) => {
    const newOffers = emailCampaign.offer_details.filter((_, i) => i !== index);
    setEmailCampaign({ ...emailCampaign, offer_details: newOffers });
  };

  const handleSendEmailCampaign = async () => {
    if (!emailCampaign.subject || !emailCampaign.title) {
      toast.error('Please fill in subject and title');
      return;
    }

    if (emailCampaign.recipient_filter === 'specific' && emailCampaign.recipient_emails.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setLoading(true);
    try {
      // Filter out empty offer details
      const cleanedCampaign = {
        ...emailCampaign,
        offer_details: emailCampaign.offer_details.filter(detail => detail.trim() !== '')
      };

      const response = await api.post('/notifications/email/promotional', cleanedCampaign);
      toast.success(`Email campaign sent to ${response.data.recipient_count} recipients!`);
      
      // Reset form
      setEmailCampaign({
        subject: '',
        title: '',
        subtitle: '',
        description: '',
        offer_details: [''],
        cta_text: 'Order Now',
        cta_link: 'http://localhost:5173',
        valid_until: '',
        image_url: '',
        recipient_filter: 'all',
        recipient_emails: []
      });
    } catch (error) {
      console.error('Error sending email campaign:', error);
      toast.error(error.response?.data?.detail || 'Failed to send email campaign');
    } finally {
      setLoading(false);
    }
  };

  const handleSendSMSCampaign = async () => {
    if (!smsCampaign.message) {
      toast.error('Please enter SMS message');
      return;
    }

    if (smsCampaign.recipient_filter === 'specific' && smsCampaign.recipient_phones.length === 0) {
      toast.error('Please select at least one recipient');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/notifications/sms/promotional', smsCampaign);
      toast.success(`SMS campaign sent to ${response.data.recipient_count} recipients!`);
      
      // Reset form
      setSmsCampaign({
        message: '',
        recipient_filter: 'all',
        recipient_phones: []
      });
    } catch (error) {
      console.error('Error sending SMS campaign:', error);
      toast.error(error.response?.data?.detail || 'Failed to send SMS campaign');
    } finally {
      setLoading(false);
    }
  };

  const toggleCustomerSelection = (customer, type) => {
    if (type === 'email') {
      const isSelected = emailCampaign.recipient_emails.includes(customer.email);
      setEmailCampaign({
        ...emailCampaign,
        recipient_emails: isSelected
          ? emailCampaign.recipient_emails.filter(e => e !== customer.email)
          : [...emailCampaign.recipient_emails, customer.email]
      });
    } else {
      const isSelected = smsCampaign.recipient_phones.includes(customer.phone);
      setSmsCampaign({
        ...smsCampaign,
        recipient_phones: isSelected
          ? smsCampaign.recipient_phones.filter(p => p !== customer.phone)
          : [...smsCampaign.recipient_phones, customer.phone]
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900">Marketing Campaigns</h2>
        <p className="text-slate-600 mt-1">Send promotional emails and SMS to your customers</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('email')}
          className={`
            flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors
            ${activeTab === 'email'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <Mail size={20} />
          <span className="font-medium">Email Campaign</span>
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          className={`
            flex items-center space-x-2 px-4 py-3 border-b-2 transition-colors
            ${activeTab === 'sms'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
            }
          `}
        >
          <MessageSquare size={20} />
          <span className="font-medium">SMS Campaign</span>
        </button>
      </div>

      {/* Email Campaign Form */}
      {activeTab === 'email' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Email Content</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email Subject *
                </label>
                <input
                  type="text"
                  value={emailCampaign.subject}
                  onChange={(e) => handleEmailCampaignChange('subject', e.target.value)}
                  placeholder="Special Weekend Offer - 50% Off!"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Main Title *
                </label>
                <input
                  type="text"
                  value={emailCampaign.title}
                  onChange={(e) => handleEmailCampaignChange('title', e.target.value)}
                  placeholder="🎉 Weekend Special Offer!"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={emailCampaign.subtitle}
                  onChange={(e) => handleEmailCampaignChange('subtitle', e.target.value)}
                  placeholder="Get amazing discounts this weekend"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={emailCampaign.description}
                  onChange={(e) => handleEmailCampaignChange('description', e.target.value)}
                  placeholder="Describe your offer in detail..."
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Offer Details
                  </label>
                  <button
                    onClick={addOfferDetail}
                    className="flex items-center space-x-1 text-sm text-primary-600 hover:text-primary-700"
                  >
                    <Plus size={16} />
                    <span>Add Detail</span>
                  </button>
                </div>
                <div className="space-y-2">
                  {emailCampaign.offer_details.map((detail, index) => (
                    <div key={index} className="flex gap-2">
                      <input
                        type="text"
                        value={detail}
                        onChange={(e) => updateOfferDetail(index, e.target.value)}
                        placeholder="e.g., 50% off on all pizzas"
                        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      />
                      {emailCampaign.offer_details.length > 1 && (
                        <button
                          onClick={() => removeOfferDetail(index)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <Calendar className="inline mr-1" size={16} />
                  Valid Until
                </label>
                <input
                  type="text"
                  value={emailCampaign.valid_until}
                  onChange={(e) => handleEmailCampaignChange('valid_until', e.target.value)}
                  placeholder="December 31, 2025"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <ImageIcon className="inline mr-1" size={16} />
                  Image URL
                </label>
                <input
                  type="text"
                  value={emailCampaign.image_url}
                  onChange={(e) => handleEmailCampaignChange('image_url', e.target.value)}
                  placeholder="https://example.com/banner.jpg"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Button Text
                </label>
                <input
                  type="text"
                  value={emailCampaign.cta_text}
                  onChange={(e) => handleEmailCampaignChange('cta_text', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  <LinkIcon className="inline mr-1" size={16} />
                  Button Link
                </label>
                <input
                  type="text"
                  value={emailCampaign.cta_link}
                  onChange={(e) => handleEmailCampaignChange('cta_link', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Recipients</h3>

            <div className="flex gap-3">
              <button
                onClick={() => handleEmailCampaignChange('recipient_filter', 'all')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors
                  ${emailCampaign.recipient_filter === 'all'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <Users size={20} />
                <span className="font-medium">All Users</span>
              </button>

              <button
                onClick={() => handleEmailCampaignChange('recipient_filter', 'customers')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors
                  ${emailCampaign.recipient_filter === 'customers'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <UserCheck size={20} />
                <span className="font-medium">Customers Only</span>
              </button>

              <button
                onClick={() => handleEmailCampaignChange('recipient_filter', 'specific')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors
                  ${emailCampaign.recipient_filter === 'specific'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <UserPlus size={20} />
                <span className="font-medium">Specific Users</span>
              </button>
            </div>

            {emailCampaign.recipient_filter === 'specific' && (
              <div className="mt-4 max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                {customers.filter(c => c.email).map((customer) => (
                  <label
                    key={customer.id}
                    className="flex items-center p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={emailCampaign.recipient_emails.includes(customer.email)}
                      onChange={() => toggleCustomerSelection(customer, 'email')}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-slate-900">{customer.full_name || customer.username}</div>
                      <div className="text-sm text-slate-600">{customer.email}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {emailCampaign.recipient_filter === 'specific' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-800">
                  <strong>{emailCampaign.recipient_emails.length}</strong> recipient(s) selected
                </p>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendEmailCampaign}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send Email Campaign</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* SMS Campaign Form */}
      {activeTab === 'sms' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">SMS Content</h3>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                SMS Message * (160 characters max recommended)
              </label>
              <textarea
                value={smsCampaign.message}
                onChange={(e) => handleSMSCampaignChange('message', e.target.value)}
                placeholder="🎉 Special offer this weekend! Get 50% off on all orders. Use code: WEEKEND50. Order now!"
                rows={4}
                maxLength={160}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <p className="text-sm text-slate-500 mt-1">
                {smsCampaign.message.length}/160 characters
              </p>
            </div>
          </div>

          {/* Recipients */}
          <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4">
            <h3 className="text-lg font-semibold text-slate-900">Recipients</h3>

            <div className="flex gap-3">
              <button
                onClick={() => handleSMSCampaignChange('recipient_filter', 'all')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors
                  ${smsCampaign.recipient_filter === 'all'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <Users size={20} />
                <span className="font-medium">All Users</span>
              </button>

              <button
                onClick={() => handleSMSCampaignChange('recipient_filter', 'customers')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors
                  ${smsCampaign.recipient_filter === 'customers'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <UserCheck size={20} />
                <span className="font-medium">Customers Only</span>
              </button>

              <button
                onClick={() => handleSMSCampaignChange('recipient_filter', 'specific')}
                className={`
                  flex-1 flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border-2 transition-colors
                  ${smsCampaign.recipient_filter === 'specific'
                    ? 'border-primary-600 bg-primary-50 text-primary-700'
                    : 'border-slate-300 hover:border-slate-400'
                  }
                `}
              >
                <UserPlus size={20} />
                <span className="font-medium">Specific Users</span>
              </button>
            </div>

            {smsCampaign.recipient_filter === 'specific' && (
              <div className="mt-4 max-h-64 overflow-y-auto border border-slate-200 rounded-lg">
                {customers.filter(c => c.phone).map((customer) => (
                  <label
                    key={customer.id}
                    className="flex items-center p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                  >
                    <input
                      type="checkbox"
                      checked={smsCampaign.recipient_phones.includes(customer.phone)}
                      onChange={() => toggleCustomerSelection(customer, 'sms')}
                      className="w-4 h-4 text-primary-600 rounded focus:ring-2 focus:ring-primary-500"
                    />
                    <div className="ml-3 flex-1">
                      <div className="font-medium text-slate-900">{customer.full_name || customer.username}</div>
                      <div className="text-sm text-slate-600">{customer.phone}</div>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {smsCampaign.recipient_filter === 'specific' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start space-x-2">
                <AlertCircle className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-blue-800">
                  <strong>{smsCampaign.recipient_phones.length}</strong> recipient(s) selected
                </p>
              </div>
            )}
          </div>

          {/* Send Button */}
          <div className="flex justify-end">
            <button
              onClick={handleSendSMSCampaign}
              disabled={loading}
              className="flex items-center space-x-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-slate-400 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <Send size={20} />
                  <span>Send SMS Campaign</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default EmailCampaignManager;

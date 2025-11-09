import React, { useState, useEffect } from 'react';
import { chefAPI } from '../../services/api';
import { Send, MessageSquare, AlertCircle, Info, HelpCircle } from 'lucide-react';

const ChefMessaging = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState({
    recipient_role: 'staff',
    type: 'info',
    message: '',
  });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  const fetchMessages = async () => {
    try {
      const data = await chefAPI.getMessages();
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 15000); // Refresh every 15 seconds
    return () => clearInterval(interval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.message.trim()) return;

    try {
      await chefAPI.sendMessage(newMessage);
      setNewMessage({ recipient_role: 'staff', type: 'info', message: '' });
      fetchMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message');
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await chefAPI.markMessageRead(messageId);
      fetchMessages();
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const getRelativeTime = (dateString) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000 / 60); // minutes

    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} min ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)} hr ago`;
    return date.toLocaleDateString();
  };

  const filteredMessages = filter === 'all' 
    ? messages 
    : messages.filter(m => m.type === filter);

  const typeConfig = {
    info: { icon: Info, color: 'blue', label: 'Info' },
    urgent: { icon: AlertCircle, color: 'red', label: 'Urgent' },
    request: { icon: HelpCircle, color: 'orange', label: 'Request' },
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 flex items-center gap-3">
        <MessageSquare className="w-8 h-8" />
        Kitchen Messages
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Messages List */}
        <div className="lg:col-span-2">
          {/* Filters */}
          <div className="flex gap-2 mb-4 flex-wrap">
            {['all', 'info', 'urgent', 'request'].map(type => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded font-medium transition-colors ${
                  filter === type
                    ? 'bg-primary-600 text-white'
                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
                {type !== 'all' && ` (${messages.filter(m => m.type === type).length})`}
              </button>
            ))}
          </div>

          {/* Message List */}
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              </div>
            ) : filteredMessages.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No messages
              </div>
            ) : (
              filteredMessages.map(msg => {
                const config = typeConfig[msg.type] || typeConfig.info;
                const Icon = config.icon;
                
                return (
                  <div
                    key={msg.id}
                    className={`card p-4 ${!msg.is_read ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                    onClick={() => !msg.is_read && handleMarkRead(msg.id)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold">
                          {msg.sender?.full_name || msg.sender?.username || 'System'}
                        </span>
                        <span className="text-xs px-2 py-1 bg-slate-200 rounded-full">
                          {msg.sender?.role}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        {getRelativeTime(msg.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-start gap-2">
                      <Icon className={`w-5 h-5 text-${config.color}-600 flex-shrink-0 mt-1`} />
                      <div className="flex-1">
                        <div className={`inline-block px-2 py-0.5 rounded text-xs font-medium bg-${config.color}-100 text-${config.color}-700 mb-2`}>
                          {config.label}
                        </div>
                        <p className="text-slate-700">{msg.message}</p>
                      </div>
                    </div>
                    
                    {!msg.is_read && (
                      <div className="mt-2 text-right">
                        <button
                          onClick={() => handleMarkRead(msg.id)}
                          className="text-sm text-primary-600 hover:text-primary-700"
                        >
                          Mark as read
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Compose Message */}
        <div>
          <div className="card p-6 sticky top-6">
            <h2 className="text-xl font-bold mb-4">Send Message</h2>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">To</label>
                <select
                  value={newMessage.recipient_role}
                  onChange={(e) => setNewMessage({ ...newMessage, recipient_role: e.target.value })}
                  className="input-field"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type</label>
                <div className="space-y-2">
                  {['info', 'urgent', 'request'].map(type => (
                    <label key={type} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="type"
                        value={type}
                        checked={newMessage.type === type}
                        onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                        className="w-4 h-4"
                      />
                      <span className={`px-2 py-1 rounded text-sm font-medium bg-${typeConfig[type].color}-100 text-${typeConfig[type].color}-700`}>
                        {typeConfig[type].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Message</label>
                <textarea
                  value={newMessage.message}
                  onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                  rows="4"
                  className="input-field resize-none"
                  placeholder="Type your message..."
                  required
                />
              </div>

              <button type="submit" className="btn-primary w-full flex items-center justify-center gap-2">
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChefMessaging;

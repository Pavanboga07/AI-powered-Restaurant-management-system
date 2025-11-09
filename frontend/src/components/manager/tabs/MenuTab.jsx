import React from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';

/**
 * Menu Management Tab Component
 * @component
 */
const MenuTab = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Menu Management</h2>
          <p className="text-slate-400">Manage your restaurant menu items</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={20} />
          Add Menu Item
        </motion.button>
      </div>

      {/* Search Bar */}
      <div className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input
            type="text"
            placeholder="Search menu items..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
      </div>

      {/* Menu Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: item * 0.05 }}
            className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6 hover:border-primary-500 transition-colors"
          >
            <div className="h-48 bg-slate-800 rounded-lg mb-4 flex items-center justify-center text-slate-500">
              Menu Item {item}
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Item Name</h3>
            <p className="text-slate-400 text-sm mb-3">Category • $00.00</p>
            <div className="flex gap-2">
              <button className="flex-1 btn-secondary text-sm">Edit</button>
              <button className="flex-1 btn-secondary text-sm">Delete</button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default MenuTab;

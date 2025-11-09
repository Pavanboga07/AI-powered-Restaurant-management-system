import React from 'react';
import { motion } from 'framer-motion';

/**
 * Generic Tab Placeholder Component
 * @component
 * @param {Object} props - Component props
 * @param {string} props.title - Tab title
 * @param {string} props.description - Tab description
 * @param {React.ReactNode} props.icon - Icon component
 */
const TabPlaceholder = ({ title, description, icon }) => {
  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-12 text-center"
      >
        <div className="flex justify-center mb-6">
          <div className="p-6 bg-primary-500/20 rounded-full">
            {icon}
          </div>
        </div>
        <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
        <p className="text-slate-400 text-lg mb-8">{description}</p>
        <div className="inline-block px-6 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400">
          Coming Soon
        </div>
      </motion.div>

      {/* Feature Preview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: item * 0.1 }}
            className="bg-white/10 backdrop-blur-xl border border-slate-700 rounded-xl p-6"
          >
            <div className="h-32 bg-slate-800/50 rounded-lg mb-4 flex items-center justify-center">
              <span className="text-slate-500">Feature {item}</span>
            </div>
            <h3 className="text-white font-semibold mb-2">Feature Title</h3>
            <p className="text-slate-400 text-sm">Feature description placeholder</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TabPlaceholder;

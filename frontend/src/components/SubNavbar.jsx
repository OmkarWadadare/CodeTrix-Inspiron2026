import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, CheckCircle, Clock } from 'lucide-react';

export default function SubNavbar({ activeTab, setActiveTab }) {

  const tabs = [
    { name: 'Upload document', icon: UploadCloud },
    { name: 'Proofreading', icon: CheckCircle },
    { name: 'Translation history', icon: Clock },
  ];

  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4,
        staggerChildren: 0.15
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="w-full flex justify-center my-8 z-40 relative px-4">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="glass-dark rounded-full p-2.5 flex flex-wrap justify-center items-center gap-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.name;
          return (
            <motion.button
              variants={itemVariants}
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              whileHover={{ y: -4, scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`relative overflow-hidden flex items-center gap-2 px-6 py-3 rounded-full text-sm font-medium transition-colors duration-300 ${
                isActive ? 'text-midnight' : 'text-gray-300 hover:text-white hover:bg-white/10'
              }`}
            >
              {isActive && (
                <motion.div 
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 bg-gradient-to-r from-gold to-yellow-400 rounded-full shadow-[0_0_15px_rgba(242,174,46,0.6)]"
                  initial={false}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <Icon className="w-4 h-4" />
                {tab.name}
              </span>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}

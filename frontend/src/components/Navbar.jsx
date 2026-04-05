import React from 'react';
import { motion } from 'framer-motion';
import { User, LogIn } from 'lucide-react';

export default function Navbar({ onAuthRequired }) {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
      className="w-full px-8 py-6 flex flex-col sm:flex-row items-center justify-between z-50 relative gap-4"
    >
      <div className="flex flex-col items-center sm:items-start group cursor-pointer">
        <div className="flex items-center gap-3">
          <motion.img
            src="/logo.png"
            alt="TransLuna Logo"
            className="w-12 h-12 object-contain drop-shadow-[0_0_15px_rgba(242,174,46,0.6)]"
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ scale: 1.1, rotate: 15, transition: { duration: 0.3 } }}
          />
          <h1 className="text-4xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gold bg-[length:200%_auto] hover:bg-right transition-all duration-700">
            TransLuna
          </h1>
        </div>
        <p className="text-sm text-gray-400 mt-1 font-light italic group-hover:text-gold/80 transition-colors duration-300 ml-1">
          your personalized Ai translation workspace.
        </p>
      </div>

      <div className="flex items-center gap-4 mt-4 sm:mt-0">
        <motion.button
          onClick={onAuthRequired}
          whileHover={{ y: -5, scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full glass hover:bg-white/20 hover:text-white transition-colors duration-300 font-medium text-gray-200"
        >
          <LogIn className="w-4 h-4" /> Sign In
        </motion.button>
        <motion.button
          onClick={onAuthRequired}
          whileHover={{ y: -5, scale: 1.05, boxShadow: "0 0 25px rgba(242,174,46,0.8)" }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-gold to-yellow-500 text-midnight font-bold transition-all duration-300 shadow-[0_0_15px_rgba(242,174,46,0.5)]"
        >
          <User className="w-4 h-4" /> Sign Up
        </motion.button>
      </div>
    </motion.nav>
  );
}

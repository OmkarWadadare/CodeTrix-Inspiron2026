import React from 'react';
import { motion } from 'framer-motion';
import { FileText, ArrowRight } from 'lucide-react';

export default function HeroLeft() {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.6, type: "spring" }}
      className="flex flex-col items-start justify-center gap-14 w-full lg:w-1/2 mt-12 lg:mt-0 z-30"
    >
      
      {/* Scanning Document Animation */}
      <motion.div 
        whileHover={{ scale: 1.05 }}
        className="flex items-center gap-6 group cursor-pointer"
      >
        <div className="relative w-32 h-40 border-2 border-dashed border-gray-400 group-hover:border-gold rounded-2xl flex items-center justify-center overflow-hidden bg-space/20 glass-dark transition-colors duration-500 shadow-[0_0_30px_rgba(58,52,91,0.5)]">
          <FileText className="w-12 h-12 text-white/50 group-hover:text-gold transition-colors duration-500" />
          
          <div 
            className="absolute left-0 w-full h-[2px] bg-gold shadow-[0_0_20px_4px_rgba(242,174,46,0.8)]"
            style={{ animation: 'scan 2.5s ease-in-out infinite' }}
          />
          <style>{`
            @keyframes scan {
              0%, 100% { top: -10%; }
              50% { top: 110%; }
            }
          `}</style>
        </div>
        <div className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-tr from-white to-gray-400 group-hover:to-gold transition-all duration-500">
           Analyzing context...
        </div>
      </motion.div>

      {/* Astronaut Bubble */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative">
        <motion.div 
           className="w-28 h-28 flex-shrink-0"
           animate={{ y: [0, -15, 0], rotate: [-2, 2, -2] }}
           transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_0_25px_rgba(242,174,46,0.3)] hover:drop-shadow-[0_0_35px_rgba(242,174,46,0.6)] transition-all cursor-pointer">
            <circle cx="50" cy="50" r="45" fill="url(#astroGrad)" stroke="#F2AE2E" strokeWidth="3"/>
            <rect x="20" y="32" width="60" height="38" rx="19" fill="#15191E" stroke="#F2AE2E" strokeWidth="2.5"/>
            <path d="M28 50 Q50 65 72 50" stroke="#F2AE2E" strokeWidth="2" strokeLinecap="round" opacity="0.8"/>
            <circle cx="35" cy="42" r="3.5" fill="#FFFFFF" className="animate-pulse"/>
            <circle cx="65" cy="42" r="3.5" fill="#FFFFFF" className="animate-pulse"/>
            <defs>
              <linearGradient id="astroGrad" x1="0" y1="0" x2="100" y2="100">
                <stop offset="0%" stopColor="#3A345B" />
                <stop offset="100%" stopColor="#1a1532" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>

        <motion.div 
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 0.5, delay: 1 }}
           className="relative glass p-6 rounded-3xl rounded-tl-none border border-gold/30 sm:max-w-md shadow-[0_15px_30px_rgba(0,0,0,0.4)] backdrop-blur-xl"
        >
          {/* A small tail for the speech bubble */}
          <div className="absolute top-0 left-[-15px] w-0 h-0 border-t-[15px] border-t-gold/30 border-l-[15px] border-l-transparent pointer-events-none"></div>

          <p className="text-gray-100 leading-relaxed text-[15px]">
            <strong className="text-gold text-lg tracking-wide uppercase block mb-1">Welcome to TransLuna!</strong> 
            Your one stop AI powered translation workspace with all the features in one place to make your translation the best and most efficient. 
          </p>
          <div className="mt-5 flex items-center font-bold text-white group cursor-pointer w-max bg-white/5 px-4 py-2 rounded-full border border-white/10 hover:border-gold/50 transition-all">
            Click here to upload your document 
            <motion.div
               animate={{ x: [0, 8, 0] }}
               transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowRight className="ml-2 w-5 h-5 text-gold group-hover:text-yellow-300 transition-colors" />
            </motion.div>
          </div>
        </motion.div>

      </div>
    </motion.div>
  );
}

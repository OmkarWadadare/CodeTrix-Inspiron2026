import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import HeroLeft from './HeroLeft';
import HeroRight from './HeroRight';

export default function UploadView({ onAuthRequired, isAuthenticated, onNext, onUploadComplete, onUploadError, uploadError }) {
  return (
    <motion.div 
      className="flex-grow flex flex-col lg:flex-row items-center justify-between w-full h-full relative"
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <HeroLeft />
      <HeroRight 
        onAuthRequired={onAuthRequired} 
        isAuthenticated={isAuthenticated} 
        onUploadComplete={onUploadComplete}
        onUploadError={onUploadError}
      />

      {uploadError && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500/20 border border-red-400/30 text-red-400 px-6 py-3 rounded-xl text-sm font-medium max-w-md text-center">
          {uploadError}
        </div>
      )}

      <motion.button
        onClick={onNext}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        whileHover={{ scale: 1.2, x: 5 }}
        whileTap={{ scale: 0.9 }}
        className="absolute right-[-40px] top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center w-12 h-12 rounded-full glass-panel hover:bg-gold/20 text-gold transition-colors z-50"
        title="Go to Proofreading"
      >
        <ChevronRight className="w-8 h-8" />
      </motion.button>
    </motion.div>
  );
}

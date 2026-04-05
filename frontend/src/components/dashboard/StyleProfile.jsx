import React from 'react';
import { motion } from 'framer-motion';
import { Megaphone, Wrench, Briefcase } from 'lucide-react';

const styles = [
  { id: 'marketing', title: 'Marketing', icon: Megaphone, desc: 'Creative, persuasive, and localized for target branding.', color: 'from-pink-500 to-rose-500' },
  { id: 'technical', title: 'Technical', icon: Wrench, desc: 'Precise, literal translation preserving strict terminology.', color: 'from-blue-500 to-cyan-500' },
  { id: 'office', title: 'Office Level', icon: Briefcase, desc: 'Professional, neutral tone suited for corporate communications.', color: 'from-gold to-yellow-600' }
];

export default function StyleProfile() {
  return (
    <div className="w-full">
      <h2 className="text-3xl font-bold text-white mb-6">Style Profile</h2>
      <p className="text-gray-400 mb-8 max-w-2xl">
        Select the preferred tone and terminology strictness for your organization's automated translations.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {styles.map((style, i) => (
          <motion.div
            key={style.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
            className="glass-dark p-6 rounded-3xl border border-white/10 hover:border-white/30 cursor-pointer group relative overflow-hidden"
          >
            <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${style.color} rounded-full blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity`} />
            
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${style.color} text-white shadow-lg`}>
              <style.icon className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{style.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">{style.desc}</p>
            
            <div className="mt-6 flex items-center text-sm font-bold text-gray-300 group-hover:text-white transition-colors">
              <span className="w-2 h-2 rounded-full bg-green-400 mr-2 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              Activate Profile
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

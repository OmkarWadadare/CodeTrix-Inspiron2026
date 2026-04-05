import React from 'react';
import { motion } from 'framer-motion';
import { Rocket, UploadCloud, FileSearch, RefreshCw, CheckCircle, Download } from 'lucide-react';

const steps = [
  { id: 1, title: 'Upload Document', icon: UploadCloud, align: 'left' },
  { id: 2, title: 'Source Validation', icon: FileSearch, align: 'right' },
  { id: 3, title: 'Document Translation', icon: RefreshCw, align: 'left' },
  { id: 4, title: 'Proof-reading approval', icon: CheckCircle, align: 'right' },
  { id: 5, title: 'Download Document', icon: Download, align: 'left' }
];

export default function AnimatedWorkflow() {
  return (
    <div className="w-full max-w-6xl mx-auto py-24 px-4 relative z-20">
      
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.8 }}
        className="text-center mb-20"
      >
        <h2 className="text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-gold to-white uppercase tracking-widest drop-shadow-[0_0_20px_rgba(242,174,46,0.3)]">
          How it Works
        </h2>
        <p className="text-gray-400 mt-4 max-w-2xl mx-auto italic text-lg shadow-black drop-shadow-md">
          A seamless journey from initial upload to a perfectly translated masterpiece!
        </p>
      </motion.div>

      <div className="relative">
        
        {/* The Animated Curving Line Background */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[4px] -translate-x-1/2 bg-white/5 rounded-full overflow-hidden hidden md:block">
           <motion.div 
              className="w-full bg-gradient-to-b from-transparent via-gold to-yellow-500 shadow-[0_0_15px_rgba(242,174,46,1)] h-full"
              initial={{ height: "0%" }}
              whileInView={{ height: "100%" }}
              viewport={{ once: true, margin: "-20%" }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
           />
        </div>

        <div className="flex flex-col gap-12 md:gap-24">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isLeft = step.align === 'left';
            
            return (
              <div key={step.id} className={`flex flex-col md:flex-row items-center w-full relative ${isLeft ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Empty Space for opposing side */}
                <div className="hidden md:block md:w-1/2"></div>
                
                {/* Center Node & Rocket */}
                <div className="absolute left-1/2 -translate-x-[50%] hidden md:flex items-center justify-center">
                  <div className="w-6 h-6 rounded-full bg-space border-4 border-gold shadow-[0_0_15px_rgba(242,174,46,0.8)] z-10 relative">
                     {/* The animated Rocket popping out as the line hits the step */}
                     <motion.div
                       initial={{ opacity: 0, scale: 0, x: isLeft ? -20 : 20 }}
                       whileInView={{ opacity: 1, scale: 1, x: isLeft ? -45 : 45 }}
                       viewport={{ once: true, margin: "-30%" }}
                       transition={{ delay: index * 0.3 + 0.1, type: "spring", stiffness: 200 }}
                       className="absolute top-1/2 -translate-y-1/2 text-gold filter drop-shadow-[0_0_10px_rgba(242,174,46,0.8)]"
                     >
                       <Rocket className="w-8 h-8 rotate-45" />
                     </motion.div>
                  </div>
                </div>

                {/* Content Card */}
                <motion.div 
                  initial={{ opacity: 0, x: isLeft ? -50 : 50, rotate: isLeft ? -5 : 5 }}
                  whileInView={{ opacity: 1, x: 0, rotate: 0 }}
                  viewport={{ once: true, margin: "-20%" }}
                  transition={{ duration: 0.4, delay: index * 0.3 }}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="w-full md:w-[45%] glass-dark p-8 rounded-3xl border-t border-gold/30 hover:border-gold transition-all duration-300 shadow-[0_15px_40px_rgba(0,0,0,0.5)] group relative overflow-hidden"
                >
                  <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-gold/10 rounded-full blur-[40px] group-hover:bg-gold/30 transition-colors duration-500 pointer-events-none"></div>

                  <div className="flex items-center gap-6 mb-2 relative z-10">
                    <div className="w-16 h-16 rounded-full glass flex items-center justify-center text-gold group-hover:text-yellow-300 transition-colors">
                      <Icon className="w-8 h-8" />
                    </div>
                    <div>
                      <div className="text-gold font-bold tracking-widest text-sm mb-1 uppercase">Step {step.id}</div>
                      <h3 className="text-2xl font-bold text-white leading-tight">
                        {step.title}
                      </h3>
                    </div>
                  </div>
                </motion.div>

              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

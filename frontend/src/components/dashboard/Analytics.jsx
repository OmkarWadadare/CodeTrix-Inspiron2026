import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { apiService } from '../../services/api';
import { TrendingUp, FileText } from 'lucide-react';

export default function Analytics() {
  const [data, setData] = useState([]);

  useEffect(() => {
    apiService.getOrganizationData().then(res => setData(res.analytics));
  }, []);

  return (
    <div className="w-full relative pb-10">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">Workspace Analytics</h2>
        <p className="text-gray-400">Review your organization's translation throughput and character counts.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Documents Translated Bar Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-dark p-6 rounded-3xl border border-white/10"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Documents Translated</h3>
              <p className="text-sm text-gray-400">Monthly throughput</p>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                <Tooltip 
                  cursor={{ fill: '#ffffff05' }}
                  contentStyle={{ backgroundColor: '#15191E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', color: '#fff' }} 
                />
                <Bar dataKey="documents" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Characters Translated Area Chart */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-dark p-6 rounded-3xl border border-gold/30 relative overflow-hidden"
        >
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-gold/10 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white">Character Volume</h3>
              <p className="text-sm text-gray-400">Total string characters processed</p>
            </div>
          </div>
          <div className="h-64 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorChars" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F2AE2E" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F2AE2E" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                <XAxis dataKey="month" stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                <YAxis stroke="#ffffff50" tick={{ fill: '#ffffff50', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#15191E', border: '1px solid #F2AE2E50', borderRadius: '12px', color: '#fff' }} 
                />
                <Area type="monotone" dataKey="characters" stroke="#F2AE2E" strokeWidth={3} fillOpacity={1} fill="url(#colorChars)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

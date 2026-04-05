import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DownloadCloud, Eye, Trash2, FileText, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { apiService } from '../services/api';

export default function TranslationHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getAuditLog(50)
      .then(data => {
        const logs = (data.logs || []).map((log, i) => ({
          id: i + 1,
          name: log.source_text?.substring(0, 50) || `Translation #${i + 1}`,
          date: log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A',
          status: log.action?.includes('ACCEPT') || log.action?.includes('TM_MATCH') ? 'Completed' : 'Pending Review',
          type: log.source_text?.length > 100 ? 'document' : 'text',
        }));
        setHistory(logs);
      })
      .catch(() => setHistory([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto py-12 px-4 relative z-20">
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
        className="glass-dark rounded-3xl p-8 border-t border-gold/30 shadow-[0_20px_50px_rgba(0,0,0,0.4)] relative overflow-hidden"
      >
        <div className="absolute top-[-100px] left-[-100px] w-64 h-64 bg-gold/10 rounded-full blur-[80px] pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 relative z-10 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-wide">Translation History</h2>
            <p className="text-gray-400 font-light mt-1">Review your recent translations and approvals.</p>
          </div>
          <button className="px-6 py-2 rounded-full border border-gold/50 text-gold hover:bg-gold/10 transition-colors font-medium">
            View All
          </button>
        </div>

        <div className="overflow-x-auto relative z-10">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-gold animate-spin mr-3" />
              <span className="text-gray-400">Loading history...</span>
            </div>
          ) : (
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                  <th className="pb-4 font-semibold px-4 w-1/2">Document Name</th>
                  <th className="pb-4 font-semibold px-4">Date</th>
                  <th className="pb-4 font-semibold px-4">Status</th>
                  <th className="pb-4 font-semibold px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <motion.tr 
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.05)" }}
                    className="border-b border-white/5 group hover:border-gold/30 transition-all cursor-pointer"
                  >
                    <td className="py-5 px-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg glass flex items-center justify-center text-gray-300 group-hover:text-gold transition-colors">
                          <FileText className="w-5 h-5" />
                        </div>
                        <span className="font-medium text-gray-200 group-hover:text-white transition-colors">{item.name}</span>
                      </div>
                    </td>
                    <td className="py-5 px-4 text-gray-400 whitespace-nowrap">
                      {item.date}
                    </td>
                    <td className="py-5 px-4">
                      {item.status === 'Completed' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-400/10 text-green-400 text-xs font-bold border border-green-400/20 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
                           <CheckCircle className="w-3.5 h-3.5" /> Completed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-400/10 text-yellow-400 text-xs font-bold border border-yellow-400/20 shadow-[0_0_10px_rgba(250,204,21,0.2)]">
                           <Clock className="w-3.5 h-3.5" /> Pending
                        </span>
                      )}
                    </td>
                    <td className="py-5 px-4 text-right">
                      <div className="flex items-center justify-end gap-3 text-gray-400">
                        <motion.button whileHover={{ scale: 1.2 }} className="hover:text-gold transition-colors" title="View">
                           <Eye className="w-5 h-5" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} className="hover:text-blue-400 transition-colors" title="Download">
                           <DownloadCloud className="w-5 h-5" />
                        </motion.button>
                        <motion.button whileHover={{ scale: 1.2 }} className="hover:text-red-400 transition-colors" title="Delete">
                           <Trash2 className="w-5 h-5" />
                        </motion.button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
          
          {!loading && history.length === 0 && (
            <div className="text-center py-12 text-gray-500 italic">No translations found yet.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

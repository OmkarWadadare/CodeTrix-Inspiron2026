import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, X, Trash2 } from 'lucide-react';
import { apiService } from '../../services/api';

export default function Glossary() {
  const [terms, setTerms] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTerm, setNewTerm] = useState({ source_lang: 'en', target_lang: 'fr', source_term: '', target_term: '', context: '' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiService.getGlossary('en', 'fr').then(data => {
      const mapped = (data.glossary || []).map((g, i) => ({ id: `g_${i}`, term: g.source, definition: g.target }));
      setTerms(mapped);
    }).catch(() => setTerms([])).finally(() => setLoading(false));
  }, []);

  const filteredTerms = terms.filter(t => 
    t.term.toLowerCase().includes(search.toLowerCase()) || 
    t.definition.toLowerCase().includes(search.toLowerCase())
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    if (newTerm.source_term && newTerm.target_term) {
      try {
        const res = await apiService.addGlossaryEntry(newTerm);
        if (res.status === 'CONFLICT') {
          alert(`Term already exists: ${res.existing?.target_term}`);
          return;
        }
        setTerms([...terms, { id: `g_${Date.now()}`, term: newTerm.source_term, definition: newTerm.target_term }]);
        setNewTerm({ source_lang: 'en', target_lang: 'fr', source_term: '', target_term: '', context: '' });
        setIsModalOpen(false);
      } catch (err) {
        console.error('Failed to add glossary entry:', err);
      }
    }
  };

  const handleDelete = async (id, term) => {
    try {
      await apiService.deleteGlossaryEntry(term);
      setTerms(terms.filter(t => t.id !== id));
    } catch (err) {
      console.error('Failed to delete glossary entry:', err);
    }
  };

  return (
    <div className="w-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Organization Glossary</h2>
          <p className="text-gray-400">Manage locked terminology specific to your brand.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <div className="relative flex-grow sm:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search terms..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full sm:w-64 bg-space/50 border border-white/10 rounded-full pl-10 pr-4 py-2 text-white text-sm focus:outline-none focus:border-gold"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-gold to-yellow-500 text-midnight font-bold px-4 py-2 rounded-full hover:shadow-[0_0_15px_rgba(242,174,46,0.4)] transition-all flex-shrink-0"
          >
            <Plus className="w-4 h-4" /> Add Term
          </button>
        </div>
      </div>

      <div className="glass-dark rounded-3xl overflow-hidden border border-white/5">
        {loading ? (
          <div className="py-12 text-center text-gray-400">Loading glossary...</div>
        ) : (
          <>
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead className="bg-white/5">
                <tr className="text-gray-300 text-sm uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold w-1/3 border-b border-white/10">Term</th>
                  <th className="py-4 px-6 font-semibold border-b border-white/10">Definition / Translation target</th>
                  <th className="py-4 px-6 font-semibold border-b border-white/10 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTerms.map((t, i) => (
                  <motion.tr 
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 px-6 font-bold text-gold">{t.term}</td>
                    <td className="py-4 px-6 text-gray-300">{t.definition}</td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => handleDelete(t.id, t.term)} className="text-gray-500 hover:text-red-400 transition-colors text-sm font-medium flex items-center gap-1 ml-auto">
                        <Trash2 className="w-4 h-4" /> Remove
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {filteredTerms.length === 0 && (
              <div className="py-12 text-center text-gray-500 italic">No terms found.</div>
            )}
          </>
        )}
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if(e.target===e.currentTarget) setIsModalOpen(false) }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.9 }}
              className="glass-dark p-8 rounded-3xl border border-white/10 max-w-sm w-full relative"
            >
              <button onClick={() => setIsModalOpen(false)} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              <h3 className="text-2xl font-bold text-white mb-6">Add Glossary Term</h3>
              <form onSubmit={handleAdd} className="flex flex-col gap-4">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Source Lang</label>
                    <input value={newTerm.source_lang} onChange={e=>setNewTerm({ ...newTerm, source_lang: e.target.value })} className="w-full bg-space border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold" />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Target Lang</label>
                    <input value={newTerm.target_lang} onChange={e=>setNewTerm({ ...newTerm, target_lang: e.target.value })} className="w-full bg-space border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Term / Phrase</label>
                  <input required value={newTerm.source_term} onChange={e=>setNewTerm({ ...newTerm, source_term: e.target.value })} className="w-full bg-space border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold" />
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase tracking-widest pl-1 mb-1 block">Forced Translation / Definition</label>
                  <textarea required value={newTerm.target_term} onChange={e=>setNewTerm({ ...newTerm, target_term: e.target.value })} className="w-full bg-space border border-white/10 rounded-xl px-4 py-3 text-white h-24 resize-none focus:outline-none focus:border-gold" />
                </div>
                <button type="submit" className="mt-4 w-full bg-gold text-midnight font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors">Save Term</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Building, Shield, Key } from 'lucide-react';
import { authService } from '../services/authService';

const API_BASE = '/api';

export default function AuthModal({ isOpen, onClose, onSuccess }) {
  const [tab, setTab] = useState('user');
  const [orgMode, setOrgMode] = useState('create');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [orgCode, setOrgCode] = useState('');
  const [workspaceName, setWorkspaceName] = useState('');

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPassword('');
    setOrgCode('');
    setWorkspaceName('');
    setError('');
  };

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      resetForm();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (tab === 'user') {
        await authService.signupUser({ username, email, password });
        resetForm();
        onClose();
        onSuccess();
      } else if (orgMode === 'create') {
        const res = await fetch(`${API_BASE}/org/create`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: workspaceName, owner_email: email }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.detail || 'Failed to create organization.');
          setIsLoading(false);
          return;
        }
        await authService.signupOrg({ email, password, orgId: data.org_id, orgName: workspaceName }, true);
        resetForm();
        onClose();
        onSuccess();
      } else {
        const joinRes = await fetch(`${API_BASE}/org/join`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: orgCode.toUpperCase(), email }),
        });
        const joinData = await joinRes.json();
        if (joinData.error) {
          setError(joinData.error);
          setIsLoading(false);
          return;
        }
        await authService.signupOrg({ email, password, orgId: joinData.org_id, orgName: joinData.org_name }, false);
        resetForm();
        onClose();
        onSuccess();
      }
    } catch (err) {
      console.error('Auth error:', err);
      setError('An error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const inputClass = 'w-full bg-space/40 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-all';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
        onClick={handleOverlayClick}
      >
        <motion.div
          initial={{ y: 50, scale: 0.9, opacity: 0 }}
          animate={{ y: 0, scale: 1, opacity: 1 }}
          exit={{ y: 20, scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative max-w-md w-full glass-dark rounded-3xl p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 overflow-hidden"
        >
          <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-gold/20 rounded-full blur-[50px] pointer-events-none"></div>

          <button onClick={() => { onClose(); resetForm(); }} className="absolute top-5 right-5 text-gray-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>

          <h2 className="text-3xl font-bold text-white mb-6 text-center">Get Started</h2>

          <div className="flex bg-space/50 p-1 rounded-xl mb-6 relative">
            <motion.div
              className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-gold rounded-lg shadow-md"
              animate={{ left: tab === 'user' ? '4px' : 'calc(50%)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            />
            <button
              type="button"
              onClick={() => setTab('user')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 font-semibold relative z-10 transition-colors ${tab === 'user' ? 'text-midnight' : 'text-gray-300 hover:text-white'}`}
            >
              <User className="w-4 h-4" /> User
            </button>
            <button
              type="button"
              onClick={() => setTab('org')}
              className={`flex-1 flex justify-center items-center gap-2 py-2 font-semibold relative z-10 transition-colors ${tab === 'org' ? 'text-midnight' : 'text-gray-300 hover:text-white'}`}
            >
              <Building className="w-4 h-4" /> Organization
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 relative z-10">
            {tab === 'user' ? (
              <>
                <input type="text" placeholder="Username" required value={username} onChange={(e) => setUsername(e.target.value)} className={inputClass} />
                <input type="email" placeholder="Email Address" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </>
            ) : (
              <>
                <div className="flex gap-2 mb-1">
                  <label className={`flex-1 flex items-center justify-center gap-2 text-sm cursor-pointer py-2 rounded-lg border transition-all ${orgMode === 'join' ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-space/30 border-white/10 text-gray-300'}`}>
                    <Key className="w-4 h-4" />
                    <input type="radio" name="orgMode" checked={orgMode === 'join'} onChange={() => setOrgMode('join')} className="hidden" />
                    Join with Code
                  </label>
                  <label className={`flex-1 flex items-center justify-center gap-2 text-sm cursor-pointer py-2 rounded-lg border transition-all ${orgMode === 'create' ? 'bg-gold/10 border-gold/30 text-gold' : 'bg-space/30 border-white/10 text-gray-300'}`}>
                    <Building className="w-4 h-4" />
                    <input type="radio" name="orgMode" checked={orgMode === 'create'} onChange={() => setOrgMode('create')} className="hidden" />
                    Create Workspace
                  </label>
                </div>

                {orgMode === 'join' ? (
                  <input
                    type="text"
                    placeholder="Enter 8-character code"
                    required
                    maxLength={8}
                    value={orgCode}
                    onChange={(e) => setOrgCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                    className={`${inputClass} font-mono tracking-widest text-center text-lg uppercase`}
                  />
                ) : (
                  <input type="text" placeholder="Workspace Name" required value={workspaceName} onChange={(e) => setWorkspaceName(e.target.value)} className={inputClass} />
                )}

                <input type="email" placeholder="Admin Email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
                <input type="password" placeholder="Password" required value={password} onChange={(e) => setPassword(e.target.value)} className={inputClass} />
              </>
            )}

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
              type="submit"
              className="mt-2 w-full bg-gradient-to-r from-gold to-yellow-500 text-midnight font-bold py-3 rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(242,174,46,0.4)] transition-all disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  Processing...
                </>
              ) : (
                <><Shield className="w-5 h-5" /> {orgMode === 'join' ? 'Join Organization' : tab === 'org' ? 'Create Workspace' : 'Sign Up'}</>
              )}
            </motion.button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

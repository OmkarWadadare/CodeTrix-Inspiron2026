import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, UserMinus, ShieldCheck, Mail, Shield, X, Copy, Key, Trash2, RefreshCw } from 'lucide-react';
import { authService } from '../../services/authService';

const API_BASE = '/api';

export default function ManageTeam() {
  const [members, setMembers] = useState([]);
  const [codes, setCodes] = useState([]);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedCode, setCopiedCode] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSuccess, setJoinSuccess] = useState('');

  const user = authService.getUser();

  useEffect(() => {
    if (user?.email) fetchOrg();
  }, [user]);

  const fetchOrg = async () => {
    try {
      const res = await fetch(`${API_BASE}/org/me?email=${encodeURIComponent(user.email)}`);
      const data = await res.json();
      if (data.org) {
        setOrg(data.org);
        setMembers(data.org.members || []);
        setCodes(data.org.codes || []);
      }
    } catch (err) {
      console.error('Failed to fetch org:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateCode = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`${API_BASE}/org/invite-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, created_by: user.email, expires_hours: 168 }),
      });
      const data = await res.json();
      if (data.code) {
        setCodes([{ code: data.code, created_at: new Date().toISOString(), is_active: true, id: data.code }, ...codes]);
      }
    } catch (err) {
      console.error('Failed to generate code:', err);
    } finally {
      setGenerating(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(''), 2000);
  };

  const deactivateCode = async (codeId) => {
    try {
      await fetch(`${API_BASE}/org/deactivate-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code_id: codeId }),
      });
      setCodes(codes.map(c => c.id === codeId ? { ...c, is_active: false } : c));
    } catch (err) {
      console.error('Failed to deactivate code:', err);
    }
  };

  const removeMember = async (email) => {
    if (email === user.email) return;
    try {
      await fetch(`${API_BASE}/org/remove-member`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ org_id: org.id, email, requester_email: user.email }),
      });
      setMembers(members.filter(m => m.email !== email));
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const handleJoinOrg = async (e) => {
    e.preventDefault();
    setJoinError('');
    setJoinSuccess('');
    if (!joinCode.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/org/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: joinCode.trim().toUpperCase(), email: user.email }),
      });
      const data = await res.json();
      if (data.error) {
        setJoinError(data.error);
      } else {
        setJoinSuccess(`Successfully joined ${data.org_name}!`);
        setJoinCode('');
        setTimeout(() => {
          setIsJoinModalOpen(false);
          window.location.reload();
        }, 1500);
      }
    } catch (err) {
      setJoinError('Failed to join organization.');
    }
  };

  const isOwner = org?.owner_email === user?.email;

  if (loading) return <div className="text-center py-12 text-gray-400">Loading team...</div>;
  if (!org) return <div className="text-center py-12 text-gray-400">No organization found.</div>;

  return (
    <div className="w-full relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Manage Team — {org.name}</h2>
          <p className="text-gray-400">Generate invite codes, manage members, and control access.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsJoinModalOpen(true)}
            className="flex items-center gap-2 glass border border-white/10 text-white font-bold px-5 py-2.5 rounded-full hover:bg-white/10 transition-all"
          >
            <Key className="w-4 h-4" /> Join Organization
          </button>
          {isOwner && (
            <button 
              onClick={generateCode}
              disabled={generating}
              className="flex items-center gap-2 bg-gradient-to-r from-gold to-yellow-500 text-midnight font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_15px_rgba(242,174,46,0.4)] transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${generating ? 'animate-spin' : ''}`} /> Generate Code
            </button>
          )}
        </div>
      </div>

      {/* Invite Codes Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-dark p-6 rounded-3xl border border-white/10 mb-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white">Invite Codes</h3>
            <p className="text-sm text-gray-400">Share these codes with team members to join your organization.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {codes.filter(c => c.is_active !== false).map((code, i) => (
            <motion.div
              key={code.id || i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className="glass p-4 rounded-xl border border-white/10 flex items-center justify-between gap-3"
            >
              <div>
                <p className="text-lg font-mono font-bold text-gold tracking-widest">{code.code}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {code.created_at ? new Date(code.created_at).toLocaleDateString() : 'Just now'}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => copyCode(code.code)} className="p-2 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors" title="Copy code">
                  {copiedCode === code.code ? <ShieldCheck className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
                {isOwner && (
                  <button onClick={() => deactivateCode(code.id)} className="p-2 hover:bg-red-500/10 rounded-lg text-gray-400 hover:text-red-400 transition-colors" title="Deactivate">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          ))}
          {codes.filter(c => c.is_active !== false).length === 0 && (
            <div className="col-span-full text-center py-8 text-gray-500 italic">No active invite codes. {isOwner ? 'Generate one to share with your team.' : 'Ask your admin for a code.'}</div>
          )}
        </div>
      </motion.div>

      {/* Members Section */}
      <div className="mb-6">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-gold" /> Members ({members.length})
        </h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {members.map((member, i) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass p-6 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col md:flex-row justify-between gap-6 hover:border-gold/30 transition-colors"
          >
            <div className={`absolute -right-10 -bottom-10 w-40 h-40 rounded-full blur-[60px] pointer-events-none ${member.role === 'owner' ? 'bg-gold/20' : 'bg-blue-500/10'}`} />

            <div className="flex items-start gap-4 z-10 relative">
              <div className="w-14 h-14 rounded-full bg-space border-2 border-gold/50 flex items-center justify-center font-bold text-xl text-white shadow-inner">
                {member.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{member.email}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${member.role === 'owner' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-300'}`}>
                    {member.role}
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-2">
                  Joined {member.joined_at ? new Date(member.joined_at).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-end justify-end z-10 relative">
              {member.role === 'owner' ? (
                <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-gold/20 text-gold opacity-70">
                  <ShieldCheck className="w-4 h-4"/> Owner
                </span>
              ) : isOwner ? (
                <button 
                  onClick={() => removeMember(member.email)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                >
                  <UserMinus className="w-4 h-4" /> Remove
                </button>
              ) : (
                <span className="text-xs text-gray-500">Contact owner to manage</span>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-12 text-gray-500 italic">No members yet. Share an invite code to grow your team.</div>
      )}

      {/* Join Organization Modal */}
      <AnimatePresence>
        {isJoinModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => { if(e.target===e.currentTarget) setIsJoinModalOpen(false) }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ y: 50, scale: 0.9 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.9 }}
              className="glass-dark p-8 rounded-3xl border border-white/10 max-w-sm w-full relative"
            >
              <button onClick={() => { setIsJoinModalOpen(false); setJoinError(''); setJoinSuccess(''); setJoinCode(''); }} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X className="w-5 h-5"/></button>
              <div className="flex items-center gap-3 mb-2">
                <Key className="w-6 h-6 text-gold" />
                <h3 className="text-2xl font-bold text-white">Join Organization</h3>
              </div>
              <p className="text-gray-400 text-sm mb-6">Enter the invite code shared by your organization admin.</p>
              <form onSubmit={handleJoinOrg} className="flex flex-col gap-4">
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input 
                    type="text" 
                    required 
                    placeholder="Enter 8-character code" 
                    value={joinCode} 
                    onChange={e => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                    maxLength={8}
                    className="w-full bg-space border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white text-lg font-mono tracking-widest text-center focus:outline-none focus:border-gold uppercase"
                  />
                </div>
                {joinError && <p className="text-red-400 text-sm text-center">{joinError}</p>}
                {joinSuccess && <p className="text-green-400 text-sm text-center">{joinSuccess}</p>}
                <button type="submit" className="mt-2 w-full bg-gold text-midnight font-bold py-3 rounded-xl hover:bg-yellow-400 transition-colors flex items-center justify-center gap-2">
                  <Shield className="w-4 h-4"/> Join Organization
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

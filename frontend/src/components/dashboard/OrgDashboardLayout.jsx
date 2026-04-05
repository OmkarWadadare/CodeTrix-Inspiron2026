import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, BookOpen, Brush, Users, Edit3, BarChart3 } from 'lucide-react';
import { authService } from '../../services/authService';
import { apiService } from '../../services/api';
import StyleProfile from './StyleProfile';
import Glossary from './Glossary';
import ManageTeam from './ManageTeam';
import DocumentEditing from './DocumentEditing';
import Analytics from './Analytics';

export default function OrgDashboardLayout({ onLogout }) {
  const [activeTab, setActiveTab] = useState('Document Editing');
  const [user, setUser] = useState(null);
  const [orgData, setOrgData] = useState(null);

  useEffect(() => {
    setUser(authService.getUser());
    apiService.getOrganizationData().then(data => setOrgData(data));
  }, []);

  const handleLogout = () => {
    authService.logout();
    if (onLogout) onLogout();
  };

  const navItems = [
    { id: 'Document Editing', icon: Edit3 },
    { id: 'Analytics', icon: BarChart3 },
    { id: 'Glossary', icon: BookOpen },
    { id: 'Style Profile', icon: Brush },
    { id: 'Manage Team', icon: Users }
  ];

  const renderContent = () => {
    switch(activeTab) {
      case 'Analytics': return <Analytics />;
      case 'Style Profile': return <StyleProfile />;
      case 'Glossary': return <Glossary />;
      case 'Manage Team': return <ManageTeam />;
      case 'Document Editing':
      default: return <DocumentEditing />;
    }
  };

  const variants = {
    enter: { opacity: 0, x: 50 },
    center: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 }
  };

  if (!user || !orgData) return null;

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-[85vh] gap-8 py-6 relative z-10">
      
      <motion.aside 
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-72 flex-shrink-0 flex flex-col gap-8"
      >
        <div className="glass-dark p-6 rounded-3xl border border-white/10 flex flex-col items-center shadow-xl">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gold to-yellow-600 p-1 mb-4 shadow-[0_0_20px_rgba(242,174,46,0.4)]">
            <div className="w-full h-full bg-space rounded-full flex items-center justify-center text-2xl font-bold text-white">
              {user.email ? user.email.charAt(0).toUpperCase() : 'O'}
            </div>
          </div>
          <h2 className="text-xl font-bold text-white text-center">Welcome, {user.username || 'Omkar Wadadare'}</h2>
          
          <div className="mt-6 pt-6 border-t border-white/10 w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center font-bold">C</div>
              <span className="font-bold text-gray-200">{orgData.orgName}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-400 text-sm bg-white/5 px-2 py-1 rounded-md">
              <Users className="w-4 h-4" /> {orgData.teamCount}
            </div>
          </div>
        </div>

        <nav className="glass-dark p-4 rounded-3xl border border-white/10 flex flex-col gap-2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all font-medium ${
                activeTab === item.id 
                  ? 'bg-gold/10 text-gold border border-gold/30 shadow-[0_0_15px_rgba(242,174,46,0.15)]' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'
              }`}
            >
              <item.icon className="w-5 h-5" />
              {item.id}
            </button>
          ))}
          
          <div className="mt-4 pt-4 border-t border-white/10">
            <button 
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-colors font-medium text-red-400 hover:bg-red-500/10"
            >
              <LogOut className="w-5 h-5" />
              Logout Workspace
            </button>
          </div>
        </nav>
      </motion.aside>

      <main className="flex-grow flex flex-col min-h-[600px] overflow-hidden relative pb-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="w-full h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>

    </div>
  );
}

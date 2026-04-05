import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Navbar from './components/Navbar'
import SubNavbar from './components/SubNavbar'
import UploadView from './components/UploadView'
import ProofreadView from './components/ProofreadView'
import AuthModal from './components/AuthModal'
import AnimatedWorkflow from './components/AnimatedWorkflow'
import TranslationHistory from './components/TranslationHistory'
import OrgDashboardLayout from './components/dashboard/OrgDashboardLayout'
import { authService } from './services/authService'
import { apiService } from './services/api'

const API_BASE = '/api';

const Stars = () => {
  const starCount = 100;
  const stars = Array.from({ length: starCount });
  return (
    <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
      {stars.map((_, i) => {
        const size = Math.random() * 2 + 1;
        const top = Math.random() * 100;
        const left = Math.random() * 100;
        const delay = Math.random() * 5;
        const duration = 3 + Math.random() * 4;
        return (
          <div
            key={i}
            className="absolute bg-white rounded-full opacity-0"
            style={{
              top: `${top}%`,
              left: `${left}%`,
              width: `${size}px`,
              height: `${size}px`,
              boxShadow: '0 0 8px 1px rgba(255, 255, 255, 0.4)',
              animation: `twinkle ${duration}s infinite ease-in-out ${delay}s`,
            }}
          />
        );
      })}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
      `}</style>
    </div>
  );
};

const ProfileView = ({ user, onLogout }) => (
  <motion.div 
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="bg-space/40 p-6 md:p-8 rounded-2xl border border-white/10 backdrop-blur-xl text-white w-full max-w-lg mx-auto"
  >
    <div className="flex flex-col md:flex-row items-center gap-6 mb-8 text-center md:text-left">
      <div className="w-20 h-20 bg-gold rounded-full flex items-center justify-center text-midnight text-3xl font-bold shadow-lg shadow-gold/20">
        {user?.email?.charAt(0).toUpperCase() || 'U'}
      </div>
      <div>
        <h2 className="text-2xl md:text-3xl font-bold text-gold">User Profile</h2>
        <p className="text-white/60">Account successfully created</p>
      </div>
    </div>
    <div className="space-y-6 border-t border-white/10 pt-6">
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-semibold">Email Address</label>
        <p className="text-base md:text-lg truncate">{user?.email || 'user@example.com'}</p>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-[10px] uppercase tracking-[0.2em] text-gold/60 font-semibold">Account Status</label>
        <div className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
            <p className="text-base md:text-lg">Active {user?.userType || 'Standard'}</p>
        </div>
      </div>
      <button
        onClick={onLogout}
        className="w-full mt-4 py-3 rounded-xl border border-red-400/30 text-red-400 font-bold text-sm uppercase tracking-widest hover:bg-red-400/10 transition-all"
      >
        Logout
      </button>
    </div>
  </motion.div>
);

export default function App() {
  const [activeTab, setActiveTab] = useState('Upload document');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [slideDir, setSlideDir] = useState(1);
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(() => authService.isAuthenticated());
  const [userOrg, setUserOrg] = useState(null);

  useEffect(() => {
    const user = authService.getUser();
    if (user && user.email) {
      fetch(`${API_BASE}/org/me?email=${encodeURIComponent(user.email)}`)
        .then(res => res.json())
        .then(data => {
          if (data.org) {
            setUserOrg(data.org);
          }
        })
        .catch(() => setUserOrg(null));
    }
  }, [isUserLoggedIn]);

  const [uploadedData, setUploadedData] = useState(null);
  const [sourceContent, setSourceContent] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [documentDownloadUrl, setDocumentDownloadUrl] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translationError, setTranslationError] = useState('');
  const [uploadError, setUploadError] = useState('');

  const handleTabChange = (newTab) => {
    if (newTab === activeTab) return;
    const order = ['Upload document', 'Proofreading', 'Translation history', 'Profile'];
    const goingRight = order.indexOf(newTab) > order.indexOf(activeTab);
    setSlideDir(goingRight ? 1 : -1);
    setActiveTab(newTab);
  };

  const handleAuthRequired = () => {
    if (!isUserLoggedIn && !authService.isAuthenticated()) {
      setIsAuthModalOpen(true);
    }
  };

  const handleLogout = () => {
    authService.logout();
    setIsUserLoggedIn(false);
    setUploadedData(null);
    setSourceContent('');
    setTranslatedContent('');
    setDocumentDownloadUrl(null);
  };

  const handleNavigateToUpload = () => {
    setUploadError('');
    handleTabChange('Upload document');
  };

  const handleUploadComplete = (data) => {
    setUploadedData(data);
    const combined = data.segments.map(s => s.text || s).join('\n\n');
    setSourceContent(combined);
    setTranslatedContent('');
    setDocumentDownloadUrl(null);
    setTranslationError('');
    setUploadError('');
    handleTabChange('Proofreading');
  };

  const handleUploadError = (error) => {
    setUploadError(error);
  };

  const handleTranslateText = async (text, sourceLang, targetLang) => {
    const result = await apiService.translateText([text], targetLang, 'neutral', sourceLang);
    const translation = result.results?.[0]?.translation || 'Translation unavailable';
    setSourceContent(text);
    setTranslatedContent(translation);
    return translation;
  };

  const handleTranslateDocument = async (lang, sourceLang = 'english') => {
    if (!uploadedData || !uploadedData.segments || uploadedData.segments.length === 0) {
      setTranslationError('No document data available. Please re-upload.');
      throw new Error('No document data');
    }
    setTranslating(true);
    setTranslationError('');
    try {
      const docSegments = uploadedData.segments.map((s, i) => ({ id: s.id || `t_${i}`, text: s.text || s }));
      const docRes = await apiService.translateDocument(
        uploadedData.session_id,
        uploadedData.file_type,
        docSegments,
        lang,
        'neutral',
        sourceLang
      );
      setTranslatedContent(docRes.translated_text || 'Translation completed');
      if (docRes.download_url) {
        setDocumentDownloadUrl(docRes.download_url);
      }
      return docRes.translated_text;
    } catch (err) {
      console.error('Document translation error:', err);
      setTranslationError(err.message || 'Translation failed');
      throw err;
    } finally {
      setTranslating(false);
    }
  };

  const handleDownload = () => {
    if (documentDownloadUrl) {
      window.open(documentDownloadUrl, '_blank');
    } else {
      alert('No translated document available yet.');
    }
  };

  const variants = {
    enter: (direction) => ({ x: direction > 0 ? 1000 : -1000, opacity: 0, scale: 0.9 }),
    center: { zIndex: 1, x: 0, opacity: 1, scale: 1 },
    exit: (direction) => ({ zIndex: 0, x: direction < 0 ? 1000 : -1000, opacity: 0, scale: 0.9 })
  };

  return (
    <div className="relative min-h-screen bg-midnight font-sans overflow-x-hidden flex flex-col">
      <Stars />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-space/60 rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-gold/10 rounded-full blur-[150px] pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-7xl mx-auto flex flex-col min-h-screen w-full px-4 lg:px-8 pt-4">
        {userOrg ? (
          <OrgDashboardLayout onLogout={handleLogout} />
        ) : (
          <>
            <Navbar onAuthRequired={handleAuthRequired} />
            
            <div className="flex flex-col items-center">
                {isUserLoggedIn && (
                  <button 
                    onClick={() => handleTabChange('Profile')}
                    className={`mb-4 px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${activeTab === 'Profile' ? 'bg-gold text-midnight border-gold' : 'text-gold border-gold/30 hover:bg-gold/10'}`}
                  >
                    VIEW PROFILE
                  </button>
                )}
                <SubNavbar activeTab={activeTab} setActiveTab={handleTabChange} />
            </div>
        
        <main className="flex-grow flex items-center justify-center py-6 w-full relative overflow-visible">
          <AnimatePresence initial={false} custom={slideDir} mode="wait">
             {activeTab === 'Upload document' && (
               <motion.div key="upload" custom={slideDir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }} className="flex items-center justify-center w-full pb-20 outline-none">
                 <UploadView 
                   onAuthRequired={handleAuthRequired} 
                   isAuthenticated={isUserLoggedIn} 
                   onNext={() => handleTabChange('Proofreading')} 
                   onUploadComplete={handleUploadComplete}
                   onUploadError={handleUploadError}
                   uploadError={uploadError}
                 />
               </motion.div>
             )}
             
             {activeTab === 'Proofreading' && (
               <motion.div key="proofread" custom={slideDir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.3 } }} className="flex flex-col items-center justify-center w-full pt-10 pb-20 outline-none px-4">
                 <ProofreadView 
                   onPrev={() => handleTabChange('Upload document')} 
                   onNavigateToUpload={handleNavigateToUpload}
                   sourceContent={sourceContent}
                   translatedContent={translatedContent}
                   onTranslateText={handleTranslateText}
                   onTranslateDocument={handleTranslateDocument}
                   translating={translating}
                   translationError={translationError}
                 />
                 
                 {documentDownloadUrl && (
                   <button
                     onClick={handleDownload}
                     className="mt-10 w-full sm:w-auto min-w-[240px] bg-gold text-midnight px-8 py-4 rounded-xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white transition-all active:scale-95 shadow-xl shadow-gold/10"
                   >
                     <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                     Download Translated Document
                   </button>
                 )}
               </motion.div>
             )}
             
             {activeTab === 'Translation history' && (
               <motion.div key="history" custom={slideDir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="flex flex-col items-center justify-center w-full outline-none">
                 <TranslationHistory />
               </motion.div>
             )}

             {activeTab === 'Profile' && (
               <motion.div key="profile" custom={slideDir} variants={variants} initial="enter" animate="center" exit="exit" transition={{ x: { type: "spring", stiffness: 300, damping: 30 }, opacity: { duration: 0.2 } }} className="flex flex-col items-center justify-center w-full outline-none px-4">
                 <ProfileView user={authService.getUser()} onLogout={handleLogout} />
               </motion.div>
             )}
          </AnimatePresence>
        </main>
        
        <div className="w-full relative z-20 mt-10 mb-20 flex flex-col items-center">
          <AnimatedWorkflow />
          <TranslationHistory />
        </div>
        </>
        )}
      </div>

      <AuthModal 
        isOpen={isAuthModalOpen} 
        onClose={() => setIsAuthModalOpen(false)} 
        onSuccess={() => {
          setIsUserLoggedIn(true);
          handleTabChange('Profile');
        }} 
      />
    </div>
  )
}

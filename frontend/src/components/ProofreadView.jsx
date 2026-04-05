import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, FileText, ArrowRightLeft, Copy, Check, Loader2, Languages, Upload } from 'lucide-react';

const LANGUAGES = [
  { value: 'hindi', label: 'Hindi' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'marathi', label: 'Marathi' },
  { value: 'sanskrit', label: 'Sanskrit' },
  { value: 'konkani', label: 'Konkani' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
  { value: 'spanish', label: 'Spanish' },
  { value: 'german', label: 'German' },
  { value: 'italian', label: 'Italian' },
  { value: 'portuguese', label: 'Portuguese' },
  { value: 'chinese', label: 'Chinese (Simplified)' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'dutch', label: 'Dutch' },
  { value: 'swedish', label: 'Swedish' },
  { value: 'norwegian', label: 'Norwegian' },
  { value: 'danish', label: 'Danish' },
  { value: 'finnish', label: 'Finnish' },
  { value: 'polish', label: 'Polish' },
  { value: 'turkish', label: 'Turkish' },
];

export default function ProofreadView({ onPrev, onNavigateToUpload, sourceContent, translatedContent, onTranslateText, onTranslateDocument, translating, translationError }) {
  const [activeTab, setActiveTab] = useState('text');
  const [copied, setCopied] = useState(false);
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('english');
  const [targetLang, setTargetLang] = useState('hindi');
  const [localTranslating, setLocalTranslating] = useState(false);
  const [error, setError] = useState('');
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    if (sourceContent) {
      setActiveTab('document');
      setShowComparison(true);
    }
  }, [sourceContent]);

  useEffect(() => {
    if (translationError) {
      setError(translationError);
    }
  }, [translationError]);

  const handleCopy = () => {
    const textToShow = activeTab === 'document' ? translatedContent : translatedText;
    navigator.clipboard.writeText(textToShow);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTranslateText = async () => {
    if (!sourceText.trim()) return;
    setLocalTranslating(true);
    setError('');
    try {
      const result = await onTranslateText(sourceText, sourceLang, targetLang);
      setTranslatedText(result);
      setShowComparison(true);
    } catch (err) {
      setError('Translation failed. Please try again.');
      console.error(err);
    } finally {
      setLocalTranslating(false);
    }
  };

  const handleDocumentTranslateClick = () => {
    onNavigateToUpload();
  };

  const handleTranslateDocument = async () => {
    setLocalTranslating(true);
    setError('');
    try {
      await onTranslateDocument(targetLang, sourceLang);
    } catch (err) {
      setError(err.message || 'Document translation failed. Please try again.');
      console.error(err);
    } finally {
      setLocalTranslating(false);
    }
  };

  const handleReset = () => {
    setShowComparison(false);
    setSourceText('');
    setTranslatedText('');
    setActiveTab('text');
  };

  const displaySource = activeTab === 'document' ? sourceContent : sourceText;
  const displayTranslated = activeTab === 'document' ? translatedContent : translatedText;
  const isTranslating = activeTab === 'document' ? (translating || localTranslating) : localTranslating;

  return (
    <motion.div 
      className="flex-grow flex flex-col items-center justify-start w-full h-full relative px-4"
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <motion.button
        onClick={onPrev}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        whileHover={{ scale: 1.2, x: -5 }}
        whileTap={{ scale: 0.9 }}
        className="absolute left-[0px] lg:left-[-40px] top-1/2 -translate-y-1/2 hidden lg:flex items-center justify-center w-12 h-12 rounded-full glass-panel hover:bg-gold/20 text-gold transition-colors z-50"
        title="Back to Upload"
      >
        <ChevronLeft className="w-8 h-8" />
      </motion.button>

      <motion.div 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="flex gap-3 w-full max-w-3xl mb-6"
      >
        <div className="flex-1">
          <label className="text-xs text-gold/60 uppercase tracking-widest font-semibold mb-1 block">Source Language</label>
          <select
            value={sourceLang}
            onChange={(e) => setSourceLang(e.target.value)}
            className="w-full py-3 px-4 rounded-xl glass bg-transparent text-white text-sm font-medium focus:outline-none focus:border-gold border border-white/10"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value} className="bg-space">{lang.label}</option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="text-xs text-gold/60 uppercase tracking-widest font-semibold mb-1 block">Target Language</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="w-full py-3 px-4 rounded-xl glass bg-transparent text-white text-sm font-medium focus:outline-none focus:border-gold border border-white/10"
          >
            {LANGUAGES.map(lang => (
              <option key={lang.value} value={lang.value} className="bg-space">{lang.label}</option>
            ))}
          </select>
        </div>
      </motion.div>

      {!showComparison ? (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
          className="flex flex-col items-center justify-center w-full max-w-lg gap-6 py-20"
        >
          <Upload className="w-20 h-20 text-gold/40" />
          <h3 className="text-2xl font-bold text-white text-center">No document uploaded yet</h3>
          <p className="text-gray-400 text-center">Upload a PDF or DOCX document to get started with translation.</p>
          <motion.button
            onClick={onNavigateToUpload}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-midnight font-black text-sm uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gold/10"
          >
            <FileText className="w-5 h-5" /> Upload Document
          </motion.button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2, type: "spring" }}
          className="flex flex-col w-full max-w-6xl gap-4"
        >

          <div className="flex flex-col lg:flex-row w-full gap-6 h-[500px]">
            <div className="flex-1 glass-dark rounded-3xl p-6 flex flex-col shadow-[0_10px_30px_rgba(0,0,0,0.5)] border-t border-white/10">
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10">
                <h3 className="text-xl font-bold text-gray-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Source Content
                </h3>
                <span className="text-xs px-3 py-1 glass rounded-full text-gray-300 font-medium tracking-wide">
                  Document
                </span>
              </div>
              <div className="w-full h-full overflow-y-auto text-gray-200 leading-relaxed whitespace-pre-wrap">
                {displaySource || 'No content'}
              </div>
            </div>

            <div className="flex-1 glass rounded-3xl p-6 flex flex-col shadow-[0_15px_40px_rgba(242,174,46,0.1)] border-t border-gold/30 relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gold/5 to-transparent pointer-events-none rounded-3xl"></div>
              
              <div className="flex justify-between items-center mb-4 pb-4 border-b border-white/10 relative z-10">
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-gold"></span>
                  Translated Content
                </h3>
                <div className="flex gap-2">
                  <button onClick={handleCopy} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-300 hover:text-white" title="Copy to clipboard">
                    {copied ? <Check className="w-4 h-4 text-green-400"/> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="w-full h-full overflow-y-auto text-gray-200 leading-relaxed relative z-10">
                {isTranslating ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="w-8 h-8 text-gold animate-spin mr-3" />
                    <span className="text-gold font-medium">Translating...</span>
                  </div>
                ) : error ? (
                  <div className="flex items-center justify-center h-full text-red-400">{error}</div>
                ) : displayTranslated ? (
                  <div className="whitespace-pre-wrap">{displayTranslated}</div>
                ) : (
                  <div className="w-full h-full text-transparent bg-clip-text bg-gradient-to-r from-gray-400 to-gray-600 font-light italic flex items-center justify-center">
                    Click "Translate Document" to translate
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            {!translatedContent ? (
              <motion.button
                onClick={handleTranslateDocument}
                disabled={isTranslating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-12 py-5 rounded-xl bg-gradient-to-r from-gold to-yellow-500 text-midnight font-black text-base uppercase tracking-widest flex items-center gap-3 shadow-xl shadow-gold/20 hover:shadow-gold/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isTranslating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Languages className="w-6 h-6" />}
                {isTranslating ? 'Translating Document...' : `Translate to ${LANGUAGES.find(l => l.value === targetLang)?.label || 'Selected Language'}`}
              </motion.button>
            ) : (
              <motion.button
                onClick={handleTranslateDocument}
                disabled={isTranslating}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 rounded-xl glass text-gold font-bold text-sm uppercase tracking-widest border border-gold/30 hover:bg-gold/10 transition-all disabled:opacity-40"
              >
                {isTranslating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Languages className="w-4 h-4" />}
                {isTranslating ? 'Re-translating...' : 'Re-translate'}
              </motion.button>
            )}
          </div>

          {error && <p className="text-red-400 text-center">{error}</p>}
        </motion.div>
      )}
    </motion.div>
  );
}

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, FileText, Sparkles, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { apiService } from '../services/api';
import { authService } from '../services/authService';

export default function HeroRight({ onAuthRequired, isAuthenticated, onUploadComplete, onUploadError }) {
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    if (onAuthRequired && !isAuthenticated) {
      onAuthRequired();
      return;
    }

    const file = acceptedFiles[0];
    setUploading(true);
    setUploadSuccess(false);
    setUploadStatus('Uploading document...');

    try {
      const data = await apiService.uploadDocument(file);
      setUploadStatus('Extracting text segments...');
      
      if (!data.segments || data.segments.length === 0) {
        setUploadStatus('No text found in document');
        if (onUploadError) onUploadError('No text content could be extracted from this file');
        setUploading(false);
        return;
      }

      setUploadStatus(`Extracted ${data.segment_count} text segments`);
      setUploadSuccess(true);

      setTimeout(() => {
        onUploadComplete(data);
      }, 800);
    } catch (err) {
      console.error('Upload error:', err);
      setUploadStatus('Upload failed');
      if (onUploadError) onUploadError(err.message || 'Failed to upload document');
      setUploading(false);
    }
  }, [onAuthRequired, isAuthenticated, onUploadComplete, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    noClick: !isAuthenticated,
    noKeyboard: !isAuthenticated,
    disabled: uploading,
  });

  const handleClick = (e) => {
    if (!isAuthenticated && onAuthRequired) {
      e.stopPropagation();
      onAuthRequired();
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, delay: 0.8, type: "spring" }}
      className="w-full lg:w-1/2 flex justify-center lg:justify-end mt-12 lg:mt-0 z-30 px-4"
    >
      <motion.div
        whileHover={uploading ? {} : { y: -10, rotate: 1 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="w-full max-w-md relative group"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-gold to-space blur-[50px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none rounded-full"></div>

        <div 
          {...getRootProps()} 
          onClick={(e) => {
             if (!isAuthenticated && onAuthRequired) {
                e.stopPropagation();
                onAuthRequired();
             } else {
                const rootPropsClick = getRootProps().onClick;
                if (rootPropsClick) rootPropsClick(e);
             }
          }}
          className={`relative overflow-hidden cursor-pointer rounded-3xl border-2 border-dashed glass h-[420px] flex flex-col items-center justify-center transition-all duration-500 ${
            isDragActive ? 'border-gold bg-gold/20 scale-105 shadow-[0_0_40px_rgba(242,174,46,0.4)]' : 'border-gray-400 hover:border-gold hover:shadow-[0_0_30px_rgba(242,174,46,0.2)]'
          }`}
        >
          <input {...getInputProps()} />
          
          <div className="absolute top-0 left-0 w-full h-[100px] bg-gradient-to-b from-white/10 to-transparent pointer-events-none"></div>

          <AnimatePresence>
             {isDragActive && (
               <motion.div 
                 initial={{ opacity: 0, scale: 0 }}
                 animate={{ opacity: 1, scale: 1 }}
                 exit={{ opacity: 0, scale: 0 }}
                 className="absolute top-6 right-6"
               >
                 <Sparkles className="w-8 h-8 text-gold animate-pulse" />
               </motion.div>
             )}
          </AnimatePresence>

          {uploading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <Loader2 className="w-20 h-20 mb-6 text-gold animate-spin" />
              <h3 className="text-xl font-bold text-white mb-2">{uploadStatus}</h3>
            </motion.div>
          ) : uploadSuccess ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
              <CheckCircle className="w-20 h-20 mb-6 text-green-400" />
              <h3 className="text-xl font-bold text-green-400 mb-2">Document Uploaded!</h3>
              <p className="text-gray-300 text-sm">Redirecting to proofreading...</p>
            </motion.div>
          ) : (
            <>
              <motion.div
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              >
                <UploadCloud className={`w-24 h-24 mb-6 transition-colors duration-500 drop-shadow-[0_0_15px_rgba(242,174,46,0.6)] ${isDragActive ? 'text-white' : 'text-gold'}`} />
              </motion.div>

              <h3 className="text-3xl font-extrabold text-white mb-3 z-10 relative text-center">
                {isDragActive ? 'Drop it like it\'s hot!' : 'Upload Document'}
              </h3>
              <p className="text-gray-300 text-center px-10 mb-8 font-light z-10 relative leading-relaxed text-sm">
                Drag and drop your PDF or Word document here, or click to browse your files to get started. 
              </p>

              <div className="flex gap-4 z-10 relative">
                <span className="glass-dark px-4 py-2 rounded-lg text-sm text-gray-200 flex items-center gap-2 font-medium hover:bg-white/20 transition-colors">
                   <FileText className="w-5 h-5 text-red-400"/> PDF
                </span>
                <span className="glass-dark px-4 py-2 rounded-lg text-sm text-gray-200 flex items-center gap-2 font-medium hover:bg-white/20 transition-colors">
                   <FileText className="w-5 h-5 text-blue-400"/> DOCX
                </span>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

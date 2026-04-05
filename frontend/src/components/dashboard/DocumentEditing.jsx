import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, Sparkles, Eye, Edit3, Trash2, CheckCircle, Clock, Loader2 } from 'lucide-react';
import { apiService } from '../../services/api';

const AnimatedAstronauts = () => (
  <motion.div 
    className="w-full h-40 mt-6 relative flex items-center justify-center gap-6"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 1 }}
  >
    <motion.div
      animate={{ y: [0, -10, 0], rotate: [-5, 5, -5] }}
      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      className="w-16 h-16 origin-bottom"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="30" fill="#15191E" stroke="#F2AE2E" strokeWidth="3"/>
        <rect x="30" y="25" width="40" height="25" rx="10" fill="#3A345B" stroke="#F2AE2E" strokeWidth="2"/>
        <motion.circle cx="40" cy="35" r="3" fill="#FFFFFF" animate={{ cx: [40, 60, 40] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.circle cx="60" cy="35" r="3" fill="#FFFFFF" animate={{ cx: [60, 40, 60] }} transition={{ duration: 3, repeat: Infinity }} />
        <path d="M40 70 Q50 90 60 70" stroke="#F2AE2E" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </motion.div>

    <motion.div
      animate={{ y: [0, -15, 0], scale: [1, 1.05, 1] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      className="w-20 h-20 origin-bottom z-10"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="35" fill="#15191E" stroke="#F2AE2E" strokeWidth="3"/>
        <rect x="25" y="25" width="50" height="30" rx="15" fill="#3A345B" stroke="#F2AE2E" strokeWidth="2"/>
        <motion.circle cx="40" cy="40" r="4" fill="#FFFFFF" animate={{ cx: [40, 60, 40] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <motion.circle cx="60" cy="40" r="4" fill="#FFFFFF" animate={{ cx: [60, 40, 60] }} transition={{ duration: 2.5, repeat: Infinity }} />
        <path d="M35 75 Q50 100 65 75" stroke="#F2AE2E" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </motion.div>

    <motion.div
      animate={{ y: [0, -12, 0], rotate: [5, -5, 5] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      className="w-16 h-16 origin-bottom"
    >
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="50" cy="40" r="30" fill="#15191E" stroke="#F2AE2E" strokeWidth="3"/>
        <rect x="30" y="25" width="40" height="25" rx="10" fill="#3A345B" stroke="#F2AE2E" strokeWidth="2"/>
        <motion.circle cx="40" cy="35" r="3" fill="#FFFFFF" animate={{ cx: [60, 40, 60] }} transition={{ duration: 3, repeat: Infinity }} />
        <motion.circle cx="60" cy="35" r="3" fill="#FFFFFF" animate={{ cx: [40, 60, 40] }} transition={{ duration: 3, repeat: Infinity }} />
        <path d="M40 70 Q50 90 60 70" stroke="#F2AE2E" strokeWidth="3" strokeLinecap="round"/>
      </svg>
    </motion.div>
  </motion.div>
);

export default function DocumentEditing() {
  const [projects, setProjects] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState('');

  useEffect(() => {
    apiService.getAuditLog(50).then(data => {
      const logs = (data.logs || []).filter(l => l.action === 'DOCUMENT_TRANSLATION').map((log, i) => ({
        id: `proj_${i}`,
        name: log.segment_id?.substring(0, 50) || `Translation #${i + 1}`,
        date: log.timestamp ? new Date(log.timestamp).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }) : 'N/A',
        status: 'Completed',
        type: 'document'
      }));
      setProjects(logs);
    }).catch(() => setProjects([]));
  }, []);

  const onDrop = async (acceptedFiles) => {
    if (!acceptedFiles.length) return;
    const file = acceptedFiles[0];
    setUploading(true);
    setUploadStatus('Uploading document...');

    try {
      const data = await apiService.uploadDocument(file);
      setUploadStatus('Extracting text...');

      const docSegments = data.segments.map((s, i) => ({ id: s.id || `t_${i}`, text: s.text || s }));
      setUploadStatus('Translating...');

      const res = await apiService.translateDocument(
        data.session_id,
        data.file_type,
        docSegments,
        'hindi',
        'neutral'
      );

      setProjects([{
        id: data.session_id,
        name: file.name,
        date: 'Just now',
        status: 'Completed',
        type: data.file_type,
        downloadUrl: res.download_url
      }, ...projects]);
      setUploadStatus('');
    } catch (err) {
      console.error('Upload/translate error:', err);
      setUploadStatus(`Error: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    disabled: uploading,
  });

  const handleDelete = (id) => {
    setProjects(projects.filter(p => p.id !== id));
  };

  const handleDownload = (project) => {
    if (project.downloadUrl) {
      window.open(project.downloadUrl, '_blank');
    }
  };

  return (
    <div className="w-full relative pb-12 flex flex-col gap-10">
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-dark p-8 rounded-3xl border border-white/10 relative overflow-hidden flex flex-col justify-between"
        >
          <div className="absolute top-[-50px] left-[-50px] w-40 h-40 bg-gold/10 rounded-full blur-[60px] pointer-events-none" />
          
          <div className="relative z-10 w-max bg-gradient-to-r from-gold to-yellow-500 text-midnight font-bold px-4 py-2 rounded-xl shadow-[0_0_15px_rgba(242,174,46,0.3)] mb-4">
            Start new project
          </div>
          <p className="text-gray-400 relative z-10">
            Drag and drop a document and TransLuna's intelligent engine will upload, extract, translate, and make it available for download.
          </p>

          <AnimatedAstronauts />
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full"
        >
          <div 
            {...getRootProps()} 
            className={`cursor-pointer rounded-3xl border-2 border-dashed glass h-[350px] flex flex-col items-center justify-center transition-all duration-500 ${
              isDragActive ? 'border-gold bg-gold/5 scale-[1.02]' : 'border-gray-500/30 hover:border-gold hover:bg-white/5'
            }`}
          >
            <input {...getInputProps()} />
            
            {uploading ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center">
                <Loader2 className="w-12 h-12 text-gold animate-spin mb-4" />
                <p className="text-xl font-bold text-white mb-2">{uploadStatus}</p>
              </motion.div>
            ) : (
              <>
                <motion.div 
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-20 h-20 rounded-full bg-space/50 flex items-center justify-center border border-white/10 mb-6 shadow-xl"
                >
                  <UploadCloud className="w-10 h-10 text-gold" />
                </motion.div>
                
                <p className="text-2xl font-bold text-white mb-2">Upload Document</p>
                <p className="text-gray-400 text-sm max-w-[250px] text-center mb-6">
                  Drag & Drop your files here or click to browse device.
                </p>
                
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold bg-gold/10 px-4 py-2 rounded-full">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Pre-processed
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-dark rounded-3xl p-8 border border-white/10 shadow-xl relative overflow-hidden"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-extrabold text-white tracking-wide">Past Projects</h2>
            <p className="text-gray-400 font-light mt-1">Review, edit, or delete existing workflows.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-white/10 text-gray-400 text-sm uppercase tracking-wider">
                <th className="pb-4 font-semibold px-4 w-1/2">Project Name</th>
                <th className="pb-4 font-semibold px-4">Date</th>
                <th className="pb-4 font-semibold px-4">Status</th>
                <th className="pb-4 font-semibold px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((item, index) => (
                <motion.tr 
                  key={item.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  whileHover={{ backgroundColor: "rgba(255,255,255,0.05)" }}
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
                      {item.downloadUrl && (
                        <motion.button onClick={() => handleDownload(item)} whileHover={{ scale: 1.2 }} className="hover:text-blue-400 transition-colors" title="Download">
                           <Eye className="w-5 h-5" />
                        </motion.button>
                      )}
                      <motion.button whileHover={{ scale: 1.2 }} className="hover:text-red-400 transition-colors" title="Delete project" onClick={() => handleDelete(item.id)}>
                         <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {projects.length === 0 && (
            <div className="text-center py-12 text-gray-500 italic">No projects found. Upload a document to get started.</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

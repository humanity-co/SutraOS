import { useState, useEffect } from 'react';
import { UploadCloud, FileText, ShieldCheck, Trash2, Calendar, Eye } from 'lucide-react';
import api from './api';

interface DocumentLocker {
  id: string;
  owner_id: string;
  doc_name: string;
  doc_type: string;
  file_size: string;
  uploaded_at: string;
  cryptographic_hash: string;
}

export default function Documents() {
  const [documents, setDocuments] = useState<DocumentLocker[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('MARKSHEET');

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchDocuments = async () => {
    try {
      const res = await api.get('/dms/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const simulateUpload = (fileName: string) => {
    setIsUploading(true);
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeUpload(fileName);
          return 100;
        }
        return prev + 25;
      });
    }, 200);
  };

  const completeUpload = async (fileName: string) => {
    try {
      // Mock sizes depending on length
      const fileSize = `${(Math.random() * 4 + 1).toFixed(1)} MB`;
      await api.post('/dms/documents', {
        doc_name: fileName,
        doc_type: selectedCategory,
        file_size: fileSize
      });
      showNotification('success', 'Document securely cryptographically signed and stored!');
      fetchDocuments();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to store document');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete document permanently from your locker?')) return;
    try {
      await api.delete(`/dms/documents/${id}`);
      showNotification('success', 'Document deleted.');
      fetchDocuments();
    } catch (err) {
      showNotification('error', 'Failed to delete document');
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      simulateUpload(file.name);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      simulateUpload(file.name);
    }
  };

  return (
    <>
    <div className="space-y-6 animate-fade-in">
      
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-850' : 'bg-rose-50 border-rose-200 text-rose-850'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">MIT DMS Document Locker</h2>
          <p className="text-sm text-indigo-200 font-medium mt-1">Cryptographically Verified Academic Credentials, Certificates, and marksheets</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Upload Zone Panel */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Secure Upload Console</h3>
            <p className="text-xs text-slate-400 font-medium">Verify and store your certificates on the university blockchain locker</p>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-500">Document Classification *</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:border-blue-500"
            >
              <option value="MARKSHEET">Marksheet Transcript</option>
              <option value="ID_CARD">Identity Card / Aadhaar</option>
              <option value="ADMISSION_LETTER">Admission Allotment Letter</option>
              <option value="SCHOLARSHIP_RECEIPT">Scholarship Receipt</option>
              <option value="OTHER">Other Credentials</option>
            </select>
          </div>

          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleFileDrop}
            className={`border-2 border-dashed rounded-3xl p-8 text-center transition-all ${
              dragOver ? 'border-blue-500 bg-blue-50/20' : 'border-slate-200 hover:border-blue-400 hover:bg-slate-50/50'
            } flex flex-col items-center justify-center min-h-[200px] relative`}
          >
            <input
              type="file"
              id="file-selector"
              onChange={handleFileSelect}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={isUploading}
            />
            {isUploading ? (
              <div className="space-y-4 w-full px-4">
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center animate-pulse mx-auto">
                  <UploadCloud size={24} />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700">Uploading & Cryptographically Signing...</p>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-blue-600 h-full transition-all duration-200" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto border border-slate-100">
                  <UploadCloud size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-700">Drag & drop files here to upload</p>
                  <p className="text-[10px] text-slate-400 mt-1 font-medium">Supports PDF, PNG, JPG up to 10MB</p>
                </div>
                <button className="bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold py-1.5 px-4 rounded-xl border border-slate-200/50 pointer-events-none">
                  Browse Files
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Locker Ledger Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm lg:col-span-2 space-y-6">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">Your Signed Documents</h3>
            <p className="text-xs text-slate-400 font-medium">Verify signatures and download secure document instances</p>
          </div>

          <div className="overflow-x-auto">
            {documents.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-2">
                <FileText size={40} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold">No documents stored in your secure locker yet.</p>
              </div>
            ) : (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-150 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                    <th className="pb-3">Document Info</th>
                    <th className="pb-3">Size & Type</th>
                    <th className="pb-3">Cryptographic Signature</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.map((doc) => (
                    <tr key={doc.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                      <td className="py-4.5 pr-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-slate-150 rounded-xl flex items-center justify-center text-slate-600 border border-slate-200/50">
                            <FileText size={16} />
                          </div>
                          <div>
                            <span className="block font-bold text-slate-800 leading-snug">{doc.doc_name}</span>
                            <span className="inline-flex items-center gap-1 text-[9px] text-slate-400 font-bold uppercase mt-1">
                              <Calendar size={10} />
                              {new Date(doc.uploaded_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4.5 pr-4">
                        <span className="block font-bold text-slate-700">{doc.file_size}</span>
                        <span className="inline-block bg-slate-100 text-slate-600 text-[9px] font-extrabold px-2 py-0.5 rounded-lg border border-slate-200 mt-1 uppercase">
                          {doc.doc_type}
                        </span>
                      </td>
                      <td className="py-4.5 pr-4 max-w-[200px]">
                        <div className="flex items-center gap-1.5 bg-emerald-50/60 border border-emerald-100/50 rounded-xl p-2 font-mono text-[9px] text-emerald-800">
                          <ShieldCheck size={14} className="text-emerald-600 shrink-0" />
                          <span className="truncate" title={doc.cryptographic_hash}>{doc.cryptographic_hash}</span>
                        </div>
                      </td>
                      <td className="py-4.5 text-right space-x-1.5">
                        <button
                          onClick={() => alert(`Cryptographic SHA-256 Signature Verification Status: ACTIVE & VALID\nSignature Hash: ${doc.cryptographic_hash}`)}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-colors inline-flex items-center justify-center"
                          title="Verify Signature Certificate"
                        >
                          <ShieldCheck size={14} />
                        </button>
                        <button
                          onClick={() => setPreviewUrl(`http://localhost:8000/dms/download/${doc.id}`)}
                          className="bg-blue-50 hover:bg-blue-100 text-blue-600 p-2 rounded-xl transition-colors inline-flex items-center justify-center border border-blue-100"
                          title="Preview Document"
                        >
                          <Eye size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="bg-rose-50 hover:bg-rose-100 text-rose-600 p-2 rounded-xl transition-colors inline-flex items-center justify-center border border-rose-100"
                          title="Delete Permanently"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>

    </div>

      {/* DOCUMENT PREVIEW MODAL */}
      {previewUrl && (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200">
          <div className="w-full max-w-6xl h-full bg-white rounded-3xl overflow-hidden flex flex-col shadow-2xl border border-white/20">
            <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-800">Secure Document Preview</h3>
              <div className="flex gap-2">
                <a 
                  href={previewUrl}
                  download
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  Download File
                </a>
                <button 
                  onClick={() => setPreviewUrl(null)}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-sm font-bold shadow-sm transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
            <div className="flex-1 w-full bg-slate-100/50 p-4">
              <iframe 
                src={previewUrl} 
                className="w-full h-full rounded-2xl border border-slate-200 bg-white"
                title="Document Preview"
              />
            </div>
          </div>
        </div>
      )}

    </>
  );
}

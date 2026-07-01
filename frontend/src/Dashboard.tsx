import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Calendar, Bell, Search, Send, CheckCircle2, User as UserIcon, Paperclip, File, Video, Image } from 'lucide-react';
import { useAuth } from './context/AuthContext';
import api from './api';

export default function Dashboard() {
  const { logout } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Dashboard Data
  const [jobTray, setJobTray] = useState({ pending_leaves: 0, pending_requisitions: 0, missed_punches: 0 });
  const [bulletinPosts, setBulletinPosts] = useState<any[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [posting, setPosting] = useState(false);

  // Student specific data
  const [invoices, setInvoices] = useState<any[]>([]);
  const [paying, setPaying] = useState(false);
  const [timetable, setTimetable] = useState<any[]>([]);

  // Attachments State
  const [attachmentUrl, setAttachmentUrl] = useState<string>('');
  const [attachmentType, setAttachmentType] = useState<string>('');
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [selectedFileObj, setSelectedFileObj] = useState<any>(null);
  const [customFileName, setCustomFileName] = useState<string>('');
  const [showRenameModal, setShowRenameModal] = useState(false);

  // Preview State
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const navigate = useNavigate();

  const handleLocalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFileObj(file);
      setCustomFileName(file.name);
      setShowRenameModal(true);
      const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
      let type = 'FILE';
      if (['PDF'].includes(ext)) type = 'PDF';
      else if (['XLSX', 'XLS', 'CSV'].includes(ext)) type = 'EXCEL';
      else if (['PNG', 'JPG', 'JPEG', 'GIF'].includes(ext)) type = 'IMAGE';
      else if (['MP4', 'MOV', 'AVI'].includes(ext)) type = 'VIDEO';
      setAttachmentType(type);
    }
    setShowAttachMenu(false);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, bulletinRes, trayRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/bulletin'),
          api.get('/job-tray/me')
        ]);
        setUser(userRes.data);
        setBulletinPosts(bulletinRes.data);
        setJobTray(trayRes.data);

        if (userRes.data.system_role === 'STUDENT') {
          const [invRes, ttRes] = await Promise.all([
            api.get('/finance/invoices/me'),
            api.get('/academics/timetable/student/me')
          ]);
          setInvoices(invRes.data);
          setTimetable(ttRes.data);
        } else if (userRes.data.system_role === 'FACULTY') {
          const ttRes = await api.get('/academics/timetable/faculty/me');
          setTimetable(ttRes.data);
        }
      } catch (err) {
        logout();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate, logout]);


  const handlePayFees = async (invoiceId: string) => {
    setPaying(true);
    try {
      await new Promise(r => setTimeout(r, 1000));
      await api.post(`/finance/invoices/${invoiceId}/pay`);
      const invRes = await api.get('/finance/invoices/me');
      setInvoices(invRes.data);
      alert('Payment Successful! Receipt generated.');
    } catch (err) { console.error(err); } finally { setPaying(false); }
  };

  const handlePostBulletin = async () => {
    if (!newPostContent.trim()) return;
    setPosting(true);
    try {
      let finalUrl = attachmentUrl || null;
      let finalType = attachmentType || null;

      if (selectedFileObj) {
        const fileToUpload = new window.File([selectedFileObj], customFileName, { type: selectedFileObj.type });
        const formData = new FormData();
        formData.append('file', fileToUpload);

        const uploadRes = await api.post('/bulletin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        finalUrl = uploadRes.data.url;

        const ext = customFileName.split('.').pop()?.toUpperCase() || 'FILE';
        if (['PDF'].includes(ext)) finalType = 'PDF';
        else if (['XLSX', 'XLS', 'CSV'].includes(ext)) finalType = 'EXCEL';
        else if (['PNG', 'JPG', 'JPEG', 'GIF'].includes(ext)) finalType = 'IMAGE';
        else if (['MP4', 'MOV', 'AVI'].includes(ext)) finalType = 'VIDEO';
        else finalType = 'FILE';
      }

      const res = await api.post('/bulletin', {
        content: newPostContent,
        attachment_url: finalUrl,
        attachment_type: finalType
      });
      setBulletinPosts([res.data, ...bulletinPosts]);
      setNewPostContent('');
      setAttachmentUrl('');
      setAttachmentType('');
      setSelectedFileObj(null);
      setCustomFileName('');
      setShowAttachMenu(false);
    } catch (err) {
      console.error(err);
      alert('Failed to post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium">Loading Workspace...</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column: Quick Profile & Job Tray */}
        <div className="lg:col-span-3 space-y-6">
          {/* Profile Bento */}
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold mb-4 shadow-lg shadow-blue-500/20">
              {user?.first_name?.charAt(0)}{user?.last_name?.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">{user?.first_name} {user?.last_name}</h2>
            <p className="text-sm font-medium text-blue-600 mb-6">{user?.system_role}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-slate-600 font-medium bg-slate-50 p-3 rounded-xl">
                <UserIcon size={16} className="text-slate-400" />
                {user?.email}
              </div>
            </div>
          </div>

          {/* Job Tray or Student Actions */}
          {user?.system_role !== 'STUDENT' ? (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-orange-100 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-5 flex items-center gap-2">
                <Bell size={18} className="text-orange-500" /> Action Required
              </h3>

              <div className="space-y-3">
                <div className="group/item flex items-center justify-between p-3 rounded-xl bg-orange-50/50 hover:bg-orange-50 border border-orange-100 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold text-orange-900">Pending Leaves</span>
                  <span className="bg-orange-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm shadow-orange-200">{jobTray.pending_leaves}</span>
                </div>
                <div className="group/item flex items-center justify-between p-3 rounded-xl bg-blue-50/50 hover:bg-blue-50 border border-blue-100 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold text-blue-900">Pending Requisitions</span>
                  <span className="bg-blue-500 text-white text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg shadow-sm shadow-blue-200">{jobTray.pending_requisitions}</span>
                </div>
                <div className="group/item flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer">
                  <span className="text-sm font-semibold text-slate-700">Missed Punches</span>
                  <span className="bg-slate-200 text-slate-600 text-xs font-bold w-6 h-6 flex items-center justify-center rounded-lg">{jobTray.missed_punches}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-4 flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> Fee Status
              </h3>
              {invoices.filter((i: any) => i.status === 'PENDING').map((inv: any) => (
                <div key={inv.id} className="bg-orange-50 p-4 rounded-2xl border border-orange-100 mb-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-orange-900">{inv.description}</span>
                    <span className="text-lg font-black text-orange-700">₹{inv.amount}</span>
                  </div>
                  <button
                    onClick={() => handlePayFees(inv.id)}
                    disabled={paying}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-2 rounded-xl transition-colors shadow-sm"
                  >
                    {paying ? 'Processing...' : 'Pay Securely'}
                  </button>
                </div>
              ))}
              {invoices.filter((i: any) => i.status === 'PENDING').length === 0 && (
                <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 flex items-center gap-3 text-emerald-800 font-semibold text-sm">
                  <CheckCircle2 className="text-emerald-500" size={20} /> All Dues Cleared!
                </div>
              )}
            </div>
          )}
        </div>

        {/* Middle Column: Bulletin Board */}
        <div className="lg:col-span-6 space-y-6">

          {/* PRINCIPAL COMMAND CENTER */}
          {/* {user?.system_role === 'PRINCIPAL' && (
                <div className="bg-gradient-to-r from-red-600 to-rose-700 rounded-3xl p-6 text-white shadow-lg mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Bell className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">UGC Grievance Command Center</h2>
                      <p className="text-rose-100 text-sm">Secure Portal: Escalated Anonymous Tickets</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex justify-between items-center hover:bg-white/20 transition-colors cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">ANTI-RAGGING</span>
                          <span className="text-sm font-semibold opacity-90">Ticket #892-A</span>
                        </div>
                        <p className="text-sm font-medium">Anonymous report from Men's Hostel Block C regarding harassment.</p>
                      </div>
                      <button className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">Resolve</button>
                    </div>
                    
                    <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex justify-between items-center hover:bg-white/20 transition-colors cursor-pointer">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="bg-amber-500 text-white text-[10px] font-bold px-2 py-1 rounded-full">ACADEMIC</span>
                          <span className="text-sm font-semibold opacity-90">Ticket #771-B</span>
                        </div>
                        <p className="text-sm font-medium">Multiple students reporting syllabus incompletion for Subject CSE301.</p>
                      </div>
                      <button className="bg-white text-red-600 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">Resolve</button>
                    </div>
                  </div>
                </div>
              )} */}

          {/* ALUMNI ENDOWMENT PORTAL */}
          {user?.system_role === 'ALUMNI' && (
            <div className="bg-gradient-to-br from-indigo-900 via-blue-900 to-indigo-800 rounded-3xl p-8 text-white shadow-xl mb-6 relative overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <UserIcon className="w-48 h-48" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl font-bold mb-2">Welcome Back, Alumni!</h2>
                <p className="text-indigo-200 mb-6 max-w-md">Your contributions help SutraOS University build state-of-the-art labs and provide scholarships to underprivileged students.</p>

                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 inline-block w-full max-w-md">
                  <h3 className="font-bold text-lg mb-4 text-white flex items-center gap-2">
                    <span className="text-emerald-400">●</span> Corpus Fund Donation
                  </h3>
                  <div className="flex items-center gap-3 mb-4">
                    <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-xl font-bold transition-colors">₹5,000</button>
                    <button className="flex-1 bg-white/20 hover:bg-white/30 py-2 rounded-xl font-bold transition-colors">₹10,000</button>
                    <button className="flex-1 bg-white text-indigo-900 py-2 rounded-xl font-bold transition-colors shadow-lg">Custom</button>
                  </div>
                  <button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-lg transition-colors">
                    Donate Now (80G Tax Exempt)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Compose Bento */}
          <div className="bg-white rounded-3xl p-2 shadow-sm border border-slate-200/60 focus-within:shadow-md focus-within:border-blue-300 transition-all">
            <div className="p-4">
              <textarea
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                className="w-full text-lg resize-none outline-none text-slate-800 placeholder-slate-300 font-medium"
                placeholder="Share an update with the campus..."
                rows={2}
              />
            </div>
            <div className="flex justify-between items-center p-2 bg-slate-50/50 rounded-2xl relative">
              <div className="flex gap-2">
                <input
                  type="file"
                  id="local-file-input"
                  className="hidden"
                  onChange={handleLocalFileUpload}
                />
                <button
                  onClick={() => setShowAttachMenu(!showAttachMenu)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${attachmentUrl ? 'bg-blue-100 text-blue-600' : 'text-slate-400 hover:bg-white hover:shadow-sm'}`}
                >
                  <Paperclip size={18} />
                </button>
                {showAttachMenu && (
                  <div className="absolute left-2 bottom-12 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 flex flex-col gap-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-150 w-56">
                    <button
                      onClick={() => document.getElementById('local-file-input')?.click()}
                      className="px-3 py-2 text-left hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-2"
                    >
                      📂 Local Browser File
                    </button>
                    <button
                      onClick={() => { setAttachmentUrl('google_drive_exam_circular.pdf'); setAttachmentType('PDF'); setShowAttachMenu(false); }}
                      className="px-3 py-2 text-left hover:bg-slate-50 text-xs font-bold text-slate-700 rounded-lg flex items-center gap-2"
                    >
                      ☁️ Link from Google Drive
                    </button>
                  </div>
                )}
                {attachmentUrl && (
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1 bg-blue-50 px-3 py-2 rounded-xl border border-blue-100">
                    📎 {attachmentUrl} ({attachmentType})
                    <button onClick={() => { setAttachmentUrl(''); setAttachmentType(''); }} className="hover:text-red-600 ml-1 font-bold">✕</button>
                  </span>
                )}
              </div>
              <button
                onClick={handlePostBulletin}
                disabled={posting || !newPostContent.trim()}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-sm shadow-blue-600/20 transition-all flex items-center gap-2"
              >
                {posting ? 'Posting...' : <><Send size={16} /> Post</>}
              </button>
            </div>
          </div>

          {/* Feed List */}
          <div className="space-y-4">
            {bulletinPosts.map((post: any) => (
              <div key={post.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-100 to-indigo-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-sm">
                      {post.author_name ? post.author_name.split(' ').map((n: string) => n[0]).join('') : 'U'}
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{post.author_name || 'Campus User'}</div>
                      <div className="text-[10px] font-bold text-blue-600">{post.author_role || 'Staff'}</div>
                    </div>
                  </div>
                  <div className="text-[10px] font-medium text-slate-400">{new Date(post.created_at).toLocaleString()}</div>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium mb-4">
                  {post.content}
                </p>

                {post.attachment_url && (
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-between hover:bg-slate-100/50 transition-colors">
                    <div className="flex items-center gap-3">
                      {post.attachment_type === 'PDF' && <FileText className="text-red-500" size={24} />}
                      {post.attachment_type === 'EXCEL' && <File className="text-emerald-500" size={24} />}
                      {post.attachment_type === 'IMAGE' && <Image className="text-blue-500" size={24} />}
                      {post.attachment_type === 'VIDEO' && <Video className="text-purple-500" size={24} />}
                      <div>
                        <div className="font-bold text-slate-800 text-xs">{post.attachment_url.split('/').pop()}</div>
                        <div className="text-[9px] text-slate-400 font-semibold">{post.attachment_type} Document</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={post.attachment_url.startsWith('http') ? post.attachment_url : `/api${post.attachment_url}`}
                        download={post.attachment_url.split('/').pop()}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:text-blue-700 text-xs font-bold bg-white hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-colors flex items-center justify-center"
                      >
                        Download
                      </a>
                      <button
                        onClick={() => setPreviewUrl(post.attachment_url.startsWith('http') ? post.attachment_url : `/api${post.attachment_url}`)}
                        className="text-emerald-600 hover:text-emerald-700 text-xs font-bold bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm transition-colors flex items-center justify-center"
                      >
                        Preview
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {bulletinPosts.length === 0 && (
              <div className="bg-white/50 border border-dashed border-slate-300 rounded-3xl p-12 flex flex-col items-center justify-center text-slate-400">
                <FileText size={48} className="mb-4 opacity-20" />
                <p className="font-semibold">No recent posts found on the bulletin board.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Mini Apps / Shortcuts */}
        <div className="lg:col-span-3 space-y-6">

          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-6 shadow-md text-white">
            <h3 className="text-lg font-bold tracking-tight mb-4">My Timetable</h3>
            {timetable.length > 0 ? (
              <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
                {timetable.map((slot: any, i: number) => (
                  <div key={i} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl border border-white/10 transition-colors">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-white text-sm">{slot.offering?.course?.name}</span>
                      <span className="text-[10px] text-indigo-100 font-bold bg-white/20 px-2 py-0.5 rounded-lg">{slot.classroom?.room_number}</span>
                    </div>
                    <div className="text-[11px] text-indigo-200 font-semibold mt-1">
                      {slot.day_of_week} | {slot.start_time} - {slot.end_time}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p className="text-indigo-100 text-sm font-medium mb-6">No scheduled classes today. Enjoy your free time!</p>
                <button className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md text-white font-semibold py-2.5 rounded-xl transition-colors text-sm">
                  View Full Schedules immediatly
                </button>
              </>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <h3 className="text-sm font-bold text-slate-800 tracking-tight mb-4 uppercase">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <div onClick={() => window.location.href = '/finance'} className="bg-slate-50 hover:bg-blue-50 border border-slate-100 hover:border-blue-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <Calendar size={24} className="text-slate-400 group-hover:text-blue-500 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-blue-700">Finance</span>
              </div>
              <div onClick={() => window.location.href = '/myhr'} className="bg-slate-50 hover:bg-emerald-50 border border-slate-100 hover:border-emerald-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <CheckCircle2 size={24} className="text-slate-400 group-hover:text-emerald-500 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-emerald-700">HR</span>
              </div>
              <div onClick={() => window.location.href = '/directory'} className="bg-slate-50 hover:bg-purple-50 border border-slate-100 hover:border-purple-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <Search size={24} className="text-slate-400 group-hover:text-purple-500 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-purple-700">Directory</span>
              </div>
              <div onClick={() => alert("Settings modal opened")} className="bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-100 p-4 rounded-2xl flex flex-col items-center justify-center text-center cursor-pointer transition-colors group">
                <LayoutDashboard size={24} className="text-slate-400 group-hover:text-orange-500 mb-2 transition-colors" />
                <span className="text-xs font-bold text-slate-600 group-hover:text-orange-700">Settings</span>
              </div>
            </div>
          </div>

        </div>

        {/* File Rename Modal */}
        {showRenameModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
              <h3 className="text-xl font-bold text-slate-800 mb-2">Rename Attachment</h3>
              <p className="text-xs font-medium text-slate-400 mb-4 uppercase tracking-wider">Customize file name before upload</p>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Filename</label>
                  <input
                    type="text"
                    value={customFileName}
                    onChange={e => setCustomFileName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white font-semibold text-slate-800"
                    required
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAttachmentUrl(customFileName);
                      setShowRenameModal(false);
                    }}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-indigo-600/20 text-sm"
                  >
                    Confirm Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFileObj(null);
                      setCustomFileName('');
                      setAttachmentUrl('');
                      setAttachmentType('');
                      setShowRenameModal(false);
                    }}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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
      </div>
    </>
  );
}

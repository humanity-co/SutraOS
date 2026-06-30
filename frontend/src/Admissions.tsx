import { useState, useEffect } from 'react';
import { UserCheck, GraduationCap, ArrowRight, Plus, FileText } from 'lucide-react';
import api from './api';
import StudentDetailModal from './StudentDetailModal';

interface Applicant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  hsc_percentage: number;
  category: string;
  status: string;
  applied_at: string;
}

export default function Admissions() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [admitResult, setAdmitResult] = useState<{ username: string; tempPass: string; name: string } | null>(null);
  const [admissionsTab, setAdmissionsTab] = useState<'merit' | 'direct'>('merit');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  const [directForm, setDirectForm] = useState({
    first_name: '',
    last_name: '',
    email: '',
    username: '',
    password: '',
    department_code: 'CSE',
    category: 'GENERAL',
    father_name: '',
    father_contact: '',
    father_address: '',
    mother_name: '',
    mother_contact: '',
    mother_address: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!directForm.username || !directForm.password) {
      showNotification('error', 'Username and Password are required');
      return;
    }
    try {
      const res = await api.post('/admissions/register-direct', directForm);
      showNotification('success', 'Student registered directly successfully!');
      setAdmitResult({
        username: res.data.username,
        tempPass: directForm.password,
        name: `${directForm.first_name} ${directForm.last_name}`
      });
      // reset form
      setDirectForm({
        first_name: '',
        last_name: '',
        email: '',
        username: '',
        password: '',
        department_code: 'CSE',
        category: 'GENERAL',
        father_name: '',
        father_contact: '',
        father_address: '',
        mother_name: '',
        mother_contact: '',
        mother_address: ''
      });
      setAdmissionsTab('merit');
      fetchApplicants();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Direct registration failed');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchApplicants = async () => {
    try {
      const res = await api.get('/admissions/applications');
      setApplicants(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchApplicants();
  }, []);

  const handleAdmit = async (id: string, name: string) => {
    if (!window.confirm(`Formally admit candidate ${name} and provision their student ERP account?`)) return;
    try {
      const res = await api.post(`/admissions/applications/${id}/admit`);
      showNotification('success', `${name} admitted successfully! ERP credentials created.`);
      setAdmitResult({
        username: res.data.username,
        tempPass: res.data.temporary_password,
        name
      });
      fetchApplicants();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to admit candidate');
    }
  };

  const filteredApplicants = applicants.filter(app => {
    if (selectedCategory === 'ALL') return true;
    return app.category === selectedCategory;
  });

  // Calculate stats
  const totalApplied = applicants.length;
  const totalAdmitted = applicants.filter(a => a.status === 'ADMITTED').length;
  const pendingApps = applicants.filter(a => a.status === 'PENDING').length;

  return (
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

      {/* Account Generated Modal */}
      {admitResult && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-8 max-w-md w-full shadow-2xl space-y-6 relative overflow-hidden animate-scale-in">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 mx-auto">
              <UserCheck size={28} />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-extrabold text-slate-800">ERP Student Account Activated</h3>
              <p className="text-xs text-slate-400 font-medium">Candidate {admitResult.name} has been enrolled in the database.</p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-3 font-mono text-xs">
              <div className="flex justify-between">
                <span className="text-slate-450 font-semibold">USERNAME:</span>
                <span className="font-bold text-slate-800">{admitResult.username}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-semibold">TEMP PASSWORD:</span>
                <span className="font-bold text-slate-800">{admitResult.tempPass}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-450 font-semibold">COURSE DIVISION:</span>
                <span className="font-bold text-slate-800">CSE Division A</span>
              </div>
            </div>

            <button
              onClick={() => setAdmitResult(null)}
              className="w-full bg-slate-900 hover:bg-slate-850 text-white font-bold text-xs py-3 rounded-xl transition-colors uppercase tracking-wider"
            >
              Close Confirmation
            </button>
          </div>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">MIT Admissions Onboarding Board</h2>
            <p className="text-sm text-indigo-200 font-medium mt-1">Review HSC Merit Lists, Reservation category quotas, and register admitted students</p>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 border border-white/10 p-3 rounded-2xl backdrop-blur-md">
            <div className="text-center px-4 border-r border-white/10">
              <span className="block text-[9px] text-indigo-200 font-bold uppercase">APPLIED</span>
              <span className="text-lg font-extrabold">{totalApplied}</span>
            </div>
            <div className="text-center px-4 border-r border-white/10">
              <span className="block text-[9px] text-indigo-200 font-bold uppercase">ADMITTED</span>
              <span className="text-lg font-extrabold text-emerald-350">{totalAdmitted}</span>
            </div>
            <div className="text-center px-4">
              <span className="block text-[9px] text-indigo-200 font-bold uppercase">PENDING</span>
              <span className="text-lg font-extrabold text-amber-350">{pendingApps}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/55 max-w-md">
        <button
          onClick={() => setAdmissionsTab('merit')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            admissionsTab === 'merit' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={14} /> Merit Applicant Board
        </button>
        <button
          onClick={() => setAdmissionsTab('direct')}
          className={`flex-1 py-2 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            admissionsTab === 'direct' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Plus size={14} /> Direct Registration
        </button>
      </div>

      {admissionsTab === 'direct' ? (
        <form onSubmit={handleDirectRegister} className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6 animate-fade-in">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="font-extrabold text-slate-850 text-base">Direct Student Registration Ledger Form</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Provision a new student directly into the databases with immediate profile credentials creation</p>
          </div>

          <div className="space-y-4">
            {/* Core details */}
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider">1. Academic & User Credentials</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">First Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Balaji"
                  value={directForm.first_name}
                  onChange={(e) => setDirectForm({...directForm, first_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Patil"
                  value={directForm.last_name}
                  onChange={(e) => setDirectForm({...directForm, last_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. balaji.patil@mit.edu"
                  value={directForm.email}
                  onChange={(e) => setDirectForm({...directForm, email: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-805"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Roll No / Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. mit2024cse150"
                  value={directForm.username}
                  onChange={(e) => setDirectForm({...directForm, username: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold font-mono text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Passcode / Password *</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={directForm.password}
                  onChange={(e) => setDirectForm({...directForm, password: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Department *</label>
                <select
                  value={directForm.department_code}
                  onChange={(e) => setDirectForm({...directForm, department_code: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-bold text-slate-700"
                >
                  <option value="CSE">Computer Science & Eng</option>
                  <option value="ME">Mechanical Eng</option>
                  <option value="CE">Civil Eng</option>
                  <option value="ECE">Electronics & Comm Eng</option>
                  <option value="PPE">Polymer Technology</option>
                  <option value="AIDS">AI & Data Science</option>
                  <option value="CSD">CS & Design</option>
                  <option value="MBA">MBA Management</option>
                  <option value="BSH">Basic Sciences & Hum</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Quota Quota *</label>
                <select
                  value={directForm.category}
                  onChange={(e) => setDirectForm({...directForm, category: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-bold text-slate-700"
                >
                  <option value="GENERAL">General / Open</option>
                  <option value="OBC">OBC</option>
                  <option value="SC">SC</option>
                  <option value="ST">ST</option>
                </select>
              </div>
            </div>

            {/* Parent info */}
            <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider pt-2">2. Parent & Contact Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 p-4.5 rounded-2xl border border-slate-200/50">
              <div className="space-y-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Father Details</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Father Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Balaji Patil"
                    value={directForm.father_name}
                    onChange={(e) => setDirectForm({...directForm, father_name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Father Contact No (10-digit)</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={directForm.father_contact}
                    onChange={(e) => setDirectForm({...directForm, father_contact: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Permanent Address</label>
                  <input
                    type="text"
                    placeholder="e.g. Flat 302, Royal Residency, Aurangabad"
                    value={directForm.father_address}
                    onChange={(e) => setDirectForm({...directForm, father_address: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <span className="block text-[10px] font-black text-slate-400 uppercase tracking-wider">Mother Details</span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mother Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Vaishali Patil"
                    value={directForm.mother_name}
                    onChange={(e) => setDirectForm({...directForm, mother_name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mother Contact No</label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543211"
                    value={directForm.mother_contact}
                    onChange={(e) => setDirectForm({...directForm, mother_contact: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold font-mono text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Mother Address (Optional)</label>
                  <input
                    type="text"
                    placeholder="Same as father's address if blank"
                    value={directForm.mother_address}
                    onChange={(e) => setDirectForm({...directForm, mother_address: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-blue-500 font-semibold text-slate-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 px-8 rounded-xl transition-all shadow-md shadow-indigo-500/20 uppercase tracking-wider flex items-center gap-2"
              >
                Register & Enroll Student
              </button>
              <button
                type="button"
                onClick={() => setAdmissionsTab('merit')}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs py-3 px-6 rounded-xl transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-6">
          
          {/* Filter controls */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-5">
          <div>
            <h3 className="font-extrabold text-slate-800 text-base">HSC Percentage Merit Ranking</h3>
            <p className="text-xs text-slate-400 font-medium">Rankings auto-sort by 12th Grade scores to manage admissions seat quotas</p>
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl border border-slate-200/50">
            {['ALL', 'GENERAL', 'OBC', 'SC', 'ST'].map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase transition-all ${
                  selectedCategory === cat ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Applicants Grid Table */}
        <div className="overflow-x-auto">
          {filteredApplicants.length === 0 ? (
            <p className="text-sm font-semibold text-slate-400 py-6 text-center">No applicants found matching filter criteria.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-150 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="pb-3 pl-3">Rank / Candidate</th>
                  <th className="pb-3">HSC score</th>
                  <th className="pb-3">Category Quota</th>
                  <th className="pb-3">Admission Status</th>
                  <th className="pb-3 text-right pr-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredApplicants.map((app, index) => (
                  <tr key={app.id} className="text-xs hover:bg-slate-50/50 transition-colors">
                    <td className="py-4.5 pr-4 pl-3">
                      <div className="flex items-center gap-4">
                        <span className="w-6 h-6 bg-slate-100 text-slate-500 font-extrabold rounded-full flex items-center justify-center text-[10px] border border-slate-200/50">
                          {index + 1}
                        </span>
                        <div>
                          <span className="block font-extrabold text-slate-800 text-sm leading-snug">{app.first_name} {app.last_name}</span>
                          <span className="block text-[10px] text-slate-400 mt-0.5">{app.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 pr-4">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap size={16} className="text-indigo-500" />
                        <span className="font-extrabold text-slate-800 text-sm">{app.hsc_percentage.toFixed(2)}%</span>
                      </div>
                    </td>
                    <td className="py-4.5 pr-4">
                      <span className={`inline-block text-[9px] font-extrabold px-2.5 py-0.5 rounded-lg border uppercase ${
                        app.category === 'GENERAL' ? 'bg-slate-50 text-slate-600 border-slate-200' :
                        app.category === 'OBC' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                        app.category === 'SC' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                        'bg-purple-50 text-purple-600 border-purple-100'
                      }`}>
                        {app.category}
                      </span>
                    </td>
                    <td className="py-4.5 pr-4">
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg ${
                        app.status === 'ADMITTED' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${app.status === 'ADMITTED' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                        {app.status}
                      </span>
                    </td>
                    <td className="py-4.5 text-right pr-3">
                      {app.status === 'PENDING' ? (
                        <button
                          onClick={() => handleAdmit(app.id, `${app.first_name} ${app.last_name}`)}
                          className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] py-1.5 px-3 rounded-xl inline-flex items-center gap-1 uppercase transition-all shadow-md shadow-blue-500/10"
                        >
                          Admit & Register
                          <ArrowRight size={10} />
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-extrabold uppercase bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-100">
                          Enrolled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      <StudentDetailModal 
        studentId={selectedStudentId} 
        isOpen={selectedStudentId !== null} 
        onClose={() => setSelectedStudentId(null)} 
      />
    </div>
  );
}

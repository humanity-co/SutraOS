import { useState, useEffect } from 'react';
import { Award, FileText, Plus, CheckCircle, Clock, ExternalLink } from 'lucide-react';
import api from './api';

interface ResearchProject {
  id: string;
  title: string;
  funding_agency: string;
  amount: number;
  duration: string;
  status: string;
  faculty_id: string;
  faculty?: {
    first_name: string;
    last_name: string;
    username: string;
  };
}

interface ResearchPublication {
  id: string;
  title: string;
  journal: string;
  author_name: string;
  year: number;
  doi?: string;
  citation_count: number;
}

export default function Research() {
  const [activeSubTab, setActiveSubTab] = useState<'projects' | 'publications'>('projects');
  const [projects, setProjects] = useState<ResearchProject[]>([]);
  const [publications, setPublications] = useState<ResearchPublication[]>([]);
  const [user, setUser] = useState<any>(null);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showAddPub, setShowAddPub] = useState(false);

  // Forms
  const [projectForm, setProjectForm] = useState({
    title: '',
    funding_agency: '',
    amount: 100000,
    duration: '24 Months',
  });

  const [pubForm, setPubForm] = useState({
    title: '',
    journal: '',
    author_name: '',
    year: 2024,
    doi: '',
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchUser = async () => {
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get('/research/projects');
      setProjects(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPublications = async () => {
    try {
      const res = await api.get('/research/publications');
      setPublications(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchProjects();
    fetchPublications();
  }, []);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/research/projects', projectForm);
      showNotification('success', 'Research Project Grant registered successfully!');
      setShowAddProject(false);
      setProjectForm({ title: '', funding_agency: '', amount: 100000, duration: '24 Months' });
      fetchProjects();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to add project');
    }
  };

  const handleAddPub = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/research/publications', pubForm);
      showNotification('success', 'Faculty Research Publication logged successfully!');
      setShowAddPub(false);
      setPubForm({ title: '', journal: '', author_name: '', year: 2024, doi: '' });
      fetchPublications();
    } catch (err: any) {
      showNotification('error', err.response?.data?.detail || 'Failed to add publication');
    }
  };

  const isStaff = user && ['SUPER_ADMIN', 'ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY'].includes(user.system_role);

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

      {/* Header Banner */}
      <div className="bg-gradient-to-br from-indigo-900 via-indigo-950 to-slate-900 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16" />
        <div className="relative z-10">
          <h2 className="text-2xl font-extrabold tracking-tight">MIT Research & Innovation Hub</h2>
          <p className="text-sm text-indigo-200 font-medium mt-1">Funded Projects, Journal Publications, and Academic Research Contributions</p>
        </div>

        <div className="flex bg-white/10 p-1.5 rounded-xl border border-white/10 backdrop-blur-md relative z-10 self-start md:self-auto">
          <button
            onClick={() => setActiveSubTab('projects')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all uppercase ${
              activeSubTab === 'projects' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <Award size={14} />
            Research Projects
          </button>
          <button
            onClick={() => setActiveSubTab('publications')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-extrabold transition-all uppercase ${
              activeSubTab === 'publications' ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-200 hover:text-white'
            }`}
          >
            <FileText size={14} />
            Publications
          </button>
        </div>
      </div>

      {activeSubTab === 'projects' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Active Research Grants</h3>
              <p className="text-xs text-slate-400 font-medium">Externally funded development and investigation grants</p>
            </div>
            {isStaff && !showAddProject && (
              <button
                onClick={() => setShowAddProject(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/10 transition-all"
              >
                <Plus size={14} />
                Register Project Grant
              </button>
            )}
          </div>

          {showAddProject && (
            <form onSubmit={handleAddProject} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl max-w-2xl space-y-4 animate-fade-in">
              <h4 className="font-extrabold text-slate-800 text-sm">Register New Sponsored Project Grant</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Project Title *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.title}
                    onChange={(e) => setProjectForm({...projectForm, title: e.target.value})}
                    placeholder="e.g. Neural Networks for Power Load Balancing"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Funding Agency *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.funding_agency}
                    onChange={(e) => setProjectForm({...projectForm, funding_agency: e.target.value})}
                    placeholder="e.g. DST-SERB"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Grant Amount (INR) *</label>
                  <input
                    type="number"
                    required
                    value={projectForm.amount}
                    onChange={(e) => setProjectForm({...projectForm, amount: parseFloat(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Duration *</label>
                  <input
                    type="text"
                    required
                    value={projectForm.duration}
                    onChange={(e) => setProjectForm({...projectForm, duration: e.target.value})}
                    placeholder="e.g. 36 Months"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl">
                  Save Project
                </button>
                <button type="button" onClick={() => setShowAddProject(false)} className="bg-slate-200 text-slate-700 font-bold text-xs py-2 px-5 rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {projects.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">No active research projects registered.</p>
            ) : (
              projects.map((proj) => (
                <div key={proj.id} className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <span className="bg-indigo-50 text-indigo-600 border border-indigo-100 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-lg">
                        {proj.funding_agency}
                      </span>
                      <span className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-lg ${
                        proj.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                        {proj.status === 'COMPLETED' ? <CheckCircle size={10} /> : <Clock size={10} />}
                        {proj.status}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-base font-extrabold text-slate-800 tracking-tight leading-snug">{proj.title}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase mt-1">PI: {proj.faculty?.first_name} {proj.faculty?.last_name}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6 text-xs">
                    <div>
                      <span className="block text-[9px] text-slate-400 font-bold">FUNDING SPONSOR VALUE</span>
                      <span className="font-extrabold text-slate-800 text-sm">{(proj.amount / 100000).toFixed(2)} Lakhs INR</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-[9px] text-slate-400 font-bold">PROJECT DURATION</span>
                      <span className="font-bold text-slate-700">{proj.duration}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'publications' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-bold text-slate-800">Faculty Journal Publications</h3>
              <p className="text-xs text-slate-400 font-medium">Indexed research articles, IEEE/Elsevier conference papers, and patents</p>
            </div>
            {isStaff && !showAddPub && (
              <button
                onClick={() => setShowAddPub(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-4 rounded-xl flex items-center gap-2 shadow-md shadow-blue-500/10 transition-all"
              >
                <Plus size={14} />
                Log Paper Publication
              </button>
            )}
          </div>

          {showAddPub && (
            <form onSubmit={handleAddPub} className="bg-slate-50 border border-slate-200 p-6 rounded-3xl max-w-2xl space-y-4 animate-fade-in">
              <h4 className="font-extrabold text-slate-800 text-sm">Log New Research Publication</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Article Title *</label>
                  <input
                    type="text"
                    required
                    value={pubForm.title}
                    onChange={(e) => setPubForm({...pubForm, title: e.target.value})}
                    placeholder="e.g. Cryptographic Hashing for Smart Ledgers"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Journal/Conference Name *</label>
                  <input
                    type="text"
                    required
                    value={pubForm.journal}
                    onChange={(e) => setPubForm({...pubForm, journal: e.target.value})}
                    placeholder="e.g. IEEE Access"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Authors (Comma Separated) *</label>
                  <input
                    type="text"
                    required
                    value={pubForm.author_name}
                    onChange={(e) => setPubForm({...pubForm, author_name: e.target.value})}
                    placeholder="e.g. Prof. Bhupesh Mishra, S. Lomte"
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">Publication Year *</label>
                  <input
                    type="number"
                    required
                    value={pubForm.year}
                    onChange={(e) => setPubForm({...pubForm, year: parseInt(e.target.value)})}
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1.5">DOI Link Reference (Optional)</label>
                  <input
                    type="text"
                    value={pubForm.doi}
                    onChange={(e) => setPubForm({...pubForm, doi: e.target.value})}
                    placeholder="10.1109/..."
                    className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-500 font-semibold"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl">
                  Log Publication
                </button>
                <button type="button" onClick={() => setShowAddPub(false)} className="bg-slate-200 text-slate-700 font-bold text-xs py-2 px-5 rounded-xl">
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="space-y-4">
            {publications.length === 0 ? (
              <p className="text-sm font-semibold text-slate-400">No journal publications logged.</p>
            ) : (
              publications.map((pub) => (
                <div key={pub.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition-shadow flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1.5">
                    <h4 className="text-sm font-bold text-slate-800">{pub.title}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{pub.author_name} ({pub.year})</p>
                    <span className="inline-block text-[10px] font-bold text-blue-600 italic bg-blue-50/50 border border-blue-100/50 px-2 py-0.5 rounded">
                      {pub.journal}
                    </span>
                    {pub.doi && (
                      <span className="block text-[10px] font-mono text-slate-400">DOI: {pub.doi}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 self-stretch md:self-auto justify-between border-t md:border-t-0 border-slate-100 pt-3 md:pt-0">
                    <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl text-center min-w-[70px]">
                      <span className="block text-[9px] text-slate-400 font-extrabold uppercase">Citations</span>
                      <span className="text-sm font-extrabold text-slate-750">{pub.citation_count}</span>
                    </div>
                    {pub.doi && (
                      <a
                        href={`https://doi.org/${pub.doi}`}
                        target="_blank"
                        rel="noreferrer"
                        className="bg-slate-100 hover:bg-slate-200 text-slate-600 p-2 rounded-xl transition-colors"
                        title="Redirect to Publisher DOI"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

    </div>
  );
}

import { useEffect, useState } from 'react';
import { Briefcase, Building, ChevronRight, Send, CheckCircle2, Plus } from 'lucide-react';
import api from './api';

export default function PlacementsCampus({ setAuthToken }: { setAuthToken: (t: string | null) => void }) {
  const [user, setUser] = useState<any>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', role: '', ctc: '', min_cgpa: 6.0, drive_date: ''
  });
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
        
        const drivesRes = await api.get('/placements/drives');
        setDrives(drivesRes.data);
      } catch (err) {
        console.error("Failed to fetch placement data", err);
      }
    };
    fetchData();
  }, [setAuthToken]);

  const handleApply = async (driveId: string) => {
    try {
      await api.post(`/placements/apply?drive_id=${driveId}`);
      alert("Application Successful! Your SutraOS profile has been submitted.");
    } catch (e: any) {
      alert(e.response?.data?.detail || "Failed to apply");
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/placements/drives', {
        ...formData,
        eligible_departments: selectedDepts.join(', ')
      });
      const drivesRes = await api.get('/placements/drives');
      setDrives(drivesRes.data);
      setShowAddModal(false);
      setFormData({ company_name: '', role: '', ctc: '', min_cgpa: 6.0, drive_date: '' });
      setSelectedDepts([]);
    } catch (err) {
      alert("Failed to create drive");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Placements Section */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full opacity-50 pointer-events-none"></div>
          
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Campus Drives</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Upcoming recruitment drives and placement opportunities.</p>
            </div>
            <div className="flex items-center gap-3">
              {['PLACEMENT_OFFICER', 'SUPER_ADMIN'].includes(user?.system_role) && (
                <button 
                  onClick={() => setShowAddModal(true)} 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm shadow-indigo-600/20 flex items-center transition-all text-sm"
                >
                  <Plus size={16} className="mr-2" /> Define Drive
                </button>
              )}
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Building size={24} />
              </div>
            </div>
          </div>

          <div className="space-y-4 relative z-10">
            {drives.map(drive => (
              <div key={drive.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-center gap-4 hover:border-indigo-200 hover:shadow-md transition-all group cursor-pointer">
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-slate-100 to-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <Briefcase size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{drive.company_name}</h3>
                    <p className="text-sm font-semibold text-slate-500">{drive.role}</p>
                    {drive.eligible_departments && (
                      <div className="text-[10px] text-indigo-600 font-bold mt-1 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100 w-max">
                        Eligible: {drive.eligible_departments}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-wrap md:flex-nowrap items-center gap-4 w-full md:w-auto">
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CTC</div>
                    <div className="font-bold text-slate-700 text-sm">{drive.ctc}</div>
                  </div>
                  <div className="bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100 text-center">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Min CGPA</div>
                    <div className="font-bold text-slate-700 text-sm">{drive.min_cgpa}</div>
                  </div>
                  
                  {user?.system_role === 'STUDENT' ? (
                     <button 
                       onClick={() => handleApply(drive.id)}
                       className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-xl shadow-sm shadow-indigo-600/20 transition-all flex items-center gap-2"
                     >
                       Apply <Send size={14} />
                     </button>
                  ) : (
                     <button 
                       onClick={() => {
                         alert(`🏢 MULTI-ROUND PLACEMENT TRACKER\n\nDrive: ${drive.company_name}\n\n- Round 1 (Aptitude): 120 Applied | 45 Cleared\n- Round 2 (Technical): Scheduled for ${new Date(drive.drive_date).toLocaleDateString()}\n- HR Round: Pending\n\nClick OK to open the detailed Tracker Dashboard.`);
                       }}
                       className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-all flex items-center"
                     >
                       Manage <ChevronRight size={16} className="ml-1" />
                     </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 shadow-lg shadow-indigo-900/20 text-white">
           <h3 className="text-lg font-bold tracking-tight mb-6 opacity-90">Placement Statistics</h3>
           
           <div className="space-y-4">
             <div>
               <div className="flex justify-between text-sm font-semibold mb-1.5">
                 <span>CSE Department</span>
                 <span>85%</span>
               </div>
               <div className="w-full bg-white/20 rounded-full h-2">
                 <div className="bg-white h-2 rounded-full" style={{ width: '85%' }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm font-semibold mb-1.5">
                 <span>IT Department</span>
                 <span>72%</span>
               </div>
               <div className="w-full bg-white/20 rounded-full h-2">
                 <div className="bg-white h-2 rounded-full" style={{ width: '72%' }}></div>
               </div>
             </div>
             <div>
               <div className="flex justify-between text-sm font-semibold mb-1.5">
                 <span>Average CTC</span>
                 <span>8.5 LPA</span>
               </div>
             </div>
           </div>
        </div>

        {user?.system_role === 'STUDENT' && (
          <div className="bg-emerald-50 rounded-3xl p-6 shadow-sm border border-emerald-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 shadow-sm">
                <CheckCircle2 size={20} />
              </div>
              <h3 className="text-lg font-bold text-emerald-900 tracking-tight">Your Status</h3>
            </div>
            <p className="text-sm font-medium text-emerald-800 bg-white/50 p-4 rounded-2xl border border-emerald-100/50 leading-relaxed">
              You are eligible for upcoming drives. Keep your resume updated and check back for new opportunities!
            </p>
          </div>
        )}
      </div>

      {/* Add Placement Drive Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Define New Placement Drive</h3>
            <form onSubmit={handleAddSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Company Name</label>
                <input 
                  type="text" 
                  value={formData.company_name} 
                  onChange={e => setFormData({...formData, company_name: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Google India"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Role / Designation</label>
                <input 
                  type="text" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  placeholder="e.g. Associate Software Engineer"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Package CTC</label>
                  <input 
                    type="text" 
                    value={formData.ctc} 
                    onChange={e => setFormData({...formData, ctc: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    placeholder="e.g. 14.5 LPA"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Min CGPA Cutoff</label>
                  <input 
                    type="number" 
                    step="0.1"
                    min="5.0"
                    max="10.0"
                    value={formData.min_cgpa} 
                    onChange={e => setFormData({...formData, min_cgpa: parseFloat(e.target.value)})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Drive Date</label>
                <input 
                  type="date" 
                  value={formData.drive_date} 
                  onChange={e => setFormData({...formData, drive_date: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Eligible Departments</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {['CSE', 'ME', 'CE', 'ECE', 'AIDS', 'CSD', 'MBA', 'BSH', 'PPE'].map(dept => (
                    <label key={dept} className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={selectedDepts.includes(dept)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedDepts([...selectedDepts, dept]);
                          } else {
                            setSelectedDepts(selectedDepts.filter(d => d !== dept));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 border-slate-300"
                      />
                      {dept}
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-indigo-600/20 text-sm">Save Drive</button>
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

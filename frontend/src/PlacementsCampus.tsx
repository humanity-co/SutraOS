import { useEffect, useState } from 'react';
import { Briefcase, Building, ChevronRight, Send, CheckCircle2, Plus, Check, X } from 'lucide-react';
import api from './api';
import StudentDetailModal from './StudentDetailModal';

export default function PlacementsCampus() {
  const [user, setUser] = useState<any>(null);
  const [drives, setDrives] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'campus' | 'off-campus'>('campus');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    company_name: '', role: '', ctc: '', min_cgpa: 6.0, drive_date: ''
  });
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);

  // Off-Campus States
  const [myOffCampus, setMyOffCampus] = useState<any | null>(null);
  const [offCampusList, setOffCampusList] = useState<any[]>([]);
  const [offCampusForm, setOffCampusForm] = useState({
    company_name: '',
    job_profile: '',
    probation_months: '',
    after_confirmation_salary: '',
    probation_salary: '',
    bond_months: '',
    joining_date: ''
  });

  const fetchData = async () => {
    try {
      const userRes = await api.get('/users/me');
      const u = userRes.data;
      setUser(u);
      
      const drivesRes = await api.get('/placements/drives');
      setDrives(drivesRes.data);

      if (u.system_role === 'STUDENT') {
        try {
          const resMy = await api.get('/placements/off-campus/me');
          setMyOffCampus(resMy.data);
        } catch (e) {
          setMyOffCampus(null);
        }
      } else {
        const resList = await api.get('/placements/off-campus');
        setOffCampusList(resList.data);
      }
    } catch (err) {
      console.error("Failed to fetch placement data", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

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
      fetchData();
      setShowAddModal(false);
      setFormData({ company_name: '', role: '', ctc: '', min_cgpa: 6.0, drive_date: '' });
      setSelectedDepts([]);
    } catch (err) {
      alert("Failed to create drive");
    }
  };

  // Student reports off-campus placement
  const handleOffCampusSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/placements/off-campus', {
        company_name: offCampusForm.company_name,
        job_profile: offCampusForm.job_profile,
        probation_months: offCampusForm.probation_months ? parseInt(offCampusForm.probation_months) : null,
        after_confirmation_salary: offCampusForm.after_confirmation_salary,
        probation_salary: offCampusForm.probation_salary || null,
        bond_months: offCampusForm.bond_months ? parseInt(offCampusForm.bond_months) : null,
        joining_date: offCampusForm.joining_date
      });
      alert("Off-Campus Placement reported successfully to the TPO!");
      setOffCampusForm({
        company_name: '',
        job_profile: '',
        probation_months: '',
        after_confirmation_salary: '',
        probation_salary: '',
        bond_months: '',
        joining_date: ''
      });
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Failed to submit off-campus application");
    }
  };

  // TPO updates off-campus application status
  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/placements/off-campus/${id}/status?status=${status}`);
      alert(`Application updated successfully to ${status}!`);
      fetchData();
    } catch (err) {
      alert("Failed to update status");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Placements Section */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Navigation Sub-Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200/50 max-w-sm">
          <button
            onClick={() => setActiveSubTab('campus')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'campus' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Campus Drives
          </button>
          <button
            onClick={() => setActiveSubTab('off-campus')}
            className={`flex-1 py-2 px-4 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'off-campus' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Off-Campus Reporting
          </button>
        </div>

        {activeSubTab === 'campus' ? (
          // CAMPUS DRIVES TAB
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
                           alert(`MULTI-ROUND PLACEMENT TRACKER\n\nDrive: ${drive.company_name}\n\n- Round 1 (Aptitude): 120 Applied | 45 Cleared\n- Round 2 (Technical): Scheduled for ${new Date(drive.drive_date).toLocaleDateString()}\n- HR Round: Pending\n\nClick OK to open the detailed Tracker Dashboard.`);
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
        ) : (
          // OFF-CAMPUS PLACEMENT TAB
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <div className="border-b border-slate-100 pb-3 mb-6">
              <h3 className="text-xl font-bold text-slate-800">Placements » Off Campus</h3>
              <p className="text-sm font-medium text-slate-500 mt-1">Report or verify job offers received off-campus.</p>
            </div>

            {user?.system_role === 'STUDENT' ? (
              <>
                {!myOffCampus ? (
                  // Off-Campus Reporting Form (student)
                  <form onSubmit={handleOffCampusSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Company Name *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Tata Consultancy Services"
                          value={offCampusForm.company_name}
                          onChange={e => setOffCampusForm({...offCampusForm, company_name: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Job Profile *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Software Engineer"
                          value={offCampusForm.job_profile}
                          onChange={e => setOffCampusForm({...offCampusForm, job_profile: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">After Confirmation Salary *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 7.5 LPA"
                          value={offCampusForm.after_confirmation_salary}
                          onChange={e => setOffCampusForm({...offCampusForm, after_confirmation_salary: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">During Training Salary</label>
                        <input
                          type="text"
                          placeholder="e.g. 25,000 / month"
                          value={offCampusForm.probation_salary}
                          onChange={e => setOffCampusForm({...offCampusForm, probation_salary: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Probation Period (months)</label>
                        <input
                          type="number"
                          placeholder="e.g. 6"
                          value={offCampusForm.probation_months}
                          onChange={e => setOffCampusForm({...offCampusForm, probation_months: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Bond (in Months)</label>
                        <input
                          type="number"
                          placeholder="e.g. 24"
                          value={offCampusForm.bond_months}
                          onChange={e => setOffCampusForm({...offCampusForm, bond_months: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Joining Date *</label>
                        <input
                          type="date"
                          required
                          value={offCampusForm.joining_date}
                          onChange={e => setOffCampusForm({...offCampusForm, joining_date: e.target.value})}
                          className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-medium"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md text-sm"
                    >
                      Report Off-Campus Placement
                    </button>
                  </form>
                ) : (
                  // Reported placement status
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 max-w-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">{myOffCampus.company_name}</h4>
                        <p className="text-sm font-semibold text-slate-500">{myOffCampus.job_profile}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-xl text-xs font-extrabold uppercase ${
                        myOffCampus.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                        myOffCampus.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                      }`}>
                        {myOffCampus.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs font-semibold text-slate-500">
                      <div>Salary (After Confirmation): <span className="text-slate-700 font-bold">{myOffCampus.after_confirmation_salary}</span></div>
                      <div>Joining Date: <span className="text-slate-700 font-bold">{myOffCampus.joining_date}</span></div>
                      {myOffCampus.probation_months && <div>Probation Period: <span className="text-slate-700 font-bold">{myOffCampus.probation_months} months</span></div>}
                      {myOffCampus.bond_months && <div>Bond: <span className="text-slate-700 font-bold">{myOffCampus.bond_months} months</span></div>}
                    </div>
                  </div>
                )}
              </>
            ) : (
              // TPO Verification Panel
              <div className="space-y-4">
                <h4 className="text-base font-bold text-slate-800">Pending Off-Campus Job Verification requests</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Student</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Company & Profile</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Confirmation CTC</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Joining Date</th>
                        <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {offCampusList.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="p-8 text-center text-sm font-semibold text-slate-400">No off-campus requests filed.</td>
                        </tr>
                      ) : (
                        offCampusList.map(op => (
                          <tr key={op.id} className="hover:bg-slate-50/50">
                            <td 
                               onClick={() => setSelectedStudentId(op.student_id)}
                               className="p-4 text-sm font-bold text-slate-700 hover:text-blue-600 hover:underline cursor-pointer"
                             >
                               {op.student?.first_name} {op.student?.last_name}
                             </td>
                            <td className="p-4 text-sm font-semibold text-slate-600">
                              {op.company_name} <br/> <span className="text-xs font-medium text-slate-400">{op.job_profile}</span>
                            </td>
                            <td className="p-4 text-sm font-bold text-indigo-600">{op.after_confirmation_salary}</td>
                            <td className="p-4 text-sm font-semibold text-slate-500">{op.joining_date}</td>
                            <td className="p-4 text-sm flex gap-2">
                              {op.status === 'PENDING' ? (
                                <>
                                  <button
                                    onClick={() => handleUpdateStatus(op.id, 'APPROVED')}
                                    className="bg-emerald-600 hover:bg-emerald-700 text-white p-1.5 rounded-lg"
                                    title="Approve Placement"
                                  >
                                    <Check size={16} />
                                  </button>
                                  <button
                                    onClick={() => handleUpdateStatus(op.id, 'REJECTED')}
                                    className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-lg"
                                    title="Reject Request"
                                  >
                                    <X size={16} />
                                  </button>
                                </>
                              ) : (
                                <span className={`px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${op.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                  {op.status}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
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
      <StudentDetailModal 
        studentId={selectedStudentId} 
        isOpen={selectedStudentId !== null} 
        onClose={() => setSelectedStudentId(null)} 
      />
    </div>
  );
}

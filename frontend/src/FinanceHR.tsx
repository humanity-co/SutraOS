import { useEffect, useState } from 'react';
import { DollarSign, FileText, CheckCircle2 } from 'lucide-react';
import api from './api';

export default function FinanceHR({ setAuthToken }: { setAuthToken: (t: string | null) => void }) {
  const [user, setUser] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [scholarships, setScholarships] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubTab, setActiveSubTab] = useState('SCHOLARSHIPS');
  const [selectedScheme, setSelectedScheme] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Leave Application States
  const [showApplyLeaveModal, setShowApplyLeaveModal] = useState(false);
  const [leaveStartDate, setLeaveStartDate] = useState('');
  const [leaveEndDate, setLeaveEndDate] = useState('');
  const [leaveReason, setLeaveReason] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);

        const [invRes, schRes, deptRes] = await Promise.all([
          api.get('/finance/invoices/me'),
          api.get('/scholarships'),
          api.get('/departments')
        ]);
        setInvoices(invRes.data);
        setScholarships(schRes.data);
        setDepartments(deptRes.data);

        if (['ADMIN', 'HOD', 'PRINCIPAL', 'HR', 'SUPER_ADMIN'].includes(userRes.data.system_role)) {
          const leaveRes = await api.get('/hr/leaves');
          setLeaves(leaveRes.data);
        }

        if (['ACCOUNTS', 'REGISTRAR', 'SUPER_ADMIN', 'PRINCIPAL'].includes(userRes.data.system_role)) {
          const studRes = await api.get('/directory/students');
          setStudents(studRes.data);
        }
      } catch (err) {
        // Handle auth error gracefully in Layout
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [setAuthToken]);

  const handleLeaveDecision = async (id: string, decision: string) => {
    try {
      await api.put(`/hr/leaves/${id}/approve?status=${decision}`);
      const leaveRes = await api.get('/hr/leaves');
      setLeaves(leaveRes.data);
    } catch (err) {
      alert("Failed to update leave request");
    }
  };

  const handleApproveSection = async (id: string) => {
    try {
      await api.put(`/finance/scholarships/${id}/verify`);
      const schRes = await api.get('/scholarships');
      setScholarships(schRes.data);
    } catch (err) {
      alert("Verification failed");
    }
  };

  const handleApproveAccounts = async (id: string) => {
    try {
      await api.put(`/finance/scholarships/${id}/approve`);
      const schRes = await api.get('/scholarships');
      setScholarships(schRes.data);
    } catch (err) {
      alert("Approval failed");
    }
  };

  const handleApplyLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/hr/leaves', {
        start_date: leaveStartDate,
        end_date: leaveEndDate,
        reason: leaveReason
      });
      alert("Leave request submitted successfully!");
      setShowApplyLeaveModal(false);
      setLeaveStartDate('');
      setLeaveEndDate('');
      setLeaveReason('');
      if (['ADMIN', 'HOD', 'PRINCIPAL', 'HR', 'SUPER_ADMIN'].includes(user?.system_role)) {
        const leaveRes = await api.get('/hr/leaves');
        setLeaves(leaveRes.data);
      }
    } catch (err) {
      alert("Failed to submit leave request");
    }
  };

  const showFinanceLedger = ['ACCOUNTS', 'REGISTRAR', 'SUPER_ADMIN', 'STUDENT'].includes(user?.system_role);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Finance Section */}
      {showFinanceLedger && (
        <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Finance Ledger</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Track fee payments, invoices, and payroll.</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm">
              <DollarSign size={24} />
            </div>
          </div>

          {user?.system_role === 'REGISTRAR' && (
            <div className="mb-6 space-y-6">
              {/* Admissions Whole Fees aggregate & chart */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Admissions Fee Target</div>
                  <div className="text-xl font-mono font-bold text-slate-800 mt-1">₹25,00,000</div>
                  <div className="text-[9px] font-semibold text-slate-400 mt-0.5">(20 Students * ₹1.25L)</div>
                </div>
                <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Collected / Offset Fees</div>
                  <div className="text-xl font-mono font-bold text-emerald-700 mt-1">₹3,75,000</div>
                  <div className="text-[9px] font-semibold text-emerald-500 mt-0.5">(Scholarships approved & invoices paid)</div>
                </div>
                <div className="bg-orange-50/50 border border-orange-100 p-4 rounded-2xl">
                  <div className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Outstanding Dues</div>
                  <div className="text-xl font-mono font-bold text-orange-700 mt-1">₹21,25,000</div>
                  <div className="text-[9px] font-semibold text-orange-500 mt-0.5">(Remaining admissions fees)</div>
                </div>
              </div>

              {/* Chart simulation */}
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                  <span>Fee Collection Progress</span>
                  <span>15% Completed</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3">
                  <div className="bg-emerald-500 h-3 rounded-full transition-all duration-500" style={{ width: '15%' }}></div>
                </div>
              </div>

              {/* Scholarship schemes cards */}
              <div>
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Scholarship Distributions (Click to view students)</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    onClick={() => setSelectedScheme(selectedScheme === 'EBC' ? null : 'EBC')}
                    className={`cursor-pointer border p-4 rounded-2xl transition-all ${selectedScheme === 'EBC' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200/60'}`}
                  >
                    <div className="text-xs font-bold text-slate-800">EBC Scheme</div>
                    <div className="text-xs font-bold text-blue-600 mt-1">10 Students</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Click to audit forms</div>
                  </div>
                  <div 
                    onClick={() => setSelectedScheme(selectedScheme === 'TFWS' ? null : 'TFWS')}
                    className={`cursor-pointer border p-4 rounded-2xl transition-all ${selectedScheme === 'TFWS' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200/60'}`}
                  >
                    <div className="text-xs font-bold text-slate-800">TFWS Scheme</div>
                    <div className="text-xs font-bold text-blue-600 mt-1">5 Students</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Click to audit forms</div>
                  </div>
                  <div 
                    onClick={() => setSelectedScheme(selectedScheme === 'MERIT' ? null : 'MERIT')}
                    className={`cursor-pointer border p-4 rounded-2xl transition-all ${selectedScheme === 'MERIT' ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white hover:bg-slate-50 border-slate-200/60'}`}
                  >
                    <div className="text-xs font-bold text-slate-800">Open Merit</div>
                    <div className="text-xs font-bold text-blue-600 mt-1">5 Students</div>
                    <div className="text-[9px] text-slate-400 mt-0.5">Click to audit forms</div>
                  </div>
                </div>
              </div>

              {/* Student detail view under scholarship scheme */}
              {selectedScheme && (
                <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">Students under {selectedScheme}</h4>
                    <button onClick={() => setSelectedScheme(null)} className="text-slate-400 hover:text-slate-600 text-xs font-bold">✕ Close</button>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                          <th className="px-4 py-3">Student</th>
                          <th className="px-4 py-3">Roll Number</th>
                          <th className="px-4 py-3">CGPA</th>
                          <th className="px-4 py-3">Form Submitted?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {students.filter((_, idx) => {
                          // Filter simulated list size per scheme
                          if (selectedScheme === 'EBC') return idx < 10;
                          if (selectedScheme === 'TFWS') return idx >= 10 && idx < 15;
                          return idx >= 15;
                        }).map(s => {
                          const hasFilled = scholarships.some(sc => sc.student_id === s.id && sc.status !== 'PENDING_SCHOLARSHIP_SECTION');
                          return (
                            <tr key={s.id} className="hover:bg-slate-50/50">
                              <td className="px-4 py-3 font-semibold text-slate-700">{s.first_name} {s.last_name}</td>
                              <td className="px-4 py-3 font-mono font-semibold text-slate-500">{s.student_profile?.enrollment_number || 'N/A'}</td>
                              <td className="px-4 py-3 font-semibold text-slate-600">{s.student_profile?.cgpa || 'N/A'}</td>
                              <td className="px-4 py-3 font-bold">
                                {hasFilled ? (
                                  <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">Yes (Verified)</span>
                                ) : (
                                  <span className="text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg">Pending accounts</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {['ACCOUNTS', 'REGISTRAR', 'SUPER_ADMIN'].includes(user?.system_role) && (
            <div className="flex gap-2 mb-6">
              <button 
                onClick={() => setActiveSubTab('SCHOLARSHIPS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'SCHOLARSHIPS' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                Scholarship Ledger
              </button>
              <button 
                onClick={() => setActiveSubTab('STUDENTS')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeSubTab === 'STUDENTS' ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                Student Fee Registry
              </button>
            </div>
          )}

          {activeSubTab === 'STUDENTS' && ['ACCOUNTS', 'REGISTRAR', 'SUPER_ADMIN'].includes(user?.system_role) && (
            <div className="mb-4">
              <input 
                type="text" 
                placeholder="Search by student name, roll number, or department..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-emerald-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            {user?.system_role === 'STUDENT' ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">Invoice / Description</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Due Date</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800">{inv.description}</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">₹{inv.amount}</td>
                      <td className="px-5 py-4 font-medium text-slate-500">{new Date(inv.due_date).toLocaleDateString()}</td>
                      <td className="px-5 py-4">
                        {inv.status === 'PAID' ? 
                          <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg text-xs">Paid</span> : 
                          <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg text-xs">Pending</span>}
                      </td>
                    </tr>
                  ))}
                  {invoices.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500 font-medium">
                        No outstanding invoices found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : activeSubTab === 'SCHOLARSHIPS' ? (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">Scholarship / Scheme</th>
                    <th className="px-5 py-4">Amount</th>
                    <th className="px-5 py-4">Student ID</th>
                    <th className="px-5 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scholarships.map(sch => (
                    <tr key={sch.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4 font-semibold text-slate-800">{sch.scholarship_name}</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">₹{sch.amount}</td>
                      <td className="px-5 py-4 font-medium text-slate-500 text-xs">Student ID: <br/><span className="text-[10px]">{sch.student_id}</span></td>
                      <td className="px-5 py-4">
                         {sch.status === 'PENDING_SCHOLARSHIP_SECTION' ? (
                           user?.system_role === 'HOD' || user?.system_role === 'PRINCIPAL' ? (
                             <button onClick={() => handleApproveSection(sch.id)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm shadow-blue-600/20">Verify & Fwd</button>
                           ) : (
                             <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg text-xs">Pending Section</span>
                           )
                         ) : sch.status === 'PENDING_ACCOUNTS' ? (
                           ['ACCOUNTS', 'SUPER_ADMIN'].includes(user?.system_role) ? (
                             <button onClick={() => handleApproveAccounts(sch.id)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded-lg text-xs shadow-sm shadow-emerald-600/20">Final Approve</button>
                           ) : (
                             <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg text-xs">Pending Accounts</span>
                           )
                         ) : (
                             <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg text-xs">Approved</span>
                         )}
                      </td>
                    </tr>
                  ))}
                  {scholarships.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500 font-medium">
                        No scholarship applications found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">Student Name</th>
                    <th className="px-5 py-4">Roll Number</th>
                    <th className="px-5 py-4">Department</th>
                    <th className="px-5 py-4">Fee Category</th>
                    <th className="px-5 py-4">Total Dues</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {students.filter(s => {
                    const isDeptScoped = ['HOD', 'FACULTY'].includes(user?.system_role);
                    if (isDeptScoped && s.department_id !== user.department_id) return false;

                    const fullName = (s.first_name + ' ' + s.last_name).toLowerCase();
                    const roll = (s.student_profile?.enrollment_number || '').toLowerCase();
                    const deptCode = (departments.find(d => d.id === s.department_id)?.code || '').toLowerCase();
                    const query = searchQuery.toLowerCase();
                    return fullName.includes(query) || roll.includes(query) || deptCode.includes(query);
                  }).map(s => {
                    const sch = scholarships.find(sc => sc.student_id === s.id);
                    const category = sch ? (sch.scholarship_name.includes("EBC") ? "EBC (50% Off)" : sch.scholarship_name.includes("TFWS") ? "TFWS (Free)" : "Scholarship") : "Regular / Open";
                    const totalDues = sch ? (sch.scholarship_name.includes("TFWS") ? 0 : 62500) : 125000;
                    return (
                      <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-5 py-4 font-semibold text-slate-800">{s.first_name} {s.last_name}</td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-700 text-xs">{s.student_profile?.enrollment_number || 'N/A'}</td>
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                            {departments.find(d => d.id === s.department_id)?.code || 'GEN'}
                          </span>
                        </td>
                        <td className="px-5 py-4 font-bold text-slate-500 text-xs">{category}</td>
                        <td className="px-5 py-4 font-mono font-bold text-slate-900">₹{totalDues}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
      )}

      {/* HR Section (Leaves & Requisitions) */}
      {user?.system_role !== 'STUDENT' && (
        <div className={showFinanceLedger ? "lg:col-span-4 space-y-6" : "lg:col-span-12 space-y-6"}>
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
                <FileText size={18} className="text-blue-500" /> Leave Management
              </h3>
              <button 
                onClick={() => setShowApplyLeaveModal(true)} 
                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold py-1.5 px-3 rounded-xl text-xs transition-colors shadow-sm"
              >
                + Request Leave
              </button>
            </div>
            
            <div className="space-y-3">
              {leaves.map((leave, i) => (
                <div key={i} className={`p-4 rounded-2xl border transition-colors ${leave.status === 'PENDING' ? 'bg-orange-50/50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 text-sm">
                      {leave.faculty ? `${leave.faculty.first_name} ${leave.faculty.last_name}` : 'Faculty Member'}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${leave.status === 'PENDING' ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>{leave.status}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">Applied Leave</div>
                  <div className="text-xs text-slate-500 mb-1">{leave.start_date} to {leave.end_date}</div>
                  <div className="text-xs italic text-slate-400 mb-3">Reason: "{leave.reason}"</div>
                  
                  {leave.status === 'PENDING' && (
                     <div className="flex gap-2">
                        <button onClick={() => handleLeaveDecision(leave.id, 'APPROVED')} className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm shadow-emerald-500/20">Approve</button>
                        <button onClick={() => handleLeaveDecision(leave.id, 'REJECTED')} className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-200 font-bold py-1.5 rounded-lg text-xs transition-colors shadow-sm">Reject</button>
                     </div>
                  )}
                </div>
              ))}
              {leaves.length === 0 && (
                <div className="text-center p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center">
                  <CheckCircle2 size={24} className="text-emerald-500 mb-2" />
                  <span className="text-sm font-semibold text-slate-600">All caught up!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply Leave Modal */}
      {showApplyLeaveModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-xl font-bold text-slate-800 mb-4">Request Professional Leave</h3>
            <form onSubmit={handleApplyLeave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Start Date</label>
                <input 
                  type="date" 
                  value={leaveStartDate} 
                  onChange={e => setLeaveStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">End Date</label>
                <input 
                  type="date" 
                  value={leaveEndDate} 
                  onChange={e => setLeaveEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">Reason / Justification</label>
                <textarea 
                  value={leaveReason} 
                  onChange={e => setLeaveReason(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none focus:border-blue-500 focus:bg-white resize-none"
                  placeholder="State the reason for leave request..."
                  rows={3}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-md shadow-indigo-600/20 text-sm">Submit Request</button>
                <button type="button" onClick={() => setShowApplyLeaveModal(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

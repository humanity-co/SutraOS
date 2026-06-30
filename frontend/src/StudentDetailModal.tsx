import { useEffect, useState } from 'react';
import { X, User, DollarSign, Briefcase, Phone, MapPin, ShieldAlert } from 'lucide-react';
import api from './api';

interface StudentDetailModalProps {
  studentId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentDetailModal({ studentId, isOpen, onClose }: StudentDetailModalProps) {
  const [loading, setLoading] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [placement, setPlacement] = useState<any>(null);

  useEffect(() => {
    if (!isOpen || !studentId) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const [userRes, invRes] = await Promise.all([
          api.get(`/users/${studentId}`),
          api.get(`/finance/invoices/student/${studentId}`).catch(() => ({ data: [] }))
        ]);
        setStudentData(userRes.data);
        setInvoices(invRes.data);

        // Try fetching off-campus placements
        try {
          const plcRes = await api.get(`/placements/off-campus/student/${studentId}`);
          setPlacement(plcRes.data);
        } catch {
          setPlacement(null);
        }
      } catch (err) {
        console.error("Failed to load student details", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [studentId, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[150] flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl relative animate-scale-in">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-slate-100 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center font-bold text-base shadow-sm">
              {studentData?.first_name?.charAt(0)}{studentData?.last_name?.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800 leading-none">{studentData?.first_name} {studentData?.last_name}</h3>
              <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-wider">Student Academic Record File</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all">
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-semibold animate-pulse">Loading Student Ledger File...</div>
        ) : (
          <div className="p-6 space-y-6">
            
            {/* 1. Academic Credentials block */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-slate-50 border border-slate-100 p-4.5 rounded-2xl">
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Roll Number</span>
                <span className="text-xs font-black text-slate-800">{studentData?.username}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Department</span>
                <span className="text-xs font-black text-slate-800">{studentData?.department?.name || 'General CSE'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Semester</span>
                <span className="text-xs font-black text-slate-800">{studentData?.student_profile?.current_semester ? `Semester ${studentData.student_profile.current_semester}` : 'Semester 1'}</span>
              </div>
              <div>
                <span className="block text-[10px] font-bold text-slate-400 uppercase">Academic CGPA</span>
                <span className="text-xs font-black text-blue-600">{studentData?.student_profile?.cgpa || '0.0'} CGPA</span>
              </div>
            </div>

            {/* 2. Parent & Contact Details (Strictly Read Only) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <User size={14} className="text-slate-400" /> Parent & Contact Details
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50/50 border border-slate-200/50 p-4 rounded-2xl">
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Father's Name:</span>
                    <span className="font-bold text-slate-850">{studentData?.student_profile?.father_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Father's Contact:</span>
                    <span className="font-mono font-bold text-slate-750 flex items-center gap-1"><Phone size={10} /> {studentData?.student_profile?.parent_whatsapp || 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Mother's Name:</span>
                    <span className="font-bold text-slate-850">{studentData?.student_profile?.mother_name || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-semibold">Parent Email:</span>
                    <span className="font-bold text-slate-755">{studentData?.student_profile?.parent_email || 'N/A'}</span>
                  </div>
                </div>
                {studentData?.student_profile?.father_address && (
                  <div className="col-span-full border-t border-slate-200/60 pt-2 text-xs flex gap-2 text-slate-600 font-semibold">
                    <MapPin size={12} className="text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{studentData.student_profile.father_address}</span>
                  </div>
                )}
              </div>
            </div>

            {/* 3. Fee Ledgers (Registrar / Accounts special view) */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign size={14} className="text-slate-400" /> Fee Invoices & Payment Ledger
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                {invoices.length === 0 ? (
                  <p className="text-xs font-semibold text-slate-400 p-4 text-center">No fee invoices recorded for this student.</p>
                ) : (
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-500">
                        <th className="p-3">Fee Description</th>
                        <th className="p-3">Amount</th>
                        <th className="p-3">Receipt Ref</th>
                        <th className="p-3 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {invoices.map((inv: any) => (
                        <tr key={inv.id}>
                          <td className="p-3 font-semibold">{inv.description}</td>
                          <td className="p-3 font-bold text-slate-800">₹{inv.amount}</td>
                          <td className="p-3 font-mono font-semibold text-slate-500">{inv.receipt_number || 'NA'}</td>
                          <td className="p-3 text-right">
                            <span className={`inline-block px-2 py-0.5 rounded-lg text-[9px] font-extrabold uppercase ${
                              inv.status === 'PAID' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}>
                              {inv.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* 4. Placement Records */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase size={14} className="text-slate-400" /> Placement Track
              </h4>
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl">
                {placement ? (
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-[9px] font-extrabold text-blue-600 uppercase">OFF-CAMPUS SELECTION</span>
                      <h5 className="text-sm font-extrabold text-slate-800 mt-1">{placement.company_name}</h5>
                      <span className="text-xs font-bold text-slate-500">{placement.job_profile} ({placement.after_confirmation_salary})</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-extrabold uppercase ${
                      placement.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                      placement.status === 'REJECTED' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                    }`}>
                      {placement.status}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400 text-xs font-bold justify-center py-2">
                    <ShieldAlert size={14} />
                    <span>No verified off-campus placements or active offers reported.</span>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}

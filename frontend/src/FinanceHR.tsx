import { useEffect, useState, type ChangeEvent } from 'react';
import { BriefcaseBusiness, CheckCircle2, DollarSign, FileText, ShieldCheck, TrendingUp, UploadCloud } from 'lucide-react';
import api from './api';

export default function FinanceHR() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trialBalance, setTrialBalance] = useState<any>(null);
  const [taxUploadProgress, setTaxUploadProgress] = useState(0);
  const [taxUploading, setTaxUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, tbRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/finance/reports/trial-balance').catch(() => ({ data: null }))
        ]);
        setUser(userRes.data);
        setTrialBalance(tbRes.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleTaxUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTaxUploading(true);
    setTaxUploadProgress(0);

    const interval = window.setInterval(() => {
      setTaxUploadProgress((prev) => {
        if (prev >= 100) {
          window.clearInterval(interval);
          window.setTimeout(() => setTaxUploading(false), 500);
          return 100;
        }
        return prev + 25;
      });
    }, 300);
  };

  const downloadTrialBalance = async () => {
    try {
      const res = await api.get('/finance/export/trial-balance', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'Trial_Balance.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading file. Ensure you have the correct permissions.');
    }
  };

  if (loading) {
    return <div className="p-8 font-bold text-slate-500">Loading HR & Finance Hub...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col lg:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <BriefcaseBusiness className="text-emerald-400" size={20} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">HR & Finance Hub</h1>
            </div>
            <p className="text-indigo-200 text-sm font-medium">Payroll, statutory declarations, finance reporting, and approvals in one place.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-3 min-w-[280px]">
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200">Role</p>
              <p className="font-bold text-white">{user?.system_role || 'User'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/10 p-3 backdrop-blur-sm">
              <p className="text-[11px] uppercase tracking-[0.2em] text-indigo-200">Ledger Status</p>
              <p className="font-bold text-emerald-300">{trialBalance ? 'Available' : 'Queued'}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <DollarSign className="text-indigo-600" size={18} /> Finance & Ledger
              </h2>
              <p className="text-sm text-slate-500 mt-1">Consolidated balance sheet and export-ready reporting.</p>
            </div>
            <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
              FY 2026-2027
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Current Liabilities</span>
                <span className="font-black text-rose-600">₹ 13.48 Cr</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Current Assets</span>
                <span className="font-black text-emerald-600">₹ 13.48 Cr</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Trial balance</span>
                <span className="font-black text-slate-800">{trialBalance ? 'Ready' : 'Preparing'}</span>
              </div>
            </div>
            <button
              onClick={downloadTrialBalance}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 rounded-xl transition-colors shadow-sm"
            >
              Export Official Ledger
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
                <ShieldCheck className="text-emerald-600" size={18} /> HR & Payroll
              </h2>
              <p className="text-sm text-slate-500 mt-1">Service book, salary slips, and statutory declarations.</p>
            </div>
            <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
              Payroll Active
            </span>
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Gross Salary</span>
                <span className="font-black text-emerald-700">₹ 1,10,000.00</span>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between text-sm font-semibold text-slate-700">
                <span>Service Status</span>
                <span className="font-black text-slate-800">Confirmed</span>
              </div>
            </div>
            <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold py-3 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <FileText className="w-4 h-4" /> Download Latest Pay Slip
            </button>

            <label className="relative overflow-hidden w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl border border-blue-200 transition-colors flex flex-col items-center justify-center shadow-sm cursor-pointer">
              <input
                type="file"
                onChange={handleTaxUpload}
                disabled={taxUploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              />
              <div className="py-3.5 flex items-center gap-2">
                <UploadCloud className="w-4 h-4" />
                {taxUploading ? 'Uploading & Verifying...' : 'Upload 80C Tax Declaration Scan'}
              </div>
              {taxUploading && (
                <div className="w-full bg-blue-200 h-1 absolute bottom-0 left-0">
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${taxUploadProgress}%` }} />
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20} /> Approved Workflow Summary
          </h2>
          <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">
            Live Overview
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold mb-2">
              <CheckCircle2 className="text-emerald-500" size={16} /> Payroll Approvals
            </div>
            <p className="text-2xl font-black text-slate-800">24</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold mb-2">
              <CheckCircle2 className="text-emerald-500" size={16} /> Finance Entries
            </div>
            <p className="text-2xl font-black text-slate-800">12</p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-500 text-sm font-semibold mb-2">
              <CheckCircle2 className="text-emerald-500" size={16} /> Pending Reviews
            </div>
            <p className="text-2xl font-black text-slate-800">3</p>
          </div>
        </div>
      </div>
    </div>
  );
}

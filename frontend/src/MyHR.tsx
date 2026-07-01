import { useState, useEffect, type ChangeEvent } from 'react';
import { BadgeCheck, BellRing, BriefcaseBusiness, CalendarClock, FileText, Sparkles, UploadCloud, Users } from 'lucide-react';
import api from './api';

export default function MyHR() {
  const [, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [taxUploadProgress, setTaxUploadProgress] = useState(0);
  const [taxUploading, setTaxUploading] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
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

  if (loading) return <div className="p-8 font-bold text-slate-500">Loading HR Records...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-violet-700 via-fuchsia-700 to-sky-700 rounded-[28px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -bottom-12 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Users className="text-cyan-200" size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">People & Payroll</h1>
                <p className="text-violet-100 text-sm font-medium">Service record, leave balance, and employee documents</p>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-sm">
            <p className="text-[11px] uppercase tracking-[0.25em] text-violet-100">Today</p>
            <p className="font-bold text-white">3 approvals pending</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><BriefcaseBusiness className="text-violet-600" size={18} /> Employee Summary</h2>
                <p className="text-sm text-slate-500 mt-1">Your current record and employment status</p>
              </div>
              <span className="bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100">Active</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Designation</p>
                <p className="mt-2 text-xl font-black text-slate-800">Senior Faculty</p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-slate-500">Department</p>
                <p className="mt-2 text-xl font-black text-slate-800">Computer Science</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><CalendarClock className="text-sky-600" size={18} /> Leave Balance</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between rounded-2xl bg-slate-50 p-3">
                  <span className="font-semibold text-slate-600">Annual Leave</span>
                  <span className="font-black text-slate-800">12 / 24 days</span>
                </div>
                <div className="flex justify-between rounded-2xl bg-slate-50 p-3">
                  <span className="font-semibold text-slate-600">Casual Leave</span>
                  <span className="font-black text-slate-800">6 / 12 days</span>
                </div>
                <div className="flex justify-between rounded-2xl bg-slate-50 p-3">
                  <span className="font-semibold text-slate-600">Medical Leave</span>
                  <span className="font-black text-slate-800">2 / 10 days</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
              <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><BadgeCheck className="text-emerald-600" size={18} /> Service Book</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between rounded-2xl bg-emerald-50 p-3">
                  <span className="font-semibold text-emerald-800">Basic Pay</span>
                  <span className="font-black text-emerald-800">₹ 85,000</span>
                </div>
                <div className="flex justify-between rounded-2xl bg-slate-50 p-3">
                  <span className="font-semibold text-slate-600">DA</span>
                  <span className="font-black text-slate-800">₹ 15,000</span>
                </div>
                <div className="flex justify-between rounded-2xl bg-slate-50 p-3">
                  <span className="font-semibold text-slate-600">HRA</span>
                  <span className="font-black text-slate-800">₹ 10,000</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Payroll Docs</h3>
              <Sparkles className="text-violet-500" size={18} />
            </div>
            <div className="space-y-3">
              <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold py-3 rounded-2xl border border-slate-200 transition-colors flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" /> Pay Slip
              </button>
              <label className="relative overflow-hidden w-full bg-sky-50 hover:bg-sky-100 text-sky-700 text-sm font-bold rounded-2xl border border-sky-200 transition-colors flex flex-col items-center justify-center shadow-sm cursor-pointer">
                <input
                  type="file"
                  onChange={handleTaxUpload}
                  disabled={taxUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="py-3.5 flex items-center gap-2">
                  <UploadCloud className="w-4 h-4" />
                  {taxUploading ? 'Uploading...' : '80C Declaration'}
                </div>
                {taxUploading && (
                  <div className="w-full bg-sky-200 h-1 absolute bottom-0 left-0">
                    <div className="bg-sky-600 h-full transition-all duration-300" style={{ width: `${taxUploadProgress}%` }} />
                  </div>
                )}
              </label>
            </div>
          </div>

          <div className="bg-gradient-to-br from-sky-600 to-cyan-600 rounded-[28px] p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <BellRing size={18} />
              <h3 className="font-black">Upcoming HR Actions</h3>
            </div>
            <div className="space-y-2 text-sm">
              <div className="rounded-2xl bg-white/15 p-3">Performance review on July 10</div>
              <div className="rounded-2xl bg-white/15 p-3">Leave approval request from Team</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

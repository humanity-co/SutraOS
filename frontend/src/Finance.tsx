import { useState, useEffect } from 'react';
import { FileText, Landmark, ReceiptText, ShieldCheck, TrendingUp } from 'lucide-react';
import api from './api';

export default function Finance() {
  const [, setUser] = useState<any>(null);
  const [, setTrialBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);

        if (['ACCOUNTS', 'REGISTRAR', 'SUPER_ADMIN', 'PRINCIPAL'].includes(userRes.data.system_role)) {
          const tbRes = await api.get('/finance/reports/trial-balance');
          setTrialBalance(tbRes.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

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

  if (loading) return <div className="p-8 font-bold text-slate-500">Loading Financial Ledger...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 rounded-[28px] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute -top-10 right-0 w-72 h-72 bg-cyan-500/20 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col xl:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center">
                <Landmark className="text-cyan-300" size={22} />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold tracking-tight">Finance Control Center</h1>
                <p className="text-indigo-200 text-sm font-medium">Ledger, cashflow, and statutory reporting</p>
              </div>
            </div>
          </div>
          <button
            onClick={downloadTrialBalance}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <FileText size={16} /> Export Ledger
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { label: 'Cash in Hand', value: '₹ 2.90 Cr', tone: 'bg-cyan-50 text-cyan-700 border-cyan-100' },
              { label: 'Receivables', value: '₹ 37.50 L', tone: 'bg-amber-50 text-amber-700 border-amber-100' },
              { label: 'Payables', value: '₹ 12.45 L', tone: 'bg-rose-50 text-rose-700 border-rose-100' }
            ].map((item) => (
              <div key={item.label} className={`rounded-3xl border p-4 ${item.tone}`}>
                <p className="text-xs font-black uppercase tracking-[0.24em] opacity-75">{item.label}</p>
                <p className="mt-3 text-2xl font-black">{item.value}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-800 flex items-center gap-2"><TrendingUp className="text-indigo-600" size={18} /> Trial Balance Snapshot</h2>
                <p className="text-sm text-slate-500 mt-1">Monthly financial position and variance review</p>
              </div>
              <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">FY 2026-2027</span>
            </div>
            <div className="p-6 space-y-4">
              {[
                { name: 'General Corpus Fund', value: '₹ 12.50 Cr', width: '82%', tint: 'bg-indigo-600' },
                { name: 'Fees Receivable', value: '₹ 37.50 L', width: '48%', tint: 'bg-emerald-500' },
                { name: 'Vendor Creditors', value: '₹ 12.45 L', width: '26%', tint: 'bg-rose-500' }
              ].map((row) => (
                <div key={row.name}>
                  <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
                    <span>{row.name}</span>
                    <span>{row.value}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className={`h-full ${row.tint}`} style={{ width: row.width }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-[28px] border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800">Compliance</h3>
              <ShieldCheck className="text-emerald-500" size={18} />
            </div>
            <div className="space-y-3">
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 flex items-center justify-between">
                <span>Audit checklist</span>
                <span>98%</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>Tax filing</span>
                <span>Pending</span>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 flex items-center justify-between">
                <span>Grant reconciliation</span>
                <span>Synced</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-rose-600 to-orange-500 rounded-[28px] p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <ReceiptText size={18} />
              <h3 className="font-black">Recent Transactions</h3>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between bg-white/15 rounded-2xl p-3">
                <span>Student fee settlement</span>
                <span className="font-bold">+₹ 8.2 L</span>
              </div>
              <div className="flex items-center justify-between bg-white/15 rounded-2xl p-3">
                <span>Vendor payment</span>
                <span className="font-bold">-₹ 2.4 L</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

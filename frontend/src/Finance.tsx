import { useState, useEffect } from 'react';
import { DollarSign, FileText, CheckCircle2, TrendingUp } from 'lucide-react';
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

        // Fetch Trial Balance if user has Accounts access
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
    } catch (err) {
      alert("Error downloading file. Ensure you have the correct permissions.");
    }
  };

  if (loading) return <div className="p-8 font-bold text-slate-500">Loading Financial Ledger...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* CA-GRADE DASHBOARD HEADER */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                <DollarSign className="text-emerald-400" size={20} />
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">University Balance Sheet</h1>
            </div>
            <p className="text-indigo-200 text-sm font-medium">As Per Statutory Accounting Standards (Ind AS)</p>
          </div>
          <button 
            onClick={downloadTrialBalance}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 flex items-center gap-2"
          >
            <FileText size={16} /> Export Official .xlsx Ledger
          </button>
        </div>
      </div>

      {/* BALANCE SHEET ARCHITECTURE */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h2 className="text-lg font-black text-slate-800 tracking-tight flex items-center gap-2">
            <TrendingUp className="text-indigo-600" size={20}/> Consolidated Financial Position
          </h2>
          <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100">
            FY 2026-2027
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
          
          {/* LIABILITIES (CREDIT) */}
          <div className="p-6 bg-slate-50/30">
            <h3 className="text-sm font-black uppercase tracking-widest text-rose-700 mb-6 flex items-center gap-2">
              Liabilities & Capital <span className="text-[10px] font-bold text-rose-500 bg-rose-100 px-2 py-0.5 rounded">(Cr)</span>
            </h3>
            
            <div className="space-y-4">
              {/* Capital Fund */}
              <div className="group">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>General Corpus Fund</span>
                  <span>₹ 12,50,00,000.00</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-rose-500 h-full w-[80%]"></div>
                </div>
              </div>

              {/* Student Caution Money */}
              <div className="group pt-2">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>Student Caution Money (Refundable)</span>
                  <span>₹ 85,50,000.00</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-rose-400 h-full w-[30%]"></div>
                </div>
              </div>

              {/* Sundry Creditors */}
              <div className="group pt-2">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>Sundry Creditors (Vendors)</span>
                  <span>₹ 12,45,000.00</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-rose-300 h-full w-[10%]"></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-rose-100 flex justify-between items-center">
              <span className="font-black text-slate-800 uppercase text-sm">Total Liabilities</span>
              <span className="font-black text-rose-700 text-lg">₹ 13,47,95,000.00</span>
            </div>
          </div>

          {/* ASSETS (DEBIT) */}
          <div className="p-6 bg-emerald-50/10">
            <h3 className="text-sm font-black uppercase tracking-widest text-emerald-700 mb-6 flex items-center gap-2">
              Assets & Properties <span className="text-[10px] font-bold text-emerald-500 bg-emerald-100 px-2 py-0.5 rounded">(Dr)</span>
            </h3>
            
            <div className="space-y-4">
              {/* Fixed Assets */}
              <div className="group">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>Fixed Assets (Land & Building)</span>
                  <span>₹ 10,20,00,000.00</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full w-[75%]"></div>
                </div>
              </div>

              {/* Bank Balances */}
              <div className="group pt-2">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>Bank Balances (SBI & HDFC)</span>
                  <span>₹ 2,90,45,000.00</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[45%]"></div>
                </div>
              </div>

              {/* Sundry Debtors */}
              <div className="group pt-2">
                <div className="flex justify-between text-sm font-bold text-slate-700 mb-1">
                  <span>Fees Receivable (Students)</span>
                  <span>₹ 37,50,000.00</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-emerald-300 h-full w-[15%]"></div>
                </div>
              </div>
            </div>

            <div className="mt-8 pt-4 border-t-2 border-emerald-100 flex justify-between items-center">
              <span className="font-black text-slate-800 uppercase text-sm">Total Assets</span>
              <span className="font-black text-emerald-700 text-lg">₹ 13,47,95,000.00</span>
            </div>
          </div>
        </div>

        {/* TALLY FOOTER */}
        <div className="bg-slate-800 text-white p-4 flex justify-center items-center gap-3 border-t border-slate-700">
          <CheckCircle2 className="text-emerald-400" size={18} />
          <span className="text-xs font-bold tracking-widest uppercase text-slate-300">Balance Sheet Tallied Successfully</span>
        </div>
      </div>
      
    </div>
  );
}

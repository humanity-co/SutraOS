import { useState, useEffect } from 'react';
import { FileText, ShieldCheck, UploadCloud } from 'lucide-react';
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

  const handleTaxUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setTaxUploading(true);
      setTaxUploadProgress(0);
      const interval = setInterval(() => {
        setTaxUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setTaxUploading(false), 500);
            return 100;
          }
          return prev + 25;
        });
      }, 300);
    }
  };

  if (loading) return <div className="p-8 font-bold text-slate-500">Loading HR Records...</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-8 text-white shadow-lg">
        <h1 className="text-3xl font-extrabold mb-2 tracking-tight">My HR & Payroll</h1>
        <p className="text-emerald-50 text-sm font-medium">Official Service Book & Statutory Deductions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Service Book Component */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2"><ShieldCheck className="text-emerald-500" /> Active Service Book</h3>
          <div className="space-y-4">
            <div className="flex justify-between pb-3 border-b border-slate-50">
              <span className="text-sm text-slate-500 font-bold">Base Pay Matrix</span>
              <span className="font-bold text-slate-800 tracking-wide">₹85,000.00</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-slate-50">
              <span className="text-sm text-slate-500 font-bold">Dearness Allowance (DA)</span>
              <span className="font-bold text-slate-800 tracking-wide">₹15,000.00</span>
            </div>
            <div className="flex justify-between pb-3 border-b border-slate-50">
              <span className="text-sm text-slate-500 font-bold">House Rent Allowance (HRA)</span>
              <span className="font-bold text-slate-800 tracking-wide">₹10,000.00</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-sm font-black text-slate-800 uppercase tracking-wider">Total Gross Salary</span>
              <span className="font-black text-lg text-emerald-600 tracking-wide">₹1,10,000.00</span>
            </div>
          </div>
        </div>
        
        {/* Payroll Documents Component */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 mb-2">Payroll Documents</h3>
            <p className="text-xs text-slate-500 mb-6 font-medium">Download monthly salary slips and submit 80C Tax Declarations.</p>
          </div>
          
          <div className="space-y-3">
            <button className="w-full bg-slate-50 hover:bg-slate-100 text-slate-700 text-sm font-bold py-3.5 rounded-xl border border-slate-200 transition-colors flex items-center justify-center gap-2 shadow-sm">
              <FileText className="w-4 h-4" /> Download Latest Pay Slip
            </button>
            
            <div className="relative overflow-hidden w-full bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-bold rounded-xl border border-blue-200 transition-colors flex flex-col items-center justify-center shadow-sm">
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
                  <div className="bg-blue-600 h-full transition-all duration-300" style={{ width: `${taxUploadProgress}%` }}></div>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

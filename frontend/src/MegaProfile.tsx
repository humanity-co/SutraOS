import { useState, useEffect } from 'react';
import api from './api';
import { Save, CheckCircle2, AlertCircle } from 'lucide-react';

const TABS = [
  "Personal Details", "Family Details", "Medical Details", "Qualification", "Course Taught", 
  "Training", "Conference/Seminar/Conclave", "Workshop", "Publications", "Consultancy", 
  "Research Project", "Research Guidance", "Membership", "Patents/Copyrights", "Skill Upgradation", 
  "Work Experience", "Research Interest", "Significant Achievement", "Appointment Status", 
  "Service Book", "Self Contribution", "Print Profile", "Authority", "Other Document Upload", 
  "Bank Detail", "Vaccination Details"
];

export default function MegaProfile() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [data, setData] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/hr/faculty/profile/mega');
        setData(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaveStatus('idle');
    try {
      await api.put('/hr/faculty/profile/mega', data);
      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setData((prev: any) => ({
      ...prev,
      [activeTab]: {
        ...(prev[activeTab] || {}),
        [field]: value
      }
    }));
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Profile Data...</div>;

  const currentTabData = data[activeTab] || {};

  return (
    <div className="bg-white min-h-[calc(100vh-140px)] border-x border-b border-slate-200 flex flex-col shadow-sm mx-4 mb-4 rounded-b-lg">
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 flex justify-between items-center">
         <h2 className="text-lg font-bold text-[#0f2e5c] uppercase tracking-wide">EMPLOYEE PROFILE</h2>
         <div className="flex items-center gap-3">
             {saveStatus === 'success' && <span className="text-emerald-600 flex items-center text-sm font-bold"><CheckCircle2 size={16} className="mr-1"/> Saved</span>}
             {saveStatus === 'error' && <span className="text-red-600 flex items-center text-sm font-bold"><AlertCircle size={16} className="mr-1"/> Error</span>}
             <button onClick={handleSave} disabled={saving} className="bg-[#0b5394] hover:bg-[#094074] text-white px-4 py-1.5 rounded font-bold text-sm shadow transition-colors flex items-center">
                 <Save size={16} className="mr-2"/> {saving ? 'Saving...' : 'Save Profile'}
             </button>
         </div>
      </div>
      
      {/* 27 Tabs - Horizontal Scroll */}
      <div className="w-full overflow-x-auto bg-[#0b5394] flex scrollbar-hide shrink-0">
          {TABS.map(tab => (
              <button 
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`shrink-0 px-4 py-2 text-xs font-bold whitespace-nowrap transition-colors border-r border-[#094074] ${activeTab === tab ? 'bg-white text-[#0b5394]' : 'text-blue-100 hover:bg-[#094074] hover:text-white'}`}
              >
                  {tab}
              </button>
          ))}
      </div>
      
      {/* Dynamic Content Area */}
      <div className="flex-1 p-6 bg-white overflow-y-auto">
          <div className="max-w-4xl border border-slate-200 rounded">
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 font-bold text-slate-800 text-sm">
                  {activeTab} Information
              </div>
              <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeTab === 'Personal Details' ? (
                      <>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">First Name</label>
                              <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['firstName'] || ''} onChange={(e) => handleFieldChange('firstName', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Last Name</label>
                              <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['lastName'] || ''} onChange={(e) => handleFieldChange('lastName', e.target.value)} />
                          </div>
                          <div className="col-span-1 md:col-span-2">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Permanent Address</label>
                              <textarea className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 min-h-[80px]" value={currentTabData['address'] || ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth</label>
                              <input type="date" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['dob'] || ''} onChange={(e) => handleFieldChange('dob', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                              <select className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['bloodGroup'] || ''} onChange={(e) => handleFieldChange('bloodGroup', e.target.value)}>
                                  <option value="">Select...</option>
                                  <option value="A+">A+</option><option value="B+">B+</option><option value="O+">O+</option><option value="AB+">AB+</option>
                                  <option value="A-">A-</option><option value="B-">B-</option><option value="O-">O-</option><option value="AB-">AB-</option>
                              </select>
                          </div>
                      </>
                  ) : activeTab === 'Qualification' ? (
                      <>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Highest Degree</label>
                              <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['degree'] || ''} onChange={(e) => handleFieldChange('degree', e.target.value)} placeholder="e.g. Ph.D. in Computer Science" />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">University</label>
                              <input type="text" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['university'] || ''} onChange={(e) => handleFieldChange('university', e.target.value)} />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-slate-700 mb-1">Year of Passing</label>
                              <input type="number" className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500" value={currentTabData['passingYear'] || ''} onChange={(e) => handleFieldChange('passingYear', e.target.value)} />
                          </div>
                      </>
                  ) : (
                      <>
                          <div className="col-span-1 md:col-span-2">
                              <p className="text-xs text-slate-500 mb-4 bg-blue-50 p-3 rounded border border-blue-100">
                                  This is a dynamic enterprise form for <strong>{activeTab}</strong>. You can add flexible attributes below.
                              </p>
                          </div>
                          {['Detail 1', 'Detail 2', 'Attachment Ref', 'Remarks'].map((field, idx) => {
                              const key = `custom_field_${idx}`;
                              return (
                                  <div key={key}>
                                      <label className="block text-xs font-bold text-slate-700 mb-1">{activeTab} - {field}</label>
                                      <input 
                                          type="text" 
                                          className="w-full border border-slate-300 rounded px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none" 
                                          value={currentTabData[key] || ''}
                                          onChange={(e) => handleFieldChange(key, e.target.value)}
                                      />
                                  </div>
                              );
                          })}
                      </>
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}

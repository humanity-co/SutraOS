import { useEffect, useState } from 'react';
import { Plus, BookOpen, Clock, AlertCircle } from 'lucide-react';
import api from './api';

export default function Academics({ setAuthToken }: { setAuthToken: (t: string | null) => void }) {
  const [user, setUser] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showExamsModal, setShowExamsModal] = useState(false);
  const [studentExams, setStudentExams] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: '', name: '', credits: 3, is_elective: false, department_id: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRes = await api.get('/users/me');
        setUser(userRes.data);
        
        const [courseRes, deptRes] = await Promise.all([
          api.get('/academics/courses'),
          api.get('/departments')
        ]);
        setCourses(courseRes.data);
        setDepartments(deptRes.data);

        if (userRes.data.system_role === 'STUDENT') {
          const examRes = await api.get('/exams/student/me');
          setStudentExams(examRes.data);
        }
      } catch (err) {
        // Handle auth error gracefully in Layout
      }
    };
    fetchData();
  }, [setAuthToken]);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academics/courses', formData);
      const courseRes = await api.get('/academics/courses');
      setCourses(courseRes.data);
      setShowAddModal(false);
      setFormData({code: '', name: '', credits: 3, is_elective: false, department_id: ''});
    } catch (err) {
      console.error(err);
      alert("Error adding course");
    }
  };

  const handleFreezeExams = async () => {
    try {
      const res = await api.post('/exams/publish');
      alert(`🔒 CRYPTOGRAPHIC FREEZE COMPLETE\n\nGenerated SHA-256 Hashes for ${res.data.records_published} records.\n\nOnce published, NO faculty or admin can alter the marks without triggering an audit violation.`);
    } catch (e) {
      alert("Failed to freeze exams");
    }
  };

  const displayCourses = ['STUDENT', 'FACULTY', 'HOD'].includes(user?.system_role)
    ? courses.filter(c => c.department_id === user.department_id)
    : courses;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-fade-in">
      
      {/* Left Column: Academics Overview */}
      <div className="lg:col-span-8 space-y-6">
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Course Registry</h2>
              <p className="text-sm font-medium text-slate-500 mt-1">Manage and track all institutional courses</p>
            </div>
            {['ADMIN', 'SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL', 'HOD'].includes(user?.system_role) && (
              <button 
                onClick={() => setShowAddModal(true)} 
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold shadow-sm shadow-blue-600/20 flex items-center transition-all text-sm"
              >
                <Plus size={16} className="mr-2" /> Define Course
              </button>
            )}
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-5 py-4">Course Code</th>
                  <th className="px-5 py-4">Name</th>
                  <th className="px-5 py-4">Department</th>
                  <th className="px-5 py-4">Type</th>
                  <th className="px-5 py-4">Credits</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {displayCourses.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-blue-700">{c.code}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{c.name}</td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold bg-slate-100 text-slate-600">
                        {departments.find(d => d.id === c.department_id)?.code || 'GEN'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {c.is_elective ? 
                        <span className="text-orange-600 font-bold bg-orange-50 px-3 py-1 rounded-lg text-xs">Elective</span> : 
                        <span className="text-emerald-600 font-bold bg-emerald-50 px-3 py-1 rounded-lg text-xs">Compulsory</span>}
                    </td>
                    <td className="px-5 py-4 font-bold text-slate-600">{c.credits}</td>
                  </tr>
                ))}
                {displayCourses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-12 text-center text-slate-500 font-medium">
                      No courses defined yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Right Column: Mini Apps */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-6 shadow-sm border border-blue-100/50">
          <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm mb-4">
            <Clock size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800 tracking-tight mb-2">Timetable Mapping</h3>
          <p className="text-sm font-medium text-slate-600 mb-4">Configure slots, allocate faculty, and generate master schedules.</p>
          <button className="w-full bg-white hover:bg-slate-50 text-blue-700 border border-blue-200 font-bold py-2.5 rounded-xl transition-colors text-sm shadow-sm">
            Launch Scheduler
          </button>
        </div>

        {['EXAM_CONTROLLER', 'SUPER_ADMIN', 'STUDENT'].includes(user?.system_role) && (
          <div className="bg-orange-50 rounded-3xl p-6 shadow-sm border border-orange-100/50">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-orange-500 shadow-sm mb-4">
              <AlertCircle size={24} />
            </div>
            <h3 className="text-lg font-bold text-orange-900 tracking-tight mb-2">Examination Module</h3>
            <p className="text-sm font-medium text-orange-800 mb-4">Calculate relative grades and publish results cryptographically.</p>
            <button 
              onClick={() => {
                if (['EXAM_CONTROLLER', 'SUPER_ADMIN'].includes(user?.system_role)) {
                  handleFreezeExams();
                } else if (user?.system_role === 'STUDENT') {
                  setShowExamsModal(true);
                }
              }}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl transition-colors text-sm shadow-sm shadow-orange-500/20"
            >
              {['EXAM_CONTROLLER', 'SUPER_ADMIN'].includes(user?.system_role) ? 'Freeze & Publish Exams' : 'View My Grades'}
            </button>
          </div>
        )}
      </div>

      {/* Add Course Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden animate-slide-up border border-slate-200/60">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2"><BookOpen size={18} className="text-blue-600"/> Define New Course</h2>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-white w-8 h-8 rounded-full shadow-sm flex items-center justify-center transition-all">×</button>
            </div>
            
            <form onSubmit={handleAddSubmit} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Course Code</label>
                  <input required type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-sm font-mono uppercase focus:border-blue-500 focus:bg-white transition-colors outline-none" placeholder="CS301" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Credits</label>
                  <input required type="number" min="1" max="10" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-sm focus:border-blue-500 focus:bg-white transition-colors outline-none" value={formData.credits} onChange={e => setFormData({...formData, credits: parseInt(e.target.value)})} />
                </div>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Course Name</label>
                <input required type="text" className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-sm focus:border-blue-500 focus:bg-white transition-colors outline-none" placeholder="Data Structures" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Department</label>
                <select required className="w-full border border-slate-200 bg-slate-50 rounded-xl p-2.5 text-sm focus:border-blue-500 focus:bg-white transition-colors outline-none" value={formData.department_id} onChange={e => setFormData({...formData, department_id: e.target.value})}>
                  <option value="">Select Department...</option>
                  {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>

              <div className="flex items-center bg-slate-50 p-3 rounded-xl border border-slate-100">
                <input type="checkbox" id="isElective" className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mr-3" checked={formData.is_elective} onChange={e => setFormData({...formData, is_elective: e.target.checked})} />
                <label htmlFor="isElective" className="text-sm font-bold text-slate-700">This is an Elective Course</label>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="px-5 py-2.5 text-sm font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition-all">Save Course</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Student Grades Modal */}
      {showExamsModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold text-slate-800">My Examination Report</h3>
                <p className="text-xs font-semibold text-slate-500 mt-1">Official grades with cryptographic freeze validation</p>
              </div>
              <button 
                onClick={() => setShowExamsModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm bg-slate-100 hover:bg-slate-200 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>
            
            <div className="overflow-x-auto rounded-2xl border border-slate-100">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-4">Course</th>
                    <th className="px-5 py-4">Exam Type</th>
                    <th className="px-5 py-4">Marks Obtained</th>
                    <th className="px-5 py-4">Status & Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentExams.map(ex => (
                    <tr key={ex.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800">{ex.course?.name || 'Unknown Course'}</div>
                        <div className="text-xs font-bold text-blue-600 font-mono mt-0.5">{ex.course?.code}</div>
                      </td>
                      <td className="px-5 py-4 font-bold text-slate-600">{ex.exam_type}</td>
                      <td className="px-5 py-4 font-mono font-bold text-slate-900">
                        {ex.marks_obtained} / {ex.max_marks}
                      </td>
                      <td className="px-5 py-4">
                        {ex.is_published ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                              Locked
                            </span>
                            <div className="text-[9px] font-mono text-slate-400 max-w-[150px] truncate" title={ex.cryptographic_hash}>
                              SHA256: {ex.cryptographic_hash}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-800">
                            Unpublished
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {studentExams.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-5 py-12 text-center text-slate-500 font-medium">
                        No examination records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

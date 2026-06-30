import { useEffect, useState } from 'react';
import { Search, Mail, Phone, MapPin } from 'lucide-react';
import api from './api';
import StudentDetailModal from './StudentDetailModal';

export default function Directory({ setAuthToken }: { setAuthToken: (t: string | null) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  
  // Notification Toast state
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const fetchData = async () => {
    try {
      const [usersRes, deptRes, meRes] = await Promise.all([
        api.get('/users'),
        api.get('/departments'),
        api.get('/users/me')
      ]);
      setUsers(usersRes.data);
      setDepartments(deptRes.data);
      setCurrentUser(meRes.data);
    } catch (err) {
      // Handle auth error gracefully in Layout
    }
  };

  useEffect(() => {
    fetchData();
  }, [setAuthToken]);

  const handleAddRole = async (userId: string, newRole: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;
    
    const currentRoles = targetUser.additional_roles || [];
    if (currentRoles.includes(newRole)) {
      showNotification('error', 'Role is already assigned to this user');
      return;
    }

    const updatedRoles = [...currentRoles, newRole];
    try {
      await api.put(`/users/${userId}/roles`, { additional_roles: updatedRoles });
      setUsers(users.map(u => u.id === userId ? { ...u, additional_roles: updatedRoles } : u));
      showNotification('success', `Assigned additional role: ${newRole.replace('_', ' ')} successfully!`);
    } catch (err) {
      showNotification('error', 'Failed to assign additional role');
    }
  };

  const handleRemoveRole = async (userId: string, roleToRemove: string) => {
    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    const currentRoles = targetUser.additional_roles || [];
    const updatedRoles = currentRoles.filter((r: string) => r !== roleToRemove);
    try {
      await api.put(`/users/${userId}/roles`, { additional_roles: updatedRoles });
      setUsers(users.map(u => u.id === userId ? { ...u, additional_roles: updatedRoles } : u));
      showNotification('success', `Removed role: ${roleToRemove.replace('_', ' ')}`);
    } catch (err) {
      showNotification('error', 'Failed to remove role');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = (u.first_name + ' ' + u.last_name).toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = filterRole === 'ALL' || u.system_role === filterRole;
    
    // Strict department restriction for HOD and Faculty roles
    const matchesDept = ['HOD', 'FACULTY'].includes(currentUser?.system_role)
      ? u.department_id === currentUser.department_id
      : true;
      
    return matchesSearch && matchesRole && matchesDept;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed top-20 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl shadow-lg border transition-all duration-300 ${
          notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
        }`}>
          <div className={`w-2 h-2 rounded-full ${notification.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
          <p className="text-sm font-semibold">{notification.message}</p>
        </div>
      )}
      
      {/* Search & Filter Bento */}
      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
          />
        </div>
        
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          {['ALL', 'STUDENT', 'FACULTY', 'HOD', 'ADMIN'].map(role => (
            <button 
              key={role}
              onClick={() => setFilterRole(role)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${
                filterRole === role 
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20' 
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredUsers.map(u => (
          <div key={u.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow group flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                    {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                  </div>
                  <div>
                    {u.system_role === 'STUDENT' ? (
                      <h3 
                        onClick={() => setSelectedStudentId(u.id)}
                        className="font-bold text-slate-800 text-lg tracking-tight hover:text-blue-600 hover:underline cursor-pointer"
                      >
                        {u.first_name} {u.last_name}
                      </h3>
                    ) : (
                      <h3 className="font-bold text-slate-800 text-lg tracking-tight">{u.first_name} {u.last_name}</h3>
                    )}
                    <p className="text-xs font-bold text-blue-600">{u.system_role}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-6">
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <Mail size={16} className="text-slate-400" />
                  {u.email}
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                  <Phone size={16} className="text-slate-400" />
                  +91 98765 43210
                </div>
                {u.department_id && (
                  <div className="flex items-center gap-3 text-sm text-slate-600 font-medium mt-4 pt-4 border-t border-slate-100">
                    <MapPin size={16} className="text-slate-400" />
                    Dept: {departments.find(d => d.id === u.department_id)?.name || 'General'}
                  </div>
                )}
              </div>
            </div>

            {/* Admin Multi-Role Control Workspace */}
            {['ADMIN', 'SUPER_ADMIN', 'PRINCIPAL'].includes(currentUser?.system_role) && u.system_role !== 'STUDENT' && (
              <div className="mt-6 pt-4 border-t border-slate-100 space-y-3">
                <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Additional Operational Roles</span>
                
                {/* Current Badge List */}
                <div className="flex flex-wrap gap-1.5">
                  {(u.additional_roles || []).length === 0 ? (
                    <span className="text-[10px] text-slate-400 font-bold italic">No additional roles assigned</span>
                  ) : (
                    (u.additional_roles || []).map((r: string) => (
                      <span key={r} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-100">
                        {r.replace('_', ' ')}
                        <button 
                          onClick={() => handleRemoveRole(u.id, r)}
                          className="hover:text-rose-600 font-extrabold focus:outline-none text-xs leading-none"
                          title="Revoke Role"
                        >
                          &times;
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Role assign drop-down */}
                <div className="flex items-center gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddRole(u.id, e.target.value);
                        e.target.value = ''; // reset selection
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-600 focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="">+ Assign Operational Role</option>
                    <option value="ADMISSION_ADMIN">Admission Admin</option>
                    <option value="TRANSPORT_OFFICER">Transport In-Charge</option>
                    <option value="HOSTEL_WARDEN">Hostel Warden</option>
                    <option value="EXAM_CONTROLLER">Exam Controller</option>
                    <option value="ACCOUNTS">Accounts Head</option>
                    <option value="LIBRARIAN">Librarian / Catalog Admin</option>
                    <option value="MESS_IN_CHARGE">Mess In-Charge</option>
                    <option value="SPORTS_OFFICER">Sports Officer</option>
                    <option value="ESTATE_MANAGER">Estate Manager</option>
                    <option value="PURCHASE_OFFICER">Purchase Officer</option>
                  </select>
                </div>
              </div>
            )}

          </div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-medium">
            No users found matching your criteria.
          </div>
        )}
      </div>

      <StudentDetailModal 
        studentId={selectedStudentId} 
        isOpen={selectedStudentId !== null} 
        onClose={() => setSelectedStudentId(null)} 
      />
    </div>
  );
}

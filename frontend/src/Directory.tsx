import { useEffect, useState } from 'react';
import { Search, Mail, Phone, MapPin } from 'lucide-react';
import api from './api';

export default function Directory({ setAuthToken }: { setAuthToken: (t: string | null) => void }) {
  const [users, setUsers] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('ALL');

  useEffect(() => {
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
    fetchData();
  }, [setAuthToken]);

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
          <div key={u.id} className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/60 hover:shadow-md transition-shadow group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
                  {u.first_name?.charAt(0)}{u.last_name?.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg tracking-tight">{u.first_name} {u.last_name}</h3>
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
        ))}
        {filteredUsers.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-500 font-medium">
            No users found matching your criteria.
          </div>
        )}
      </div>

    </div>
  );
}

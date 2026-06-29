import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import api from './api';

interface LayoutProps {
  children: React.ReactNode;
  setAuthToken: (t: string | null) => void;
}

export default function Layout({ children, setAuthToken }: LayoutProps) {
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/users/me');
        setUser(res.data);
      } catch (err) {
        // Handled by the child component or just ignore if it's a random failure
      }
    };
    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setAuthToken(null);
    navigate('/login');
  };

  const handleRoleSwitch = async (role: string) => {
    try {
      await api.post(`/users/me/switch-role?target_role=${role}`);
      // Refresh the page to reload permissions and data
      window.location.reload();
    } catch (err) {
      alert("Failed to switch role");
    }
  };

  const navItems = [
    { name: 'Workspace', path: '/', roles: ['ALL'] },
    { name: 'Directory', path: '/directory', roles: ['SUPER_ADMIN', 'INSTITUTION_ADMIN', 'PRINCIPAL', 'REGISTRAR', 'HOD', 'FACULTY'] },
    { name: 'Academics', path: '/academics', roles: ['SUPER_ADMIN', 'PRINCIPAL', 'HOD', 'FACULTY', 'STUDENT', 'EXAM_CONTROLLER'] },
    { name: 'Finance & HR', path: '/finance-hr', roles: ['SUPER_ADMIN', 'PRINCIPAL', 'ACCOUNTS', 'FACULTY', 'STUDENT', 'HOD', 'REGISTRAR'] },
    { name: 'Placements & Campus', path: '/placements-campus', roles: ['SUPER_ADMIN', 'PRINCIPAL', 'PLACEMENT_OFFICER', 'HOD', 'STUDENT'] }
  ];

  const filteredNavItems = navItems.filter(item => 
    item.roles.includes('ALL') || (user && item.roles.includes(user.system_role))
  );

  return (
    <div className="min-h-screen bg-[#f4f4f6] flex flex-col font-sans">
      <header className="bg-white/80 backdrop-blur-lg border-b border-slate-200/50 sticky top-0 z-50">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm shadow-blue-200">
                S
              </div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800">SutraOS</h1>
            </Link>
            
            <nav className="hidden md:flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl border-slate-200/50">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    location.pathname === item.path ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            
            {/* Multi-Role Switcher */}
            {user && (user.additional_roles?.length > 0) && (
              <div className="relative group mr-2">
                <button className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-slate-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  {user.system_role} ▾
                </button>
                <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                  <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-50 border-b border-slate-100">Switch Role</div>
                  {user.additional_roles.map((r: string) => (
                    <button 
                      key={r}
                      onClick={() => handleRoleSwitch(r)}
                      className="w-full text-left px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {user && (
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-50 border border-blue-200 flex items-center justify-center text-blue-700 font-bold shadow-sm">
                 {user.first_name?.charAt(0)}{user.last_name?.charAt(0)}
              </div>
            )}
            <button onClick={handleLogout} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-red-500 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-[1400px] mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}

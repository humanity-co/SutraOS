import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import api from './api';

export default function Login({ setAuthToken }: { setAuthToken: (t: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e?: React.FormEvent, demoUser?: string, demoPass?: string) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    
    const u = (demoUser || username).trim().toLowerCase();
    const p = demoPass || password;

    try {
      const formData = new URLSearchParams();
      formData.append('username', u);
      formData.append('password', p);
      
      const res = await api.post('/token', formData, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      });
      
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      setAuthToken(token);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 w-full animate-fade-in">
      <div className="flex-1 bg-gradient-to-br from-slate-900 to-blue-900 text-white flex flex-col justify-center p-16 relative overflow-hidden hidden md:flex">
        <div className="absolute top-[-200px] right-[-100px] w-[600px] h-[600px] rounded-full bg-blue-500/10 blur-3xl"></div>
        <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] rounded-full bg-emerald-500/5 blur-3xl"></div>
        <div className="relative z-10 max-w-md">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-8 backdrop-blur border border-white/20 shadow-xl">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
          </div>
          <h1 className="text-4xl font-bold mb-3 tracking-tight leading-tight text-white">SutraOS<br/><span className="text-blue-400 font-light text-3xl">Enterprise Platform</span></h1>
          <p className="text-lg text-slate-300 font-light">Maharashtra Institute of Technology</p>
          
          <div className="mt-10 p-3 bg-white/5 rounded-xl backdrop-blur-md border border-white/10 w-max shadow-2xl">
             <div className="text-[10px] uppercase tracking-widest text-slate-400 mb-1 font-bold">System Status</div>
             <div className="text-sm font-semibold text-emerald-400 flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-2"></div> All services operational</div>
          </div>
        </div>
      </div>
      
      <div className="flex-1 bg-slate-50 flex items-center justify-center p-8">
        <div className="w-full max-w-sm animate-slide-up">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-1 tracking-tight">Secure Login</h2>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Authentication Portal</p>
          </div>
          
          {error && (
            <div className="mb-5 bg-red-50 text-red-600 p-3 rounded-lg text-xs font-semibold border-l-2 border-red-500 shadow-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={e => handleLogin(e)} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Identifier</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 font-medium"
                placeholder="Username or ID"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Passcode</label>
              <div className="relative">
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 pr-10 bg-white border border-slate-200 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-900 font-medium tracking-widest"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold py-2.5 rounded-md shadow-md hover:shadow-lg transition-all active:scale-[0.98] mt-2 flex justify-center items-center"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>


        </div>
      </div>
    </div>
  );
}

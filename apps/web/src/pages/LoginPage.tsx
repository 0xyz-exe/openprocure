import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layers, ShieldCheck, ArrowRight, Lock, Mail } from 'lucide-react';
import { apiRequest, setAuthToken } from '../lib/api';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('admin@openprocure.org');
  const [password, setPassword] = useState('AdminPass123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await apiRequest<{ access_token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setAuthToken(res.access_token);
      navigate('/dashboard');
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md space-y-6 relative z-10">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 shadow-xl shadow-indigo-600/30 mb-2">
            <Layers className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            OpenProcure
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Open-Source Enterprise Procurement & Supplier Management OS
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-7 shadow-2xl space-y-5">
          <div className="border-b border-slate-800/80 pb-3">
            <h2 className="text-base font-bold text-white">Sign In to Workspace</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Enter your credentials to access organizational records.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-medium">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 transition font-mono"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {loading ? (
                'Authenticating...'
              ) : (
                <>
                  Access OpenProcure <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick 1-Click Role Switcher Demo */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300 block text-center">
              Quick-Fill Verified Demo Accounts:
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={() => setDemoUser('admin@openprocure.org', 'AdminPass123!')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-semibold text-purple-400">Admin</div>
                <div className="text-[10px] text-slate-300 truncate">Sarah Connor</div>
              </button>
              <button
                type="button"
                onClick={() =>
                  setDemoUser('procurement@openprocure.org', 'ProcurePass123!')
                }
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-semibold text-indigo-400">Procurement</div>
                <div className="text-[10px] text-slate-300 truncate">Marcus Vance</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('finance@openprocure.org', 'FinancePass123!')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-semibold text-emerald-400">Finance</div>
                <div className="text-[10px] text-slate-300 truncate">Elena Rostova</div>
              </button>
              <button
                type="button"
                onClick={() => setDemoUser('requester@openprocure.org', 'RequestPass123!')}
                className="p-2 rounded bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left transition"
              >
                <div className="font-semibold text-amber-400">Requester</div>
                <div className="text-[10px] text-slate-300 truncate">David Chen</div>
              </button>
            </div>
          </div>
        </div>

        {/* Security watermark */}
        <div className="text-center flex items-center justify-center gap-1.5 text-xs text-slate-300">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
          <span>Role-Based Access Control • Org Multi-Tenant Isolation</span>
        </div>
      </div>
    </div>
  );
};

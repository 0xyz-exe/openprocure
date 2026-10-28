import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { User } from '../../types';
import { apiRequest, removeAuthToken } from '../../lib/api';

export const AppLayout: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const data = await apiRequest<User>('/auth/me');
        setUser(data);
      } catch {
        removeAuthToken();
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    fetchMe();
  }, [navigate]);

  const handleLogout = () => {
    removeAuthToken();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
            Loading OpenProcure OS...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-500 selection:text-white">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header user={user} onLogout={handleLogout} />
        <main className="flex-1 p-6 sm:p-8 max-w-7xl w-full mx-auto overflow-x-hidden">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

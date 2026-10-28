import React, { useState, useEffect } from 'react';
import {
  Bell,
  Building,
  User as UserIcon,
  LogOut,
  ChevronDown,
  Check,
  ExternalLink,
} from 'lucide-react';
import { User, Notification } from '../../types';
import { apiRequest } from '../../lib/api';

interface HeaderProps {
  user: User | null;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ user, onLogout }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifs = async () => {
    try {
      const data = await apiRequest<Notification[]>('/notifications');
      setNotifications(data);
      setUnreadCount(data.filter((n) => !n.is_read).length);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 10000);
    return () => clearInterval(interval);
  }, []);

  const markAllRead = async () => {
    try {
      await apiRequest('/notifications/read-all', { method: 'POST' });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  };

  const getRoleBadgeColor = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-500/15 text-purple-400 border border-purple-500/30';
      case 'PROCUREMENT_MANAGER':
        return 'bg-indigo-500/15 text-indigo-400 border border-indigo-500/30';
      case 'FINANCE':
        return 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30';
      case 'WAREHOUSE':
        return 'bg-amber-500/15 text-amber-400 border border-amber-500/30';
      default:
        return 'bg-slate-500/15 text-slate-300 border border-slate-500/30';
    }
  };

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between sticky top-0 z-40">
      {/* Org switcher */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-medium text-slate-300">
          <Building className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-semibold text-slate-100">
            {user?.organization_name || 'Apex Global Technologies'}
          </span>
          <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
            ORG-APEX
          </span>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Notifications Popover */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 ring-4 ring-slate-900 animate-pulse" />
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                  Notifications ({unreadCount})
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-800/60">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500">
                    No active notifications
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 text-xs transition ${
                        n.is_read ? 'opacity-60 bg-transparent' : 'bg-slate-800/30'
                      }`}
                    >
                      <div className="font-semibold text-slate-200 mb-0.5">{n.title}</div>
                      <div className="text-slate-400 line-clamp-2 leading-relaxed">
                        {n.message}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center text-white font-bold text-xs shadow-md">
            {user?.full_name?.charAt(0) || 'U'}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-semibold text-slate-200 leading-tight">
              {user?.full_name || 'Sarah Connor'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded ${getRoleBadgeColor(
                  user?.role
                )}`}
              >
                {user?.role || 'ADMIN'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Logout"
            className="p-1.5 ml-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};

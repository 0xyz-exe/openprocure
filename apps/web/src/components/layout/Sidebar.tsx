import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  ShoppingBag,
  PackageCheck,
  Receipt,
  PieChart,
  ShieldCheck,
  History,
  Layers,
} from 'lucide-react';

interface SidebarProps {
  pendingApprovalsCount?: number;
  exceptionsCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  pendingApprovalsCount = 1,
  exceptionsCount = 1,
}) => {
  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Suppliers', path: '/suppliers', icon: Building2 },
    { label: 'Requisitions', path: '/requisitions', icon: FileSpreadsheet },
    {
      label: 'Approvals',
      path: '/approvals',
      icon: CheckCircle2,
      badge: pendingApprovalsCount > 0 ? pendingApprovalsCount : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
    },
    { label: 'RFQs & Tenders', path: '/rfqs', icon: FileText },
    { label: 'Purchase Orders', path: '/purchase-orders', icon: ShoppingBag },
    { label: 'Goods Receipts', path: '/goods-receipts', icon: PackageCheck },
    {
      label: 'Invoices & 3-Way',
      path: '/invoices',
      icon: Receipt,
      badge: exceptionsCount > 0 ? `${exceptionsCount} Err` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 border border-rose-500/30',
    },
    { label: 'Department Budgets', path: '/budgets', icon: PieChart },
    { label: 'Audit Trail', path: '/audit-logs', icon: History },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 h-screen sticky top-0">
      {/* Brand Header */}
      <div className="h-16 px-6 flex items-center gap-3 border-b border-slate-800">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
          <Layers className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-200 bg-clip-text text-transparent">
            OpenProcure
          </span>
          <span className="block text-[10px] uppercase tracking-wider text-indigo-400 font-semibold font-mono">
            Enterprise OS
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
        <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Procurement Lifecycle
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="font-mono text-[11px] text-slate-200 font-medium">Core v1.0 • Live</span>
          </div>
          <span className="font-mono text-[11px] text-slate-300">MIT Open Source</span>
        </div>
      </div>
    </aside>
  );
};

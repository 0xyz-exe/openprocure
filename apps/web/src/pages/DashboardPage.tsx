import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Building2,
  FileSpreadsheet,
  CheckCircle2,
  FileText,
  ShoppingBag,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ShieldAlert,
  Clock,
  PlusCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../lib/api';

export const DashboardPage: React.FC = () => {
  const [metrics, setMetrics] = useState<any>(null);
  const [charts, setCharts] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [m, c] = await Promise.all([
          apiRequest('/dashboard/metrics'),
          apiRequest('/dashboard/charts'),
        ]);
        setMetrics(m);
        setCharts(c);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 text-slate-500 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          Aggregating procurement metrics...
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total PO Spend',
      value: `$${(metrics?.total_spend || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
      desc: 'Active committed purchase orders',
    },
    {
      label: 'Verified Suppliers',
      value: `${metrics?.approved_suppliers || 0} / ${metrics?.total_suppliers || 0}`,
      icon: Building2,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10 border-indigo-500/20',
      desc: 'Tier-1 and audited vendors',
    },
    {
      label: 'Pending Approvals',
      value: metrics?.pending_requisitions || 0,
      icon: CheckCircle2,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
      desc: 'Requisitions in approval chain',
    },
    {
      label: '3-Way Exceptions',
      value: metrics?.invoice_exceptions || 0,
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10 border-rose-500/20',
      desc: 'Price/quantity reconciliation flags',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Procurement Intelligence Command
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time spend analytics, multi-tier approvals, vendor compliance, and 3-way matching.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            to="/requisitions"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Requisition
          </Link>
          <Link
            to="/rfqs"
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            <FileText className="w-4 h-4" />
            Launch RFQ
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900/90 border border-slate-800/90 rounded-xl p-5 relative overflow-hidden group hover:border-slate-700 transition"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {kpi.label}
                </span>
                <div className={`p-2 rounded-lg border ${kpi.bg}`}>
                  <Icon className={`w-4 h-4 ${kpi.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-white tracking-tight">
                  {kpi.value}
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-2 font-medium">{kpi.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Spend Analytics & Budget Utilization */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Category Spend Distribution */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-white">Spend by Category</h2>
              <p className="text-xs text-slate-300">Procurement spend distribution across active categories</p>
            </div>
            <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md border border-indigo-500/20">
              FY2026 Live
            </span>
          </div>

          <div className="space-y-4">
            {charts?.category_spend?.map((cat: any, i: number) => {
              const maxVal = Math.max(...charts.category_spend.map((c: any) => c.value || 1));
              const pct = Math.round((cat.value / (maxVal || 1)) * 100);
              return (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-slate-300">{cat.name}</span>
                    <span className="font-mono text-slate-300 font-semibold">
                      ${Number(cat.value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-400 transition-all duration-500"
                      style={{ width: `${Math.max(10, pct)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Monthly Spend Trend Highlights */}
          <div className="mt-8 pt-6 border-t border-slate-800/80 grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
              <span className="block text-[11px] text-slate-300 uppercase font-semibold">Avg Approval Speed</span>
              <span className="text-lg font-bold text-slate-200 mt-1 block">1.4 Days</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
              <span className="block text-[11px] text-slate-300 uppercase font-semibold">Match Rate</span>
              <span className="text-lg font-bold text-emerald-400 mt-1 block">94.8%</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800/60">
              <span className="block text-[11px] text-slate-300 uppercase font-semibold">Budget Used</span>
              <span className="text-lg font-bold text-indigo-400 mt-1 block">
                {metrics?.budget_utilization_percent || 38.6}%
              </span>
            </div>
          </div>
        </div>

        {/* PO Status Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-white">Purchase Order Pipeline</h2>
              <ShoppingBag className="w-4 h-4 text-slate-400" />
            </div>
            <p className="text-xs text-slate-300 mb-6">
              Status breakdown of all active procurement commitments
            </p>

            <div className="space-y-3">
              {charts?.po_statuses?.map((st: any, i: number) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-950/40 border border-slate-800/60"
                >
                  <span className="text-xs font-medium text-slate-300">{st.status}</span>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {st.count} Orders
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800">
            <Link
              to="/purchase-orders"
              className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center justify-between"
            >
              <span>View all purchase orders</span>
              <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Audit Log Activity Timeline */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Live Procurement Audit Log</h2>
          </div>
          <Link
            to="/audit-logs"
            className="text-xs font-semibold text-slate-400 hover:text-slate-200 transition"
          >
            Full Trail →
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60">
          {charts?.recent_activity?.slice(0, 5).map((log: any, i: number) => (
            <div key={i} className="py-3.5 flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-1.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold text-slate-200">
                    <span className="font-mono text-indigo-400 mr-2">[{log.action}]</span>
                    {log.details || `Modified ${log.entity}`}
                  </div>
                  <div className="text-[11px] text-slate-300 mt-0.5">
                    Triggered by <span className="font-medium text-slate-200">{log.actor}</span>
                  </div>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-300 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

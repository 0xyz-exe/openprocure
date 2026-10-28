import React, { useState, useEffect } from 'react';
import { History, Shield, Search, Filter } from 'lucide-react';
import { AuditLog } from '../types';
import { apiRequest } from '../lib/api';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<AuditLog[]>('/audit-logs?limit=50');
        setLogs(data);
      } catch (err) {
        console.error('Failed to fetch audit logs:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <History className="w-6 h-6 text-indigo-400" />
            Append-Only Procurement Audit Trail
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable system logs tracking every user action, approval transition, and reconciliation override.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="py-3.5 px-4">Action Event</th>
              <th className="py-3.5 px-4">Entity</th>
              <th className="py-3.5 px-4">Actor</th>
              <th className="py-3.5 px-4">Event Details & Modifications</th>
              <th className="py-3.5 px-4">IP Address</th>
              <th className="py-3.5 px-4 text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Retrieving immutable audit trail...
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-300">{log.entity_type}</td>
                  <td className="py-3.5 px-4 text-slate-200">{log.actor_name}</td>
                  <td className="py-3.5 px-4 text-slate-400 max-w-md truncate leading-relaxed">
                    {log.details || 'System event executed.'}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-500 text-[11px]">
                    {log.ip_address}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-400 text-[11px]">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

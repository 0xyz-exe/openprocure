import React, { useState, useEffect } from 'react';
import { PackageCheck, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { GoodsReceipt } from '../types';
import { apiRequest } from '../lib/api';

export const GoodsReceiptsPage: React.FC = () => {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReceipts = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<GoodsReceipt[]>('/goods-receipts');
        setReceipts(data);
      } catch (err) {
        console.error('Failed to fetch receipts:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReceipts();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Fully Accepted
          </span>
        );
      case 'DISCREPANCY':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertTriangle className="w-3 h-3" /> Discrepancy Flag
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <Clock className="w-3 h-3" /> Partial Delivery
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <PackageCheck className="w-6 h-6 text-indigo-400" />
            Warehouse Goods Intake & Inspection
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Serial tracking, receiving logs, dock discrepancy reports, and physical inventory intake.
          </p>
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="py-3.5 px-4">Receipt Number</th>
              <th className="py-3.5 px-4">Linked PO</th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Receiving Bay</th>
              <th className="py-3.5 px-4">Intake Officer</th>
              <th className="py-3.5 px-4">Intake Date</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Loading intake inspection records...
                </td>
              </tr>
            ) : receipts.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No warehouse goods receipts recorded.
                </td>
              </tr>
            ) : (
              receipts.map((gr) => (
                <tr key={gr.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">
                    {gr.receipt_number}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300 font-semibold">{gr.po_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{gr.supplier_name}</td>
                  <td className="py-3.5 px-4 text-slate-300">{gr.receiving_location}</td>
                  <td className="py-3.5 px-4 text-slate-300">{gr.received_by}</td>
                  <td className="py-3.5 px-4 text-slate-400 font-mono">
                    {new Date(gr.receipt_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(gr.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

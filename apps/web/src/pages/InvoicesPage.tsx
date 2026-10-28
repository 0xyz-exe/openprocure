import React, { useState, useEffect } from 'react';
import {
  Receipt,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  ShieldAlert,
  HelpCircle,
  X,
  FileCheck,
} from 'lucide-react';
import { Invoice } from '../types';
import { apiRequest } from '../lib/api';

export const InvoicesPage: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInv, setSelectedInv] = useState<Invoice | null>(null);
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolveReason, setResolveReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Invoice[]>('/invoices');
      setInvoices(data);
    } catch (err) {
      console.error('Failed to fetch invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, []);

  const handlePayInvoice = async (id: string) => {
    try {
      await apiRequest(`/invoices/${id}/pay`, { method: 'POST' });
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleResolveException = async () => {
    if (!selectedInv) return;
    setSubmitting(true);
    try {
      await apiRequest(`/invoices/${selectedInv.id}/resolve`, {
        method: 'POST',
        body: JSON.stringify({
          action: 'RESOLVE',
          reason: resolveReason || 'Authorized executive price/quantity tolerance override.',
        }),
      });
      setShowResolveModal(false);
      setSelectedInv(null);
      setResolveReason('');
      fetchInvoices();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const getMatchBadge = (status: string) => {
    switch (status) {
      case 'MATCHED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" /> 3-Way Matched
          </span>
        );
      case 'EXCEPTION':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
            <AlertTriangle className="w-3 h-3" /> Discrepancy Flag
          </span>
        );
      case 'RESOLVED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <FileCheck className="w-3 h-3" /> Exception Resolved
          </span>
        );
      default:
        return (
          <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
            {status}
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
            <Receipt className="w-6 h-6 text-indigo-400" />
            Invoices & Automated 3-Way Matching Engine
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Algorithmic reconciliation comparing Purchase Order prices, Goods Receipts quantities, and Supplier Invoices.
          </p>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="py-3.5 px-4">Invoice #</th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Linked PO</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">3-Way Match Verification</th>
              <th className="py-3.5 px-4">Payment Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Running automated 3-way matching rules...
                </td>
              </tr>
            ) : invoices.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No invoices recorded.
                </td>
              </tr>
            ) : (
              invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    {inv.invoice_number}
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-200">{inv.supplier_name}</td>
                  <td className="py-3.5 px-4 font-mono text-indigo-400 font-semibold">{inv.po_number}</td>
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    ${inv.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">{getMatchBadge(inv.match_status)}</td>
                  <td className="py-3.5 px-4 font-mono">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        inv.payment_status === 'PAID'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {inv.payment_status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right space-x-2">
                    {inv.match_status === 'EXCEPTION' && (
                      <button
                        onClick={() => {
                          setSelectedInv(inv);
                          setShowResolveModal(true);
                        }}
                        className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 text-[11px] font-semibold transition inline-flex items-center gap-1"
                      >
                        <AlertTriangle className="w-3 h-3" /> Inspect Variance
                      </button>
                    )}
                    {(inv.match_status === 'MATCHED' || inv.match_status === 'RESOLVED') &&
                      inv.payment_status !== 'PAID' && (
                        <button
                          onClick={() => handlePayInvoice(inv.id)}
                          className="px-3 py-1 rounded bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold transition inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" /> Approve & Pay
                        </button>
                      )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Inspect & Resolve Exception Modal */}
      {showResolveModal && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                3-Way Matching Discrepancy Flag
              </h3>
              <button
                onClick={() => setShowResolveModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-rose-400">
                <AlertTriangle className="w-4 h-4" /> Discrepancy Diagnostics:
              </div>
              <p className="font-mono leading-relaxed bg-slate-950/60 p-2.5 rounded border border-rose-500/20">
                {selectedInv.exception_reason}
              </p>
              <p className="text-[11px] text-slate-400">
                The three-way matching engine halted payment processing to prevent billing for unverified items or price discrepancies.
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Finance Override & Audit Justification
              </label>
              <textarea
                rows={3}
                placeholder="State reason for manual exception resolution (e.g. Authorized emergency tariff adjustment)..."
                value={resolveReason}
                onChange={(e) => setResolveReason(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowResolveModal(false)}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleResolveException}
                className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition"
              >
                {submitting ? 'Resolving...' : 'Override & Authorize'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

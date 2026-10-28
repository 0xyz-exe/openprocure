import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  XCircle,
  HelpCircle,
  Clock,
  ShieldAlert,
  ArrowRight,
  Send,
  MessageSquare,
  X,
} from 'lucide-react';
import { Requisition } from '../types';
import { apiRequest } from '../lib/api';

export const ApprovalsPage: React.FC = () => {
  const [approvals, setApprovals] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [comments, setComments] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<Requisition[]>('/approvals');
      setApprovals(data);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  const handleDecision = async (status: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED') => {
    if (!selectedReq) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiRequest(`/approvals/${selectedReq.id}/action`, {
        method: 'POST',
        body: JSON.stringify({
          status,
          comments: comments || `Action: ${status}`,
        }),
      });
      setSelectedReq(null);
      setComments('');
      fetchApprovals();
    } catch (err: any) {
      setErrorMsg(err.message || 'Approval decision failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <CheckCircle2 className="w-6 h-6 text-indigo-400" />
            Approval Governance Queue
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Managerial sign-offs, financial tier authorization, and policy enforcement.
          </p>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold">
          {approvals.length} Pending Sign-Offs
        </div>
      </div>

      {/* Approvals List */}
      <div className="grid grid-cols-1 gap-4">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Loading pending approvals...</div>
        ) : approvals.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-3 opacity-80" />
            <h3 className="text-base font-bold text-white">All Approval Queues Clear</h3>
            <p className="text-xs text-slate-400 mt-1">
              There are no purchase requisitions awaiting your review or authorization.
            </p>
          </div>
        ) : (
          approvals.map((req) => (
            <div
              key={req.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg"
            >
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {req.requisition_number}
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Dept: <span className="text-slate-200">{req.department}</span>
                  </span>
                  <span className="text-xs font-medium text-slate-400">
                    Requester: <span className="text-slate-200">{req.requester_name}</span>
                  </span>
                </div>

                <h3 className="text-base font-bold text-white">{req.title}</h3>
                {req.justification && (
                  <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                    "{req.justification}"
                  </p>
                )}

                <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                  <span>Level {req.current_approval_level} of {req.approval_level_required} Required</span>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                <div className="text-right">
                  <span className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
                    Total Commitment
                  </span>
                  <span className="text-xl font-mono font-extrabold text-white">
                    ${req.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  onClick={() => setSelectedReq(req)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  Review Request <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review & Decision Modal */}
      {selectedReq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white">
                  Review Requisition: {selectedReq.requisition_number}
                </h3>
                <span className="text-xs text-slate-400">{selectedReq.title}</span>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            {/* Line items summary */}
            <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Line Items
              </span>
              <div className="divide-y divide-slate-800/60 max-h-40 overflow-y-auto">
                {selectedReq.items?.map((it, idx) => (
                  <div key={idx} className="py-1.5 flex justify-between text-xs">
                    <span className="text-slate-200">
                      {it.quantity}x {it.description}
                    </span>
                    <span className="font-mono text-slate-300 font-semibold">
                      ${((it.quantity || 1) * (it.estimated_unit_price || 0)).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between text-xs font-bold">
                <span className="text-slate-300">Total Requested:</span>
                <span className="text-indigo-400 font-mono">
                  ${selectedReq.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Reviewer Comment */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                Reviewer Notes / Justification
              </label>
              <textarea
                rows={3}
                placeholder="Add audit justification or revision requirements..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Action buttons */}
            <div className="pt-3 border-t border-slate-800 flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision('CHANGES_REQUESTED')}
                className="px-3.5 py-2 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition"
              >
                Request Revisions
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision('REJECTED')}
                className="px-3.5 py-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 text-xs font-semibold transition"
              >
                Reject Request
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => handleDecision('APPROVED')}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition"
              >
                {submitting ? 'Recording...' : 'Authorize & Approve'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Plus,
  Award,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  X,
} from 'lucide-react';
import { RFQ, Quotation } from '../types';
import { apiRequest } from '../lib/api';

export const RfqsPage: React.FC = () => {
  const [rfqs, setRfqs] = useState<RFQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRfq, setSelectedRfq] = useState<any>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchRfqs = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<RFQ[]>('/rfqs');
      setRfqs(data);
    } catch (err) {
      console.error('Failed to fetch rfqs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRfqs();
  }, []);

  const handleOpenDetail = async (id: string) => {
    try {
      const data = await apiRequest<any>(`/rfqs/${id}`);
      setSelectedRfq(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRfq = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiRequest('/rfqs', {
        method: 'POST',
        body: JSON.stringify({ title, description }),
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      fetchRfqs();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAwardQuote = async (quoteId: string) => {
    try {
      await apiRequest(`/rfqs/quotations/${quoteId}/award`, { method: 'POST' });
      if (selectedRfq) {
        handleOpenDetail(selectedRfq.id);
      }
      fetchRfqs();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-indigo-400" />
            Request For Quotation (RFQ) Tenders
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Sealed bidding, quotation comparison matrix, lead-time benchmarking, and vendor contract awards.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Publish New RFQ
        </button>
      </div>

      {/* RFQ Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-slate-500">Loading active RFQs...</div>
        ) : rfqs.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No RFQs published.
          </div>
        ) : (
          rfqs.map((rfq) => (
            <div
              key={rfq.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition space-y-4 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {rfq.rfq_number}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      rfq.status === 'AWARDED'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                    }`}
                  >
                    {rfq.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-2.5">{rfq.title}</h3>
                {rfq.description && (
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {rfq.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">
                  Quotations:{' '}
                  <span className="text-white font-bold">{rfq.quotations_count || 0} Submitted</span>
                </span>
                <button
                  onClick={() => handleOpenDetail(rfq.id)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <Eye className="w-3.5 h-3.5 text-indigo-400" /> Compare Bids
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Compare Bids Modal */}
      {selectedRfq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Award className="w-5 h-5 text-indigo-400" />
                  Quotation Comparison Matrix: {selectedRfq.rfq_number}
                </h2>
                <span className="text-xs text-slate-400">{selectedRfq.title}</span>
              </div>
              <button
                onClick={() => setSelectedRfq(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Matrix comparison cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedRfq.quotations?.map((q: any) => (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border transition ${
                    q.status === 'AWARDED'
                      ? 'bg-emerald-950/20 border-emerald-500/40 ring-1 ring-emerald-500/20'
                      : 'bg-slate-950/50 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">{q.supplier_name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded font-mono ${
                        q.status === 'AWARDED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {q.status}
                    </span>
                  </div>

                  <div className="mt-3 flex items-baseline justify-between border-y border-slate-800/80 py-2.5">
                    <span className="text-xs text-slate-400">Total Quoted Bid:</span>
                    <span className="text-lg font-mono font-extrabold text-white">
                      ${q.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Lead Time</span>
                      <span className="font-semibold text-slate-200">{q.lead_time_days} Days</span>
                    </div>
                    <div className="p-2 rounded bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-500 uppercase block">Quote Code</span>
                      <span className="font-mono text-slate-300">{q.quotation_number}</span>
                    </div>
                  </div>

                  {q.notes && (
                    <p className="mt-2 text-[11px] text-slate-400 italic">"{q.notes}"</p>
                  )}

                  {selectedRfq.status !== 'AWARDED' && (
                    <button
                      onClick={() => handleAwardQuote(q.id)}
                      className="mt-4 w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      <Award className="w-3.5 h-3.5" /> Award Tender to Vendor
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create RFQ Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Launch Competitive RFQ
              </h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateRfq} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  RFQ Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sourcing 10G SFP+ Optical Transceivers"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Tender Scope & Specifications
                </label>
                <textarea
                  rows={3}
                  placeholder="Detailed requirements, delivery SLA, compliance certifications..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Publishing...' : 'Publish Tender'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

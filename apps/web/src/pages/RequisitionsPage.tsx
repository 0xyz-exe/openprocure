import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Send,
  XCircle,
  CheckCircle2,
  Clock,
  Trash2,
  X,
  AlertCircle,
  FileCheck,
} from 'lucide-react';
import { Requisition, RequisitionItem } from '../types';
import { apiRequest } from '../lib/api';

export const RequisitionsPage: React.FC = () => {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);

  // New Requisition Form State
  const [title, setTitle] = useState('');
  const [department, setDepartment] = useState('IT Infrastructure');
  const [priority, setPriority] = useState('MEDIUM');
  const [justification, setJustification] = useState('');
  const [items, setItems] = useState<RequisitionItem[]>([
    { description: '', quantity: 1, unit_of_measure: 'Units', estimated_unit_price: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchRequisitions = async () => {
    try {
      setLoading(true);
      const url = statusFilter === 'ALL' ? '/requisitions' : `/requisitions?status=${statusFilter}`;
      const data = await apiRequest<Requisition[]>(url);
      setRequisitions(data);
    } catch (err) {
      console.error('Failed to fetch requisitions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequisitions();
  }, [statusFilter]);

  const addItemRow = () => {
    setItems([
      ...items,
      { description: '', quantity: 1, unit_of_measure: 'Units', estimated_unit_price: 0 },
    ]);
  };

  const removeItemRow = (idx: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== idx));
    }
  };

  const updateItemField = (idx: number, field: keyof RequisitionItem, val: any) => {
    const updated = [...items];
    updated[idx] = { ...updated[idx], [field]: val };
    setItems(updated);
  };

  const calculateTotal = () => {
    return items.reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.estimated_unit_price) || 0),
      0
    );
  };

  const handleCreateRequisition = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiRequest('/requisitions', {
        method: 'POST',
        body: JSON.stringify({
          title,
          department,
          priority,
          justification,
          items,
        }),
      });
      setShowModal(false);
      setTitle('');
      setJustification('');
      setItems([{ description: '', quantity: 1, unit_of_measure: 'Units', estimated_unit_price: 0 }]);
      fetchRequisitions();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create requisition');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitForApproval = async (id: string) => {
    try {
      await apiRequest(`/requisitions/${id}/submit`, { method: 'POST' });
      fetchRequisitions();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        );
      case 'CONVERTED_TO_PO':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            PO Issued
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
            <Clock className="w-3 h-3" /> Awaiting Approval
          </span>
        );
      case 'DRAFT':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            Draft
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-800 text-slate-300">
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
            <FileSpreadsheet className="w-6 h-6 text-indigo-400" />
            Purchase Requisitions
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Requisition draft creation, budget commitments, itemized specifications, and approval workflows.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Create Requisition
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800/80 pb-3">
        {['ALL', 'PENDING_APPROVAL', 'APPROVED', 'CONVERTED_TO_PO', 'DRAFT'].map((tab) => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              statusFilter === tab
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            {tab.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="py-3.5 px-4">Req Number & Title</th>
              <th className="py-3.5 px-4">Department</th>
              <th className="py-3.5 px-4">Requester</th>
              <th className="py-3.5 px-4">Priority</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Loading requisitions...
                </td>
              </tr>
            ) : requisitions.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No purchase requisitions found.
                </td>
              </tr>
            ) : (
              requisitions.map((req) => (
                <tr key={req.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{req.title}</div>
                    <div className="font-mono text-[11px] text-indigo-400">{req.requisition_number}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">{req.department}</td>
                  <td className="py-3.5 px-4 text-slate-300">{req.requester_name}</td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                        req.priority === 'HIGH' || req.priority === 'URGENT'
                          ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    ${req.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(req.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    {req.status === 'DRAFT' && (
                      <button
                        onClick={() => handleSubmitForApproval(req.id)}
                        className="px-2.5 py-1 rounded bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 border border-indigo-500/30 text-[11px] font-semibold transition inline-flex items-center gap-1"
                      >
                        <Send className="w-3 h-3" /> Submit
                      </button>
                    )}
                    {req.status === 'CONVERTED_TO_PO' && (
                      <span className="text-[11px] text-slate-400 font-mono">PO Active</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Requisition Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-indigo-400" />
                Draft Purchase Requisition
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateRequisition} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Requisition Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Upgrade Core Network Switches & SFP+ Modules"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="IT Infrastructure">IT Infrastructure</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Operations">Operations</option>
                    <option value="Facilities">Facilities</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Priority Tier
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent (Expedited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Business Justification
                </label>
                <textarea
                  rows={2}
                  placeholder="Explain operational necessity or project link..."
                  value={justification}
                  onChange={(e) => setJustification(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Dynamic Line Items */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                    Requested Line Items
                  </span>
                  <button
                    type="button"
                    onClick={addItemRow}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Item
                  </button>
                </div>

                <div className="space-y-2">
                  {items.map((it, idx) => (
                    <div
                      key={idx}
                      className="grid grid-cols-12 gap-2 items-center bg-slate-950/60 p-2.5 rounded-lg border border-slate-800"
                    >
                      <div className="col-span-5">
                        <input
                          type="text"
                          required
                          placeholder="Item description / model"
                          value={it.description}
                          onChange={(e) => updateItemField(idx, 'description', e.target.value)}
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded text-xs text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="col-span-2">
                        <input
                          type="number"
                          required
                          min="1"
                          placeholder="Qty"
                          value={it.quantity}
                          onChange={(e) =>
                            updateItemField(idx, 'quantity', parseFloat(e.target.value) || 0)
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded text-xs text-white focus:outline-none focus:border-indigo-500 text-center"
                        />
                      </div>
                      <div className="col-span-3">
                        <input
                          type="number"
                          required
                          min="0"
                          step="0.01"
                          placeholder="Unit Price ($)"
                          value={it.estimated_unit_price}
                          onChange={(e) =>
                            updateItemField(
                              idx,
                              'estimated_unit_price',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/60 rounded text-xs text-white focus:outline-none focus:border-indigo-500 font-mono text-right"
                        />
                      </div>
                      <div className="col-span-1 font-mono text-xs text-slate-300 font-bold text-right">
                        ${((it.quantity || 0) * (it.estimated_unit_price || 0)).toFixed(0)}
                      </div>
                      <div className="col-span-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => removeItemRow(idx)}
                          disabled={items.length === 1}
                          className="text-slate-500 hover:text-rose-400 disabled:opacity-30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-between items-center p-3 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-xs font-semibold text-slate-400 uppercase">
                    Calculated Estimated Total:
                  </span>
                  <span className="text-base font-mono font-extrabold text-indigo-400">
                    ${calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50"
                >
                  {submitting ? 'Saving Draft...' : 'Save Requisition'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

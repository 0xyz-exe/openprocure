import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Star,
  Mail,
  Phone,
  CheckCircle,
  Clock,
  XCircle,
  X,
} from 'lucide-react';
import { Supplier } from '../types';
import { apiRequest } from '../lib/api';

export const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    legal_name: '',
    category: 'IT Hardware & Cloud',
    email: '',
    phone: '',
    payment_terms: 'Net 30',
    country: 'United States',
  });
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSuppliers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);
      if (statusFilter !== 'ALL') params.append('status', statusFilter);

      const data = await apiRequest<Supplier[]>(`/suppliers?${params.toString()}`);
      setSuppliers(data);
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, [search, categoryFilter, statusFilter]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await apiRequest('/suppliers', {
        method: 'POST',
        body: JSON.stringify(formData),
      });
      setShowModal(false);
      setFormData({
        code: '',
        name: '',
        legal_name: '',
        category: 'IT Hardware & Cloud',
        email: '',
        phone: '',
        payment_terms: 'Net 30',
        country: 'United States',
      });
      fetchSuppliers();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create supplier');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle className="w-3 h-3" /> Approved
          </span>
        );
      case 'PENDING_REVIEW':
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" /> In Review
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
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
            <Building2 className="w-6 h-6 text-indigo-400" />
            Supplier Directory & Lifecycle
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Vendor qualification, performance evaluation, payment terms, and relationship governance.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          Onboard Vendor
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search suppliers by name, code, or email..."
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Categories</option>
          <option value="IT Hardware & Cloud">IT Hardware & Cloud</option>
          <option value="Machinery & Facilities">Machinery & Facilities</option>
          <option value="General Goods">General Goods</option>
          <option value="Semiconductors">Semiconductors</option>
          <option value="Logistics & Shipping">Logistics & Shipping</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none focus:border-indigo-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="APPROVED">Approved</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Suppliers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="py-3.5 px-4">Vendor Code & Name</th>
              <th className="py-3.5 px-4">Category</th>
              <th className="py-3.5 px-4">Contact</th>
              <th className="py-3.5 px-4">Payment Terms</th>
              <th className="py-3.5 px-4">Rating</th>
              <th className="py-3.5 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  Loading verified supplier records...
                </td>
              </tr>
            ) : suppliers.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-500">
                  No suppliers match the selected criteria.
                </td>
              </tr>
            ) : (
              suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-100">{s.name}</div>
                    <div className="font-mono text-[11px] text-indigo-400">{s.code}</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] font-medium border border-slate-700/60">
                      {s.category}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Mail className="w-3 h-3 text-slate-500" />
                      <span>{s.email}</span>
                    </div>
                    {s.phone && (
                      <div className="flex items-center gap-1.5 text-slate-400 text-[11px] mt-0.5">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{s.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">{s.payment_terms}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1 text-amber-400 font-semibold font-mono">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{s.rating.toFixed(1)}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(s.status)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Onboard Supplier Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-indigo-400" />
                Onboard New Vendor
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

            <form onSubmit={handleCreateSupplier} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Vendor Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SUP-201"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="IT Hardware & Cloud">IT Hardware & Cloud</option>
                    <option value="Machinery & Facilities">Machinery & Facilities</option>
                    <option value="General Goods">General Goods</option>
                    <option value="Semiconductors">Semiconductors</option>
                    <option value="Logistics & Shipping">Logistics & Shipping</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Company / Vendor Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="Official trade or brand name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sales@vendor.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                    Payment Terms
                  </label>
                  <select
                    value={formData.payment_terms}
                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Net 15">Net 15</option>
                    <option value="Net 30">Net 30</option>
                    <option value="Net 45">Net 45</option>
                    <option value="Due on Receipt">Due on Receipt</option>
                  </select>
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
                  {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

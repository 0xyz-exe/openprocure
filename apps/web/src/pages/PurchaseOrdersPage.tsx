import React, { useState, useEffect } from 'react';
import {
  ShoppingBag,
  Eye,
  PackageCheck,
  CheckCircle2,
  Clock,
  Printer,
  X,
  Plus,
} from 'lucide-react';
import { PurchaseOrder } from '../types';
import { apiRequest } from '../lib/api';

export const PurchaseOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPo, setSelectedPo] = useState<any>(null);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receivingQty, setReceivingQty] = useState<{ [key: string]: number }>({});
  const [receivingLocation, setReceivingLocation] = useState('Central Warehouse Bay 4');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);
  const [receiptError, setReceiptError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await apiRequest<PurchaseOrder[]>('/purchase-orders');
      setOrders(data);
    } catch (err) {
      console.error('Failed to fetch POs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleOpenDetail = async (id: string) => {
    try {
      const data = await apiRequest<any>(`/purchase-orders/${id}`);
      setSelectedPo(data);
      // Initialize receiving quantities with remaining
      const initQty: { [key: string]: number } = {};
      data.items?.forEach((it: any) => {
        initQty[it.id] = Math.max(0, it.quantity - it.received_quantity);
      });
      setReceivingQty(initQty);
    } catch (err) {
      console.error(err);
    }
  };

  const handleProcessReceipt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPo) return;
    setSubmittingReceipt(true);
    setReceiptError('');

    try {
      const itemsPayload = selectedPo.items.map((it: any) => {
        const qtyToReceive = Number(receivingQty[it.id]) || 0;
        return {
          po_item_id: it.id,
          description: it.description,
          quantity_received: qtyToReceive,
          quantity_accepted: qtyToReceive,
          quantity_rejected: 0,
        };
      }).filter((it: any) => it.quantity_received > 0);

      if (itemsPayload.length === 0) {
        throw new Error('Please enter a receiving quantity greater than 0.');
      }

      await apiRequest('/goods-receipts', {
        method: 'POST',
        body: JSON.stringify({
          purchase_order_id: selectedPo.id,
          receiving_location: receivingLocation,
          notes: 'Standard dock intake inspection verified.',
          items: itemsPayload,
        }),
      });

      setShowReceiptModal(false);
      handleOpenDetail(selectedPo.id);
      fetchOrders();
    } catch (err: any) {
      setReceiptError(err.message || 'Receipt intake failed');
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'FULLY_RECEIVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Fully Received
          </span>
        );
      case 'PARTIALLY_RECEIVED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Partially Received
          </span>
        );
      case 'ISSUED':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Issued to Vendor
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
            <ShoppingBag className="w-6 h-6 text-indigo-400" />
            Purchase Order Management
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Contractual purchase commitments, shipment tracking, line-item fulfillment, and receiving.
          </p>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-950/60 text-[11px] uppercase tracking-wider font-bold text-slate-400">
              <th className="py-3.5 px-4">PO Number</th>
              <th className="py-3.5 px-4">Supplier</th>
              <th className="py-3.5 px-4">Order Date</th>
              <th className="py-3.5 px-4">Total Amount</th>
              <th className="py-3.5 px-4">Fulfillment</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  Loading purchase orders...
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  No purchase orders found.
                </td>
              </tr>
            ) : (
              orders.map((po) => (
                <tr key={po.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-indigo-400">{po.po_number}</td>
                  <td className="py-3.5 px-4 font-semibold text-slate-100">{po.supplier_name}</td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(po.order_date).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-100">
                    ${po.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold text-[11px]">
                      {po.fulfillment} items
                    </span>
                  </td>
                  <td className="py-3.5 px-4">{getStatusBadge(po.status)}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenDetail(po.id)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 ml-auto transition"
                    >
                      <Eye className="w-3.5 h-3.5 text-indigo-400" /> View Order
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* PO Detail Modal */}
      {selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto space-y-5">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-400" />
                  Purchase Order: {selectedPo.po_number}
                </h2>
                <span className="text-xs text-slate-400">
                  Vendor: {selectedPo.supplier_name} • Terms: {selectedPo.payment_terms}
                </span>
              </div>
              <button
                onClick={() => setSelectedPo(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Line items fulfillment */}
            <div className="bg-slate-950/60 rounded-xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                    <th className="py-2.5 px-4">Item Description</th>
                    <th className="py-2.5 px-4 text-center">Ordered</th>
                    <th className="py-2.5 px-4 text-center">Received</th>
                    <th className="py-2.5 px-4 text-right">Unit Price</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {selectedPo.items?.map((it: any) => (
                    <tr key={it.id}>
                      <td className="py-3 px-4 text-slate-200 font-medium">{it.description}</td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-200">
                        {it.quantity}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-emerald-400">
                        {it.received_quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-300">
                        ${it.unit_price.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-white">
                        ${it.total_price.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-4 bg-slate-900/50 border-t border-slate-800 flex justify-between items-center text-xs">
                <span className="text-slate-400">
                  Destination: <span className="text-slate-200">{selectedPo.delivery_address}</span>
                </span>
                <div className="text-right">
                  <span className="text-slate-400 mr-2">Total (incl tax):</span>
                  <span className="text-base font-mono font-extrabold text-white">
                    ${selectedPo.total_amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Controls */}
            <div className="pt-2 flex justify-between items-center">
              <span className="text-xs text-slate-500 font-mono">
                Status: <strong className="text-indigo-400">{selectedPo.status}</strong>
              </span>

              {selectedPo.status !== 'FULLY_RECEIVED' && (
                <button
                  onClick={() => setShowReceiptModal(true)}
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition flex items-center gap-1.5"
                >
                  <PackageCheck className="w-4 h-4" /> Receive Goods Intake
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receive Goods Intake Modal */}
      {showReceiptModal && selectedPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-indigo-400" />
                Warehouse Goods Intake
              </h3>
              <button
                onClick={() => setShowReceiptModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {receiptError && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                {receiptError}
              </div>
            )}

            <form onSubmit={handleProcessReceipt} className="space-y-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 uppercase mb-1">
                  Receiving Dock / Location
                </label>
                <input
                  type="text"
                  required
                  value={receivingLocation}
                  onChange={(e) => setReceivingLocation(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase">
                  Verify Intake Quantities
                </label>
                {selectedPo.items?.map((it: any) => {
                  const outstanding = it.quantity - it.received_quantity;
                  return (
                    <div
                      key={it.id}
                      className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-200">{it.description}</div>
                        <div className="text-[11px] text-slate-500">
                          Ordered: {it.quantity} | Already Received: {it.received_quantity}
                        </div>
                      </div>
                      <div className="w-24">
                        <input
                          type="number"
                          min="0"
                          max={outstanding}
                          value={receivingQty[it.id] || 0}
                          onChange={(e) =>
                            setReceivingQty({
                              ...receivingQty,
                              [it.id]: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-center font-mono font-bold text-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowReceiptModal(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReceipt}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50"
                >
                  {submittingReceipt ? 'Processing Intake...' : 'Confirm Goods Intake'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

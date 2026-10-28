import React, { useState, useEffect } from 'react';
import { PieChart, DollarSign, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { Budget } from '../types';
import { apiRequest } from '../lib/api';

export const BudgetsPage: React.FC = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBudgets = async () => {
      try {
        setLoading(true);
        const data = await apiRequest<Budget[]>('/budgets');
        setBudgets(data);
      } catch (err) {
        console.error('Failed to fetch budgets:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBudgets();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <PieChart className="w-6 h-6 text-indigo-400" />
            Department Procurement Budgets & Spend Controls
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Fiscal year allocations, commitment holds on requisitions, actual invoice disbursement, and utilization caps.
          </p>
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {loading ? (
          <div className="col-span-2 p-12 text-center text-slate-500">
            Calculating department budget utilization...
          </div>
        ) : budgets.length === 0 ? (
          <div className="col-span-2 p-12 text-center text-slate-500 bg-slate-900 border border-slate-800 rounded-xl">
            No department budgets configured for this fiscal year.
          </div>
        ) : (
          budgets.map((b) => {
            const isHighUtilization = b.utilization_percent >= 80;
            return (
              <div
                key={b.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl space-y-5 hover:border-slate-700 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{b.department}</h3>
                    <span className="text-xs text-slate-400 font-mono">
                      FY{b.fiscal_year} Allocation
                    </span>
                  </div>
                  <span
                    className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${
                      isHighUtilization
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                    }`}
                  >
                    {b.utilization_percent}% Used
                  </span>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 rounded-full bg-slate-950 border border-slate-800 overflow-hidden flex">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, b.utilization_percent)}%` }}
                      title={`Spent: $${b.actual_spent}`}
                    />
                    <div
                      className="bg-indigo-500/60 h-full transition-all duration-500"
                      style={{
                        width: `${Math.min(
                          100 - b.utilization_percent,
                          (b.committed_amount / b.allocated_amount) * 100
                        )}%`,
                      }}
                      title={`Committed: $${b.committed_amount}`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-mono text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                      Actual Spent
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                      PO Commitment
                    </span>
                    <span className="text-slate-500">Unallocated</span>
                  </div>
                </div>

                {/* Numbers Breakdown */}
                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-800/80 text-center">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Allocated
                    </span>
                    <span className="text-sm font-mono font-bold text-white mt-0.5 block">
                      ${b.allocated_amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Actual Spent
                    </span>
                    <span className="text-sm font-mono font-bold text-emerald-400 mt-0.5 block">
                      ${b.actual_spent.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-500 block">
                      Remaining
                    </span>
                    <span className="text-sm font-mono font-bold text-indigo-400 mt-0.5 block">
                      ${b.remaining_amount.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

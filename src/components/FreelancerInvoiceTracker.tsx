import React, { useState } from 'react';
import { Transaction, CurrencyCode } from '../types';
import {
  Briefcase,
  FileCheck,
  Clock,
  AlertCircle,
  Plus,
  Send,
  DollarSign,
  Building2,
  CheckCircle2,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';

interface FreelancerInvoiceTrackerProps {
  transactions: Transaction[];
  onUpdateInvoiceStatus: (id: string, status: 'paid' | 'pending') => void;
  currency: CurrencyCode;
  onOpenSmartInput: () => void;
}

export const FreelancerInvoiceTracker: React.FC<FreelancerInvoiceTrackerProps> = ({
  transactions,
  onUpdateInvoiceStatus,
  currency,
  onOpenSmartInput,
}) => {
  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Filter business transactions
  const businessTx = transactions.filter((t) => t.accountType === 'business');

  const pendingInvoices = businessTx.filter(
    (t) => t.invoiceStatus === 'pending' || t.invoiceStatus === 'unpaid'
  );
  const paidInvoices = businessTx.filter((t) => t.invoiceStatus === 'paid');

  const pendingTotal = pendingInvoices.reduce((sum, t) => sum + t.amount, 0);
  const paidTotal = paidInvoices.reduce((sum, t) => sum + t.amount, 0);

  // Business deductible expenses
  const businessDeductibles = businessTx
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  // Estimated tax set-aside (e.g. 25% of net profit)
  const netBusinessIncome = Math.max(0, paidTotal - businessDeductibles);
  const estimatedTaxReserve = Math.round(netBusinessIncome * 0.25);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Minh's Freelancer Invoice & Cash Flow Center</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Separate client invoicing, tax deductions, and unpaid balance pipeline
          </p>
        </div>

        <button
          onClick={onOpenSmartInput}
          className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Log Client Invoice</span>
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Pending Invoices Pipeline</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-amber-400">{symbol}{pendingTotal.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">{pendingInvoices.length} outstanding client bills</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Collected Revenue (YTD)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400">{symbol}{paidTotal.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">{paidInvoices.length} paid invoices</span>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Est. Quarterly Tax Reserve</span>
            <ShieldAlert className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-extrabold text-teal-400">{symbol}{estimatedTaxReserve.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500">25% set aside after {symbol}{businessDeductibles} write-offs</span>
        </div>
      </div>

      {/* Invoice List */}
      <div className="space-y-3">
        <h4 className="font-bold text-white text-sm">Client Invoices Status</h4>

        <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
          {pendingInvoices.length === 0 && paidInvoices.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs">
              No business invoices recorded yet. Click "+ Log Client Invoice" to add one!
            </div>
          ) : (
            [...pendingInvoices, ...paidInvoices].map((tx) => (
              <div
                key={tx.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-slate-900 border border-slate-800">
                    <Building2 className="w-5 h-5 text-teal-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">
                        {tx.clientName || tx.merchant}
                      </span>
                      {tx.invoiceNumber && (
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                          #{tx.invoiceNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{tx.notes || tx.category}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-extrabold text-white text-sm">
                      {symbol}{tx.amount.toLocaleString()}
                    </div>
                    <span className="text-[10px] text-slate-400">{tx.date}</span>
                  </div>

                  {tx.invoiceStatus === 'pending' || tx.invoiceStatus === 'unpaid' ? (
                    <button
                      onClick={() => onUpdateInvoiceStatus(tx.id, 'paid')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Mark Paid</span>
                    </button>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Paid</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

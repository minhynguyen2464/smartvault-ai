import React from 'react';
import { Transaction, CategoryBudget, CurrencyCode } from '../types';
import {
  TrendingUp,
  Wallet,
  Receipt,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Trash2,
  Settings
} from 'lucide-react';

interface DashboardOverviewProps {
  transactions: Transaction[];
  budgetCaps: CategoryBudget[];
  currency: CurrencyCode;
  onOpenSmartInput: () => void;
  onOpenBudgetCapsModal: () => void;
  onOpenCategoryManager?: (tab?: 'expense' | 'budget') => void;
  onRemoveBudgetCap?: (category: string) => Promise<void>;
  onOpenExportModal: () => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  transactions,
  budgetCaps,
  currency,
  onOpenSmartInput,
  onOpenBudgetCapsModal,
  onOpenCategoryManager,
  onRemoveBudgetCap,
  onOpenExportModal,
}) => {
  // Format currency helper
  const formatAmount = (num: number) => {
    const symbolMap: Record<CurrencyCode, string> = {
      USD: '$',
      VND: '₫',
      EUR: '€',
      GBP: '£',
    };
    const symbol = symbolMap[currency] || '₫';
    return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: (currency === 'VND' || num % 1 === 0) ? 0 : 2, maximumFractionDigits: currency === 'VND' ? 0 : 2 })}`;
  };

  // Calculate Totals accurately:
  // 1. Cleared / Paid Income (actual received cash)
  const paidIncomeTx = transactions.filter(
    (tx) => tx.type === 'income' && tx.invoiceStatus !== 'pending' && tx.invoiceStatus !== 'unpaid'
  );
  const clearedIncome = paidIncomeTx.reduce((acc, tx) => acc + tx.amount, 0);

  // 2. Pending Invoices (uncollected client revenue)
  const pendingInvoices = transactions.filter(
    (tx) => tx.type === 'income' && (tx.invoiceStatus === 'pending' || tx.invoiceStatus === 'unpaid')
  );
  const pendingInvoiceAmount = pendingInvoices.reduce((acc, tx) => acc + tx.amount, 0);

  // 3. Total Expenses
  const totalExpense = transactions
    .filter((tx) => tx.type === 'expense')
    .reduce((acc, tx) => acc + tx.amount, 0);

  // 4. Actual Total Liquid Balance = Cleared Received Income - Total Expenses
  const liquidBalance = clearedIncome - totalExpense;

  // 5. Total Gross Income (Cleared + Pending)
  const totalIncome = clearedIncome + pendingInvoiceAmount;

  // Calculate Category spent vs limits
  const categorySpentMap: Record<string, number> = {};
  transactions
    .filter((tx) => tx.type === 'expense')
    .forEach((tx) => {
      categorySpentMap[tx.category] = (categorySpentMap[tx.category] || 0) + tx.amount;
    });

  const overBudgetCategories = budgetCaps.filter((cap) => {
    const spent = categorySpentMap[cap.category] || 0;
    return spent >= cap.limit * 0.8; // Alert at 80%+
  });

  return (
    <div className="space-y-6">
      
      {/* Top Banner Alert if approaching Budget Caps */}
      {overBudgetCategories.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start justify-between gap-4 animate-fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-amber-300">Budget Warning Alert</h4>
              <p className="text-xs text-slate-300 mt-0.5">
                You have reached 80%+ of your limit for:{' '}
                <span className="font-semibold text-amber-200">
                  {overBudgetCategories.map((c) => c.category).join(', ')}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onOpenBudgetCapsModal}
            className="text-xs font-semibold text-amber-400 hover:text-amber-300 underline shrink-0"
          >
            Adjust Limits
          </button>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* Card 1: Liquid Balance */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Total Liquid Balance</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${liquidBalance >= 0 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className={`text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight ${liquidBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
            {formatAmount(liquidBalance)}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] mt-2 font-medium">
            {liquidBalance >= 0 ? (
              <>
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Cleared Cash On Hand</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                <span className="text-rose-400">Cash Deficit</span>
              </>
            )}
          </div>
          <p className="text-[10px] text-slate-500 mt-1">Cleared income minus total expenses</p>
        </div>

        {/* Card 2: Monthly Inflow */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Monthly Inflow (Cleared)</span>
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 text-teal-400 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-teal-400 tracking-tight">
            {formatAmount(clearedIncome)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {paidIncomeTx.length} cleared record{paidIncomeTx.length !== 1 ? 's' : ''}
            {pendingInvoices.length > 0 && ` (+${formatAmount(pendingInvoiceAmount)} pending)`}
          </p>
        </div>

        {/* Card 3: Monthly Expenses */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Monthly Outflow</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-rose-400 tracking-tight">
            {formatAmount(totalExpense)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {transactions.filter((t) => t.type === 'expense').length} expense items
          </p>
        </div>

        {/* Card 4: Pending Invoices / Freelance Pipeline */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 relative overflow-hidden group hover:border-slate-700 transition-all shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-medium text-slate-400">Pending Client Invoices</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-amber-400 tracking-tight">
            {formatAmount(pendingInvoiceAmount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-2">
            {pendingInvoices.length} outstanding invoice{pendingInvoices.length !== 1 ? 's' : ''}
          </p>
        </div>

      </div>

      {/* Category Budget Caps Visual Progress Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-white text-base">Category Budget Progress</h3>
            <p className="text-xs text-slate-400">Track monthly category spending against caps</p>
          </div>
          <button
            onClick={() =>
              onOpenCategoryManager ? onOpenCategoryManager('budget') : onOpenBudgetCapsModal()
            }
            className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold border border-emerald-500/20 px-3 py-1.5 rounded-xl bg-emerald-500/10 transition-colors flex items-center justify-center gap-1.5 shrink-0"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Manage Budget Categories</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgetCaps.map((cap) => {
            const spent = categorySpentMap[cap.category] || 0;
            const percent = Math.min(100, Math.round((spent / (cap.limit || 1)) * 100));
            const isNearLimit = percent >= 80;
            const isOverLimit = spent > cap.limit;

            return (
              <div
                key={cap.category}
                className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 hover:border-slate-700 transition-colors space-y-2 group relative"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-slate-200">{cap.category}</span>
                    {onRemoveBudgetCap && (
                      <button
                        onClick={() => onRemoveBudgetCap(cap.category)}
                        className="text-slate-500 hover:text-rose-400 p-0.5 rounded hover:bg-rose-500/10 transition-colors"
                        title={`Remove "${cap.category}" budget cap`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <span
                    className={`font-mono font-bold ${
                      isOverLimit
                        ? 'text-rose-400'
                        : isNearLimit
                        ? 'text-amber-400'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatAmount(spent)} / {formatAmount(cap.limit)}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isOverLimit
                        ? 'bg-rose-500'
                        : isNearLimit
                        ? 'bg-amber-400'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>{percent}% used</span>
                  <span>{formatAmount(Math.max(0, cap.limit - spent))} left</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

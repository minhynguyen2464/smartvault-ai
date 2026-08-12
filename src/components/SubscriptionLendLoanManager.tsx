import React, { useState } from 'react';
import {
  SubscriptionItem,
  LentRecord,
  LoanRecord,
  CurrencyCode,
  Transaction,
} from '../types';
import {
  Repeat,
  HandCoins,
  Landmark,
  Plus,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  X,
  CreditCard,
  UserCheck,
  Building,
  DollarSign,
  Trash2,
  TrendingDown,
  TrendingUp,
  Tag,
  ShieldAlert,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface SubscriptionLendLoanManagerProps {
  currency: CurrencyCode;
  subscriptions: SubscriptionItem[];
  lentRecords: LentRecord[];
  loanRecords: LoanRecord[];
  onUpdateSubscription: (sub: SubscriptionItem) => void;
  onAddSubscription: (sub: Omit<SubscriptionItem, 'id'>) => void;
  onDeleteSubscription: (id: string) => void;
  onUpdateLentRecord: (record: LentRecord) => void;
  onAddLentRecord: (record: Omit<LentRecord, 'id'>) => void;
  onDeleteLentRecord: (id: string) => void;
  onUpdateLoanRecord: (record: LoanRecord) => void;
  onAddLoanRecord: (record: Omit<LoanRecord, 'id'>) => void;
  onDeleteLoanRecord: (id: string) => void;
  onRecordPaymentTransaction: (tx: Omit<Transaction, 'id'>) => void;
}

export const SubscriptionLendLoanManager: React.FC<SubscriptionLendLoanManagerProps> = ({
  currency,
  subscriptions,
  lentRecords,
  loanRecords,
  onUpdateSubscription,
  onAddSubscription,
  onDeleteSubscription,
  onUpdateLentRecord,
  onAddLentRecord,
  onDeleteLentRecord,
  onUpdateLoanRecord,
  onAddLoanRecord,
  onDeleteLoanRecord,
  onRecordPaymentTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'subscriptions' | 'lent' | 'loans'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addType, setAddType] = useState<'subscription' | 'lent' | 'loan'>('subscription');

  // Success Notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Calculations
  const activeSubs = subscriptions.filter((s) => s.status !== 'cancelled' && s.status !== 'paused');
  const totalMonthlySubCost = activeSubs.reduce((sum, s) => {
    if (s.billingCycle === 'yearly') return sum + Math.round(s.cost / 12);
    return sum + s.cost;
  }, 0);

  const pendingLent = lentRecords.filter((r) => r.status === 'unpaid');
  const totalMoneyLentPending = pendingLent.reduce((sum, r) => sum + r.amount, 0);

  const activeLoans = loanRecords.filter((r) => r.status === 'active');
  const totalLoanBalance = activeLoans.reduce((sum, r) => sum + r.totalBalance, 0);
  const totalMonthlyLoanObligation = activeLoans.reduce((sum, r) => sum + r.monthlyPayment, 0);

  const netBalanceExposure = totalMoneyLentPending - totalLoanBalance;

  // Handlers for "Mark as Paid"
  const handleMarkSubscriptionPaid = (sub: SubscriptionItem) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Calculate next billing date (+ 1 month)
    const nextDate = new Date(today);
    if (sub.billingCycle === 'yearly') {
      nextDate.setFullYear(today.getFullYear() + 1);
    } else {
      nextDate.setMonth(today.getMonth() + 1);
    }
    const nextDateStr = nextDate.toISOString().split('T')[0];

    // Update Subscription Record
    const updatedSub: SubscriptionItem = {
      ...sub,
      lastPaidDate: todayStr,
      nextBillingDate: nextDateStr,
      status: 'active',
    };
    onUpdateSubscription(updatedSub);

    // Record Transaction in Ledger
    onRecordPaymentTransaction({
      amount: sub.cost,
      currency: sub.currency,
      merchant: sub.name,
      category: sub.category || 'Subscription',
      date: todayStr,
      type: 'expense',
      accountType: 'personal',
      notes: `Recurring ${sub.billingCycle} subscription payment marked paid`,
      isSubscription: true,
      tags: ['Subscription', 'Recurring', 'Paid'],
      rawLogSource: 'manual',
    });

    showToast(`Marked ${sub.name} as paid! Expense recorded in Ledger and next billing date set to ${nextDateStr}.`);
  };

  const handleMarkLentPaid = (record: LentRecord) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const updatedRecord: LentRecord = {
      ...record,
      status: 'paid',
      settledDate: todayStr,
    };
    onUpdateLentRecord(updatedRecord);

    // Record Income Transaction in Ledger
    onRecordPaymentTransaction({
      amount: record.amount,
      currency: record.currency,
      merchant: `Repayment from ${record.borrowerName}`,
      category: 'Repayment & Loan Income',
      date: todayStr,
      type: 'income',
      accountType: 'personal',
      notes: `Repayment received from ${record.borrowerName} (${record.notes || 'Money Lent'})`,
      tags: ['Repayment', 'Lend Settlement', 'Income'],
      rawLogSource: 'manual',
    });

    showToast(`Marked ${record.borrowerName}'s debt of ${symbol}${record.amount.toLocaleString()} as Paid/Settled! Income added to Ledger.`);
  };

  const handleMarkLoanPaid = (record: LoanRecord) => {
    const todayStr = new Date().toISOString().split('T')[0];

    const newBalance = Math.max(0, record.totalBalance - record.monthlyPayment);
    const updatedRecord: LoanRecord = {
      ...record,
      totalBalance: newBalance,
      lastPaymentDate: todayStr,
      status: newBalance <= 0 ? 'paid_off' : 'active',
    };
    onUpdateLoanRecord(updatedRecord);

    // Record Expense Transaction in Ledger
    onRecordPaymentTransaction({
      amount: record.monthlyPayment,
      currency: record.currency,
      merchant: record.lenderName,
      category: 'Debt & Loan Repayment',
      date: todayStr,
      type: 'expense',
      accountType: 'personal',
      notes: `Monthly loan payment for ${record.lenderName}. Remaining balance: ${symbol}${newBalance.toLocaleString()}`,
      tags: ['Loan Payment', 'Debt Repayment'],
      rawLogSource: 'manual',
    });

    if (newBalance <= 0) {
      showToast(`Congratulations! ${record.lenderName} is fully paid off! Payment logged in Ledger.`);
    } else {
      showToast(`Recorded ${symbol}${record.monthlyPayment.toLocaleString()} payment to ${record.lenderName}! Remaining balance: ${symbol}${newBalance.toLocaleString()}`);
    }
  };

  // Form States for Modal
  const [subForm, setSubForm] = useState({
    name: '',
    cost: '',
    billingCycle: 'monthly' as 'monthly' | 'yearly',
    category: 'Entertainment',
    nextBillingDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  const [lentForm, setLentForm] = useState({
    borrowerName: '',
    amount: '',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
  });

  const [loanForm, setLoanForm] = useState({
    lenderName: '',
    totalBalance: '',
    monthlyPayment: '',
    dueDate: '25th of month',
    interestRate: '',
    notes: '',
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (addType === 'subscription') {
      if (!subForm.name || !subForm.cost) return;
      onAddSubscription({
        name: subForm.name,
        cost: parseFloat(subForm.cost) || 0,
        currency,
        billingCycle: subForm.billingCycle,
        category: subForm.category,
        nextBillingDate: subForm.nextBillingDate,
        status: 'active',
        notes: subForm.notes,
      });
      showToast(`Subscription "${subForm.name}" added successfully!`);
      setSubForm({ name: '', cost: '', billingCycle: 'monthly', category: 'Entertainment', nextBillingDate: new Date().toISOString().split('T')[0], notes: '' });
    } else if (addType === 'lent') {
      if (!lentForm.borrowerName || !lentForm.amount) return;
      const lentAmount = parseFloat(lentForm.amount) || 0;
      const todayStr = new Date().toISOString().split('T')[0];

      onAddLentRecord({
        borrowerName: lentForm.borrowerName,
        amount: lentAmount,
        currency,
        dateLent: todayStr,
        dueDate: lentForm.dueDate,
        notes: lentForm.notes,
        status: 'unpaid',
      });

      // Record initial money lent outflow transaction in Ledger
      onRecordPaymentTransaction({
        amount: lentAmount,
        currency,
        merchant: `Lent to ${lentForm.borrowerName}`,
        category: 'Money Lent / Loans Out',
        date: todayStr,
        type: 'expense',
        accountType: 'personal',
        notes: `Money lent to ${lentForm.borrowerName} (${lentForm.notes || 'Lent out'})`,
        tags: ['Money Lent', 'Outflow', 'Receivable'],
        rawLogSource: 'manual',
      });

      showToast(`Money lent record for "${lentForm.borrowerName}" added! Outflow of ${symbol}${lentAmount.toLocaleString()} logged in Ledger and deducted from account balance.`);
      setLentForm({ borrowerName: '', amount: '', dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], notes: '' });
    } else if (addType === 'loan') {
      if (!loanForm.lenderName || !loanForm.totalBalance || !loanForm.monthlyPayment) return;
      onAddLoanRecord({
        lenderName: loanForm.lenderName,
        totalBalance: parseFloat(loanForm.totalBalance) || 0,
        monthlyPayment: parseFloat(loanForm.monthlyPayment) || 0,
        currency,
        dueDate: loanForm.dueDate,
        interestRate: loanForm.interestRate ? parseFloat(loanForm.interestRate) : undefined,
        notes: loanForm.notes,
        status: 'active',
      });
      showToast(`Loan record for "${loanForm.lenderName}" added successfully!`);
      setLoanForm({ lenderName: '', totalBalance: '', monthlyPayment: '', dueDate: '25th of month', interestRate: '', notes: '' });
    }
    setIsAddModalOpen(false);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      
      {/* Toast Feedback Banner */}
      {toastMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3.5 rounded-xl text-xs font-semibold flex items-center justify-between gap-3 animate-fade-in shadow-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400/60 hover:text-emerald-400">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Repeat className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-white text-base">Subscriptions, Lend & Loans Hub</h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Manage recurring subscriptions, money lent out to borrowers, and loan debts with 1-click 'Mark as Paid' actions.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-3.5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Record / Sub</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Subscriptions Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Recurring Subscriptions</span>
            <CreditCard className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400" style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 800 }}>
            {symbol}{totalMonthlySubCost.toLocaleString()}<span className="text-xs text-slate-400 font-normal">/mo</span>
          </div>
          <p className="text-[10px] text-slate-500">{activeSubs.length} active recurring services</p>
        </div>

        {/* Money Lent Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Money Lent (Owed to Me)</span>
            <HandCoins className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-teal-400" style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 800 }}>
            {symbol}{totalMoneyLentPending.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">{pendingLent.length} pending borrower repayments</p>
        </div>

        {/* Loans Card */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Loans & Debts (I Owe)</span>
            <Landmark className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-rose-400" style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 800 }}>
            {symbol}{totalLoanBalance.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">{symbol}{totalMonthlyLoanObligation.toLocaleString()}/mo monthly debt obligations</p>
        </div>

        {/* Net Exposure */}
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Net Receivables vs Debt</span>
            {netBalanceExposure >= 0 ? (
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            ) : (
              <ArrowDownLeft className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div className={`text-xl sm:text-2xl font-extrabold ${netBalanceExposure >= 0 ? 'text-emerald-400' : 'text-amber-400'}`} style={{ fontFamily: "'Segoe UI', sans-serif", fontWeight: 800 }}>
            {netBalanceExposure >= 0 ? '+' : ''}{symbol}{netBalanceExposure.toLocaleString()}
          </div>
          <p className="text-[10px] text-slate-500">
            {netBalanceExposure >= 0 ? 'Surplus receivables' : 'Net liabilities'}
          </p>
        </div>

      </div>

      {/* Sub-Tabs Selector */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === 'all'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          All Overview
        </button>
        <button
          onClick={() => setActiveTab('subscriptions')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'subscriptions'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <CreditCard className="w-3.5 h-3.5" />
          <span>Subscriptions ({subscriptions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('lent')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'lent'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <HandCoins className="w-3.5 h-3.5" />
          <span>Money Lent ({lentRecords.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('loans')}
          className={`px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'loans'
              ? 'bg-teal-500 text-slate-950 shadow-sm'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Landmark className="w-3.5 h-3.5" />
          <span>Loans & Debts ({loanRecords.length})</span>
        </button>
      </div>

      {/* VIEW SECTION 1: SUB-SUBSCRIPTIONS */}
      {(activeTab === 'all' || activeTab === 'subscriptions') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-400" />
              <span>Recurring Subscriptions & Software Services</span>
            </h4>
            {activeTab === 'all' && subscriptions.length > 0 && (
              <button
                onClick={() => setActiveTab('subscriptions')}
                className="text-xs text-teal-400 hover:underline font-semibold"
              >
                View all ({subscriptions.length}) &rarr;
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {subscriptions.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active subscriptions recorded. Click "+ Add Record / Sub" to track one!
              </div>
            ) : (
              (activeTab === 'all' ? subscriptions.slice(0, 3) : subscriptions).map((sub) => (
                <div
                  key={sub.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 shrink-0 text-emerald-400">
                      <Repeat className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{sub.name}</span>
                        <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full font-semibold">
                          {sub.category}
                        </span>
                        {sub.flaggedUnused && (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Unused?
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-500" />
                          Next due: <strong className="text-slate-300">{sub.nextBillingDate}</strong>
                        </span>
                        <span>Billing: <strong className="text-slate-300 capitalize">{sub.billingCycle}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-emerald-400 text-sm font-mono">
                        {symbol}{sub.cost.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal">/{sub.billingCycle === 'yearly' ? 'yr' : 'mo'}</span>
                      </div>
                      {sub.lastPaidDate && (
                        <span className="text-[10px] text-slate-500 block">Last paid: {sub.lastPaidDate}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleMarkSubscriptionPaid(sub)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        title="Mark Subscription Paid for this period"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Paid</span>
                      </button>

                      <button
                        onClick={() => onDeleteSubscription(sub.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete subscription"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW SECTION 2: MONEY LENT (OWED TO ME) */}
      {(activeTab === 'all' || activeTab === 'lent') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <HandCoins className="w-4 h-4 text-teal-400" />
              <span>Money Lent Out (Owed to Me)</span>
            </h4>
            {activeTab === 'all' && lentRecords.length > 0 && (
              <button
                onClick={() => setActiveTab('lent')}
                className="text-xs text-teal-400 hover:underline font-semibold"
              >
                View all ({lentRecords.length}) &rarr;
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {lentRecords.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No money lent records found. Click "+ Add Record / Sub" to log one!
              </div>
            ) : (
              (activeTab === 'all' ? lentRecords.slice(0, 3) : lentRecords).map((record) => (
                <div
                  key={record.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl border shrink-0 ${
                      record.status === 'paid' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                    }`}>
                      <UserCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{record.borrowerName}</span>
                        {record.status === 'paid' ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Paid / Settled
                          </span>
                        ) : (
                          <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Unpaid / Due {record.dueDate}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {record.notes || 'No description notes'} &bull; <span className="text-slate-500">Lent on {record.dateLent}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-teal-400 text-sm font-mono">
                        {symbol}{record.amount.toLocaleString()}
                      </div>
                      {record.settledDate && (
                        <span className="text-[10px] text-emerald-400 block">Settled on {record.settledDate}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {record.status === 'unpaid' ? (
                        <button
                          onClick={() => handleMarkLentPaid(record)}
                          className="px-3 py-1.5 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mark Paid</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          Settled
                        </span>
                      )}

                      <button
                        onClick={() => onDeleteLentRecord(record.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* VIEW SECTION 3: LOANS & DEBTS (I OWE) */}
      {(activeTab === 'all' || activeTab === 'loans') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Landmark className="w-4 h-4 text-rose-400" />
              <span>Loans & Outstanding Debts (I Owe)</span>
            </h4>
            {activeTab === 'all' && loanRecords.length > 0 && (
              <button
                onClick={() => setActiveTab('loans')}
                className="text-xs text-teal-400 hover:underline font-semibold"
              >
                View all ({loanRecords.length}) &rarr;
              </button>
            )}
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {loanRecords.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                No active loans or debt records. Click "+ Add Record / Sub" to track one!
              </div>
            ) : (
              (activeTab === 'all' ? loanRecords.slice(0, 3) : loanRecords).map((record) => (
                <div
                  key={record.id}
                  className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 shrink-0">
                      <Building className="w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-sm">{record.lenderName}</span>
                        {record.status === 'paid_off' ? (
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                            Paid Off
                          </span>
                        ) : (
                          <span className="text-[10px] bg-rose-500/10 text-rose-400 border border-rose-500/20 px-2 py-0.5 rounded-full font-bold">
                            Active Debt
                          </span>
                        )}
                        {record.interestRate && (
                          <span className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.5 rounded font-mono">
                            {record.interestRate}% APR
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-400 mt-0.5">
                        <span>Due: <strong className="text-slate-300">{record.dueDate}</strong></span>
                        <span>Monthly payment: <strong className="text-rose-400 font-mono">{symbol}{record.monthlyPayment.toLocaleString()}</strong></span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="font-extrabold text-rose-400 text-sm font-mono">
                        {symbol}{record.totalBalance.toLocaleString()}
                      </div>
                      <span className="text-[10px] text-slate-500 block">Remaining Balance</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {record.status === 'active' ? (
                        <button
                          onClick={() => handleMarkLoanPaid(record)}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1"
                          title={`Pay monthly installment of ${symbol}${record.monthlyPayment.toLocaleString()}`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Pay Installment</span>
                        </button>
                      ) : (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                          Cleared
                        </span>
                      )}

                      <button
                        onClick={() => onDeleteLoanRecord(record.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                        title="Delete loan record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ADD ITEM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <Plus className="w-5 h-5 text-teal-400" />
                <span>Add Record to Hub</span>
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Type Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-bold">
              <button
                type="button"
                onClick={() => setAddType('subscription')}
                className={`py-2 rounded-lg transition-all ${
                  addType === 'subscription' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Subscription
              </button>
              <button
                type="button"
                onClick={() => setAddType('lent')}
                className={`py-2 rounded-lg transition-all ${
                  addType === 'lent' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Money Lent
              </button>
              <button
                type="button"
                onClick={() => setAddType('loan')}
                className={`py-2 rounded-lg transition-all ${
                  addType === 'loan' ? 'bg-teal-500 text-slate-950 shadow-sm' : 'text-slate-400 hover:text-white'
                }`}
              >
                Loan / Debt
              </button>
            </div>

            {/* Form Inputs */}
            <form onSubmit={handleAddSubmit} className="space-y-4 text-xs">
              
              {/* SUB FORM */}
              {addType === 'subscription' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Service / Subscription Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Netflix, AWS, Gym Pass, Adobe CC"
                      value={subForm.name}
                      onChange={(e) => setSubForm({ ...subForm, name: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Recurring Cost ({symbol}) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 250000"
                        value={subForm.cost}
                        onChange={(e) => setSubForm({ ...subForm, cost: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Billing Cycle</label>
                      <select
                        value={subForm.billingCycle}
                        onChange={(e) => setSubForm({ ...subForm, billingCycle: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Category</label>
                      <input
                        type="text"
                        placeholder="e.g. Entertainment, Software, Health"
                        value={subForm.category}
                        onChange={(e) => setSubForm({ ...subForm, category: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Next Billing Date</label>
                      <input
                        type="date"
                        value={subForm.nextBillingDate}
                        onChange={(e) => setSubForm({ ...subForm, nextBillingDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* LENT FORM */}
              {addType === 'lent' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Borrower / Person Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Alex Chen, Sarah, John"
                      value={lentForm.borrowerName}
                      onChange={(e) => setLentForm({ ...lentForm, borrowerName: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Amount Lent ({symbol}) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 5000000"
                        value={lentForm.amount}
                        onChange={(e) => setLentForm({ ...lentForm, amount: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Expected Repayment Due Date</label>
                      <input
                        type="date"
                        value={lentForm.dueDate}
                        onChange={(e) => setLentForm({ ...lentForm, dueDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Purpose / Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Event venue deposit, equipment loan"
                      value={lentForm.notes}
                      onChange={(e) => setLentForm({ ...lentForm, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* LOAN FORM */}
              {addType === 'loan' && (
                <>
                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Lender / Bank / Creditor Name *</label>
                    <input
                      type="text"
                      placeholder="e.g. Techcombank Auto Loan, Citi Credit Card"
                      value={loanForm.lenderName}
                      onChange={(e) => setLoanForm({ ...loanForm, lenderName: e.target.value })}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Total Loan Balance ({symbol}) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 120000000"
                        value={loanForm.totalBalance}
                        onChange={(e) => setLoanForm({ ...loanForm, totalBalance: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Monthly Payment ({symbol}) *</label>
                      <input
                        type="number"
                        placeholder="e.g. 5500000"
                        value={loanForm.monthlyPayment}
                        onChange={(e) => setLoanForm({ ...loanForm, monthlyPayment: e.target.value })}
                        required
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Due Date / Cycle</label>
                      <input
                        type="text"
                        placeholder="e.g. 25th of month"
                        value={loanForm.dueDate}
                        onChange={(e) => setLoanForm({ ...loanForm, dueDate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">Interest Rate % (Optional)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="e.g. 7.5"
                        value={loanForm.interestRate}
                        onChange={(e) => setLoanForm({ ...loanForm, interestRate: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white font-mono focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-semibold mb-1">Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Vehicle loan, 24 month plan"
                      value={loanForm.notes}
                      onChange={(e) => setLoanForm({ ...loanForm, notes: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold shadow-md shadow-teal-500/20 transition-all"
                >
                  Save Record
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};

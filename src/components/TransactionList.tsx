import React, { useState } from 'react';
import { Transaction, CurrencyCode, AccountType } from '../types';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Download,
  Tag,
  Calendar,
  Building2,
  FileText,
  Mic,
  Type as TypeIcon,
  CheckCircle2,
  Clock,
  Briefcase,
  User,
  Sparkles
} from 'lucide-react';

interface TransactionListProps {
  transactions: Transaction[];
  onDeleteTransaction: (id: string) => void;
  onEditTransaction: (tx: Transaction) => void;
  currency: CurrencyCode;
  onOpenSmartInput: () => void;
  onOpenExportModal: () => void;
}

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDeleteTransaction,
  onEditTransaction,
  currency,
  onOpenSmartInput,
  onOpenExportModal,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAccount, setSelectedAccount] = useState<'all' | 'personal' | 'business'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Filter logic
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.merchant.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.tags?.some((tag) => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesAccount =
      selectedAccount === 'all' || tx.accountType === selectedAccount;

    const matchesCategory =
      selectedCategory === 'all' || tx.category === selectedCategory;

    return matchesSearch && matchesAccount && matchesCategory;
  });

  const categoriesList = Array.from(new Set(transactions.map((t) => t.category)));

  // Helper to format date label (Today, Yesterday, or Aug 06, 2026)
  const formatDateHeader = (dateStr: string) => {
    if (!dateStr) return 'Unspecified Date';
    
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return 'Today';
    if (dateStr === yesterdayStr) return 'Yesterday';

    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    return dateStr;
  };

  // Group filtered transactions by YYYY-MM-DD (sorted descending)
  const groupedByDateMap: Record<string, { txs: Transaction[]; income: number; expense: number }> = {};

  // Sort filtered transactions by date descending
  const sortedFiltered = [...filtered].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  sortedFiltered.forEach((tx) => {
    const dateKey = tx.date ? tx.date.split('T')[0] : 'Unspecified';
    if (!groupedByDateMap[dateKey]) {
      groupedByDateMap[dateKey] = { txs: [], income: 0, expense: 0 };
    }
    groupedByDateMap[dateKey].txs.push(tx);
    if (tx.type === 'income') {
      groupedByDateMap[dateKey].income += tx.amount;
    } else {
      groupedByDateMap[dateKey].expense += tx.amount;
    }
  });

  const dateGroups = Object.keys(groupedByDateMap).map((dateKey) => ({
    dateKey,
    label: formatDateHeader(dateKey),
    data: groupedByDateMap[dateKey],
  }));

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
      
      {/* Header & Controls */}
      <div className="p-4 sm:p-6 border-b border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div>
            <h3 className="font-bold text-white text-base">Transaction Ledger</h3>
            <p className="text-xs text-slate-400">
              {filtered.length} of {transactions.length} records shown
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExportModal}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV/Tax</span>
            </button>
            <button
              onClick={onOpenSmartInput}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-emerald-500/10"
            >
              <Plus className="w-4 h-4" />
              <span>Log Expense</span>
            </button>
          </div>
        </div>

        {/* Search & Filters Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search merchant, tags, notes..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Scope Filter */}
          <div className="flex items-center bg-slate-950 rounded-xl border border-slate-800 p-1 text-xs">
            <button
              onClick={() => setSelectedAccount('all')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                selectedAccount === 'all'
                  ? 'bg-slate-800 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              All Scope
            </button>
            <button
              onClick={() => setSelectedAccount('personal')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                selectedAccount === 'personal'
                  ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Personal
            </button>
            <button
              onClick={() => setSelectedAccount('business')}
              className={`flex-1 py-1 rounded-lg font-medium transition-all ${
                selectedAccount === 'business'
                  ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Business
            </button>
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categoriesList.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction Table / Cards Grouped by Date */}
      <div className="overflow-x-auto">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 space-y-2">
            <Filter className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-400">No matching transactions found</p>
            <p className="text-xs">Try clearing your filters or logging a new item.</p>
          </div>
        ) : (
          dateGroups.map((group) => (
            <div key={group.dateKey} className="border-b border-slate-800/80 last:border-b-0">
              
              {/* Date Header Banner */}
              <div className="bg-slate-950/80 px-3 sm:px-6 py-2.5 border-y border-slate-800/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-bold text-xs text-white uppercase tracking-wider">
                    {group.label}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded-full border border-slate-800">
                    {group.data.txs.length} {group.data.txs.length === 1 ? 'record' : 'records'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono">
                  {group.data.income > 0 && (
                    <span className="text-emerald-400 font-bold">
                      +{symbol}{group.data.income.toLocaleString()}
                    </span>
                  )}
                  {group.data.expense > 0 && (
                    <span className="text-rose-400 font-bold">
                      -{symbol}{group.data.expense.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>

              {/* Transactions under this Date */}
              <div className="divide-y divide-slate-800/40">
                {group.data.txs.map((tx) => (
                  <div
                    key={tx.id}
                    className="px-3 sm:px-6 py-3.5 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
                  >
                    {/* Left Column: Icon + Merchant + Category */}
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                          tx.type === 'income'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {tx.merchant.slice(0, 2).toUpperCase()}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{tx.merchant}</span>

                          {/* Scope Tag */}
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                              tx.accountType === 'business'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                            }`}
                          >
                            {tx.accountType === 'business' ? 'Business' : 'Personal'}
                          </span>

                          {/* Source Badge */}
                          {tx.rawLogSource && (
                            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded flex items-center gap-1">
                              {tx.rawLogSource === 'receipt' && <FileText className="w-3 h-3 text-amber-400" />}
                              {tx.rawLogSource === 'voice' && <Mic className="w-3 h-3 text-rose-400" />}
                              {tx.rawLogSource === 'text' && <TypeIcon className="w-3 h-3 text-teal-400" />}
                              <span className="capitalize">{tx.rawLogSource}</span>
                            </span>
                          )}

                          {/* Invoice Status Pill */}
                          {tx.invoiceStatus && tx.invoiceStatus !== 'none' && (
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex items-center gap-1 ${
                                tx.invoiceStatus === 'paid'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}
                            >
                              {tx.invoiceStatus === 'paid' ? (
                                <CheckCircle2 className="w-3 h-3" />
                              ) : (
                                <Clock className="w-3 h-3" />
                              )}
                              <span className="capitalize">{tx.invoiceStatus} Invoice</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-400">
                          <span className="font-medium text-slate-300">{tx.category}</span>
                          {tx.notes && (
                            <>
                              <span>•</span>
                              <span className="italic truncate max-w-xs">{tx.notes}</span>
                            </>
                          )}
                        </div>

                        {/* Tags */}
                        {tx.tags && tx.tags.length > 0 && (
                          <div className="flex items-center gap-1 pt-0.5">
                            {tx.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] bg-slate-950 text-slate-400 border border-slate-800 px-2 py-0.5 rounded-md"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right Column: Amount & Actions */}
                    <div className="flex items-center justify-between sm:justify-end gap-4">
                      <div className="text-right">
                        <div
                          className={`font-extrabold text-base tracking-tight ${
                            tx.type === 'income' ? 'text-teal-400' : 'text-slate-100'
                          }`}
                        >
                          {tx.type === 'income' ? '+' : '-'}{symbol}
                          {tx.amount.toLocaleString('en-US', {
                            minimumFractionDigits: tx.amount % 1 === 0 ? 0 : 2,
                            maximumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">{tx.type}</div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                          title="Edit transaction"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};

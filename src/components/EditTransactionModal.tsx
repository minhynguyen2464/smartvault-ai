import React, { useState, useEffect } from 'react';
import { Transaction, CurrencyCode, AccountType } from '../types';
import { formatMoneyInput, parseMoneyInput } from '../utils/formatters';
import { X, Check, Edit3, Trash2, Tag, Calendar, DollarSign, Plus } from 'lucide-react';

interface EditTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onSaveTransaction: (updated: Transaction) => void;
  onDeleteTransaction?: (id: string) => void;
  currency: CurrencyCode;
  customCategories?: string[];
}

export const EditTransactionModal: React.FC<EditTransactionModalProps> = ({
  isOpen,
  onClose,
  transaction,
  onSaveTransaction,
  onDeleteTransaction,
  currency,
  customCategories = [],
}) => {
  if (!isOpen || !transaction) return null;

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  const [amountStr, setAmountStr] = useState<string>('');
  const [merchant, setMerchant] = useState<string>('');
  const [type, setType] = useState<'expense' | 'income'>('expense');
  const [category, setCategory] = useState<string>('Food & Dining');
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const [date, setDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [invoiceStatus, setInvoiceStatus] = useState<'none' | 'pending' | 'paid'>('none');
  const [isSubscription, setIsSubscription] = useState<boolean>(false);
  const [tagsStr, setTagsStr] = useState<string>('');

  const [isCreatingCustomCat, setIsCreatingCustomCat] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when modal opens or transaction changes
  useEffect(() => {
    if (transaction) {
      setAmountStr(formatMoneyInput(transaction.amount));
      setMerchant(transaction.merchant || '');
      setType(transaction.type || 'expense');
      setCategory(transaction.category || 'Food & Dining');
      setAccountType(transaction.accountType || 'personal');
      setDate(transaction.date || new Date().toISOString().split('T')[0]);
      setNotes(transaction.notes || '');
      setInvoiceStatus(transaction.invoiceStatus || 'none');
      setIsSubscription(!!transaction.isSubscription);
      setTagsStr(transaction.tags ? transaction.tags.join(', ') : '');
      setIsCreatingCustomCat(false);
      setCustomCategoryText('');
      setErrorMsg(null);
    }
  }, [transaction]);

  const DEFAULT_CATEGORIES = Array.from(
    new Set(
      customCategories && customCategories.length > 0
        ? customCategories
        : [
            'Food & Drink',
            'Food & Dining',
            'Shopping',
            'Market',
            'Tech & Infrastructure',
            'Groceries',
            'Commute & Transit',
            'Utilities & Office',
            'Entertainment',
            'Client Revenue',
            'Salary & Income',
            'Healthcare',
            'Travel',
            'Other',
          ]
    )
  ).sort((a, b) => b.localeCompare(a));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const numericAmount = parseMoneyInput(amountStr);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }

    if (!merchant.trim()) {
      setErrorMsg('Merchant / Payee name is required.');
      return;
    }

    const finalCategory = isCreatingCustomCat && customCategoryText.trim()
      ? customCategoryText.trim()
      : category;

    const parsedTags = tagsStr
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    const updated: Transaction = {
      ...transaction,
      amount: numericAmount,
      merchant: merchant.trim(),
      type,
      category: finalCategory,
      accountType,
      date,
      notes: notes.trim(),
      invoiceStatus,
      isSubscription,
      tags: parsedTags,
    };

    onSaveTransaction(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Edit Transaction</h3>
              <p className="text-xs text-slate-400">Update ledger details and category</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Type & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Transaction Type</label>
              <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'expense'
                      ? 'bg-rose-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Expense (-)
                </button>
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    type === 'income'
                      ? 'bg-emerald-500 text-slate-950 shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Income (+)
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Amount ({symbol}) <span className="text-rose-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                  {symbol}
                </span>
                <input
                  type="text"
                  value={amountStr}
                  onChange={(e) => setAmountStr(formatMoneyInput(e.target.value))}
                  placeholder="0.00"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white font-bold text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Merchant */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Merchant / Payee / Client <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={merchant}
              onChange={(e) => setMerchant(e.target.value)}
              placeholder="e.g. Starbucks, Client Acme, AWS"
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category & Scope */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300 block">Category</label>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingCustomCat(!isCreatingCustomCat);
                    setCustomCategoryText('');
                  }}
                  className="text-[10px] text-emerald-400 hover:underline font-semibold"
                >
                  {isCreatingCustomCat ? 'Select existing' : '+ Custom Category'}
                </button>
              </div>

              {isCreatingCustomCat ? (
                <input
                  type="text"
                  placeholder="Type custom category name..."
                  value={customCategoryText}
                  onChange={(e) => setCustomCategoryText(e.target.value)}
                  className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              ) : (
                <select
                  value={category}
                  onChange={(e) => {
                    if (e.target.value === '__CUSTOM__') {
                      setIsCreatingCustomCat(true);
                      setCustomCategoryText('');
                    } else {
                      setCategory(e.target.value);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {DEFAULT_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="__CUSTOM__">+ Create New Category...</option>
                </select>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Account Scope</label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="personal">Personal Expenses</option>
                <option value="business">Business / Freelance</option>
              </select>
            </div>
          </div>

          {/* Date & Invoice Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Invoice Status</label>
              <select
                value={invoiceStatus}
                onChange={(e) => setInvoiceStatus(e.target.value as 'none' | 'pending' | 'paid')}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="none">N/A (Standard Expense)</option>
                <option value="pending">Pending Invoice</option>
                <option value="paid">Paid Invoice</option>
              </select>
            </div>
          </div>

          {/* Tags & Subscription */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">Tags (comma separated)</label>
              <input
                type="text"
                placeholder="e.g. Travel, ClientDinner, TaxDeductible"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-2 sm:pt-4 flex items-center gap-2">
              <input
                type="checkbox"
                id="editIsSubscription"
                checked={isSubscription}
                onChange={(e) => setIsSubscription(e.target.checked)}
                className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
              />
              <label htmlFor="editIsSubscription" className="text-xs text-slate-300 font-medium cursor-pointer">
                Recurring Subscription
              </label>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Notes</label>
            <input
              type="text"
              placeholder="Add optional notes or receipt details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
            {onDeleteTransaction ? (
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(transaction.id);
                  onClose();
                }}
                className="px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save Changes</span>
              </button>
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

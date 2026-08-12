import React, { useState, useRef } from 'react';
import { Transaction, CurrencyCode, AccountType } from '../types';
import { formatMoneyInput, parseMoneyInput } from '../utils/formatters';
import {
  X,
  Type as TypeIcon,
  Camera,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  FileText,
  Upload,
  RefreshCw,
  PlusCircle,
  Tag,
  Calendar,
  Building2,
  DollarSign,
  Briefcase,
  User,
  ArrowRight,
  Plus,
  Check,
  Trash2,
  Settings
} from 'lucide-react';

interface SmartInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (tx: Omit<Transaction, 'id'>) => void;
  currency: CurrencyCode;
  defaultAccountType?: AccountType;
  customCategories?: string[];
  onOpenCategoryManager?: (tab?: 'expense' | 'budget') => void;
  onRemoveExpenseCategory?: (category: string) => Promise<void>;
}

export const SmartInputModal: React.FC<SmartInputModalProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  currency,
  defaultAccountType = 'personal',
  customCategories = [],
  onOpenCategoryManager,
  onRemoveExpenseCategory,
}) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'text' | 'receipt'>('manual');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Custom Category State
  const [isCreatingCustomCat, setIsCreatingCustomCat] = useState(false);
  const [isManagingCategories, setIsManagingCategories] = useState(false);
  const [customCategoryText, setCustomCategoryText] = useState('');

  // Manual Log Form State
  const [manualAmount, setManualAmount] = useState<string>('');
  const [manualType, setManualType] = useState<'expense' | 'income'>('expense');
  const [manualMerchant, setManualMerchant] = useState<string>('');
  const [manualCategory, setManualCategory] = useState<string>('Food & Drink');
  const [manualAccountType, setManualAccountType] = useState<AccountType>(defaultAccountType);
  const [manualDate, setManualDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [manualNotes, setManualNotes] = useState<string>('');
  const [manualIsSubscription, setManualIsSubscription] = useState<boolean>(false);

  // Default Categories List
  const DEFAULT_CATEGORIES = Array.from(
    new Set([
      ...(customCategories && customCategories.length > 0
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
          ]),
    ])
  );

  // Receipt image state
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>('image/png');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extracted Result state for AI review
  const [extractedTx, setExtractedTx] = useState<Partial<Transaction> | null>(null);

  if (!isOpen) return null;

  // Currency Symbol helper
  const currencySymbol =
    currency === 'VND' ? '₫' : currency === 'EUR' ? '€' : currency === 'GBP' ? '£' : '₫';

  // Sample natural language prompts for fast AI testing
  const TEXT_SAMPLES = [
    'Spent 45k on pho and iced coffee with team',
    'Paid 1,450,000₫ for AWS cloud server monthly hosting',
    'Received 35,000,000₫ salary from Acme Corp',
    'Invoiced 28,000,000₫ to DesignSprint Inc for UI audit (Pending)',
    'Uber ride 280,000₫ downtown for business client dinner',
    'Bought groceries at Market for 850,000₫'
  ];

  // Sample receipt mock images
  const SAMPLE_RECEIPTS = [
    {
      label: 'Coffee Shop Receipt',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" fill="%231e293b"><rect width="300" height="400" fill="%230f172a" rx="16"/><text x="150" y="40" fill="%2310b981" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="middle">Pho Saigon Cafe</text><text x="150" y="65" fill="%2394a3b8" font-size="12" font-family="sans-serif" text-anchor="middle">123 Market St, San Francisco</text><line x1="20" y1="85" x2="280" y2="85" stroke="%23334155" stroke-dasharray="4"/><text x="30" y="120" fill="%23e2e8f0" font-size="14" font-family="sans-serif">Special Beef Pho</text><text x="270" y="120" fill="%23e2e8f0" font-size="14" font-family="sans-serif" text-anchor="end">$18.50</text><text x="30" y="150" fill="%23e2e8f0" font-size="14" font-family="sans-serif">Vietnamese Iced Coffee</text><text x="270" y="150" fill="%23e2e8f0" font-size="14" font-family="sans-serif" text-anchor="end">$6.50</text><text x="30" y="180" fill="%23e2e8f0" font-size="14" font-family="sans-serif">Fresh Spring Rolls (2pcs)</text><text x="270" y="180" fill="%23e2e8f0" font-size="14" font-family="sans-serif" text-anchor="end">$9.00</text><line x1="20" y1="210" x2="280" y2="210" stroke="%23334155"/><text x="30" y="240" fill="%2394a3b8" font-size="14" font-family="sans-serif">Tax (8.5%)</text><text x="270" y="240" fill="%2394a3b8" font-size="14" font-family="sans-serif" text-anchor="end">$2.89</text><text x="30" y="280" fill="%2310b981" font-size="18" font-family="sans-serif" font-weight="bold">TOTAL</text><text x="270" y="280" fill="%2310b981" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="end">$36.89</text><text x="150" y="340" fill="%2364748b" font-size="12" font-family="sans-serif" text-anchor="middle">Payment: Visa ending in 4092</text></svg>',
      prompt: 'Receipt from Pho Saigon Cafe totaling $36.89 for lunch'
    },
    {
      label: 'AWS Cloud Invoice',
      image: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400" fill="%231e293b"><rect width="300" height="400" fill="%230f172a" rx="16"/><text x="30" y="45" fill="%2338bdf8" font-size="18" font-family="sans-serif" font-weight="bold">AWS Cloud Services</text><text x="270" y="45" fill="%2394a3b8" font-size="12" font-family="sans-serif" text-anchor="end">INV-99214</text><text x="30" y="75" fill="%2394a3b8" font-size="12" font-family="sans-serif">Date: Aug 05, 2026</text><line x1="20" y1="95" x2="280" y2="95" stroke="%23334155"/><text x="30" y="130" fill="%23e2e8f0" font-size="14" font-family="sans-serif">EC2 Cloud Instances</text><text x="270" y="130" fill="%23e2e8f0" font-size="14" font-family="sans-serif" text-anchor="end">$110.00</text><text x="30" y="160" fill="%23e2e8f0" font-size="14" font-family="sans-serif">RDS PostgreSQL Database</text><text x="270" y="160" fill="%23e2e8f0" font-size="14" font-family="sans-serif" text-anchor="end">$35.00</text><line x1="20" y1="200" x2="280" y2="200" stroke="%23334155"/><text x="30" y="240" fill="%2338bdf8" font-size="18" font-family="sans-serif" font-weight="bold">AMOUNT DUE</text><text x="270" y="240" fill="%2338bdf8" font-size="18" font-family="sans-serif" font-weight="bold" text-anchor="end">$145.00</text><text x="30" y="320" fill="%2310b981" font-size="12" font-family="sans-serif">Status: Paid via Auto-debit</text></svg>',
      prompt: 'AWS Cloud Services monthly invoice $145 for EC2 and PostgreSQL'
    }
  ];

  // File Upload Handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImageMime(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage(result);
      const base64Data = result.split(',')[1] || result;
      triggerParse({ base64Image: base64Data, mimeType: file.type || 'image/png' });
    };
    reader.readAsDataURL(file);
  };

  // Direct Manual Insert Handler
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amountNum = parseMoneyInput(manualAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    const finalMerchant = manualMerchant.trim() || (manualType === 'expense' ? 'General Expense' : 'General Income');
    const finalCategory = isCreatingCustomCat && customCategoryText.trim()
      ? customCategoryText.trim()
      : manualCategory;

    onAddTransaction({
      amount: amountNum,
      currency: currency,
      merchant: finalMerchant,
      category: finalCategory,
      date: manualDate || new Date().toISOString().split('T')[0],
      type: manualType,
      accountType: manualAccountType,
      invoiceStatus: 'none',
      notes: manualNotes,
      isSubscription: manualIsSubscription,
      tags: ['ManualEntry'],
      rawLogSource: 'manual',
    });

    onClose();
  };

  // Main Parse trigger calling Server Endpoint
  const triggerParse = async (params: {
    textPrompt?: string;
    base64Image?: string;
    mimeType?: string;
  }) => {
    setIsProcessing(true);
    setErrorMsg(null);
    setExtractedTx(null);

    try {
      const res = await fetch('/api/parse-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          defaultCurrency: currency,
          defaultAccountType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to extract transaction details.');
      }

      setExtractedTx({
        ...data.transaction,
        currency: data.transaction.currency || currency,
        accountType: data.transaction.accountType || defaultAccountType,
        type: data.transaction.type || 'expense',
        date: data.transaction.date || new Date().toISOString().split('T')[0],
        rawLogSource: activeTab,
      });
    } catch (err: any) {
      console.error('Parse error:', err);
      setErrorMsg(err.message || 'Error processing AI extraction.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmAdd = () => {
    if (!extractedTx || !extractedTx.amount || !extractedTx.merchant) return;

    onAddTransaction({
      amount: Number(extractedTx.amount),
      currency: (extractedTx.currency as CurrencyCode) || currency,
      merchant: extractedTx.merchant || 'General Expense',
      category: extractedTx.category || 'Food & Dining',
      date: extractedTx.date || new Date().toISOString().split('T')[0],
      type: (extractedTx.type as 'expense' | 'income') || 'expense',
      accountType: (extractedTx.accountType as AccountType) || defaultAccountType,
      invoiceStatus: extractedTx.invoiceStatus || 'none',
      invoiceNumber: extractedTx.invoiceNumber || '',
      clientName: extractedTx.clientName || '',
      notes: extractedTx.notes || '',
      isSubscription: !!extractedTx.isSubscription,
      tags: extractedTx.tags || ['SmartVaultAI'],
      rawLogSource: extractedTx.rawLogSource || activeTab,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Log Financial Transaction</h3>
              <p className="text-xs text-slate-400">Log manually, via AI natural language, or receipt scan</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Mode Tabs */}
        <div className="grid grid-cols-3 p-2 bg-slate-950/80 gap-2 border-b border-slate-800">
          <button
            onClick={() => {
              setActiveTab('manual');
              setExtractedTx(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'manual'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Manual Log</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('text');
              setExtractedTx(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'text'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <TypeIcon className="w-4 h-4" />
            <span>AI Prompt</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('receipt');
              setExtractedTx(null);
            }}
            className={`py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'receipt'
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Receipt Photo</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 space-y-4">

          {/* TAB 1: MANUAL ENTRY FORM */}
          {activeTab === 'manual' && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              
              {/* Type Switcher & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Transaction Type</label>
                  <div className="grid grid-cols-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                    <button
                      type="button"
                      onClick={() => setManualType('expense')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        manualType === 'expense'
                          ? 'bg-rose-500 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Expense (-)
                    </button>
                    <button
                      type="button"
                      onClick={() => setManualType('income')}
                      className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                        manualType === 'income'
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
                    Amount ({currencySymbol}) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                      {currencySymbol}
                    </span>
                    <input
                      type="text"
                      placeholder="0.00"
                      value={manualAmount}
                      onChange={(e) => setManualAmount(formatMoneyInput(e.target.value))}
                      required
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-white font-bold font-mono text-sm placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Merchant / Description */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">
                  Merchant / Payee / Client <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Whole Foods, Starbucks, Client Acme, AWS"
                  value={manualMerchant}
                  onChange={(e) => setManualMerchant(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Scope */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-slate-300 block">Category</label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsManagingCategories(!isManagingCategories)}
                        className={`text-[10px] font-medium flex items-center gap-1 transition ${
                          isManagingCategories ? 'text-amber-400 underline' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        <Settings className="w-3 h-3" />
                        <span>{isManagingCategories ? 'Close Manage' : 'Manage / Remove'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreatingCustomCat(!isCreatingCustomCat);
                          setCustomCategoryText('');
                        }}
                        className="text-[10px] text-emerald-400 hover:underline font-semibold"
                      >
                        {isCreatingCustomCat ? 'Select existing' : '+ Custom'}
                      </button>
                    </div>
                  </div>

                  {isManagingCategories ? (
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-2 max-h-48 overflow-y-auto">
                      <div className="text-[11px] text-slate-400 flex items-center justify-between border-b border-slate-800 pb-1.5">
                        <span>Remove category:</span>
                        {onOpenCategoryManager && (
                          <button
                            type="button"
                            onClick={() => onOpenCategoryManager('expense')}
                            className="text-emerald-400 text-[10px] hover:underline"
                          >
                            Open Full Manager &rarr;
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {DEFAULT_CATEGORIES.map((cat) => (
                          <div
                            key={cat}
                            className="px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-slate-200 flex items-center gap-1.5"
                          >
                            <span>{cat}</span>
                            {onRemoveExpenseCategory && (
                              <button
                                type="button"
                                onClick={() => onRemoveExpenseCategory(cat)}
                                className="text-slate-500 hover:text-rose-400 transition p-0.5"
                                title={`Remove "${cat}" category`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : isCreatingCustomCat ? (
                    <input
                      type="text"
                      placeholder="Type custom category name..."
                      value={customCategoryText}
                      onChange={(e) => setCustomCategoryText(e.target.value)}
                      className="w-full bg-slate-950 border border-emerald-500/50 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <select
                      value={manualCategory}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCreatingCustomCat(true);
                          setCustomCategoryText('');
                        } else {
                          setManualCategory(e.target.value);
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
                    value={manualAccountType}
                    onChange={(e) => setManualAccountType(e.target.value as AccountType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="personal">Personal Expenses</option>
                    <option value="business">Business / Freelance</option>
                  </select>
                </div>
              </div>

              {/* Date & Recurring Checkbox */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="text-xs font-medium text-slate-300 block mb-1">Date</label>
                  <input
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="pt-4 sm:pt-6 flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="manualSubscription"
                    checked={manualIsSubscription}
                    onChange={(e) => setManualIsSubscription(e.target.checked)}
                    className="w-4 h-4 rounded accent-emerald-500 cursor-pointer"
                  />
                  <label htmlFor="manualSubscription" className="text-xs text-slate-300 font-medium cursor-pointer">
                    Recurring Subscription
                  </label>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-medium text-slate-300 block mb-1">Notes / Description (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Coffee meeting with design team"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all"
              >
                <Check className="w-4 h-4" />
                <span>Save Expense to Vault</span>
              </button>
            </form>
          )}
          
          {/* TAB 2: AI TEXT PROMPT */}
          {activeTab === 'text' && (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-300">
                Describe your expense or income in natural language:
              </label>
              <textarea
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder='e.g. "Spent 45k on pho and iced coffee" or "Invoiced $2,800 to DesignSprint Inc for UI audit"'
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {/* Sample Prompts */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
                  Try a quick example:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {TEXT_SAMPLES.map((sample, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTextInput(sample);
                        triggerParse({ textPrompt: sample });
                      }}
                      className="text-[11px] bg-slate-800/80 hover:bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/60 transition-colors text-left"
                    >
                      {sample}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => triggerParse({ textPrompt: textInput })}
                disabled={!textInput.trim() || isProcessing}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 transition-all"
              >
                {isProcessing ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Gemini Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Parse with Gemini AI</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* TAB 3: RECEIPT PHOTO */}
          {activeTab === 'receipt' && (
            <div className="space-y-4">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />

              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-800 hover:border-emerald-500/50 bg-slate-950/60 rounded-xl p-6 text-center cursor-pointer transition-colors group"
              >
                <Upload className="w-8 h-8 text-slate-500 group-hover:text-emerald-400 mx-auto mb-2 transition-colors" />
                <p className="text-xs font-semibold text-slate-300">
                  Click to upload or drag & drop receipt photo
                </p>
                <p className="text-[11px] text-slate-500 mt-1">PNG, JPG, WEBP up to 10MB</p>
              </div>

              {/* Sample Receipts */}
              <div>
                <span className="text-[11px] text-slate-400 font-medium block mb-2">
                  Or test with sample receipt:
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {SAMPLE_RECEIPTS.map((rcpt, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setSelectedImage(rcpt.image);
                        triggerParse({ textPrompt: rcpt.prompt });
                      }}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-left transition-colors flex items-center gap-2.5"
                    >
                      <FileText className="w-5 h-5 text-emerald-400 shrink-0" />
                      <div>
                        <span className="text-xs font-semibold text-slate-200 block">{rcpt.label}</span>
                        <span className="text-[10px] text-slate-400">Click to extract</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* EXTRACTED PREVIEW CARD (For AI Prompt & Receipt Scan) */}
          {extractedTx && (
            <div className="bg-slate-950 border border-emerald-500/30 rounded-2xl p-4 space-y-3 animate-fade-in shadow-xl shadow-emerald-500/5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400">
                    Gemini AI Extraction Preview
                  </span>
                </div>
                {extractedTx.confidenceScore && (
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/20 font-mono">
                    {Math.round(extractedTx.confidenceScore * 100)}% Confidence
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-500 block">Amount</label>
                  <input
                    type="text"
                    value={formatMoneyInput(extractedTx.amount || '')}
                    onChange={(e) =>
                      setExtractedTx({ ...extractedTx, amount: parseMoneyInput(e.target.value) })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-bold font-mono text-white text-sm"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-500 block">Merchant / Source</label>
                  <input
                    type="text"
                    value={extractedTx.merchant || ''}
                    onChange={(e) =>
                      setExtractedTx({ ...extractedTx, merchant: e.target.value })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-medium text-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] text-slate-500 block">Category</label>
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
                      placeholder="Type custom category (e.g. Market, Food & Drink)..."
                      value={customCategoryText}
                      onChange={(e) => {
                        setCustomCategoryText(e.target.value);
                        setExtractedTx({ ...extractedTx, category: e.target.value });
                      }}
                      className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg px-2.5 py-1.5 font-medium text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    />
                  ) : (
                    <select
                      value={extractedTx.category || 'Food & Drink'}
                      onChange={(e) => {
                        if (e.target.value === '__CUSTOM__') {
                          setIsCreatingCustomCat(true);
                          setCustomCategoryText('');
                        } else {
                          setExtractedTx({ ...extractedTx, category: e.target.value });
                        }
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-medium text-white"
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
                  <label className="text-[10px] text-slate-500 block">Account / Scope</label>
                  <select
                    value={extractedTx.accountType || defaultAccountType}
                    onChange={(e) =>
                      setExtractedTx({
                        ...extractedTx,
                        accountType: e.target.value as AccountType,
                      })
                    }
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 font-medium text-white"
                  >
                    <option value="personal">Personal Expenses</option>
                    <option value="business">Business / Freelance</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-[10px] text-slate-500 block">Notes & Details</label>
                <input
                  type="text"
                  value={extractedTx.notes || ''}
                  onChange={(e) => setExtractedTx({ ...extractedTx, notes: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => setExtractedTx(null)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Discard
                </button>
                <button
                  onClick={handleConfirmAdd}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm & Save to Vault</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

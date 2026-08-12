import React, { useState } from 'react';
import { CategoryBudget, CurrencyCode } from '../types';
import { formatMoneyInput, parseMoneyInput } from '../utils/formatters';
import { X, Plus, Trash2, Tag, ShieldAlert, Check, Layers, Settings, RefreshCw } from 'lucide-react';

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  expenseCategories: string[];
  onAddExpenseCategory: (category: string) => Promise<void>;
  onRemoveExpenseCategory: (category: string) => Promise<void>;
  budgetCaps: CategoryBudget[];
  onSaveBudgetCaps: (caps: CategoryBudget[]) => Promise<void>;
  onRemoveBudgetCap: (category: string) => Promise<void>;
  currency: CurrencyCode;
  initialTab?: 'expense' | 'budget';
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  expenseCategories,
  onAddExpenseCategory,
  onRemoveExpenseCategory,
  budgetCaps,
  onSaveBudgetCaps,
  onRemoveBudgetCap,
  currency,
  initialTab = 'expense',
}) => {
  const [activeTab, setActiveTab] = useState<'expense' | 'budget'>(initialTab);

  // Expense Category State
  const [newExpenseCat, setNewExpenseCat] = useState('');
  const [isAddingExpenseCat, setIsAddingExpenseCat] = useState(false);

  // Budget Category State
  const [caps, setCaps] = useState<CategoryBudget[]>(budgetCaps);
  const [newBudgetCat, setNewBudgetCat] = useState('');
  const [newBudgetLimit, setNewBudgetLimit] = useState('');

  // Sync state when opened or props update
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  React.useEffect(() => {
    setCaps(budgetCaps);
  }, [budgetCaps]);

  if (!isOpen) return null;

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Handle Expense Category Actions
  const handleAddExpenseCategorySubmit = async () => {
    if (!newExpenseCat.trim()) return;
    setIsAddingExpenseCat(true);
    try {
      await onAddExpenseCategory(newExpenseCat.trim());
      setNewExpenseCat('');
    } catch (err) {
      console.error('Error adding category:', err);
    } finally {
      setIsAddingExpenseCat(false);
    }
  };

  const handleRemoveExpenseCategorySubmit = async (category: string) => {
    try {
      await onRemoveExpenseCategory(category);
    } catch (err) {
      console.error('Error removing category:', err);
    }
  };

  // Handle Budget Category Actions
  const handleUpdateBudgetLimit = (category: string, newLim: number) => {
    const updated = caps.map((c) => (c.category === category ? { ...c, limit: Math.max(0, newLim) } : c));
    setCaps(updated);
  };

  const handleRemoveBudgetCapSubmit = async (category: string) => {
    try {
      setCaps(caps.filter((c) => c.category !== category));
      await onRemoveBudgetCap(category);
    } catch (err) {
      console.error('Error removing budget cap:', err);
    }
  };

  const handleAddBudgetCapSubmit = () => {
    const limitNum = parseMoneyInput(newBudgetLimit);
    if (!newBudgetCat.trim() || limitNum <= 0) return;
    const updated = [
      ...caps,
      {
        category: newBudgetCat.trim(),
        limit: limitNum,
        color: '#10b981',
        icon: 'Tag',
      },
    ];
    setCaps(updated);
    onSaveBudgetCaps(updated);
    setNewBudgetCat('');
    setNewBudgetLimit('');
  };

  const handleSaveAllBudgets = async () => {
    await onSaveBudgetCaps(caps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden my-8 text-slate-100">
        
        {/* Modal Header */}
        <div className="px-4 sm:px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Category Settings Manager</h3>
              <p className="text-xs text-slate-400">Manage & manually remove active categories</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 pt-4 border-b border-slate-800 flex items-center gap-2 bg-slate-950/30 overflow-x-auto">
          <button
            onClick={() => setActiveTab('expense')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'expense'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Log Expense Categories ({expenseCategories.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('budget')}
            className={`px-3 sm:px-4 py-2.5 text-xs font-semibold rounded-t-xl border-b-2 flex items-center gap-2 transition-all whitespace-nowrap shrink-0 ${
              activeTab === 'budget'
                ? 'border-emerald-400 text-emerald-400 bg-slate-900'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Monthly Budget Caps ({caps.length})</span>
          </button>
        </div>

        {/* Tab 1: Log Expense Categories */}
        {activeTab === 'expense' && (
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Remove default or custom expense categories you don&apos;t use. Changes are saved directly to your settings and updated across all input forms.
            </p>

            {/* Category List */}
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {expenseCategories.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No expense categories active. Add one below!
                </div>
              ) : (
                expenseCategories.map((cat) => (
                  <div
                    key={cat}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="font-semibold text-white text-xs sm:text-sm">{cat}</span>
                    </div>

                    <button
                      onClick={() => handleRemoveExpenseCategorySubmit(cat)}
                      className="px-2.5 py-1 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg flex items-center gap-1.5 transition border border-transparent hover:border-rose-500/20"
                      title={`Remove category "${cat}"`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Add New Expense Category */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Add New Expense Category</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Software Subscriptions, Pet Care"
                  value={newExpenseCat}
                  onChange={(e) => setNewExpenseCat(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddExpenseCategorySubmit()}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddExpenseCategorySubmit}
                  disabled={isAddingExpenseCat || !newExpenseCat.trim()}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Category</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Monthly Budget Caps */}
        {activeTab === 'budget' && (
          <div className="p-4 sm:p-6 space-y-4">
            <p className="text-xs text-slate-400 leading-relaxed">
              Manage category budget limits or manually delete budget caps you don&apos;t need. Deletions are immediately removed.
            </p>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {caps.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No budget caps set. Add a new budget cap below!
                </div>
              ) : (
                caps.map((cap) => (
                  <div
                    key={cap.category}
                    className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
                  >
                    <div className="font-semibold text-white text-xs sm:text-sm">{cap.category}</div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 font-mono">{symbol}</span>
                      <input
                        type="text"
                        value={formatMoneyInput(cap.limit)}
                        onChange={(e) => handleUpdateBudgetLimit(cap.category, parseMoneyInput(e.target.value))}
                        className="w-24 sm:w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <button
                        onClick={() => handleRemoveBudgetCapSubmit(cap.category)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                        title={`Remove budget cap "${cap.category}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add New Budget Category Cap Form */}
            <div className="pt-3 border-t border-slate-800 space-y-2">
              <label className="text-xs font-semibold text-slate-300 block">Add New Budget Cap</label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <input
                  type="text"
                  placeholder="Category name (e.g. Dining Out)"
                  value={newBudgetCat}
                  onChange={(e) => setNewBudgetCat(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <input
                  type="text"
                  placeholder={`Limit (${symbol})`}
                  value={newBudgetLimit}
                  onChange={(e) => setNewBudgetLimit(formatMoneyInput(e.target.value))}
                  className="w-full sm:w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  onClick={handleAddBudgetCapSubmit}
                  className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition flex items-center justify-center"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="px-4 sm:px-6 py-4 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Database Synced</span>
          </div>
          <button
            onClick={handleSaveAllBudgets}
            className="px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>

      </div>
    </div>
  );
};

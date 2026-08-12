import React, { useState } from 'react';
import { CategoryBudget, CurrencyCode } from '../types';
import { formatMoneyInput, parseMoneyInput } from '../utils/formatters';
import { X, Plus, Trash2, Check, ShieldAlert } from 'lucide-react';

interface BudgetCapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetCaps: CategoryBudget[];
  onSaveBudgetCaps: (caps: CategoryBudget[]) => void;
  currency: CurrencyCode;
}

export const BudgetCapsModal: React.FC<BudgetCapsModalProps> = ({
  isOpen,
  onClose,
  budgetCaps,
  onSaveBudgetCaps,
  currency,
}) => {
  const [caps, setCaps] = useState<CategoryBudget[]>(budgetCaps);
  const [newCat, setNewCat] = useState('');
  const [newLimit, setNewLimit] = useState('');

  if (!isOpen) return null;

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  const handleUpdateLimit = (category: string, newLim: number) => {
    setCaps(
      caps.map((c) => (c.category === category ? { ...c, limit: Math.max(0, newLim) } : c))
    );
  };

  const handleDeleteCap = (category: string) => {
    setCaps(caps.filter((c) => c.category !== category));
  };

  const handleAddCap = () => {
    const limitNum = parseMoneyInput(newLimit);
    if (!newCat.trim() || limitNum <= 0) return;
    setCaps([
      ...caps,
      {
        category: newCat.trim(),
        limit: limitNum,
        color: '#10b981',
        icon: 'Tag',
      },
    ]);
    setNewCat('');
    setNewLimit('');
  };

  const handleSave = () => {
    onSaveBudgetCaps(caps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Category Budget Caps</h3>
              <p className="text-xs text-slate-400">Set monthly caps to trigger automated alerts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {caps.map((cap) => (
              <div
                key={cap.category}
                className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
              >
                <div className="font-semibold text-white text-xs sm:text-sm">{cap.category}</div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-mono">{symbol}</span>
                  <input
                    type="text"
                    value={formatMoneyInput(cap.limit)}
                    onChange={(e) => handleUpdateLimit(cap.category, parseMoneyInput(e.target.value))}
                    className="w-28 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-bold font-mono text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    onClick={() => handleDeleteCap(cap.category)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Add New Category Limit Form */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">Add New Category Cap</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Category name (e.g. Travel)"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500"
              />
              <input
                type="text"
                placeholder={`Limit (${symbol})`}
                value={newLimit}
                onChange={(e) => setNewLimit(formatMoneyInput(e.target.value))}
                className="w-32 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white placeholder-slate-500"
              />
              <button
                onClick={handleAddCap}
                className="p-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Save & Close */}
          <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-500/20"
            >
              <Check className="w-4 h-4" />
              <span>Save Budget Caps</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

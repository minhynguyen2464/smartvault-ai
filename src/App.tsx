import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { DashboardOverview } from './components/DashboardOverview';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { TransactionList } from './components/TransactionList';
import { BudgetCapsModal } from './components/BudgetCapsModal';
import { FreelancerInvoiceTracker } from './components/FreelancerInvoiceTracker';
import { SmartInputModal } from './components/SmartInputModal';
import { ExportModal } from './components/ExportModal';
import { EditTransactionModal } from './components/EditTransactionModal';
import { CategoryManagerModal } from './components/CategoryManagerModal';

import {
  Transaction,
  CategoryBudget,
  CurrencyCode
} from './types';

import {
  fetchTransactions,
  fetchBudgetCaps,
  fetchExpenseCategories,
  addExpenseCategoryApi,
  deleteExpenseCategoryApi,
  createTransactionApi,
  updateTransactionApi,
  deleteTransactionApi,
  updateBudgetCapsApi,
  deleteBudgetCapApi,
} from './lib/api';
import { DEFAULT_EXPENSE_CATEGORIES } from './data/initialData';

import { LayoutDashboard, BarChart3, Receipt, ShieldCheck } from 'lucide-react';

export default function App() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgetCaps, setBudgetCaps] = useState<CategoryBudget[]>([]);
  const [expenseCategories, setExpenseCategories] = useState<string[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>('VND');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals
  const [isSmartInputOpen, setIsSmartInputOpen] = useState(false);
  const [isBudgetCapsOpen, setIsBudgetCapsOpen] = useState(false);
  const [isCategoryManagerOpen, setIsCategoryManagerOpen] = useState(false);
  const [categoryManagerTab, setCategoryManagerTab] = useState<'expense' | 'budget'>('expense');
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleOpenCategoryManager = (tab: 'expense' | 'budget' = 'expense') => {
    setCategoryManagerTab(tab);
    setIsCategoryManagerOpen(true);
  };

  // Active Navigation Tab inside App
  const [activeNav, setActiveNav] = useState<'dashboard' | 'analytics' | 'transactions' | 'freelance'>('dashboard');

  // Load Data from Backend API
  const loadInitialData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [txs, caps, cats] = await Promise.all([
        fetchTransactions(),
        fetchBudgetCaps(),
        fetchExpenseCategories(),
      ]);

      setTransactions(txs);
      setBudgetCaps(caps);
      setExpenseCategories(cats);
    } catch (err) {
      console.error('Failed to load data from backend:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Active expense categories list driven by expenseCategories state
  const activeExpenseCategories =
    expenseCategories.length > 0
      ? expenseCategories
      : DEFAULT_EXPENSE_CATEGORIES;

  // Handlers for Categories
  const handleAddExpenseCategory = async (category: string) => {
    try {
      const updated = await addExpenseCategoryApi(category);
      setExpenseCategories(updated);
    } catch (err) {
      console.error('Error adding expense category:', err);
    }
  };

  const handleRemoveExpenseCategory = async (category: string) => {
    try {
      const updated = await deleteExpenseCategoryApi(category);
      setExpenseCategories(updated);

      // Clean up matching budget cap if one exists for this category so it doesn't persist stale caps
      if (budgetCaps.some((b) => b.category.toLowerCase() === category.toLowerCase())) {
        const updatedCaps = await deleteBudgetCapApi(category);
        setBudgetCaps(updatedCaps);
      }
    } catch (err) {
      console.error('Error removing expense category:', err);
    }
  };

  const handleRemoveBudgetCap = async (category: string) => {
    try {
      const updated = await deleteBudgetCapApi(category);
      setBudgetCaps(updated);
    } catch (err) {
      console.error('Error removing budget cap:', err);
    }
  };

  // Handlers for Transactions (API persistence)
  const handleAddTransaction = async (newTx: Omit<Transaction, 'id'>) => {
    const tempId = `tx-${Date.now()}`;
    const txToSave: Transaction = { ...newTx, id: tempId };

    // Optimistic UI update
    setTransactions((prev) => [txToSave, ...prev]);

    try {
      const saved = await createTransactionApi(txToSave);
      setTransactions((prev) => prev.map((t) => (t.id === tempId ? saved : t)));
    } catch (err) {
      console.error('Error saving transaction to API:', err);
    }

    // Save new category to expenseCategories if it's a custom category not yet in the list
    if (newTx.category && !expenseCategories.some((c) => c.toLowerCase() === newTx.category.toLowerCase())) {
      handleAddExpenseCategory(newTx.category);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    try {
      await deleteTransactionApi(id);
    } catch (err) {
      console.error('Error deleting transaction from API:', err);
    }
  };

  const handleSaveTransaction = async (updatedTx: Transaction) => {
    setTransactions((prev) =>
      prev.map((t) => (t.id === updatedTx.id ? updatedTx : t))
    );

    try {
      await updateTransactionApi(updatedTx);
    } catch (err) {
      console.error('Error updating transaction in API:', err);
    }

    // Automatically ensure budget cap tracking entry exists if updated category is new
    if (
      updatedTx.category &&
      !budgetCaps.some((b) => b.category.toLowerCase() === updatedTx.category.toLowerCase())
    ) {
      const updatedCaps = [
        ...budgetCaps,
        {
          category: updatedTx.category,
          limit: 3000000,
          color: '#10b981',
          icon: 'Tag',
        },
      ];
      setBudgetCaps(updatedCaps);
      updateBudgetCapsApi(updatedCaps).catch((e) => console.error(e));
    }
  };

  const handleUpdateInvoiceStatus = async (id: string, status: 'paid' | 'pending') => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;

    const updated = { ...target, invoiceStatus: status };
    setTransactions((prev) => prev.map((t) => (t.id === id ? updated : t)));

    try {
      await updateTransactionApi(updated);
    } catch (err) {
      console.error('Error updating invoice status:', err);
    }
  };

  const handleSaveBudgetCaps = async (updatedCaps: CategoryBudget[]) => {
    setBudgetCaps(updatedCaps);
    try {
      await updateBudgetCapsApi(updatedCaps);
    } catch (err) {
      console.error('Error updating budget caps:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Top Navigation Bar */}
      <Navbar
        onOpenSmartInput={() => setIsSmartInputOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-6 sm:space-y-8">
        
        {/* Workspace Studio Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-slate-800 rounded-2xl p-4 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-xl">
          <div className="space-y-1.5 sm:space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] sm:text-xs font-bold px-2.5 py-0.5 sm:py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Workspace
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-extrabold text-white tracking-tight">
              SmartVault AI — Personal & Freelancer Financial Studio
            </h1>
            <p className="text-xs text-slate-400 max-w-3xl">
              Multimodal AI expense tracking, custom categories, automated tax reserve estimation, client invoice tracking, and budget alerts.
            </p>
          </div>

          {/* Nav Quick Tabs - Horizontally Scrollable on Mobile */}
          <div className="w-full lg:w-auto overflow-x-auto no-scrollbar scrollbar-none flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveNav('dashboard')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                activeNav === 'dashboard'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Overview</span>
            </button>
            <button
              onClick={() => setActiveNav('analytics')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                activeNav === 'analytics'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Analytics</span>
            </button>
            <button
              onClick={() => setActiveNav('transactions')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                activeNav === 'transactions'
                  ? 'bg-emerald-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Ledger</span>
            </button>
            <button
              onClick={() => setActiveNav('freelance')}
              className={`px-3 py-2 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all whitespace-nowrap shrink-0 ${
                activeNav === 'freelance'
                  ? 'bg-teal-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Invoices & Tax</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="py-20 text-center space-y-3">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs text-slate-400">Syncing database and loading financial records...</p>
          </div>
        ) : (
          <>
            {/* Main View Sections based on Active Nav */}
            {activeNav === 'dashboard' && (
              <div className="space-y-8">
                <DashboardOverview
                  transactions={transactions}
                  budgetCaps={budgetCaps}
                  currency={currency}
                  onOpenSmartInput={() => setIsSmartInputOpen(true)}
                  onOpenBudgetCapsModal={() => setIsBudgetCapsOpen(true)}
                  onOpenCategoryManager={handleOpenCategoryManager}
                  onRemoveBudgetCap={handleRemoveBudgetCap}
                  onOpenExportModal={() => setIsExportOpen(true)}
                />

                <AnalyticsCharts
                  transactions={transactions}
                  currency={currency}
                  onOpenSmartInput={() => setIsSmartInputOpen(true)}
                />
              </div>
            )}

            {activeNav === 'analytics' && (
              <div className="space-y-8">
                <AnalyticsCharts
                  transactions={transactions}
                  currency={currency}
                  onOpenSmartInput={() => setIsSmartInputOpen(true)}
                />
              </div>
            )}

            {activeNav === 'transactions' && (
              <TransactionList
                transactions={transactions}
                onDeleteTransaction={handleDeleteTransaction}
                onEditTransaction={(tx) => setEditingTx(tx)}
                currency={currency}
                onOpenSmartInput={() => setIsSmartInputOpen(true)}
                onOpenExportModal={() => setIsExportOpen(true)}
              />
            )}

            {activeNav === 'freelance' && (
              <FreelancerInvoiceTracker
                transactions={transactions}
                onUpdateInvoiceStatus={handleUpdateInvoiceStatus}
                currency={currency}
                onOpenSmartInput={() => setIsSmartInputOpen(true)}
              />
            )}
          </>
        )}

      </main>

      {/* Modals */}
      <SmartInputModal
        isOpen={isSmartInputOpen}
        onClose={() => setIsSmartInputOpen(false)}
        onAddTransaction={handleAddTransaction}
        currency={currency}
        customCategories={activeExpenseCategories}
        onOpenCategoryManager={handleOpenCategoryManager}
        onRemoveExpenseCategory={handleRemoveExpenseCategory}
      />

      <CategoryManagerModal
        isOpen={isCategoryManagerOpen}
        onClose={() => setIsCategoryManagerOpen(false)}
        expenseCategories={expenseCategories}
        onAddExpenseCategory={handleAddExpenseCategory}
        onRemoveExpenseCategory={handleRemoveExpenseCategory}
        budgetCaps={budgetCaps}
        onSaveBudgetCaps={handleSaveBudgetCaps}
        onRemoveBudgetCap={handleRemoveBudgetCap}
        currency={currency}
        initialTab={categoryManagerTab}
      />

      <BudgetCapsModal
        isOpen={isBudgetCapsOpen}
        onClose={() => setIsBudgetCapsOpen(false)}
        budgetCaps={budgetCaps}
        onSaveBudgetCaps={handleSaveBudgetCaps}
        currency={currency}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        transactions={transactions}
        currency={currency}
      />

      <EditTransactionModal
        isOpen={!!editingTx}
        onClose={() => setEditingTx(null)}
        transaction={editingTx}
        onSaveTransaction={handleSaveTransaction}
        onDeleteTransaction={handleDeleteTransaction}
        currency={currency}
        customCategories={activeExpenseCategories}
      />

      {/* Footer */}
      <footer className="border-t border-slate-900 mt-16 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 SmartVault AI. Multimodal Personal & Freelancer Finance System.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => setIsSmartInputOpen(true)} className="hover:text-slate-300">
              Log Expense
            </button>
            <span>•</span>
            <button onClick={() => setIsExportOpen(true)} className="hover:text-slate-300">
              Export Tax Report
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

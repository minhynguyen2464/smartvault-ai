import React, { useState } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { X, Download, FileSpreadsheet, FileCode, FileText, Check } from 'lucide-react';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  currency: CurrencyCode;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  currency,
}) => {
  const [downloaded, setDownloaded] = useState<string | null>(null);

  if (!isOpen) return null;

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['ID', 'Date', 'Merchant', 'Category', 'Amount', 'Currency', 'Type', 'Scope', 'Notes'];
    const rows = transactions.map((t) => [
      t.id,
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      `"${t.category.replace(/"/g, '""')}"`,
      t.amount,
      t.currency,
      t.type,
      t.accountType,
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartVault_Transactions_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded('CSV');
    setTimeout(() => setDownloaded(null), 3000);
  };

  // Export JSON Handler
  const handleExportJSON = () => {
    const jsonStr = JSON.stringify(transactions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartVault_Ledger_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded('JSON');
    setTimeout(() => setDownloaded(null), 3000);
  };

  // Export Tax Summary Handler
  const handleExportTaxSummary = () => {
    const businessExpenses = transactions
      .filter((t) => t.accountType === 'business' && t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const businessIncome = transactions
      .filter((t) => t.accountType === 'business' && t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const taxReport = `====================================================
SMARTVAULT AI - FREELANCE & BUSINESS TAX SUMMARY REPORT
Generated Date: ${new Date().toLocaleDateString()}
Currency: ${currency}
====================================================

1. GROSS BUSINESS REVENUE:
   Total Client Inflow: ${symbol}${businessIncome.toLocaleString()}

2. DEDUCTIBLE BUSINESS EXPENSES:
   Total Deductibles (Software, Cloud, Travel, Supplies): ${symbol}${businessExpenses.toLocaleString()}

3. NET TAXABLE BUSINESS INCOME:
   Net Profit: ${symbol}${Math.max(0, businessIncome - businessExpenses).toLocaleString()}

4. ESTIMATED TAX RESERVE (25% Rate):
   Estimated Set-Aside: ${symbol}${Math.round(Math.max(0, businessIncome - businessExpenses) * 0.25).toLocaleString()}

====================================================
ITEMIZED BUSINESS EXPENSES:
${transactions
  .filter((t) => t.accountType === 'business' && t.type === 'expense')
  .map((t) => `- [${t.date}] ${t.merchant} (${t.category}): ${symbol}${t.amount} -- ${t.notes || 'N/A'}`)
  .join('\n')}
====================================================`;

    const blob = new Blob([taxReport], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `SmartVault_TaxReport_${new Date().toISOString().split('T')[0]}.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setDownloaded('Tax Report');
    setTimeout(() => setDownloaded(null), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <h3 className="font-bold text-white text-base">Export & Report Generator</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-3">
          <p className="text-xs text-slate-400 mb-2">
            Download your ledger records for accounting, tax filing, or custom backup.
          </p>

          <button
            onClick={handleExportCSV}
            className="w-full p-3.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
              <div>
                <span className="font-bold text-white text-xs block">Spreadsheet CSV</span>
                <span className="text-[10px] text-slate-400">Excel / Google Sheets compatible</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-emerald-400" />
          </button>

          <button
            onClick={handleExportJSON}
            className="w-full p-3.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <FileCode className="w-5 h-5 text-teal-400" />
              <div>
                <span className="font-bold text-white text-xs block">Structured JSON</span>
                <span className="text-[10px] text-slate-400">Full database dump for developers</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-teal-400" />
          </button>

          <button
            onClick={handleExportTaxSummary}
            className="w-full p-3.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/50 rounded-xl text-left transition-colors flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <div>
                <span className="font-bold text-white text-xs block">Freelancer Tax Summary Report</span>
                <span className="text-[10px] text-slate-400">Itemized deductions & tax set-aside calculations</span>
              </div>
            </div>
            <Download className="w-4 h-4 text-slate-500 group-hover:text-amber-400" />
          </button>

          {downloaded && (
            <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl flex items-center justify-center gap-2 mt-2 font-semibold">
              <Check className="w-4 h-4" />
              <span>Downloaded {downloaded} successfully!</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Transaction, CurrencyCode } from '../types';
import { CalendarView } from './CalendarView';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';
import { TrendingUp, PieChart as PieIcon, BarChart3, Tag, Calendar as CalendarIcon, ChevronDown, RotateCcw } from 'lucide-react';

interface AnalyticsChartsProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onOpenSmartInput?: () => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  transactions,
  currency,
  onOpenSmartInput,
}) => {
  const [activeTab, setActiveTab] = useState<'cashflow' | 'category' | 'calendar'>('cashflow');

  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Current YYYY-MM
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  // Find all available months in transactions
  const availableMonthsSet = new Set<string>();
  availableMonthsSet.add(currentMonthKey);
  transactions.forEach((tx) => {
    if (tx.date && tx.date.length >= 7) {
      availableMonthsSet.add(tx.date.slice(0, 7));
    }
  });

  const availableMonths = Array.from(availableMonthsSet).sort().reverse();
  const [selectedCategoryMonth, setSelectedCategoryMonth] = useState<string>(currentMonthKey);

  // 1. Group transactions by date for 7-Day Cash Flow trend
  const dateMap: Record<string, { date: string; income: number; expense: number }> = {};
  
  // Sort dates ascending
  const sortedTx = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  sortedTx.forEach((tx) => {
    if (!dateMap[tx.date]) {
      dateMap[tx.date] = { date: tx.date, income: 0, expense: 0 };
    }
    if (tx.type === 'income') {
      dateMap[tx.date].income += tx.amount;
    } else {
      dateMap[tx.date].expense += tx.amount;
    }
  });

  const fullCashFlowData = Object.values(dateMap);
  // Default to 7-day cash flow data
  const sevenDayCashFlowData = fullCashFlowData.slice(-7);

  const sevenDayIncome = sevenDayCashFlowData.reduce((sum, d) => sum + d.income, 0);
  const sevenDayExpense = sevenDayCashFlowData.reduce((sum, d) => sum + d.expense, 0);

  // 2. Invoice Category Data (Reset monthly)
  const categoryMap: Record<string, number> = {};
  transactions
    .filter((t) => t.type === 'expense' && t.date && t.date.startsWith(selectedCategoryMonth))
    .forEach((t) => {
      const cat = t.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + t.amount;
    });

  const CATEGORY_COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6', '#06b6d4', '#f97316', '#14b8a6', '#64748b'
  ];

  // Sorted by value descending
  const categoryData = Object.entries(categoryMap)
    .map(([name, value], index) => ({
      name,
      value,
      color: CATEGORY_COLORS[index % CATEGORY_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  const totalMonthlyExpense = categoryData.reduce((sum, item) => sum + item.value, 0);

  // Prepare category breakdown bar chart data with percentages
  const invoiceCategoryBarData = categoryData.map((item) => ({
    name: item.name,
    amount: item.value,
    percentage: totalMonthlyExpense > 0 ? Math.round((item.value / totalMonthlyExpense) * 100) : 0,
    color: item.color,
  }));

  // Format month key for display
  const formatMonthLabel = (monthKey: string) => {
    const [y, m] = monthKey.split('-');
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    const monthIdx = parseInt(m, 10) - 1;
    return `${monthNames[monthIdx] || m} ${y}`;
  };

  // Custom Recharts Hover Tooltip showing total spent
  const CustomCategoryTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const spent = data.value !== undefined ? data.value : data.amount;
      const pct = data.percentage !== undefined
        ? data.percentage
        : totalMonthlyExpense > 0
        ? Math.round((spent / totalMonthlyExpense) * 100)
        : 0;

      return (
        <div className="bg-slate-950 border border-slate-700 p-3 rounded-xl shadow-2xl font-sans text-xs space-y-1">
          <div className="font-bold text-white flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: data.color || payload[0].fill }}
            />
            <span>{data.name}</span>
          </div>
          <div className="text-emerald-400 font-extrabold font-mono text-sm">
            Total Spent: {symbol}{Number(spent).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400">
            Share of Monthly Budget: <span className="text-white font-bold">{pct}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h3 className="font-bold text-white text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-400" />
            <span>7-Day Cash-Flow Analytics</span>
          </h3>
          <p className="text-xs text-slate-400">Visual breakdown of 7-day cash flow & monthly category expenses</p>
        </div>

        <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('cashflow')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'cashflow'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            7-Day Cash Flow
          </button>
          <button
            onClick={() => setActiveTab('category')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'category'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Category Breakdown
          </button>
          <button
            onClick={() => setActiveTab('calendar')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              activeTab === 'calendar'
                ? 'bg-emerald-500 text-slate-950 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            30-Day Calendar View
          </button>
        </div>
      </div>

      {/* Chart View 1: 7-Day Cash Flow Trends */}
      {activeTab === 'cashflow' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs bg-slate-950 p-3 rounded-xl border border-slate-800">
            <span className="text-slate-300 font-medium">
              Showing cash movement for the last <strong className="text-emerald-400">7 active days</strong>
            </span>
            <div className="flex items-center gap-3 font-mono">
              <span className="text-emerald-400 font-bold">
                7-Day Inflow: +{symbol}{sevenDayIncome.toLocaleString()}
              </span>
              <span className="text-rose-400 font-bold">
                7-Day Outflow: -{symbol}{sevenDayExpense.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sevenDayCashFlowData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={(val) => `${symbol}${val}`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px' }}
                  formatter={(val: any) => [`${symbol}${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Bar dataKey="income" name="7-Day Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="7-Day Expenses" fill="#f43f5e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Chart View 2: Invoice Category Breakdown (Reset Monthly with Hover Totals) */}
      {activeTab === 'category' && (
        <div className="space-y-4">
          
          {/* Monthly Reset Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white">Monthly Category Breakdown</span>
              <span className="text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded-full border border-slate-800">
                Resets every month
              </span>
            </div>

            {/* Month Selector */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-400 font-medium">Select Month:</label>
              <select
                value={selectedCategoryMonth}
                onChange={(e) => setSelectedCategoryMonth(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-emerald-400 font-bold text-xs rounded-xl px-3 py-1.5 cursor-pointer focus:outline-none"
              >
                {availableMonths.map((mKey) => (
                  <option key={mKey} value={mKey}>
                    {formatMonthLabel(mKey)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {categoryData.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Tag className="w-8 h-8 mx-auto text-slate-600" />
              <p className="text-sm font-semibold text-slate-400">No expense categories recorded for {formatMonthLabel(selectedCategoryMonth)}</p>
              <p className="text-xs">Categories reset automatically each month.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
              
              {/* Donut Chart: Invoice Category Share */}
              <div className="h-72 w-full flex flex-col items-center justify-center">
                <h4 className="text-xs font-bold text-slate-300 mb-2 text-center flex items-center gap-1.5">
                  <PieIcon className="w-4 h-4 text-emerald-400" />
                  <span>{formatMonthLabel(selectedCategoryMonth)} Expense Share</span>
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomCategoryTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Right Side: Detailed Invoice Category Ranking & Values */}
              <div className="w-full border-t md:border-t-0 md:border-l border-slate-800 pt-4 md:pt-0 md:pl-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-teal-400" />
                    <span>Invoice Categories</span>
                  </h4>
                  <span className="text-[11px] font-mono font-bold text-emerald-400">
                    Total: {symbol}{totalMonthlyExpense.toLocaleString()}
                  </span>
                </div>

                {/* Horizontal Bar Chart for Invoice Categories */}
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={invoiceCategoryBarData}
                      margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                    >
                      <XAxis type="number" hide />
                      <YAxis
                        dataKey="name"
                        type="category"
                        stroke="#94a3b8"
                        tick={{ fill: '#cbd5e1', fontSize: 11 }}
                        width={110}
                      />
                      <Tooltip content={<CustomCategoryTooltip />} />
                      <Bar dataKey="amount" radius={[0, 6, 6, 0]}>
                        {invoiceCategoryBarData.map((entry, index) => (
                          <Cell key={`cat-bar-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Top Category Badges with Hover showing total money spent */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  {invoiceCategoryBarData.map((cat) => (
                    <div
                      key={cat.name}
                      className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-800/80 transition-all cursor-pointer group relative shadow-sm"
                      title={`Total spent on ${cat.name}: ${symbol}${cat.amount.toLocaleString()}`}
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: cat.color }}
                        />
                        <div className="overflow-hidden flex-1">
                          <span className="text-[11px] font-semibold text-white truncate block group-hover:text-emerald-300">
                            {cat.name}
                          </span>
                          <span className="text-[11px] text-emerald-400 font-bold font-mono block">
                            {symbol}{cat.amount.toLocaleString()} ({cat.percentage}%)
                          </span>
                        </div>
                      </div>

                      {/* Tooltip Popup on Hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-[10px] py-1.5 px-3 rounded-lg border border-slate-700 shadow-2xl pointer-events-none whitespace-nowrap z-20 font-bold">
                        <span className="text-emerald-400">Total spent:</span> {symbol}{cat.amount.toLocaleString()} ({cat.percentage}%)
                      </div>
                    </div>
                  ))}
                </div>

              </div>

            </div>
          )}

        </div>
      )}

      {/* Chart View 3: 30-Day Calendar View */}
      {activeTab === 'calendar' && (
        <CalendarView
          transactions={transactions}
          currency={currency}
          onOpenSmartInput={onOpenSmartInput}
        />
      )}

    </div>
  );
};


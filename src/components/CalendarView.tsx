import React, { useState } from 'react';
import { Transaction, CurrencyCode } from '../types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownRight,
  PlusCircle,
  RotateCcw,
  Clock
} from 'lucide-react';

interface CalendarViewProps {
  transactions: Transaction[];
  currency: CurrencyCode;
  onOpenSmartInput?: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  transactions,
  currency,
  onOpenSmartInput,
}) => {
  const symbolMap: Record<CurrencyCode, string> = {
    USD: '$',
    VND: '₫',
    EUR: '€',
    GBP: '£',
  };
  const symbol = symbolMap[currency] || '₫';

  // Helper for compact number formatting inside small day cells on mobile
  const formatCompact = (amount: number) => {
    if (amount >= 1_000_000) {
      const formatted = (amount / 1_000_000).toFixed(amount % 1_000_000 === 0 ? 0 : 1);
      return `${symbol}${formatted}M`;
    }
    if (amount >= 10_000) {
      const formatted = (amount / 1_000).toFixed(0);
      return `${symbol}${formatted}k`;
    }
    return `${symbol}${amount.toLocaleString()}`;
  };

  const today = new Date();
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed (0=Jan, 11=Dec)

  // Selected date state for viewing daily breakdown
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(
    today.toISOString().split('T')[0]
  );

  const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleResetToToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDateStr(now.toISOString().split('T')[0]);
  };

  interface CalendarDay {
    dateStr: string;
    dayNum: number;
    monthName: string;
    fullLabel: string;
    isToday: boolean;
  }

  // Generate days based on selected month
  const getDaysForCalendar = (): { paddingDays: number; days: CalendarDay[] } => {
    // Full calendar month mode
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const paddingDays = firstDay.getDay(); // 0 = Sunday
    const totalDaysInMonth = lastDay.getDate();

    const todayStr = new Date().toISOString().split('T')[0];

    const days: CalendarDay[] = [];
    for (let day = 1; day <= totalDaysInMonth; day++) {
      const mm = String(currentMonth + 1).padStart(2, '0');
      const dd = String(day).padStart(2, '0');
      const dateStr = `${currentYear}-${mm}-${dd}`;

      const dateObj = new Date(currentYear, currentMonth, day);
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' });

      days.push({
        dateStr,
        dayNum: day,
        monthName,
        fullLabel: `${dayName}, ${monthName} ${day}, ${currentYear}`,
        isToday: dateStr === todayStr,
      });
    }

    return { paddingDays, days };
  };

  const { paddingDays, days: daysList } = getDaysForCalendar();

  // Map transactions by YYYY-MM-DD
  const txByDateMap: Record<
    string,
    { income: number; expense: number; txs: Transaction[] }
  > = {};

  transactions.forEach((tx) => {
    const dateKey = tx.date ? tx.date.split('T')[0] : '';
    if (!dateKey) return;

    if (!txByDateMap[dateKey]) {
      txByDateMap[dateKey] = { income: 0, expense: 0, txs: [] };
    }

    txByDateMap[dateKey].txs.push(tx);
    if (tx.type === 'income') {
      txByDateMap[dateKey].income += tx.amount;
    } else {
      txByDateMap[dateKey].expense += tx.amount;
    }
  });

  // Calculate totals for currently rendered calendar view
  let periodTotalIncome = 0;
  let periodTotalExpense = 0;

  daysList.forEach((day) => {
    const data = txByDateMap[day.dateStr];
    if (data) {
      periodTotalIncome += data.income;
      periodTotalExpense += data.expense;
    }
  });

  // Selected date details
  const selectedDayData = selectedDateStr ? txByDateMap[selectedDateStr] : null;
  const selectedDayLabel =
    daysList.find((d) => d.dateStr === selectedDateStr)?.fullLabel || selectedDateStr;

  // Available year choices for quick selector
  const currentYearNum = new Date().getFullYear();
  const yearOptions = [
    currentYearNum - 2,
    currentYearNum - 1,
    currentYearNum,
    currentYearNum + 1,
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-3.5 sm:p-6 shadow-xl space-y-4 sm:space-y-6">
      
      {/* Header Controls & Month Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 border-b border-slate-800 pb-4 sm:pb-5">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <div className="p-1.5 sm:p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-sm sm:text-base">Spending & Income Calendar</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">Visual monthly cashflow breakdown & daily ledger</p>
            </div>
          </div>
        </div>

        {/* Month Navigation & Reset */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          
          {/* Month & Year Navigation */}
          <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded-xl border border-slate-800">
            <button
              onClick={handlePrevMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>

            {/* Month Dropdown */}
            <select
              value={currentMonth}
              onChange={(e) => setCurrentMonth(Number(e.target.value))}
              className="bg-transparent text-white font-bold text-xs cursor-pointer focus:outline-none pr-0.5"
            >
              {MONTH_NAMES.map((name, idx) => (
                <option key={name} value={idx} className="bg-slate-900 text-white">
                  {name}
                </option>
              ))}
            </select>

            {/* Year Dropdown */}
            <select
              value={currentYear}
              onChange={(e) => setCurrentYear(Number(e.target.value))}
              className="bg-transparent text-emerald-400 font-extrabold text-xs cursor-pointer focus:outline-none"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y} className="bg-slate-900 text-white">
                  {y}
                </option>
              ))}
            </select>

            <button
              onClick={handleNextMonth}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Reset to Today Button */}
          <button
            onClick={handleResetToToday}
            className="px-2.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
            title="Jump to Today"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Monthly Metrics Summary Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 text-xs bg-slate-950/80 p-3 sm:p-3.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-bold text-white text-xs sm:text-sm">
            {MONTH_NAMES[currentMonth]} {currentYear} Summary
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
            <span className="text-slate-400">Inflow:</span>
            <span className="font-extrabold text-emerald-400 font-mono">
              +{symbol}{periodTotalIncome.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs">
            <span className="text-slate-400">Outflow:</span>
            <span className="font-extrabold text-rose-400 font-mono">
              -{symbol}{periodTotalExpense.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px] sm:text-xs sm:border-l sm:border-slate-800 sm:pl-3">
            <span className="text-slate-400">Net:</span>
            <span
              className={`font-extrabold font-mono ${
                periodTotalIncome - periodTotalExpense >= 0
                  ? 'text-emerald-400'
                  : 'text-rose-400'
              }`}
            >
              {periodTotalIncome - periodTotalExpense >= 0 ? '+' : ''}
              {symbol}{(periodTotalIncome - periodTotalExpense).toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {/* Responsive Calendar Grid Wrapper with smooth touch scrolling on mobile */}
      <div className="overflow-x-auto pb-2 -mx-3 px-3 sm:mx-0 sm:px-0 scrollbar-thin">
        <div className="min-w-[560px] sm:min-w-0">
          
          {/* Weekday Labels Header */}
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5 text-center text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider pb-1">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
            
            {/* Blank Padding cells before day 1 */}
            {Array.from({ length: paddingDays }).map((_, idx) => (
              <div
                key={`padding-${idx}`}
                className="p-1.5 sm:p-2.5 rounded-2xl bg-slate-950/20 border border-slate-900/50 opacity-30 min-h-[65px] sm:min-h-[90px]"
              />
            ))}

            {/* Month Day Cells */}
            {daysList.map((day) => {
              const dayData = txByDateMap[day.dateStr];
              const hasIncome = dayData && dayData.income > 0;
              const hasExpense = dayData && dayData.expense > 0;
              const isSelected = selectedDateStr === day.dateStr;

              // Determine cell styling based on activity & selection
              let cellBg = 'bg-slate-950/60 hover:bg-slate-800/60 border-slate-800/80';
              if (isSelected) {
                cellBg = 'bg-slate-800 border-emerald-500 shadow-md shadow-emerald-500/10 ring-1 ring-emerald-500';
              } else if (hasIncome && hasExpense) {
                cellBg = 'bg-slate-950 border-teal-500/30 hover:border-teal-500/60';
              } else if (hasExpense) {
                cellBg = 'bg-slate-950 border-rose-500/20 hover:border-rose-500/50';
              } else if (hasIncome) {
                cellBg = 'bg-slate-950 border-emerald-500/20 hover:border-emerald-500/50';
              }

              return (
                <div
                  key={day.dateStr}
                  onClick={() => setSelectedDateStr(day.dateStr)}
                  className={`p-1.5 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between min-h-[65px] sm:min-h-[90px] relative group ${cellBg}`}
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[10px] sm:text-xs font-bold ${
                        day.isToday
                          ? 'bg-emerald-500 text-slate-950 px-1.5 sm:px-2 py-0.5 rounded-md font-extrabold'
                          : isSelected
                          ? 'text-emerald-400 font-extrabold'
                          : 'text-slate-300'
                      }`}
                    >
                      {day.dayNum}
                    </span>

                    {dayData && dayData.txs.length > 0 && (
                      <span className="text-[9px] sm:text-[10px] bg-slate-800 text-slate-300 font-bold px-1 sm:px-1.5 py-0.2 rounded-full font-mono">
                        {dayData.txs.length}
                      </span>
                    )}
                  </div>

                  {/* Day Amounts */}
                  <div className="mt-1 sm:mt-2 space-y-1 text-[10px] sm:text-[11px] font-mono">
                    {hasIncome && (
                      <div className="text-emerald-400 font-bold flex items-center justify-between bg-emerald-500/10 px-1 sm:px-1.5 py-0.5 rounded-md border border-emerald-500/20 truncate">
                        <span className="text-[9px] text-emerald-300 font-sans">+</span>
                        <span className="truncate text-[10px] sm:text-[11px]">
                          <span className="inline sm:hidden">{formatCompact(dayData.income)}</span>
                          <span className="hidden sm:inline">{symbol}{dayData.income.toLocaleString()}</span>
                        </span>
                      </div>
                    )}

                    {hasExpense && (
                      <div className="text-rose-400 font-bold flex items-center justify-between bg-rose-500/10 px-1 sm:px-1.5 py-0.5 rounded-md border border-rose-500/20 truncate">
                        <span className="text-[9px] text-rose-300 font-sans">-</span>
                        <span className="truncate text-[10px] sm:text-[11px]">
                          <span className="inline sm:hidden">{formatCompact(dayData.expense)}</span>
                          <span className="hidden sm:inline">{symbol}{dayData.expense.toLocaleString()}</span>
                        </span>
                      </div>
                    )}

                    {!hasIncome && !hasExpense && (
                      <span className="text-[9px] sm:text-[10px] text-slate-600 block text-center py-1 sm:py-2">
                        -
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Selected Day Transaction Breakdown Drawer */}
      {selectedDateStr && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 sm:p-5 space-y-3 sm:space-y-4 animate-fade-in shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4 text-emerald-400 shrink-0" />
              <h4 className="font-bold text-white text-xs sm:text-sm">
                Activity Details for {selectedDayLabel}
              </h4>
            </div>

            {selectedDayData && (
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                {selectedDayData.income > 0 && (
                  <span className="text-emerald-400 font-bold">
                    Inflow: +{symbol}{selectedDayData.income.toLocaleString()}
                  </span>
                )}
                {selectedDayData.expense > 0 && (
                  <span className="text-rose-400 font-bold">
                    Outflow: -{symbol}{selectedDayData.expense.toLocaleString()}
                  </span>
                )}
              </div>
            )}
          </div>

          {selectedDayData && selectedDayData.txs.length > 0 ? (
            <div className="divide-y divide-slate-800/60 max-h-60 overflow-y-auto pr-1">
              {selectedDayData.txs.map((tx) => (
                <div key={tx.id} className="py-2.5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between text-xs gap-2 sm:gap-3">
                  <div className="flex items-start gap-2.5 sm:gap-3">
                    <div
                      className={`p-1.5 sm:p-2 rounded-xl shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}
                    >
                      {tx.type === 'income' ? (
                        <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-white block truncate">{tx.merchant}</span>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5 flex-wrap">
                        <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                          {tx.category}
                        </span>
                        {tx.accountType === 'business' && (
                          <span className="px-1.5 py-0.5 rounded bg-teal-500/10 text-teal-300 border border-teal-500/20">
                            Freelance/Biz
                          </span>
                        )}
                        {tx.notes && <span className="truncate max-w-[180px] sm:max-w-xs">{tx.notes}</span>}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`font-mono font-extrabold text-xs sm:text-sm self-end sm:self-auto ${
                      tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : '-'}{symbol}{tx.amount.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500 space-y-2">
              <p>No transactions logged on this day.</p>
              {onOpenSmartInput && (
                <button
                  onClick={onOpenSmartInput}
                  className="text-xs text-emerald-400 hover:underline font-semibold inline-flex items-center gap-1"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Log a transaction for this date</span>
                </button>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

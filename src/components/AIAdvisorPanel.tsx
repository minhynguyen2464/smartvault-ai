import React, { useState } from 'react';
import { AdvisorInsight, ChatMessage, Transaction, CategoryBudget } from '../types';
import {
  Sparkles,
  RefreshCw,
  Send,
  Bot,
  User,
  ShieldCheck,
  AlertCircle,
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  CreditCard,
  MessageSquare
} from 'lucide-react';

interface AIAdvisorPanelProps {
  insight: AdvisorInsight;
  onRefreshInsight: () => void;
  isRefreshing: boolean;
  transactions: Transaction[];
}

export const AIAdvisorPanel: React.FC<AIAdvisorPanelProps> = ({
  insight,
  onRefreshInsight,
  isRefreshing,
  transactions,
}) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'ai',
      text: `Hello! I'm your SmartVault AI Financial Advisor. I've analyzed your ${transactions.length} recent transactions. Ask me anything about your cash flow, budget limits, subscription costs, or major purchase plans!`,
      timestamp: 'Just now',
    },
  ]);
  const [userInput, setUserInput] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSendMessage = async () => {
    if (!userInput.trim() || isSending) return;

    const userMsgText = userInput.trim();
    setUserInput('');

    const newMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userMsgText,
      timestamp: 'Just now',
    };

    setChatMessages((prev) => [...prev, newMsg]);
    setIsSending(true);

    try {
      const response = await fetch('/api/advisor-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, newMsg].map((m) => ({
            role: m.sender,
            text: m.text,
          })),
          transactionsContext: transactions,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to get AI advisor response.');
      }

      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: data.text,
          timestamp: 'Just now',
        },
      ]);
    } catch (err: any) {
      console.error('Advisor chat error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `ai-err-${Date.now()}`,
          sender: 'ai',
          text: `Sorry, I encountered an issue analyzing your query. Please make sure GEMINI_API_KEY is configured in Secrets.`,
          timestamp: 'Just now',
        },
      ]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base">Proactive AI Financial Advisor</h3>
            <p className="text-xs text-slate-400">Weekly automated summary & predictive cash-flow insights</p>
          </div>
        </div>

        <button
          onClick={onRefreshInsight}
          disabled={isRefreshing}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Analyzing...' : 'Re-run AI Analysis'}</span>
        </button>
      </div>

      {/* Grid: Weekly Summary & Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Weekly Summary Box */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
              <Lightbulb className="w-4 h-4" />
              <span>Weekly Executive Summary</span>
            </span>
            <span className="text-[10px] text-slate-500">{insight.lastUpdated}</span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">{insight.weeklySummary}</p>

          <div className="space-y-1.5 pt-2">
            <span className="text-[11px] font-bold text-slate-300 block">Personalized Action Targets:</span>
            {insight.savingsAdvice.map((advice, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{advice}</span>
              </div>
            ))}
          </div>

          {insight.taxTip && (
            <div className="p-2.5 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300 flex items-start gap-2 mt-2">
              <ShieldCheck className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
              <span><strong>Tax Tip:</strong> {insight.taxTip}</span>
            </div>
          )}
        </div>

        {/* Subscriptions Audit */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
              <CreditCard className="w-4 h-4" />
              <span>Subscription Audit & Redundancies</span>
            </span>
            <span className="text-[10px] bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded-full border border-amber-500/20 font-bold">
              AI Monitored
            </span>
          </div>

          <div className="space-y-2">
            {insight.subscriptionsFound.map((sub, idx) => (
              <div
                key={idx}
                className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-white block">{sub.name}</span>
                  <span className="text-[10px] text-slate-400">
                    ${sub.cost}/{sub.frequency} • {sub.recommendation}
                  </span>
                </div>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    sub.recommendation.toLowerCase().includes('flagged') ||
                    sub.recommendation.toLowerCase().includes('pausing')
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  {sub.recommendation.split('-')[0]}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Interactive AI Chatbot Section */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <MessageSquare className="w-4 h-4 text-emerald-400" />
          <h4 className="font-bold text-white text-sm">Ask Gemini Financial Advisor</h4>
        </div>

        {/* Messages list */}
        <div className="space-y-3 max-h-60 overflow-y-auto pr-1 text-xs">
          {chatMessages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.sender === 'ai' && (
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950 font-semibold rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                }`}
              >
                {msg.text}
              </div>

              {msg.sender === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Input box */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder='Ask e.g. "Can I afford $120 dinner tonight?" or "How much can I save by October?"'
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button
            onClick={handleSendMessage}
            disabled={!userInput.trim() || isSending}
            className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            {isSending ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </div>

    </div>
  );
};

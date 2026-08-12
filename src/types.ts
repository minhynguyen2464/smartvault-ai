export type CurrencyCode = 'USD' | 'VND' | 'EUR' | 'GBP';

export type TransactionType = 'expense' | 'income';
export type AccountType = 'personal' | 'business';
export type InvoiceStatus = 'none' | 'unpaid' | 'pending' | 'paid';

export interface Transaction {
  id: string;
  amount: number;
  currency: CurrencyCode;
  merchant: string;
  category: string;
  date: string; // YYYY-MM-DD
  type: TransactionType;
  accountType: AccountType;
  invoiceStatus?: InvoiceStatus;
  invoiceNumber?: string;
  clientName?: string;
  notes?: string;
  receiptUrl?: string;
  isSubscription?: boolean;
  tags?: string[];
  rawLogSource?: 'manual' | 'text' | 'voice' | 'receipt';
}

export interface CategoryBudget {
  category: string;
  limit: number;
  color: string;
  icon: string;
}

export interface SubscriptionItem {
  id: string;
  name: string;
  cost: number;
  currency: CurrencyCode;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
  status?: 'active' | 'paused' | 'cancelled';
  lastPaidDate?: string;
  flaggedUnused?: boolean;
  notes?: string;
}

export interface LentRecord {
  id: string;
  borrowerName: string;
  amount: number;
  currency: CurrencyCode;
  dateLent: string;
  dueDate: string;
  notes?: string;
  status: 'unpaid' | 'paid';
  settledDate?: string;
}

export interface LoanRecord {
  id: string;
  lenderName: string;
  totalBalance: number;
  monthlyPayment: number;
  currency: CurrencyCode;
  dueDate: string;
  interestRate?: number;
  notes?: string;
  status: 'active' | 'paid_off';
  lastPaymentDate?: string;
}

export interface AdvisorInsight {
  weeklySummary: string;
  savingsAdvice: string[];
  subscriptionsFound: Array<{
    name: string;
    cost: number;
    currency: string;
    frequency: string;
    recommendation: string;
  }>;
  cashFlowForecast: {
    summary: string;
    projected30DayBalance: number;
    riskLevel: 'low' | 'moderate' | 'high';
  };
  taxTip?: string;
  lastUpdated: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

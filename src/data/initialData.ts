import { Transaction, CategoryBudget, SubscriptionItem, LentRecord, LoanRecord, AdvisorInsight } from '../types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    amount: 35000000,
    currency: 'VND',
    merchant: 'Acme Studio Client',
    category: 'Client Revenue',
    date: '2026-08-01',
    type: 'income',
    accountType: 'business',
    invoiceStatus: 'paid',
    invoiceNumber: 'INV-2026-001',
    clientName: 'Acme Corp',
    notes: 'Q3 UI Design Retainer',
    tags: ['Freelance', 'Retainer', 'Taxable'],
    rawLogSource: 'text'
  },
  {
    id: 'tx-2',
    amount: 1450000,
    currency: 'VND',
    merchant: 'AWS Cloud Services',
    category: 'Tech & Infrastructure',
    date: '2026-08-02',
    type: 'expense',
    accountType: 'business',
    invoiceStatus: 'paid',
    invoiceNumber: 'AWS-88910',
    clientName: 'Internal Hosting',
    notes: 'Cloud hosting & database instance',
    isSubscription: true,
    tags: ['Business', 'Software', 'Deductible'],
    rawLogSource: 'receipt'
  },
  {
    id: 'tx-3',
    amount: 450000,
    currency: 'VND',
    merchant: 'Pho Saigon & Iced Coffee',
    category: 'Food & Dining',
    date: '2026-08-03',
    type: 'expense',
    accountType: 'personal',
    notes: 'Lunch with team near office',
    tags: ['Personal', 'Lunch'],
    rawLogSource: 'text'
  },
  {
    id: 'tx-4',
    amount: 260000,
    currency: 'VND',
    merchant: 'Netflix Premium',
    category: 'Entertainment',
    date: '2026-08-03',
    type: 'expense',
    accountType: 'personal',
    isSubscription: true,
    notes: 'Monthly streaming plan',
    tags: ['Personal', 'Subscription'],
    rawLogSource: 'receipt'
  },
  {
    id: 'tx-5',
    amount: 28000000,
    currency: 'VND',
    merchant: 'DesignSprint Inc',
    category: 'Client Revenue',
    date: '2026-08-04',
    type: 'income',
    accountType: 'business',
    invoiceStatus: 'pending',
    invoiceNumber: 'INV-2026-002',
    clientName: 'DesignSprint Inc',
    notes: 'Mobile App Audit - Due in 10 days',
    tags: ['Invoiced', 'Pending Cashflow'],
    rawLogSource: 'text'
  },
  {
    id: 'tx-6',
    amount: 850000,
    currency: 'VND',
    merchant: 'Whole Foods Market',
    category: 'Groceries',
    date: '2026-08-04',
    type: 'expense',
    accountType: 'personal',
    notes: 'Weekly grocery shopping',
    tags: ['Personal', 'Groceries'],
    rawLogSource: 'receipt'
  },
  {
    id: 'tx-7',
    amount: 280000,
    currency: 'VND',
    merchant: 'Uber Rides',
    category: 'Commute & Transit',
    date: '2026-08-05',
    type: 'expense',
    accountType: 'personal',
    notes: 'Ride to downtown meeting',
    tags: ['Personal', 'Commute'],
    rawLogSource: 'voice'
  },
  {
    id: 'tx-8',
    amount: 500000,
    currency: 'VND',
    merchant: 'ChatGPT Plus',
    category: 'Tech & Infrastructure',
    date: '2026-08-05',
    type: 'expense',
    accountType: 'business',
    isSubscription: true,
    notes: 'AI Copilot subscription',
    tags: ['Business', 'AI Tool', 'Deductible'],
    rawLogSource: 'text'
  },
  {
    id: 'tx-9',
    amount: 1200000,
    currency: 'VND',
    merchant: 'City Power & Utilities',
    category: 'Utilities & Office',
    date: '2026-08-05',
    type: 'expense',
    accountType: 'personal',
    notes: 'Electricity bill August',
    tags: ['Personal', 'Utilities'],
    rawLogSource: 'receipt'
  }
];

export const INITIAL_BUDGET_CAPS: CategoryBudget[] = [
  { category: 'Food & Dining', limit: 4500000, color: '#f59e0b', icon: 'Utensils' },
  { category: 'Tech & Infrastructure', limit: 3000000, color: '#3b82f6', icon: 'Laptop' },
  { category: 'Groceries', limit: 3500000, color: '#10b981', icon: 'ShoppingBag' },
  { category: 'Commute & Transit', limit: 1800000, color: '#8b5cf6', icon: 'Car' },
  { category: 'Entertainment', limit: 1200000, color: '#ec4899', icon: 'Tv' },
  { category: 'Utilities & Office', limit: 2500000, color: '#6366f1', icon: 'Zap' }
];

export const INITIAL_SUBSCRIPTIONS: SubscriptionItem[] = [
  {
    id: 'sub-1',
    name: 'AWS Cloud Services',
    cost: 1450000,
    currency: 'VND',
    billingCycle: 'monthly',
    nextBillingDate: '2026-09-02',
    category: 'Tech & Infrastructure',
    status: 'active'
  },
  {
    id: 'sub-2',
    name: 'Netflix Premium',
    cost: 260000,
    currency: 'VND',
    billingCycle: 'monthly',
    nextBillingDate: '2026-09-03',
    category: 'Entertainment',
    status: 'active'
  },
  {
    id: 'sub-3',
    name: 'ChatGPT Plus',
    cost: 500000,
    currency: 'VND',
    billingCycle: 'monthly',
    nextBillingDate: '2026-09-05',
    category: 'Tech & Infrastructure',
    status: 'active'
  },
  {
    id: 'sub-4',
    name: 'Gym Pass Membership',
    cost: 650000,
    currency: 'VND',
    billingCycle: 'monthly',
    nextBillingDate: '2026-09-10',
    category: 'Health',
    status: 'active',
    flaggedUnused: true
  }
];

export const INITIAL_LENT_RECORDS: LentRecord[] = [
  {
    id: 'lent-1',
    borrowerName: 'Alex Chen',
    amount: 5000000,
    currency: 'VND',
    dateLent: '2026-07-15',
    dueDate: '2026-08-15',
    notes: 'Co-working event venue deposit',
    status: 'unpaid'
  },
  {
    id: 'lent-2',
    borrowerName: 'Sarah Nguyen',
    amount: 1200000,
    currency: 'VND',
    dateLent: '2026-08-01',
    dueDate: '2026-08-10',
    notes: 'Design software license share',
    status: 'paid',
    settledDate: '2026-08-08'
  },
  {
    id: 'lent-3',
    borrowerName: 'David Miller',
    amount: 8500000,
    currency: 'VND',
    dateLent: '2026-07-20',
    dueDate: '2026-08-20',
    notes: 'Freelance camera equipment loan',
    status: 'unpaid'
  }
];

export const INITIAL_LOAN_RECORDS: LoanRecord[] = [
  {
    id: 'loan-1',
    lenderName: 'Techcombank Auto Loan',
    totalBalance: 120000000,
    monthlyPayment: 5500000,
    currency: 'VND',
    dueDate: '25th of month',
    interestRate: 7.5,
    notes: 'Vehicle financing',
    status: 'active'
  },
  {
    id: 'loan-2',
    lenderName: 'Citi Credit Card Balance',
    totalBalance: 15000000,
    monthlyPayment: 3000000,
    currency: 'VND',
    dueDate: '18th of month',
    notes: 'Monthly statement statement debt',
    status: 'active'
  },
  {
    id: 'loan-3',
    lenderName: 'Family Emergency Fund Loan',
    totalBalance: 10000000,
    monthlyPayment: 2000000,
    currency: 'VND',
    dueDate: '30th of month',
    notes: 'Personal loan from uncle',
    status: 'active'
  }
];

export const DEFAULT_EXPENSE_CATEGORIES: string[] = [
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
];

export const INITIAL_ADVISOR_INSIGHT: AdvisorInsight = {
  weeklySummary: "Overall cash flow is healthy with 35,000,000₫ cleared inflow (+ 28,000,000₫ pending) against 4,990,000₫ total expenses this month. Your current liquid balance is 30,010,000₫.",
  savingsAdvice: [
    "Cancel or downgrade Gym Pass Membership (650,000₫/mo) as no visits were recorded in 24 days.",
    "Allocate 25% (7,000,000₫) of incoming DesignSprint invoice directly into Tax Savings Reserve.",
    "You are on track to reach your target 2 weeks ahead if dining stays under 4,500,000₫/mo."
  ],
  subscriptionsFound: [
    { name: 'AWS Cloud Services', cost: 1450000, currency: 'VND', frequency: 'Monthly', recommendation: 'Keep - Business Essential' },
    { name: 'Gym Pass Membership', cost: 650000, currency: 'VND', frequency: 'Monthly', recommendation: 'Flagged - Consider pausing' },
    { name: 'Netflix Premium', cost: 260000, currency: 'VND', frequency: 'Monthly', recommendation: 'Optional - Personal' },
    { name: 'ChatGPT Plus', cost: 500000, currency: 'VND', frequency: 'Monthly', recommendation: 'Keep - High ROI for freelancing' }
  ],
  cashFlowForecast: {
    summary: "Strong 30-day outlook. Expecting 28,000,000₫ invoice collection by mid-August. Projected end-of-month liquid balance: 58,010,000₫.",
    projected30DayBalance: 58010000,
    riskLevel: 'low'
  },
  taxTip: "Estimated quarterly tax deduction from business expenses (AWS + ChatGPT): 1,650,000₫. Keep receipts logged!",
  lastUpdated: 'Just now'
};

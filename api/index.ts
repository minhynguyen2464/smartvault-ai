import express from 'express';
import mongoose, { Schema } from 'mongoose';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json({ limit: '20mb' }));

// Initial Default Seed Data
const DEFAULT_EXPENSE_CATEGORIES = [
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

const INITIAL_TRANSACTIONS = [
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
    rawLogSource: 'text',
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
    rawLogSource: 'receipt',
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
    rawLogSource: 'text',
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
    rawLogSource: 'receipt',
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
    rawLogSource: 'text',
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
    rawLogSource: 'receipt',
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
    rawLogSource: 'voice',
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
    rawLogSource: 'text',
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
    rawLogSource: 'receipt',
  },
];

const INITIAL_BUDGET_CAPS = [
  { category: 'Food & Dining', limit: 4500000, color: '#f59e0b', icon: 'Utensils' },
  { category: 'Tech & Infrastructure', limit: 3000000, color: '#3b82f6', icon: 'Laptop' },
  { category: 'Groceries', limit: 3500000, color: '#10b981', icon: 'ShoppingBag' },
  { category: 'Commute & Transit', limit: 1800000, color: '#8b5cf6', icon: 'Car' },
  { category: 'Entertainment', limit: 1200000, color: '#ec4899', icon: 'Tv' },
  { category: 'Utilities & Office', limit: 2500000, color: '#6366f1', icon: 'Zap' },
];

// MongoDB Mongoose Schemas & Models
const TransactionSchema = new Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'VND' },
    merchant: { type: String, required: true },
    category: { type: String, required: true },
    date: { type: String, required: true },
    type: { type: String, enum: ['expense', 'income'], default: 'expense' },
    accountType: { type: String, enum: ['personal', 'business'], default: 'personal' },
    invoiceStatus: { type: String, enum: ['none', 'unpaid', 'pending', 'paid'], default: 'none' },
    invoiceNumber: { type: String, default: '' },
    clientName: { type: String, default: '' },
    notes: { type: String, default: '' },
    receiptUrl: { type: String, default: '' },
    isSubscription: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    rawLogSource: { type: String, enum: ['manual', 'text', 'voice', 'receipt'], default: 'manual' },
  },
  { timestamps: true }
);

const BudgetCapSchema = new Schema(
  {
    category: { type: String, required: true, unique: true, index: true },
    limit: { type: Number, required: true },
    color: { type: String, default: '#10b981' },
    icon: { type: String, default: 'Tag' },
  },
  { timestamps: true }
);

const UserSettingsSchema = new Schema(
  {
    userId: { type: String, required: true, default: 'default_user', unique: true },
    expenseCategories: { type: [String], default: DEFAULT_EXPENSE_CATEGORIES },
    removedCategories: { type: [String], default: [] },
  },
  { timestamps: true }
);

const TransactionModel: mongoose.Model<any> =
  mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

const BudgetCapModel: mongoose.Model<any> =
  mongoose.models.BudgetCap || mongoose.model('BudgetCap', BudgetCapSchema);

const UserSettingsModel: mongoose.Model<any> =
  mongoose.models.UserSettings || mongoose.model('UserSettings', UserSettingsSchema);

// Database Connection Manager
let isConnected = false;
let dbError: string | null = null;

async function connectMongoDB() {
  if (isConnected) return true;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri || !mongoUri.trim()) {
    dbError = 'MONGODB_URI environment variable is not configured.';
    return false;
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    dbError = null;
    return true;
  } catch (err: any) {
    isConnected = false;
    dbError = err.message || 'Failed to connect to MongoDB.';
    return false;
  }
}

function getDbStatus() {
  return {
    connected: isConnected,
    uriConfigured: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim()),
    error: dbError,
  };
}

// Fallback In-Memory State for single serverless invocations
let inMemTransactions = [...INITIAL_TRANSACTIONS];
let inMemBudgets = [...INITIAL_BUDGET_CAPS];
let inMemExpenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];

// Gemini Client Instance
let ai: GoogleGenAI | null = null;
const getGeminiClient = () => {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is missing.');
    }
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return ai;
};

// Middleware to ensure DB connection attempt
async function ensureDb() {
  if (!isConnected && process.env.MONGODB_URI) {
    await connectMongoDB();
  }
}

// REST API Endpoints
app.get('/api/health', async (req, res) => {
  await ensureDb();
  res.json({ status: 'ok', time: new Date().toISOString(), db: getDbStatus() });
});

app.get('/api/db-status', async (req, res) => {
  await ensureDb();
  res.json(getDbStatus());
});

app.get('/api/transactions', async (req, res) => {
  try {
    await ensureDb();
    const status = getDbStatus();
    if (status.connected) {
      const txs = await TransactionModel.find().lean();
      return res.json({ success: true, source: 'mongodb', transactions: txs });
    }
    return res.json({ success: true, source: 'in-memory', transactions: inMemTransactions });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    await ensureDb();
    const txData = req.body;
    if (!txData.id) {
      txData.id = `tx-${Date.now()}`;
    }
    const status = getDbStatus();
    if (status.connected) {
      const created = await TransactionModel.create(txData);
      return res.json({ success: true, source: 'mongodb', transaction: created });
    }
    inMemTransactions = [txData, ...inMemTransactions];
    return res.json({ success: true, source: 'in-memory', transaction: txData });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create transaction' });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    await ensureDb();
    const { id } = req.params;
    const updatedData = req.body;
    const status = getDbStatus();
    if (status.connected) {
      const updated = await TransactionModel.findOneAndUpdate({ id } as any, updatedData, { new: true, upsert: true });
      return res.json({ success: true, source: 'mongodb', transaction: updated });
    }
    inMemTransactions = inMemTransactions.map((t) => (t.id === id ? { ...t, ...updatedData } : t));
    return res.json({ success: true, source: 'in-memory', transaction: updatedData });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update transaction' });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    await ensureDb();
    const { id } = req.params;
    const status = getDbStatus();
    if (status.connected) {
      await TransactionModel.deleteOne({ id });
      return res.json({ success: true, source: 'mongodb', id });
    }
    inMemTransactions = inMemTransactions.filter((t) => t.id !== id);
    return res.json({ success: true, source: 'in-memory', id });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.get('/api/budgets', async (req, res) => {
  try {
    await ensureDb();
    const status = getDbStatus();
    if (status.connected) {
      const budgets = await BudgetCapModel.find().lean();
      return res.json({ success: true, source: 'mongodb', budgetCaps: budgets });
    }
    return res.json({ success: true, source: 'in-memory', budgetCaps: inMemBudgets });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch budget caps' });
  }
});

app.put('/api/budgets', async (req, res) => {
  try {
    await ensureDb();
    const caps = req.body.budgetCaps || req.body;
    const status = getDbStatus();
    if (status.connected && Array.isArray(caps)) {
      const categoryNames = caps.map((c: any) => c.category);
      await BudgetCapModel.deleteMany({ category: { $nin: categoryNames } } as any);

      for (const c of caps) {
        await BudgetCapModel.findOneAndUpdate(
          { category: c.category } as any,
          { limit: c.limit, color: c.color, icon: c.icon },
          { upsert: true, new: true }
        );
      }
      const updated = await BudgetCapModel.find().lean();
      return res.json({ success: true, source: 'mongodb', budgetCaps: updated });
    }
    inMemBudgets = caps;
    return res.json({ success: true, source: 'in-memory', budgetCaps: inMemBudgets });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to update budget caps' });
  }
});

app.delete('/api/budgets/:category', async (req, res) => {
  try {
    await ensureDb();
    const { category } = req.params;
    const status = getDbStatus();
    if (status.connected) {
      await BudgetCapModel.deleteOne({ category } as any);
      const updated = await BudgetCapModel.find().lean();
      return res.json({ success: true, source: 'mongodb', budgetCaps: updated });
    }
    inMemBudgets = inMemBudgets.filter((b) => b.category !== category);
    return res.json({ success: true, source: 'in-memory', budgetCaps: inMemBudgets });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete budget cap' });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    await ensureDb();
    const status = getDbStatus();
    if (status.connected) {
      let settings = await UserSettingsModel.findOne({ userId: 'default_user' }).lean();
      if (!settings) {
        settings = await UserSettingsModel.create({
          userId: 'default_user',
          expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
          removedCategories: [],
        });
      }
      return res.json({ success: true, source: 'mongodb', expenseCategories: settings.expenseCategories || [] });
    }
    return res.json({ success: true, source: 'in-memory', expenseCategories: inMemExpenseCategories });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    await ensureDb();
    const { category } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    const newCat = category.trim();
    const status = getDbStatus();
    if (status.connected) {
      let settings = await UserSettingsModel.findOne({ userId: 'default_user' });
      if (!settings) {
        settings = await UserSettingsModel.create({
          userId: 'default_user',
          expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
          removedCategories: [],
        });
      }
      if (!settings.expenseCategories.some((c: string) => c.toLowerCase() === newCat.toLowerCase())) {
        settings.expenseCategories.push(newCat);
      }
      settings.removedCategories = (settings.removedCategories || []).filter(
        (c: string) => c.toLowerCase() !== newCat.toLowerCase()
      );
      await settings.save();
      return res.json({ success: true, source: 'mongodb', expenseCategories: settings.expenseCategories });
    }
    if (!inMemExpenseCategories.some((c) => c.toLowerCase() === newCat.toLowerCase())) {
      inMemExpenseCategories.push(newCat);
    }
    return res.json({ success: true, source: 'in-memory', expenseCategories: inMemExpenseCategories });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add category' });
  }
});

app.delete('/api/categories/:category', async (req, res) => {
  try {
    await ensureDb();
    const rawCategory = req.params.category;
    const targetCategory = decodeURIComponent(rawCategory).trim();
    const status = getDbStatus();
    if (status.connected) {
      let settings = await UserSettingsModel.findOne({ userId: 'default_user' });
      if (!settings) {
        settings = await UserSettingsModel.create({
          userId: 'default_user',
          expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
          removedCategories: [],
        });
      }
      settings.expenseCategories = (settings.expenseCategories || []).filter(
        (c: string) => c.trim().toLowerCase() !== targetCategory.toLowerCase()
      );
      if (!settings.removedCategories.includes(targetCategory)) {
        settings.removedCategories.push(targetCategory);
      }
      await settings.save();
      return res.json({ success: true, source: 'mongodb', expenseCategories: settings.expenseCategories });
    }
    inMemExpenseCategories = inMemExpenseCategories.filter(
      (c) => c.trim().toLowerCase() !== targetCategory.toLowerCase()
    );
    return res.json({ success: true, source: 'in-memory', expenseCategories: inMemExpenseCategories });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to remove category' });
  }
});

app.post('/api/seed', async (req, res) => {
  try {
    await ensureDb();
    const status = getDbStatus();
    if (status.connected) {
      await TransactionModel.deleteMany({});
      await BudgetCapModel.deleteMany({});
      await UserSettingsModel.deleteMany({});
      await TransactionModel.insertMany(INITIAL_TRANSACTIONS as any);
      await BudgetCapModel.insertMany(INITIAL_BUDGET_CAPS as any);
      await UserSettingsModel.create({
        userId: 'default_user',
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
        removedCategories: [],
      });
      return res.json({ success: true, message: 'Database successfully re-seeded with initial data.' });
    }
    inMemTransactions = [...INITIAL_TRANSACTIONS];
    inMemBudgets = [...INITIAL_BUDGET_CAPS];
    inMemExpenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];
    return res.json({ success: true, message: 'In-memory state reset to initial data.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to seed database' });
  }
});

app.post('/api/parse-transaction', async (req, res) => {
  try {
    const { textPrompt, base64Image, mimeType, base64Audio, defaultCurrency = 'USD', defaultAccountType = 'personal' } = req.body;
    const client = getGeminiClient();

    const systemInstruction = `You are SmartVault AI's expert financial transaction parser. 
Extract transaction details from the provided text, receipt image, or spoken voice transcript.
Return a clean, accurate JSON object with the following fields:
- amount: number
- currency: string
- merchant: string
- category: string
- date: string (YYYY-MM-DD format)
- type: 'expense' or 'income'
- accountType: 'personal' or 'business'
- invoiceStatus: 'none', 'unpaid', 'pending', or 'paid'
- invoiceNumber: string or empty string
- clientName: string or empty string
- notes: concise summary
- isSubscription: boolean
- tags: array of strings
- confidenceScore: number`;

    const contentsParts: any[] = [];
    if (base64Image) {
      contentsParts.push({ inlineData: { mimeType: mimeType || 'image/png', data: base64Image } });
      contentsParts.push({ text: textPrompt || 'Parse this receipt image into transaction details.' });
    } else if (base64Audio) {
      contentsParts.push({ inlineData: { mimeType: mimeType || 'audio/webm', data: base64Audio } });
      contentsParts.push({ text: textPrompt || 'Transcribe this voice memo and extract transaction details.' });
    } else if (textPrompt) {
      contentsParts.push({ text: textPrompt });
    } else {
      return res.status(400).json({ error: 'No input provided.' });
    }

    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            amount: { type: Type.NUMBER },
            currency: { type: Type.STRING },
            merchant: { type: Type.STRING },
            category: { type: Type.STRING },
            date: { type: Type.STRING },
            type: { type: Type.STRING },
            accountType: { type: Type.STRING },
            invoiceStatus: { type: Type.STRING },
            invoiceNumber: { type: Type.STRING },
            clientName: { type: Type.STRING },
            notes: { type: Type.STRING },
            isSubscription: { type: Type.BOOLEAN },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            confidenceScore: { type: Type.NUMBER },
          },
          required: ['amount', 'currency', 'merchant', 'category', 'date', 'type', 'accountType'],
        },
      },
    });

    const parsedJson = JSON.parse(response.text || '{}');
    res.json({ success: true, transaction: parsedJson });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Transaction parsing failed.' });
  }
});

app.post('/api/financial-advisor', async (req, res) => {
  try {
    const { transactions, budgetCaps } = req.body;
    const client = getGeminiClient();

    const systemInstruction = `You are SmartVault AI's Financial Advisor engine.
Analyze the user's recent financial transactions and budget constraints.
Provide actionable advice in JSON format matching this schema:
- weeklySummary: 2-3 sentences overview of inflow/outflow balance and spending trends.
- savingsAdvice: array of 3 concrete recommendations.
- subscriptionsFound: array of objects { name, cost, currency, frequency, recommendation }
- cashFlowForecast: object { summary, projected30DayBalance (number), riskLevel ('low'|'moderate'|'high') }
- taxTip: string
- lastUpdated: string`;

    const prompt = `Analyze these user transactions and budget caps:
Transactions: ${JSON.stringify(transactions, null, 2)}
Budget Caps: ${JSON.stringify(budgetCaps, null, 2)}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            weeklySummary: { type: Type.STRING },
            savingsAdvice: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            subscriptionsFound: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  cost: { type: Type.NUMBER },
                  currency: { type: Type.STRING },
                  frequency: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['name', 'cost', 'frequency', 'recommendation'],
              },
            },
            cashFlowForecast: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING },
                projected30DayBalance: { type: Type.NUMBER },
                riskLevel: { type: Type.STRING },
              },
              required: ['summary', 'projected30DayBalance', 'riskLevel'],
            },
            taxTip: { type: Type.STRING },
            lastUpdated: { type: Type.STRING },
          },
          required: ['weeklySummary', 'savingsAdvice', 'subscriptionsFound', 'cashFlowForecast'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ success: true, insight: parsed });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Financial advisor failed.' });
  }
});

app.post('/api/advisor-chat', async (req, res) => {
  try {
    const { messages, transactionsContext } = req.body;
    const client = getGeminiClient();

    const systemInstruction = `You are SmartVault AI, a friendly, encouraging personal finance advisor AI.
Transaction history context: ${JSON.stringify(transactionsContext, null, 2)}`;

    const contents = messages.map((m: any) => ({
      role: m.role === 'ai' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const response = await client.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ success: true, text: response.text });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Advisor chat failed.' });
  }
});

export default app;

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import { connectMongoDB, getDbStatus, TransactionModel, BudgetCapModel, UserSettingsModel, seedInitialDataIfEmpty } from './src/server/db';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGET_CAPS, DEFAULT_EXPENSE_CATEGORIES } from './src/data/initialData';

dotenv.config();

// Fallback in-memory state if MONGODB_URI is not provided yet
let inMemTransactions = [...INITIAL_TRANSACTIONS];
let inMemBudgets = [...INITIAL_BUDGET_CAPS];
let inMemExpenseCategories = [...DEFAULT_EXPENSE_CATEGORIES];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '20mb' }));

  // Attempt to connect to MongoDB if MONGODB_URI is set
  await connectMongoDB();

  // Initialize Gemini Client
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

  // 1. Health & Database Status check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString(), db: getDbStatus() });
  });

  app.get('/api/db-status', (req, res) => {
    res.json(getDbStatus());
  });

  // 2. Transactions REST API Endpoints (MongoDB backed with fallback)
  app.get('/api/transactions', async (req, res) => {
    try {
      const status = getDbStatus();
      if (status.connected) {
        const txs = await TransactionModel.find().lean();
        return res.json({ success: true, source: 'mongodb', transactions: txs });
      }
      return res.json({ success: true, source: 'in-memory', transactions: inMemTransactions });
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
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
      console.error('Error creating transaction:', err);
      res.status(500).json({ error: err.message || 'Failed to create transaction' });
    }
  });

  app.put('/api/transactions/:id', async (req, res) => {
    try {
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
      console.error('Error updating transaction:', err);
      res.status(500).json({ error: 'Failed to update transaction' });
    }
  });

  app.delete('/api/transactions/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const status = getDbStatus();
      if (status.connected) {
        await TransactionModel.deleteOne({ id });
        return res.json({ success: true, source: 'mongodb', id });
      }
      inMemTransactions = inMemTransactions.filter((t) => t.id !== id);
      return res.json({ success: true, source: 'in-memory', id });
    } catch (err: any) {
      console.error('Error deleting transaction:', err);
      res.status(500).json({ error: 'Failed to delete transaction' });
    }
  });

  // 3. Budget Caps REST API Endpoints
  app.get('/api/budgets', async (req, res) => {
    try {
      const status = getDbStatus();
      if (status.connected) {
        const budgets = await BudgetCapModel.find().lean();
        return res.json({ success: true, source: 'mongodb', budgetCaps: budgets });
      }
      return res.json({ success: true, source: 'in-memory', budgetCaps: inMemBudgets });
    } catch (err: any) {
      console.error('Error fetching budget caps:', err);
      res.status(500).json({ error: 'Failed to fetch budget caps' });
    }
  });

  app.put('/api/budgets', async (req, res) => {
    try {
      const caps = req.body.budgetCaps || req.body;
      const status = getDbStatus();
      if (status.connected && Array.isArray(caps)) {
        const categoryNames = caps.map((c: any) => c.category);
        // Delete any budget categories that were removed by the user
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
      console.error('Error updating budget caps:', err);
      res.status(500).json({ error: 'Failed to update budget caps' });
    }
  });

  app.delete('/api/budgets/:category', async (req, res) => {
    try {
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
      console.error('Error deleting budget cap:', err);
      res.status(500).json({ error: 'Failed to delete budget cap' });
    }
  });

  // 4. Log Expense Categories REST API Endpoints
  app.get('/api/categories', async (req, res) => {
    try {
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
      console.error('Error fetching categories:', err);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.post('/api/categories', async (req, res) => {
    try {
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
      console.error('Error adding category:', err);
      res.status(500).json({ error: 'Failed to add category' });
    }
  });

  app.delete('/api/categories/:category', async (req, res) => {
    try {
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
      console.error('Error removing category:', err);
      res.status(500).json({ error: 'Failed to remove category' });
    }
  });

  // 5. Seed Database Endpoint
  app.post('/api/seed', async (req, res) => {
    try {
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

  // 2. Parse Multimodal Transaction (Text / Image / Voice)
  app.post('/api/parse-transaction', async (req, res) => {
    try {
      const { textPrompt, base64Image, mimeType, base64Audio, defaultCurrency = 'USD', defaultAccountType = 'personal' } = req.body;

      const client = getGeminiClient();

      const systemInstruction = `You are SmartVault AI's expert financial transaction parser. 
Extract transaction details from the provided text, receipt image, or spoken voice transcript.
Return a clean, accurate JSON object with the following fields:
- amount: number (positive number for expense or income amount)
- currency: string (e.g. 'USD', 'VND', 'EUR', 'GBP'). If not explicit, default to '${defaultCurrency}'. Note: 'k' or 'k VND' means thousands (e.g., 45k = 45000).
- merchant: string (name of store, vendor, client, or employer)
- category: string (Must be one of: 'Food & Dining', 'Tech & Infrastructure', 'Groceries', 'Commute & Transit', 'Utilities & Office', 'Entertainment', 'Client Revenue', 'Salary & Income', 'Healthcare', 'Shopping', 'Other')
- date: string (YYYY-MM-DD format). If relative like "today" or "yesterday", use current date context: ${new Date().toISOString().split('T')[0]}.
- type: 'expense' or 'income'
- accountType: 'personal' or 'business' (Determine based on context, e.g., hosting/invoice/software/client is 'business', coffee/groceries/movie is 'personal'. Default to '${defaultAccountType}').
- invoiceStatus: 'none', 'unpaid', 'pending', or 'paid' (If business invoice mentioned, set 'pending' or 'unpaid', otherwise 'paid' or 'none').
- invoiceNumber: string or empty string
- clientName: string or empty string
- notes: concise summary of item or purpose
- isSubscription: boolean (true if recurring monthly/annual service like Netflix, AWS, Spotify, Gym)
- tags: array of 2-4 string keywords (e.g., ['Lunch', 'Coffee'], ['Freelance', 'Invoice'])
- confidenceScore: number between 0.0 and 1.0 representing extraction confidence`;

      const contentsParts: any[] = [];

      if (base64Image) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: base64Image,
          },
        });
        contentsParts.push({ text: textPrompt || 'Parse this receipt image into transaction details.' });
      } else if (base64Audio) {
        contentsParts.push({
          inlineData: {
            mimeType: mimeType || 'audio/webm',
            data: base64Audio,
          },
        });
        contentsParts.push({ text: textPrompt || 'Transcribe this voice memo and extract transaction details.' });
      } else if (textPrompt) {
        contentsParts.push({ text: textPrompt });
      } else {
        return res.status(400).json({ error: 'No input provided (textPrompt, base64Image, or base64Audio required).' });
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
              tags: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
              confidenceScore: { type: Type.NUMBER },
            },
            required: ['amount', 'currency', 'merchant', 'category', 'date', 'type', 'accountType'],
          },
        },
      });

      const parsedText = response.text || '{}';
      const result = JSON.parse(parsedText);

      res.json({ success: true, transaction: result });
    } catch (err: any) {
      console.error('Error parsing transaction:', err);
      res.status(500).json({ error: err.message || 'Failed to parse transaction.' });
    }
  });

  // 3. Proactive Financial Advisor Analysis
  app.post('/api/financial-advisor', async (req, res) => {
    try {
      const { transactions, budgetCaps } = req.body;

      const client = getGeminiClient();

      const systemInstruction = `You are SmartVault AI's Financial Advisor engine.
Analyze the user's recent financial transactions and budget constraints for a unified personal and freelance financial studio.
Provide actionable, high-value advice in JSON format matching this schema:
- weeklySummary: 2-3 sentences overview of inflow/outflow balance, spending trends, and top cost driver.
- savingsAdvice: array of 3 concrete, personalized bullet point recommendations (e.g. cutting unused subscriptions, setting aside tax reserve, capping eating out).
- subscriptionsFound: array of objects { name, cost, currency, frequency, recommendation }
- cashFlowForecast: object { summary, projected30DayBalance (number), riskLevel ('low'|'moderate'|'high') }
- taxTip: string (Specific tax deduction advice or invoice reminder for personal and business expenses)
- lastUpdated: ISO date string or human label`;

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
      console.error('Error in financial advisor:', err);
      res.status(500).json({ error: err.message || 'Failed to generate financial analysis.' });
    }
  });

  // 4. Interactive Advisor Chat
  app.post('/api/advisor-chat', async (req, res) => {
    try {
      const { messages, transactionsContext } = req.body;

      const client = getGeminiClient();

      const systemInstruction = `You are SmartVault AI, a friendly, encouraging, and highly knowledgeable personal finance advisor AI for a unified personal & freelancer workspace.
You have real-time access to their current transaction history and ledger:
${JSON.stringify(transactionsContext, null, 2)}

Provide concise, clear, and mathematically accurate answers regarding their budget, affordability of new purchases, invoice collections, tax deductions, and saving milestones. Keep your tone empowering and conversational. Use bolding and bullet points when appropriate.`;

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
      console.error('Error in advisor chat:', err);
      res.status(500).json({ error: err.message || 'Advisor chat failed.' });
    }
  });

  // Vite development middleware vs Static Production server
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartVault AI Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

import mongoose, { Schema } from 'mongoose';
import { INITIAL_TRANSACTIONS, INITIAL_BUDGET_CAPS, DEFAULT_EXPENSE_CATEGORIES } from '../data/initialData';

let isConnected = false;
let dbError: string | null = null;

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

export const TransactionModel: mongoose.Model<any> =
  mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);

export const BudgetCapModel: mongoose.Model<any> =
  mongoose.models.BudgetCap || mongoose.model('BudgetCap', BudgetCapSchema);

export const UserSettingsModel: mongoose.Model<any> =
  mongoose.models.UserSettings || mongoose.model('UserSettings', UserSettingsSchema);

export async function connectMongoDB() {
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
    console.log('Successfully connected to MongoDB Atlas cluster.');

    // Seed initial data if collections are empty
    await seedInitialDataIfEmpty();
    return true;
  } catch (err: any) {
    isConnected = false;
    dbError = err.message || 'Failed to connect to MongoDB.';
    console.error('MongoDB Connection Error:', err.message);
    return false;
  }
}

export function getDbStatus() {
  return {
    connected: isConnected,
    uriConfigured: Boolean(process.env.MONGODB_URI && process.env.MONGODB_URI.trim()),
    error: dbError,
  };
}

export async function seedInitialDataIfEmpty() {
  if (!isConnected) return;
  try {
    const txCount = await TransactionModel.countDocuments();
    if (txCount === 0) {
      console.log('Seeding initial transactions into MongoDB...');
      await TransactionModel.insertMany(INITIAL_TRANSACTIONS as any);
    }

    const budgetCount = await BudgetCapModel.countDocuments();
    if (budgetCount === 0) {
      console.log('Seeding initial budget caps into MongoDB...');
      await BudgetCapModel.insertMany(INITIAL_BUDGET_CAPS as any);
    }

    const settingsCount = await UserSettingsModel.countDocuments();
    if (settingsCount === 0) {
      console.log('Seeding initial user settings into MongoDB...');
      await UserSettingsModel.create({
        userId: 'default_user',
        expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
        removedCategories: [],
      });
    }
  } catch (err) {
    console.error('Error auto-seeding initial data:', err);
  }
}

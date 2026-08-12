import { Transaction, CategoryBudget } from '../types';

export interface DbStatusResponse {
  connected: boolean;
  uriConfigured: boolean;
  error?: string | null;
}

export async function fetchDbStatus(): Promise<DbStatusResponse> {
  try {
    const res = await fetch('/api/db-status');
    if (!res.ok) throw new Error('Status check failed');
    return await res.json();
  } catch {
    return { connected: false, uriConfigured: false, error: 'Failed to connect to backend API' };
  }
}

export async function verifySecretApi(secret: string): Promise<{ success: boolean; verified: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/verify-secret', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret }),
    });
    if (res.status === 404) {
      // Fallback for static builds on Vercel
      if (secret.trim() === '2464') {
        return { success: true, verified: true, message: 'Access granted' };
      }
      return { success: false, verified: false, error: 'Forbidden: Incorrect secret passcode' };
    }
    const data = await res.json();
    if (!res.ok) {
      return { success: false, verified: false, error: data.error || 'Forbidden: Incorrect secret passcode' };
    }
    return data;
  } catch (err: any) {
    // Fallback for offline or static deployments
    if (secret.trim() === '2464') {
      return { success: true, verified: true, message: 'Access granted' };
    }
    return { success: false, verified: false, error: err.message || 'Server network error' };
  }
}

export async function fetchTransactions(): Promise<Transaction[]> {
  const res = await fetch('/api/transactions');
  if (!res.ok) throw new Error('Failed to fetch transactions');
  const data = await res.json();
  return data.transactions || [];
}

export async function createTransactionApi(tx: Omit<Transaction, 'id'> & { id?: string }): Promise<Transaction> {
  const res = await fetch('/api/transactions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error('Failed to create transaction');
  const data = await res.json();
  return data.transaction;
}

export async function updateTransactionApi(tx: Transaction): Promise<Transaction> {
  const res = await fetch(`/api/transactions/${tx.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tx),
  });
  if (!res.ok) throw new Error('Failed to update transaction');
  const data = await res.json();
  return data.transaction;
}

export async function deleteTransactionApi(id: string): Promise<void> {
  const res = await fetch(`/api/transactions/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete transaction');
}

export async function fetchBudgetCaps(): Promise<CategoryBudget[]> {
  const res = await fetch('/api/budgets');
  if (!res.ok) throw new Error('Failed to fetch budget caps');
  const data = await res.json();
  return data.budgetCaps || [];
}

export async function updateBudgetCapsApi(budgetCaps: CategoryBudget[]): Promise<CategoryBudget[]> {
  const res = await fetch('/api/budgets', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ budgetCaps }),
  });
  if (!res.ok) throw new Error('Failed to update budget caps');
  const data = await res.json();
  return data.budgetCaps || [];
}

export async function deleteBudgetCapApi(category: string): Promise<CategoryBudget[]> {
  const res = await fetch(`/api/budgets/${encodeURIComponent(category)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete budget cap');
  const data = await res.json();
  return data.budgetCaps || [];
}

export async function fetchExpenseCategories(): Promise<string[]> {
  const res = await fetch('/api/categories');
  if (!res.ok) throw new Error('Failed to fetch expense categories');
  const data = await res.json();
  return data.expenseCategories || [];
}

export async function addExpenseCategoryApi(category: string): Promise<string[]> {
  const res = await fetch('/api/categories', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ category }),
  });
  if (!res.ok) throw new Error('Failed to add expense category');
  const data = await res.json();
  return data.expenseCategories || [];
}

export async function deleteExpenseCategoryApi(category: string): Promise<string[]> {
  const res = await fetch(`/api/categories/${encodeURIComponent(category)}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to remove expense category');
  const data = await res.json();
  return data.expenseCategories || [];
}

export async function seedDatabaseApi(): Promise<void> {
  const res = await fetch('/api/seed', { method: 'POST' });
  if (!res.ok) throw new Error('Failed to seed database');
}

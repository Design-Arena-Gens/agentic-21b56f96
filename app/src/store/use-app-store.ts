'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { nanoid } from 'nanoid';
import { addMonths } from 'date-fns';
import { generateImportedTransactions } from '@/utils/imports';

export type PlanTier = 'free' | 'premium';

export type UserSettings = {
  currency: string;
  notifications: boolean;
  darkMode: boolean;
  haptics: boolean;
};

export type Subscription = {
  tier: PlanTier;
  renewalDate?: string;
  status: 'active' | 'past_due';
};

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
  subscription: Subscription;
  settings: UserSettings;
  categories: string[];
};

export type Receipt = {
  id: string;
  fileName: string;
  dataUrl: string;
  uploadedAt: string;
};

export type TransactionSource = 'manual' | 'imported';

export type TransactionType = 'income' | 'expense';

export type Transaction = {
  id: string;
  userId: string;
  type: TransactionType;
  category: string;
  amount: number;
  date: string;
  notes?: string;
  receiptId?: string;
  source: TransactionSource;
  createdAt: string;
};

export type Budget = {
  id: string;
  userId: string;
  category: string;
  limit: number;
  createdAt: string;
  rollover?: boolean;
  alertThreshold?: number;
};

export type AnalyticsLog = {
  id: string;
  userId: string;
  period: 'weekly' | 'monthly';
  sentAt: string;
};

type AppState = {
  users: User[];
  receipts: Receipt[];
  transactions: Transaction[];
  budgets: Budget[];
  analyticsLog: AnalyticsLog[];
  currentUserId?: string;
};

type AppActions = {
  signUp: (args: { email: string; name: string; passwordHash: string }) => string;
  signIn: (args: { email: string; passwordHash: string }) => User;
  signOut: () => void;
  resetPassword: (args: { email: string; newPasswordHash: string }) => void;
  addTransaction: (
    args: Omit<Transaction, 'id' | 'createdAt' | 'source'> & { source?: TransactionSource },
  ) => Transaction;
  updateTransaction: (id: string, updates: Partial<Omit<Transaction, 'id' | 'userId'>>) => void;
  removeTransaction: (id: string) => void;
  addReceipt: (args: Omit<Receipt, 'id' | 'uploadedAt'>) => Receipt;
  removeReceipt: (id: string) => void;
  upsertBudget: (
    args: Omit<Budget, 'id' | 'createdAt'> & { id?: string },
  ) => Budget;
  removeBudget: (id: string) => void;
  upgradeToPremium: (userId: string) => void;
  downgradeToFree: (userId: string) => void;
  addCustomCategory: (userId: string, category: string) => void;
  importTransactions: (userId: string) => Transaction[];
  updateSettings: (userId: string, settings: Partial<UserSettings>) => void;
  sendAnalyticsEmail: (userId: string, period: 'weekly' | 'monthly') => AnalyticsLog;
};

const DEFAULT_CATEGORIES = [
  'Salary',
  'Rent',
  'Food',
  'Transportation',
  'Entertainment',
  'Utilities',
  'Healthcare',
  'Travel',
  'Savings',
];

const selectUserByEmail = (users: User[], email: string) =>
  users.find(
    (user) => user.email.trim().toLowerCase() === email.trim().toLowerCase(),
  );

const STORAGE_KEY = 'aurora-finance-state';

const storage =
  typeof window !== 'undefined'
    ? createJSONStorage<AppState>(() => window.localStorage)
    : createJSONStorage<AppState>(() => ({
        getItem: () => null,
        setItem: () => {},
        removeItem: () => {},
      }));

export const useAppStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      users: [],
      receipts: [],
      transactions: [],
      budgets: [],
      analyticsLog: [],
      currentUserId: undefined,

      signUp: ({ email, name, passwordHash }) => {
        const existing = selectUserByEmail(get().users, email);
        if (existing) {
          throw new Error('An account already exists for this email address.');
        }

        const id = nanoid();
        const now = new Date().toISOString();
        const newUser: User = {
          id,
          email: email.trim().toLowerCase(),
          name: name.trim() || 'New Member',
          passwordHash,
          createdAt: now,
          subscription: {
            tier: 'free',
            status: 'active',
          },
          settings: {
            currency: 'USD',
            notifications: true,
            darkMode: false,
            haptics: true,
          },
          categories: DEFAULT_CATEGORIES.slice(0, 6),
        };

        set((state) => ({
          users: [...state.users, newUser],
          currentUserId: id,
        }));

        return id;
      },

      signIn: ({ email, passwordHash }) => {
        const user = selectUserByEmail(get().users, email);
        if (!user || user.passwordHash !== passwordHash) {
          throw new Error('Invalid email or password.');
        }

        set({ currentUserId: user.id });
        return user;
      },

      signOut: () => {
        set({ currentUserId: undefined });
      },

      resetPassword: ({ email, newPasswordHash }) => {
        const user = selectUserByEmail(get().users, email);
        if (!user) {
          throw new Error('No account found for this email.');
        }

        set((state) => ({
          users: state.users.map((u) =>
            u.id === user.id ? { ...u, passwordHash: newPasswordHash } : u,
          ),
        }));
      },

      addReceipt: ({ fileName, dataUrl }) => {
        const receipt: Receipt = {
          id: nanoid(),
          fileName,
          dataUrl,
          uploadedAt: new Date().toISOString(),
        };

        set((state) => ({
          receipts: [...state.receipts, receipt],
        }));

        return receipt;
      },

      removeReceipt: (id) => {
        set((state) => ({
          receipts: state.receipts.filter((receipt) => receipt.id !== id),
        }));
      },

      addTransaction: ({
        userId,
        type,
        category,
        amount,
        date,
        notes,
        receiptId,
        source,
      }) => {
        const transaction: Transaction = {
          id: nanoid(),
          userId,
          type,
          category,
          amount,
          date,
          notes,
          receiptId,
          source: source ?? 'manual',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          transactions: [transaction, ...state.transactions],
        }));

        return transaction;
      },

      updateTransaction: (id, updates) => {
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updates } : tx,
          ),
        }));
      },

      removeTransaction: (id) => {
        const transaction = get().transactions.find((tx) => tx.id === id);
        if (transaction?.receiptId) {
          set((state) => ({
            receipts: state.receipts.filter((r) => r.id !== transaction.receiptId),
          }));
        }

        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        }));
      },

      upsertBudget: ({ id, userId, category, limit, rollover, alertThreshold }) => {
        if (limit <= 0) {
          throw new Error('Budget limit must be greater than zero.');
        }

        if (id) {
          const exists = get().budgets.find((budget) => budget.id === id);
          if (!exists) {
            throw new Error('Budget not found.');
          }

          const updated: Budget = {
            ...exists,
            category,
            limit,
            rollover: typeof rollover === 'boolean' ? rollover : exists.rollover,
            alertThreshold: typeof alertThreshold === 'number' ? alertThreshold : exists.alertThreshold,
          };

          set((state) => ({
            budgets: state.budgets.map((budget) =>
              budget.id === id ? updated : budget,
            ),
          }));

          return updated;
        }

        const budget: Budget = {
          id: nanoid(),
          userId,
          category,
          limit,
          createdAt: new Date().toISOString(),
          rollover,
          alertThreshold,
        };

        set((state) => ({
          budgets: [budget, ...state.budgets],
        }));

        return budget;
      },

      removeBudget: (id) => {
        set((state) => ({
          budgets: state.budgets.filter((budget) => budget.id !== id),
        }));
      },

      upgradeToPremium: (userId) => {
        const renewal = addMonths(new Date(), 1).toISOString();
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  subscription: {
                    tier: 'premium',
                    renewalDate: renewal,
                    status: 'active',
                  },
                  categories: user.categories.concat(
                    DEFAULT_CATEGORIES.filter(
                      (category) => !user.categories.includes(category),
                    ),
                  ),
                }
              : user,
          ),
        }));
      },

      downgradeToFree: (userId) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? {
                  ...user,
                  subscription: {
                    tier: 'free',
                    status: 'active',
                  },
                  categories: DEFAULT_CATEGORIES.slice(0, 6),
                }
              : user,
          ),
          budgets: state.budgets.filter(
            (budget) =>
              budget.userId !== userId ||
              DEFAULT_CATEGORIES.slice(0, 6).includes(budget.category),
          ),
          transactions: state.transactions.filter(
            (tx) =>
              tx.userId !== userId ||
              DEFAULT_CATEGORIES.slice(0, 6).includes(tx.category),
          ),
        }));
      },

      addCustomCategory: (userId, category) => {
        const trimmed = category.trim();
        if (!trimmed) {
          throw new Error('Category name cannot be empty.');
        }

        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId && !user.categories.includes(trimmed)
              ? { ...user, categories: [...user.categories, trimmed] }
              : user,
          ),
        }));
      },

      importTransactions: (userId) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) {
          throw new Error('User not found.');
        }
        const imported = generateImportedTransactions(user);
        set((state) => ({
          transactions: [...imported, ...state.transactions],
        }));
        return imported;
      },

      updateSettings: (userId, settings) => {
        set((state) => ({
          users: state.users.map((user) =>
            user.id === userId
              ? { ...user, settings: { ...user.settings, ...settings } }
              : user,
          ),
        }));
      },

      sendAnalyticsEmail: (userId, period) => {
        const log: AnalyticsLog = {
          id: nanoid(),
          userId,
          period,
          sentAt: new Date().toISOString(),
        };

        set((state) => ({
          analyticsLog: [log, ...state.analyticsLog],
        }));

        return log;
      },
    }),
    {
      name: STORAGE_KEY,
      storage,
      partialize: (state) => ({
        users: state.users,
        receipts: state.receipts,
        transactions: state.transactions,
        budgets: state.budgets,
        analyticsLog: state.analyticsLog,
        currentUserId: state.currentUserId,
      }),
    },
  ),
);

export const defaultCategories = DEFAULT_CATEGORIES;

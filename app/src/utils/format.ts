import { format, parseISO } from 'date-fns';
import type { Transaction, TransactionType } from '@/store/use-app-store';

export const formatCurrency = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);

export const formatDate = (value: string | Date, pattern = 'MMM dd, yyyy') =>
  format(typeof value === 'string' ? parseISO(value) : value, pattern);

export const calculateTotal = (transactions: Transaction[], type: TransactionType) =>
  transactions
    .filter((transaction) => transaction.type === type)
    .reduce((total, transaction) => total + transaction.amount, 0);

export const calculateNet = (transactions: Transaction[]) =>
  calculateTotal(transactions, 'income') - calculateTotal(transactions, 'expense');

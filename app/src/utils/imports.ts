'use client';

import { addDays, subDays } from 'date-fns';
import { nanoid } from 'nanoid';
import type { Transaction, User } from '@/store/use-app-store';

const SAMPLE_MERCHANTS: Record<string, string[]> = {
  Food: ['WholeFoods Market', 'Fresh Bite Café', 'Green Bowl'],
  Transportation: ['Metro Transit', 'LiftRide', 'QuickFuel'],
  Entertainment: ['Sunset Cinema', 'PlayVerse Arcade', 'City Events'],
  Utilities: ['City Power & Light', 'PureWater Co.', 'FiberNet'],
  Healthcare: ['Wellness Clinic', 'PharmaPlus', 'DentalCare'],
  Travel: ['Skylink Airlines', 'Harbor Hotels', 'Explorer Tours'],
  Savings: ['High Yield Savings', 'FutureFund'],
  Rent: ['Downtown Properties'],
};

const FALLBACK_MERCHANTS = ['Everyday Store', 'Lifestyle Market', 'Essential Goods'];

const randomAmount = (category: string) => {
  switch (category) {
    case 'Salary':
      return Number((2000 + Math.random() * 2000).toFixed(2));
    case 'Rent':
      return Number((900 + Math.random() * 600).toFixed(2));
    case 'Savings':
      return Number((150 + Math.random() * 250).toFixed(2));
    default:
      return Number((20 + Math.random() * 180).toFixed(2));
  }
};

const pickMerchant = (category: string) => {
  const list = SAMPLE_MERCHANTS[category] ?? FALLBACK_MERCHANTS;
  return list[Math.floor(Math.random() * list.length)];
};

export function generateImportedTransactions(user: User): Transaction[] {
  const today = new Date();
  const baseDate = subDays(today, 14);
  const categories = user.categories;
  const transactions: Transaction[] = [];

  for (let i = 0; i < 6; i += 1) {
    const category = categories[Math.floor(Math.random() * categories.length)];
    const type = category === 'Salary' || category === 'Savings' ? 'income' : 'expense';
    const amount = randomAmount(category);
    const date = addDays(baseDate, Math.floor(Math.random() * 14));

    transactions.push({
      id: nanoid(),
      userId: user.id,
      type,
      category,
      amount,
      date: date.toISOString(),
      notes:
        type === 'income'
          ? `${pickMerchant(category)} automated deposit`
          : `${pickMerchant(category)} automatic sync`,
      source: 'imported',
      createdAt: new Date().toISOString(),
    });
  }

  return transactions;
}

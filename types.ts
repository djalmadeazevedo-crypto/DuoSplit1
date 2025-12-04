export enum SplitType {
  EQUAL = 'EQUAL', // 50/50
  FULL_FOR_OTHER = 'FULL_FOR_OTHER', // Paid fully for the other person
}

export enum PaymentMethod {
  CREDIT = 'CREDIT',
  DEBIT = 'DEBIT',
}

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface Expense {
  id: string;
  amount: number;
  description: string;
  category: string;
  date: string; // ISO date string
  payerId: string;
  splitType: SplitType;
  timestamp: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  isSettled?: boolean; // New field to track settlement status
}

export interface ExpenseSummary {
  totalPaidA: number;
  totalPaidB: number;
  netBalance: number; // Positive: B owes A, Negative: A owes B
}

export interface ReceiptData {
  amount?: number;
  description?: string;
  date?: string;
  category?: string;
}

export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ADD_EXPENSE = 'ADD_EXPENSE',
  REPORTS = 'REPORTS',
  ANALYTICS = 'ANALYTICS',
}
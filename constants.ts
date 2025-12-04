import { User } from './types';
import { Home, PlusCircle, Calendar, PieChart } from 'lucide-react';

export const USERS: [User, User] = [
  { id: 'user_a', name: 'Djalma', color: 'bg-emerald-500' },
  { id: 'user_b', name: 'Cassia', color: 'bg-blue-500' },
];

export const CATEGORIES = [
  'Groceries',
  'Dining Out',
  'Rent/Mortgage',
  'Utilities',
  'Transportation',
  'Fuel',
  'Parking',
  'Vehicles',
  'Entertainment',
  'Health',
  'Djalma',
  'Cassia',
  'Pets',
  'Shopping',
  'Travel',
  'Other',
];

export const NAV_ITEMS = [
  { id: 'DASHBOARD', label: 'Home', icon: Home },
  { id: 'ADD_EXPENSE', label: 'Add', icon: PlusCircle },
  { id: 'REPORTS', label: 'Reports', icon: Calendar },
  { id: 'ANALYTICS', label: 'Insights', icon: PieChart },
] as const;
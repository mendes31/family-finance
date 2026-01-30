export type UserRole = 'USER' | 'ADMIN';

export type TransactionType = 'income' | 'expense' | 'investment';

export type PaymentMethod = 'card' | 'pix' | 'cash' | 'boleto' | 'carne' | 'transfer';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Family {
  id: string;
  name: string;
  createdAt: Date;
}

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon?: string;
  color?: string;
}

export interface CreditCard {
  id: string;
  name: string;
  brand: string;
  holderId: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  color?: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  date: Date;
  categoryId: string;
  userId: string;
  paymentMethod: PaymentMethod;
  cardId?: string;
  isInstallment: boolean;
  totalInstallments?: number;
  currentInstallment?: number;
  installmentGroupId?: string;
  notes?: string;
  attachmentUrl?: string;
  createdAt: Date;
}

export interface Budget {
  id: string;
  categoryId: string;
  userId?: string;
  familyId?: string;
  month: number;
  year: number;
  limit: number;
  spent: number;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline: Date;
  familyId: string;
  icon?: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpenses: number;
  totalInvestments: number;
  balance: number;
  monthlyChange: number;
}

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'card', label: 'Cartão', icon: 'CreditCard' },
  { value: 'pix', label: 'PIX', icon: 'Zap' },
  { value: 'cash', label: 'Dinheiro', icon: 'Banknote' },
  { value: 'boleto', label: 'Boleto', icon: 'FileText' },
  { value: 'carne', label: 'Carnê', icon: 'BookOpen' },
  { value: 'transfer', label: 'Transferência', icon: 'ArrowRightLeft' },
];

export const CARD_BRANDS = [
  'Visa',
  'Mastercard',
  'Elo',
  'American Express',
  'Hipercard',
  'Diners Club',
];

export const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  // Income
  { name: 'Salário', type: 'income', icon: 'Briefcase', color: '#22c55e' },
  { name: 'Freelance', type: 'income', icon: 'Laptop', color: '#10b981' },
  { name: 'Investimentos', type: 'income', icon: 'TrendingUp', color: '#14b8a6' },
  { name: 'Outros', type: 'income', icon: 'Plus', color: '#06b6d4' },
  // Expenses
  { name: 'Alimentação', type: 'expense', icon: 'UtensilsCrossed', color: '#ef4444' },
  { name: 'Transporte', type: 'expense', icon: 'Car', color: '#f97316' },
  { name: 'Moradia', type: 'expense', icon: 'Home', color: '#f59e0b' },
  { name: 'Saúde', type: 'expense', icon: 'Heart', color: '#ec4899' },
  { name: 'Educação', type: 'expense', icon: 'GraduationCap', color: '#8b5cf6' },
  { name: 'Lazer', type: 'expense', icon: 'Gamepad2', color: '#6366f1' },
  { name: 'Compras', type: 'expense', icon: 'ShoppingBag', color: '#a855f7' },
  { name: 'Contas', type: 'expense', icon: 'Receipt', color: '#d946ef' },
  // Investments
  { name: 'Renda Fixa', type: 'investment', icon: 'Lock', color: '#3b82f6' },
  { name: 'Ações', type: 'investment', icon: 'LineChart', color: '#0ea5e9' },
  { name: 'Fundos', type: 'investment', icon: 'PieChart', color: '#06b6d4' },
  { name: 'Criptomoedas', type: 'investment', icon: 'Bitcoin', color: '#f59e0b' },
];

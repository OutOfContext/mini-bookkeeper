export interface User {
  id: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
}

export interface QuickExpense {
  id: string;
  name: string;
  defaultAmount: number;
  category: string;
  isActive: boolean;
  color?: string;
}

export interface Session {
  id: string;
  date: string; // YYYY-MM-DD format
  sessionName: string; // e.g., "Morning Rush", "Lunch", "Evening", etc.
  startTime: Date;
  endTime?: Date;
  isActive: boolean;
  isClosed: boolean;
  totalRevenue: number;
  totalExpenses: number;
  cashSales: number;
  cardSales: number;
  notes?: string;
}

export interface MenuItemIngredient {
  inventoryItemId: string;
  quantity: number; // How much of this ingredient is needed
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  soldCount: number;
  category?: string;
  ingredients: MenuItemIngredient[]; // Recipe: which inventory items and how much
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  hourlyWage: number;
  isActive: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  unit: string;
  stock: number;
  minStock: number;
  purchasePrice: number;
}

export interface DayRecord {
  date: string;
  startCash: number;
  salesCash: number;
  salesCard: number;
  expenses: number;
  endCash: number;
  actualCash?: number;
  difference?: number;
  dayStarted: boolean;
  dayClosed: boolean;
  finalRevenue?: number;
  finalExpenses?: number;
  finalStaffCosts?: number;
  finalProfit?: number;
}

export interface Sale {
  id: string;
  sessionId: string; // Link to Session
  menuItemId: string;
  amount: number;
  paymentType: 'cash' | 'card';
  timestamp: Date;
  price: number;
}

export interface Shift {
  id: string;
  employeeId: string;
  start: Date;
  end?: Date;
  duration?: number;
  calculatedWage: number;
}

export interface InventoryChange {
  id: string;
  inventoryItemId: string;
  change: number;
  reason: 'delivery' | 'consumption' | 'sale' | 'adjustment';
  timestamp: Date;
  notes?: string;
}

export interface Expense {
  id: string;
  sessionId: string; // Link to Session
  description: string;
  amount: number;
  category: string;
  timestamp: Date;
  isRecurring?: boolean;
}

export type PaymentType = 'cash' | 'card';

export interface DashboardStats {
  todayRevenue: number;
  todayExpenses: number;
  todayProfit: number;
  cashBalance: number;
  cardSales: number;
  activeEmployees: number;
  lowStockItems: number;
  todayItemsSold: number;
}

export interface ChefReportData {
  period: 'day' | 'week' | 'month';
  startDate: Date;
  endDate: Date;
  totalRevenue: number;
  totalExpenses: number;
  staffCosts: number;
  profit: number;
  cashSales: number;
  cardSales: number;
  topSellingItems: Array<{ name: string; count: number; revenue: number }>;
  inventoryWarnings: Array<{ name: string; stock: number; minStock: number }>;
}
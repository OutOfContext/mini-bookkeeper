import Dexie, { Table } from 'dexie';
import { 
  MenuItem, 
  Employee, 
  InventoryItem, 
  DayRecord, 
  Sale, 
  Shift, 
  InventoryChange, 
  Expense,
  Session,
  QuickExpense,
  User 
} from '../types';

export class BookkeeperDB extends Dexie {
  menuItems!: Table<MenuItem>;
  employees!: Table<Employee>;
  inventoryItems!: Table<InventoryItem>;
  dayRecords!: Table<DayRecord>;
  sessions!: Table<Session>;
  sales!: Table<Sale>;
  shifts!: Table<Shift>;
  inventoryChanges!: Table<InventoryChange>;
  expenses!: Table<Expense>;
  quickExpenses!: Table<QuickExpense>;
  users!: Table<User>;

  constructor() {
    super('BookkeeperDB');
    
    this.version(4).stores({
      menuItems: 'id, name, price, category',
      employees: 'id, name, role, isActive',
      inventoryItems: 'id, name, stock, minStock',
      dayRecords: 'date, startCash, endCash',
      sessions: 'id, date, isActive, isClosed',
      sales: 'id, sessionId, menuItemId, paymentType, timestamp',
      shifts: 'id, employeeId, start, end',
      inventoryChanges: 'id, inventoryItemId, timestamp, reason',
      expenses: 'id, sessionId, category, timestamp, amount',
      quickExpenses: 'id, name, category, isActive, defaultAmount, color',
      users: 'id, username, isActive, createdAt'
    });
  }
}

export const db = new BookkeeperDB();

// Simple password hashing (for client-side security - basic protection)
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'restaurant-salt-key');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// User Authentication Functions
export const createUser = async (username: string, password: string): Promise<string> => {
  try {
    // Check if username already exists
    const existingUser = await db.users.where('username').equals(username).first();
    if (existingUser) {
      throw new Error('Username already exists');
    }

    const passwordHash = await hashPassword(password);
    const userId = `user_${Date.now()}`;
    
    const newUser: User = {
      id: userId,
      username: username.toLowerCase().trim(),
      passwordHash,
      createdAt: new Date(),
      isActive: true
    };

    await db.users.add(newUser);
    console.log(`✅ User created: ${username}`);
    return userId;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

export const authenticateUser = async (username: string, password: string): Promise<User | null> => {
  try {
    const user = await db.users.where('username').equals(username.toLowerCase().trim()).first();
    if (!user || !user.isActive) {
      return null;
    }

    const passwordHash = await hashPassword(password);
    if (user.passwordHash !== passwordHash) {
      return null;
    }

    // Update last login
    await db.users.update(user.id, { lastLogin: new Date() });
    
    return user;
  } catch (error) {
    console.error('Error authenticating user:', error);
    return null;
  }
};

export const changeUserPassword = async (userId: string, newPassword: string): Promise<void> => {
  try {
    const passwordHash = await hashPassword(newPassword);
    await db.users.update(userId, { passwordHash });
    console.log(`✅ Password changed for user: ${userId}`);
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export const deleteUser = async (userId: string): Promise<void> => {
  try {
    await db.users.delete(userId);
    console.log(`✅ User deleted: ${userId}`);
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

export const getAllUsers = async (): Promise<User[]> => {
  try {
    return await db.users.orderBy('createdAt').toArray();
  } catch (error) {
    console.error('Error getting users:', error);
    return [];
  }
};

// Initialize default admin user
export const initializeDefaultUser = async () => {
  try {
    const userCount = await db.users.count();
    if (userCount === 0) {
      await createUser('admin', 'admin123');
      console.log('✅ Default admin user created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('Error initializing default user:', error);
  }
};

// Initialize with sample data
export const initializeSampleData = async () => {
  try {
    // Initialize default user first
    await initializeDefaultUser();
    
    // Check if data already exists
    const menuCount = await db.menuItems.count();
    if (menuCount > 0) return;

    // Sample Menu Items with ingredients
    const sampleMenuItems: MenuItem[] = [
      { 
        id: '1', 
        name: 'Margherita Pizza', 
        price: 12.50, 
        soldCount: 0, 
        category: 'Pizza',
        ingredients: [
          { inventoryItemId: '3', quantity: 0.3 }, // 300g Flour
          { inventoryItemId: '1', quantity: 0.2 }, // 200g Tomatoes
          { inventoryItemId: '2', quantity: 0.15 }, // 150g Mozzarella
          { inventoryItemId: '4', quantity: 0.02 }  // 20ml Olive Oil
        ]
      },
      { 
        id: '2', 
        name: 'Pepperoni Pizza', 
        price: 14.50, 
        soldCount: 0, 
        category: 'Pizza',
        ingredients: [
          { inventoryItemId: '3', quantity: 0.3 }, // 300g Flour
          { inventoryItemId: '1', quantity: 0.2 }, // 200g Tomatoes
          { inventoryItemId: '2', quantity: 0.15 }, // 150g Mozzarella
          { inventoryItemId: '4', quantity: 0.02 }  // 20ml Olive Oil
        ]
      },
      { 
        id: '3', 
        name: 'Caesar Salad', 
        price: 8.50, 
        soldCount: 0, 
        category: 'Salad',
        ingredients: [
          { inventoryItemId: '5', quantity: 2 }, // 2 pieces Lettuce
          { inventoryItemId: '4', quantity: 0.03 } // 30ml Olive Oil
        ]
      },
      { 
        id: '4', 
        name: 'Pasta Carbonara', 
        price: 13.00, 
        soldCount: 0, 
        category: 'Pasta',
        ingredients: [
          { inventoryItemId: '6', quantity: 0.25 }, // 250g Pasta
          { inventoryItemId: '4', quantity: 0.02 }  // 20ml Olive Oil
        ]
      },
      { id: '5', name: 'Tiramisu', price: 6.50, soldCount: 0, category: 'Dessert', ingredients: [] },
      { id: '6', name: 'Cappuccino', price: 3.50, soldCount: 0, category: 'Beverage', ingredients: [] },
      { id: '7', name: 'Beer', price: 4.50, soldCount: 0, category: 'Beverage', ingredients: [] },
      { id: '8', name: 'House Wine', price: 5.50, soldCount: 0, category: 'Beverage', ingredients: [] }
    ];

    // Sample Employees
    const sampleEmployees: Employee[] = [
      { id: '1', name: 'Mario Rossi', role: 'Chef', hourlyWage: 18.00, isActive: true },
      { id: '2', name: 'Luigi Bianchi', role: 'Waiter', hourlyWage: 12.50, isActive: true },
      { id: '3', name: 'Giulia Verde', role: 'Waitress', hourlyWage: 12.50, isActive: true },
      { id: '4', name: 'Franco Neri', role: 'Cook', hourlyWage: 15.00, isActive: true }
    ];

    // Sample Inventory Items
    const sampleInventoryItems: InventoryItem[] = [
      { id: '1', name: 'Tomatoes', unit: 'kg', stock: 25, minStock: 5, purchasePrice: 2.50 },
      { id: '2', name: 'Mozzarella', unit: 'kg', stock: 15, minStock: 3, purchasePrice: 8.00 },
      { id: '3', name: 'Flour', unit: 'kg', stock: 50, minStock: 10, purchasePrice: 1.20 },
      { id: '4', name: 'Olive Oil', unit: 'L', stock: 8, minStock: 2, purchasePrice: 12.00 },
      { id: '5', name: 'Lettuce', unit: 'piece', stock: 20, minStock: 5, purchasePrice: 1.50 },
      { id: '6', name: 'Pasta', unit: 'kg', stock: 30, minStock: 8, purchasePrice: 3.50 }
    ];

    // Today's Day Record - not started by default
    const today = new Date().toISOString().split('T')[0];
    const todayRecord: DayRecord = {
      date: today,
      startCash: 200.00,
      salesCash: 0,
      salesCard: 0,
      expenses: 0,
      endCash: 200.00,
      dayStarted: false,
      dayClosed: false
    };

    await db.menuItems.bulkAdd(sampleMenuItems);
    await db.employees.bulkAdd(sampleEmployees);
    await db.inventoryItems.bulkAdd(sampleInventoryItems);
    await db.dayRecords.add(todayRecord);

    // Initialize quick expenses if none exist
    const quickExpenseCount = await db.quickExpenses.count();
    if (quickExpenseCount === 0) {
      const sampleQuickExpenses: QuickExpense[] = [
        { 
          id: 'qe_1', 
          name: 'Gemüse', 
          defaultAmount: 25.00, 
          category: 'Food & Ingredients', 
          isActive: true, 
          color: 'green' 
        },
        { 
          id: 'qe_2', 
          name: 'Reinigungsmittel', 
          defaultAmount: 12.00, 
          category: 'Supplies', 
          isActive: true, 
          color: 'blue' 
        },
        { 
          id: 'qe_3', 
          name: 'Getränke', 
          defaultAmount: 30.00, 
          category: 'Food & Ingredients', 
          isActive: true, 
          color: 'orange' 
        },
        { 
          id: 'qe_4', 
          name: 'Strom', 
          defaultAmount: 150.00, 
          category: 'Utilities', 
          isActive: true, 
          color: 'yellow' 
        },
        { 
          id: 'qe_5', 
          name: 'Gas', 
          defaultAmount: 80.00, 
          category: 'Utilities', 
          isActive: true, 
          color: 'red' 
        },
        { 
          id: 'qe_6', 
          name: 'Reparaturen', 
          defaultAmount: 50.00, 
          category: 'Maintenance', 
          isActive: true, 
          color: 'purple' 
        }
      ];
      
      // Add each expense individually to avoid BulkError
      for (const expense of sampleQuickExpenses) {
        try {
          await db.quickExpenses.add(expense);
        } catch (error) {
          console.warn(`Error adding quick expense ${expense.name}:`, error);
        }
      }
    }

    console.log('Sample data initialized successfully');
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
};

// Session Management Functions
export const createNewSession = async (sessionName: string = 'New Session') => {
  try {
    const today = new Date();
    const dateString = today.toISOString().split('T')[0];
    
    // Close any active sessions for today
    const activeSessions = await db.sessions.where('date').equals(dateString).and(session => session.isActive).toArray();
    for (const session of activeSessions) {
      await db.sessions.update(session.id, { isActive: false });
    }
    
    const sessionId = `session_${dateString}_${Date.now()}`;
    const newSession: Session = {
      id: sessionId,
      date: dateString,
      sessionName,
      startTime: today,
      isActive: true,
      isClosed: false,
      totalRevenue: 0,
      totalExpenses: 0,
      cashSales: 0,
      cardSales: 0
    };
    
    await db.sessions.add(newSession);
    console.log(`✅ New session created: ${sessionName}`);
    return sessionId;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
};

export const getActiveSession = async (): Promise<Session | null> => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const activeSession = await db.sessions.where('date').equals(today).and(session => session.isActive).first();
    return activeSession || null;
  } catch (error) {
    console.error('Error getting active session:', error);
    return null;
  }
};

export const closeSession = async (sessionId: string) => {
  try {
    // Calculate session totals
    const sales = await db.sales.where('sessionId').equals(sessionId).toArray();
    const expenses = await db.expenses.where('sessionId').equals(sessionId).toArray();
    
    const totalRevenue = sales.reduce((sum, sale) => sum + (sale.price * sale.amount), 0);
    const cashSales = sales.filter(s => s.paymentType === 'cash').reduce((sum, sale) => sum + (sale.price * sale.amount), 0);
    const cardSales = sales.filter(s => s.paymentType === 'card').reduce((sum, sale) => sum + (sale.price * sale.amount), 0);
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    await db.sessions.update(sessionId, {
      isActive: false,
      isClosed: true,
      endTime: new Date(),
      totalRevenue,
      totalExpenses,
      cashSales,
      cardSales
    });
    
    console.log(`✅ Session closed: ${sessionId}`);
  } catch (error) {
    console.error('Error closing session:', error);
    throw error;
  }
};

export const deleteAllSessionsForDate = async (date: string) => {
  try {
    const sessions = await db.sessions.where('date').equals(date).toArray();
    
    for (const session of sessions) {
      // Delete all data related to this session
      await db.sales.where('sessionId').equals(session.id).delete();
      await db.expenses.where('sessionId').equals(session.id).delete();
      await db.sessions.delete(session.id);
    }
    
    // Delete all shifts for this date
    // Shifts are stored with timestamp, so we need to delete by date range
    const dateStart = new Date(date + 'T00:00:00.000Z');
    const dateEnd = new Date(date + 'T23:59:59.999Z');
    
    await db.shifts
      .where('start')
      .between(dateStart, dateEnd)
      .delete();
    
    // Reset all menu item sold counts to 0
    // This ensures "Items Sold Today" and "Unique Items Sold" stats are reset
    const menuItems = await db.menuItems.toArray();
    for (const item of menuItems) {
      await db.menuItems.update(item.id, { soldCount: 0 });
    }
    
    // Reset day record for this date (optional - keeps start cash but resets everything else)
    const dayRecord = await db.dayRecords.get(date);
    if (dayRecord) {
      await db.dayRecords.update(date, {
        salesCash: 0,
        salesCard: 0,
        expenses: 0,
        endCash: dayRecord.startCash, // Reset to start cash
        actualCash: undefined,
        difference: undefined,
        finalRevenue: 0,
        finalExpenses: 0,
        finalStaffCosts: 0,
        finalProfit: 0,
        dayClosed: false
      });
    }
    
    console.log(`✅ All sessions deleted for date: ${date}`);
    console.log(`✅ All shifts deleted for date: ${date}`);
    console.log(`✅ All menu item sold counts reset to 0`);
    console.log(`✅ Day record reset for date: ${date}`);
  } catch (error) {
    console.error('Error deleting sessions:', error);
    throw error;
  }
};
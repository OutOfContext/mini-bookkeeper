import { useState, useEffect } from 'react';
import { db } from '../services/database';
import { 
  MenuItem, 
  Employee, 
  InventoryItem, 
  DayRecord, 
  Sale, 
  Shift, 
  Expense, 
  DashboardStats,
  ChefReportData 
} from '../types';

export const useMenuItems = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMenuItems = async () => {
    try {
      const items = await db.menuItems.toArray();
      setMenuItems(items);
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addMenuItem = async (item: Omit<MenuItem, 'id'>) => {
    const id = Date.now().toString();
    await db.menuItems.add({ ...item, id });
    fetchMenuItems();
  };

  const updateMenuItem = async (id: string, updates: Partial<MenuItem>) => {
    await db.menuItems.update(id, updates);
    fetchMenuItems();
  };

  const deleteMenuItem = async (id: string) => {
    await db.menuItems.delete(id);
    fetchMenuItems();
  };

  useEffect(() => {
    fetchMenuItems();
  }, []);

  return { menuItems, loading, addMenuItem, updateMenuItem, deleteMenuItem, refetch: fetchMenuItems };
};

export const useEmployees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const items = await db.employees.toArray();
      setEmployees(items);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const addEmployee = async (employee: Omit<Employee, 'id'>) => {
    const id = Date.now().toString();
    await db.employees.add({ ...employee, id });
    fetchEmployees();
  };

  const updateEmployee = async (id: string, updates: Partial<Employee>) => {
    await db.employees.update(id, updates);
    fetchEmployees();
  };

  const deleteEmployee = async (id: string) => {
    await db.employees.delete(id);
    fetchEmployees();
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  return { employees, loading, addEmployee, updateEmployee, deleteEmployee, refetch: fetchEmployees };
};

export const useInventoryItems = () => {
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventoryItems = async () => {
    try {
      const items = await db.inventoryItems.toArray();
      setInventoryItems(items);
    } catch (error) {
      console.error('Error fetching inventory items:', error);
    } finally {
      setLoading(false);
    }
  };

  const addInventoryItem = async (item: Omit<InventoryItem, 'id'>) => {
    const id = Date.now().toString();
    await db.inventoryItems.add({ ...item, id });
    fetchInventoryItems();
  };

  const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>) => {
    await db.inventoryItems.update(id, updates);
    fetchInventoryItems();
  };

  const deleteInventoryItem = async (id: string) => {
    await db.inventoryItems.delete(id);
    fetchInventoryItems();
  };

  useEffect(() => {
    fetchInventoryItems();
  }, []);

  return { inventoryItems, loading, addInventoryItem, updateInventoryItem, deleteInventoryItem, refetch: fetchInventoryItems };
};

export const useSales = () => {
  const recordSale = async (menuItemId: string, paymentType: 'cash' | 'card') => {
    try {
      const menuItem = await db.menuItems.get(menuItemId);
      if (!menuItem) throw new Error('Menu item not found');

      const sale: Sale = {
        id: Date.now().toString(),
        sessionId: 'temp_session', // TODO: Get from active session
        menuItemId,
        amount: 1,
        paymentType,
        timestamp: new Date(),
        price: menuItem.price
      };

      await db.sales.add(sale);
      
      // Update menu item sold count
      await db.menuItems.update(menuItemId, { 
        soldCount: menuItem.soldCount + 1 
      });

      // Update today's record
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = await db.dayRecords.get(today);
      
      if (todayRecord) {
        const updates = paymentType === 'cash' 
          ? { salesCash: todayRecord.salesCash + menuItem.price }
          : { salesCard: todayRecord.salesCard + menuItem.price };
        
        await db.dayRecords.update(today, updates);
      }

      return sale;
    } catch (error) {
      console.error('Error recording sale:', error);
      throw error;
    }
  };

  const getTodaySales = async (): Promise<Sale[]> => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return db.sales
      .where('timestamp')
      .between(today, tomorrow)
      .toArray();
  };

  return { recordSale, getTodaySales };
};

export const useDashboardStats = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const todayRecord = await db.dayRecords.get(today);
      
      const activeShifts = await db.shifts.toArray();
      const activeEmployees = activeShifts.filter(shift => !shift.end).length;

      const allInventoryItems = await db.inventoryItems.toArray();
      const lowStockItems = allInventoryItems.filter(item => item.stock <= item.minStock).length;

      // Calculate total items sold today from menu items
      const allMenuItems = await db.menuItems.toArray();
      const todayItemsSold = allMenuItems.reduce((total, item) => total + item.soldCount, 0);

      // Calculate revenue from menu items (simplified sales system)
      const calculatedRevenue = allMenuItems.reduce((total, item) => total + (item.soldCount * item.price), 0);

      if (todayRecord) {
        setStats({
          todayRevenue: calculatedRevenue,
          todayExpenses: todayRecord.expenses,
          todayProfit: calculatedRevenue - todayRecord.expenses,
          cashBalance: 0, // Not tracked in simplified system
          cardSales: 0, // Not tracked in simplified system
          activeEmployees,
          lowStockItems,
          todayItemsSold
        });
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return { stats, loading, refetch: fetchStats };
};
import { db } from './database';
import { Sale, Expense } from '../types';

export const generateTodaySessionData = async (sessionId: string) => {
  try {
    console.log(`Generating sample data for session: ${sessionId}`);
    
    const menuItems = await db.menuItems.toArray();
    const employees = await db.employees.toArray();
    
    if (menuItems.length === 0 || employees.length === 0) {
      console.error('Need menu items and employees first');
      return;
    }

    const today = new Date();
    
    // Generate multiple sales for the session
    let totalRevenue = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;
    
    for (let i = 0; i < menuItems.length; i++) {
      const item = menuItems[i];
      const salesCount = 1 + Math.floor(Math.random() * 3); // 1-3 sales per item
      
      for (let j = 0; j < salesCount; j++) {
        const saleTime = new Date(today);
        saleTime.setMinutes(saleTime.getMinutes() + Math.floor(Math.random() * 60));
        
        const paymentType = Math.random() < 0.6 ? 'cash' : 'card';
        const sale = {
          id: `${sessionId}_sale_${item.id}_${j}`,
          sessionId: sessionId,
          menuItemId: item.id,
          amount: 1,
          paymentType: paymentType as 'cash' | 'card',
          timestamp: saleTime,
          price: item.price
        };
        
        await db.sales.add(sale);
        totalRevenue += item.price;
        
        if (paymentType === 'cash') {
          cashRevenue += item.price;
        } else {
          cardRevenue += item.price;
        }
      }
    }
    
    // Generate some expenses for the session
    const expenses = [
      { description: 'Zutaten', amount: 15.50, category: 'Food & Ingredients' },
      { description: 'Reinigungsmittel', amount: 8.00, category: 'Supplies' }
    ];
    
    let totalExpenses = 0;
    for (const expense of expenses) {
      const expenseTime = new Date(today);
      expenseTime.setMinutes(expenseTime.getMinutes() + Math.floor(Math.random() * 30));
      
      await db.expenses.add({
        id: `${sessionId}_expense_${expense.description.replace(' ', '_')}`,
        sessionId: sessionId,
        description: expense.description,
        amount: expense.amount,
        category: expense.category,
        timestamp: expenseTime
      });
      
      totalExpenses += expense.amount;
    }
    
    console.log(`✅ Generated session data: €${totalRevenue.toFixed(2)} revenue, €${totalExpenses.toFixed(2)} expenses`);
    return { totalRevenue, totalExpenses, cashRevenue, cardRevenue };
    
  } catch (error) {
    console.error('Error generating session data:', error);
    throw error;
  }
};

export const clearAllTestData = async () => {
  try {
    console.log('Clearing all test data...');
    
    // Clear all tables except menu items, employees, and inventory items (keep the base data)
    await db.dayRecords.clear();
    await db.sessions.clear();
    await db.sales.clear();
    await db.expenses.clear();
    await db.shifts.clear();
    await db.inventoryChanges.clear();
    
    // Reset menu item sold counts
    const menuItems = await db.menuItems.toArray();
    for (const item of menuItems) {
      await db.menuItems.update(item.id, { soldCount: 0 });
    }
    
    console.log('✅ All test data cleared');
  } catch (error) {
    console.error('Error clearing test data:', error);
    throw error;
  }
};
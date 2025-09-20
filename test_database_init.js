// Quick database initialization test
import { db, initializeSampleData } from './src/services/database.ts';

const testDatabaseInit = async () => {
  try {
    console.log('🔧 Testing database initialization...');
    
    // Clear existing data
    await db.delete();
    await db.open();
    
    console.log('📊 Database version:', db.verno);
    
    // Initialize sample data  
    await initializeSampleData();
    
    // Test quick expenses
    const quickExpenses = await db.quickExpenses.toArray();
    console.log('✅ Quick Expenses count:', quickExpenses.length);
    console.log('📋 Quick Expenses:', quickExpenses.map(qe => ({ name: qe.name, amount: qe.defaultAmount })));
    
    // Test menu items
    const menuItems = await db.menuItems.toArray();
    console.log('✅ Menu Items count:', menuItems.length);
    console.log('📋 Menu Items with soldCount:', menuItems.map(item => ({ name: item.name, soldCount: item.soldCount })));
    
    console.log('🎉 Database initialization test completed successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization test failed:', error);
  }
};

testDatabaseInit();
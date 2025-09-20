import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create test users
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      passwordHash: hashedPassword,
    },
  });

  const manager = await prisma.user.upsert({
    where: { username: 'manager' },
    update: {},
    create: {
      username: 'manager',
      passwordHash: hashedPassword,
    },
  });

  console.log('👤 Created users:', { admin, manager });

  // Create menu categories
  const beverages = await prisma.menuCategory.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages' },
  });

  const mainCourses = await prisma.menuCategory.upsert({
    where: { name: 'Main Courses' },
    update: {},
    create: { name: 'Main Courses' },
  });

  const appetizers = await prisma.menuCategory.upsert({
    where: { name: 'Appetizers' },
    update: {},
    create: { name: 'Appetizers' },
  });

  const desserts = await prisma.menuCategory.upsert({
    where: { name: 'Desserts' },
    update: {},
    create: { name: 'Desserts' },
  });

  console.log('🍽️ Created menu categories');

  // Create menu items
  const menuItems = [
    // Beverages
    { name: 'Coffee', price: 3.50, categoryId: beverages.id },
    { name: 'Tea', price: 2.50, categoryId: beverages.id },
    { name: 'Orange Juice', price: 4.00, categoryId: beverages.id },
    { name: 'Coca Cola', price: 3.00, categoryId: beverages.id },
    { name: 'Water', price: 2.00, categoryId: beverages.id },
    
    // Main Courses
    { name: 'Grilled Chicken', price: 18.50, categoryId: mainCourses.id },
    { name: 'Beef Steak', price: 25.00, categoryId: mainCourses.id },
    { name: 'Salmon Fillet', price: 22.00, categoryId: mainCourses.id },
    { name: 'Vegetarian Pasta', price: 15.50, categoryId: mainCourses.id },
    { name: 'Burger & Fries', price: 16.00, categoryId: mainCourses.id },
    
    // Appetizers
    { name: 'Caesar Salad', price: 8.50, categoryId: appetizers.id },
    { name: 'Soup of the Day', price: 6.00, categoryId: appetizers.id },
    { name: 'Bruschetta', price: 7.50, categoryId: appetizers.id },
    { name: 'Chicken Wings', price: 12.00, categoryId: appetizers.id },
    
    // Desserts
    { name: 'Chocolate Cake', price: 6.50, categoryId: desserts.id },
    { name: 'Ice Cream', price: 4.50, categoryId: desserts.id },
    { name: 'Tiramisu', price: 7.00, categoryId: desserts.id },
  ];

  for (const item of menuItems) {
    await prisma.menuItem.upsert({
      where: { 
        id: 'temp-id-' + item.name + '-' + item.categoryId
      },
      update: {},
      create: item,
    });
  }

  console.log('🍕 Created menu items');

  // Create employees
  const employees = [
    { name: 'John Doe', hourlyWage: 15.50 },
    { name: 'Jane Smith', hourlyWage: 16.00 },
    { name: 'Mike Johnson', hourlyWage: 14.75 },
    { name: 'Sarah Wilson', hourlyWage: 17.25 },
  ];

  for (const employee of employees) {
    await prisma.employee.upsert({
      where: { id: 'temp-emp-' + employee.name },
      update: {},
      create: employee,
    });
  }

  console.log('👥 Created employees');

  // Create inventory items
  const inventoryItems = [
    { name: 'Coffee Beans', unit: 'kg', stock: 25.5, minStock: 5.0, purchasePrice: 12.50 },
    { name: 'Chicken Breast', unit: 'kg', stock: 15.0, minStock: 3.0, purchasePrice: 8.90 },
    { name: 'Beef', unit: 'kg', stock: 8.5, minStock: 2.0, purchasePrice: 18.50 },
    { name: 'Salmon', unit: 'kg', stock: 6.0, minStock: 2.0, purchasePrice: 22.00 },
    { name: 'Pasta', unit: 'kg', stock: 20.0, minStock: 5.0, purchasePrice: 3.50 },
    { name: 'Tomatoes', unit: 'kg', stock: 12.0, minStock: 3.0, purchasePrice: 4.20 },
    { name: 'Lettuce', unit: 'pieces', stock: 25, minStock: 5, purchasePrice: 2.50 },
    { name: 'Onions', unit: 'kg', stock: 8.0, minStock: 2.0, purchasePrice: 2.80 },
    { name: 'Cooking Oil', unit: 'liters', stock: 15.0, minStock: 3.0, purchasePrice: 5.50 },
    { name: 'Paper Napkins', unit: 'packs', stock: 2, minStock: 5, purchasePrice: 8.00 }, // Low stock
  ];

  for (const item of inventoryItems) {
    await prisma.inventoryItem.upsert({
      where: { id: 'temp-inv-' + item.name },
      update: {},
      create: item,
    });
  }

  console.log('📦 Created inventory items');

  // Create some sample sales for today
  const today = new Date();
  const coffeeItem = await prisma.menuItem.findFirst({ where: { name: 'Coffee' } });
  const burgerItem = await prisma.menuItem.findFirst({ where: { name: 'Burger & Fries' } });
  
  if (coffeeItem && burgerItem) {
    await prisma.sale.createMany({
      data: [
        {
          menuItemId: coffeeItem.id,
          amount: 2,
          paymentType: 'CASH',
          userId: admin.id,
          timestamp: new Date(today.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
        },
        {
          menuItemId: burgerItem.id,
          amount: 1,
          paymentType: 'CARD',
          userId: manager.id,
          timestamp: new Date(today.getTime() - 1 * 60 * 60 * 1000), // 1 hour ago
        },
      ],
    });

    // Update sold counts
    await prisma.menuItem.update({
      where: { id: coffeeItem.id },
      data: { soldCount: { increment: 2 } }
    });
    
    await prisma.menuItem.update({
      where: { id: burgerItem.id },
      data: { soldCount: { increment: 1 } }
    });
  }

  // Create some sample expenses
  await prisma.expense.createMany({
    data: [
      {
        amount: 150.00,
        reason: 'Food Ingredients',
        userId: admin.id,
        timestamp: new Date(today.getTime() - 3 * 60 * 60 * 1000), // 3 hours ago
      },
      {
        amount: 75.50,
        reason: 'Utilities',
        userId: manager.id,
        timestamp: new Date(today.getTime() - 4 * 60 * 60 * 1000), // 4 hours ago
      },
    ],
  });

  console.log('💰 Created sample sales and expenses');

  console.log('✅ Database seeding completed successfully!');
  console.log('');
  console.log('Test users created:');
  console.log('- Username: admin, Password: password123');
  console.log('- Username: manager, Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
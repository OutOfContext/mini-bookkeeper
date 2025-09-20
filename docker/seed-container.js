// Container-specific seed script
// This runs only if no users exist in the database

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedDefaultUsers() {
  console.log('🌱 Starting container seeding...');

  try {
    // Check if users already exist
    const userCount = await prisma.user.count();
    
    if (userCount > 0) {
      console.log(`✅ Users already exist (${userCount} users found), skipping seed`);
      return;
    }

    console.log('📝 No users found, creating default users...');

    // Create default users
    const adminPasswordHash = await bcrypt.hash('password123', 10);
    const managerPasswordHash = await bcrypt.hash('password123', 10);

    await prisma.user.createMany({
      data: [
        {
          username: 'admin',
          passwordHash: adminPasswordHash,
          role: 'ADMIN'
        },
        {
          username: 'manager', 
          passwordHash: managerPasswordHash,
          role: 'MANAGER'
        }
      ]
    });

    console.log('✅ Default users created successfully:');
    console.log('   - Username: admin | Password: password123');
    console.log('   - Username: manager | Password: password123');

    // Create basic menu categories if none exist
    const categoryCount = await prisma.menuCategory.count();
    if (categoryCount === 0) {
      console.log('📝 Creating basic menu structure...');
      
      const appetizers = await prisma.menuCategory.create({
        data: { name: 'Appetizers' }
      });

      const mains = await prisma.menuCategory.create({
        data: { name: 'Main Courses' }
      });

      const beverages = await prisma.menuCategory.create({
        data: { name: 'Beverages' }
      });

      // Create some basic menu items
      await prisma.menuItem.createMany({
        data: [
          { name: 'Caesar Salad', price: 8.50, categoryId: appetizers.id },
          { name: 'Soup of the Day', price: 6.00, categoryId: appetizers.id },
          { name: 'Grilled Chicken', price: 18.50, categoryId: mains.id },
          { name: 'Pasta Bolognese', price: 14.50, categoryId: mains.id },
          { name: 'Coffee', price: 3.50, categoryId: beverages.id },
          { name: 'Tea', price: 2.50, categoryId: beverages.id }
        ]
      });

      console.log('✅ Basic menu structure created');
    }

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  seedDefaultUsers()
    .catch((e) => {
      console.error('❌ Seeding failed:', e);
      process.exit(1);
    });
}

module.exports = { seedDefaultUsers };
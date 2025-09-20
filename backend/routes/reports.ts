import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Chef Report - Day/Week/Month views
router.get('/chef', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { period = 'day', date } = req.query;
    
    let startDate: Date;
    let endDate: Date;

    const baseDate = date ? new Date(date as string) : new Date();

    switch (period) {
      case 'week':
        startDate = new Date(baseDate);
        startDate.setDate(baseDate.getDate() - baseDate.getDay()); // Start of week
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'month':
        startDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        endDate = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      default: // day
        startDate = new Date(baseDate);
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(baseDate);
        endDate.setHours(23, 59, 59, 999);
    }

    // Get sales data
    const sales = await prisma.sale.findMany({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      },
      include: {
        menuItem: {
          include: { category: true }
        }
      }
    });

    // Calculate revenue
    let totalRevenue = 0;
    let cashRevenue = 0;
    let cardRevenue = 0;
    const itemSales: { [key: string]: { name: string; category: string; count: number; revenue: number } } = {};

    sales.forEach(sale => {
      const saleAmount = sale.menuItem.price * sale.amount;
      totalRevenue += saleAmount;
      
      if (sale.paymentType === 'CASH') {
        cashRevenue += saleAmount;
      } else {
        cardRevenue += saleAmount;
      }

      // Track item sales
      const itemKey = sale.menuItem.id;
      if (!itemSales[itemKey]) {
        itemSales[itemKey] = {
          name: sale.menuItem.name,
          category: sale.menuItem.category.name,
          count: 0,
          revenue: 0
        };
      }
      itemSales[itemKey].count += sale.amount;
      itemSales[itemKey].revenue += saleAmount;
    });

    // Get expenses
    const expenses = await prisma.expense.aggregate({
      where: {
        timestamp: { gte: startDate, lte: endDate }
      },
      _sum: { amount: true }
    });
    const totalExpenses = expenses._sum.amount || 0;

    // Get staff costs
    const shifts = await prisma.shift.findMany({
      where: {
        startTime: { gte: startDate, lte: endDate }
      }
    });
    const totalStaffCosts = shifts.reduce((sum, shift) => sum + (shift.wage || 0), 0);

    // Calculate profit
    const totalCosts = totalExpenses + totalStaffCosts;
    const profit = totalRevenue - totalCosts;

    // Top selling items
    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Inventory warnings
    const lowStockItems = await prisma.inventoryItem.findMany({
      where: {
        stock: { lte: prisma.inventoryItem.fields.minStock }
      }
    });

    res.json({
      period,
      dateRange: { start: startDate, end: endDate },
      revenue: {
        total: totalRevenue,
        cash: cashRevenue,
        card: cardRevenue
      },
      costs: {
        expenses: totalExpenses,
        staff: totalStaffCosts,
        total: totalCosts
      },
      profit,
      topSellingItems: topItems,
      inventoryWarnings: lowStockItems.map(item => ({
        name: item.name,
        currentStock: item.stock,
        minStock: item.minStock,
        unit: item.unit
      }))
    });
  } catch (error) {
    console.error('Get chef report error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Daily Closing Report
router.get('/daily-closing', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get existing day record
    const existingRecord = await prisma.dayRecord.findFirst({
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      }
    });

    // Calculate today's data
    const sales = await prisma.sale.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay }
      },
      include: { menuItem: true }
    });

    let salesCash = 0;
    let salesCard = 0;
    sales.forEach(sale => {
      const amount = sale.menuItem.price * sale.amount;
      if (sale.paymentType === 'CASH') {
        salesCash += amount;
      } else {
        salesCard += amount;
      }
    });

    const expenses = await prisma.expense.aggregate({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    });
    const totalExpenses = expenses._sum.amount || 0;

    const shifts = await prisma.shift.findMany({
      where: {
        startTime: { gte: startOfDay, lte: endOfDay }
      }
    });
    const staffCosts = shifts.reduce((sum, shift) => sum + (shift.wage || 0), 0);

    // Get previous day's balance
    const previousDay = new Date(targetDate);
    previousDay.setDate(previousDay.getDate() - 1);
    const previousRecord = await prisma.dayRecord.findFirst({
      where: {
        date: {
          gte: new Date(previousDay.toDateString()),
          lt: startOfDay
        }
      },
      orderBy: { date: 'desc' }
    });

    const previousBalance = previousRecord?.endCash || 0;

    res.json({
      date: targetDate,
      previousBalance,
      sales: {
        cash: salesCash,
        card: salesCard,
        total: salesCash + salesCard
      },
      expenses: totalExpenses,
      staffCosts,
      expectedCash: previousBalance + salesCash - totalExpenses,
      actualCash: existingRecord?.endCash || null,
      difference: existingRecord ? (existingRecord.endCash - (previousBalance + salesCash - totalExpenses)) : null,
      isRecorded: !!existingRecord
    });
  } catch (error) {
    console.error('Get daily closing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Save Daily Closing
router.post('/daily-closing', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { date, startCash, actualCash } = req.body;
    
    if (!date || actualCash === undefined) {
      return res.status(400).json({ error: 'Date and actual cash are required' });
    }

    const targetDate = new Date(date);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Calculate the day's totals
    const sales = await prisma.sale.findMany({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay }
      },
      include: { menuItem: true }
    });

    let salesCash = 0;
    let salesCard = 0;
    sales.forEach(sale => {
      const amount = sale.menuItem.price * sale.amount;
      if (sale.paymentType === 'CASH') {
        salesCash += amount;
      } else {
        salesCard += amount;
      }
    });

    const expenses = await prisma.expense.aggregate({
      where: {
        timestamp: { gte: startOfDay, lte: endOfDay }
      },
      _sum: { amount: true }
    });
    const totalExpenses = expenses._sum.amount || 0;

    // Create or update day record
    const dayRecord = await prisma.dayRecord.upsert({
      where: {
        date: startOfDay
      },
      update: {
        startCash: parseFloat(startCash) || 0,
        salesCash,
        salesCard,
        expenses: totalExpenses,
        endCash: parseFloat(actualCash)
      },
      create: {
        date: startOfDay,
        startCash: parseFloat(startCash) || 0,
        salesCash,
        salesCard,
        expenses: totalExpenses,
        endCash: parseFloat(actualCash)
      }
    });

    res.json(dayRecord);
  } catch (error) {
    console.error('Save daily closing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
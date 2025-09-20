import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get expenses for today
router.get('/today', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const expenses = await prisma.expense.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    console.error('Get today expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get total expenses for today
router.get('/today/total', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const result = await prisma.expense.aggregate({
      where: {
        timestamp: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      _sum: {
        amount: true
      }
    });

    res.json({ total: result._sum.amount || 0 });
  } catch (error) {
    console.error('Get expenses total error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create expense
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { amount, reason } = req.body;
    const userId = req.userId!;

    if (!amount || !reason) {
      return res.status(400).json({ error: 'Amount and reason are required' });
    }

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const expense = await prisma.expense.create({
      data: {
        amount: parseFloat(amount),
        reason,
        userId
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.status(201).json(expense);
  } catch (error) {
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get expenses by date range
router.get('/range', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const expenses = await prisma.expense.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: end
        }
      },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(expenses);
  } catch (error) {
    console.error('Get expenses by range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete expense
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.expense.delete({
      where: { id }
    });

    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Delete expense error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Predefined expense categories for quick buttons
router.get('/predefined', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const predefined = [
      { name: 'Supplies', amount: 50 },
      { name: 'Utilities', amount: 100 },
      { name: 'Maintenance', amount: 75 },
      { name: 'Marketing', amount: 200 },
      { name: 'Insurance', amount: 150 },
      { name: 'Food Ingredients', amount: 300 },
      { name: 'Cleaning', amount: 25 },
      { name: 'Other', amount: 0 }
    ];

    res.json(predefined);
  } catch (error) {
    console.error('Get predefined expenses error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
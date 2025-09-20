import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get sales for today
router.get('/today', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sales = await prisma.sale.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        menuItem: {
          include: {
            category: true
          }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(sales);
  } catch (error) {
    console.error('Get today sales error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales totals for today
router.get('/today/totals', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const salesData = await prisma.sale.findMany({
      where: {
        timestamp: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        menuItem: true
      }
    });

    const totals = {
      overall: 0,
      cash: 0,
      card: 0,
      itemCount: 0
    };

    salesData.forEach(sale => {
      const saleTotal = sale.menuItem.price * sale.amount;
      totals.overall += saleTotal;
      totals.itemCount += sale.amount;
      
      if (sale.paymentType === 'CASH') {
        totals.cash += saleTotal;
      } else {
        totals.card += saleTotal;
      }
    });

    res.json(totals);
  } catch (error) {
    console.error('Get sales totals error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create sale
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { menuItemId, amount = 1, paymentType } = req.body;
    const userId = req.userId!;

    if (!menuItemId || !paymentType) {
      return res.status(400).json({ error: 'Menu item and payment type are required' });
    }

    if (!['CASH', 'CARD'].includes(paymentType)) {
      return res.status(400).json({ error: 'Payment type must be CASH or CARD' });
    }

    // Start transaction to update sold count and create sale
    const result = await prisma.$transaction(async (tx) => {
      // Create the sale
      const sale = await tx.sale.create({
        data: {
          menuItemId,
          amount,
          paymentType,
          userId
        },
        include: {
          menuItem: {
            include: {
              category: true
            }
          },
          user: {
            select: { username: true }
          }
        }
      });

      // Update menu item sold count
      await tx.menuItem.update({
        where: { id: menuItemId },
        data: {
          soldCount: {
            increment: amount
          }
        }
      });

      return sale;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get sales by date range
router.get('/range', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ error: 'Start date and end date are required' });
    }

    const start = new Date(startDate as string);
    const end = new Date(endDate as string);
    end.setHours(23, 59, 59, 999);

    const sales = await prisma.sale.findMany({
      where: {
        timestamp: {
          gte: start,
          lte: end
        }
      },
      include: {
        menuItem: {
          include: {
            category: true
          }
        },
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(sales);
  } catch (error) {
    console.error('Get sales by range error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
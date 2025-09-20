import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all inventory items with status
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.inventoryItem.findMany({
      orderBy: { name: 'asc' }
    });

    // Add status based on stock levels
    const itemsWithStatus = items.map(item => ({
      ...item,
      status: item.stock <= 0 ? 'empty' : item.stock <= item.minStock ? 'low' : 'ok'
    }));

    res.json(itemsWithStatus);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create inventory item
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, unit, stock = 0, minStock, purchasePrice } = req.body;
    
    if (!name || !unit || !minStock || !purchasePrice) {
      return res.status(400).json({ error: 'Name, unit, min stock, and purchase price are required' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        name,
        unit,
        stock: parseFloat(stock),
        minStock: parseFloat(minStock),
        purchasePrice: parseFloat(purchasePrice)
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update inventory item
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, unit, stock, minStock, purchasePrice } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (unit) updateData.unit = unit;
    if (stock !== undefined) updateData.stock = parseFloat(stock);
    if (minStock !== undefined) updateData.minStock = parseFloat(minStock);
    if (purchasePrice !== undefined) updateData.purchasePrice = parseFloat(purchasePrice);

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: updateData
    });

    res.json(item);
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete inventory item
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.inventoryItem.delete({
      where: { id }
    });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add delivery (increase stock)
router.post('/:id/delivery', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, reason = 'Delivery' } = req.body;
    const userId = req.userId!;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update stock
      const item = await tx.inventoryItem.update({
        where: { id },
        data: {
          stock: {
            increment: parseFloat(amount)
          }
        }
      });

      // Record change
      const change = await tx.inventoryChange.create({
        data: {
          inventoryItemId: id,
          change: parseFloat(amount),
          reason,
          userId
        }
      });

      return { item, change };
    });

    res.json(result);
  } catch (error) {
    console.error('Add delivery error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add consumption (decrease stock)
router.post('/:id/consumption', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { amount, reason = 'Consumption' } = req.body;
    const userId = req.userId!;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    const result = await prisma.$transaction(async (tx) => {
      // Update stock
      const item = await tx.inventoryItem.update({
        where: { id },
        data: {
          stock: {
            decrement: parseFloat(amount)
          }
        }
      });

      // Record change
      const change = await tx.inventoryChange.create({
        data: {
          inventoryItemId: id,
          change: -parseFloat(amount),
          reason,
          userId
        }
      });

      return { item, change };
    });

    res.json(result);
  } catch (error) {
    console.error('Add consumption error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get inventory changes for an item
router.get('/:id/changes', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const changes = await prisma.inventoryChange.findMany({
      where: { inventoryItemId: id },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { timestamp: 'desc' }
    });

    res.json(changes);
  } catch (error) {
    console.error('Get inventory changes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
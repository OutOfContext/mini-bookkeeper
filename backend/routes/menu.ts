import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Categories routes
router.get('/categories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const categories = await prisma.menuCategory.findMany({
      include: {
        menuItems: {
          orderBy: { name: 'asc' }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/categories', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.menuCategory.create({
      data: { name }
    });

    res.status(201).json(category);
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/categories/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await prisma.menuCategory.update({
      where: { id },
      data: { name }
    });

    res.json(category);
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/categories/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.menuCategory.delete({
      where: { id }
    });

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Menu items routes
router.get('/items', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      include: {
        category: true
      },
      orderBy: { name: 'asc' }
    });
    res.json(items);
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/items', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, price, categoryId } = req.body;
    
    if (!name || !price || !categoryId) {
      return res.status(400).json({ error: 'Name, price, and category are required' });
    }

    const item = await prisma.menuItem.create({
      data: {
        name,
        price: parseFloat(price),
        categoryId
      },
      include: {
        category: true
      }
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/items/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, price, categoryId } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (price) updateData.price = parseFloat(price);
    if (categoryId) updateData.categoryId = categoryId;

    const item = await prisma.menuItem.update({
      where: { id },
      data: updateData,
      include: {
        category: true
      }
    });

    res.json(item);
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/items/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.menuItem.delete({
      where: { id }
    });

    res.json({ message: 'Menu item deleted successfully' });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
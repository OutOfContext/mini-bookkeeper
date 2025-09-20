import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get current active session
router.get('/active', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const activeSession = await prisma.session.findFirst({
      where: {
        isActive: true,
        date: {
          gte: new Date(new Date().toDateString()) // Today's date
        }
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.json(activeSession);
  } catch (error) {
    console.error('Get active session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all sessions for today
router.get('/today', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessions = await prisma.session.findMany({
      where: {
        date: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: { username: true }
        }
      },
      orderBy: { startTime: 'desc' }
    });

    res.json(sessions);
  } catch (error) {
    console.error('Get today sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Start new session
router.post('/start', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.userId!;
    const { name } = req.body;

    // Close any active sessions
    await prisma.session.updateMany({
      where: {
        isActive: true
      },
      data: {
        isActive: false,
        endTime: new Date()
      }
    });

    // Create new session
    const newSession = await prisma.session.create({
      data: {
        userId,
        name: name || 'Unbenannte Session',
        isActive: true
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.status(201).json(newSession);
  } catch (error) {
    console.error('Start session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End session
router.put('/:id/end', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.session.update({
      where: { id },
      data: {
        isActive: false,
        endTime: new Date()
      },
      include: {
        user: {
          select: { username: true }
        }
      }
    });

    res.json(session);
  } catch (error) {
    console.error('End session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete session
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.session.delete({
      where: { id }
    });

    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    console.error('Delete session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
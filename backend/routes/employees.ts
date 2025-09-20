import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all employees
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const employees = await prisma.employee.findMany({
      include: {
        shifts: {
          where: {
            endTime: null // Active shifts
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json(employees);
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create employee
router.post('/', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { name, hourlyWage } = req.body;
    
    if (!name || !hourlyWage) {
      return res.status(400).json({ error: 'Name and hourly wage are required' });
    }

    const employee = await prisma.employee.create({
      data: {
        name,
        hourlyWage: parseFloat(hourlyWage)
      }
    });

    res.status(201).json(employee);
  } catch (error) {
    console.error('Create employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update employee
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { name, hourlyWage } = req.body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (hourlyWage) updateData.hourlyWage = parseFloat(hourlyWage);

    const employee = await prisma.employee.update({
      where: { id },
      data: updateData
    });

    res.json(employee);
  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete employee
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    await prisma.employee.delete({
      where: { id }
    });

    res.json({ message: 'Employee deleted successfully' });
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check in employee
router.post('/:id/checkin', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // Check if employee already has an active shift
    const activeShift = await prisma.shift.findFirst({
      where: {
        employeeId: id,
        endTime: null
      }
    });

    if (activeShift) {
      return res.status(400).json({ error: 'Employee is already checked in' });
    }

    const shift = await prisma.shift.create({
      data: {
        employeeId: id,
        startTime: new Date()
      },
      include: {
        employee: true
      }
    });

    res.status(201).json(shift);
  } catch (error) {
    console.error('Check in employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Check out employee
router.post('/:id/checkout', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    const activeShift = await prisma.shift.findFirst({
      where: {
        employeeId: id,
        endTime: null
      },
      include: {
        employee: true
      }
    });

    if (!activeShift) {
      return res.status(400).json({ error: 'Employee is not checked in' });
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - activeShift.startTime.getTime()) / (1000 * 60 * 60); // hours
    const wage = duration * activeShift.employee.hourlyWage;

    const updatedShift = await prisma.shift.update({
      where: { id: activeShift.id },
      data: {
        endTime,
        duration,
        wage
      },
      include: {
        employee: true
      }
    });

    res.json(updatedShift);
  } catch (error) {
    console.error('Check out employee error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get shifts for today
router.get('/shifts/today', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const shifts = await prisma.shift.findMany({
      where: {
        startTime: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        employee: true
      },
      orderBy: { startTime: 'desc' }
    });

    res.json(shifts);
  } catch (error) {
    console.error('Get today shifts error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
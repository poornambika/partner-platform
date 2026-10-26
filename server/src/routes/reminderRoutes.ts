import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { ReminderService } from '../services/reminderService';

const router = Router();

// Get reminder status
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const reminder = await ReminderService.getUserReminder(userId);
    res.json(reminder);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch purchase reminder' });
  }
});

// Reminder simulation test controls
router.post('/simulate-test', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { userId, shiftDays = 90, status } = req.body;
    const targetUserId = userId || req.user!.id;

    let reminder = await prisma.purchaseReminder.findUnique({ where: { userId: targetUserId } });
    if (!reminder) {
      res.status(404).json({ error: 'Reminder not found for user' });
      return;
    }

    if (status) {
      // Force set status (e.g. DUE_SOON, OVERDUE, UP_TO_DATE)
      const now = new Date();
      let nextDate = new Date();
      if (status === 'DUE_SOON') {
        nextDate.setDate(now.getDate() + 10);
      } else if (status === 'OVERDUE') {
        nextDate.setDate(now.getDate() - 5);
      } else {
        nextDate.setMonth(now.getMonth() + 4);
      }

      reminder = await prisma.purchaseReminder.update({
        where: { userId: targetUserId },
        data: {
          nextReminderDate: nextDate,
          reminderStatus: status,
        },
      });
    } else {
      reminder = await ReminderService.simulateTimeShift(targetUserId, Number(shiftDays));
    }

    res.json({
      success: true,
      reminder,
      message: 'Reminder simulation updated successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update reminder simulation' });
  }
});

export default router;

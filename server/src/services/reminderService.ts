import { prisma } from '../prisma';

export class ReminderService {
  /**
   * Retrieves or initializes purchase reminder status for a user.
   */
  static async getUserReminder(userId: string) {
    let reminder = await prisma.purchaseReminder.findUnique({
      where: { userId },
    });

    if (!reminder) {
      const now = new Date();
      const nextDate = new Date();
      nextDate.setMonth(nextDate.getMonth() + 4);

      reminder = await prisma.purchaseReminder.create({
        data: {
          userId,
          lastPurchaseDate: now,
          nextReminderDate: nextDate,
          cycleIntervalMonths: 4,
          reminderStatus: 'UP_TO_DATE',
        },
      });
    }

    const now = new Date();
    const diffTime = reminder.nextReminderDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let status = reminder.reminderStatus;
    if (daysRemaining < 0) {
      status = 'OVERDUE';
    } else if (daysRemaining <= 15) {
      status = 'DUE_SOON';
    } else {
      status = 'UP_TO_DATE';
    }

    if (status !== reminder.reminderStatus) {
      reminder = await prisma.purchaseReminder.update({
        where: { userId },
        data: { reminderStatus: status },
      });
    }

    return {
      ...reminder,
      daysRemaining,
      policyNote:
        'Configurable 4-month purchase cycle demonstration. Notice: Accounts are never deactivated automatically; production policy requires regulatory and corporate review.',
    };
  }

  /**
   * Updates reminder when an order is completed.
   */
  static async recordPurchase(userId: string, purchaseDate: Date = new Date()) {
    const nextDate = new Date(purchaseDate);
    nextDate.setMonth(nextDate.getMonth() + 4);

    return prisma.purchaseReminder.upsert({
      where: { userId },
      create: {
        userId,
        lastPurchaseDate: purchaseDate,
        nextReminderDate: nextDate,
        cycleIntervalMonths: 4,
        reminderStatus: 'UP_TO_DATE',
      },
      update: {
        lastPurchaseDate: purchaseDate,
        nextReminderDate: nextDate,
        reminderStatus: 'UP_TO_DATE',
      },
    });
  }

  /**
   * Simulation test control to advance or simulate reminder scenarios.
   */
  static async simulateTimeShift(userId: string, shiftDays: number) {
    const reminder = await prisma.purchaseReminder.findUnique({
      where: { userId },
    });

    if (!reminder) return null;

    const newNextDate = new Date(reminder.nextReminderDate);
    newNextDate.setDate(newNextDate.getDate() - shiftDays);

    const now = new Date();
    const diffDays = Math.ceil((newNextDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    let status = 'UP_TO_DATE';
    if (diffDays < 0) status = 'OVERDUE';
    else if (diffDays <= 15) status = 'DUE_SOON';

    return prisma.purchaseReminder.update({
      where: { userId },
      data: {
        nextReminderDate: newNextDate,
        reminderStatus: status,
      },
    });
  }
}

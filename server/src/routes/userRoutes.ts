import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// List all users with branch assignment (Owner only)
router.get(
  '/',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const users = await prisma.user.findMany({
        include: {
          partnerProfile: true,
          referralRelationship: {
            include: {
              partner: {
                select: { id: true, name: true, email: true },
              },
            },
          },
          purchaseReminder: true,
        },
        orderBy: { id: 'asc' },
      });

      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
);

// Toggle / update account status (Owner only)
router.patch(
  '/:id/status',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['ACTIVE', 'SUSPENDED'].includes(status)) {
        res.status(400).json({ error: 'Status must be ACTIVE or SUSPENDED' });
        return;
      }

      // Owner cannot suspend own account
      if (id === 'OWN001' && status === 'SUSPENDED') {
        res.status(400).json({ error: 'Cannot suspend primary Super Admin account' });
        return;
      }

      const updated = await prisma.user.update({
        where: { id },
        data: { status },
      });

      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          action: 'ACCOUNT_STATUS_CHANGE',
          entityType: 'USER',
          entityId: id,
          details: `Account ${id} status updated to ${status}`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update user status' });
    }
  }
);

export default router;

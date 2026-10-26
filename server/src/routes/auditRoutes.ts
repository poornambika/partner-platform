import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Audit logs (Owner only)
router.get(
  '/',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const logs = await prisma.auditLog.findMany({
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
        orderBy: { timestamp: 'desc' },
        take: 50,
      });

      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
  }
);

export default router;

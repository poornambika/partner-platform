import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Referral Hierarchy Tree
router.get(
  '/tree',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      // 1. Fetch Owner
      const owner = await prisma.user.findFirst({
        where: { role: 'OWNER' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          phone: true,
        },
      });

      if (!owner) {
        res.status(404).json({ error: 'Owner not found' });
        return;
      }

      // 2. Fetch all 10 Partners
      const partners = await prisma.user.findMany({
        where: { role: 'PARTNER' },
        include: {
          partnerProfile: true,
          sponsoredReferrals: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true,
                  status: true,
                  phone: true,
                  purchaseReminder: true,
                },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      // Structure tree
      const partnerNodes = partners.map((p) => {
        const userChildren = p.sponsoredReferrals.map((ref) => ({
          id: ref.user.id,
          name: ref.user.name,
          email: ref.user.email,
          role: ref.user.role,
          status: ref.user.status,
          phone: ref.user.phone,
          parentId: p.id,
          reminderStatus: ref.user.purchaseReminder?.reminderStatus || 'UP_TO_DATE',
          children: [],
        }));

        return {
          id: p.id,
          name: p.name,
          email: p.email,
          role: p.role,
          status: p.status,
          phone: p.phone,
          parentId: owner.id,
          referralCode: p.partnerProfile?.referralCode || `REF-${p.id}`,
          branchName: p.partnerProfile?.branchName,
          totalSales: p.partnerProfile?.totalSales || 0,
          simulatedCommission: p.partnerProfile?.totalSimulatedCommission || 0,
          children: userChildren,
        };
      });

      const hierarchy = {
        id: owner.id,
        name: owner.name,
        email: owner.email,
        role: owner.role,
        status: owner.status,
        phone: owner.phone,
        parentId: null,
        children: partnerNodes,
      };

      res.json(hierarchy);
    } catch (error) {
      console.error('Referral hierarchy error:', error);
      res.status(500).json({ error: 'Failed to build referral hierarchy' });
    }
  }
);

export default router;

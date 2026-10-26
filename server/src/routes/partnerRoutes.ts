import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Partner directory (Owner can view all, or partners can view overview)
router.get(
  '/',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { search, status, sortBy, sortOrder } = req.query;

      const partners = await prisma.user.findMany({
        where: {
          role: 'PARTNER',
          ...(status ? { status: String(status) } : {}),
          ...(search
            ? {
                OR: [
                  { name: { contains: String(search) } },
                  { id: { contains: String(search) } },
                  { email: { contains: String(search) } },
                ],
              }
            : {}),
        },
        include: {
          partnerProfile: true,
          sponsoredReferrals: {
            include: {
              user: {
                select: { id: true, name: true, email: true, status: true },
              },
            },
          },
        },
        orderBy: { id: 'asc' },
      });

      let results = partners.map((p) => ({
        id: p.id,
        name: p.name,
        email: p.email,
        phone: p.phone,
        status: p.status,
        referralCode: p.partnerProfile?.referralCode || `REF-${p.id}`,
        branchName: p.partnerProfile?.branchName || 'Regional Hub',
        assignedUsersCount: p.sponsoredReferrals.length,
        assignedUsers: p.sponsoredReferrals.map((r) => r.user),
        totalSales: p.partnerProfile?.totalSales || 0,
        simulatedCommission: p.partnerProfile?.totalSimulatedCommission || 0,
        joinDate: p.partnerProfile?.joinDate || p.createdAt,
      }));

      // In-memory sorting if requested
      if (sortBy === 'sales') {
        results.sort((a, b) =>
          sortOrder === 'asc' ? a.totalSales - b.totalSales : b.totalSales - a.totalSales
        );
      } else if (sortBy === 'name') {
        results.sort((a, b) =>
          sortOrder === 'desc' ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
        );
      }

      res.json(results);
    } catch (error) {
      console.error('Partner list error:', error);
      res.status(500).json({ error: 'Failed to fetch partner directory' });
    }
  }
);

// Get single partner details
router.get(
  '/:id',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      // Access control: Only OWNER or the specific PARTNER themselves can view
      if (req.user!.role === 'PARTNER' && req.user!.id !== id) {
        res.status(403).json({ error: 'Forbidden: You cannot view another partner details' });
        return;
      }
      if (req.user!.role === 'USER') {
        res.status(403).json({ error: 'Forbidden: Regular users cannot access partner administration' });
        return;
      }

      const partner = await prisma.user.findUnique({
        where: { id },
        include: {
          partnerProfile: true,
          sponsoredReferrals: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  phone: true,
                  status: true,
                  createdAt: true,
                  purchaseReminder: true,
                },
              },
            },
          },
        },
      });

      if (!partner || partner.role !== 'PARTNER') {
        res.status(404).json({ error: 'Partner not found' });
        return;
      }

      // Attributed orders
      const orders = await prisma.order.findMany({
        where: { partnerId: id },
        include: {
          user: { select: { id: true, name: true, email: true } },
          items: { include: { product: true } },
        },
        orderBy: { orderDate: 'desc' },
      });

      // Commission ledgers
      const commissions = await prisma.commissionLedger.findMany({
        where: { beneficiaryId: id },
        include: { order: true },
        orderBy: { createdAt: 'desc' },
      });

      res.json({
        partner: {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          phone: partner.phone,
          status: partner.status,
          branchName: partner.partnerProfile?.branchName,
          referralCode: partner.partnerProfile?.referralCode,
          commissionRate: partner.partnerProfile?.commissionRate,
          totalSales: partner.partnerProfile?.totalSales,
          totalSimulatedCommission: partner.partnerProfile?.totalSimulatedCommission,
          joinDate: partner.partnerProfile?.joinDate,
        },
        assignedUsers: partner.sponsoredReferrals.map((r) => r.user),
        orders,
        commissions,
      });
    } catch (error) {
      console.error('Partner details error:', error);
      res.status(500).json({ error: 'Failed to retrieve partner profile' });
    }
  }
);

export default router;

import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { CommissionService } from '../services/commissionService';

const router = Router();

// Get commission ledger
router.get(
  '/ledger',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role === 'USER') {
        res.status(403).json({ error: 'Forbidden: Regular users cannot access commission statements' });
        return;
      }

      const { status } = req.query;
      let whereClause: any = {};

      if (user.role === 'PARTNER') {
        whereClause.beneficiaryId = user.id; // Partner only sees their own
      }
      if (status) {
        whereClause.status = String(status);
      }

      const ledgers = await prisma.commissionLedger.findMany({
        where: whereClause,
        include: {
          order: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      res.json(ledgers);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch commission ledger' });
    }
  }
);

// Get commission policy & legal disclaimers
router.get('/policy', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    let policy = await prisma.commissionPolicy.findUnique({ where: { id: 'DEFAULT' } });
    if (!policy) {
      policy = await prisma.commissionPolicy.create({
        data: {
          id: 'DEFAULT',
          salesCommissionRate: 6.0,
          recruitmentBonusEnabled: false,
          recruitmentBonusAmount: 30.0,
          legalDisclaimer:
            'Illustrative simulation pending legal and regulatory compliance review. Headcount or recruitment-based incentives are strictly UNAPPROVED and disabled in compliance with consumer protection standards.',
        },
      });
    }

    const unapprovedRecruitmentRule = CommissionService.validateRecruitmentPayoutEligibility();

    res.json({
      policy,
      unapprovedRuleNotice: unapprovedRecruitmentRule,
      demonstrationRate: '6.0% illustrative on eligible verified product sales',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch commission policy' });
  }
});

// Update commission policy (Owner only)
router.put(
  '/policy',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { salesCommissionRate, recruitmentBonusEnabled } = req.body;

      if (recruitmentBonusEnabled === true) {
        res.status(400).json({
          error:
            'Policy Violation: Recruitment-based compensation (e.g. ₹30 per member) cannot be activated. Direct selling regulations prohibit recruitment bonuses.',
        });
        return;
      }

      const updated = await prisma.commissionPolicy.update({
        where: { id: 'DEFAULT' },
        data: {
          ...(salesCommissionRate !== undefined ? { salesCommissionRate: Number(salesCommissionRate) } : {}),
          recruitmentBonusEnabled: false, // Locked to false
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update commission policy' });
    }
  }
);

// Partner-wise summaries (Owner only)
router.get(
  '/partner-summaries',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const summaries = await CommissionService.getPartnerCommissionSummaries();
      res.json(summaries);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch partner commission summaries' });
    }
  }
);

// Reverse commission entry (Owner only)
router.post(
  '/reverse/:id',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason = 'Manual administrative reversal' } = req.body;

      const ledger = await prisma.commissionLedger.findUnique({ where: { id } });
      if (!ledger) {
        res.status(404).json({ error: 'Commission ledger entry not found' });
        return;
      }

      if (ledger.status === 'REVERSED') {
        res.status(400).json({ error: 'This ledger entry has already been reversed' });
        return;
      }

      const reversed = await prisma.commissionLedger.update({
        where: { id },
        data: {
          status: 'REVERSED',
          reversalRef: `MANUAL-REV-${Date.now().toString().slice(-4)}`,
          notes: `${ledger.notes || ''} | REVERSED: ${reason}`,
        },
      });

      // Deduct from partner totals
      await prisma.partnerProfile.update({
        where: { userId: ledger.beneficiaryId },
        data: {
          totalSales: { decrement: ledger.eligibleSalesAmount },
          totalSimulatedCommission: { decrement: ledger.calculatedAmount },
        },
      });

      res.json(reversed);
    } catch (error) {
      res.status(500).json({ error: 'Failed to reverse commission entry' });
    }
  }
);

// CSV Export (Owner or Partner)
router.get(
  '/export-csv',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = req.user!;
      if (user.role === 'USER') {
        res.status(403).json({ error: 'Forbidden' });
        return;
      }

      const whereClause: any = {};
      if (user.role === 'PARTNER') {
        whereClause.beneficiaryId = user.id;
      }

      const ledgers = await prisma.commissionLedger.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
      });

      let csv = 'LedgerID,OrderID,BeneficiaryID,EligibleSales(INR),Rate(%),CalculatedCommission(INR),Status,ReversalRef,CreatedAt\n';
      for (const l of ledgers) {
        csv += `"${l.id}","${l.orderId}","${l.beneficiaryId}",${l.eligibleSalesAmount},${l.illustrativeRate},${l.calculatedAmount},"${l.status}","${l.reversalRef || ''}","${l.createdAt.toISOString()}"\n`;
      }

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="simulated_commission_ledger.csv"');
      res.send(csv);
    } catch (error) {
      res.status(500).json({ error: 'Failed to export commission CSV' });
    }
  }
);

export default router;

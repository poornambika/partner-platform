import { prisma } from '../prisma';

export interface CommissionCalculationResult {
  eligibleSalesAmount: number;
  rate: number;
  calculatedAmount: number;
  isSimulated: boolean;
  legalNote: string;
}

export class CommissionService {
  /**
   * Calculates illustrative sales commission on verified product sales.
   * Explicitly labeled as a simulation pending legal and regulatory approval.
   */
  static calculateSalesCommission(eligibleSalesAmount: number, rate: number = 6.0): number {
    if (eligibleSalesAmount <= 0 || rate <= 0) {
      return 0.0;
    }
    // High-precision calculation rounded to 2 decimal places (paise precision)
    const commission = Math.round(eligibleSalesAmount * (rate / 100) * 100) / 100;
    return commission;
  }

  /**
   * Requirement 12: Business proposal mentions ₹30 for every added member.
   * This MUST NOT be activated. It is strictly unapproved and disabled pending legal review.
   */
  static validateRecruitmentPayoutEligibility(): {
    isApproved: boolean;
    ruleCode: string;
    amount: number;
    explanation: string;
  } {
    return {
      isApproved: false,
      ruleCode: 'RECRUITMENT_HEADCOUNT_BONUS_DISABLED',
      amount: 0.0,
      explanation:
        'Recruitment-based compensation (e.g. ₹30 per recruited member) is strictly UNAPPROVED and disabled in compliance with Consumer Protection (Direct Selling) Rules, 2021. Payouts are exclusively modeled on genuine end-consumer product sales.',
    };
  }

  /**
   * Creates a commission ledger entry for an order attributed to a partner.
   */
  static async recordOrderCommission(
    orderId: string,
    beneficiaryId: string,
    eligibleSalesAmount: number,
    rate: number = 6.0
  ) {
    const calculatedAmount = this.calculateSalesCommission(eligibleSalesAmount, rate);
    const ledgerId = `COM-${orderId.replace(/[^0-9]/g, '') || Date.now()}`;

    const ledger = await prisma.commissionLedger.create({
      data: {
        id: ledgerId,
        orderId,
        beneficiaryId,
        eligibleSalesAmount,
        illustrativeRate: rate,
        calculatedAmount,
        status: 'SIMULATED',
        notes: `Simulated ${rate}% illustrative commission pending legal review for order ${orderId}`,
      },
    });

    // Update partner profile totals
    await prisma.partnerProfile.update({
      where: { userId: beneficiaryId },
      data: {
        totalSales: { increment: eligibleSalesAmount },
        totalSimulatedCommission: { increment: calculatedAmount },
      },
    });

    return ledger;
  }

  /**
   * Reverses a commission entry when an order is cancelled or refunded.
   */
  static async reverseCommission(orderId: string, reason: string = 'Order cancelled/refunded') {
    const existing = await prisma.commissionLedger.findFirst({
      where: { orderId, status: { not: 'REVERSED' } },
    });

    if (!existing) {
      return null;
    }

    const reversalRef = `REV-${orderId}`;
    const updated = await prisma.commissionLedger.update({
      where: { id: existing.id },
      data: {
        status: 'REVERSED',
        reversalRef,
        notes: `${existing.notes || ''} | REVERSED: ${reason}`,
      },
    });

    // Deduct from partner totals
    await prisma.partnerProfile.update({
      where: { userId: existing.beneficiaryId },
      data: {
        totalSales: { decrement: existing.eligibleSalesAmount },
        totalSimulatedCommission: { decrement: existing.calculatedAmount },
      },
    });

    return updated;
  }

  /**
   * Returns partner-wise commission summaries.
   */
  static async getPartnerCommissionSummaries() {
    const partners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
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
    });

    const ledgers = await prisma.commissionLedger.findMany();

    return partners.map((p) => {
      const partnerLedgers = ledgers.filter((l) => l.beneficiaryId === p.id);
      const simulated = partnerLedgers
        .filter((l) => l.status === 'SIMULATED')
        .reduce((sum, l) => sum + l.calculatedAmount, 0);
      const pendingReview = partnerLedgers
        .filter((l) => l.status === 'PENDING_REVIEW')
        .reduce((sum, l) => sum + l.calculatedAmount, 0);
      const approvedDemo = partnerLedgers
        .filter((l) => l.status === 'APPROVED_DEMO')
        .reduce((sum, l) => sum + l.calculatedAmount, 0);
      const reversed = partnerLedgers
        .filter((l) => l.status === 'REVERSED')
        .reduce((sum, l) => sum + l.calculatedAmount, 0);

      return {
        partnerId: p.id,
        name: p.name,
        branch: p.partnerProfile?.branchName,
        referralCode: p.partnerProfile?.referralCode,
        assignedUsersCount: p.sponsoredReferrals.length,
        totalEligibleSales: Math.round((p.partnerProfile?.totalSales || 0) * 100) / 100,
        simulatedCommission: Math.round(simulated * 100) / 100,
        pendingReviewCommission: Math.round(pendingReview * 100) / 100,
        approvedDemoCommission: Math.round(approvedDemo * 100) / 100,
        reversedCommission: Math.round(reversed * 100) / 100,
        totalCalculatedCommission:
          Math.round((p.partnerProfile?.totalSimulatedCommission || 0) * 100) / 100,
      };
    });
  }
}

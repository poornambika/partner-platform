import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// In-memory or database settings
let appSettings = {
  businessProfile: {
    companyName: 'Apex Consumer Network & Distribution Pvt. Ltd.',
    registrationNo: 'U74999MH2026PTC190284',
    registeredAddress: 'Corporate Tower A, Bandra Kurla Complex, Mumbai, MH 400051',
    supportEmail: 'compliance@apexnetwork.demo',
    supportPhone: '+91 22 6123 4567',
  },
  currency: {
    code: 'INR',
    symbol: '₹',
    locale: 'en-IN',
  },
  purchaseReminderPolicy: {
    intervalMonths: 4,
    gracePeriodDays: 15,
    autoDeactivation: false, // Never auto deactivate
    disclosure: 'Production implementation requires corporate legal counsel approval.',
  },
  commissionSettings: {
    salesCommissionRate: 6.0,
    recruitmentBonusEnabled: false, // Permanently false
    recruitmentBonusAmount: 30.0,
    recruitmentBonusStatusText: 'UNAPPROVED (Compliance Protected)',
    recruitmentBonusExplanation:
      'Compulsory registration fees and recruitment bonuses are prohibited under direct selling rules.',
  },
  taxAssumptions: {
    corporateTaxRate: 25.0,
    gstRateStandard: 18.0,
    disclaimer: 'Demo financial estimates only.',
  },
  rolePermissions: {
    owner: ['full_system_access', 'financial_oversight', 'commission_management', 'account_control'],
    partner: ['view_assigned_branch', 'view_attributed_sales', 'share_referral_code', 'view_simulated_commissions'],
    user: ['browse_catalogue', 'place_orders', 'view_invoices', 'apply_coupons', 'check_reminders'],
  },
};

// Get settings
router.get('/', authenticate, (req: AuthenticatedRequest, res: Response): void => {
  res.json(appSettings);
});

// Update settings (Owner only)
router.put(
  '/',
  authenticate,
  requireRole('OWNER'),
  (req: AuthenticatedRequest, res: Response): void => {
    const { businessProfile, purchaseReminderPolicy, taxAssumptions } = req.body;

    if (businessProfile) {
      appSettings.businessProfile = { ...appSettings.businessProfile, ...businessProfile };
    }
    if (purchaseReminderPolicy) {
      appSettings.purchaseReminderPolicy = {
        ...appSettings.purchaseReminderPolicy,
        intervalMonths: Number(purchaseReminderPolicy.intervalMonths) || 4,
        gracePeriodDays: Number(purchaseReminderPolicy.gracePeriodDays) || 15,
      };
    }
    if (taxAssumptions) {
      appSettings.taxAssumptions = { ...appSettings.taxAssumptions, ...taxAssumptions };
    }

    // Always maintain recruitmentBonusEnabled: false
    appSettings.commissionSettings.recruitmentBonusEnabled = false;

    res.json(appSettings);
  }
);

export default router;

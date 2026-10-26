import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { CouponService } from '../services/couponService';

const router = Router();

// List coupons
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const coupons = await prisma.coupon.findMany({
      where: user.role === 'OWNER' ? {} : { isActive: true },
      include: {
        redemptions: {
          select: { id: true, userId: true, discountApplied: true, redeemedAt: true },
        },
      },
      orderBy: { expiryDate: 'asc' },
    });

    res.json(coupons);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
});

// Validate coupon endpoint
router.post('/validate', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { code, cartTotal } = req.body;
    if (!code || cartTotal === undefined) {
      res.status(400).json({ error: 'Code and cartTotal are required' });
      return;
    }

    const result = await CouponService.validateCoupon(code, Number(cartTotal));
    if (!result.valid) {
      res.status(400).json({ error: result.message });
      return;
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Failed to validate coupon' });
  }
});

const createCouponSchema = z.object({
  code: z.string().min(3).max(20).toUpperCase(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().nonnegative().default(0),
  maxDiscount: z.number().positive().optional(),
  maxRedemptions: z.number().int().positive().default(100),
  startDate: z.string().or(z.date()),
  expiryDate: z.string().or(z.date()),
});

// Create coupon (Owner only)
router.post(
  '/',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = createCouponSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid coupon data', details: parsed.error.issues });
        return;
      }

      const id = `CPN-${Date.now().toString().slice(-4)}`;
      const coupon = await prisma.coupon.create({
        data: {
          id,
          code: parsed.data.code,
          discountType: parsed.data.discountType,
          discountValue: parsed.data.discountValue,
          minOrderValue: parsed.data.minOrderValue,
          maxDiscount: parsed.data.maxDiscount,
          maxRedemptions: parsed.data.maxRedemptions,
          startDate: new Date(parsed.data.startDate),
          expiryDate: new Date(parsed.data.expiryDate),
          isActive: true,
        },
      });

      res.status(201).json(coupon);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'A coupon with this code already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create coupon' });
    }
  }
);

// Toggle active status
router.patch(
  '/:id/toggle',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const existing = await prisma.coupon.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Coupon not found' });
        return;
      }

      const updated = await prisma.coupon.update({
        where: { id },
        data: { isActive: !existing.isActive },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to toggle coupon status' });
    }
  }
);

export default router;

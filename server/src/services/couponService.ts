import { prisma } from '../prisma';

export interface CouponValidationResult {
  valid: boolean;
  code: string;
  discountAmount: number;
  message: string;
  coupon?: any;
}

export class CouponService {
  static async validateCoupon(code: string, cartTotal: number): Promise<CouponValidationResult> {
    if (!code) {
      return { valid: false, code: '', discountAmount: 0, message: 'Coupon code is required' };
    }

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!coupon) {
      return { valid: false, code, discountAmount: 0, message: 'Invalid coupon code' };
    }

    if (!coupon.isActive) {
      return { valid: false, code, discountAmount: 0, message: 'This coupon is currently inactive' };
    }

    const now = new Date();
    if (now < coupon.startDate) {
      return { valid: false, code, discountAmount: 0, message: 'Coupon campaign has not started yet' };
    }

    if (now > coupon.expiryDate) {
      return { valid: false, code, discountAmount: 0, message: 'This coupon code has expired' };
    }

    if (coupon.currentRedemptions >= coupon.maxRedemptions) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        message: 'This coupon has reached its maximum redemptions limit',
      };
    }

    if (cartTotal < coupon.minOrderValue) {
      return {
        valid: false,
        code,
        discountAmount: 0,
        message: `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
      };
    }

    let calculatedDiscount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      calculatedDiscount = (cartTotal * coupon.discountValue) / 100;
      if (coupon.maxDiscount && calculatedDiscount > coupon.maxDiscount) {
        calculatedDiscount = coupon.maxDiscount;
      }
    } else {
      calculatedDiscount = coupon.discountValue;
    }

    // Discount cannot exceed cart total
    calculatedDiscount = Math.min(calculatedDiscount, cartTotal);
    calculatedDiscount = Math.round(calculatedDiscount * 100) / 100;

    return {
      valid: true,
      code: coupon.code,
      discountAmount: calculatedDiscount,
      message: `Coupon ${coupon.code} applied successfully! (₹${calculatedDiscount} discount)`,
      coupon,
    };
  }
}

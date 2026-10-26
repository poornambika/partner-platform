import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index';
import { prisma } from '../src/prisma';
import { CommissionService } from '../src/services/commissionService';
import { CouponService } from '../src/services/couponService';
import { FinancialService } from '../src/services/financialService';

describe('Multi-Level Product Distribution & Partner Management Platform Tests', () => {
  let ownerToken: string;
  let partnerToken: string;
  let userToken: string;

  beforeAll(async () => {
    // 1. Authenticate Owner
    const ownerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'owner@demoplatform.local', password: 'Demo@12345' });
    expect(ownerRes.status).toBe(200);
    ownerToken = ownerRes.body.token;

    // 2. Authenticate Partner (PAR001)
    const partnerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'aarav.patel@partner.local', password: 'Demo@12345' });
    expect(partnerRes.status).toBe(200);
    partnerToken = partnerRes.body.token;

    // 3. Authenticate User (USR001)
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'devendra.rao@user.local', password: 'Demo@12345' });
    expect(userRes.status).toBe(200);
    userToken = userRes.body.token;
  });

  // 1. Seeding Verification: 1 Owner, 10 Partners, 30 Users (41 total)
  it('correctly seeds exactly 1 owner, 10 partners, and 30 users (41 total accounts)', async () => {
    const totalUsers = await prisma.user.count();
    const ownerCount = await prisma.user.count({ where: { role: 'OWNER' } });
    const partnerCount = await prisma.user.count({ where: { role: 'PARTNER' } });
    const regularUserCount = await prisma.user.count({ where: { role: 'USER' } });

    expect(totalUsers).toBe(41);
    expect(ownerCount).toBe(1);
    expect(partnerCount).toBe(10);
    expect(regularUserCount).toBe(30);
  });

  // 2. Exactly 3 assigned users per partner
  it('assigns exactly 3 users to each of the 10 main partners', async () => {
    const partners = await prisma.user.findMany({
      where: { role: 'PARTNER' },
      include: { sponsoredReferrals: true },
    });

    expect(partners.length).toBe(10);
    for (const partner of partners) {
      expect(partner.sponsoredReferrals.length).toBe(3);
    }
  });

  // 3. Role-based permissions & Access control
  it('enforces role-based permissions and blocks unauthorized access', async () => {
    // Regular user cannot access owner-only financial summary
    const forbiddenFinancialRes = await request(app)
      .get('/api/financials/summary')
      .set('Authorization', `Bearer ${userToken}`);
    expect(forbiddenFinancialRes.status).toBe(403);

    // Partner cannot access owner-only financial summary
    const forbiddenPartnerRes = await request(app)
      .get('/api/financials/summary')
      .set('Authorization', `Bearer ${partnerToken}`);
    expect(forbiddenPartnerRes.status).toBe(403);

    // Owner CAN access financial summary
    const allowedOwnerRes = await request(app)
      .get('/api/financials/summary')
      .set('Authorization', `Bearer ${ownerToken}`);
    expect(allowedOwnerRes.status).toBe(200);
    expect(allowedOwnerRes.body).toHaveProperty('netSales');
    expect(allowedOwnerRes.body).toHaveProperty('estimatedNetProfit');
  });

  it('prevents a partner from viewing another partner private information', async () => {
    // Partner PAR001 trying to access PAR002 details
    const res = await request(app)
      .get('/api/partners/PAR002')
      .set('Authorization', `Bearer ${partnerToken}`); // partnerToken is PAR001
    expect(res.status).toBe(403);
  });

  // 4. Commission Simulation Service & Unapproved recruitment rule
  it('correctly calculates 6% illustrative sales commission and disallows recruitment bonus', () => {
    const saleAmount = 2500;
    const commission = CommissionService.calculateSalesCommission(saleAmount, 6.0);
    expect(commission).toBe(150.0);

    // Verify unapproved recruitment rule is strictly disabled
    const recruitmentCheck = CommissionService.validateRecruitmentPayoutEligibility();
    expect(recruitmentCheck.isApproved).toBe(false);
    expect(recruitmentCheck.amount).toBe(0.0);
    expect(recruitmentCheck.explanation).toContain('strictly UNAPPROVED');
  });

  // 5. Coupon validation
  it('validates coupon eligibility, minimum order value, and discount limits', async () => {
    // Below minimum order value
    const belowMinRes = await CouponService.validateCoupon('WELCOME10', 200);
    expect(belowMinRes.valid).toBe(false);
    expect(belowMinRes.message).toContain('Minimum order value');

    // Valid order
    const validRes = await CouponService.validateCoupon('WELCOME10', 1000);
    expect(validRes.valid).toBe(true);
    expect(validRes.discountAmount).toBe(100); // 10% of 1000 = 100
  });

  // 6. Product Checkout, Inventory Updates, Commission creation
  it('executes checkout, decrements inventory, and creates simulated commission ledger', async () => {
    const productBefore = await prisma.product.findUnique({ where: { id: 'PRD001' } });
    const stockBefore = productBefore!.stockQuantity;

    const checkoutRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'PRD001', quantity: 2 }],
        couponCode: 'WELCOME10',
        paymentMethod: 'MOCK_UPI',
      });

    expect(checkoutRes.status).toBe(201);
    expect(checkoutRes.body.status).toBe('PAID');
    expect(checkoutRes.body.paymentStatus).toBe('SUCCESS');
    expect(checkoutRes.body.items.length).toBe(1);

    // Verify inventory decremented
    const productAfter = await prisma.product.findUnique({ where: { id: 'PRD001' } });
    expect(productAfter!.stockQuantity).toBe(stockBefore - 2);

    // Verify commission ledger entry created for USR001's assigned partner (PAR001)
    const orderId = checkoutRes.body.id;
    const ledger = await prisma.commissionLedger.findFirst({ where: { orderId } });
    expect(ledger).toBeTruthy();
    expect(ledger!.beneficiaryId).toBe('PAR001');
    expect(ledger!.illustrativeRate).toBe(6.0);
    expect(ledger!.status).toBe('SIMULATED');
  });

  // 7. Payment failure handling
  it('handles simulated payment failure without decrementing inventory or awarding commission', async () => {
    const productBefore = await prisma.product.findUnique({ where: { id: 'PRD002' } });
    const stockBefore = productBefore!.stockQuantity;

    const failureRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'PRD002', quantity: 1 }],
        simulatePaymentFailure: true,
      });

    expect(failureRes.status).toBe(402);
    expect(failureRes.body.error).toContain('Simulated payment failed');

    // Verify inventory untouched
    const productAfter = await prisma.product.findUnique({ where: { id: 'PRD002' } });
    expect(productAfter!.stockQuantity).toBe(stockBefore);
  });

  // 8. Refund calculation and Commission reversal
  it('simulates order cancellation/refund, restocks inventory, and reverses commission', async () => {
    // 1. Create a fresh order to refund
    const orderRes = await request(app)
      .post('/api/orders/checkout')
      .set('Authorization', `Bearer ${userToken}`)
      .send({
        items: [{ productId: 'PRD003', quantity: 1 }],
      });
    expect(orderRes.status).toBe(201);
    const orderId = orderRes.body.id;

    const prodBefore = await prisma.product.findUnique({ where: { id: 'PRD003' } });

    // 2. Trigger refund
    const refundRes = await request(app)
      .post(`/api/orders/${orderId}/cancel-refund`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ reason: 'Product not needed' });

    expect(refundRes.status).toBe(200);
    expect(refundRes.body.status).toBe('REFUNDED');

    // 3. Verify stock restored
    const prodAfter = await prisma.product.findUnique({ where: { id: 'PRD003' } });
    expect(prodAfter!.stockQuantity).toBe(prodBefore!.stockQuantity + 1);

    // 4. Verify commission reversed
    const commission = await prisma.commissionLedger.findFirst({ where: { orderId } });
    expect(commission!.status).toBe('REVERSED');
    expect(commission!.reversalRef).toBeTruthy();
  });

  // 9. Financial report calculation verification
  it('accurately computes financial report following the specified formulas', async () => {
    const report = await FinancialService.calculateFinancialSummary();

    // Verify formulas
    // Net Sales = Gross Product Sales - Discounts - Refunds
    const expectedNetSales = Math.max(0, report.grossProductSales - report.discounts - report.refundsAndCancellations);
    expect(Math.round(report.netSales)).toBe(Math.round(expectedNetSales));

    // Gross Profit = Net Sales - Cost of Goods Sold
    const expectedGrossProfit = report.netSales - report.costOfGoodsSold;
    expect(Math.round(report.grossProfit)).toBe(Math.round(expectedGrossProfit));

    // Estimated Net Profit = Estimated Operating Profit - Estimated Tax Provision
    const expectedNetProfit = report.estimatedOperatingProfit - report.estimatedTaxProvision;
    expect(Math.round(report.estimatedNetProfit)).toBe(Math.round(expectedNetProfit));
  });

  // 10. Interactive Hierarchy structure
  it('returns complete 1+10+30 hierarchy structure from database', async () => {
    const res = await request(app)
      .get('/api/referrals/tree')
      .set('Authorization', `Bearer ${ownerToken}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe('OWN001');
    expect(res.body.children.length).toBe(10); // 10 partners
    for (const partnerNode of res.body.children) {
      expect(partnerNode.children.length).toBe(3); // 3 users each
    }
  });
});

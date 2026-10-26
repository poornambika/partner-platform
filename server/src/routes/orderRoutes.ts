import { Router, Response } from 'express';
import { prisma } from '../prisma';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { CouponService } from '../services/couponService';
import { CommissionService } from '../services/commissionService';
import { ReminderService } from '../services/reminderService';

const router = Router();

// List orders with access control
router.get('/', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    let whereClause: any = {};

    if (user.role === 'OWNER') {
      whereClause = {}; // Owner sees all orders
    } else if (user.role === 'PARTNER') {
      whereClause = { partnerId: user.id }; // Partner only sees attributed orders
    } else {
      whereClause = { userId: user.id }; // User only sees own orders
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: { include: { product: true } },
        paymentSimulation: true,
        refundSimulation: true,
        commissionLedgers: true,
      },
      orderBy: { orderDate: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// Get single order with invoice details
router.get('/:id', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true, address: true } },
        items: { include: { product: true } },
        paymentSimulation: true,
        refundSimulation: true,
        commissionLedgers: true,
        couponRedemptions: { include: { coupon: true } },
      },
    });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    // Role security check
    if (user.role === 'USER' && order.userId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot view another customer order' });
      return;
    }
    if (user.role === 'PARTNER' && order.partnerId !== user.id) {
      res.status(403).json({ error: 'Forbidden: You cannot view orders not attributed to your branch' });
      return;
    }

    // Fetch partner details if attributed
    let attributedPartner = null;
    if (order.partnerId) {
      attributedPartner = await prisma.user.findUnique({
        where: { id: order.partnerId },
        select: { id: true, name: true, email: true, partnerProfile: true },
      });
    }

    res.json({
      ...order,
      attributedPartner,
      demoNotice: 'DEMO INVOICE - SIMULATED COMMERCIAL TRANSACTION',
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch order details' });
  }
});

// Checkout / Place Order
router.post('/checkout', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const user = req.user!;
    const {
      items,
      couponCode,
      shippingAddress,
      paymentMethod = 'MOCK_UPI',
      simulatePaymentFailure = false,
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Checkout requires at least one product item' });
      return;
    }

    // 1. Fetch products & verify stock
    let grossAmount = 0;
    let totalCost = 0;
    const orderItemsData: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      unitCost: number;
      subtotal: number;
    }> = [];

    for (const item of items) {
      const prod = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!prod) {
        res.status(404).json({ error: `Product ${item.productId} not found` });
        return;
      }
      if (!prod.isActive) {
        res.status(400).json({ error: `Product "${prod.name}" is currently unavailable` });
        return;
      }
      if (prod.stockQuantity < item.quantity) {
        res.status(400).json({
          error: `Insufficient stock for "${prod.name}". Available: ${prod.stockQuantity}, Requested: ${item.quantity}`,
        });
        return;
      }

      const itemSubtotal = prod.sellingPrice * item.quantity;
      const itemCost = prod.costPrice * item.quantity;
      grossAmount += itemSubtotal;
      totalCost += itemCost;

      orderItemsData.push({
        productId: prod.id,
        quantity: item.quantity,
        unitPrice: prod.sellingPrice,
        unitCost: prod.costPrice,
        subtotal: itemSubtotal,
      });
    }

    // 2. Validate Coupon if provided
    let discountAmount = 0;
    let validatedCoupon: any = null;
    if (couponCode) {
      const couponRes = await CouponService.validateCoupon(couponCode, grossAmount);
      if (couponRes.valid) {
        discountAmount = couponRes.discountAmount;
        validatedCoupon = couponRes.coupon;
      } else {
        res.status(400).json({ error: couponRes.message });
        return;
      }
    }

    const netAmount = Math.max(0, grossAmount - discountAmount);

    // 3. Find attributed partner
    const referral = await prisma.referralRelationship.findUnique({
      where: { userId: user.id },
    });
    const partnerId = referral ? referral.partnerId : null;

    const orderId = `ORD-${Date.now().toString().slice(-6)}`;
    const invoiceNumber = `INV-2026-${Date.now().toString().slice(-6)}`;

    // 4. Handle Mock Payment Failure simulation
    if (simulatePaymentFailure) {
      const failedOrder = await prisma.order.create({
        data: {
          id: orderId,
          userId: user.id,
          partnerId,
          grossAmount: Math.round(grossAmount * 100) / 100,
          discountAmount: Math.round(discountAmount * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          status: 'PENDING',
          paymentStatus: 'FAILED',
          paymentMethod,
          couponCode: couponCode || null,
          shippingAddress: shippingAddress || 'Standard Demo Customer Address',
          invoiceNumber,
          items: { create: orderItemsData },
          paymentSimulation: {
            create: {
              transactionRef: `FAIL-TXN-${Date.now()}`,
              amount: Math.round(netAmount * 100) / 100,
              method: paymentMethod,
              status: 'FAILED',
              failureReason: 'Customer simulated payment bank gateway timeout / insufficient demo funds',
            },
          },
        },
        include: { paymentSimulation: true },
      });

      res.status(402).json({
        error: 'Simulated payment failed as requested for testing failure scenarios',
        order: failedOrder,
      });
      return;
    }

    // 5. Successful Order Transaction:
    // Decrement inventory, record movements, create order, commission ledger, reminder
    const newOrder = await prisma.$transaction(async (tx) => {
      // Create order
      const ord = await tx.order.create({
        data: {
          id: orderId,
          userId: user.id,
          partnerId,
          grossAmount: Math.round(grossAmount * 100) / 100,
          discountAmount: Math.round(discountAmount * 100) / 100,
          netAmount: Math.round(netAmount * 100) / 100,
          totalCost: Math.round(totalCost * 100) / 100,
          status: 'PAID',
          paymentStatus: 'SUCCESS',
          paymentMethod,
          couponCode: couponCode || null,
          shippingAddress: shippingAddress || 'Standard Demo Customer Address',
          invoiceNumber,
          items: { create: orderItemsData },
          paymentSimulation: {
            create: {
              transactionRef: `SUCC-TXN-${Date.now()}`,
              amount: Math.round(netAmount * 100) / 100,
              method: paymentMethod,
              status: 'SUCCESS',
            },
          },
        },
      });

      // Update coupon redemptions if applied
      if (validatedCoupon) {
        await tx.coupon.update({
          where: { id: validatedCoupon.id },
          data: { currentRedemptions: { increment: 1 } },
        });

        await tx.couponRedemption.create({
          data: {
            couponId: validatedCoupon.id,
            orderId: ord.id,
            userId: user.id,
            discountApplied: discountAmount,
          },
        });
      }

      // Decrement product inventory and record movement
      for (const item of orderItemsData) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.productId,
            changeQuantity: -item.quantity,
            reason: 'ORDER_PLACED',
            referenceId: ord.id,
          },
        });
      }

      return ord;
    });

    // 6. Record Commission Simulation for the attributed partner
    if (partnerId) {
      await CommissionService.recordOrderCommission(newOrder.id, partnerId, newOrder.netAmount, 6.0);
    }

    // 7. Update User's 4-month Purchase Cycle reminder
    await ReminderService.recordPurchase(user.id);

    // 8. Clear user's shopping cart
    const userCart = await prisma.cart.findUnique({ where: { userId: user.id } });
    if (userCart) {
      await prisma.cartItem.deleteMany({ where: { cartId: userCart.id } });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'ORDER_PLACED',
        entityType: 'ORDER',
        entityId: newOrder.id,
        details: `Order placed for ₹${newOrder.netAmount} with ${orderItemsData.length} items`,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    const populated = await prisma.order.findUnique({
      where: { id: newOrder.id },
      include: {
        items: { include: { product: true } },
        paymentSimulation: true,
        commissionLedgers: true,
      },
    });

    res.status(201).json(populated);
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Order checkout failed' });
  }
});

// Cancel & Refund simulation
router.post(
  '/:id/cancel-refund',
  authenticate,
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { reason = 'Customer requested cancellation during demo' } = req.body;
      const user = req.user!;

      const order = await prisma.order.findUnique({
        where: { id },
        include: { items: true, paymentSimulation: true },
      });

      if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
      }

      if (order.status === 'REFUNDED' || order.status === 'CANCELLED') {
        res.status(400).json({ error: 'This order is already cancelled or refunded' });
        return;
      }

      // Permissions check
      if (user.role === 'USER' && order.userId !== user.id) {
        res.status(403).json({ error: 'Forbidden: You cannot cancel another user order' });
        return;
      }

      // Restock products
      for (const item of order.items) {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: item.quantity } },
        });

        await prisma.inventoryMovement.create({
          data: {
            productId: item.productId,
            changeQuantity: item.quantity,
            reason: 'ORDER_CANCELLED',
            referenceId: order.id,
          },
        });
      }

      // Record refund simulation
      const refund = await prisma.refundSimulation.create({
        data: {
          orderId: order.id,
          refundRef: `REF-${Date.now().toString().slice(-6)}`,
          amount: order.netAmount,
          reason,
          status: 'PROCESSED',
        },
      });

      // Reverse commission ledger
      await CommissionService.reverseCommission(order.id, reason);

      // Update order status
      const updatedOrder = await prisma.order.update({
        where: { id: order.id },
        data: {
          status: 'REFUNDED',
          paymentStatus: 'REFUNDED',
        },
        include: {
          items: { include: { product: true } },
          refundSimulation: true,
          commissionLedgers: true,
        },
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'ORDER_REFUNDED',
          entityType: 'ORDER',
          entityId: order.id,
          details: `Simulated refund processed for ₹${order.netAmount}`,
          ipAddress: req.ip || '127.0.0.1',
        },
      });

      res.json(updatedOrder);
    } catch (error) {
      console.error('Cancel/refund error:', error);
      res.status(500).json({ error: 'Failed to process refund simulation' });
    }
  }
);

export default router;

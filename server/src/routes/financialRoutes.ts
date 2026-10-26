import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { FinancialService } from '../services/financialService';

const router = Router();

// Financial Summary (Owner only)
router.get(
  '/summary',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const summary = await FinancialService.calculateFinancialSummary();
      res.json(summary);
    } catch (error) {
      console.error('Financial summary error:', error);
      res.status(500).json({ error: 'Failed to compute financial summary' });
    }
  }
);

// List expenses (Owner only)
router.get(
  '/expenses',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const expenses = await prisma.expense.findMany({
        orderBy: { expenseDate: 'desc' },
      });
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch expenses' });
    }
  }
);

const createExpenseSchema = z.object({
  category: z.enum(['Logistics', 'Warehouse', 'IT & Software', 'Marketing', 'Compliance', 'Office']),
  amount: z.number().positive(),
  expenseDate: z.string().or(z.date()),
  description: z.string().min(3),
  referenceNumber: z.string().min(2),
  documentPlaceholder: z.string().optional(),
});

// Create new expense (Owner only)
router.post(
  '/expenses',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = createExpenseSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid expense payload', details: parsed.error.issues });
        return;
      }

      const id = `EXP-${Date.now().toString().slice(-4)}`;
      const expense = await prisma.expense.create({
        data: {
          id,
          category: parsed.data.category,
          amount: Math.round(parsed.data.amount * 100) / 100,
          expenseDate: new Date(parsed.data.expenseDate),
          description: parsed.data.description,
          referenceNumber: parsed.data.referenceNumber,
          documentPlaceholder: parsed.data.documentPlaceholder || 'mock_voucher_attachment.pdf',
          approvalStatus: 'APPROVED',
        },
      });

      res.status(201).json(expense);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'An expense with this reference number already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to record expense' });
    }
  }
);

// List mock inter-company transfers (Owner only)
router.get(
  '/transfers',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const transfers = await prisma.financialTransferRecord.findMany({
        orderBy: { transferDate: 'desc' },
      });
      res.json({
        transfers,
        notice:
          'Informational Register: Demonstrates inter-company fund flows between subsidiaries and fulfillment entities for accounting audit visibility.',
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transfer register' });
    }
  }
);

// Create transfer record (Owner only)
router.post(
  '/transfers',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { sendingEntity, receivingEntity, amount, businessPurpose, invoiceReference } = req.body;
      if (!sendingEntity || !receivingEntity || !amount || !businessPurpose || !invoiceReference) {
        res.status(400).json({ error: 'All transfer fields are required' });
        return;
      }

      const id = `TXR-${Date.now().toString().slice(-4)}`;
      const transfer = await prisma.financialTransferRecord.create({
        data: {
          id,
          sendingEntity,
          receivingEntity,
          amount: Math.round(Number(amount) * 100) / 100,
          businessPurpose,
          invoiceReference,
          approvalStatus: 'APPROVED',
        },
      });

      res.status(201).json(transfer);
    } catch (error) {
      res.status(500).json({ error: 'Failed to record inter-company transfer' });
    }
  }
);

export default router;

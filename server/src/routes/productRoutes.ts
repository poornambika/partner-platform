import { Router, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { authenticate, requireRole, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// List products
router.get('/', async (req, res): Promise<void> => {
  try {
    const { category, search, activeOnly } = req.query;

    const products = await prisma.product.findMany({
      where: {
        ...(category ? { category: String(category) } : {}),
        ...(activeOnly === 'true' ? { isActive: true } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: String(search) } },
                { description: { contains: String(search) } },
                { id: { contains: String(search) } },
              ],
            }
          : {}),
      },
      orderBy: { id: 'asc' },
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Single product
router.get('/:id', async (req, res): Promise<void> => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: {
        inventoryMovements: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

const createProductSchema = z.object({
  id: z.string().min(2),
  name: z.string().min(2),
  slug: z.string().min(2),
  category: z.string(),
  description: z.string(),
  imageUrl: z.string().url(),
  sellingPrice: z.number().positive(),
  costPrice: z.number().positive(),
  stockQuantity: z.number().int().nonnegative(),
});

// Create product (Owner only)
router.post(
  '/',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const parsed = createProductSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: 'Invalid product payload', details: parsed.error.issues });
        return;
      }

      const product = await prisma.product.create({
        data: {
          ...parsed.data,
          inventoryMovements: {
            create: {
              changeQuantity: parsed.data.stockQuantity,
              reason: 'INITIAL_STOCK',
              referenceId: 'MANUAL_CREATION',
            },
          },
        },
      });

      res.status(201).json(product);
    } catch (error: any) {
      if (error.code === 'P2002') {
        res.status(409).json({ error: 'A product with this ID or slug already exists' });
        return;
      }
      res.status(500).json({ error: 'Failed to create product' });
    }
  }
);

// Update product / restock (Owner only)
router.put(
  '/:id',
  authenticate,
  requireRole('OWNER'),
  async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { name, sellingPrice, costPrice, stockQuantity, isActive, description, imageUrl, category } = req.body;

      const existing = await prisma.product.findUnique({ where: { id } });
      if (!existing) {
        res.status(404).json({ error: 'Product not found' });
        return;
      }

      let diffStock = 0;
      if (stockQuantity !== undefined && stockQuantity !== existing.stockQuantity) {
        diffStock = stockQuantity - existing.stockQuantity;
      }

      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...(name ? { name } : {}),
          ...(sellingPrice !== undefined ? { sellingPrice: Number(sellingPrice) } : {}),
          ...(costPrice !== undefined ? { costPrice: Number(costPrice) } : {}),
          ...(stockQuantity !== undefined ? { stockQuantity: Number(stockQuantity) } : {}),
          ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {}),
          ...(description ? { description } : {}),
          ...(imageUrl ? { imageUrl } : {}),
          ...(category ? { category } : {}),
          ...(diffStock !== 0
            ? {
                inventoryMovements: {
                  create: {
                    changeQuantity: diffStock,
                    reason: diffStock > 0 ? 'RESTOCK' : 'MANUAL_ADJUSTMENT',
                    referenceId: `ADMIN_UPDATE_${Date.now()}`,
                  },
                },
              }
            : {}),
        },
      });

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Failed to update product' });
    }
  }
);

export default router;

import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '../prisma';
import { generateToken, AuthenticatedRequest, authenticate, AuthUser } from '../middleware/auth';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// Regular credentials login
router.post('/login', async (req, res): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Invalid email or password format' });
      return;
    }

    const { email, password } = parse.data;
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        partnerProfile: true,
        referralRelationship: {
          include: { partner: true },
        },
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'SUSPENDED') {
      res.status(403).json({ error: 'This demo account is currently suspended by the owner' });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      status: user.status,
    };

    const token = generateToken(authUser);

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'USER_LOGIN',
        entityType: 'AUTH',
        entityId: user.id,
        details: `Successful login for ${user.role} (${user.id})`,
        ipAddress: req.ip || '127.0.0.1',
      },
    });

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        partnerProfile: user.partnerProfile,
        assignedPartner: user.referralRelationship?.partner,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error during authentication' });
  }
});

// Demo account switcher endpoint (returns JWT token for any requested account)
router.post('/switch-account', async (req, res): Promise<void> => {
  try {
    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ error: 'userId is required' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        partnerProfile: true,
        referralRelationship: {
          include: { partner: true },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: `Account ${userId} not found` });
      return;
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role as any,
      status: user.status,
    };

    const token = generateToken(authUser);

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        partnerProfile: user.partnerProfile,
        assignedPartner: user.referralRelationship?.partner,
      },
    });
  } catch (error) {
    console.error('Switch account error:', error);
    res.status(500).json({ error: 'Internal server error during account switch' });
  }
});

// List all 41 demo accounts for the quick switcher
router.get('/demo-accounts', async (req, res): Promise<void> => {
  try {
    const accounts = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        partnerProfile: {
          select: {
            referralCode: true,
            branchName: true,
          },
        },
        referralRelationship: {
          select: {
            partnerId: true,
            partner: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: { id: 'asc' },
    });

    const owner = accounts.find((a) => a.role === 'OWNER');
    const partners = accounts.filter((a) => a.role === 'PARTNER');
    const users = accounts.filter((a) => a.role === 'USER');

    res.json({
      total: accounts.length,
      owner,
      partners,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch demo accounts' });
  }
});

// Get current profile
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: {
        partnerProfile: true,
        referralRelationship: {
          include: {
            partner: {
              select: {
                id: true,
                name: true,
                email: true,
                partnerProfile: true,
              },
            },
          },
        },
        purchaseReminder: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone,
      address: user.address,
      partnerProfile: user.partnerProfile,
      assignedPartner: user.referralRelationship?.partner,
      purchaseReminder: user.purchaseReminder,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

export default router;

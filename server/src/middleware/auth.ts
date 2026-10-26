import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'demo-secret-key-for-multi-level-platform-2026';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'OWNER' | 'PARTNER' | 'USER';
  status: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: Authentication token is required' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
    
    // Verify user still exists in database and is not suspended
    const dbUser = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, name: true, email: true, role: true, status: true },
    });

    if (!dbUser) {
      res.status(401).json({ error: 'Unauthorized: Account not found' });
      return;
    }

    if (dbUser.status === 'SUSPENDED') {
      res.status(403).json({ error: 'Account suspended. Please contact administrator.' });
      return;
    }

    req.user = {
      id: dbUser.id,
      name: dbUser.name,
      email: dbUser.email,
      role: dbUser.role as 'OWNER' | 'PARTNER' | 'USER',
      status: dbUser.status,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
}

export function requireRole(...allowedRoles: Array<'OWNER' | 'PARTNER' | 'USER'>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized: Authentication required' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: `Forbidden: Access denied. Required role: [${allowedRoles.join(', ')}]. Your role: ${req.user.role}`,
      });
      return;
    }

    next();
  };
}

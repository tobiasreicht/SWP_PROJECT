import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT Authentication Middleware
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      user?: any;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    // In production, verify JWT token
    // const decoded = jwt.verify(token, process.env.JWT_SECRET!);
    // req.userId = (decoded as any).userId;
    
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Read-only API token middleware
export const readTokenMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const headerToken = req.headers['x-api-token'] as string | undefined;
    const bearer = req.headers.authorization?.split(' ')[1];
    const token = headerToken || bearer || (req.query && (req.query as any).api_token);

    const expected = process.env.MOVIE_READ_TOKEN;
    if (!expected) {
      // If no token configured, allow access (development convenience)
      return next();
    }

    // Allow if token matches static read token
    if (token && token === expected) {
      return next();
    }

    // If bearer token present, try verifying as JWT
    if (bearer) {
      try {
        const secret = process.env.JWT_SECRET || 'dev-secret-key';
        const decoded = jwt.verify(bearer, secret) as any;
        // attach user info for downstream handlers
        (req as any).userId = decoded.userId;
        return next();
      } catch (jwtErr) {
        return res.status(401).json({ error: 'Invalid API token' });
      }
    }

    return res.status(401).json({ error: 'Invalid or missing API read token' });

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid API token' });
  }
};

// Admin token middleware for protected operations (imports)
export const adminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const headerToken = req.headers['x-admin-token'] as string | undefined;
    const bearer = req.headers.authorization?.split(' ')[1];
    const token = headerToken || bearer || (req.query && (req.query as any).admin_token);

    const expected = process.env.MOVIE_ADMIN_TOKEN;
    if (!expected) {
      // If no admin token configured, disallow by default
      return res.status(403).json({ error: 'Admin token not configured' });
    }

    if (!token || token !== expected) {
      return res.status(401).json({ error: 'Invalid or missing admin token' });
    }

    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid admin token' });
  }
};
// Error Handler Middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    error: error.message || 'Internal Server Error',
  });
};

import { Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { AuthenticatedRequest, JwtUserPayload } from "../types";
import logger from "../utils/logger";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-this";

export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({ error: "No token provided" });
      return;
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;

    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      permissions: decoded.permissions || [],
    };

    next();
  } catch (error) {
    logger.error("Auth middleware error:", error);
    res.status(401).json({ error: "Invalid token" });
  }
}

export function optionalAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): void {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtUserPayload;
      req.user = {
        id: decoded.id,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions || [],
      };
    }

    next();
  } catch (error) {
    // Invalid token, but continue without user
    next();
  }
}

export function requirePermission(permission: string) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (
      !req.user.permissions.includes(permission) &&
      !req.user.permissions.includes("admin")
    ) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
}

export function requireRole(roles: string[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): void => {
    if (!req.user) {
      res.status(401).json({ error: "Not authenticated" });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: "Insufficient role" });
      return;
    }

    next();
  };
}

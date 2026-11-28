import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthPayload { userId: string; tenantId: string; role: string; }

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ error: "Yetkisiz" });
  try {
    const payload = jwt.verify(header.slice(7), process.env.JWT_SECRET!) as AuthPayload;
    (req as any).auth = payload;
    next();
  } catch {
    return res.status(401).json({ error: "Geçersiz token" });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const auth = (req as any).auth as AuthPayload;
    if (!auth || !roles.includes(auth.role)) return res.status(403).json({ error: "Yetkiniz yok" });
    next();
  };
}

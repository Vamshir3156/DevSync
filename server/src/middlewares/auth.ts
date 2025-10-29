
import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../utils/jwt.js";
import { JwtUser } from "../types.js";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return res.status(401).json({ message: "Missing token" });
  const token = header.slice(7);
  try {
    const user = verifyJwt<JwtUser>(token);
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: "Invalid token" });
  }
}

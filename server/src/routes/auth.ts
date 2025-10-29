
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { signJwt } from "../utils/jwt.js";

const prisma = new PrismaClient();
const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  password: z.string().min(6)
});

router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { email, name, password } = parsed.data;

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(409).json({ message: "Email already registered" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({ data: { email, name, passwordHash } });
  const token = signJwt({ id: user.id, email: user.email, name: user.name });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ errors: parsed.error.flatten() });
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ message: "Invalid credentials" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });

  const token = signJwt({ id: user.id, email: user.email, name: user.name });
  return res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
});

export default router;

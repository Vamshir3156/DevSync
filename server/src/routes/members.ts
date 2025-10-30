import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.get("/:projectId", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { projectId } = req.params;

  const canView = await prisma.project.findFirst({
    where: {
      id: projectId,
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    select: { id: true },
  });
  if (!canView) {
    return res.status(403).json({ message: "Not authorized for this project" });
  }

  const members = await prisma.member.findMany({
    where: { projectId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return res.json(members);
});

router.post("/:projectId", requireAuth, async (req: Request, res: Response) => {
  const ownerId = req.user!.id;
  const { projectId } = req.params;
  const { email, role } = req.body as { email: string; role?: string };

  if (!email?.trim()) {
    return res.status(400).json({ message: "Email is required" });
  }

  const project = await prisma.project.findFirst({
    where: { id: projectId, ownerId },
    select: { id: true },
  });
  if (!project) {
    return res
      .status(403)
      .json({ message: "Only project owner can add members" });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(404).json({ message: "User not found for that email" });
  }

  const member = await prisma.member.upsert({
    where: { userId_projectId: { userId: user.id, projectId } },
    update: { role: role ?? "MEMBER" },
    create: {
      userId: user.id,
      projectId,
      role: role ?? "MEMBER",
    },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return res.status(201).json(member);
});

export default router;

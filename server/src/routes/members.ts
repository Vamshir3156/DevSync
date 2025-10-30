import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";
import { getRole, isAdminish } from "../utils/acl.js"; // <- from acl.ts

const prisma = new PrismaClient();
const router = Router();

router.get("/:projectId", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { projectId } = req.params;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true, ownerId: true, members: { select: { userId: true } } },
  });
  if (!project) return res.status(404).json({ message: "Project not found" });

  const isMember = project.members.some((m) => m.userId === userId);
  const isOwner = project.ownerId === userId;
  if (!isOwner && !isMember)
    return res.status(403).json({ message: "Not authorized" });

  const members = await prisma.member.findMany({
    where: { projectId },
    include: { user: { select: { id: true, email: true, name: true } } },
    orderBy: { user: { name: "asc" } },
  });

  return res.json({ ownerId: project.ownerId, members });
});

router.post("/:projectId", requireAuth, async (req: Request, res: Response) => {
  const requesterId = req.user!.id;
  const { projectId } = req.params;
  const { email, role } = req.body as { email: string; role?: string };

  if (!email?.trim())
    return res.status(400).json({ message: "Email is required" });

  const requesterRole = await getRole(requesterId, projectId);
  if (!isAdminish(requesterRole))
    return res.status(403).json({ message: "Only owner/admin can invite" });

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return res.status(404).json({ message: "Project not found" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user)
    return res.status(404).json({ message: "User not found for that email" });

  if (user.id === project.ownerId) {
    return res
      .status(400)
      .json({ message: "Owner is already part of the project" });
  }

  const member = await prisma.member.upsert({
    where: { userId_projectId: { userId: user.id, projectId } },
    update: { role: role ?? "MEMBER" },
    create: { userId: user.id, projectId, role: role ?? "MEMBER" },
    include: { user: { select: { id: true, email: true, name: true } } },
  });

  return res.status(201).json(member);
});

router.put(
  "/:projectId/:userId",
  requireAuth,
  async (req: Request, res: Response) => {
    const requesterId = req.user!.id;
    const { projectId, userId } = req.params;
    const { role } = req.body as { role: string };

    if (!role) return res.status(400).json({ message: "Role is required" });

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const requesterRole = await getRole(requesterId, projectId);
    if (!isAdminish(requesterRole))
      return res
        .status(403)
        .json({ message: "Only owner/admin can change roles" });

    if (userId === project.ownerId) {
      return res.status(400).json({ message: "Cannot change owner's role" });
    }

    const updated = await prisma.member.update({
      where: { userId_projectId: { userId, projectId } },
      data: { role },
      include: { user: { select: { id: true, email: true, name: true } } },
    });

    return res.json(updated);
  }
);

router.delete(
  "/:projectId/:userId",
  requireAuth,
  async (req: Request, res: Response) => {
    const requesterId = req.user!.id;
    const { projectId, userId } = req.params;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { ownerId: true },
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const requesterRole = await getRole(requesterId, projectId);
    if (!isAdminish(requesterRole))
      return res
        .status(403)
        .json({ message: "Only owner/admin can remove members" });

    if (userId === project.ownerId) {
      return res.status(400).json({ message: "Owner cannot be removed" });
    }

    await prisma.member.delete({
      where: { userId_projectId: { userId, projectId } },
    });
    return res.json({ ok: true });
  }
);

export default router;

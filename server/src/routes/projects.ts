import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";

const prisma = new PrismaClient();
const router = Router();

router.use(requireAuth);

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    orderBy: { updatedAt: "desc" },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      _count: { select: { tasks: true, messages: true, members: true } },
    },
  });

  res.json(projects);
});

router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, description } = req.body as {
    name: string;
    description?: string;
  };

  if (!name?.trim()) {
    return res.status(400).json({ message: "Project name is required" });
  }

  const project = await prisma.project.create({
    data: { name: name.trim(), description, ownerId: userId },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  res.status(201).json(project);
});

router.get("/:id", async (req: Request, res: Response) => {
  const me = req.user!.id;
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      tasks: true,
      messages: {
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, name: true } } },
      },
    },
  });

  if (!project) return res.status(404).json({ message: "Project not found" });

  const isOwner = project.owner.id === me;
  const isMember = project.members.some((m) => m.userId === me);
  if (!isOwner && !isMember)
    return res.status(403).json({ message: "Not authorized" });

  res.json(project);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const me = req.user!.id;
  const { id } = req.params;

  const project = await prisma.project.findUnique({
    where: { id },
    select: { ownerId: true },
  });
  if (!project) return res.status(404).json({ message: "Project not found" });
  if (project.ownerId !== me)
    return res
      .status(403)
      .json({ message: "Only the owner can delete this project" });

  await prisma.project.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;

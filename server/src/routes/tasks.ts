import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";
import { getRole, canRead, canWrite, isAdminish } from "../utils/acl.js";

const prisma = new PrismaClient();
const router = Router();

router.get(
  "/by-project/:projectId",
  requireAuth,
  async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { projectId } = req.params;

    const role = await getRole(userId, projectId);
    if (!canRead(role))
      return res.status(403).json({ message: "Not authorized" });

    const tasks = await prisma.task.findMany({
      where: { projectId },
      orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "asc" }],
    });
    res.json(tasks);
  }
);

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { projectId, title, description, status } = req.body as {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
  };

  const role = await getRole(userId, projectId);
  if (!isAdminish(role))
    return res.status(403).json({ message: "Not authorized" });

  if (!title?.trim())
    return res.status(400).json({ message: "Title is required" });

  const task = await prisma.task.create({
    data: {
      projectId,
      title: title.trim(),
      description: description?.trim() || null,
      status: (status as any) || "todo",
    },
  });
  res.status(201).json(task);
});

router.put("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!existing) return res.status(404).json({ message: "Task not found" });

  const role = await getRole(userId, existing.projectId);
  if (!canWrite(role))
    return res.status(403).json({ message: "Not authorized" });

  const { title, description, status, order, assigneeId } = req.body;
  const updated = await prisma.task.update({
    where: { id },
    data: {
      title,
      description,
      status,
      order,
      assigneeId: assigneeId ?? undefined,
    },
  });
  res.json(updated);
});

router.delete("/:id", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  const existing = await prisma.task.findUnique({
    where: { id },
    select: { projectId: true },
  });
  if (!existing) return res.status(404).json({ message: "Task not found" });

  const role = await getRole(userId, existing.projectId);
  if (!canWrite(role))
    return res.status(403).json({ message: "Not authorized" });

  await prisma.task.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;

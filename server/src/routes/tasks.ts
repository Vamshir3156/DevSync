
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/by-project/:projectId", async (req: Request, res: Response) => {
  const tasks = await prisma.task.findMany({
    where: { projectId: req.params.projectId },
    orderBy: [{ status: "asc" }, { order: "asc" }, { createdAt: "asc" }]
  });
  res.json(tasks);
});

router.post("/", async (req: Request, res: Response) => {
  const { projectId, title, description, status, order } = req.body;
  const task = await prisma.task.create({ data: { projectId, title, description, status, order: order ?? 0 } });
  res.json(task);
});

router.put("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const { title, description, status, order, assigneeId } = req.body;
  const task = await prisma.task.update({ where: { id }, data: { title, description, status, order, assigneeId } });
  res.json(task);
});

router.delete("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  await prisma.task.delete({ where: { id } });
  res.json({ ok: true });
});

export default router;

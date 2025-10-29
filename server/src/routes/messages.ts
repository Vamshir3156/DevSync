
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/by-project/:projectId", async (req: Request, res: Response) => {
  const messages = await prisma.message.findMany({
    where: { projectId: req.params.projectId },
    include: { sender: true },
    orderBy: { createdAt: "asc" }
  });
  res.json(messages);
});

router.post("/", async (req: Request, res: Response) => {
  const { projectId, content } = req.body;
  const message = await prisma.message.create({
    data: { projectId, content, senderId: req.user!.id },
    include: { sender: true }
  });
  res.json(message);
});

export default router;

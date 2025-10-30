import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middlewares/auth.js";
import { getRole, canRead } from "../utils/acl.js";

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

    const messages = await prisma.message.findMany({
      where: { projectId },
      include: { sender: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    res.json(messages);
  }
);

router.post("/", requireAuth, async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { projectId, content } = req.body as {
    projectId: string;
    content: string;
  };

  const role = await getRole(userId, projectId);
  if (!canRead(role))
    return res.status(403).json({ message: "Not authorized" });

  if (!content?.trim())
    return res.status(400).json({ message: "Message cannot be empty" });

  const message = await prisma.message.create({
    data: {
      projectId,
      senderId: userId,
      content: content.trim(),
    },
    include: { sender: { select: { name: true } } },
  });

  res.status(201).json(message);
});

export default router;

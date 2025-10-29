
import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: userId },
        { members: { some: { userId } } }
      ]
    },
    include: { members: { include: { user: true } } }
  });
  res.json(projects);
});

router.post("/", async (req: Request, res: Response) => {
  const userId = req.user!.id;
  const { name, description } = req.body;
  const project = await prisma.project.create({
    data: { name, description, ownerId: userId, members: { create: [{ userId, role: "ADMIN" }] } }
  });
  res.json(project);
});

router.get("/:id", async (req: Request, res: Response) => {
  const id = req.params.id;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { members: { include: { user: true } }, tasks: true }
  });
  res.json(project);
});

export default router;

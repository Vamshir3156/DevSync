import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const email = "demo@devsync.app";
  const passwordHash = await bcrypt.hash("password123", 10);

  const demo = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      name: "Demo User",
      passwordHash,
    },
  });

  const project = await prisma.project.create({
    data: {
      name: "DevSync Demo",
      description: "Demo project seeded with tasks and messages",
      ownerId: demo.id,
      members: {
        create: [{ userId: demo.id, role: "ADMIN" }],
      },
    },
  });

  const tasks = await prisma.$transaction([
    prisma.task.create({
      data: {
        projectId: project.id,
        title: "Design database schema",
        status: "todo",
        order: 1,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        title: "Build auth API",
        status: "in_progress",
        order: 2,
      },
    }),
    prisma.task.create({
      data: {
        projectId: project.id,
        title: "Implement Kanban board",
        status: "done",
        order: 3,
      },
    }),
  ]);

  await prisma.message.createMany({
    data: [
      {
        projectId: project.id,
        senderId: demo.id,
        content: "Welcome to DevSync! 🎉",
      },
      {
        projectId: project.id,
        senderId: demo.id,
        content: "Start by moving tasks between columns.",
      },
    ],
  });

  console.log("Seed complete:", { demo, project, tasksCount: tasks.length });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

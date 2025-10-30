import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER" | null;

export async function getRole(
  userId: string,
  projectId: string
): Promise<Role> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (!project) return null;
  if (project.ownerId === userId) return "OWNER";

  const member = await prisma.member.findUnique({
    where: { userId_projectId: { userId, projectId } },
    select: { role: true },
  });
  return (member?.role as Role) ?? null;
}

export function canRead(role: Role) {
  return (
    role === "OWNER" ||
    role === "ADMIN" ||
    role === "MEMBER" ||
    role === "VIEWER"
  );
}

export function canWrite(role: Role) {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

export function isAdminish(role: Role) {
  return role === "OWNER" || role === "ADMIN";
}

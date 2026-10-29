import { notFound } from "next/navigation";
import { getAdminViewer } from "@/lib/admin-access";
import { canManageEventArchive } from "@/lib/roles";
import { prisma } from "@/lib/prisma";

export default async function EventLayout({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params;
  const viewer = await getAdminViewer();
  const event = await prisma.event.findUnique({ where: { id }, select: { isArchived: true } });
  if (event?.isArchived && !canManageEventArchive(viewer?.role)) notFound();
  return children;
}

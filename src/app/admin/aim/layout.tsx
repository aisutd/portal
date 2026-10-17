import { redirect } from "next/navigation";
import { getAdminViewer } from "@/lib/admin-access";

/**
 * Gated by canManageAim, not isAdmin — an AIM mentor's User.role stays
 * MEMBER, so the blanket admin check the /admin/events layout uses would
 * lock mentors out entirely. Program membership alone gets them in here.
 */
export default async function AdminAimLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const viewer = await getAdminViewer();

  if (!viewer?.canManageAim) {
    redirect("/dashboard");
  }

  return <>{children}</>;
}

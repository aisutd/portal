import { AdminApplicationsShell } from "@/components/admin/admin-applications-shell";

export default async function AdminApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AdminApplicationsShell initialApplicationId={id} />;
}

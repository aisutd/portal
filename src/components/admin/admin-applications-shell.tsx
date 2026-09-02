import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminApplicationsManager } from "@/components/admin/admin-applications-manager";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";
import { getAdminUser } from "@/lib/admin-app-auth";

export async function AdminApplicationsShell({
  initialApplicationId,
}: {
  initialApplicationId?: string;
}) {
  const currentUser = await getAdminUser();
  return (
    <>
      <div className="bg-cream px-5 pb-5 pt-5 md:hidden">
        <MobileAdminNav active="Applications" />
        <AdminApplicationsManager userRole={currentUser.user?.role} initialApplicationId={initialApplicationId} />
      </div>

      <div className="hidden min-h-screen w-full bg-cream md:flex">
        <AdminSidebar active="Applications" />
        <AdminApplicationsManager
          userRole={currentUser.user?.role}
          initialApplicationId={initialApplicationId}
          embedded
        />
      </div>
    </>
  );
}

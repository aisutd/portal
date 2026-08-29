import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminApplicationsManager } from "@/components/admin/admin-applications-manager";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";

export async function AdminApplicationsShell({
  initialApplicationId,
}: {
  initialApplicationId?: string;
}) {
  return (
    <>
      <div className="bg-cream px-5 pb-5 pt-5 md:hidden">
        <MobileAdminNav active="Applications" />
        <AdminApplicationsManager initialApplicationId={initialApplicationId} />
      </div>

      <div className="hidden min-h-screen w-full bg-cream md:flex">
        <AdminSidebar active="Applications" />
        <AdminApplicationsManager
          initialApplicationId={initialApplicationId}
          embedded
        />
      </div>
    </>
  );
}

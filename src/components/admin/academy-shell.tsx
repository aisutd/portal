import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { MobileAdminNav } from "@/components/mobile/admin/MobileAdminNav";

/**
 * Page chrome shared by every Academy admin route. The sidebar rail is
 * desktop-only and swaps to the horizontal admin pill nav below `md`, so the
 * pages themselves only describe their own content.
 */
export function AdminAcademyShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full bg-cream">
      <div className="hidden md:flex">
        <AdminSidebar active="Academy" />
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-[20px] px-5 pb-14 pt-5 md:gap-[28px] md:p-[46px]">
        <div className="md:hidden">
          <MobileAdminNav active="Academy" />
        </div>
        {children}
      </div>
    </div>
  );
}

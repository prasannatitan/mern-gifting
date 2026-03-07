import { ReactNode } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export const AdminLayout = ({ children, title, subtitle }: AdminLayoutProps) => {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-h-screen">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
};

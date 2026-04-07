import { ReactNode } from "react";
import { CeeSidebar } from "@/components/cee/CeeSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";

interface CeeLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export function CeeLayout({ children, title, subtitle }: CeeLayoutProps) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <CeeSidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader title={title} subtitle={subtitle} />
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

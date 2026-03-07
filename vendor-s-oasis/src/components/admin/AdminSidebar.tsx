import {
  Package,
  ShoppingCart,
  FileText,
  Truck,
  CreditCard,
  LayoutDashboard,
  ChevronLeft,
  ChevronRight,
  Shield,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";

const navItems = [
  { title: "Overview", url: "/admin", icon: LayoutDashboard },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Cost Letters", url: "/admin/cost-letters", icon: FileText },
  { title: "Deliveries", url: "/admin/deliveries", icon: Truck },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
];

export const AdminSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`gradient-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo area */}
      <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2 animate-slide-in">
            <div className="w-8 h-8 rounded-lg bg-destructive/80 flex items-center justify-center">
              <Shield className="w-4 h-4 text-destructive-foreground" />
            </div>
            <span className="text-sidebar-accent-foreground font-semibold text-lg tracking-tight">
              Admin Panel
            </span>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-destructive/80 flex items-center justify-center mx-auto">
            <Shield className="w-4 h-4 text-destructive-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/admin"}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors text-sm"
            activeClassName="bg-sidebar-accent text-[#fff] font-medium"
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-12 border-t border-sidebar-border text-sidebar-foreground hover:text-sidebar-accent-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
};

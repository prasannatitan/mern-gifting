import { LayoutDashboard, ShoppingCart, Building2, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";

const navItems = [
  { title: "Overview", url: "/cee", icon: LayoutDashboard },
  { title: "Order queue", url: "/cee/orders", icon: ShoppingCart },
  { title: "My stores", url: "/cee/stores", icon: Building2 },
];

export function CeeSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={`gradient-sidebar flex flex-col border-r border-sidebar-border transition-all duration-300 ${
        collapsed ? "w-16" : "w-64"
      }`}
    >
      <div className="flex h-16 items-center border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex animate-slide-in items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90">
              <MapPin className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
              CEE Console
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-8 w-8 items-center justify-center rounded-lg bg-primary/90">
            <MapPin className="h-4 w-4 text-primary-foreground" />
          </div>
        )}
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            end={item.url === "/cee"}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeClassName="bg-sidebar-accent font-medium text-[#fff]"
          >
            <item.icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{item.title}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-sidebar-border text-sidebar-foreground transition-colors hover:text-sidebar-accent-foreground"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}

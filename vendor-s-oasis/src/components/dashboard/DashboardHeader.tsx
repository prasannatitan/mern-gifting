import { Bell, User, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
}

export const DashboardHeader = ({ title, subtitle }: DashboardHeaderProps) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="h-16 border-b border-border bg-card flex items-center justify-between px-6 shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        )}
      </div>
      <div className="flex items-center gap-3">
        {user && (
          <span className="text-xs text-muted-foreground hidden sm:inline">
            {user.email}
          </span>
        )}
        <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5 text-muted-foreground" />
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>
    </header>
  );
};

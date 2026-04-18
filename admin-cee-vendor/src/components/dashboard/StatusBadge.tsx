import { LucideIcon } from "lucide-react";

type BadgeVariant = "success" | "warning" | "info" | "destructive" | "muted";

interface StatusBadgeProps {
  label: string;
  variant: BadgeVariant;
  icon?: LucideIcon;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning",
  info: "bg-info/10 text-info",
  destructive: "bg-destructive/10 text-destructive",
  muted: "bg-secondary text-muted-foreground",
};

export const StatusBadge = ({ label, variant, icon: Icon }: StatusBadgeProps) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${variantClasses[variant]}`}
    >
      {Icon && <Icon className="w-3 h-3" />}
      {label}
    </span>
  );
};

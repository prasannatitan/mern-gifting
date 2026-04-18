import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  trend?: { value: string; positive: boolean };
  accent?: boolean;
}

export const StatCard = ({ label, value, icon, trend, accent }: StatCardProps) => {
  return (
    <div
      className={`rounded-xl p-5 shadow-card transition-shadow hover:shadow-card-hover animate-fade-in ${
        accent ? "gradient-accent text-accent-foreground" : "bg-card"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${accent ? "text-accent-foreground/80" : "text-muted-foreground"}`}>
            {label}
          </p>
          <p className="text-2xl font-bold mt-1">{value}</p>
          {trend && (
            <p
              className={`text-xs mt-1 font-medium ${
                accent
                  ? "text-accent-foreground/80"
                  : trend.positive
                  ? "text-success"
                  : "text-destructive"
              }`}
            >
              {trend.positive ? "↑" : "↓"} {trend.value}
            </p>
          )}
        </div>
        <div className={`p-2 rounded-lg ${accent ? "bg-accent-foreground/10" : "bg-secondary"}`}>
          {icon}
        </div>
      </div>
    </div>
  );
};

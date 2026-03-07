import { Check, Clock, Circle } from "lucide-react";

interface Step {
  label: string;
  status: "completed" | "active" | "pending";
}

interface VerificationStepsProps {
  steps: Step[];
  size?: "sm" | "md";
}

export const VerificationSteps = ({ steps, size = "md" }: VerificationStepsProps) => {
  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";
  const dotSize = size === "sm" ? "w-6 h-6" : "w-8 h-8";

  return (
    <div className="flex items-center gap-1">
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="flex items-center gap-1.5">
            <div
              className={`${dotSize} rounded-full flex items-center justify-center shrink-0 ${
                step.status === "completed"
                  ? "bg-success text-success-foreground"
                  : step.status === "active"
                  ? "bg-warning text-warning-foreground animate-pulse-dot"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {step.status === "completed" ? (
                <Check className={iconSize} />
              ) : step.status === "active" ? (
                <Clock className={iconSize} />
              ) : (
                <Circle className={iconSize} />
              )}
            </div>
            {size === "md" && (
              <span
                className={`text-xs whitespace-nowrap ${
                  step.status === "completed"
                    ? "text-success font-medium"
                    : step.status === "active"
                    ? "text-warning font-medium"
                    : "text-muted-foreground"
                }`}
              >
                {step.label}
              </span>
            )}
          </div>
          {i < steps.length - 1 && (
            <div
              className={`h-px w-4 ${
                step.status === "completed" ? "bg-success" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
};

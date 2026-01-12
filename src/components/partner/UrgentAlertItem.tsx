import { cn } from "@/lib/utils";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

type AlertType = "critical" | "warning" | "info";

interface UrgentAlertItemProps {
  type: AlertType;
  memberName: string;
  message: string;
  timestamp: string;
  className?: string;
}

const alertConfig: Record<AlertType, { icon: typeof AlertCircle; color: string; bgColor: string }> = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-100",
  },
  warning: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
};

export const UrgentAlertItem = ({
  type,
  memberName,
  message,
  timestamp,
  className,
}: UrgentAlertItemProps) => {
  const config = alertConfig[type];
  const Icon = config.icon;
  
  return (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors",
      className
    )}>
      <div className={cn(
        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
        config.bgColor
      )}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {memberName}
        </p>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {timestamp}
        </p>
      </div>
    </div>
  );
};

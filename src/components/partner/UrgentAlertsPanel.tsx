import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface Alert {
  id: string;
  patientName: string;
  issue: string;
  time: string;
  severity: "critical" | "warning" | "info";
}

// Mock alerts - in production, these would come from real data
const mockAlerts: Alert[] = [
  {
    id: "1",
    patientName: "Arjun Mehta",
    issue: "Document Pending Review",
    time: "12M AGO",
    severity: "critical",
  },
  {
    id: "2",
    patientName: "Priya Sharma",
    issue: "Consent Expiring Soon",
    time: "45M AGO",
    severity: "warning",
  },
  {
    id: "3",
    patientName: "Vikram Singh",
    issue: "New Document Uploaded",
    time: "1H AGO",
    severity: "info",
  },
];

const severityColors = {
  critical: "bg-red-500",
  warning: "bg-amber-500",
  info: "bg-blue-500",
};

export const UrgentAlertsPanel = () => {
  return (
    <Card className="shadow-soft border-border/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Urgent Alerts</CardTitle>
        <Button variant="link" className="text-accent p-0 h-auto font-medium text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {mockAlerts.map((alert) => (
          <button
            key={alert.id}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
          >
            {/* Severity Indicator */}
            <div className={cn(
              "w-1 h-10 rounded-full flex-shrink-0",
              severityColors[alert.severity]
            )} />
            
            {/* Alert Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <p className="font-medium text-foreground text-sm truncate">
                  {alert.patientName}
                </p>
                <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                  {alert.time}
                </span>
              </div>
              <p className="text-xs text-muted-foreground truncate">
                {alert.issue}
              </p>
            </div>
            
            {/* Arrow */}
            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
          </button>
        ))}

        {/* CareBag Sync Card */}
        <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">CareBag Sync</p>
              <p className="text-xs text-muted-foreground">
                Auto-sync enabled for {mockAlerts.length} patients
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

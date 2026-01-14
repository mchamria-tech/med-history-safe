import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight, Activity, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface ClientActivity {
  id: string;
  clientName: string;
  issue: string;
  time: string;
  severity: "critical" | "warning" | "info";
}

interface UrgentAlertsPanelProps {
  partnerId?: string;
}

export const UrgentAlertsPanel = ({ partnerId }: UrgentAlertsPanelProps) => {
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [clientCount, setClientCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (partnerId) {
      fetchClientActivities();
    }
  }, [partnerId]);

  const fetchClientActivities = async () => {
    try {
      // Get linked clients with their profiles
      const { data: linkedClients, error: clientsError } = await supabase
        .from("partner_users")
        .select(`
          id,
          linked_at,
          consent_given,
          profile_id,
          profiles:profile_id (
            id,
            name,
            created_at
          )
        `)
        .eq("partner_id", partnerId!)
        .order("linked_at", { ascending: false })
        .limit(5);

      if (clientsError) throw clientsError;

      // Get total client count
      const { count } = await supabase
        .from("partner_users")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partnerId!);

      setClientCount(count || 0);

      // Get recent documents for these clients
      const profileIds = linkedClients?.map(c => c.profile_id) || [];
      
      let recentDocs: any[] = [];
      if (profileIds.length > 0) {
        const { data: docs } = await supabase
          .from("documents")
          .select("id, profile_id, document_name, created_at")
          .eq("partner_id", partnerId!)
          .order("created_at", { ascending: false })
          .limit(10);
        
        recentDocs = docs || [];
      }

      // Build activity list from real data
      const activityList: ClientActivity[] = [];

      // Add recent document uploads
      recentDocs.forEach((doc) => {
        const client = linkedClients?.find(c => c.profile_id === doc.profile_id);
        const clientName = (client?.profiles as any)?.name || "Unknown Client";
        const timeAgo = getTimeAgo(new Date(doc.created_at));
        
        activityList.push({
          id: doc.id,
          clientName,
          issue: "New Document Uploaded",
          time: timeAgo,
          severity: "info",
        });
      });

      // Add recently linked clients
      linkedClients?.forEach((client) => {
        const clientName = (client.profiles as any)?.name || "Unknown Client";
        const linkedAt = client.linked_at ? new Date(client.linked_at) : new Date();
        const timeAgo = getTimeAgo(linkedAt);
        
        // Check if consent is pending
        if (!client.consent_given) {
          activityList.push({
            id: `consent-${client.id}`,
            clientName,
            issue: "Consent Pending",
            time: timeAgo,
            severity: "warning",
          });
        }
      });

      // Sort by most recent and take top 5
      const sortedActivities = activityList.slice(0, 5);
      
      // If no activities, show linked clients as recent activity
      if (sortedActivities.length === 0 && linkedClients && linkedClients.length > 0) {
        linkedClients.slice(0, 3).forEach((client) => {
          const clientName = (client.profiles as any)?.name || "Unknown Client";
          const linkedAt = client.linked_at ? new Date(client.linked_at) : new Date();
          const timeAgo = getTimeAgo(linkedAt);
          
          sortedActivities.push({
            id: client.id,
            clientName,
            issue: "Linked to your account",
            time: timeAgo,
            severity: "info",
          });
        });
      }

      setActivities(sortedActivities);
    } catch (error) {
      console.error("Error fetching client activities:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}M AGO`;
    if (diffHours < 24) return `${diffHours}H AGO`;
    if (diffDays < 7) return `${diffDays}D AGO`;
    return date.toLocaleDateString();
  };

  const severityColors = {
    critical: "bg-red-500",
    warning: "bg-amber-500",
    info: "bg-blue-500",
  };

  return (
    <Card className="shadow-soft border-border/50 h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        <Button variant="link" className="text-accent p-0 h-auto font-medium text-sm">
          View All
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted/50 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No recent client activity</p>
            <p className="text-xs mt-1">Link clients to see their activity here</p>
          </div>
        ) : (
          activities.map((activity) => (
            <button
              key={activity.id}
              className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group"
            >
              {/* Severity Indicator */}
              <div className={cn(
                "w-1 h-10 rounded-full flex-shrink-0",
                severityColors[activity.severity]
              )} />
              
              {/* Activity Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="font-medium text-foreground text-sm truncate">
                    {activity.clientName}
                  </p>
                  <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
                    {activity.time}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {activity.issue}
                </p>
              </div>
              
              {/* Arrow */}
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
            </button>
          ))
        )}

        {/* CareBag Sync Card */}
        <div className="mt-4 p-4 rounded-xl bg-accent/5 border border-accent/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
              <Activity className="h-5 w-5 text-accent" />
            </div>
            <div>
              <p className="font-medium text-foreground text-sm">CareBag Sync</p>
              <p className="text-xs text-muted-foreground">
                {clientCount > 0 
                  ? `Auto-sync enabled for ${clientCount} client${clientCount !== 1 ? 's' : ''}`
                  : "No clients linked yet"
                }
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

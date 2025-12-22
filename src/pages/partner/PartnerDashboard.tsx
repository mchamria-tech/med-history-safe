import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { Users, FileText, Upload, TrendingUp } from "lucide-react";

const PartnerDashboard = () => {
  const { partner } = usePartnerCheck();
  const [stats, setStats] = useState({
    linkedUsers: 0,
    totalDocuments: 0,
    documentsThisMonth: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (partner?.id) {
      fetchStats();
    }
  }, [partner?.id]);

  const fetchStats = async () => {
    try {
      // Get linked users count
      const { count: usersCount } = await supabase
        .from("partner_users")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner!.id);

      // Get total documents uploaded by this partner
      const { count: docsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner!.id);

      // Get documents this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: monthlyDocsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("partner_id", partner!.id)
        .gte("created_at", startOfMonth.toISOString());

      setStats({
        linkedUsers: usersCount || 0,
        totalDocuments: docsCount || 0,
        documentsThisMonth: monthlyDocsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: "Linked Users",
      value: stats.linkedUsers,
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "Total Documents",
      value: stats.totalDocuments,
      icon: FileText,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
    },
    {
      title: "Uploads This Month",
      value: stats.documentsThisMonth,
      icon: Upload,
      color: "text-accent",
      bgColor: "bg-accent/10",
    },
  ];

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-3">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold text-foreground mt-1">
                        {isLoading ? "..." : stat.value}
                      </p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor}`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Partner Info Card */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Partner Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Partner Code</p>
                <p className="text-lg font-mono font-semibold text-foreground">
                  {partner?.partner_code}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-lg text-foreground">{partner?.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    partner?.is_active
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {partner?.is_active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2">
              <a
                href="/partner/users"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Users className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Manage Users</p>
                  <p className="text-sm text-muted-foreground">
                    Link new users or view linked profiles
                  </p>
                </div>
              </a>
              <a
                href="/partner/upload"
                className="flex items-center gap-3 p-4 rounded-lg border border-border hover:bg-muted transition-colors"
              >
                <Upload className="h-5 w-5 text-accent" />
                <div>
                  <p className="font-medium text-foreground">Upload Document</p>
                  <p className="text-sm text-muted-foreground">
                    Upload documents for linked users
                  </p>
                </div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </PartnerLayout>
  );
};

export default PartnerDashboard;

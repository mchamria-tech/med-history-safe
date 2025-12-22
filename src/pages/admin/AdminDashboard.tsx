import { useEffect, useState } from "react";
import { Users, Building2, FileText, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import StatsCard from "@/components/admin/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DashboardStats {
  totalUsers: number;
  totalPartners: number;
  totalDocuments: number;
  activePartners: number;
}

const AdminDashboard = () => {
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalPartners: 0,
    totalDocuments: 0,
    activePartners: 0,
  });
  const [recentPartners, setRecentPartners] = useState<any[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchStats();
      fetchRecentPartners();
    }
  }, [isSuperAdmin]);

  const fetchStats = async () => {
    try {
      // Fetch total profiles (users)
      const { count: usersCount } = await supabase
        .from("profiles")
        .select("*", { count: "exact", head: true });

      // Fetch total partners
      const { count: partnersCount } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true });

      // Fetch active partners
      const { count: activePartnersCount } = await supabase
        .from("partners")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Fetch total documents
      const { count: documentsCount } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true });

      setStats({
        totalUsers: usersCount || 0,
        totalPartners: partnersCount || 0,
        totalDocuments: documentsCount || 0,
        activePartners: activePartnersCount || 0,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const fetchRecentPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      setRecentPartners(data || []);
    } catch (error) {
      console.error("Error fetching recent partners:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <AdminLayout title="Dashboard">
      <div className="space-y-6 animate-fade-in">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Users"
            value={stats.totalUsers}
            description="Registered user profiles"
            icon={Users}
          />
          <StatsCard
            title="Total Partners"
            value={stats.totalPartners}
            description={`${stats.activePartners} active`}
            icon={Building2}
          />
          <StatsCard
            title="Documents"
            value={stats.totalDocuments}
            description="Total uploaded documents"
            icon={FileText}
          />
          <StatsCard
            title="Partner Growth"
            value={`${stats.activePartners}`}
            description="Active partner accounts"
            icon={TrendingUp}
            trend={{ value: 12, isPositive: true }}
          />
        </div>

        {/* Recent Partners */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Recent Partners</CardTitle>
            <CardDescription>Latest partner registrations</CardDescription>
          </CardHeader>
          <CardContent>
            {recentPartners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">
                No partners registered yet
              </p>
            ) : (
              <div className="space-y-3">
                {recentPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{partner.name}</p>
                      <p className="text-xs text-muted-foreground">
                        Code: {partner.partner_code} • {partner.email}
                      </p>
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        partner.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {partner.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;

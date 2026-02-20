import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ["hsl(15, 75%, 60%)", "hsl(220, 25%, 25%)", "hsl(152, 60%, 42%)", "hsl(38, 92%, 50%)"];

const AdminAnalytics = () => {
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const [documentsByType, setDocumentsByType] = useState<any[]>([]);
  const [userGrowth, setUserGrowth] = useState<any[]>([]);
  const [partnerStats, setPartnerStats] = useState<any[]>([]);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchAnalytics();
    }
  }, [isSuperAdmin]);

  const fetchAnalytics = async () => {
    try {
      // Run all queries in parallel
      const [docsResult, profilesResult, partnersResult, allPartnerDocsResult] = await Promise.all([
        supabase.from("documents").select("document_type"),
        supabase.from("profiles").select("created_at"),
        supabase.from("partners").select("id, name"),
        supabase.from("documents").select("partner_id").not("partner_id", "is", null),
      ]);

      // Process documents by type
      const typeCount: Record<string, number> = {};
      docsResult.data?.forEach((doc) => {
        const type = doc.document_type || "Unknown";
        typeCount[type] = (typeCount[type] || 0) + 1;
      });
      setDocumentsByType(
        Object.entries(typeCount).map(([name, value]) => ({ name, value }))
      );

      // Process user growth (last 6 months)
      const monthlyCount: Record<string, number> = {};
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const monthKey = month.toLocaleDateString("en-US", { month: "short" });
        monthlyCount[monthKey] = 0;
      }
      profilesResult.data?.forEach((profile) => {
        const date = new Date(profile.created_at);
        const monthKey = date.toLocaleDateString("en-US", { month: "short" });
        if (monthlyCount.hasOwnProperty(monthKey)) {
          monthlyCount[monthKey]++;
        }
      });
      setUserGrowth(
        Object.entries(monthlyCount).map(([month, users]) => ({ month, users }))
      );

      // Process partner document stats (count client-side instead of N+1 queries)
      const partnerDocCount: Record<string, number> = {};
      allPartnerDocsResult.data?.forEach((doc) => {
        partnerDocCount[doc.partner_id] = (partnerDocCount[doc.partner_id] || 0) + 1;
      });

      const partnerNameMap = new Map(partnersResult.data?.map(p => [p.id, p.name]) || []);
      const partnerDocs = Object.entries(partnerDocCount)
        .map(([id, documents]) => ({ name: partnerNameMap.get(id) || "Unknown", documents }))
        .sort((a, b) => b.documents - a.documents)
        .slice(0, 5);

      setPartnerStats(partnerDocs);
    } catch (error) {
      console.error("Error fetching analytics:", error);
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
    <AdminLayout title="Analytics">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Growth Chart */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">User Growth</CardTitle>
              <CardDescription>New user registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                    <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(220, 15%, 90%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="users" fill="hsl(15, 75%, 60%)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Documents by Type */}
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg">Documents by Type</CardTitle>
              <CardDescription>Distribution of document categories</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                {documentsByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={documentsByType}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} (${(percent * 100).toFixed(0)}%)`
                        }
                        labelLine={false}
                      >
                        {documentsByType.map((_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-muted-foreground">
                    No document data available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Partner Performance */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Top Partners by Documents</CardTitle>
            <CardDescription>Partners with the most uploaded documents</CardDescription>
          </CardHeader>
          <CardContent>
            {partnerStats.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No partner document data available
              </p>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={partnerStats} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 90%)" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(0, 0%, 100%)",
                        border: "1px solid hsl(220, 15%, 90%)",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="documents" fill="hsl(220, 25%, 25%)" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminAnalytics;

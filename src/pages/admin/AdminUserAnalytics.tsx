import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, FileText, Users, Calendar, Activity } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UserAnalytics {
  userId: string;
  email: string | null;
  profileCount: number;
  documentCount: number;
  roles: string[];
  createdAt: string | null;
  profiles: {
    id: string;
    name: string;
    carebag_id: string | null;
    documentCount: number;
  }[];
}

const AdminUserAnalytics = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const [analytics, setAnalytics] = useState<UserAnalytics | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (isSuperAdmin && userId) {
      fetchUserAnalytics();
    }
  }, [isSuperAdmin, userId]);

  const fetchUserAnalytics = async () => {
    try {
      setLoadingData(true);

      // Get all profiles for this user
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, name, email, carebag_id, created_at")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

      if (profilesError) throw profilesError;

      // Get document counts per profile
      const profilesWithDocs = await Promise.all(
        (profiles || []).map(async (profile) => {
          const { count } = await supabase
            .from("documents")
            .select("*", { count: "exact", head: true })
            .eq("profile_id", profile.id);
          return {
            ...profile,
            documentCount: count || 0,
          };
        })
      );

      // Get total documents for user
      const { count: totalDocs } = await supabase
        .from("documents")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      // Get user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      const userEmail = profiles?.[0]?.email || null;
      const createdAt = profiles?.[0]?.created_at || null;

      setAnalytics({
        userId: userId!,
        email: userEmail,
        profileCount: profiles?.length || 0,
        documentCount: totalDocs || 0,
        roles: roles?.map((r) => r.role) || ["user"],
        createdAt,
        profiles: profilesWithDocs.map((p) => ({
          id: p.id,
          name: p.name,
          carebag_id: p.carebag_id,
          documentCount: p.documentCount,
        })),
      });
    } catch (error) {
      console.error("Error fetching user analytics:", error);
    } finally {
      setLoadingData(false);
    }
  };

  if (isLoading || loadingData) {
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
    <AdminLayout title="User Analytics">
      <div className="space-y-6 animate-fade-in">
        <Button
          variant="ghost"
          onClick={() => navigate("/admin/users")}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Users
        </Button>

        {analytics && (
          <>
            {/* Overview Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{analytics.profileCount}</p>
                      <p className="text-xs text-muted-foreground">Profiles</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold">{analytics.documentCount}</p>
                      <p className="text-xs text-muted-foreground">Documents</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Activity className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-2xl font-bold capitalize">
                        {analytics.roles.join(", ") || "user"}
                      </p>
                      <p className="text-xs text-muted-foreground">Role(s)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-bold">
                        {analytics.createdAt
                          ? new Date(analytics.createdAt).toLocaleDateString()
                          : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">Joined</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>User Information</CardTitle>
                <CardDescription>Details about this user account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">User ID</p>
                    <p className="font-mono text-sm">{analytics.userId}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm">{analytics.email || "Not set"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Profiles Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Profiles Breakdown</CardTitle>
                <CardDescription>
                  All profiles created by this user
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analytics.profiles.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No profiles found
                  </p>
                ) : (
                  <div className="space-y-3">
                    {analytics.profiles.map((profile) => (
                      <div
                        key={profile.id}
                        className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{profile.name}</p>
                          {profile.carebag_id && (
                            <p className="text-xs text-muted-foreground font-mono">
                              {profile.carebag_id}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold">{profile.documentCount}</p>
                          <p className="text-xs text-muted-foreground">documents</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminUserAnalytics;

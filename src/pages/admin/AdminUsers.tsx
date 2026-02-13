import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Users, MoreVertical, Trash2, BarChart3, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { getEdgeFunctionError } from "@/lib/utils";

interface UserProfile {
  id: string;
  user_id: string;
  name: string;
  email: string | null;
  phone: string | null;
  carebag_id: string | null;
  created_at: string;
  relation: string | null;
}

interface GroupedUser {
  user_id: string;
  email: string | null;
  name: string;
  profileCount: number;
  roles: string[];
  created_at: string;
}

const AdminUsers = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const [groupedUsers, setGroupedUsers] = useState<GroupedUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<GroupedUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsers();
    }
  }, [isSuperAdmin]);

  const fetchUsers = async () => {
    try {
      // Get all profiles with user_id
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("id, user_id, name, email, phone, carebag_id, created_at, relation")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get all user roles
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Get all partner user_ids to exclude them
      const { data: partners } = await supabase
        .from("partners")
        .select("user_id");
      
      const partnerUserIds = new Set(partners?.map(p => p.user_id) || []);

      // Group profiles by user_id, excluding partner accounts
      const userMap = new Map<string, GroupedUser>();
      
      (profiles || []).forEach((profile) => {
        // Skip if this user_id is a partner account
        if (partnerUserIds.has(profile.user_id)) {
          return;
        }

        if (!userMap.has(profile.user_id)) {
          const userRoles = roles?.filter(r => r.user_id === profile.user_id).map(r => r.role) || [];
          
          // Skip if user has partner role
          if (userRoles.includes("partner")) {
            return;
          }

          userMap.set(profile.user_id, {
            user_id: profile.user_id,
            email: profile.email,
            name: profile.name || "User", // Default to "User" if name is missing
            profileCount: 1,
            roles: userRoles.length > 0 ? userRoles : ["user"],
            created_at: profile.created_at,
          });
        } else {
          const existing = userMap.get(profile.user_id)!;
          existing.profileCount += 1;
          // Keep the earliest email if available
          if (!existing.email && profile.email) {
            existing.email = profile.email;
          }
          // Update name if current is "User" and profile has a name
          if (existing.name === "User" && profile.name) {
            existing.name = profile.name;
          }
        }
      });

      // Convert to array and sort alphabetically by name
      const sortedUsers = Array.from(userMap.values()).sort((a, b) => 
        a.name.toLowerCase().localeCompare(b.name.toLowerCase())
      );

      setGroupedUsers(sortedUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      setIsDeleting(true);
      const { data, error } = await supabase.functions.invoke("delete-user", {
        body: {
          user_id: userToDelete.user_id,
          delete_type: "full",
        },
      });

      if (error) {
        const message = await getEdgeFunctionError(error);
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);

      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error: any) {
      console.error("Error deleting user:", error);
      toast.error(error.message || "Failed to delete user");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const handleResetPassword = async (user: GroupedUser) => {
    if (!user.email) {
      toast.error("Cannot reset password: User has no email address");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: {
          userEmail: user.email,
          userName: user.name,
          userType: "user",
        },
      });

      if (error) {
        const message = await getEdgeFunctionError(error);
        throw new Error(message);
      }
      if (data?.error) throw new Error(data.error);

      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast.error(error.message || "Failed to send password reset email");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredUsers = groupedUsers.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.roles.some(r => r.toLowerCase().includes(searchTerm.toLowerCase()))
  );

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
    <AdminLayout title="User Management">
      <div className="space-y-6 animate-fade-in">
        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Users List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              User Accounts
            </CardTitle>
            <CardDescription>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredUsers.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No users found
              </p>
            ) : (
              <div className="space-y-3">
                {filteredUsers.map((user) => (
                  <div
                    key={user.user_id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-bold text-primary">
                          {user.name?.charAt(0).toUpperCase() || "U"}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{user.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {user.email || "No email"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {user.profileCount} profile{user.profileCount !== 1 ? "s" : ""} • Joined: {new Date(user.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.roles.map((role) => (
                        <Badge 
                          key={role} 
                          variant={role === "super_admin" ? "default" : role === "partner" ? "secondary" : "outline"}
                          className="text-xs capitalize"
                        >
                          {role.replace("_", " ")}
                        </Badge>
                      ))}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/users/${user.user_id}/analytics`)}
                          >
                            <BarChart3 className="h-4 w-4 mr-2" />
                            View Analytics
                          </DropdownMenuItem>
                          {user.email && (
                            <DropdownMenuItem
                              onClick={() => handleResetPassword(user)}
                              disabled={isResettingPassword}
                            >
                              <KeyRound className="h-4 w-4 mr-2" />
                              {isResettingPassword ? "Sending..." : "Reset Password"}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => {
                              setUserToDelete(user);
                              setDeleteDialogOpen(true);
                            }}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete User
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete User Account</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {userToDelete?.name}'s account? This will permanently remove:
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>All {userToDelete?.profileCount} profile(s)</li>
                  <li>All associated documents</li>
                  <li>All user roles and permissions</li>
                </ul>
                <p className="mt-2 font-medium text-destructive">This action cannot be undone.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteUser}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? "Deleting..." : "Delete User"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;

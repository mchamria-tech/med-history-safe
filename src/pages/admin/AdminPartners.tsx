import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Edit, Trash2, Power, KeyRound, Mail, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger 
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface Partner {
  id: string;
  partner_code: string;
  name: string;
  email: string;
  is_active: boolean;
  created_at: string;
  logo_url: string | null;
}

const AdminPartners = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSuperAdmin, isLoading } = useSuperAdminCheck();
  const [partners, setPartners] = useState<Partner[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [partnerToDelete, setPartnerToDelete] = useState<Partner | null>(null);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  
  // Password reset dialog state
  const [passwordResetPartner, setPasswordResetPartner] = useState<Partner | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (isSuperAdmin) {
      fetchPartners();
    }
  }, [isSuperAdmin]);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .order("name", { ascending: true });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
  };

  const togglePartnerStatus = async (partner: Partner) => {
    try {
      const { error } = await supabase
        .from("partners")
        .update({ is_active: !partner.is_active })
        .eq("id", partner.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Partner ${partner.is_active ? "deactivated" : "activated"} successfully`,
      });

      // Log the action
      await supabase.from("admin_audit_logs").insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: partner.is_active ? "deactivate_partner" : "activate_partner",
        target_type: "partner",
        target_id: partner.id,
        details: { partner_name: partner.name },
      });

      fetchPartners();
    } catch (error) {
      console.error("Error toggling partner status:", error);
      toast({
        title: "Error",
        description: "Failed to update partner status",
        variant: "destructive",
      });
    }
  };

  const deletePartner = async () => {
    if (!partnerToDelete) return;

    try {
      const { error } = await supabase
        .from("partners")
        .delete()
        .eq("id", partnerToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Partner deleted successfully",
      });

      // Log the action
      await supabase.from("admin_audit_logs").insert({
        admin_id: (await supabase.auth.getUser()).data.user?.id,
        action: "delete_partner",
        target_type: "partner",
        target_id: partnerToDelete.id,
        details: { partner_name: partnerToDelete.name },
      });

      setPartnerToDelete(null);
      fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
      toast({
        title: "Error",
        description: "Failed to delete partner",
        variant: "destructive",
      });
    }
  };

  const openPasswordResetDialog = (partner: Partner) => {
    setPasswordResetPartner(partner);
    setNewPassword("");
    setConfirmPassword("");
  };

  const closePasswordResetDialog = () => {
    setPasswordResetPartner(null);
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleSendResetEmail = async () => {
    if (!passwordResetPartner) return;
    
    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: {
          userEmail: passwordResetPartner.email,
          userName: passwordResetPartner.name,
          userType: "partner",
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Password Reset Email Sent",
        description: `A password reset link has been sent to ${passwordResetPartner.email}`,
      });
      closePasswordResetDialog();
    } catch (error: any) {
      console.error("Error sending password reset:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send password reset email",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSetNewPassword = async () => {
    if (!passwordResetPartner) return;

    if (newPassword.length < 6) {
      toast({
        title: "Error",
        description: "Password must be at least 6 characters long",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-reset-password", {
        body: {
          userEmail: passwordResetPartner.email,
          userName: passwordResetPartner.name,
          userType: "partner",
          newPassword: newPassword,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Password Updated",
        description: `Password has been successfully changed for ${passwordResetPartner.name}`,
      });
      closePasswordResetDialog();
    } catch (error: any) {
      console.error("Error setting new password:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to set new password",
        variant: "destructive",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const filteredPartners = partners.filter(
    (p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.partner_code.toLowerCase().includes(searchTerm.toLowerCase())
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
    <AdminLayout title="Partner Management">
      <div className="space-y-6 animate-fade-in">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search partners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Button onClick={() => navigate("/admin/partners/new")}>
            <Plus className="h-4 w-4 mr-2" />
            Add Partner
          </Button>
        </div>

        {/* Partners List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg">Partners</CardTitle>
            <CardDescription>
              {filteredPartners.length} partner{filteredPartners.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {filteredPartners.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No partners found
              </p>
            ) : (
              <div className="space-y-3">
                {filteredPartners.map((partner) => (
                  <div
                    key={partner.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-accent/20 flex items-center justify-center">
                        <span className="text-sm font-bold text-accent">
                          {partner.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{partner.name}</p>
                        <p className="text-xs text-muted-foreground">
                          Code: {partner.partner_code} • {partner.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Joined: {new Date(partner.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          partner.is_active
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {partner.is_active ? "Active" : "Inactive"}
                      </span>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => navigate(`/admin/partners/${partner.id}`)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => togglePartnerStatus(partner)}>
                            <Power className="h-4 w-4 mr-2" />
                            {partner.is_active ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => openPasswordResetDialog(partner)}
                          >
                            <KeyRound className="h-4 w-4 mr-2" />
                            Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setPartnerToDelete(partner)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
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
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!partnerToDelete} onOpenChange={() => setPartnerToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Partner</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{partnerToDelete?.name}"? This action cannot be
              undone and will remove all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deletePartner} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Password Reset Dialog */}
      <Dialog open={!!passwordResetPartner} onOpenChange={(open) => !open && closePasswordResetDialog()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reset Password</DialogTitle>
            <DialogDescription>
              Reset password for <strong>{passwordResetPartner?.name}</strong> ({passwordResetPartner?.email})
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Option 1: Send Reset Email */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Mail className="h-4 w-4" />
                Option 1: Send Reset Email
              </div>
              <p className="text-xs text-muted-foreground">
                Send a password reset link to the partner's email address.
              </p>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={handleSendResetEmail}
                disabled={isResettingPassword}
              >
                {isResettingPassword ? "Sending..." : "Send Reset Email"}
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or</span>
              </div>
            </div>

            {/* Option 2: Set Password Directly */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Lock className="h-4 w-4" />
                Option 2: Set New Password Directly
              </div>
              <p className="text-xs text-muted-foreground">
                For emergency situations when the partner cannot access their email.
              </p>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password (min 6 characters)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
                <Button 
                  className="w-full"
                  onClick={handleSetNewPassword}
                  disabled={isResettingPassword || !newPassword || !confirmPassword}
                >
                  {isResettingPassword ? "Setting Password..." : "Set New Password"}
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closePasswordResetDialog}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminPartners;

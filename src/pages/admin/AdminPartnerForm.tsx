import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

const AdminPartnerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: authLoading, user } = useSuperAdminCheck();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    is_active: true,
    logo_url: "",
  });
  const [partnerCode, setPartnerCode] = useState<string | null>(null);

  const isEditing = !!id;

  useEffect(() => {
    if (isSuperAdmin && isEditing) {
      fetchPartner();
    }
  }, [isSuperAdmin, id]);

  const fetchPartner = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("partners")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      setFormData({
        name: data.name,
        email: data.email,
        password: "",
        is_active: data.is_active,
        logo_url: data.logo_url || "",
      });
      setPartnerCode(data.partner_code);
    } catch (error) {
      console.error("Error fetching partner:", error);
      toast({
        title: "Error",
        description: "Failed to load partner details",
        variant: "destructive",
      });
      navigate("/admin/partners");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!isEditing && !formData.password) {
      toast({
        title: "Validation Error",
        description: "Password is required for new partners",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSaving(true);

      if (isEditing) {
        // Update existing partner
        const { error } = await supabase
          .from("partners")
          .update({
            name: formData.name,
            email: formData.email,
            is_active: formData.is_active,
            logo_url: formData.logo_url || null,
          })
          .eq("id", id);

        if (error) throw error;

        // Log the action
        await supabase.from("admin_audit_logs").insert({
          admin_id: user?.id,
          action: "update_partner",
          target_type: "partner",
          target_id: id,
          details: { partner_name: formData.name },
        });

        toast({
          title: "Success",
          description: "Partner updated successfully",
        });
      } else {
        // Create new partner
        // First, create auth user for the partner
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: `${window.location.origin}/partner/dashboard`,
          },
        });

        if (authError) throw authError;

        if (!authData.user) {
          throw new Error("Failed to create user account");
        }

        // Generate partner code using RPC or manual generation
        const generatedCode = "X" + Math.random().toString(36).substring(2, 7).toUpperCase();

        // Create partner record
        const { data: partnerData, error: partnerError } = await supabase
          .from("partners")
          .insert({
            user_id: authData.user.id,
            partner_code: generatedCode,
            name: formData.name,
            email: formData.email,
            is_active: formData.is_active,
            logo_url: formData.logo_url || null,
          })
          .select()
          .single();

        if (partnerError) throw partnerError;

        // Add partner role
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: authData.user.id,
            role: "partner",
          });

        if (roleError) throw roleError;

        // Log the action
        await supabase.from("admin_audit_logs").insert({
          admin_id: user?.id,
          action: "create_partner",
          target_type: "partner",
          target_id: partnerData.id,
          details: { partner_name: formData.name, partner_code: generatedCode },
        });

        toast({
          title: "Success",
          description: `Partner created successfully. Code: ${generatedCode}`,
        });
      }

      navigate("/admin/partners");
    } catch (error: any) {
      console.error("Error saving partner:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save partner",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (authLoading || isLoading) {
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
    <AdminLayout title={isEditing ? "Edit Partner" : "Add New Partner"}>
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>{isEditing ? "Edit Partner" : "Create New Partner"}</CardTitle>
            <CardDescription>
              {isEditing
                ? "Update the partner's information below"
                : "Fill in the details to create a new partner account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {isEditing && partnerCode && (
                <div className="p-3 bg-muted rounded-lg">
                  <Label className="text-xs text-muted-foreground">Partner Code</Label>
                  <p className="font-mono font-bold text-lg text-foreground">{partnerCode}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Business Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Woodlands Clinic"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="partner@example.com"
                  disabled={isEditing}
                />
                {isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed after creation
                  </p>
                )}
              </div>

              {!isEditing && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Create a secure password"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="logo_url">Logo URL (Optional)</Label>
                <Input
                  id="logo_url"
                  value={formData.logo_url}
                  onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                  placeholder="https://example.com/logo.png"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <Label htmlFor="is_active" className="text-sm font-medium">
                    Active Status
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive partners cannot log in or access their dashboard
                  </p>
                </div>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, is_active: checked })
                  }
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/admin/partners")}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {isEditing ? "Update Partner" : "Create Partner"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminPartnerForm;

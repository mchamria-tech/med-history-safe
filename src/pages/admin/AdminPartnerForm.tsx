import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2, Upload, Link as LinkIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const AdminPartnerForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isSuperAdmin, isLoading: authLoading, user } = useSuperAdminCheck();
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [logoInputMode, setLogoInputMode] = useState<"url" | "upload">("url");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    is_active: true,
    logo_url: "",
    address: "",
    gst_number: "",
    govt_certification: "",
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
        address: data.address || "",
        gst_number: data.gst_number || "",
        govt_certification: data.govt_certification || "",
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Logo must be less than 2MB",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("partner-logos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: publicUrl } = supabase.storage
        .from("partner-logos")
        .getPublicUrl(filePath);

      setFormData({ ...formData, logo_url: publicUrl.publicUrl });
      toast({
        title: "Logo uploaded",
        description: "Logo has been uploaded successfully",
      });
    } catch (error: any) {
      console.error("Error uploading logo:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload logo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
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
            address: formData.address || null,
            gst_number: formData.gst_number || null,
            govt_certification: formData.govt_certification || null,
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
        // Create new partner via edge function
        const { data, error } = await supabase.functions.invoke("create-partner", {
          body: {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            is_active: formData.is_active,
            logo_url: formData.logo_url || null,
            address: formData.address || null,
            gst_number: formData.gst_number || null,
            govt_certification: formData.govt_certification || null,
          },
        });

        if (error) throw error;

        if (data?.error) {
          throw new Error(data.error);
        }

        toast({
          title: "Success",
          description: `Partner created successfully. Code: ${data.partner_code}`,
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
                <Label htmlFor="address">Business Address</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Enter full business address"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="gst_number">GST Number</Label>
                <Input
                  id="gst_number"
                  value={formData.gst_number}
                  onChange={(e) => setFormData({ ...formData, gst_number: e.target.value })}
                  placeholder="e.g., 22AAAAA0000A1Z5"
                />
                <p className="text-xs text-muted-foreground">
                  15-character GST identification number
                </p>
              </div>

              <div className="space-y-2">
                <Label>Government Certification</Label>
                <div className="p-4 border border-dashed border-border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground text-center">
                    🏛️ Government certification integration coming soon
                  </p>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    This feature is under development
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Logo (Optional)</Label>
                <Tabs value={logoInputMode} onValueChange={(v) => setLogoInputMode(v as "url" | "upload")}>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <LinkIcon className="h-4 w-4" />
                      URL
                    </TabsTrigger>
                    <TabsTrigger value="upload" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Upload
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="url" className="mt-2">
                    <Input
                      id="logo_url"
                      value={formData.logo_url}
                      onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                      placeholder="https://example.com/logo.png"
                    />
                  </TabsContent>
                  <TabsContent value="upload" className="mt-2">
                    <div className="flex flex-col gap-2">
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleLogoUpload}
                        disabled={isUploading}
                        className="cursor-pointer"
                      />
                      {isUploading && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                {formData.logo_url && (
                  <div className="mt-2 p-2 border rounded-lg bg-muted/30">
                    <p className="text-xs text-muted-foreground mb-2">Preview:</p>
                    <img
                      src={formData.logo_url}
                      alt="Logo preview"
                      className="h-16 w-auto object-contain"
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  </div>
                )}
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
                <Button type="submit" className="flex-1" disabled={isSaving || isUploading}>
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

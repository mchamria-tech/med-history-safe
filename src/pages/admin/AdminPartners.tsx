import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, MoreVertical, Edit, Trash2, Power } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdminCheck } from "@/hooks/useSuperAdminCheck";
import AdminLayout from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
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
        .order("created_at", { ascending: false });

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
    </AdminLayout>
  );
};

export default AdminPartners;

import { useState, useEffect } from "react";
import { Stethoscope, Plus, Search, UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const PartnerDoctors = () => {
  const { partner } = usePartnerCheck();
  const { toast } = useToast();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Link existing
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<any | null>(null);
  const [searching, setSearching] = useState(false);
  const [linking, setLinking] = useState(false);

  // Create new
  const [createForm, setCreateForm] = useState({
    name: "", email: "", password: "", specialty: "", hospital: "", phone: "",
  });
  const [creating, setCreating] = useState(false);

  const fetchDoctors = async () => {
    if (!partner) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .eq("partner_id", partner.id)
      .order("created_at", { ascending: false });
    if (!error && data) setDoctors(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchDoctors();
  }, [partner]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResult(null);

    // Search by global_id or email among doctors with no partner
    const { data, error } = await supabase
      .from("doctors")
      .select("*")
      .or(`global_id.eq.${searchQuery.trim()},email.eq.${searchQuery.trim()}`)
      .is("partner_id", null)
      .limit(1);

    if (error) {
      toast({ title: "Search failed", description: error.message, variant: "destructive" });
    } else if (data && data.length > 0) {
      setSearchResult(data[0]);
    } else {
      toast({ title: "No results", description: "No independent doctor found with that ID or email." });
    }
    setSearching(false);
  };

  const handleLink = async () => {
    if (!searchResult || !partner) return;
    setLinking(true);
    const { error } = await supabase
      .from("doctors")
      .update({ partner_id: partner.id })
      .eq("id", searchResult.id);

    if (error) {
      toast({ title: "Link failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Doctor linked successfully" });
      setSearchResult(null);
      setSearchQuery("");
      setDialogOpen(false);
      fetchDoctors();
    }
    setLinking(false);
  };

  const handleCreate = async () => {
    if (!createForm.name || !createForm.email || !createForm.password) {
      toast({ title: "Missing fields", description: "Name, email, and password are required.", variant: "destructive" });
      return;
    }
    setCreating(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("create-doctor", {
      body: createForm,
      headers: { Authorization: `Bearer ${sessionData.session?.access_token}` },
    });

    if (error || data?.error) {
      toast({ title: "Creation failed", description: data?.error || error?.message, variant: "destructive" });
    } else {
      toast({ title: "Doctor created successfully" });
      setCreateForm({ name: "", email: "", password: "", specialty: "", hospital: "", phone: "" });
      setDialogOpen(false);
      fetchDoctors();
    }
    setCreating(false);
  };

  const handleRevoke = async (doctorId: string) => {
    const { error } = await supabase
      .from("doctors")
      .update({ partner_id: null })
      .eq("id", doctorId);

    if (error) {
      toast({ title: "Revoke failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Doctor access revoked" });
      fetchDoctors();
    }
  };

  return (
    <PartnerLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Empanelled Doctors</h1>
            <p className="text-muted-foreground mt-1">Manage doctors attached to your organization.</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Doctor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add Doctor</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="link">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="link">Link Existing</TabsTrigger>
                  <TabsTrigger value="create">Create New</TabsTrigger>
                </TabsList>
                <TabsContent value="link" className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Search by Global ID or Email</Label>
                    <div className="flex gap-2">
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="e.g. IND-D12345 or doctor@email.com"
                        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      />
                      <Button onClick={handleSearch} disabled={searching} size="icon" variant="outline">
                        {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  {searchResult && (
                    <div className="border border-border rounded-lg p-4 space-y-2">
                      <p className="font-medium text-foreground">{searchResult.name}</p>
                      <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                      <p className="text-sm text-muted-foreground">{searchResult.specialty || "No specialty"} · {searchResult.global_id}</p>
                      <Button onClick={handleLink} disabled={linking} className="w-full mt-2">
                        {linking ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Link Doctor
                      </Button>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="create" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Name *</Label>
                      <Input value={createForm.name} onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Email *</Label>
                      <Input type="email" value={createForm.email} onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Password *</Label>
                      <Input type="password" value={createForm.password} onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Specialty</Label>
                      <Input value={createForm.specialty} onChange={(e) => setCreateForm({ ...createForm, specialty: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Hospital</Label>
                      <Input value={createForm.hospital} onChange={(e) => setCreateForm({ ...createForm, hospital: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone</Label>
                      <Input value={createForm.phone} onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })} />
                    </div>
                  </div>
                  <Button onClick={handleCreate} disabled={creating} className="w-full">
                    {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Create Doctor Account
                  </Button>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>

        {/* Doctors Table */}
        <div className="bg-card rounded-xl border border-border/50 shadow-soft overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : doctors.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Stethoscope className="h-12 w-12 text-muted-foreground/40 mb-3" />
              <p className="text-muted-foreground">No empanelled doctors yet.</p>
              <p className="text-sm text-muted-foreground">Click "Add Doctor" to get started.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specialty</TableHead>
                  <TableHead>Hospital</TableHead>
                  <TableHead>Global ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {doctors.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell className="font-medium">{doc.name}</TableCell>
                    <TableCell>{doc.specialty || "—"}</TableCell>
                    <TableCell>{doc.hospital || "—"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{doc.global_id}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={doc.is_active ? "bg-emerald-500/15 text-emerald-700 border-emerald-200" : "bg-red-500/15 text-red-700 border-red-200"}>
                        {doc.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => handleRevoke(doc.id)}
                      >
                        <UserX className="h-4 w-4 mr-1" />
                        Revoke
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerDoctors;

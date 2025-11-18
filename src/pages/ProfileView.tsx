import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, MoreVertical, Plus, ArrowLeft, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Profile {
  id: string;
  name: string;
  gender: string | null;
  date_of_birth: string | null;
  relation: string | null;
  email: string | null;
  phone: string | null;
  height: string | null;
  weight: string | null;
  blood_pressure: string | null;
  blood_glucose: string | null;
  allergies: string | null;
  insurer: string | null;
  policy_no: string | null;
  type_of_plan: string | null;
  expiry_date: string | null;
  rm_name: string | null;
  rm_no: string | null;
  profile_photo_url: string | null;
}

const ProfileView = () => {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState<Date>();
  const [documentType, setDocumentType] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [familyMembersCount, setFamilyMembersCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchDocuments();
      fetchFamilyMembersCount();
    }
  }, [profileId]);

  const fetchFamilyMembersCount = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { count, error } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      setFamilyMembersCount(count || 0);
    } catch (error: any) {
      console.error('Error fetching family members count:', error);
    }
  };

  const fetchDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .eq('profile_id', profileId)
        .order('document_date', { ascending: false });

      if (error) throw error;
      setDocuments(data || []);
    } catch (error: any) {
      console.error('Error fetching documents:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error: any) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditProfile = () => {
    navigate(`/new-profile?id=${profileId}`);
  };

  const handleDeleteProfile = async () => {
    try {
      setIsDeleting(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Delete all documents from storage
      for (const doc of documents) {
        if (doc.document_url) {
          const filePath = doc.document_url.split('/').pop();
          if (filePath) {
            await supabase.storage
              .from('profile-documents')
              .remove([`${user.id}/${profileId}/${filePath}`]);
          }
        }
      }

      // Delete all document records
      const { error: docsError } = await supabase
        .from('documents')
        .delete()
        .eq('profile_id', profileId);

      if (docsError) throw docsError;

      // Delete profile photo from storage if exists
      if (profile?.profile_photo_url) {
        const photoPath = profile.profile_photo_url.split('/').pop();
        if (photoPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${photoPath}`]);
        }
      }

      // Delete the profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId);

      if (profileError) throw profileError;

      toast({
        title: "Success",
        description: "Profile and all associated data deleted successfully",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: "Failed to delete profile",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile || !documentName || !documentDate || !profileId || !documentType.trim()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields including at least one search keyword",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Upload file to storage
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${user.id}/${profileId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, documentFile);

      if (uploadError) throw uploadError;

      // Save document metadata to database with file path
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          profile_id: profileId,
          user_id: user.id,
          document_name: documentName,
          document_url: fileName, // Store the file path instead of public URL
          document_date: format(documentDate, 'yyyy-MM-dd'),
          document_type: documentType || null,
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Document uploaded successfully",
      });

      // Refresh documents list
      fetchDocuments();

      setShowUploadDialog(false);
      setDocumentFile(null);
      setDocumentName("");
      setDocumentDate(undefined);
      setDocumentType("");
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to upload document",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  if (!profile) {
    return null;
  }

  const filteredDocuments = documents.filter(doc => 
    doc.document_type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    doc.document_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateDaysSinceLastDocument = () => {
    if (documents.length === 0) return 0;
    
    const mostRecentDoc = documents.reduce((latest, current) => {
      return new Date(current.document_date) > new Date(latest.document_date) ? current : latest;
    });
    
    const daysDiff = Math.floor((new Date().getTime() - new Date(mostRecentDoc.document_date).getTime()) / (1000 * 60 * 60 * 24));
    return daysDiff;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Profile View</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
              <MoreVertical className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEditProfile}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Profile
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Profile
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-6 max-w-4xl mx-auto">
        {/* Profile Photo and Basic Info */}
        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={profile.profile_photo_url || undefined} alt={profile.name} />
            <AvatarFallback className="text-3xl bg-[hsl(190,50%,85%)]">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-2xl font-semibold text-foreground">{profile.name}</h2>
          {profile.relation && (
            <p className="text-muted-foreground">Relation: {profile.relation}</p>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-6 border flex flex-col items-center">
            <p className="text-4xl font-bold text-primary">{documents.length}</p>
            <p className="text-sm text-muted-foreground mt-2">Documents</p>
          </div>
          <div className="bg-card rounded-lg p-6 border flex flex-col items-center">
            <p className="text-4xl font-bold text-primary">{familyMembersCount}</p>
            <p className="text-sm text-muted-foreground mt-2">Family Members</p>
          </div>
          <div className="bg-card rounded-lg p-6 border flex flex-col items-center">
            <p className="text-4xl font-bold text-primary">{calculateDaysSinceLastDocument()}</p>
            <p className="text-sm text-muted-foreground mt-2">Days Healthy</p>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-card rounded-lg p-6 space-y-4 border">
          <h3 className="text-xl font-semibold text-foreground mb-4">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {profile.gender && (
              <div>
                <Label className="text-muted-foreground">Gender</Label>
                <p className="text-foreground">{profile.gender}</p>
              </div>
            )}
            {profile.date_of_birth && (
              <div>
                <Label className="text-muted-foreground">Date of Birth</Label>
                <p className="text-foreground">{format(new Date(profile.date_of_birth), 'PPP')}</p>
              </div>
            )}
            {profile.email && (
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="text-foreground">{profile.email}</p>
              </div>
            )}
            {profile.phone && (
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="text-foreground">{profile.phone}</p>
              </div>
            )}
            {profile.height && (
              <div>
                <Label className="text-muted-foreground">Height</Label>
                <p className="text-foreground">{profile.height}</p>
              </div>
            )}
            {profile.weight && (
              <div>
                <Label className="text-muted-foreground">Weight</Label>
                <p className="text-foreground">{profile.weight}</p>
              </div>
            )}
            {profile.blood_pressure && (
              <div>
                <Label className="text-muted-foreground">Blood Pressure</Label>
                <p className="text-foreground">{profile.blood_pressure}</p>
              </div>
            )}
            {profile.blood_glucose && (
              <div>
                <Label className="text-muted-foreground">Blood Glucose</Label>
                <p className="text-foreground">{profile.blood_glucose}</p>
              </div>
            )}
            {profile.allergies && (
              <div className="md:col-span-2">
                <Label className="text-muted-foreground">Allergies</Label>
                <p className="text-foreground">{profile.allergies}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical Insurance Details */}
        {(profile.insurer || profile.policy_no || profile.type_of_plan || profile.expiry_date || profile.rm_name || profile.rm_no) && (
          <div className="bg-card rounded-lg p-6 space-y-4 border">
            <h3 className="text-xl font-semibold text-foreground mb-4">Medical Insurance</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {profile.insurer && (
                <div>
                  <Label className="text-muted-foreground">Insurer</Label>
                  <p className="text-foreground">{profile.insurer}</p>
                </div>
              )}
              {profile.policy_no && (
                <div>
                  <Label className="text-muted-foreground">Policy Number</Label>
                  <p className="text-foreground">{profile.policy_no}</p>
                </div>
              )}
              {profile.type_of_plan && (
                <div>
                  <Label className="text-muted-foreground">Type of Plan</Label>
                  <p className="text-foreground">{profile.type_of_plan}</p>
                </div>
              )}
              {profile.expiry_date && (
                <div>
                  <Label className="text-muted-foreground">Expiry Date</Label>
                  <p className="text-foreground">{format(new Date(profile.expiry_date), 'PPP')}</p>
                </div>
              )}
              {profile.rm_name && (
                <div>
                  <Label className="text-muted-foreground">RM Name</Label>
                  <p className="text-foreground">{profile.rm_name}</p>
                </div>
              )}
              {profile.rm_no && (
                <div>
                  <Label className="text-muted-foreground">RM Number</Label>
                  <p className="text-foreground">{profile.rm_no}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Document Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => setShowUploadDialog(true)}
            size="lg"
            className="rounded-full h-16 w-16 p-0"
          >
            <Plus className="h-8 w-8" />
          </Button>
        </div>

        {/* Search Documents Section */}
        <div className="bg-card rounded-lg p-6 border">
          <h3 className="text-xl font-semibold text-foreground mb-4">Documents</h3>
          <div className="mb-4">
            <Input
              placeholder="Search documents by keywords or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-[hsl(190,50%,85%)]"
            />
          </div>
          <div className="space-y-2">
            {filteredDocuments.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                {searchTerm ? "No documents found matching your search" : "No documents uploaded yet"}
              </p>
            ) : (
              filteredDocuments.map((doc) => (
                <div key={doc.id} className="p-4 bg-background rounded-md border flex justify-between items-center">
                  <div>
                    <p className="font-medium text-foreground">{doc.document_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Keywords: {doc.document_type} • Date: {format(new Date(doc.document_date), 'PPP')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        const { data, error } = await supabase.storage
                          .from('profile-documents')
                          .createSignedUrl(doc.document_url, 3600);
                        
                        if (error) throw error;
                        window.open(data.signedUrl, '_blank');
                      } catch (error) {
                        console.error('Error viewing document:', error);
                      }
                    }}
                  >
                    View
                  </Button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center pt-4">
          <Button
            onClick={() => navigate(`/view-documents/${profileId}`)}
            variant="default"
            size="lg"
            className="min-w-[200px]"
          >
            View All Documents
          </Button>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="outline"
            size="lg"
            className="min-w-[200px]"
          >
            Back
          </Button>
        </div>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-background">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="doc-file">Select File</Label>
              <Input
                id="doc-file"
                type="file"
                onChange={(e) => setDocumentFile(e.target.files?.[0] || null)}
                className="bg-[hsl(190,50%,85%)]"
              />
            </div>
            <div>
              <Label htmlFor="doc-name">Document Name</Label>
              <Input
                id="doc-name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Lab Report, Prescription"
                className="bg-[hsl(190,50%,85%)]"
              />
            </div>
            <div>
              <Label>Document Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-[hsl(190,50%,85%)]",
                      !documentDate && "text-muted-foreground"
                    )}
                  >
                    {documentDate ? format(documentDate, "PPP") : <span>Select date</span>}
                    <Calendar className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={documentDate}
                    onSelect={setDocumentDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label htmlFor="doc-type">Search Keywords (At least One)</Label>
              <Input
                id="doc-type"
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value)}
                placeholder="E.g. Doc Name, illness, medicine"
                className="bg-[hsl(190,50%,85%)]"
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleDocumentUpload} disabled={isUploading}>
              {isUploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Profile Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This will permanently delete:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>All profile information</li>
                <li>All uploaded documents ({documents.length} documents)</li>
                <li>All document files from storage</li>
              </ul>
              <p className="mt-2 font-semibold">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProfile}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Profile"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileView;

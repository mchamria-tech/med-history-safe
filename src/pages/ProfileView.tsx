import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Menu, MoreVertical, Plus, ArrowLeft, Edit, Trash2, Sparkles, Loader2, AlertCircle } from "lucide-react";
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
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { getSignedUrl, extractFilePath } from "@/hooks/useSignedUrl";

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
  const [doctorName, setDoctorName] = useState("");
  const [ailment, setAilment] = useState("");
  const [medicine, setMedicine] = useState("");
  const [otherTags, setOtherTags] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [familyMembersCount, setFamilyMembersCount] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPopupPermission, setShowPopupPermission] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractedMetadata, setExtractedMetadata] = useState<any>(null);
  const [showMetadataReview, setShowMetadataReview] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState<string | null>(null);
  const [pendingDocUrl, setPendingDocUrl] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      fetchDocuments();
      fetchFamilyMembersCount();
    }
  }, [profileId]);

  // Load signed URL for profile photo
  useEffect(() => {
    const loadProfilePhoto = async () => {
      if (profile?.profile_photo_url) {
        const { url } = await getSignedUrl('profile-photos', profile.profile_photo_url);
        setProfilePhotoUrl(url);
      }
    };
    loadProfilePhoto();
  }, [profile?.profile_photo_url]);

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
    navigate(`/new-profile?edit=${profileId}`);
  };

  const handleDeleteProfile = async () => {
    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please log in again",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsDeleting(true);

      // Delete all documents from storage - using standardized path handling
      for (const doc of documents) {
        if (doc.document_url) {
          let filePath = doc.document_url;
          
          // Handle both old URL format and new path format
          if (doc.document_url.includes('supabase.co')) {
            const urlParts = doc.document_url.split('/profile-documents/');
            filePath = urlParts[1] || doc.document_url;
          }
          
          await supabase.storage
            .from('profile-documents')
            .remove([filePath]);
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
        let photoPath = profile.profile_photo_url;
        
        // Handle both old URL format and new path format
        if (profile.profile_photo_url.includes('supabase.co')) {
          const urlParts = profile.profile_photo_url.split('/profile-photos/');
          photoPath = urlParts[1] || profile.profile_photo_url;
        }
        
        await supabase.storage
          .from('profile-photos')
          .remove([photoPath]);
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

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  // AI metadata extraction function
  const extractMetadataWithAI = async () => {
    if (!documentFile) {
      toast({
        title: "Error",
        description: "Please select a document first",
        variant: "destructive",
      });
      return;
    }

    // Check if file is an image
    if (!documentFile.type.startsWith('image/')) {
      toast({
        title: "Unsupported File Type",
        description: "AI extraction only works with image files (JPG, PNG, WEBP). Please upload an image or fill the form manually.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsExtracting(true);

      // Convert file to base64
      const base64Image = await fileToBase64(documentFile);

      console.log('Calling extract-document-metadata function...');

      // Call edge function
      const { data, error } = await supabase.functions.invoke('extract-document-metadata', {
        body: { image: base64Image }
      });

      if (error) {
        console.error('Edge function error:', error);
        throw error;
      }

      console.log('Extraction result:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      const metadata = data.metadata;

      // Pre-fill form fields with extracted data
      if (metadata.doctor_name) setDoctorName(metadata.doctor_name);
      if (metadata.document_date) {
        try {
          setDocumentDate(new Date(metadata.document_date));
        } catch (e) {
          console.error('Error parsing date:', e);
        }
      }
      if (metadata.ailment) setAilment(metadata.ailment);
      if (metadata.medicine) setMedicine(metadata.medicine);
      if (metadata.document_type) setDocumentType(metadata.document_type);

      setExtractedMetadata(metadata);
      setShowMetadataReview(true);

      toast({
        title: "Success",
        description: "Metadata extracted successfully. Please review and edit if needed.",
      });

    } catch (error: any) {
      console.error('Error extracting metadata:', error);
      
      let errorMessage = "Failed to extract metadata from document";
      
      if (error.message?.includes("Rate limit")) {
        errorMessage = "Rate limit exceeded. Please try again in a moment.";
      } else if (error.message?.includes("credits")) {
        errorMessage = "AI credits exhausted. Please contact support.";
      } else if (error.message) {
        errorMessage = error.message;
      }

      toast({
        title: "Extraction Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleDocumentUpload = async () => {
    if (!documentFile || !documentName || !documentDate || !profileId) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (!currentUser) {
      toast({
        title: "Authentication Error",
        description: "Please log in again to upload documents",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsUploading(true);

      // Upload file to storage
      const fileExt = documentFile.name.split('.').pop();
      const fileName = `${currentUser.id}/${profileId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('profile-documents')
        .upload(fileName, documentFile);

      if (uploadError) throw uploadError;

      // Save document metadata to database with file path
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          profile_id: profileId,
          user_id: currentUser.id,
          document_name: documentName,
          document_url: fileName, // Store the file path instead of public URL
          document_date: format(documentDate, 'yyyy-MM-dd'),
          document_type: documentType || null,
          doctor_name: doctorName || null,
          ailment: ailment || null,
          medicine: medicine || null,
          other_tags: otherTags || null,
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
      setDoctorName("");
      setAilment("");
      setMedicine("");
      setOtherTags("");
      setShowMetadataReview(false);
      setExtractedMetadata(null);
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
    <div className="flex min-h-screen flex-col bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center justify-between bg-primary px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-primary-foreground hover:bg-primary/80"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-bold text-primary-foreground">Profile View</h1>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary/80">
              <MoreVertical className="h-5 w-5" />
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
      <main className="flex-1 px-4 pb-32 pt-4 space-y-4 animate-fade-in">
        {/* Profile Photo and Basic Info */}
        <div className="flex flex-col items-center space-y-2">
          <Avatar className="h-28 w-28 border-2 border-primary animate-scale-in">
            <AvatarImage src={profilePhotoUrl || undefined} alt={profile.name} />
            <AvatarFallback className="text-2xl bg-muted">
              {profile.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h2 className="text-xl font-semibold text-foreground">{profile.name}</h2>
          {profile.relation && (
            <p className="text-sm text-muted-foreground">Relation: {profile.relation}</p>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-card rounded-lg p-3 border flex flex-col items-center">
            <p className="text-2xl font-bold text-primary">{documents.length}</p>
            <p className="text-xs text-muted-foreground">Documents</p>
          </div>
          <div className="bg-card rounded-lg p-3 border flex flex-col items-center">
            <p className="text-2xl font-bold text-primary">{familyMembersCount}</p>
            <p className="text-xs text-muted-foreground">Family</p>
          </div>
          <div className="bg-card rounded-lg p-3 border flex flex-col items-center">
            <p className="text-2xl font-bold text-primary">{calculateDaysSinceLastDocument()}</p>
            <p className="text-xs text-muted-foreground">Days Healthy</p>
          </div>
        </div>

        {/* Personal Details */}
        <div className="bg-card rounded-lg p-4 space-y-3 border">
          <h3 className="text-base font-semibold text-foreground">Personal Information</h3>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {profile.gender && (
              <div>
                <Label className="text-xs text-muted-foreground">Gender</Label>
                <p className="text-foreground">{profile.gender}</p>
              </div>
            )}
            {profile.date_of_birth && (
              <div>
                <Label className="text-xs text-muted-foreground">Date of Birth</Label>
                <p className="text-foreground">{format(new Date(profile.date_of_birth), 'PP')}</p>
              </div>
            )}
            {profile.email && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Email</Label>
                <p className="text-foreground truncate">{profile.email}</p>
              </div>
            )}
            {profile.phone && (
              <div>
                <Label className="text-xs text-muted-foreground">Phone</Label>
                <p className="text-foreground">{profile.phone}</p>
              </div>
            )}
            {profile.height && (
              <div>
                <Label className="text-xs text-muted-foreground">Height</Label>
                <p className="text-foreground">{profile.height}</p>
              </div>
            )}
            {profile.weight && (
              <div>
                <Label className="text-xs text-muted-foreground">Weight</Label>
                <p className="text-foreground">{profile.weight}</p>
              </div>
            )}
            {profile.blood_pressure && (
              <div>
                <Label className="text-xs text-muted-foreground">Blood Pressure</Label>
                <p className="text-foreground">{profile.blood_pressure}</p>
              </div>
            )}
            {profile.blood_glucose && (
              <div>
                <Label className="text-xs text-muted-foreground">Blood Group</Label>
                <p className="text-foreground">{profile.blood_glucose}</p>
              </div>
            )}
            {profile.allergies && (
              <div className="col-span-2">
                <Label className="text-xs text-muted-foreground">Allergies</Label>
                <p className="text-foreground">{profile.allergies}</p>
              </div>
            )}
          </div>
        </div>

        {/* Medical Insurance Details */}
        {(profile.insurer || profile.policy_no || profile.type_of_plan || profile.expiry_date || profile.rm_name || profile.rm_no) && (
          <div className="bg-card rounded-lg p-4 space-y-3 border">
            <h3 className="text-base font-semibold text-foreground">Medical Insurance</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              {profile.insurer && (
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Insurer</Label>
                  <p className="text-foreground">{profile.insurer}</p>
                </div>
              )}
              {profile.policy_no && (
                <div>
                  <Label className="text-xs text-muted-foreground">Policy No.</Label>
                  <p className="text-foreground">{profile.policy_no}</p>
                </div>
              )}
              {profile.type_of_plan && (
                <div>
                  <Label className="text-xs text-muted-foreground">Plan Type</Label>
                  <p className="text-foreground">{profile.type_of_plan}</p>
                </div>
              )}
              {profile.expiry_date && (
                <div>
                  <Label className="text-xs text-muted-foreground">Expiry</Label>
                  <p className="text-foreground">{format(new Date(profile.expiry_date), 'PP')}</p>
                </div>
              )}
              {profile.rm_name && (
                <div>
                  <Label className="text-xs text-muted-foreground">RM Name</Label>
                  <p className="text-foreground">{profile.rm_name}</p>
                </div>
              )}
              {profile.rm_no && (
                <div>
                  <Label className="text-xs text-muted-foreground">RM No.</Label>
                  <p className="text-foreground">{profile.rm_no}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upload Document Button */}
        <div className="flex flex-col items-center gap-1">
          <Button
            onClick={() => setShowUploadDialog(true)}
            size="lg"
            className="rounded-full h-12 w-12 p-0"
          >
            <Plus className="h-6 w-6" />
          </Button>
          <p className="text-xs text-muted-foreground">
            {documents.length} docs
          </p>
        </div>

        {/* Search Documents Section */}
        <div className="bg-card rounded-lg p-4 border">
          <h3 className="text-base font-semibold text-foreground mb-3">Documents</h3>
          <div className="mb-3">
            <Input
              placeholder="Search documents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-muted text-sm"
            />
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {filteredDocuments.length === 0 ? (
              <p className="text-muted-foreground text-center py-3 text-sm">
                {searchTerm ? "No documents found" : "No documents yet"}
              </p>
            ) : (
              filteredDocuments.slice(0, 3).map((doc) => (
                <div key={doc.id} className="p-3 bg-background rounded-md border flex justify-between items-center">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground text-sm truncate">{doc.document_name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {doc.document_type} • {format(new Date(doc.document_date), 'PP')}
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-2 text-xs h-7"
                    onClick={async () => {
                      const popupPermission = localStorage.getItem('popup-permission');
                      
                      const openDocument = async (docUrl: string) => {
                        const { url, error } = await getSignedUrl('profile-documents', docUrl);
                        if (url && !error) {
                          window.open(url, '_blank');
                        } else {
                          toast({
                            title: "Error",
                            description: "Failed to open document",
                            variant: "destructive",
                          });
                        }
                      };
                      
                      if (popupPermission === 'granted') {
                        await openDocument(doc.document_url);
                      } else if (!popupPermission) {
                        setPendingDocUrl(doc.document_url);
                        setShowPopupPermission(true);
                      } else {
                        await openDocument(doc.document_url);
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
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 pb-6 grid grid-cols-2 gap-3">
        <Button
          onClick={() => navigate("/dashboard")}
          variant="outline"
          size="lg"
          className="h-12 font-semibold"
        >
          Back
        </Button>
        <Button
          onClick={() => navigate(`/view-documents/${profileId}`)}
          variant="default"
          size="lg"
          className="h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          All Documents
        </Button>
      </div>

      {/* Upload Document Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="bg-background max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">{/* Added overflow and flex */}
            <div>
              <Label htmlFor="doc-file">Select File</Label>
              <Input
                id="doc-file"
                type="file"
                accept="image/*,.pdf"
                onChange={(e) => {
                  setDocumentFile(e.target.files?.[0] || null);
                  setShowMetadataReview(false);
                  setExtractedMetadata(null);
                }}
                className="bg-[hsl(190,50%,85%)]"
              />
              <p className="text-xs text-muted-foreground mt-1">
                AI extraction works with images only (JPG, PNG, WEBP). PDFs must be filled manually.
              </p>
            </div>

            {/* AI Extraction Buttons */}
            {documentFile && !showMetadataReview && (
              <div className="flex gap-2">
                <Button
                  onClick={extractMetadataWithAI}
                  disabled={isExtracting || !documentFile.type.startsWith('image/')}
                  className="flex-1"
                  variant="default"
                >
                  {isExtracting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Extracting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      AI Auto Extraction
                      {!documentFile.type.startsWith('image/') && ' (Images Only)'}
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => setShowMetadataReview(true)}
                  variant="outline"
                  className="flex-1"
                >
                  Fill Manually
                </Button>
              </div>
            )}

            {/* Metadata Review Alert */}
            {showMetadataReview && (
              <Alert className="bg-primary/10 border-primary/20">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Review Extracted Data</AlertTitle>
                <AlertDescription>
                  Please review and edit the extracted information before saving.
                </AlertDescription>
              </Alert>
            )}

            {showMetadataReview && (
              <>
                <div>
                  <Label htmlFor="doc-name">Document Name</Label>
                  <Input
                    id="doc-name"
                    value={documentName}
                    onChange={(e) => setDocumentName(e.target.value)}
                    placeholder="e.g., Blood Test Report, Dr. Visit Notes"
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
                  <Label htmlFor="doc-type">Keywords/Category (Optional)</Label>
                  <Input
                    id="doc-type"
                    value={documentType}
                    onChange={(e) => setDocumentType(e.target.value)}
                    placeholder="e.g., prescription, lab report, x-ray"
                    className="bg-[hsl(190,50%,85%)]"
                  />
                </div>
                <div>
                  <Label htmlFor="doctor-name">Doctor Name (Optional)</Label>
                  <Input
                    id="doctor-name"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="E.g. Dr. Smith"
                    className="bg-[hsl(190,50%,85%)]"
                  />
                </div>
                <div>
                  <Label htmlFor="ailment">Ailment (Optional)</Label>
                  <Input
                    id="ailment"
                    value={ailment}
                    onChange={(e) => setAilment(e.target.value)}
                    placeholder="E.g. Migraine, Diabetes"
                    className="bg-[hsl(190,50%,85%)]"
                  />
                </div>
                <div>
                  <Label htmlFor="medicine">Medicine (Optional)</Label>
                  <Input
                    id="medicine"
                    value={medicine}
                    onChange={(e) => setMedicine(e.target.value)}
                    placeholder="E.g. Aspirin, Metformin"
                    className="bg-[hsl(190,50%,85%)]"
                  />
                </div>
                <div>
                  <Label htmlFor="other-tags">Other Tags (Optional)</Label>
                  <Input
                    id="other-tags"
                    value={otherTags}
                    onChange={(e) => setOtherTags(e.target.value)}
                    placeholder="E.g. Emergency, Follow-up"
                    className="bg-[hsl(190,50%,85%)]"
                  />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false);
              setShowMetadataReview(false);
              setExtractedMetadata(null);
            }}>
              Cancel
            </Button>
            <Button onClick={handleDocumentUpload} disabled={isUploading || !showMetadataReview}>
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

      {/* Popup Permission Dialog */}
      <AlertDialog open={showPopupPermission} onOpenChange={setShowPopupPermission}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Allow Document Popups</AlertDialogTitle>
            <AlertDialogDescription>
              This app needs to open documents in new windows. Do you want to allow this? You will only be asked once.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                localStorage.setItem('popup-permission', 'denied');
                setPendingDocUrl(null);
              }}
            >
              No, Don't Allow
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                localStorage.setItem('popup-permission', 'granted');
                if (pendingDocUrl) {
                  const { url, error } = await getSignedUrl('profile-documents', pendingDocUrl);
                  if (url && !error) {
                    window.open(url, '_blank');
                  }
                  setPendingDocUrl(null);
                }
              }}
            >
              Yes, Allow
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ProfileView;

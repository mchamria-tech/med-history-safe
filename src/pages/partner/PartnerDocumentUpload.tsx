import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { useToast } from "@/hooks/use-toast";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { Upload, Calendar as CalendarIcon, FileText, User, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  name: string;
  email: string | null;
  carebag_id: string | null;
}

const PartnerDocumentUpload = () => {
  const navigate = useNavigate();
  const { profileId } = useParams();
  const { toast } = useToast();
  const { partner, user } = usePartnerCheck();
  
  const [linkedProfiles, setLinkedProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState(profileId || "");
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [documentDate, setDocumentDate] = useState<Date>();
  const [documentType, setDocumentType] = useState("");
  const [doctorName, setDoctorName] = useState("");
  const [ailment, setAilment] = useState("");
  const [medicine, setMedicine] = useState("");
  const [otherTags, setOtherTags] = useState("");
  const [consentGiven, setConsentGiven] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const documentTypes = [
    "Prescription",
    "Lab Report",
    "Discharge Summary",
    "Insurance Document",
    "Medical Certificate",
    "Vaccination Record",
    "Other",
  ];

  useEffect(() => {
    if (partner?.id) {
      fetchLinkedProfiles();
    }
  }, [partner?.id]);

  useEffect(() => {
    if (selectedProfileId && linkedProfiles.length > 0) {
      const profile = linkedProfiles.find((p) => p.id === selectedProfileId);
      setSelectedProfile(profile || null);
    }
  }, [selectedProfileId, linkedProfiles]);

  const fetchLinkedProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_users")
        .select(`
          profile_id,
          profiles:profile_id (
            id,
            name,
            email,
            carebag_id
          )
        `)
        .eq("partner_id", partner!.id)
        .eq("consent_given", true);

      if (error) throw error;

      const profiles = data?.map((item: any) => item.profiles).filter(Boolean) || [];
      setLinkedProfiles(profiles);

      if (profileId && profiles.some((p: Profile) => p.id === profileId)) {
        setSelectedProfileId(profileId);
      }
    } catch (error) {
      console.error("Error fetching linked profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!documentName) {
        setDocumentName(selectedFile.name.replace(/\.[^/.]+$/, ""));
      }
    }
  };

  const handleUpload = async () => {
    if (!file || !selectedProfileId || !documentName || !documentDate || !consentGiven) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and confirm consent",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);

    try {
      // Get the user_id of the profile owner
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("id", selectedProfileId)
        .single();

      if (profileError) throw profileError;

      // Upload file to storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${profileData.user_id}/${selectedProfileId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("profile-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Create document record
      const { error: dbError } = await supabase.from("documents").insert({
        user_id: profileData.user_id,
        profile_id: selectedProfileId,
        document_name: documentName.trim(),
        document_url: fileName,
        document_date: format(documentDate, "yyyy-MM-dd"),
        document_type: documentType || null,
        doctor_name: doctorName.trim() || null,
        ailment: ailment.trim() || null,
        medicine: medicine.trim() || null,
        other_tags: otherTags.trim() || null,
        partner_id: partner!.id,
        partner_source_name: partner!.name,
      });

      if (dbError) throw dbError;

      toast({
        title: "Document Uploaded",
        description: "Document has been uploaded successfully",
      });

      // Reset form
      setFile(null);
      setDocumentName("");
      setDocumentDate(undefined);
      setDocumentType("");
      setDoctorName("");
      setAilment("");
      setMedicine("");
      setOtherTags("");
      setConsentGiven(false);

      // Navigate back to users list
      navigate("/partner/users");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <PartnerLayout>
        <div className="flex items-center justify-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </PartnerLayout>
    );
  }

  return (
    <PartnerLayout>
      <div className="space-y-6 max-w-2xl">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/partner/users")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Upload Document</h1>
            <p className="text-muted-foreground">
              Upload a document for a linked user
            </p>
          </div>
        </div>

        {linkedProfiles.length === 0 ? (
          <Card className="shadow-soft">
            <CardContent className="py-12 text-center">
              <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No Linked Users
              </h3>
              <p className="text-muted-foreground mb-4">
                You need to link users before you can upload documents for them.
              </p>
              <Button onClick={() => navigate("/partner/users")}>
                Link Users
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Document Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* User Selection */}
              <div className="space-y-2">
                <Label>Select User *</Label>
                <Select value={selectedProfileId} onValueChange={setSelectedProfileId}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select a user" />
                  </SelectTrigger>
                  <SelectContent>
                    {linkedProfiles.map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name} ({profile.carebag_id || "No ID"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* File Upload */}
              <div className="space-y-2">
                <Label>Document File *</Label>
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input
                    type="file"
                    id="file-upload"
                    onChange={handleFileChange}
                    className="hidden"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FileText className="h-10 w-10 text-muted-foreground mb-2" />
                    {file ? (
                      <p className="text-foreground font-medium">{file.name}</p>
                    ) : (
                      <>
                        <p className="text-foreground font-medium">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-sm text-muted-foreground">
                          PDF, JPG, PNG, DOC (max 10MB)
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Document Name */}
              <div className="space-y-2">
                <Label>Document Name *</Label>
                <Input
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="e.g., Blood Test Report"
                  className="bg-muted"
                />
              </div>

              {/* Document Date */}
              <div className="space-y-2">
                <Label>Document Date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted",
                        !documentDate && "text-muted-foreground"
                      )}
                    >
                      {documentDate ? format(documentDate, "PPP") : "Select date"}
                      <CalendarIcon className="ml-auto h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={documentDate}
                      onSelect={setDocumentDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Document Type */}
              <div className="space-y-2">
                <Label>Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {documentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Additional Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Doctor Name</Label>
                  <Input
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Dr. Smith"
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ailment/Condition</Label>
                  <Input
                    value={ailment}
                    onChange={(e) => setAilment(e.target.value)}
                    placeholder="e.g., Diabetes"
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Medicine</Label>
                <Input
                  value={medicine}
                  onChange={(e) => setMedicine(e.target.value)}
                  placeholder="e.g., Metformin 500mg"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label>Other Tags</Label>
                <Textarea
                  value={otherTags}
                  onChange={(e) => setOtherTags(e.target.value)}
                  placeholder="Any additional notes or tags..."
                  className="bg-muted"
                  rows={2}
                />
              </div>

              {/* Consent Checkbox */}
              <div className="flex items-start space-x-3 p-4 bg-muted/50 rounded-lg">
                <Checkbox
                  id="consent"
                  checked={consentGiven}
                  onCheckedChange={(checked) => setConsentGiven(checked === true)}
                />
                <label
                  htmlFor="consent"
                  className="text-sm text-foreground leading-relaxed cursor-pointer"
                >
                  I confirm that I have obtained consent from the user to upload this document on their behalf. 
                  The user has agreed to share this health information through the CareBag platform.
                </label>
              </div>

              {/* Upload Button */}
              <Button
                onClick={handleUpload}
                disabled={isUploading || !consentGiven || !file || !selectedProfileId || !documentName || !documentDate}
                className="w-full"
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PartnerLayout>
  );
};

export default PartnerDocumentUpload;

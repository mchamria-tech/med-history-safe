import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Menu, MoreVertical, Calendar, Plus, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { getSignedUrl } from "@/hooks/useSignedUrl";

// Validation schema
const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

const NewProfile = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const editProfileId = searchParams.get('edit');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [profilePhotoPath, setProfilePhotoPath] = useState<string | null>(null); // Store original path
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [height, setHeight] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [relation, setRelation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [allergies, setAllergies] = useState("");
  const [insurer, setInsurer] = useState("");
  const [policyNo, setPolicyNo] = useState("");
  const [typeOfPlan, setTypeOfPlan] = useState("");
  const [rmName, setRmName] = useState("");
  const [rmNo, setRmNo] = useState("");

  // Load profile data if editing
  useEffect(() => {
    if (editProfileId) {
      loadProfileData(editProfileId);
    }
  }, [editProfileId]);

  const loadProfileData = async (profileId: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

      if (error) throw error;

      if (data) {
        setName(data.name || "");
        setGender(data.gender || "");
        setRelation(data.relation || "");
        setEmail(data.email || "");
        setPhone(data.phone || "");
        setHeight(data.height || "");
        setWeight(data.weight || "");
        setBloodPressure(data.blood_pressure || "");
        setBloodGlucose(data.blood_glucose || "");
        setAllergies(data.allergies || "");
        setInsurer(data.insurer || "");
        setPolicyNo(data.policy_no || "");
        setTypeOfPlan(data.type_of_plan || "");
        setRmName(data.rm_name || "");
        setRmNo(data.rm_no || "");
        
        if (data.date_of_birth) {
          setDateOfBirth(new Date(data.date_of_birth));
        }
        if (data.expiry_date) {
          setExpiryDate(new Date(data.expiry_date));
        }
        if (data.profile_photo_url) {
          setProfilePhotoPath(data.profile_photo_url); // Store original path
          // Load signed URL for display
          const { url } = await getSignedUrl('profile-photos', data.profile_photo_url);
          if (url) setProfilePhoto(url);
        }
      }
    } catch (error: any) {
      console.error('Error loading profile:', error);
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  // Generate height options from 4'0" to 7'0" (122 cm to 213 cm)
  const heightOptions = [];
  for (let feet = 4; feet <= 7; feet++) {
    for (let inches = 0; inches < 12; inches++) {
      if (feet === 7 && inches > 0) break; // Stop at 7'0"
      const totalInches = feet * 12 + inches;
      const cm = Math.round(totalInches * 2.54);
      heightOptions.push({
        value: `${feet}'${inches}"`,
        label: `${feet}'${inches}" (${cm} cm)`,
      });
    }
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setProfilePhoto(null);
    setProfilePhotoPath(null);
    setPhotoFile(null);
    setDateOfBirth(undefined);
    setExpiryDate(undefined);
    setHeight("");
    setName("");
    setGender("");
    setRelation("");
    setEmail("");
    setPhone("");
    setWeight("");
    setBloodPressure("");
    setBloodGlucose("");
    setAllergies("");
    setInsurer("");
    setPolicyNo("");
    setTypeOfPlan("");
    setRmName("");
    setRmNo("");
  };

  const handleSave = async () => {
    try {
      setIsSubmitting(true);

      // Validate required fields
      const validation = profileSchema.safeParse({ name, email, phone });
      if (!validation.success) {
        toast({
          title: "Validation Error",
          description: validation.error.errors[0].message,
          variant: "destructive",
        });
        return;
      }

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Authentication Error",
          description: "You must be logged in to create a profile",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      let photoUrlToSave = profilePhotoPath; // Keep existing path if not changed

      // Upload new profile photo if a new file was selected
      if (photoFile) {
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${user.id}/${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('profile-photos')
          .upload(fileName, photoFile);

        if (uploadError) throw uploadError;

        // Store the file path instead of public URL
        photoUrlToSave = fileName;
      }

      const profileData = {
        user_id: user.id,
        name: name.trim(),
        gender: gender || null,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        relation: relation.trim() || null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        height: height || null,
        weight: weight.trim() || null,
        blood_pressure: bloodPressure.trim() || null,
        blood_glucose: bloodGlucose.trim() || null,
        allergies: allergies.trim() || null,
        insurer: insurer.trim() || null,
        policy_no: policyNo.trim() || null,
        type_of_plan: typeOfPlan.trim() || null,
        expiry_date: expiryDate ? format(expiryDate, 'yyyy-MM-dd') : null,
        rm_name: rmName.trim() || null,
        rm_no: rmNo.trim() || null,
        profile_photo_url: photoUrlToSave,
      };

      if (editProfileId) {
        // Update existing profile
        const { error: updateError } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', editProfileId);

        if (updateError) throw updateError;

        toast({
          title: "Success",
          description: "Profile updated successfully",
        });
      } else {
        // Insert new profile
        const { error: insertError } = await supabase
          .from('profiles')
          .insert(profileData);

        if (insertError) throw insertError;

        toast({
          title: "Success",
          description: "Profile created successfully",
        });
      }

      navigate("/dashboard");
    } catch (error: any) {
      console.error('Error saving profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-lg font-bold text-primary-foreground">
          {editProfileId ? "Edit Profile" : "Add Family Member"}
        </h1>
        <div className="w-8" /> {/* Spacer for centering */}
      </header>

      {/* Main Content */}
      <main className="flex-1 px-4 pb-32 pt-4 max-w-4xl mx-auto w-full animate-fade-in">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        ) : (
          <>
        {/* Section 1: Basic Info with Photo */}
        <div className="space-y-4">
          {/* Photo upload - centered on mobile */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              <input
                type="file"
                id="photo-upload"
                accept="image/*"
                onChange={handlePhotoUpload}
                className="hidden"
              />
              <label
                htmlFor="photo-upload"
                className="flex items-center justify-center w-32 h-32 rounded-full bg-muted cursor-pointer hover:bg-muted/80 transition-colors relative overflow-hidden border-2 border-primary animate-scale-in"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Plus className="w-8 h-8 text-muted-foreground" />
                )}
              </label>
            </div>
          </div>

          {/* Form fields - stacked on mobile */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">Name *</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-muted border-border" 
                required
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="gender" className="text-sm font-medium text-foreground">Gender</Label>
              <Input 
                id="gender" 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label className="text-sm font-medium text-foreground">Date of Birth</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted border-border hover:bg-muted/80",
                      !dateOfBirth && "text-muted-foreground"
                    )}
                  >
                    {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Select date</span>}
                    <Calendar className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={dateOfBirth}
                    onSelect={setDateOfBirth}
                    initialFocus
                    captionLayout="dropdown-buttons"
                    fromYear={1920}
                    toYear={new Date().getFullYear()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="relation" className="text-sm font-medium text-foreground">Relation</Label>
              <Input 
                id="relation" 
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="If Primary, write Self" 
                className="bg-muted border-border" 
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Details */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">Personal Details</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="email" className="text-sm font-medium text-foreground">Email</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">Phone</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="height" className="text-sm font-medium text-foreground">Height</Label>
              <Select value={height} onValueChange={setHeight}>
                <SelectTrigger className="bg-muted border-border">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent className="max-h-[300px] bg-popover z-50">
                  {heightOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="weight" className="text-sm font-medium text-foreground">Weight</Label>
              <Input 
                id="weight" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="blood-pressure" className="text-sm font-medium text-foreground">B. Pressure</Label>
              <Input 
                id="blood-pressure" 
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="blood-glucose" className="text-sm font-medium text-foreground">Blood Group</Label>
              <Input 
                id="blood-glucose" 
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label htmlFor="allergies" className="text-sm font-medium text-foreground">Allergies</Label>
              <Input 
                id="allergies" 
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>
          </div>
        </div>

        {/* Section 3: Medical Insurance Details */}
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-foreground border-b border-border pb-2">Medical Insurance</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <Label htmlFor="insurer" className="text-sm font-medium text-foreground">Insurer</Label>
              <Input 
                id="insurer" 
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="policy-no" className="text-sm font-medium text-foreground">Policy No.</Label>
              <Input 
                id="policy-no" 
                value={policyNo}
                onChange={(e) => setPolicyNo(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="type-of-plan" className="text-sm font-medium text-foreground">Plan Type</Label>
              <Input 
                id="type-of-plan" 
                value={typeOfPlan}
                onChange={(e) => setTypeOfPlan(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="col-span-2 space-y-1">
              <Label className="text-sm font-medium text-foreground">Expiry Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal bg-muted border-border hover:bg-muted/80",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    {expiryDate ? format(expiryDate, "PPP") : <span>Select date</span>}
                    <Calendar className="ml-auto h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-1">
              <Label htmlFor="rm-name" className="text-sm font-medium text-foreground">RM Name</Label>
              <Input 
                id="rm-name" 
                value={rmName}
                onChange={(e) => setRmName(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="rm-no" className="text-sm font-medium text-foreground">RM No.</Label>
              <Input 
                id="rm-no" 
                value={rmNo}
                onChange={(e) => setRmNo(e.target.value)}
                className="bg-muted border-border" 
              />
            </div>
          </div>
        </div>

        </>
        )}
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-4 pb-6 grid grid-cols-2 gap-3">
        <Button 
          variant="outline" 
          size="lg" 
          onClick={handleReset}
          className="h-12 font-semibold"
        >
          Reset
        </Button>
        <Button 
          size="lg" 
          onClick={handleSave}
          disabled={isSubmitting}
          className="h-12 bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
        >
          {isSubmitting ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
};

export default NewProfile;

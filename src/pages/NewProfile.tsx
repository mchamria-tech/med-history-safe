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
        <h1 className="text-xl font-semibold">
          {editProfileId ? "Edit Profile" : "Add New Family Member"}
        </h1>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading profile data...</p>
          </div>
        ) : (
          <>
        {/* Section 1: Basic Info with Photo */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-8 items-start">
          {/* Left side - Form fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="name" className="text-foreground font-normal text-lg w-32">Name :</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
                required
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="gender" className="text-foreground font-normal text-lg w-32">Gender:</Label>
              <Input 
                id="gender" 
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-foreground font-normal text-lg w-32">D.O.B :</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal bg-[hsl(190,50%,85%)] border-border hover:bg-[hsl(190,50%,80%)]",
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

            <div className="flex items-center gap-4">
              <Label htmlFor="relation" className="text-foreground font-normal text-lg w-32">Relation:</Label>
              <Input 
                id="relation" 
                value={relation}
                onChange={(e) => setRelation(e.target.value)}
                placeholder="If Primary, then write Self" 
                className="flex-1 bg-[hsl(190,50%,85%)] border-border placeholder:text-[hsl(190,30%,60%)]" 
              />
            </div>
          </div>

          {/* Right side - Photo upload */}
          <div className="flex items-center justify-center">
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
                className="flex items-center justify-center w-48 h-48 rounded-full bg-[hsl(190,50%,85%)] cursor-pointer hover:bg-[hsl(190,50%,80%)] transition-colors relative overflow-hidden"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Plus className="w-12 h-12 text-foreground absolute bottom-8 right-8" />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Personal Details */}
        <div>
          <h2 className="text-xl font-semibold text-foreground text-center mb-6">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="email" className="text-foreground font-normal text-lg w-32">Email :</Label>
              <Input 
                id="email" 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="phone" className="text-foreground font-normal text-lg w-32">Phone :</Label>
              <Input 
                id="phone" 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="height" className="text-foreground font-normal text-lg w-32">Height :</Label>
              <Select value={height} onValueChange={setHeight}>
                <SelectTrigger className="flex-1 bg-[hsl(190,50%,85%)] border-border">
                  <SelectValue placeholder="Select height" />
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

            <div className="flex items-center gap-4">
              <Label htmlFor="weight" className="text-foreground font-normal text-lg w-32">Weight :</Label>
              <Input 
                id="weight" 
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="blood-pressure" className="text-foreground font-normal text-lg w-32">B. Pressure :</Label>
              <Input 
                id="blood-pressure" 
                value={bloodPressure}
                onChange={(e) => setBloodPressure(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="blood-glucose" className="text-foreground font-normal text-lg w-32">Blood Group :</Label>
              <Input 
                id="blood-glucose" 
                value={bloodGlucose}
                onChange={(e) => setBloodGlucose(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="md:col-span-2 flex items-center gap-4">
              <Label htmlFor="allergies" className="text-foreground font-normal text-lg w-32">Allergies :</Label>
              <Input 
                id="allergies" 
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>
          </div>
        </div>

        {/* Section 3: Medical Insurance Details */}
        <div>
          <h2 className="text-xl font-semibold text-foreground text-center mb-6">Medical Insurance Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="insurer" className="text-foreground font-normal text-lg w-32">Insurer :</Label>
              <Input 
                id="insurer" 
                value={insurer}
                onChange={(e) => setInsurer(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="policy-no" className="text-foreground font-normal text-lg w-32">Policy No. :</Label>
              <Input 
                id="policy-no" 
                value={policyNo}
                onChange={(e) => setPolicyNo(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="type-of-plan" className="text-foreground font-normal text-lg w-32">Type of Plan :</Label>
              <Input 
                id="type-of-plan" 
                value={typeOfPlan}
                onChange={(e) => setTypeOfPlan(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label className="text-foreground font-normal text-lg w-32">Expiry :</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "flex-1 justify-start text-left font-normal bg-[hsl(190,50%,85%)] border-border hover:bg-[hsl(190,50%,80%)]",
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

            <div className="flex items-center gap-4">
              <Label htmlFor="rm-name" className="text-foreground font-normal text-lg w-32">R. M Name :</Label>
              <Input 
                id="rm-name" 
                value={rmName}
                onChange={(e) => setRmName(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="rm-no" className="text-foreground font-normal text-lg w-32">R. M. No. :</Label>
              <Input 
                id="rm-no" 
                value={rmNo}
                onChange={(e) => setRmNo(e.target.value)}
                className="flex-1 bg-[hsl(190,50%,85%)] border-border" 
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-0 pt-6">
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={handleReset}
            className="w-full uppercase font-bold text-lg py-8 rounded-none bg-muted hover:bg-muted/80 text-foreground"
          >
            Reset Details
          </Button>
          <Button 
            size="lg" 
            onClick={handleSave}
            disabled={isSubmitting}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground uppercase font-bold text-lg py-8 rounded-none"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default NewProfile;

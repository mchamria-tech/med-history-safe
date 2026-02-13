import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import PartnerLayout from "@/components/partner/PartnerLayout";
import DateDropdowns from "@/components/DateDropdowns";
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
  phone: z.string().trim().max(20).optional().or(z.literal("")),
});

const PartnerNewUser = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner } = usePartnerCheck();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form fields
  const [name, setName] = useState("");
  const [gender, setGender] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [bloodPressure, setBloodPressure] = useState("");
  const [bloodGlucose, setBloodGlucose] = useState("");
  const [allergies, setAllergies] = useState("");

  // Emergency contact fields
  const [emergencyName, setEmergencyName] = useState("");
  const [emergencyRelation, setEmergencyRelation] = useState("");
  const [emergencyPhone, setEmergencyPhone] = useState("");
  const [emergencyEmail, setEmergencyEmail] = useState("");

  // Generate height options
  const heightOptions = [];
  for (let feet = 4; feet <= 7; feet++) {
    for (let inches = 0; inches < 12; inches++) {
      if (feet === 7 && inches > 0) break;
      const totalInches = feet * 12 + inches;
      const cm = Math.round(totalInches * 2.54);
      heightOptions.push({
        value: `${feet}'${inches}"`,
        label: `${feet}'${inches}" (${cm} cm)`,
      });
    }
  }

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

      if (!partner?.user_id) {
        toast({
          title: "Error",
          description: "Partner information not found",
          variant: "destructive",
        });
        return;
      }

      // Generate Global ID using the partner's country for the country prefix
      const partnerCountry = (partner as any)?.country || 'IND';
      const { data: globalIdData } = await supabase.rpc('generate_global_id', { 
        role_type: 'user',
        country_code: partnerCountry,
      });

      // Create profile without user_id - partner-created profiles have null user_id
      // This prevents cascade deletion if partner is deleted, and allows patients to "claim" their profile later
      const profileData = {
        user_id: null as unknown as string, // Null for partner-created profiles (patient can claim later)
        created_by_partner_id: partner.id, // Track which partner created this profile
        name: name.trim(),
        gender: gender || null,
        date_of_birth: dateOfBirth ? format(dateOfBirth, 'yyyy-MM-dd') : null,
        email: email.trim() || null,
        phone: phone.trim() || null,
        height: height || null,
        weight: weight.trim() || null,
        blood_pressure: bloodPressure.trim() || null,
        blood_glucose: bloodGlucose.trim() || null,
        allergies: allergies.trim() || null,
        carebag_id: globalIdData,
        // Store emergency contact info in relation field as JSON string for now
        relation: emergencyName ? JSON.stringify({
          name: emergencyName.trim(),
          relation: emergencyRelation.trim(),
          phone: emergencyPhone.trim(),
          email: emergencyEmail.trim(),
        }) : null,
      };

      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert(profileData)
        .select()
        .single();

      if (insertError) throw insertError;

      // Auto-link this new user to the partner
      const { error: linkError } = await supabase.from("partner_users").insert({
        partner_id: partner.id,
        profile_id: newProfile.id,
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
      });

      if (linkError) {
        console.error("Error linking user:", linkError);
        // Profile was created but linking failed - still show success but warn
        toast({
          title: "User Created",
          description: `User created with Global ID: ${globalIdData}. Note: Auto-linking failed, please link manually.`,
        });
      } else {
        toast({
          title: "Success",
          description: `New user created and linked! Global ID: ${globalIdData}`,
        });
      }

      navigate("/partner/dashboard");
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PartnerLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/partner/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Create New User</h1>
            <p className="text-muted-foreground">Add a new user to CareBag and link to your partner account</p>
          </div>
        </div>

        {/* Basic Info Card */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Basic Information
            </CardTitle>
            <CardDescription>Required details for the new user</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full name"
                className="bg-muted"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gender">Gender</Label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Date of Birth</Label>
                <DateDropdowns
                  value={dateOfBirth}
                  onChange={setDateOfBirth}
                  fromYear={1920}
                  toYear={new Date().getFullYear()}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Info Card */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contact Information</CardTitle>
            <CardDescription>User and emergency contact details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              {/* Left: User Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">User Contact</h3>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-3 bg-muted rounded-md border border-input">
                      <span className="text-sm">🇮🇳</span>
                      <span className="text-sm font-medium">+91</span>
                    </div>
                    <Input
                      id="phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setPhone(value);
                      }}
                      placeholder="10-digit mobile"
                      className="bg-muted flex-1"
                      maxLength={10}
                    />
                  </div>
                </div>
              </div>

              {/* Right: Emergency Contact */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-foreground border-b border-border pb-2">Emergency Contact</h3>
                <div className="space-y-2">
                  <Label htmlFor="emergencyName">Contact Name</Label>
                  <Input
                    id="emergencyName"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    placeholder="Emergency contact name"
                    className="bg-muted"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyRelation">Relation</Label>
                  <Select value={emergencyRelation} onValueChange={setEmergencyRelation}>
                    <SelectTrigger className="bg-muted">
                      <SelectValue placeholder="Select relation" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="Spouse">Spouse</SelectItem>
                      <SelectItem value="Parent">Parent</SelectItem>
                      <SelectItem value="Child">Child</SelectItem>
                      <SelectItem value="Sibling">Sibling</SelectItem>
                      <SelectItem value="Friend">Friend</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyPhone">Phone</Label>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-1 px-3 bg-muted rounded-md border border-input">
                      <span className="text-sm">🇮🇳</span>
                      <span className="text-sm font-medium">+91</span>
                    </div>
                    <Input
                      id="emergencyPhone"
                      type="tel"
                      value={emergencyPhone}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, "").slice(0, 10);
                        setEmergencyPhone(value);
                      }}
                      placeholder="10-digit mobile"
                      className="bg-muted flex-1"
                      maxLength={10}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergencyEmail">Email</Label>
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={emergencyEmail}
                    onChange={(e) => setEmergencyEmail(e.target.value)}
                    placeholder="emergency@example.com"
                    className="bg-muted"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Health Info Card */}
        <Card className="shadow-soft">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Health Information</CardTitle>
            <CardDescription>Optional health details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="height">Height</Label>
                <Select value={height} onValueChange={setHeight}>
                  <SelectTrigger className="bg-muted">
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

              <div className="space-y-2">
                <Label htmlFor="weight">Weight (kg)</Label>
                <Input
                  id="weight"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="e.g., 70"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  value={bloodPressure}
                  onChange={(e) => setBloodPressure(e.target.value)}
                  placeholder="e.g., 120/80"
                  className="bg-muted"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bloodGlucose">Blood Group</Label>
                <Select value={bloodGlucose} onValueChange={setBloodGlucose}>
                  <SelectTrigger className="bg-muted">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="A+">A+</SelectItem>
                    <SelectItem value="A-">A-</SelectItem>
                    <SelectItem value="B+">B+</SelectItem>
                    <SelectItem value="B-">B-</SelectItem>
                    <SelectItem value="AB+">AB+</SelectItem>
                    <SelectItem value="AB-">AB-</SelectItem>
                    <SelectItem value="O+">O+</SelectItem>
                    <SelectItem value="O-">O-</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergies">Allergies</Label>
              <Input
                id="allergies"
                value={allergies}
                onChange={(e) => setAllergies(e.target.value)}
                placeholder="List any known allergies"
                className="bg-muted"
              />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3 pb-6">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => navigate("/partner/dashboard")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSubmitting || !name.trim()}
          >
            {isSubmitting ? "Creating..." : "Create & Link User"}
          </Button>
        </div>
      </div>
    </PartnerLayout>
  );
};

export default PartnerNewUser;

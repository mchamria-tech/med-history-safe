import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MoreVertical, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const NewProfile = () => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [gender, setGender] = useState<string>("male");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfilePhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    // Reset all form fields
    setProfilePhoto(null);
    setDateOfBirth(undefined);
    setExpiryDate(undefined);
    setGender("male");
  };

  const handleSave = () => {
    // TODO: Save profile data
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
          <Menu className="h-6 w-6" />
        </Button>
        <h1 className="text-xl font-semibold">Add New Family Member</h1>
        <Button variant="ghost" size="icon" className="text-primary-foreground hover:bg-primary/80">
          <MoreVertical className="h-6 w-6" />
        </Button>
      </header>

      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Section 1: Basic Info with Photo */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left side - Form fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-foreground font-medium">Name:</Label>
              <Input id="name" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label className="text-foreground font-medium">Gender:</Label>
              <RadioGroup value={gender} onValueChange={setGender} className="flex gap-4 mt-1">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="other" id="other" />
                  <Label htmlFor="other" className="font-normal cursor-pointer">Other</Label>
                </div>
              </RadioGroup>
            </div>

            <div>
              <Label className="text-foreground font-medium">D.O.B:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1 bg-muted/50 border-muted hover:bg-muted/70",
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
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="relation" className="text-foreground font-medium">Relation:</Label>
              <Input 
                id="relation" 
                placeholder="If Primary, leave blank" 
                className="mt-1 bg-muted/50 border-muted placeholder:text-muted-foreground/70" 
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
                className="flex items-center justify-center w-48 h-48 rounded-full border-4 border-primary/20 bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors relative overflow-hidden"
              >
                {profilePhoto ? (
                  <img src={profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <Plus className="w-12 h-12 text-foreground" />
                )}
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Personal Details */}
        <div>
          <h2 className="text-xl font-semibold text-foreground text-center mb-6">Personal Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email" className="text-foreground font-medium">Email:</Label>
              <Input id="email" type="email" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="phone" className="text-foreground font-medium">Phone:</Label>
              <Input id="phone" type="tel" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="height" className="text-foreground font-medium">Height:</Label>
              <Input id="height" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="weight" className="text-foreground font-medium">Weight:</Label>
              <Input id="weight" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="blood-pressure" className="text-foreground font-medium">B. Pressure:</Label>
              <Input id="blood-pressure" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="blood-glucose" className="text-foreground font-medium">B. Glucose:</Label>
              <Input id="blood-glucose" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="allergies" className="text-foreground font-medium">Allergies:</Label>
              <Input id="allergies" className="mt-1 bg-muted/50 border-muted" />
            </div>
          </div>
        </div>

        {/* Section 3: Medical Insurance Details */}
        <div>
          <h2 className="text-xl font-semibold text-foreground text-center mb-6">Medical Insurance Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="insurer" className="text-foreground font-medium">Insurer:</Label>
              <Input id="insurer" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="policy-no" className="text-foreground font-medium">Policy No.:</Label>
              <Input id="policy-no" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="type-of-plan" className="text-foreground font-medium">Type of Plan:</Label>
              <Input id="type-of-plan" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label className="text-foreground font-medium">Expiry:</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal mt-1 bg-muted/50 border-muted hover:bg-muted/70",
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

            <div>
              <Label htmlFor="rm-name" className="text-foreground font-medium">R. M Name:</Label>
              <Input id="rm-name" className="mt-1 bg-muted/50 border-muted" />
            </div>

            <div>
              <Label htmlFor="rm-no" className="text-foreground font-medium">R. M. No.:</Label>
              <Input id="rm-no" className="mt-1 bg-muted/50 border-muted" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-4 pt-4">
          <Button 
            variant="secondary" 
            size="lg" 
            onClick={handleReset}
            className="w-full uppercase font-semibold"
          >
            Reset Details
          </Button>
          <Button 
            size="lg" 
            onClick={handleSave}
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground uppercase font-semibold"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewProfile;

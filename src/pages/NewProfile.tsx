import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, MoreVertical, Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const NewProfile = () => {
  const navigate = useNavigate();
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [expiryDate, setExpiryDate] = useState<Date>();
  const [height, setHeight] = useState<string>("");

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
    setHeight("");
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
      <div className="p-6 space-y-8 max-w-4xl mx-auto">
        {/* Section 1: Basic Info with Photo */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr,auto] gap-8 items-start">
          {/* Left side - Form fields */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="name" className="text-foreground font-normal text-lg w-32">Name :</Label>
              <Input id="name" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="gender" className="text-foreground font-normal text-lg w-32">Gender:</Label>
              <Input id="gender" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
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
                placeholder="If Primary, leave blank" 
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
              <Input id="email" type="email" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="phone" className="text-foreground font-normal text-lg w-32">Phone :</Label>
              <Input id="phone" type="tel" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
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
              <Input id="weight" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="blood-pressure" className="text-foreground font-normal text-lg w-32">B. Pressure :</Label>
              <Input id="blood-pressure" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="blood-glucose" className="text-foreground font-normal text-lg w-32">B. Glucose :</Label>
              <Input id="blood-glucose" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="md:col-span-2 flex items-center gap-4">
              <Label htmlFor="allergies" className="text-foreground font-normal text-lg w-32">Allergies :</Label>
              <Input id="allergies" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>
          </div>
        </div>

        {/* Section 3: Medical Insurance Details */}
        <div>
          <h2 className="text-xl font-semibold text-foreground text-center mb-6">Medical Insurance Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="insurer" className="text-foreground font-normal text-lg w-32">Insurer :</Label>
              <Input id="insurer" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="policy-no" className="text-foreground font-normal text-lg w-32">Policy No. :</Label>
              <Input id="policy-no" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="type-of-plan" className="text-foreground font-normal text-lg w-32">Type of Plan :</Label>
              <Input id="type-of-plan" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
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
              <Input id="rm-name" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
            </div>

            <div className="flex items-center gap-4">
              <Label htmlFor="rm-no" className="text-foreground font-normal text-lg w-32">R. M. No. :</Label>
              <Input id="rm-no" className="flex-1 bg-[hsl(190,50%,85%)] border-border" />
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
            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground uppercase font-bold text-lg py-8 rounded-none"
          >
            Save
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewProfile;

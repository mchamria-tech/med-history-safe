import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import careBagLogo from "@/assets/carebag-logo.png";
import { Plus, User } from "lucide-react";

const Dashboard = () => {
  // Mock profiles - in real app, this would come from backend
  const [profiles, setProfiles] = useState([
    { id: 1, name: "John Doe", type: "Patient" },
    { id: 2, name: "Jane Smith", type: "Caregiver" }
  ]);

  const handleCreateProfile = () => {
    // TODO: Navigate to create profile page
    console.log("Create new profile");
  };

  const handleSelectProfile = (profileId: number) => {
    // TODO: Load selected profile and navigate to main app
    console.log("Selected profile:", profileId);
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-primary py-8 text-center">
        <h1 className="text-4xl font-bold text-primary-foreground">Welcome to CareBag</h1>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-8 flex h-32 w-32 items-center justify-center rounded-full border-6 border-[#3DB4E6] bg-white p-6">
          <img
            src={careBagLogo}
            alt="CareBag Logo"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="w-full max-w-2xl space-y-6">
          <h2 className="text-center text-2xl font-semibold text-foreground">
            Select a Profile or Create a New One
          </h2>

          {/* Existing Profiles */}
          {profiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-muted-foreground">Your Profiles</h3>
              <div className="grid gap-4 md:grid-cols-2">
                {profiles.map((profile) => (
                  <Card
                    key={profile.id}
                    className="cursor-pointer p-6 transition-all hover:shadow-lg hover:border-primary"
                    onClick={() => handleSelectProfile(profile.id)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-foreground">{profile.name}</h4>
                        <p className="text-sm text-muted-foreground">{profile.type}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create New Profile Button */}
          <div className="pt-4">
            <Button
              onClick={handleCreateProfile}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Profile
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;


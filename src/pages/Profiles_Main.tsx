import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import careBagLogo from "@/assets/carebag-logo.png";
import { Plus, User, Edit, Trash2, Search, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const Profiles_Main = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profiles, setProfiles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Sort profiles to always show primary account holder first (relation = "Self")
      const sortedProfiles = (data || []).sort((a, b) => {
        const aIsPrimary = a.relation?.toLowerCase() === 'self';
        const bIsPrimary = b.relation?.toLowerCase() === 'self';
        if (aIsPrimary && !bIsPrimary) return -1;
        if (!aIsPrimary && bIsPrimary) return 1;
        return 0;
      });

      setProfiles(sortedProfiles);
    } catch (error: any) {
      console.error('Error fetching profiles:', error);
      toast({
        title: "Error",
        description: "Failed to load profiles",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProfile = () => {
    navigate("/new-profile");
  };

  const handleDocumentSearch = () => {
    navigate("/document-search");
  };

  const handleSelectProfile = (profileId: string) => {
    navigate(`/profile/${profileId}`);
  };

  const handleEditProfile = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    navigate(`/new-profile?edit=${profileId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, profileId: string) => {
    e.stopPropagation();
    setProfileToDelete(profileId);
    setDeleteDialogOpen(true);
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out",
      });
      
      navigate("/login");
    } catch (error: any) {
      console.error('Error logging out:', error);
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!profileToDelete) return;

    try {
      const profile = profiles.find(p => p.id === profileToDelete);
      
      // Delete profile photo from storage if it exists
      if (profile?.profile_photo_url) {
        const urlParts = profile.profile_photo_url.split('/');
        const fileName = urlParts.slice(-2).join('/'); // Get user_id/filename
        
        await supabase.storage
          .from('profile-photos')
          .remove([fileName]);
      }

      // Delete profile from database
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileToDelete);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Profile deleted successfully",
      });

      // Refresh profiles list
      fetchProfiles();
    } catch (error: any) {
      console.error('Error deleting profile:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete profile",
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setProfileToDelete(null);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="w-full bg-primary py-8 text-center">
        <h1 className="text-4xl font-bold text-primary-foreground">Welcome to CareBag</h1>
      </header>

      {/* Logout Button */}
      <div className="w-full flex justify-end px-6 py-4">
        <Button
          onClick={handleLogout}
          variant="ghost"
          className="text-black hover:bg-transparent hover:text-black/80"
          size="sm"
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>

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
            {loading ? "Loading profiles..." : "Select a Profile or Create a New One"}
          </h2>

          {/* Existing Profiles */}
          {!loading && profiles.length > 0 && (
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
                      <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-primary bg-background overflow-hidden">
                        {profile.profile_photo_url ? (
                          <img 
                            src={profile.profile_photo_url} 
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-foreground text-lg">{profile.name}</h4>
                        {profile.relation && (
                          <p className="text-sm text-muted-foreground">{profile.relation}</p>
                        )}
                        {profile.expiry_date && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Insurance expires: {format(new Date(profile.expiry_date), 'PP')}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => handleEditProfile(e, profile.id)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Profile
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDeleteClick(e, profile.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Profile
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Create New Profile Button */}
          <div className="pt-4 space-y-3">
            <Button
              onClick={handleCreateProfile}
              className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
              size="lg"
            >
              <Plus className="mr-2 h-5 w-5" />
              Create New Profile
            </Button>
            
            <Button
              onClick={handleDocumentSearch}
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              size="lg"
            >
              <Search className="mr-2 h-5 w-5" />
              Document Search
            </Button>
          </div>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This will remove all saved data except your login credentials. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profiles_Main;


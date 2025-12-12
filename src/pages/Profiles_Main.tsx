import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import careBagLogo from "@/assets/carebag-logo-new.png";
import { Plus, User, Edit, Trash2, Search, LogOut, MessageSquare, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { useAdminCheck } from "@/hooks/useAdminCheck";
import { getSignedUrl } from "@/hooks/useSignedUrl";
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
  const [profilePhotoUrls, setProfilePhotoUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const { isAdmin } = useAdminCheck();

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
      
      // Fetch signed URLs for profile photos
      const photoUrls: Record<string, string> = {};
      await Promise.all(
        sortedProfiles.map(async (profile) => {
          if (profile.profile_photo_url) {
            const { url } = await getSignedUrl('profile-photos', profile.profile_photo_url);
            if (url) {
              photoUrls[profile.id] = url;
            }
          }
        })
      );
      setProfilePhotoUrls(photoUrls);
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
      {/* Compact Header */}
      <header className="flex w-full items-center justify-between bg-primary px-4 py-3">
        <h1 className="text-xl font-bold text-primary-foreground">CareBag</h1>
        <ThemeSelector />
      </header>

      {/* Action Bar */}
      <div className="w-full flex justify-end gap-1 px-4 py-2 border-b border-border">
        {isAdmin && (
          <Button
            onClick={() => navigate("/admin/feedback")}
            variant="ghost"
            size="sm"
            className="text-foreground"
          >
            <Shield className="h-4 w-4 mr-1" />
            <span className="text-xs">Admin</span>
          </Button>
        )}
        <Button
          onClick={() => navigate("/feedback-hub")}
          variant="ghost"
          size="sm"
          className="text-foreground"
        >
          <MessageSquare className="h-4 w-4 mr-1" />
          <span className="text-xs">Feedback</span>
        </Button>
        <Button
          onClick={handleLogout}
          variant="ghost"
          size="sm"
          className="text-foreground"
        >
          <LogOut className="h-4 w-4 mr-1" />
          <span className="text-xs">Logout</span>
        </Button>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center px-4 pb-32 pt-6 animate-fade-in">
        {/* Logo */}
        <div className="mb-4 flex h-36 w-36 items-center justify-center rounded-full border-4 border-primary bg-white p-4 animate-scale-in">
          <img
            src={careBagLogo}
            alt="CareBag Logo"
            className="h-full w-full object-contain"
          />
        </div>

        <div className="w-full max-w-2xl space-y-4">
          <h2 className="text-center text-lg font-semibold text-foreground">
            {loading ? "Loading profiles..." : "Select a Profile or Create New"}
          </h2>

          {/* Existing Profiles */}
          {!loading && profiles.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">Your Profiles</h3>
              <div className="grid gap-3">
                {profiles.map((profile) => (
                  <Card
                    key={profile.id}
                    className="cursor-pointer p-4 transition-all hover:shadow-lg hover:border-primary"
                    onClick={() => handleSelectProfile(profile.id)}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-primary bg-background overflow-hidden flex-shrink-0">
                        {profilePhotoUrls[profile.id] ? (
                          <img 
                            src={profilePhotoUrls[profile.id]} 
                            alt={profile.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-foreground truncate">{profile.name}</h4>
                        {profile.relation && (
                          <p className="text-xs text-muted-foreground">{profile.relation}</p>
                        )}
                        {profile.insurer && (
                          <p className="text-xs text-muted-foreground truncate">
                            {profile.insurer}
                          </p>
                        )}
                        {profile.expiry_date && (
                          <p className="text-xs text-muted-foreground">
                            Expires: {format(new Date(profile.expiry_date), 'PP')}
                          </p>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="flex-shrink-0">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-background z-50">
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
        </div>
      </main>

      {/* Sticky Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/95 backdrop-blur-sm border-t border-border px-4 py-3 pb-6 space-y-2">
        <Button
          onClick={handleCreateProfile}
          className="w-full h-12 text-base font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
        >
          <Plus className="mr-2 h-5 w-5" />
          Create New Profile
        </Button>
        <Button
          onClick={handleDocumentSearch}
          variant="outline"
          className="w-full h-12 text-base font-semibold"
        >
          <Search className="mr-2 h-5 w-5" />
          Document Search
        </Button>
      </div>

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

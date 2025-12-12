import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ThemeSelector } from "@/components/ThemeSelector";
import careBagLogo from "@/assets/carebag-logo-new.png";
import { Plus, User, Edit, Trash2, Search, LogOut, MessageSquare, Shield, FileText, Users, MoreVertical } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
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
  const [photosLoading, setPhotosLoading] = useState<Record<string, boolean>>({});
  const [documentCounts, setDocumentCounts] = useState<Record<string, number>>({});
  const [totalDocuments, setTotalDocuments] = useState(0);
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
      
      // Fetch document counts for each profile
      const docCounts: Record<string, number> = {};
      let total = 0;
      await Promise.all(
        sortedProfiles.map(async (profile) => {
          const { count } = await supabase
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('profile_id', profile.id);
          docCounts[profile.id] = count || 0;
          total += count || 0;
        })
      );
      setDocumentCounts(docCounts);
      setTotalDocuments(total);
      
      // Set loading state for profiles with photos
      const loadingState: Record<string, boolean> = {};
      sortedProfiles.forEach((profile) => {
        if (profile.profile_photo_url) {
          loadingState[profile.id] = true;
        }
      });
      setPhotosLoading(loadingState);
      
      // Fetch signed URLs for profile photos
      const photoUrls: Record<string, string> = {};
      await Promise.all(
        sortedProfiles.map(async (profile) => {
          if (profile.profile_photo_url) {
            console.log(`[ProfilePhoto] Fetching signed URL for ${profile.name}:`, profile.profile_photo_url);
            const { url, error } = await getSignedUrl('profile-photos', profile.profile_photo_url);
            if (error) {
              console.error(`[ProfilePhoto] Error for ${profile.name}:`, error);
            }
            if (url) {
              console.log(`[ProfilePhoto] Got signed URL for ${profile.name}:`, url.substring(0, 80) + '...');
              photoUrls[profile.id] = url;
            }
            setPhotosLoading(prev => ({ ...prev, [profile.id]: false }));
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

  const getInsuranceStatus = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const daysUntilExpiry = differenceInDays(new Date(expiryDate), new Date());
    if (daysUntilExpiry < 0) return { label: "Expired", color: "text-destructive" };
    if (daysUntilExpiry <= 30) return { label: "Expiring Soon", color: "text-amber-500" };
    return { label: "Valid", color: "text-green-500" };
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header with Prominent Floating Logo */}
      <header className="relative flex flex-col items-center bg-gradient-to-br from-primary to-primary/80 px-4 py-4 pb-6">
        {/* Action buttons - top right */}
        <div className="absolute right-2 top-2 flex items-center gap-0.5">
          {isAdmin && (
            <Button
              onClick={() => navigate("/admin/feedback")}
              variant="ghost"
              size="icon"
              className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
            >
              <Shield className="h-4 w-4" />
            </Button>
          )}
          <Button
            onClick={() => navigate("/feedback-hub")}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
          <ThemeSelector />
          <Button
            onClick={handleLogout}
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-primary-foreground hover:bg-primary-foreground/20"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        
        {/* Prominent Floating Logo */}
        <div className="mt-2 h-16 w-16 rounded-full bg-white shadow-lg ring-4 ring-white/30 flex items-center justify-center">
          <img
            src={careBagLogo}
            alt="CareBag"
            className="h-12 w-12 object-contain"
          />
        </div>
        
        {/* Title */}
        <h1 className="mt-2 text-xl font-bold text-primary-foreground">CareBag</h1>
      </header>

      {/* Quick Stats Strip */}
      <div className="flex items-center justify-center gap-6 bg-muted/50 px-4 py-2 border-b border-border">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="h-4 w-4" />
          <span className="font-medium text-foreground">{profiles.length}</span>
          <span>Profiles</span>
        </div>
        <div className="w-px h-4 bg-border" />
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span className="font-medium text-foreground">{totalDocuments}</span>
          <span>Documents</span>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col px-4 pb-36 pt-4 animate-fade-in">
        <div className="w-full max-w-2xl mx-auto space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading profiles...</div>
          ) : profiles.length === 0 ? (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="h-10 w-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No Profiles Yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs">
                Create your first profile to start managing your medical documents securely.
              </p>
            </div>
          ) : (
            /* Profile Cards */
            <div className="space-y-3">
              {profiles.map((profile, index) => {
                const insuranceStatus = getInsuranceStatus(profile.expiry_date);
                const isPrimary = profile.relation?.toLowerCase() === 'self';
                
                return (
                  <Card
                    key={profile.id}
                    className={`cursor-pointer p-4 transition-all hover:shadow-lg hover:border-primary ${
                      isPrimary ? 'border-primary/50 bg-primary/5' : ''
                    }`}
                    onClick={() => handleSelectProfile(profile.id)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Profile Photo */}
                      <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-primary bg-background overflow-hidden flex-shrink-0">
                        {photosLoading[profile.id] ? (
                          <div className="w-full h-full bg-muted animate-pulse" />
                        ) : profilePhotoUrls[profile.id] ? (
                          <img 
                            src={profilePhotoUrls[profile.id]} 
                            alt={profile.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              console.error(`[ProfilePhoto] Image failed to load for ${profile.name}`);
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <User className="h-7 w-7 text-primary" />
                        )}
                      </div>
                      
                      {/* Profile Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-foreground truncate">{profile.name}</h4>
                          {isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                              Primary
                            </span>
                          )}
                          {profile.relation && !isPrimary && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {profile.relation}
                            </span>
                          )}
                        </div>
                        
                        {/* Insurance Info */}
                        <div className="flex items-center gap-2 mt-1">
                          {profile.insurer ? (
                            <span className="text-xs text-muted-foreground truncate">
                              {profile.insurer}
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">No insurance</span>
                          )}
                          {insuranceStatus && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <span className={`text-xs font-medium ${insuranceStatus.color}`}>
                                {insuranceStatus.label}
                              </span>
                            </>
                          )}
                        </div>
                        
                        {/* Document Count */}
                        <div className="flex items-center gap-1 mt-1.5">
                          <FileText className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {documentCounts[profile.id] || 0} documents
                          </span>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                            <MoreVertical className="h-4 w-4" />
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
                );
              })}
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

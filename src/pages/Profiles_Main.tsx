import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import careBagLogo from "@/assets/carebag-logo-new.png";
import { Plus, User, Edit, Trash2, Search, LogOut, MessageSquare, Shield, FileText, Users, MoreVertical, ChevronRight } from "lucide-react";
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
            const { url, error } = await getSignedUrl('profile-photos', profile.profile_photo_url);
            if (url) {
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
        const fileName = urlParts.slice(-2).join('/');
        
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
    if (daysUntilExpiry < 0) return { label: "Expired", color: "bg-destructive/10 text-destructive" };
    if (daysUntilExpiry <= 30) return { label: "Expiring Soon", color: "bg-warning/10 text-warning" };
    return { label: "Valid", color: "bg-success/10 text-success" };
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 p-2 shadow-soft flex items-center justify-center">
              <img
                src={careBagLogo}
                alt="CareBag"
                className="h-6 w-6 object-contain"
              />
            </div>
            <h1 className="text-xl font-bold text-foreground">CareBag</h1>
          </div>
          
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/admin/feedback')}
                className="h-9 w-9 rounded-xl"
                title="Admin Dashboard"
              >
                <Shield className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/feedback-hub')}
              className="h-9 w-9 rounded-xl"
              title="Feedback"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-9 w-9 rounded-xl"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="px-4 py-4">
        <div className="flex gap-3">
          <div className="flex-1 rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{profiles.length}</p>
                <p className="text-xs text-muted-foreground">Profiles</p>
              </div>
            </div>
          </div>
          <div className="flex-1 rounded-2xl bg-card border border-border/50 p-4 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <FileText className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{totalDocuments}</p>
                <p className="text-xs text-muted-foreground">Documents</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="flex flex-1 flex-col px-4 pb-36 animate-fade-in">
        {loading ? (
          <div className="space-y-3 pt-2">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : profiles.length === 0 ? (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-20 w-20 rounded-2xl bg-muted flex items-center justify-center mb-5">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No Profiles Yet</h3>
            <p className="text-sm text-muted-foreground max-w-[240px]">
              Create your first profile to start managing your medical documents securely.
            </p>
          </div>
        ) : (
          /* Profile Cards */
          <div className="space-y-3 pt-2">
            {profiles.map((profile, index) => {
              const insuranceStatus = getInsuranceStatus(profile.expiry_date);
              const isPrimary = profile.relation?.toLowerCase() === 'self';
              
              return (
                <Card
                  key={profile.id}
                  className="cursor-pointer p-4 rounded-2xl border-border/50 shadow-soft hover:shadow-elevated transition-all duration-200"
                  onClick={() => handleSelectProfile(profile.id)}
                >
                  <div className="flex items-center gap-4">
                    {/* Profile Photo */}
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted overflow-hidden flex-shrink-0">
                      {photosLoading[profile.id] ? (
                        <div className="w-full h-full bg-muted animate-pulse" />
                      ) : profilePhotoUrls[profile.id] ? (
                        <img 
                          src={profilePhotoUrls[profile.id]} 
                          alt={profile.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                          }}
                        />
                      ) : (
                        <User className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    
                    {/* Profile Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-foreground truncate">{profile.name}</h4>
                        {isPrimary && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Primary
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2 flex-wrap">
                        {profile.insurer && (
                          <span className="text-xs text-muted-foreground">
                            {profile.insurer}
                          </span>
                        )}
                        {insuranceStatus && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${insuranceStatus.color}`}>
                            {insuranceStatus.label}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-1 mt-1.5 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        <span>{documentCounts[profile.id] || 0} documents</span>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="rounded-xl">
                          <DropdownMenuItem onClick={(e) => handleEditProfile(e, profile.id)} className="rounded-lg">
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={(e) => handleDeleteClick(e, profile.id)}
                            className="text-destructive rounded-lg"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-border/50 px-4 py-4 pb-8 space-y-2">
        <Button
          onClick={handleCreateProfile}
          className="w-full h-12 text-base font-semibold rounded-xl shadow-soft"
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Profile
        </Button>
        <Button
          onClick={handleDocumentSearch}
          variant="outline"
          className="w-full h-12 text-base font-medium rounded-xl"
        >
          <Search className="mr-2 h-5 w-5" />
          Search Documents
        </Button>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Profile</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this profile? This will remove all saved data except your login credentials.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Profiles_Main;

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { usePartnerCheck } from "@/hooks/usePartnerCheck";
import { useToast } from "@/hooks/use-toast";
import { getEdgeFunctionError } from "@/lib/utils";
import PartnerLayout from "@/components/partner/PartnerLayout";
import { Search, UserPlus, Users, Upload, Trash2 } from "lucide-react";
import { format } from "date-fns";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface LinkedUser {
  id: string;
  profile_id: string;
  consent_given: boolean;
  linked_at: string;
  profile: {
    name: string;
    email: string | null;
    phone: string | null;
    carebag_id: string | null;
  };
}

interface SearchResult {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  carebag_id: string | null;
}

const PartnerUserSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { partner } = usePartnerCheck();
  const [linkedUsers, setLinkedUsers] = useState<LinkedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isLinking, setIsLinking] = useState(false);
  const [showOtpDialog, setShowOtpDialog] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [pendingProfileId, setPendingProfileId] = useState<string | null>(null);
  const [unlinkId, setUnlinkId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (partner?.id) {
      fetchLinkedUsers();
    }
  }, [partner?.id]);

  const fetchLinkedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from("partner_users")
        .select(`
          id,
          profile_id,
          consent_given,
          linked_at,
          profiles:profile_id (
            name,
            email,
            phone,
            carebag_id
          )
        `)
        .eq("partner_id", partner!.id)
        .order("linked_at", { ascending: false });

      if (error) throw error;

      const formattedData = data?.map((item: any) => ({
        id: item.id,
        profile_id: item.profile_id,
        consent_given: item.consent_given,
        linked_at: item.linked_at,
        profile: item.profiles,
      })) || [];

      setLinkedUsers(formattedData);
    } catch (error) {
      console.error("Error fetching linked users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResult(null);

    try {
      // Search by CareBag ID, email, or phone
      const query = searchQuery.trim().toUpperCase();
      
      const { data, error } = await supabase
        .from("profiles")
        .select("id, name, email, phone, carebag_id")
        .or(`carebag_id.eq.${query},email.ilike.%${searchQuery}%,phone.ilike.%${searchQuery}%`)
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        // Check if already linked
        const isLinked = linkedUsers.some((u) => u.profile_id === data.id);
        if (isLinked) {
          toast({
            title: "Already Linked",
            description: "This user is already linked to your account",
          });
        } else {
          setSearchResult(data);
        }
      } else {
        toast({
          title: "User Not Found",
          description: "No user found with the provided CareBag ID, email, or phone",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Search error:", error);
      toast({
        title: "Search Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRequestLink = async (profileId: string) => {
    try {
      setIsLinking(true);

      // Call the secure edge function to generate and send OTP
      const { data, error } = await supabase.functions.invoke('send-partner-otp', {
        body: {
          partnerId: partner!.id,
          profileId: profileId,
          method: 'email'
        }
      });

      if (error) {
        const message = await getEdgeFunctionError(error);
        throw new Error(message);
      }
      
      if (data?.error) {
        throw new Error(data.error);
      }

      const maskedEmail = data?.maskedEmail || "user's email";
      toast({
        title: "OTP Sent",
        description: `Verification code sent to ${maskedEmail}`,
      });

      setPendingProfileId(profileId);
      setShowOtpDialog(true);
    } catch (error: any) {
      console.error("Error requesting link:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to send OTP",
        variant: "destructive",
      });
    } finally {
      setIsLinking(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || !pendingProfileId) return;

    try {
      // Verify OTP
      const { data: otpRequest, error: otpError } = await supabase
        .from("partner_otp_requests")
        .select("*")
        .eq("partner_id", partner!.id)
        .eq("profile_id", pendingProfileId)
        .eq("otp_code", otpCode)
        .eq("verified", false)
        .gte("expires_at", new Date().toISOString())
        .maybeSingle();

      if (otpError) throw otpError;

      if (!otpRequest) {
        toast({
          title: "Invalid OTP",
          description: "The OTP is invalid or has expired",
          variant: "destructive",
        });
        return;
      }

      // Mark OTP as verified
      await supabase
        .from("partner_otp_requests")
        .update({ verified: true })
        .eq("id", otpRequest.id);

      // Create partner-user link
      const { error: linkError } = await supabase.from("partner_users").insert({
        partner_id: partner!.id,
        profile_id: pendingProfileId,
        consent_given: true,
        consent_timestamp: new Date().toISOString(),
      });

      if (linkError) throw linkError;

      toast({
        title: "User Linked",
        description: "User has been successfully linked to your account",
      });

      setShowOtpDialog(false);
      setOtpCode("");
      setPendingProfileId(null);
      setSearchResult(null);
      setSearchQuery("");
      fetchLinkedUsers();
    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleUnlink = async () => {
    if (!unlinkId) return;

    try {
      const { error } = await supabase
        .from("partner_users")
        .delete()
        .eq("id", unlinkId);

      if (error) throw error;

      toast({
        title: "User Unlinked",
        description: "User has been removed from your linked users",
      });

      setUnlinkId(null);
      fetchLinkedUsers();
    } catch (error: any) {
      console.error("Error unlinking user:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <PartnerLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Linked Users</h1>
          <p className="text-muted-foreground">
            Search and link users by CareBag ID, email, or phone number
          </p>
        </div>

        {/* Search Card */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search User
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <div className="flex-1">
                <Input
                  placeholder="Enter CareBag ID, email, or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="bg-muted"
                />
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? "Searching..." : "Search"}
              </Button>
            </div>

            {/* Search Result */}
            {searchResult && (
              <div className="mt-4 p-4 border border-border rounded-lg bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">{searchResult.name}</p>
                    <p className="text-sm text-muted-foreground">
                      CareBag ID: {searchResult.carebag_id || "N/A"}
                    </p>
                    {searchResult.email && (
                      <p className="text-sm text-muted-foreground">{searchResult.email}</p>
                    )}
                  </div>
                  <Button
                    onClick={() => handleRequestLink(searchResult.id)}
                    disabled={isLinking}
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    {isLinking ? "Requesting..." : "Request Link"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Linked Users List */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Linked Users ({linkedUsers.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground text-center py-8">Loading...</p>
            ) : linkedUsers.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No users linked yet. Search for users above to link them.
              </p>
            ) : (
              <div className="space-y-3">
                {linkedUsers.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-4 border border-border rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-foreground">{user.profile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        CareBag ID: {user.profile.carebag_id || "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Linked: {format(new Date(user.linked_at), "PP")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/partner/upload/${user.profile_id}`)}
                      >
                        <Upload className="h-4 w-4 mr-1" />
                        Upload
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setUnlinkId(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* OTP Dialog */}
      <Dialog open={showOtpDialog} onOpenChange={setShowOtpDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Verification Code</DialogTitle>
            <DialogDescription>
              Enter the 6-digit OTP sent to the user's email to complete the linking process.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="otp">OTP Code</Label>
            <Input
              id="otp"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="123456"
              maxLength={6}
              className="mt-2 text-center text-2xl tracking-widest"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowOtpDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleVerifyOtp} disabled={otpCode.length !== 6}>
              Verify & Link
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Unlink Confirmation */}
      <AlertDialog open={!!unlinkId} onOpenChange={() => setUnlinkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unlink User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to unlink this user? You will no longer be able to upload documents for them.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlink}>Unlink</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PartnerLayout>
  );
};

export default PartnerUserSearch;

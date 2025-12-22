import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, Send, ArrowLeft, Trash2, Ticket, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface Feedback {
  id: string;
  category: string;
  subject: string;
  message: string;
  rating: number | null;
  status: string;
  created_at: string;
  user_email: string;
  admin_response: string | null;
  admin_responded_at: string | null;
  ticket_code: string | null;
}

const AdminFeedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [statusUpdates, setStatusUpdates] = useState<Record<string, string>>({});
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedbackToDelete, setFeedbackToDelete] = useState<Feedback | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if user has super_admin role
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "super_admin");

      if (rolesError) throw rolesError;

      if (!roles || roles.length === 0) {
        toast({
          title: "Access Denied",
          description: "You don't have super admin privileges",
          variant: "destructive",
        });
        navigate("/admin/dashboard");
        return;
      }

      setIsSuperAdmin(true);
      fetchAllFeedback();
    } catch (error) {
      console.error("Error checking admin access:", error);
      navigate("/admin/dashboard");
    }
  };

  const fetchAllFeedback = async () => {
    try {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
      
      // Initialize status updates with current statuses
      const initialStatuses: Record<string, string> = {};
      data?.forEach(fb => {
        initialStatuses[fb.id] = fb.status;
      });
      setStatusUpdates(initialStatuses);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitResponse = async (feedbackId: string) => {
    const response = responses[feedbackId];
    const newStatus = statusUpdates[feedbackId];
    
    if (!response?.trim()) {
      toast({
        title: "Error",
        description: "Please enter a response",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("feedback")
        .update({
          admin_response: response,
          admin_responded_at: new Date().toISOString(),
          status: newStatus,
        })
        .eq("id", feedbackId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Response submitted successfully",
      });

      // Clear the response field and refresh
      setResponses(prev => ({ ...prev, [feedbackId]: "" }));
      fetchAllFeedback();
    } catch (error) {
      console.error("Error submitting response:", error);
      toast({
        title: "Error",
        description: "Failed to submit response",
        variant: "destructive",
      });
    }
  };

  const handleUpdateStatus = async (feedbackId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("feedback")
        .update({ status: newStatus })
        .eq("id", feedbackId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ticket marked as ${newStatus}`,
      });

      fetchAllFeedback();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteFeedback = async () => {
    if (!feedbackToDelete) return;

    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from("feedback")
        .delete()
        .eq("id", feedbackToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Ticket ${feedbackToDelete.ticket_code || feedbackToDelete.id.slice(0, 8)} deleted successfully`,
      });

      fetchAllFeedback();
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to delete feedback",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setFeedbackToDelete(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Open":
        return "bg-blue-500";
      case "Closed":
        return "bg-gray-500";
      case "Resolved":
        return "bg-green-500";
      default:
        return "bg-gray-500";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Open":
        return <AlertCircle className="w-3 h-3" />;
      case "Resolved":
        return <MessageSquare className="w-3 h-3" />;
      default:
        return null;
    }
  };

  if (!isSuperAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center bg-primary px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80 mr-2"
          onClick={() => navigate("/admin/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary-foreground">Feedback Management</h1>
      </header>

      <div className="p-4 max-w-6xl mx-auto">
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Ticket className="h-5 w-5" />
              Support Tickets
            </CardTitle>
            <CardDescription className="text-sm">
              View, respond to, and manage all user feedback tickets
            </CardDescription>
          </CardHeader>
        </Card>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">
            Loading feedback...
          </div>
        ) : feedbacks.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MessageSquare className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No feedback submissions yet</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Ticket Code Badge */}
                        <Badge variant="outline" className="font-mono text-xs bg-muted">
                          #{feedback.ticket_code || feedback.id.slice(0, 8).toUpperCase()}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {feedback.category}
                        </span>
                        <Badge className={`${getStatusColor(feedback.status)} text-xs flex items-center gap-1`}>
                          {getStatusIcon(feedback.status)}
                          {feedback.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground truncate">
                          from {feedback.user_email}
                        </span>
                      </div>
                      <CardTitle className="text-base">{feedback.subject}</CardTitle>
                      <CardDescription className="text-xs">
                        Submitted on {new Date(feedback.created_at).toLocaleString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {feedback.rating && (
                        <div className="flex gap-0.5 flex-shrink-0">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < feedback.rating!
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                        </div>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setFeedbackToDelete(feedback);
                          setDeleteDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">
                      User's Feedback:
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {feedback.message}
                    </p>
                  </div>

                  {feedback.admin_response && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-primary">
                          Your Previous Response:
                        </p>
                        {feedback.admin_responded_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.admin_responded_at).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-sm text-foreground whitespace-pre-wrap">
                          {feedback.admin_response}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-3 space-y-3">
                    {/* Quick Status Actions */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <label className="text-xs font-medium">Quick Actions:</label>
                      <Button
                        variant={feedback.status === "Open" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUpdateStatus(feedback.id, "Open")}
                      >
                        Open
                      </Button>
                      <Button
                        variant={feedback.status === "Closed" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUpdateStatus(feedback.id, "Closed")}
                      >
                        Close Ticket
                      </Button>
                      <Button
                        variant={feedback.status === "Resolved" ? "default" : "outline"}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => handleUpdateStatus(feedback.id, "Resolved")}
                      >
                        Mark Resolved
                      </Button>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="text-xs font-medium">Status:</label>
                      <Select
                        value={statusUpdates[feedback.id]}
                        onValueChange={(value) =>
                          setStatusUpdates(prev => ({ ...prev, [feedback.id]: value }))
                        }
                      >
                        <SelectTrigger className="w-32 h-9 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-50">
                          <SelectItem value="Open">Open</SelectItem>
                          <SelectItem value="Closed">Closed</SelectItem>
                          <SelectItem value="Resolved">Resolved</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Textarea
                      placeholder="Type your response to the user..."
                      value={responses[feedback.id] || ""}
                      onChange={(e) =>
                        setResponses(prev => ({ ...prev, [feedback.id]: e.target.value }))
                      }
                      className="min-h-20 text-sm"
                    />
                    <Button
                      onClick={() => handleSubmitResponse(feedback.id)}
                      className="w-full sm:w-auto h-10"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      Submit Response
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Feedback Ticket</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete ticket #{feedbackToDelete?.ticket_code || feedbackToDelete?.id.slice(0, 8)}? 
              This will permanently remove the feedback and all associated responses.
              <p className="mt-2 font-medium text-destructive">This action cannot be undone.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFeedback}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete Ticket"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminFeedback;

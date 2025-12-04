import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, ArrowLeft, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  admin_response: string | null;
  admin_responded_at: string | null;
}

const MyFeedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchFeedback();
  }, []);

  const fetchFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      setFeedbacks(data || []);
    } catch (error) {
      console.error("Error fetching feedback:", error);
      toast({
        title: "Error",
        description: "Failed to load feedback history",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "New":
        return "bg-blue-500";
      case "In Review":
        return "bg-yellow-500";
      case "Resolved":
        return "bg-green-500";
      case "Closed":
        return "bg-gray-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center justify-between bg-primary px-4 py-3">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-primary-foreground hover:bg-primary/80 mr-2"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-primary-foreground">My Feedback</h1>
        </div>
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80"
          onClick={() => navigate("/feedback")}
        >
          <Plus className="h-5 w-5" />
        </Button>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">My Feedback History</CardTitle>
            <CardDescription className="text-sm">
              View all your submitted feedback and their current status
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
              <p className="text-muted-foreground mb-4 text-sm">
                You haven't submitted any feedback yet
              </p>
              <Button onClick={() => navigate("/feedback")}>
                Submit Your First Feedback
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <MessageSquare className="w-4 h-4 flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">
                          {feedback.category}
                        </span>
                        <Badge className={`${getStatusColor(feedback.status)} text-xs`}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-base truncate">{feedback.subject}</CardTitle>
                      <CardDescription className="text-xs">
                        Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
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
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground mb-1">Your Feedback:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap line-clamp-3">
                      {feedback.message}
                    </p>
                  </div>
                  
                  {feedback.admin_response && (
                    <div className="border-t pt-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs font-medium text-primary">Admin Response:</p>
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
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyFeedback;

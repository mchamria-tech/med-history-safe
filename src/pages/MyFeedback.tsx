import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star } from "lucide-react";
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

  const getCategoryIcon = (category: string) => {
    return <MessageSquare className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            ← Back to Dashboard
          </Button>
          <Button onClick={() => navigate("/feedback")}>
            Submit New Feedback
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>My Feedback History</CardTitle>
            <CardDescription>
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
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground mb-4">
                You haven't submitted any feedback yet
              </p>
              <Button onClick={() => navigate("/feedback")}>
                Submit Your First Feedback
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {feedbacks.map((feedback) => (
              <Card key={feedback.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getCategoryIcon(feedback.category)}
                        <span className="text-sm text-muted-foreground">
                          {feedback.category}
                        </span>
                        <Badge className={getStatusColor(feedback.status)}>
                          {feedback.status}
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">{feedback.subject}</CardTitle>
                      <CardDescription>
                        Submitted on {new Date(feedback.created_at).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {feedback.rating && (
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
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
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Your Feedback:</p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {feedback.message}
                    </p>
                  </div>
                  
                  {feedback.admin_response && (
                    <div className="border-t pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-primary">Admin Response:</p>
                        {feedback.admin_responded_at && (
                          <p className="text-xs text-muted-foreground">
                            {new Date(feedback.admin_responded_at).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="bg-muted/50 rounded-lg p-3">
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

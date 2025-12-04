import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Send, History, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

const FeedbackHub = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }
    } catch (error) {
      console.error("Error checking auth:", error);
      navigate("/login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewSubmittedFeedback = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/login");
        return;
      }

      // Check if user has any feedback
      const { data, error } = await supabase
        .from("feedback")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        // User has feedback, show history
        navigate("/my-feedback");
      } else {
        // No feedback, redirect to submit new feedback
        toast({
          title: "No feedback found",
          description: "You haven't submitted any feedback yet. Let's create your first one!",
        });
        navigate("/feedback");
      }
    } catch (error) {
      console.error("Error checking feedback:", error);
      toast({
        title: "Error",
        description: "Failed to check feedback history",
        variant: "destructive",
      });
    }
  };

  const handleSubmitNewFeedback = () => {
    navigate("/feedback");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Compact Header */}
      <header className="flex w-full items-center bg-primary px-4 py-3">
        <Button 
          variant="ghost" 
          size="icon" 
          className="text-primary-foreground hover:bg-primary/80 mr-2"
          onClick={() => navigate("/dashboard")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-primary-foreground">Feedback Center</h1>
      </header>

      <div className="p-4 max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <MessageSquare className="w-12 h-12 text-primary" />
            </div>
            <CardTitle className="text-2xl">Feedback Center</CardTitle>
            <CardDescription>
              Share your thoughts or view your feedback history
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
          {/* View Submitted Feedback */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
            onClick={handleViewSubmittedFeedback}
          >
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                  <History className="w-8 h-8 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">View Submitted Feedback</h3>
                <p className="text-xs text-muted-foreground">
                  Check your feedback history and admin responses
                </p>
              </div>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground">
                View History
              </Button>
            </CardContent>
          </Card>

          {/* Submit New Feedback */}
          <Card 
            className="cursor-pointer transition-all hover:shadow-lg hover:border-primary group"
            onClick={handleSubmitNewFeedback}
          >
            <CardContent className="pt-6 pb-6 text-center space-y-3">
              <div className="flex justify-center">
                <div className="p-3 rounded-full bg-accent/10 group-hover:bg-accent/20 transition-colors">
                  <Send className="w-8 h-8 text-accent-foreground" />
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">Submit New Feedback</h3>
                <p className="text-xs text-muted-foreground">
                  Share your ideas, report issues, or give us feedback
                </p>
              </div>
              <Button className="w-full group-hover:shadow-lg">
                Submit Feedback
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default FeedbackHub;

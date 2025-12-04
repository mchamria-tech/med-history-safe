import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, Palette, Bug, Lightbulb, MessageCircle, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { themes } from "@/lib/themes";

interface FeedbackCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
}

const categories: FeedbackCategory[] = [
  {
    id: "Bug Report",
    label: "Bug Report",
    icon: <Bug className="w-4 h-4" />,
    placeholder: "Describe any bugs or issues you've encountered...",
  },
  {
    id: "Feature Request",
    label: "Feature Request",
    icon: <Lightbulb className="w-4 h-4" />,
    placeholder: "What new features would you like to see?",
  },
  {
    id: "General Feedback",
    label: "General Feedback",
    icon: <MessageCircle className="w-4 h-4" />,
    placeholder: "Share any general thoughts or comments...",
  },
  {
    id: "User Experience",
    label: "User Experience",
    icon: <UserCheck className="w-4 h-4" />,
    placeholder: "How can we improve the app experience?",
  },
  {
    id: "Theme Preference",
    label: "Theme Preference",
    icon: <Palette className="w-4 h-4" />,
    placeholder: "Tell us why you prefer this theme...",
  },
];

const Feedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [preferredTheme, setPreferredTheme] = useState<string>("");
  const [feedbackEntries, setFeedbackEntries] = useState<Record<string, string>>({
    "Bug Report": "",
    "Feature Request": "",
    "General Feedback": "",
    "User Experience": "",
    "Theme Preference": "",
  });

  const handleFeedbackChange = (categoryId: string, value: string) => {
    setFeedbackEntries((prev) => ({ ...prev, [categoryId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Authentication required",
          description: "Please log in to submit feedback",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      // Collect non-empty feedback entries
      const filledEntries = Object.entries(feedbackEntries).filter(
        ([_, value]) => value.trim().length >= 10
      );

      if (filledEntries.length === 0) {
        toast({
          title: "No feedback provided",
          description: "Please fill in at least one feedback section (minimum 10 characters)",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Submit each non-empty feedback as a separate entry
      for (const [category, message] of filledEntries) {
        let finalMessage = message;
        
        // Add theme preference to Theme Preference category
        if (category === "Theme Preference" && preferredTheme) {
          const selectedTheme = themes.find(t => t.id === preferredTheme);
          if (selectedTheme) {
            finalMessage = `[Preferred Theme: ${selectedTheme.name}]\n\n${message}`;
          }
        }

        const { error } = await supabase.from("feedback").insert({
          user_id: user.id,
          user_email: user.email || "",
          category: category,
          subject: `${category} Feedback`,
          message: finalMessage,
          rating: rating,
          page_url: window.location.href,
          status: "New",
        });

        if (error) throw error;
      }

      toast({
        title: "Feedback submitted!",
        description: `Thank you! ${filledEntries.length} feedback item(s) submitted.`,
      });

      // Reset form
      setFeedbackEntries({
        "Bug Report": "",
        "Feature Request": "",
        "General Feedback": "",
        "User Experience": "",
        "Theme Preference": "",
      });
      setRating(null);
      setPreferredTheme("");
      
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasThemeFeedback = feedbackEntries["Theme Preference"].trim().length > 0;

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/dashboard")}
          className="mb-6"
        >
          ← Back to Dashboard
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-primary" />
              <CardTitle>Send Feedback</CardTitle>
            </div>
            <CardDescription>
              Help us improve CareBag by sharing your thoughts. Fill in any sections relevant to your feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {categories.map((category) => (
                <div key={category.id} className="space-y-2">
                  <Label htmlFor={category.id} className="flex items-center gap-2 text-base">
                    {category.icon}
                    {category.label}
                  </Label>
                  <Textarea
                    id={category.id}
                    value={feedbackEntries[category.id]}
                    onChange={(e) => handleFeedbackChange(category.id, e.target.value)}
                    placeholder={category.placeholder}
                    className="min-h-[100px]"
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground">
                    {feedbackEntries[category.id].length}/1000 characters
                  </p>

                  {/* Theme selector appears when Theme Preference has content */}
                  {category.id === "Theme Preference" && hasThemeFeedback && (
                    <Card className="border-2 border-primary/20 bg-primary/5 mt-3">
                      <CardHeader className="pb-3">
                        <div className="flex items-center gap-2">
                          <Palette className="w-5 h-5 text-primary" />
                          <CardTitle className="text-lg">Choose Your Preferred Theme</CardTitle>
                        </div>
                        <CardDescription>
                          Your vote helps us decide the final look of CareBag!
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <RadioGroup
                          value={preferredTheme}
                          onValueChange={setPreferredTheme}
                          className="grid gap-3"
                        >
                          {themes.map((theme) => (
                            <div key={theme.id} className="relative">
                              <RadioGroupItem
                                value={theme.id}
                                id={theme.id}
                                className="peer sr-only"
                              />
                              <Label
                                htmlFor={theme.id}
                                className="flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all hover:bg-accent/10 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/10"
                              >
                                <div className="flex gap-1 shrink-0">
                                  <div
                                    className="w-6 h-6 rounded-full border border-border"
                                    style={{ backgroundColor: theme.colors.primary }}
                                    title="Primary"
                                  />
                                  <div
                                    className="w-6 h-6 rounded-full border border-border"
                                    style={{ backgroundColor: theme.colors.accent }}
                                    title="Accent"
                                  />
                                  <div
                                    className="w-6 h-6 rounded-full border border-border"
                                    style={{ backgroundColor: theme.colors.background }}
                                    title="Background"
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium">{theme.name}</p>
                                  <p className="text-sm text-muted-foreground truncate">
                                    {theme.description}
                                  </p>
                                </div>
                              </Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}

              <div className="space-y-2 pt-4 border-t">
                <Label>Overall Rating (Optional)</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="transition-colors"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          rating && star <= rating
                            ? "fill-primary text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  How satisfied are you with CareBag overall?
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? "Submitting..." : "Submit Feedback"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Feedback;

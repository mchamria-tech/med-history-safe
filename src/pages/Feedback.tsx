import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageSquare, Star, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { z } from "zod";
import { themes } from "@/lib/themes";

const feedbackSchema = z.object({
  category: z.enum(["Bug Report", "Feature Request", "General Feedback", "User Experience", "Theme Preference"], {
    required_error: "Please select a category",
  }),
  subject: z.string().trim().min(5, "Subject must be at least 5 characters").max(100, "Subject must be less than 100 characters"),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
  rating: z.number().min(1).max(5).optional(),
  preferredTheme: z.string().optional(),
});

type FeedbackForm = z.infer<typeof feedbackSchema>;

const Feedback = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rating, setRating] = useState<number | null>(null);
  const [preferredTheme, setPreferredTheme] = useState<string>("");
  const [formData, setFormData] = useState({
    category: "",
    subject: "",
    message: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Build message with theme preference if selected
      let finalMessage = formData.message;
      if (preferredTheme) {
        const selectedTheme = themes.find(t => t.id === preferredTheme);
        if (selectedTheme) {
          finalMessage = `[Preferred Theme: ${selectedTheme.name}]\n\n${formData.message}`;
        }
      }

      const validatedData = feedbackSchema.parse({
        ...formData,
        message: finalMessage,
        rating: rating ?? undefined,
        preferredTheme: preferredTheme || undefined,
      });

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

      const { error } = await supabase.from("feedback").insert({
        user_id: user.id,
        user_email: user.email || "",
        category: validatedData.category,
        subject: validatedData.subject,
        message: validatedData.message,
        rating: validatedData.rating,
        page_url: window.location.href,
        status: "New",
      });

      if (error) throw error;

      toast({
        title: "Feedback submitted!",
        description: "Thank you for your feedback. We'll review it soon.",
      });

      setFormData({ category: "", subject: "", message: "" });
      setRating(null);
      setPreferredTheme("");
      
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast({
          title: "Validation Error",
          description: error.errors[0].message,
          variant: "destructive",
        });
      } else {
        console.error("Error submitting feedback:", error);
        toast({
          title: "Error",
          description: "Failed to submit feedback. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isThemeCategory = formData.category === "Theme Preference";

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
              Help us improve CareBag by sharing your thoughts, reporting issues, or suggesting new features.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    setFormData({ ...formData, category: value });
                    if (value === "Theme Preference" && !formData.subject) {
                      setFormData(prev => ({ ...prev, category: value, subject: "My preferred app theme" }));
                    }
                  }}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bug Report">Bug Report</SelectItem>
                    <SelectItem value="Feature Request">Feature Request</SelectItem>
                    <SelectItem value="General Feedback">General Feedback</SelectItem>
                    <SelectItem value="User Experience">User Experience</SelectItem>
                    <SelectItem value="Theme Preference">
                      <span className="flex items-center gap-2">
                        <Palette className="w-4 h-4" />
                        Theme Preference
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Preference Section - Prominently displayed when category is selected */}
              {isThemeCategory && (
                <Card className="border-2 border-primary/20 bg-primary/5">
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
                            {/* Color Preview */}
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
                    {!preferredTheme && (
                      <p className="text-sm text-destructive mt-3">
                        Please select a theme to continue
                      </p>
                    )}
                  </CardContent>
                </Card>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  placeholder={isThemeCategory ? "E.g., My preferred app theme" : "Brief summary of your feedback"}
                  maxLength={100}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.subject.length}/100 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">
                  {isThemeCategory ? "Why do you prefer this theme? *" : "Message *"}
                </Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder={
                    isThemeCategory 
                      ? "Tell us why you like this theme and any other design suggestions..."
                      : "Please provide detailed information about your feedback..."
                  }
                  className="min-h-[150px]"
                  maxLength={1000}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  {formData.message.length}/1000 characters
                </p>
              </div>

              <div className="space-y-2">
                <Label>Rating (Optional)</Label>
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
                  disabled={isSubmitting || (isThemeCategory && !preferredTheme)}
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

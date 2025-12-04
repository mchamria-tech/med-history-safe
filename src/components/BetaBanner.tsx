import { useState, useEffect } from "react";
import { X, FlaskConical } from "lucide-react";
import { Button } from "@/components/ui/button";

const BetaBanner = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("beta-banner-dismissed");
    if (!dismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem("beta-banner-dismissed", "true");
  };

  if (!isVisible) return null;

  return (
    <div className="bg-amber-500/90 text-amber-950 px-4 py-2 text-sm">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-4 w-4 flex-shrink-0" />
          <p>
            <span className="font-semibold">Beta Version:</span> Document uploads limited to 5 per profile. 
            Your feedback helps us improve!
          </p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:bg-amber-600/20 text-amber-950"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

export default BetaBanner;

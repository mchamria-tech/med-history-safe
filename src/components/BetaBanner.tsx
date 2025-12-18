import { useState, useEffect } from "react";
import { X } from "lucide-react";
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
    <div className="bg-muted border-b border-border px-4 py-2 text-xs">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        <p className="text-muted-foreground">
          <span className="font-medium text-foreground">Beta</span> · Document uploads limited to 5 per profile
        </p>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 rounded-lg"
          onClick={handleDismiss}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
};

export default BetaBanner;

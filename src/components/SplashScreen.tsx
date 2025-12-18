import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import careBagLogo from "@/assets/carebag-logo-redesign.png";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: Logo appears with scale animation (0ms)
    // Stage 1: Logo fully visible, pulse effect (1000ms)
    // Stage 2: Logo shrinks to corner (4000ms)
    // Stage 3: Navigate to dashboard (5000ms)

    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 4000),
      setTimeout(() => navigate("/dashboard"), 5000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      {/* Logo container with animations */}
      <div
        className={`transition-all duration-700 ease-out ${
          stage === 0 
            ? "scale-0 opacity-0" 
            : stage === 1 
              ? "scale-100 opacity-100" 
              : "scale-[0.3125] -translate-x-[38vw] -translate-y-[42vh] opacity-100"
        }`}
        style={{
          animation: stage === 0 ? "none" : stage === 1 ? "logo-entrance 0.8s ease-out forwards" : undefined,
        }}
      >
        {/* Reveal mask container */}
        <div 
          className="relative overflow-hidden"
          style={{
            clipPath: stage >= 1 
              ? "inset(0 0 0 0)" 
              : "inset(0 100% 0 0)",
            transition: "clip-path 2s ease-out",
          }}
        >
          <img
            src={careBagLogo}
            alt="CareBag Logo"
            className={`h-32 w-auto object-contain ${
              stage === 1 ? "animate-heart-pulse" : ""
            }`}
          />
        </div>
      </div>

      {/* Loading text */}
      <div
        className={`absolute bottom-20 transition-opacity duration-500 ${
          stage >= 2 ? "opacity-0" : "opacity-100"
        }`}
      >
        <p className="text-muted-foreground text-sm animate-pulse">
          Loading your health records...
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
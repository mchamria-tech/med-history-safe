import { useEffect, useState } from "react";
import careBagLogo from "@/assets/carebag-logo-redesign.png";

interface SplashOverlayProps {
  onComplete: () => void;
}

const SplashOverlay = ({ onComplete }: SplashOverlayProps) => {
  const [stage, setStage] = useState(0);
  const [revealRadius, setRevealRadius] = useState(0);

  useEffect(() => {
    // Stage 0: Logo appears with scale animation (0ms)
    // Stage 1: Logo fully visible, pulse effect (1000ms)
    // Stage 2: Logo shrinks to corner (4000ms)
    // Stage 3: Circle reveal starts (4700ms)
    // Stage 4: Complete, call onComplete (6000ms)

    const timers = [
      setTimeout(() => setStage(1), 1000),
      setTimeout(() => setStage(2), 4000),
      setTimeout(() => setStage(3), 4700),
      setTimeout(() => {
        setStage(4);
        onComplete();
      }, 6000),
    ];

    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  // Animate the reveal radius when stage 3 starts
  useEffect(() => {
    if (stage === 3) {
      // Calculate max radius needed to cover screen from logo position
      const maxRadius = Math.sqrt(
        Math.pow(window.innerWidth, 2) + Math.pow(window.innerHeight, 2)
      );
      
      // Animate radius expansion
      let startTime: number;
      const duration = 1200; // 1.2 seconds
      
      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        
        // Ease out cubic for smooth deceleration
        const eased = 1 - Math.pow(1 - progress, 3);
        setRevealRadius(eased * maxRadius);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      requestAnimationFrame(animate);
    }
  }, [stage]);

  // Logo position in header: accounts for beta banner (~32px) + header py-3 (12px) + left-4 (16px)
  const logoFinalX = 36; // Approximate center of logo in final position
  const logoFinalY = 56; // 32px banner + 12px header padding + ~12px to center logo

  return (
    <div 
      className={`fixed inset-0 z-[100] transition-opacity duration-500 ${
        stage >= 4 ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* White overlay with circular cutout to reveal dashboard */}
      <div 
        className="absolute inset-0 bg-background"
        style={{
          clipPath: stage >= 3 
            ? `polygon(
                0 0, 
                100% 0, 
                100% 100%, 
                0 100%, 
                0 0,
                ${logoFinalX}px ${logoFinalY - revealRadius}px,
                ${logoFinalX - revealRadius}px ${logoFinalY}px,
                ${logoFinalX}px ${logoFinalY + revealRadius}px,
                ${logoFinalX + revealRadius}px ${logoFinalY}px,
                ${logoFinalX}px ${logoFinalY - revealRadius}px
              )`
            : undefined,
        }}
      />

      {/* Alternative: Simple expanding circle mask */}
      {stage < 3 && (
        <div className="absolute inset-0 bg-background" />
      )}
      
      {stage >= 3 && (
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle ${revealRadius}px at ${logoFinalX}px ${logoFinalY}px, transparent ${revealRadius}px, hsl(var(--background)) ${revealRadius}px)`,
          }}
        />
      )}

      {/* Logo animation container */}
      <div
        className={`fixed transition-all duration-700 ease-out ${
          stage === 0 
            ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-0 opacity-0" 
            : stage === 1 
              ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 scale-100 opacity-100" 
              : "top-[44px] left-4 translate-x-0 translate-y-0 scale-100 opacity-100"
        }`}
        style={{
          animation: stage === 1 ? "logo-entrance 0.8s ease-out forwards" : undefined,
          zIndex: 101,
        }}
      >
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
            className={`object-contain transition-all duration-700 ${
              stage >= 2 ? "h-10" : "h-32"
            } ${stage === 1 ? "animate-heart-pulse" : ""}`}
          />
        </div>
      </div>

      {/* Loading text */}
      <div
        className={`fixed bottom-20 left-1/2 -translate-x-1/2 transition-opacity duration-500 z-[102] ${
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

export default SplashOverlay;
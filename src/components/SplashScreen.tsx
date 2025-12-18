import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const SplashScreen = () => {
  const navigate = useNavigate();
  const [stage, setStage] = useState(0);

  useEffect(() => {
    // Stage 0: Initial (folder appears)
    // Stage 1: ECG line draws (500ms delay)
    // Stage 2: Heart appears (2000ms delay)
    // Stage 3: Logo shrinks (2500ms delay)
    // Stage 4: Navigate to dashboard (3500ms delay)

    const timers = [
      setTimeout(() => setStage(1), 500),
      setTimeout(() => setStage(2), 2000),
      setTimeout(() => setStage(3), 2500),
      setTimeout(() => navigate("/dashboard"), 3500),
    ];

    return () => timers.forEach(clearTimeout);
  }, [navigate]);

  return (
    <div className="fixed inset-0 bg-background flex items-center justify-center z-50">
      <div
        className={`transition-all duration-700 ease-out ${
          stage >= 3 
            ? "scale-[0.15] -translate-x-[45vw] -translate-y-[40vh] opacity-90" 
            : "scale-100 translate-x-0 translate-y-0"
        }`}
      >
        <svg
          viewBox="0 0 400 200"
          className="w-80 h-40"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Folder/Documents - Stage 0 */}
          <g
            className={`transition-all duration-500 ${
              stage >= 0 ? "opacity-100 scale-100" : "opacity-0 scale-90"
            }`}
            style={{ transformOrigin: "center" }}
          >
            {/* Back document */}
            <path
              d="M140 40 L140 160 L200 160 L200 40 Z"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Middle document */}
            <path
              d="M150 50 L150 150 L210 150 L210 50 Z"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {/* Front document (folder shape) */}
            <path
              d="M160 60 L160 140 L220 140 L220 60 L180 60 L175 50 L160 50 Z"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>

          {/* ECG Line - Stage 1 */}
          <path
            d="M20 100 L80 100 L95 70 L110 130 L125 100 L160 100 L220 100 L250 100 L265 70 L280 130 L295 100 L340 100"
            fill="none"
            stroke="hsl(var(--accent))"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-all ${stage >= 1 ? "animate-draw-ecg" : ""}`}
            style={{
              strokeDasharray: 500,
              strokeDashoffset: stage >= 1 ? 0 : 500,
            }}
          />

          {/* Heart - Stage 2 */}
          <g
            className={`transition-all duration-500 ${
              stage >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-50"
            }`}
            style={{ transformOrigin: "360px 100px" }}
          >
            <path
              d="M360 90 C350 75 335 80 340 95 C342 100 360 115 360 115 C360 115 378 100 380 95 C385 80 370 75 360 90 Z"
              fill="hsl(var(--accent))"
              stroke="hsl(var(--accent))"
              strokeWidth="2"
              className={stage >= 2 ? "animate-heart-pulse" : ""}
            />
          </g>
        </svg>
      </div>

      {/* Loading text */}
      <div
        className={`absolute bottom-20 transition-opacity duration-300 ${
          stage >= 3 ? "opacity-0" : "opacity-100"
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
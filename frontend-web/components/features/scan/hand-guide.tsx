"use client";

type Hand = "right" | "left";
type Finger = "thumb" | "index" | "middle" | "ring" | "pinky";

interface HandGuideProps {
  hand: Hand;
  highlightFinger: Finger;
  className?: string;
  animate?: boolean;
}

export function HandGuide({
  hand,
  highlightFinger,
  className = "w-88 h-94",
  animate = true,
}: HandGuideProps) {
  const isLeft = hand === "left";

  return (
    <div className={`relative ${className} mx-auto`}>
      <div className={`relative w-full h-full ${isLeft ? "scale-x-[-1]" : ""}`}>
        <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-lg">
          <defs>
            <linearGradient id="palmGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f5f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#e2e8f0" stopOpacity="0.4" />
            </linearGradient>
            <linearGradient id="activeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="1" />
              <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="inactiveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#64748b" stopOpacity="0.2" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="strongGlow">
              <feGaussianBlur stdDeviation="6" result="coloredBlur" />
              <feDropShadow
                dx="0"
                dy="0"
                stdDeviation="8"
                floodColor="#3b82f6"
                floodOpacity="0.8"
              />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <path
            d="M60 100 Q65 85 80 80 Q120 75 140 80 Q155 85 160 100 L160 170 Q160 185 140 195 L80 195 Q60 185 60 170 Z"
            fill="url(#palmGradient)"
            stroke="#cbd5e1"
            strokeWidth="1.5"
            className="transition-all duration-300"
          />

          <ellipse
            cx="45"
            cy="120"
            rx="12"
            ry="35"
            fill={
              highlightFinger === "thumb"
                ? "url(#activeGradient)"
                : "url(#inactiveGradient)"
            }
            stroke={highlightFinger === "thumb" ? "#1d4ed8" : "#94a3b8"}
            strokeWidth={highlightFinger === "thumb" ? "3" : "2"}
            transform="rotate(-20 45 120)"
            filter={highlightFinger === "thumb" ? "url(#strongGlow)" : "none"}
            className={`transition-all duration-500 ease-out ${
              highlightFinger === "thumb" && animate ? "animate-pulse" : ""
            }`}
          />

          <ellipse
            cx="85"
            cy="55"
            rx="12"
            ry="40"
            fill={
              highlightFinger === "index"
                ? "url(#activeGradient)"
                : "url(#inactiveGradient)"
            }
            stroke={highlightFinger === "index" ? "#1d4ed8" : "#94a3b8"}
            strokeWidth={highlightFinger === "index" ? "3" : "2"}
            filter={highlightFinger === "index" ? "url(#strongGlow)" : "none"}
            className={`transition-all duration-500 ease-out ${
              highlightFinger === "index" && animate ? "animate-pulse" : ""
            }`}
          />

          <ellipse
            cx="110"
            cy="45"
            rx="12"
            ry="45"
            fill={
              highlightFinger === "middle"
                ? "url(#activeGradient)"
                : "url(#inactiveGradient)"
            }
            stroke={highlightFinger === "middle" ? "#1d4ed8" : "#94a3b8"}
            strokeWidth={highlightFinger === "middle" ? "3" : "2"}
            filter={highlightFinger === "middle" ? "url(#strongGlow)" : "none"}
            className={`transition-all duration-500 ease-out ${
              highlightFinger === "middle" && animate ? "animate-pulse" : ""
            }`}
          />

          <ellipse
            cx="135"
            cy="50"
            rx="12"
            ry="42"
            fill={
              highlightFinger === "ring"
                ? "url(#activeGradient)"
                : "url(#inactiveGradient)"
            }
            stroke={highlightFinger === "ring" ? "#1d4ed8" : "#94a3b8"}
            strokeWidth={highlightFinger === "ring" ? "3" : "2"}
            filter={highlightFinger === "ring" ? "url(#strongGlow)" : "none"}
            className={`transition-all duration-500 ease-out ${
              highlightFinger === "ring" && animate ? "animate-pulse" : ""
            }`}
          />

          <ellipse
            cx="155"
            cy="65"
            rx="10"
            ry="35"
            fill={
              highlightFinger === "pinky"
                ? "url(#activeGradient)"
                : "url(#inactiveGradient)"
            }
            stroke={highlightFinger === "pinky" ? "#1d4ed8" : "#94a3b8"}
            strokeWidth={highlightFinger === "pinky" ? "3" : "2"}
            filter={highlightFinger === "pinky" ? "url(#strongGlow)" : "none"}
            className={`transition-all duration-500 ease-out ${
              highlightFinger === "pinky" && animate ? "animate-pulse" : ""
            }`}
          />

          {animate && (
            <circle
              cx={
                highlightFinger === "thumb"
                  ? 45
                  : highlightFinger === "index"
                    ? 85
                    : highlightFinger === "middle"
                      ? 110
                      : highlightFinger === "ring"
                        ? 135
                        : 155
              }
              cy={
                highlightFinger === "thumb"
                  ? 120
                  : highlightFinger === "index"
                    ? 55
                    : highlightFinger === "middle"
                      ? 45
                      : highlightFinger === "ring"
                        ? 50
                        : 65
              }
            />
          )}
        </svg>
      </div>
    </div>
  );
}

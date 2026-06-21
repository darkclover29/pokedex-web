import React from 'react';

interface RetroBackgroundProps {
  className?: string;
  style?: React.CSSProperties;
}

export const RetroBackground = React.forwardRef<HTMLDivElement, RetroBackgroundProps>(
  ({ className = '', style }, ref) => {
    return (
      <div
        ref={ref}
        className={`retro-bg-container ${className}`}
        style={{
          position: 'fixed',
          inset: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'lighten',
          ...style
        }}
      >
        <svg
          viewBox="0 0 1920 1080"
          preserveAspectRatio="xMidYMid slice"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Cyber grid / CRT lines background */}
          <defs>
            <pattern id="dot-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.2" fill="rgba(255, 255, 255, 0.05)" />
            </pattern>
          </defs>
          <rect width="1920" height="1080" fill="url(#dot-grid)" />

          {/* Technical Grid lines */}
          <path d="M 0,540 H 1920 M 960,0 V 1080" stroke="rgba(251, 191, 36, 0.02)" strokeWidth="1" />
          <circle cx="960" cy="540" r="450" fill="none" stroke="rgba(6, 182, 212, 0.02)" strokeWidth="1" strokeDasharray="5,5" />
          <circle cx="960" cy="540" r="350" fill="none" stroke="rgba(6, 182, 212, 0.04)" strokeWidth="1" />

          {/* Large Spinning-style PokeBall Wireframe in Center */}
          <g transform="translate(960, 540) rotate(15)" stroke="rgba(6, 182, 212, 0.25)" strokeWidth="2.5" fill="none">
            <circle r="220" />
            <circle r="216" stroke="rgba(236, 72, 153, 0.2)" strokeWidth="1" />
            <path d="M -220,0 H -55 M 55,0 H 220" />
            <circle r="55" stroke="rgba(251, 191, 36, 0.4)" fill="#0d0d11" />
            <circle r="25" stroke="rgba(6, 182, 212, 0.4)" />
            {/* Tech details */}
            <path d="M -150,-150 L -120,-120" stroke="rgba(236, 72, 153, 0.2)" />
            <path d="M 150,-150 L 120,-120" stroke="rgba(236, 72, 153, 0.2)" />
            <path d="M -150,150 L -120,120" stroke="rgba(236, 72, 153, 0.2)" />
            <path d="M 150,150 L 120,120" stroke="rgba(236, 72, 153, 0.2)" />
          </g>

          {/* Classic Gameboy Battle HUD - Top Left (Enemy) */}
          <g transform="translate(180, 160)" fill="none" stroke="rgba(236, 72, 153, 0.4)" strokeWidth="2">
            {/* Border frame */}
            <path d="M 0,0 H 350 V 75 H 10 L 0,65 Z" fill="rgba(255, 255, 255, 0.01)" />
            {/* Text details */}
            <text x="20" y="32" fill="#fbbf24" fontFamily="'Press Start 2P', monospace" fontSize="13px" stroke="none">
              PIKACHU
            </text>
            <text x="230" y="32" fill="#a7f3d0" fontFamily="'Press Start 2P', monospace" fontSize="13px" stroke="none">
              Lv 81
            </text>
            {/* HP Bar background */}
            <rect x="20" y="45" width="200" height="8" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* HP Fill */}
            <rect x="20" y="45" width="160" height="8" rx="2" fill="#10b981" stroke="none" />
            <text x="230" y="53" fill="rgba(255,255,255,0.5)" fontFamily="'Press Start 2P', monospace" fontSize="9px" stroke="none">
              HP
            </text>
          </g>

          {/* Classic Gameboy Battle HUD - Bottom Right (Player) */}
          <g transform="translate(1380, 580)" fill="none" stroke="rgba(6, 182, 212, 0.4)" strokeWidth="2">
            {/* Border frame */}
            <path d="M 0,0 H 350 V 90 H 10 L 0,80 Z" fill="rgba(255, 255, 255, 0.01)" />
            {/* Text details */}
            <text x="20" y="32" fill="#fbbf24" fontFamily="'Press Start 2P', monospace" fontSize="13px" stroke="none">
              CHARIZARD
            </text>
            <text x="230" y="32" fill="#a7f3d0" fontFamily="'Press Start 2P', monospace" fontSize="13px" stroke="none">
              Lv 100
            </text>
            {/* HP Bar background */}
            <rect x="20" y="45" width="200" height="8" rx="2" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* HP Fill */}
            <rect x="20" y="45" width="200" height="8" rx="2" fill="#10b981" stroke="none" />
            <text x="230" y="53" fill="rgba(255,255,255,0.5)" fontFamily="'Press Start 2P', monospace" fontSize="9px" stroke="none">
              HP
            </text>
            {/* HP numerical */}
            <text x="20" y="75" fill="rgba(255,255,255,0.7)" fontFamily="'Press Start 2P', monospace" fontSize="11px" stroke="none">
              360/360
            </text>
          </g>

          {/* Retro Pikachu Pixel Silhouette Outline (Top-Right Area) */}
          <g transform="translate(1420, 140) scale(1.6)" stroke="rgba(251, 191, 36, 0.3)" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round">
            {/* Highly stylized retro silhouette vector of Pikachu */}
            <path d="M 20,40 Q 5,10 15,5 Q 25,5 30,22" /> {/* Left Ear */}
            <path d="M 60,40 Q 75,10 65,5 Q 55,5 50,22" /> {/* Right Ear */}
            <path d="M 30,22 Q 40,18 50,22" /> {/* Head Top */}
            <path d="M 20,40 C 20,25 60,25 60,40" /> {/* Face Frame */}
            <path d="M 20,40 C 15,45 15,55 25,60 C 27,62 53,62 55,60 C 65,55 65,45 60,40" /> {/* Face Lower */}
            <path d="M 23,48 Q 25,50 27,48" strokeWidth="1.5" /> {/* Left Eye */}
            <path d="M 53,48 Q 55,50 57,48" strokeWidth="1.5" /> {/* Right Eye */}
            <path d="M 39,52 H 41" strokeWidth="1.5" /> {/* Nose */}
            <path d="M 35,55 Q 40,58 45,55" strokeWidth="1.5" /> {/* Mouth */}
            <path d="M 12,48 C 10,48 10,53 12,53 Z" fill="rgba(236,72,153,0.15)" strokeWidth="1.5" /> {/* Left Cheek */}
            <path d="M 68,48 C 70,48 70,53 68,53 Z" fill="rgba(236,72,153,0.15)" strokeWidth="1.5" /> {/* Right Cheek */}
          </g>

          {/* Retro Ash/Red Sprite Silhouette (Bottom-Left Area) */}
          <g transform="translate(180, 520) scale(1.8)" stroke="rgba(167, 243, 208, 0.3)" strokeWidth="2.5" fill="none">
            {/* Back silhouette of Red (the classic player character) throwing a Pokeball */}
            <path d="M 40,110 C 25,95 25,70 30,60 C 35,50 55,50 60,60 C 65,70 65,95 50,110 Z" fill="rgba(255,255,255,0.01)" /> {/* Body torso */}
            <path d="M 38,60 C 36,45 54,45 52,60 Z" /> {/* Cap head back */}
            <path d="M 33,52 H 23" /> {/* Visor brim */}
            {/* Throwing arm */}
            <path d="M 60,70 Q 75,55 70,45 Q 65,35 55,42" />
            <circle cx="70" cy="45" r="5" fill="rgba(236, 72, 153, 0.4)" stroke="rgba(236, 72, 153, 0.8)" strokeWidth="1.5" /> {/* Poke Ball in hand! */}
          </g>

          {/* Classic Bottom Battle dialog Box */}
          <g transform="translate(260, 830)" fill="rgba(13, 13, 17, 0.75)" stroke="rgba(6, 182, 212, 0.35)" strokeWidth="3">
            {/* Outer box border */}
            <rect width="1400" height="170" rx="16" />
            {/* Inner decorative double-line border */}
            <rect x="6" y="6" width="1388" height="158" rx="10" fill="none" stroke="rgba(6, 182, 212, 0.15)" strokeWidth="1.5" />
            
            {/* Dialog Text */}
            <text x="40" y="90" fill="#f8fafc" fontFamily="'Press Start 2P', monospace" fontSize="18px" stroke="none">
              A wild PIKACHU appeared!
            </text>
            <text x="40" y="130" fill="#a7f3d0" fontFamily="'Press Start 2P', monospace" fontSize="14px" stroke="none">
              Go! CHARIZARD!
            </text>

            {/* Menu Options */}
            <g transform="translate(1000, 30)" stroke="none" fill="none">
              {/* FIGHT BAG POKEMON RUN */}
              <text x="50" y="45" fill="#f8fafc" fontFamily="'Press Start 2P', monospace" fontSize="16px">
                ▶ FIGHT
              </text>
              <text x="240" y="45" fill="rgba(248, 250, 252, 0.5)" fontFamily="'Press Start 2P', monospace" fontSize="16px">
                BAG
              </text>
              <text x="50" y="95" fill="rgba(248, 250, 252, 0.5)" fontFamily="'Press Start 2P', monospace" fontSize="16px">
                POKéMON
              </text>
              <text x="240" y="95" fill="rgba(248, 250, 252, 0.5)" fontFamily="'Press Start 2P', monospace" fontSize="16px">
                RUN
              </text>
            </g>
          </g>
        </svg>
      </div>
    );
  }
);

RetroBackground.displayName = 'RetroBackground';

export default RetroBackground;

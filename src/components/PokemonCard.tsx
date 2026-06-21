import { useRef, useState } from "react";
import gsap from "gsap";
import type { PokemonBase } from "@/services/pokeapi";
import { DecryptedText } from "./react-bits/DecryptedText";
import BorderGlow from "./react-bits/BorderGlow";
import GlareHover from "./react-bits/GlareHover";
import { MEGA_EVOLUTIONS } from "@/services/megaEvolutions";

interface PokemonCardProps {
  pokemon: PokemonBase;
  onClick: () => void;
  isComparing: boolean;
  onCompareToggle: (e: React.MouseEvent) => void;
  isFavorite: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
}

const typeGlowHSL: Record<string, string> = {
  normal: "40 10 70",
  fire: "20 85 55",
  water: "220 80 60",
  electric: "50 90 55",
  grass: "120 70 50",
  ice: "180 65 65",
  fighting: "0 75 45",
  poison: "300 65 45",
  ground: "40 60 50",
  flying: "255 70 70",
  psychic: "340 90 60",
  bug: "80 75 40",
  rock: "50 50 45",
  ghost: "260 40 50",
  dragon: "260 85 60",
  dark: "20 20 30",
  steel: "240 10 70",
  fairy: "325 70 70",
};

const typeColors: Record<string, string> = {
  normal: "#A8A77A",
  fire: "#EE8130",
  water: "#6390F0",
  electric: "#F7D02C",
  grass: "#7AC74C",
  ice: "#96D9D6",
  fighting: "#C22E28",
  poison: "#A33EA1",
  ground: "#E2BF65",
  flying: "#A98FF3",
  psychic: "#F95587",
  bug: "#A6B91A",
  rock: "#B6A136",
  ghost: "#735797",
  dragon: "#6F35FC",
  dark: "#705746",
  steel: "#B7B7CE",
  fairy: "#D685AD",
};

// SVG energy icon renderer based on type
function renderEnergyIcon(type: string, className = "w-3 h-3") {
  const t = type.toLowerCase();
  
  if (t === "fire") {
    return (
      <svg className={`${className} fill-red-500`} viewBox="0 0 24 24">
        <path d="M12 2C8 6 4 10 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-4-4-8-8-12zm-2 15c-.5 0-1-.5-1-1 0-1.5 1.5-2.5 2-3 .5.5 2 1.5 2 3 0 .5-.5 1-1 1h-2z" />
      </svg>
    );
  }
  if (t === "water") {
    return (
      <svg className={`${className} fill-blue-500`} viewBox="0 0 24 24">
        <path d="M12 2.7c-.3 0-.6.1-.8.3l-6.7 8c-2 2.4-2 5.8 0 8.2s5.3 3.4 7.6 2.5 4.3-3.4 3.8-5.8c-.2-1-.7-2-1.4-2.8L12.8 3c-.2-.2-.5-.3-.8-.3zm1 14.3c-.5 0-1-.5-1-1s.5-1 1-1 1 .5 1 1-.5 1-1 1z" />
      </svg>
    );
  }
  if (t === "grass") {
    return (
      <svg className={`${className} fill-emerald-500`} viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
      </svg>
    );
  }
  if (t === "electric") {
    return (
      <svg className={`${className} fill-yellow-400`} viewBox="0 0 24 24">
        <path d="M7 2v11h3v9l7-12h-4l4-8z" />
      </svg>
    );
  }
  if (t === "psychic") {
    return (
      <svg className={`${className} fill-purple-500`} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="10" />
        <path className="fill-white" d="M12 8c-2.2 0-4 1.8-4 4s4 4 4 4 4-1.8 4-4-1.8-4-4-4z" />
      </svg>
    );
  }
  
  // Normal/Colorless: star icon
  return (
    <svg className={`${className} fill-neutral-300`} viewBox="0 0 24 24">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  );
}

// Deterministic HP calculator matching standard card ranges
function getMockHP(id: number, types: string[]): number {
  const base = 60 + ((id * 3) % 7) * 10;
  const isHeavy = types.includes("dragon") || types.includes("steel");
  const isLight = types.includes("bug") || types.includes("ghost");
  return base + (isHeavy ? 20 : isLight ? -10 : 0);
}

export function PokemonCard({ pokemon, onClick, isComparing, onCompareToggle, isFavorite, onFavoriteToggle }: PokemonCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const boundsRef = useRef<DOMRect | null>(null);

  const rotateXTo = useRef<any>(null);
  const rotateYTo = useRef<any>(null);
  const imageXTo = useRef<any>(null);
  const imageYTo = useRef<any>(null);

  const [megaIndex, setMegaIndex] = useState(-1);
  const megaForms = MEGA_EVOLUTIONS[pokemon.id];
  const hasMega = megaForms && megaForms.length > 0;

  const currentName = megaIndex === -1 ? pokemon.name : megaForms[megaIndex].name;
  const currentImage = megaIndex === -1 ? pokemon.image : megaForms[megaIndex].image;
  const currentTypes = megaIndex === -1 ? pokemon.types : megaForms[megaIndex].types;
  const primaryType = currentTypes[0] || "normal";

  const handleMouseEnter = () => {
    const isTouch = typeof window !== "undefined" && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    if (cardRef.current) {
      boundsRef.current = cardRef.current.getBoundingClientRect();
      rotateXTo.current = gsap.quickTo(cardRef.current, "rotateX", { duration: 0.25, ease: "power2.out" });
      rotateYTo.current = gsap.quickTo(cardRef.current, "rotateY", { duration: 0.25, ease: "power2.out" });
      gsap.set(cardRef.current, { transformPerspective: 800 });
      
      if (imageRef.current) {
        imageXTo.current = gsap.quickTo(imageRef.current, "x", { duration: 0.25, ease: "power2.out" });
        imageYTo.current = gsap.quickTo(imageRef.current, "y", { duration: 0.25, ease: "power2.out" });
        gsap.set(imageRef.current, { z: 25 });
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const isTouch = typeof window !== "undefined" && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    if (isTouch) return;

    const card = cardRef.current;
    if (!card) return;

    if (!boundsRef.current) {
      boundsRef.current = card.getBoundingClientRect();
    }

    const bounds = boundsRef.current;
    const x = e.clientX - bounds.left;
    const y = e.clientY - bounds.top;

    // Calculate rotation limits (-14deg to 14deg)
    const rotateY = ((x / bounds.width) - 0.5) * 28;
    const rotateX = -((y / bounds.height) - 0.5) * 28;

    if (rotateXTo.current) rotateXTo.current(rotateX);
    if (rotateYTo.current) rotateYTo.current(rotateY);

    if (imageXTo.current) imageXTo.current(rotateY * 0.4);
    if (imageYTo.current) imageYTo.current(-rotateX * 0.4);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;

    // Reset card rotation
    if (rotateXTo.current) rotateXTo.current(0);
    if (rotateYTo.current) rotateYTo.current(0);

    // Reset image position
    if (imageXTo.current) imageXTo.current(0);
    if (imageYTo.current) imageYTo.current(0);

    // Clear quickTo references
    rotateXTo.current = null;
    rotateYTo.current = null;
    imageXTo.current = null;
    imageYTo.current = null;
  };

  const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;
  const hpStat = getMockHP(pokemon.id, currentTypes) + (megaIndex !== -1 ? 30 : 0);

  return (
    <div className="relative group w-full h-full select-none preserve-3d">
      
      {/* Futuristic Glassmorphic Outer Border & Glare Glow wrapper */}
      <BorderGlow
        edgeSensitivity={25}
        glowColor={megaIndex !== -1 ? "45 90 70" : (typeGlowHSL[primaryType] || "40 80 80")}
        backgroundColor="#09090c"
        borderRadius={16}
        glowRadius={30}
        glowIntensity={megaIndex !== -1 ? 1.8 : 1.2}
        colors={megaIndex !== -1 
          ? ['#ff007f', '#00f0ff', '#ffeb3b', '#00ff66', '#7f00ff']
          : [typeColors[primaryType] || '#c084fc', '#1e293b', '#030712']
        }
        className="w-full h-full"
      >
        <GlareHover
          width="100%"
          height="100%"
          background="transparent"
          borderRadius="16px"
          borderColor="transparent"
          glareColor={megaIndex !== -1 ? '#00f0ff' : (typeColors[primaryType] || '#ffffff')}
          glareOpacity={megaIndex !== -1 ? 0.25 : 0.12}
          transitionDuration={500}
          style={{ width: '100%', height: '100%' }}
        >
          <div
            ref={cardRef}
            onMouseEnter={handleMouseEnter}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            onClick={onClick}
            className={`cursor-target w-full h-full rounded-2xl relative flex flex-col justify-between p-5 bg-[#0e0e12]/80 border shadow-2xl backdrop-blur-md overflow-hidden transition-all duration-300 ${
              megaIndex !== -1 ? 'border-amber-500/30' : 'border-white/5'
            }`}
            style={{
              transformStyle: "preserve-3d",
              boxShadow: megaIndex !== -1 
                ? "0 20px 40px -10px rgba(245,158,11,0.2), inset 0 1px 2px rgba(255,255,255,0.06)" 
                : "0 20px 40px -10px rgba(0,0,0,0.65), inset 0 1px 1px rgba(255,255,255,0.03)"
            }}
          >
            
            {/* Compare and Favorite Actions (Inside Card context so they tilt and have translateZ overlay) */}
            <div 
              className="absolute top-3.5 left-3.5 z-40 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto scale-90 group-hover:scale-100"
              style={{ transform: "translateZ(30px)" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCompareToggle(e);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
                  isComparing
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold"
                    : "bg-black/60 border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                }`}
                title={isComparing ? "Remove from comparison" : "Add to comparison"}
              >
                {isComparing ? "✓" : "+"}
              </button>
            </div>

            <div 
              className="absolute top-3.5 right-3.5 z-40 opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-auto scale-90 group-hover:scale-100"
              style={{ transform: "translateZ(30px)" }}
            >
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onFavoriteToggle(e);
                }}
                className={`w-7 h-7 rounded-full flex items-center justify-center border text-xs shadow-lg backdrop-blur-md transition-all duration-200 hover:scale-110 active:scale-95 ${
                  isFavorite
                    ? "bg-rose-500/20 border-rose-500 text-rose-400 font-bold"
                    : "bg-black/60 border-white/10 text-neutral-400 hover:text-rose-400 hover:border-rose-400/30"
                }`}
                title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              >
                ♥
              </button>
            </div>

            {/* Holographic foil sweep for Mega forms */}
            {megaIndex !== -1 && (
              <div 
                className="absolute inset-0 pointer-events-none z-[2] mix-blend-color-dodge opacity-50 animate-holo-sweep"
                style={{
                  background: "linear-gradient(110deg, transparent 30%, rgba(255,255,255,0.2) 45%, rgba(6,182,212,0.4) 50%, rgba(236,72,153,0.4) 55%, transparent 70%)",
                }}
              />
            )}

            {/* 1. Header (Futuristic ID capsule & HP pill) */}
            <div className="flex justify-between items-center z-10 w-full" style={{ transform: "translateZ(10px)" }}>
              <div className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[9px] font-mono font-bold text-neutral-400">
                {formattedId}
              </div>
              
              <div className="flex items-center gap-1.5">
                {megaIndex !== -1 && (
                  <div 
                    className="flex items-center justify-center w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.5)] animate-pulse" 
                    title="Mega Form Active"
                  >
                    <svg className="w-3.5 h-3.5" viewBox="0 0 100 100" fill="currentColor">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.3" />
                      <circle cx="50" cy="50" r="10" />
                      <path d="M30,30 C35,45 42,50 50,50 C58,50 65,45 70,30" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                      <path d="M30,70 C35,55 42,50 50,50 C58,50 65,55 70,70" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <span className="font-bold text-rose-400 text-[10px] font-mono tracking-tight">
                  {hpStat} HP
                </span>
                <div className="w-4 h-4 rounded-full bg-white/5 border border-white/10 flex items-center justify-center shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)]">
                  {renderEnergyIcon(primaryType, "w-2.5 h-2.5")}
                </div>
              </div>
            </div>

            {/* 2. Floating Centered Character (Parallax floating effect with neon radial shadow) */}
            <div
              className="relative flex-1 flex items-center justify-center py-5 min-h-[140px]"
              style={{ transform: "translateZ(20px)" }}
            >
              {/* Type colored neon glow backdrop that scales and glows on hover */}
              <div
                className="absolute w-28 h-28 rounded-full blur-[35px] opacity-20 group-hover:opacity-35 transition-all duration-300 scale-100 group-hover:scale-110"
                style={{
                  backgroundColor: typeColors[primaryType] || "#ffffff",
                }}
              />
              
              {/* Orbital Rings behind character for Mega Form */}
              {megaIndex !== -1 && (
                <>
                  <div className="absolute w-28 h-28 rounded-full border border-dashed border-amber-400/40 animate-[spin_12s_linear_infinite]" />
                  <div className="absolute w-32 h-32 rounded-full border border-dotted border-cyan-400/30 animate-[spin_20s_linear_infinite_reverse]" />
                </>
              )}

              <img
                ref={imageRef}
                src={currentImage}
                alt={currentName}
                className={`w-24 h-24 object-contain z-10 transition-all duration-300 ease-out group-hover:scale-105 ${
                  megaIndex !== -1 ? 'animate-float-slow filter drop-shadow-[0_12px_24px_rgba(245,158,11,0.55)]' : 'filter drop-shadow-[0px 8px 20px rgba(0,0,0,0.45)]'
                }`}
                loading="lazy"
              />
            </div>

            {/* 3. Bottom Information (Sleek big name & glowing capsule type elements) */}
            <div
              className="flex flex-col z-10 text-left mt-2 w-full border-t border-white/5 pt-3"
              style={{ transform: "translateZ(15px)" }}
            >
              <div className="flex justify-between items-center w-full">
                <h3 className="font-black tracking-wide text-white capitalize text-base filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                  <DecryptedText
                    text={currentName}
                    animateOnHover={true}
                    speed={25}
                    className="inline-block"
                  />
                </h3>

                {hasMega && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setMegaIndex((prev) => {
                        if (prev + 1 >= megaForms.length) return -1;
                        return prev + 1;
                      });
                    }}
                    className={`px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded-md border shadow-sm transition-all duration-200 hover:scale-105 active:scale-95 z-20 ${
                      megaIndex !== -1
                        ? "bg-amber-400/20 border-amber-500 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)] animate-pulse"
                        : "bg-white/5 border-white/10 text-neutral-400 hover:text-white hover:border-white/30"
                    }`}
                  >
                    {megaIndex === -1 ? "Mega" : megaForms[megaIndex].name.includes(" X") ? "Mega X" : megaForms[megaIndex].name.includes(" Y") ? "Mega Y" : "Mega"}
                  </button>
                )}
              </div>
              
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {currentTypes.map((type) => (
                  <span
                    key={type}
                    className="text-[8px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full border bg-white/[0.02] backdrop-blur-md shadow-sm transition-colors duration-200"
                    style={{
                      color: typeColors[type] || typeColors.normal,
                      borderColor: (typeColors[type] || typeColors.normal) + "40",
                    }}
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>

          </div>
        </GlareHover>
      </BorderGlow>

    </div>
  );
}


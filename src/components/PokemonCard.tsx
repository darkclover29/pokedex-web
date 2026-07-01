import { useState } from "react";
import type { PokemonBase } from "@/services/pokeapi";
import { TYPE_COLORS } from "@/constants/types";
import { MEGA_EVOLUTIONS } from "@/services/megaEvolutions";

interface PokemonCardProps {
  pokemon: PokemonBase;
  hp?: number;
  onClick: () => void;
  isComparing: boolean;
  onCompareToggle: (e: React.MouseEvent) => void;
  isFavorite: boolean;
  onFavoriteToggle: (e: React.MouseEvent) => void;
}

function estimateHP(id: number, types: string[]): number {
  const base = 60 + ((id * 3) % 7) * 10;
  const isHeavy = types.includes("dragon") || types.includes("steel");
  const isLight = types.includes("bug") || types.includes("ghost");
  return base + (isHeavy ? 20 : isLight ? -10 : 0);
}

export function PokemonCard({
  pokemon,
  hp,
  onClick,
  isComparing,
  onCompareToggle,
  isFavorite,
  onFavoriteToggle,
}: PokemonCardProps) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [megaIndex, setMegaIndex] = useState(-1);

  const megaForms = MEGA_EVOLUTIONS[pokemon.id];
  const hasMega = megaForms && megaForms.length > 0;

  const currentName = megaIndex === -1 ? pokemon.name : megaForms[megaIndex].name;
  const currentImage = megaIndex === -1 ? pokemon.image : megaForms[megaIndex].image;
  const currentTypes = megaIndex === -1 ? pokemon.types : megaForms[megaIndex].types;
  const primaryType = currentTypes[0] || "normal";
  const typeColor = TYPE_COLORS[primaryType] || "#A8A77A";

  const baseHP = hp ?? estimateHP(pokemon.id, currentTypes);
  const hpStat = baseHP + (megaIndex !== -1 ? 30 : 0);
  const formattedId = `#${String(pokemon.id).padStart(3, "0")}`;

  return (
    <div
      className="group relative w-full rounded-2xl cursor-pointer select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
      tabIndex={0}
      role="button"
      aria-label={`${pokemon.name} ${formattedId}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick();
        }
      }}
      style={{
        // Lift + type-colored shadow on hover via CSS custom property
        transition: "transform 200ms ease, box-shadow 200ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-4px) scale(1.015)";
        (e.currentTarget as HTMLDivElement).style.boxShadow = `0 20px 40px -10px ${typeColor}33, 0 8px 16px -4px rgba(0,0,0,0.5)`;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.transform = "";
        (e.currentTarget as HTMLDivElement).style.boxShadow = "";
      }}
    >
      {/* Card body */}
      <div
        className={`relative w-full h-full rounded-2xl overflow-hidden flex flex-col bg-[#111118] border ${
          megaIndex !== -1 ? "border-amber-500/40" : "border-white/[0.06]"
        }`}
      >
        {/* Type color accent bar at top */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{
            background: currentTypes.length > 1
              ? `linear-gradient(90deg, ${TYPE_COLORS[currentTypes[0]] || typeColor} 0%, ${TYPE_COLORS[currentTypes[1]] || typeColor} 100%)`
              : typeColor,
          }}
        />

        {/* Mega holographic sweep */}
        {megaIndex !== -1 && (
          <div
            className="absolute inset-0 pointer-events-none z-[2] mix-blend-color-dodge opacity-30"
            style={{
              background:
                "linear-gradient(110deg, transparent 35%, rgba(255,255,255,0.15) 48%, rgba(6,182,212,0.25) 52%, rgba(236,72,153,0.25) 56%, transparent 70%)",
              animation: "holo 3s linear infinite",
            }}
          />
        )}

        {/* Content */}
        <div className="flex flex-col flex-1 px-4 pt-3 pb-4">
          {/* Header row */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-mono text-neutral-500 font-medium">{formattedId}</span>
            <span
              className="text-[10px] font-mono font-bold"
              style={{ color: typeColor }}
            >
              {hpStat} HP
            </span>
          </div>

          {/* Artwork */}
          <div className="relative flex items-center justify-center flex-1 py-2 min-h-[120px]">
            {/* Type glow backdrop */}
            <div
              className="absolute w-24 h-24 rounded-full opacity-[0.12] group-hover:opacity-[0.22] transition-opacity duration-300"
              style={{
                backgroundColor: typeColor,
                filter: "blur(28px)",
              }}
            />

            {/* Mega orbital rings */}
            {megaIndex !== -1 && (
              <>
                <div className="absolute w-28 h-28 rounded-full border border-dashed border-amber-400/30 animate-[spin_12s_linear_infinite]" />
                <div className="absolute w-32 h-32 rounded-full border border-dotted border-cyan-400/20 animate-[spin_20s_linear_infinite_reverse]" />
              </>
            )}

            {/* Skeleton while image loads */}
            {!imgLoaded && (
              <div className="absolute w-[88px] h-[88px] rounded-full bg-neutral-800/60 animate-pulse" />
            )}

            <img
              src={currentImage}
              alt={currentName}
              loading="lazy"
              onLoad={() => setImgLoaded(true)}
              className={`relative z-10 w-[88px] h-[88px] object-contain transition-all duration-200 group-hover:scale-105 ${
                imgLoaded ? "opacity-100" : "opacity-0"
              } ${megaIndex !== -1 ? "drop-shadow-[0_8px_20px_rgba(245,158,11,0.45)]" : "drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]"}`}
            />
          </div>

          {/* Footer */}
          <div className="mt-3 border-t border-white/[0.05] pt-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-white capitalize leading-tight truncate">
                {currentName}
              </h3>
              {hasMega && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMegaIndex((prev) => (prev + 1 >= megaForms.length ? -1 : prev + 1));
                  }}
                  className={`flex-shrink-0 px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wider rounded border transition-all duration-150 ${
                    megaIndex !== -1
                      ? "bg-amber-400/15 border-amber-500/60 text-amber-300"
                      : "bg-white/5 border-white/10 text-neutral-500 hover:text-white hover:border-white/25"
                  }`}
                >
                  {megaIndex === -1
                    ? "Mega"
                    : megaForms[megaIndex].name.includes(" X")
                    ? "Mega X"
                    : megaForms[megaIndex].name.includes(" Y")
                    ? "Mega Y"
                    : "Mega"}
                </button>
              )}
            </div>

            <div className="flex gap-1.5 mt-1.5 flex-wrap">
              {currentTypes.map((type) => (
                <span
                  key={type}
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                  style={{
                    color: TYPE_COLORS[type] || TYPE_COLORS.normal,
                    backgroundColor: (TYPE_COLORS[type] || TYPE_COLORS.normal) + "18",
                    border: `1px solid ${(TYPE_COLORS[type] || TYPE_COLORS.normal)}30`,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Action buttons — shown on hover */}
        <div className="absolute top-4 left-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onCompareToggle(e); }}
            title={isComparing ? "Remove from comparison" : "Add to comparison"}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border shadow-lg transition-all duration-150 hover:scale-110 active:scale-95 ${
              isComparing
                ? "bg-emerald-500/20 border-emerald-500/60 text-emerald-400"
                : "bg-black/70 border-white/10 text-neutral-400 hover:text-white"
            }`}
          >
            {isComparing ? "✓" : "+"}
          </button>
        </div>

        <div className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
          <button
            onClick={(e) => { e.stopPropagation(); onFavoriteToggle(e); }}
            title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] border shadow-lg transition-all duration-150 hover:scale-110 active:scale-95 ${
              isFavorite
                ? "bg-rose-500/20 border-rose-500/60 text-rose-400"
                : "bg-black/70 border-white/10 text-neutral-500 hover:text-rose-400"
            }`}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}

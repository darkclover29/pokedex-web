import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { PokemonCard } from "./PokemonCard";
import type { PokemonBase } from "@/services/pokeapi";

interface ShowroomProps {
  favorites: number[];
  team: any[];
  allPokemonList: PokemonBase[];
  onCompareToggle: (id: number) => void;
  onFavoriteToggle: (id: number) => void;
  compareIds: number[];
  onSelectPokemon: (id: number) => void;
}

export function Showroom({
  favorites,
  team,
  allPokemonList,
  onCompareToggle,
  onFavoriteToggle,
  compareIds,
  onSelectPokemon,
}: ShowroomProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  // Combine Squad and Favorites, or fallback to top Kanto Pokemon if empty
  const showroomPokemon = useMemo(() => {
    const list: PokemonBase[] = [];
    const addedIds = new Set<number>();

    // 1. Add Squad members
    team.forEach((member) => {
      if (member && !addedIds.has(member.id)) {
        list.push({
          id: member.id,
          name: member.name,
          types: member.types,
          image: member.image,
          shinyImage: member.shinyImage,
        });
        addedIds.add(member.id);
      }
    });

    // 2. Add Favorites
    favorites.forEach((favId) => {
      if (!addedIds.has(favId)) {
        const found = allPokemonList.find((p) => p.id === favId);
        if (found) {
          list.push(found);
          addedIds.add(favId);
        }
      }
    });

    // 3. Fallback if empty: add starter Pokemon
    if (list.length === 0 && allPokemonList.length > 0) {
      const starters = [1, 4, 7, 25, 133, 150]; // Bulbasaur, Charmander, Squirtle, Pikachu, Eevee, Mewtwo
      starters.forEach((id) => {
        const p = allPokemonList.find((x) => x.id === id);
        if (p) list.push(p);
      });
    }

    return list.slice(0, 10); // Cap at 10 for performance and spacing in 3D circle
  }, [favorites, team, allPokemonList]);

  const total = showroomPokemon.length;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % total);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + total) % total);
  };

  if (total === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-neutral-500 font-mono text-xs">
        No entries found to display.
      </div>
    );
  }

  // Calculate radius based on count to spread them out evenly
  const radius = Math.min(350, Math.max(160, total * 35));

  return (
    <div className="flex flex-col items-center justify-between min-h-[500px] w-full text-white select-none">
      
      {/* Showroom Header */}
      <div className="text-center space-y-1 mb-8">
        <div className="flex items-center justify-center gap-1.5 text-amber-400 font-mono text-[10px] uppercase tracking-widest font-extrabold">
          <Sparkles className="h-3 w-3 animate-pulse" />
          <span>3D Holographic Binder</span>
        </div>
        <p className="text-xs text-neutral-400 max-w-sm mx-auto">
          Rotate through your active squad and favorited collection in holographic space.
        </p>
      </div>

      {/* 3D Stage Viewport */}
      <div className="relative w-full h-[280px] sm:h-[340px] flex items-center justify-center overflow-visible perspective-[1000px]">
        {/* Dynamic circular shadow backdrop */}
        <div className="absolute w-[200px] h-[30px] rounded-full bg-neutral-900/60 blur-xl translate-y-[150px] rotateX-90 pointer-events-none" />

        {/* Dynamic rotating ring */}
        <div
          className="relative w-44 h-60 transition-transform duration-700 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateY(${-activeIndex * (360 / total)}deg)`,
          }}
        >
          {showroomPokemon.map((pokemon, idx) => {
            const angle = idx * (360 / total);
            const isCenter = idx === activeIndex;

            return (
              <div
                key={pokemon.id}
                className="absolute top-0 left-0 w-full h-full transition-opacity duration-500"
                style={{
                  transformStyle: "preserve-3d",
                  transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
                  backfaceVisibility: "hidden",
                  opacity: isCenter ? 1 : 0.25,
                  pointerEvents: isCenter ? "auto" : "none",
                  filter: isCenter ? "drop-shadow(0 0 15px rgba(255,255,255,0.05))" : "brightness(0.55)",
                }}
              >
                <PokemonCard
                  pokemon={pokemon}
                  isComparing={compareIds.includes(pokemon.id)}
                  onCompareToggle={(e) => {
                    e.stopPropagation();
                    onCompareToggle(pokemon.id);
                  }}
                  isFavorite={favorites.includes(pokemon.id)}
                  onFavoriteToggle={(e) => {
                    e.stopPropagation();
                    onFavoriteToggle(pokemon.id);
                  }}
                  onClick={() => onSelectPokemon(pokemon.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Retro Diagnostics & Controls Panel */}
      <div className="w-full max-w-md bg-neutral-900/40 border border-white/5 p-4 rounded-2xl flex flex-col items-center gap-4 mt-8 backdrop-blur-md">
        {/* Active Item HUD */}
        <div className="w-full flex justify-between items-center text-[10px] font-mono text-neutral-400 border-b border-white/5 pb-2.5">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-500">SELECTION:</span>
            <span className="text-white font-bold uppercase capitalize">
              {showroomPokemon[activeIndex]?.name}
            </span>
          </div>
          <div>
            <span>{activeIndex + 1} / {total}</span>
          </div>
        </div>

        {/* Rotating Buttons Row */}
        <div className="flex items-center gap-4">
          <button
            onClick={handlePrev}
            className="w-10 h-10 rounded-xl bg-neutral-950/60 border border-white/10 hover:border-white/20 active:scale-95 transition-all flex items-center justify-center"
            title="Previous entry"
          >
            <ChevronLeft className="h-5 w-5 text-neutral-300" />
          </button>
          
          <button
            onClick={() => onSelectPokemon(showroomPokemon[activeIndex].id)}
            className="px-6 py-2 rounded-xl bg-white text-black font-mono font-bold text-xs uppercase tracking-wider hover:bg-neutral-200 active:scale-95 transition-all shadow-lg"
          >
            Analyze Record
          </button>

          <button
            onClick={handleNext}
            className="w-10 h-10 rounded-xl bg-neutral-950/60 border border-white/10 hover:border-white/20 active:scale-95 transition-all flex items-center justify-center"
            title="Next entry"
          >
            <ChevronRight className="h-5 w-5 text-neutral-300" />
          </button>
        </div>
      </div>

    </div>
  );
}

import { useState, useRef, useEffect } from "react";
import { Search, Volume2, Music, X } from "lucide-react";
import type { PokemonBase } from "@/services/pokeapi";
import { Input } from "@/components/ui/Input";

interface SoundboardProps {
  allPokemonList: PokemonBase[];
}

// Popular default pokemon list for the soundboard
const POPULAR_SOUNDBOARD_IDS = [1, 4, 6, 7, 9, 25, 39, 94, 133, 143, 149, 150, 151];

export function Soundboard({ allPokemonList }: SoundboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlayingId, setActivePlayingId] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter list based on search. If empty, show popular default set.
  const getSoundboardItems = () => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return allPokemonList.filter(
        (p) => p.name.toLowerCase().includes(q) || String(p.id) === q
      );
    }
    
    // Otherwise, show popular defaults
    return POPULAR_SOUNDBOARD_IDS.map((id) => {
      return allPokemonList.find((p) => p.id === id) || null;
    }).filter((p): p is PokemonBase => p !== null);
  };

  const soundboardItems = getSoundboardItems();

  const handlePlayCry = (id: number) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const cryUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/cries/${id}.ogg`;
    const audio = new Audio(cryUrl);
    audio.volume = 0.4;
    audioRef.current = audio;
    
    setActivePlayingId(id);
    audio.play().catch((err) => {
      console.log("Audio play blocked:", err);
      setActivePlayingId(null);
    });

    audio.onended = () => {
      setActivePlayingId(null);
    };
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  return (
    <div className="w-full text-white select-none flex flex-col items-center py-4">
      
      {/* Header section */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-emerald-400" />
          <h3 className="text-lg font-bold tracking-tight">Soundboard launchpad</h3>
        </div>
        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
          Vocal Cry launchpad
        </span>
      </div>

      {/* Local search bar */}
      <div className="relative w-full mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
        <Input
          type="text"
          placeholder="Filter soundboard by name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 h-9 bg-neutral-900/60"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Grid of Soundboard Tiles */}
      {soundboardItems.length === 0 ? (
        <div className="h-48 w-full flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/10 rounded-2xl bg-white/5">
          <Music className="h-8 w-8 mb-2 opacity-30 text-rose-500" />
          <span className="font-mono text-xs">No Pokémon found in database.</span>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 w-full max-h-[300px] overflow-y-auto pr-1">
          {soundboardItems.map((pokemon) => {
            const isPlaying = activePlayingId === pokemon.id;

            return (
              <button
                key={pokemon.id}
                onClick={() => handlePlayCry(pokemon.id)}
                className={`group flex flex-col items-center p-3 rounded-xl border transition-all duration-200 ${
                  isPlaying
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.03]"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 hover:scale-[1.02]"
                }`}
              >
                {/* Pokémon thumbnail */}
                <div className="relative w-12 h-12 flex items-center justify-center mb-1.5">
                  <img
                    src={pokemon.image}
                    alt={pokemon.name}
                    className="w-11 h-11 object-contain z-10 filter group-hover:drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)]"
                    loading="lazy"
                  />
                </div>

                <span className="text-[10px] capitalize font-bold tracking-tight text-neutral-200 group-hover:text-white truncate max-w-full">
                  {pokemon.name}
                </span>

                {/* Animated waves while playing, else static icon */}
                {isPlaying ? (
                  <div className="flex items-end gap-[1.5px] h-3 mt-1 flex-shrink-0">
                    <div className="w-[2px] h-full bg-emerald-400 animate-[bounce_0.6s_infinite_alternate]" />
                    <div className="w-[2px] h-full bg-emerald-400 animate-[bounce_0.8s_infinite_alternate_0.2s]" />
                    <div className="w-[2px] h-full bg-emerald-400 animate-[bounce_0.5s_infinite_alternate_0.1s]" />
                  </div>
                ) : (
                  <Volume2 className="h-3 w-3 text-neutral-500 group-hover:text-neutral-300 mt-1 transition-colors flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

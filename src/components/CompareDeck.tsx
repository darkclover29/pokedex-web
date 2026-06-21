import { useState, useEffect } from "react";
import { X, Sparkles, AlertCircle } from "lucide-react";
import { fetchPokemonDetails } from "@/services/pokeapi";
import type { PokemonFullDetails, PokemonBase } from "@/services/pokeapi";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";

interface CompareDeckProps {
  compareIds: number[];
  allPokemonList: PokemonBase[];
  onRemove: (id: number) => void;
  onClear: () => void;
}

const statLabels: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SATK",
  "special-defense": "SDEF",
  speed: "SPD",
};

export function CompareDeck({ compareIds, allPokemonList, onRemove, onClear }: CompareDeckProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [comparedDetails, setComparedDetails] = useState<PokemonFullDetails[]>([]);

  // Find simple items for the bottom deck preview
  const deckItems = compareIds.map((id) => {
    return allPokemonList.find((p) => p.id === id) || null;
  }).filter((p): p is PokemonBase => p !== null);

  // Fetch full details of all compared Pokemon when modal opens
  useEffect(() => {
    if (!isOpen || compareIds.length === 0) return;

    async function loadCompared() {
      setLoading(true);
      const promises = compareIds.map((id) => fetchPokemonDetails(id));
      const results = await Promise.all(promises);
      setComparedDetails(results.filter((p): p is PokemonFullDetails => p !== null));
      setLoading(false);
    }
    loadCompared();
  }, [isOpen, compareIds]);

  const handleOpenCompare = () => {
    if (compareIds.length < 2) return;
    setIsOpen(true);
  };

  if (compareIds.length === 0) return null;

  // Helper to find which Pokemon has the highest value for a given stat name
  const getWinnerIdForStat = (statName: string) => {
    if (comparedDetails.length < 2) return null;
    let maxVal = -1;
    let winnerId = -1;
    let isDraw = false;

    comparedDetails.forEach((p) => {
      const statObj = p.stats.find((s) => s.name === statName);
      if (statObj) {
        if (statObj.value > maxVal) {
          maxVal = statObj.value;
          winnerId = p.id;
          isDraw = false;
        } else if (statObj.value === maxVal) {
          isDraw = true;
        }
      }
    });

    return isDraw ? null : winnerId;
  };

  // Helper to find the heaviest / tallest
  const getWinnerIdForMetric = (metric: "height" | "weight") => {
    if (comparedDetails.length < 2) return null;
    let maxVal = -1;
    let winnerId = -1;
    let isDraw = false;

    comparedDetails.forEach((p) => {
      const val = p[metric];
      if (val > maxVal) {
        maxVal = val;
        winnerId = p.id;
        isDraw = false;
      } else if (val === maxVal) {
        isDraw = true;
      }
    });

    return isDraw ? null : winnerId;
  };

  return (
    <>
      {/* Bottom Floating Bar */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-lg glass-panel rounded-2xl border border-white/10 shadow-2xl p-4 flex items-center justify-between gap-4 animate-[slideUp_0.3s_ease-out]">
        
        {/* Deck preview avatars */}
        <div className="flex items-center gap-2">
          <div className="flex -space-x-3">
            {deckItems.map((pokemon) => (
              <div
                key={pokemon.id}
                className="relative w-11 h-11 rounded-full bg-neutral-900 border-2 border-neutral-800 flex items-center justify-center group cursor-pointer"
                onClick={() => onRemove(pokemon.id)}
                title="Click to remove"
              >
                <img
                  src={pokemon.image}
                  alt={pokemon.name}
                  className="w-9 h-9 object-contain"
                />
                <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity">
                  <X className="h-3.5 w-3.5 text-white" />
                </div>
              </div>
            ))}
            {Array.from({ length: 3 - deckItems.length }).map((_, i) => (
              <div
                key={i}
                className="w-11 h-11 rounded-full border border-dashed border-white/10 bg-white/5 flex items-center justify-center text-neutral-600 font-mono text-sm"
              >
                +
              </div>
            ))}
          </div>
          <div className="flex flex-col ml-1">
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Comparison Queue
            </span>
            <span className="text-xs font-mono font-bold text-white">
              {deckItems.length} / 3 Pokémon
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={onClear}
            className="px-3 py-1.5 rounded-lg border border-white/5 hover:bg-white/5 text-neutral-400 hover:text-white transition-colors"
          >
            Clear
          </button>
          <button
            disabled={compareIds.length < 2}
            onClick={handleOpenCompare}
            className="px-4 py-2 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 disabled:opacity-40 disabled:hover:bg-white transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(255,255,255,0.25)]"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Compare
          </button>
        </div>
      </div>

      {/* Comparison Detailed Modal */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl bg-neutral-950/95 border-white/10 select-none">
          <DialogHeader className="sr-only">
            <DialogTitle>Pokémon Side-by-Side Comparison</DialogTitle>
          </DialogHeader>

          {loading ? (
            <div className="h-96 flex flex-col items-center justify-center gap-2">
              <span className="animate-spin h-8 w-8 border-2 border-white border-t-transparent rounded-full mb-2" />
              <span className="font-mono text-sm text-neutral-400">Syncing database values...</span>
            </div>
          ) : (
            <div className="w-full text-white mt-4 overflow-x-auto">
              <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
                <div>
                  <h3 className="text-xl font-bold tracking-tight">Side-by-Side Analysis</h3>
                  <p className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider mt-1">
                    Glow indicators highlight superior stats
                  </p>
                </div>
                <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-xl px-3 py-1 text-xs text-neutral-400 font-mono">
                  <Sparkles className="h-3.5 w-3.5 text-yellow-400" />
                  <span>Head-to-Head</span>
                </div>
              </div>

              {/* Side-by-Side Columns */}
              <div className="grid grid-cols-3 gap-4 md:gap-6 min-w-[500px]">
                {comparedDetails.map((pokemon) => {
                  const primaryType = pokemon.types[0] || "normal";
                  const shadowColor = primaryType === "normal" ? "rgba(255,255,255,0.08)" : `rgba(255,255,255,0.15)`;

                  return (
                    <div
                      key={pokemon.id}
                      className="glass-panel border-white/5 p-4 rounded-2xl flex flex-col items-center text-center relative overflow-hidden"
                    >
                      {/* Top Type Indicator Glow */}
                      <div
                        className="absolute top-0 left-0 w-full h-1 blur-md"
                        style={{
                          backgroundColor:
                            primaryType === "fire"
                              ? "#EE8130"
                              : primaryType === "water"
                              ? "#6390F0"
                              : primaryType === "grass"
                              ? "#7AC74C"
                              : "#A8A77A",
                        }}
                      />

                      {/* Artwork */}
                      <div className="relative w-28 h-28 flex items-center justify-center mb-2">
                        <div
                          className="absolute w-20 h-20 rounded-full blur-2xl opacity-20"
                          style={{ backgroundColor: shadowColor }}
                        />
                        <img
                          src={pokemon.image}
                          alt={pokemon.name}
                          className="w-24 h-24 object-contain z-10"
                        />
                      </div>

                      {/* Header info */}
                      <span className="font-mono text-[10px] text-neutral-500">
                        #{String(pokemon.id).padStart(3, "0")}
                      </span>
                      <h4 className="text-lg font-bold capitalize truncate max-w-full">
                        {pokemon.name}
                      </h4>
                      <div className="flex gap-1 mt-1 mb-4">
                        {pokemon.types.map((t) => (
                          <span
                            key={t}
                            className="text-[9px] font-bold uppercase px-2 py-0.5 rounded border border-white/10"
                          >
                            {t}
                          </span>
                        ))}
                      </div>

                      {/* Metrics section */}
                      <div className="w-full grid grid-cols-2 gap-2 py-2 border-t border-b border-white/5 mb-4 text-xs">
                        <div
                          className={`flex flex-col p-1.5 rounded-lg ${
                            getWinnerIdForMetric("height") === pokemon.id
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : "text-neutral-300"
                          }`}
                        >
                          <span className="text-[9px] uppercase font-mono text-neutral-500">
                            Height
                          </span>
                          <span className="font-semibold">{pokemon.height} m</span>
                        </div>
                        <div
                          className={`flex flex-col p-1.5 rounded-lg ${
                            getWinnerIdForMetric("weight") === pokemon.id
                              ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                              : "text-neutral-300"
                          }`}
                        >
                          <span className="text-[9px] uppercase font-mono text-neutral-500">
                            Weight
                          </span>
                          <span className="font-semibold">{pokemon.weight} kg</span>
                        </div>
                      </div>

                      {/* Stats section */}
                      <div className="w-full space-y-3 font-mono text-xs">
                        {pokemon.stats.map((stat) => {
                          const isWinner = getWinnerIdForStat(stat.name) === pokemon.id;
                          const label = statLabels[stat.name] || stat.name.toUpperCase();
                          const percent = Math.min((stat.value / 255) * 100, 100);

                          return (
                            <div key={stat.name} className="flex flex-col gap-1 text-left">
                              <div className="flex justify-between items-center text-[10px]">
                                <span className="text-neutral-500">{label}</span>
                                <span
                                  className={
                                    isWinner ? "text-emerald-400 font-bold" : "text-neutral-300"
                                  }
                                >
                                  {stat.value} {isWinner && "★"}
                                </span>
                              </div>
                              <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                                <div
                                  className={`h-full rounded-full transition-all duration-500 ${
                                    isWinner ? "bg-emerald-400" : "bg-neutral-700"
                                  }`}
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                {/* Empty placeholders if less than 3 are compared */}
                {comparedDetails.length < 3 &&
                  Array.from({ length: 3 - comparedDetails.length }).map((_, i) => (
                    <div
                      key={i}
                      className="glass-panel border-dashed border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center opacity-40 text-neutral-600 font-mono text-sm"
                    >
                      <AlertCircle className="h-8 w-8 mb-2 text-neutral-500" />
                      <span>Empty Slot</span>
                      <span className="text-[9px] mt-1">Queue up to 3 for complete mapping</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

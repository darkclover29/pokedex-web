import { useState } from "react";
import { ShieldAlert, Plus, Trash2, Shield, Info, HelpCircle, Users } from "lucide-react";
import type { PokemonFullDetails, PokemonBase } from "@/services/pokeapi";
import { calculateTypeMatchups } from "@/services/typeEffectiveness";
import { TYPE_COLORS, TYPE_COUNTERS } from "@/constants/types";

interface TeamBuilderProps {
  team: PokemonFullDetails[];
  onRemove: (id: number) => void;
  onAdd: (id: number) => void;
  allPokemonList: PokemonBase[];
}

export function TeamBuilder({ team, onRemove, onAdd, allPokemonList }: TeamBuilderProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);

  // Filter list of Pokemon for search dropdown
  const getDropdownOptions = () => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase().trim();
    return allPokemonList
      .filter(
        (p) =>
          (p.name.toLowerCase().includes(query) || String(p.id) === query) &&
          !team.some((member) => member.id === p.id)
      )
      .slice(0, 5); // Limit search results to 5
  };

  const dropdownOptions = getDropdownOptions();

  // Calculate stats averages
  const calculateAverages = () => {
    if (team.length === 0) return null;
    const statSums: Record<string, number> = {
      hp: 0,
      attack: 0,
      defense: 0,
      "special-attack": 0,
      "special-defense": 0,
      speed: 0,
    };

    team.forEach((p) => {
      p.stats.forEach((s) => {
        if (s.name in statSums) {
          statSums[s.name] += s.value;
        }
      });
    });

    const averages: { name: string; value: number }[] = [];
    Object.entries(statSums).forEach(([name, sum]) => {
      averages.push({
        name,
        value: Math.round(sum / team.length),
      });
    });

    return averages;
  };

  const statAverages = calculateAverages();

  // Perform team type coverage analysis
  const calculateTypeCoverage = () => {
    if (team.length === 0) return null;

    const weaknessCounts: Record<string, number> = {};
    const resistanceCounts: Record<string, number> = {};

    team.forEach((member) => {
      const matchups = calculateTypeMatchups(member.types);
      
      matchups.weaknesses.forEach((w) => {
        weaknessCounts[w.type] = (weaknessCounts[w.type] || 0) + 1;
      });

      matchups.resistances.forEach((r) => {
        resistanceCounts[r.type] = (resistanceCounts[r.type] || 0) + 1;
      });

      matchups.immunities.forEach((imm) => {
        resistanceCounts[imm] = (resistanceCounts[imm] || 0) + 1;
      });
    });

    // Detect critical weaknesses: 3 or more members weak to the same type
    const criticalWeaknesses: { type: string; count: number; counters: string[] }[] = [];
    Object.entries(weaknessCounts).forEach(([type, count]) => {
      if (count >= 3) {
        criticalWeaknesses.push({
          type,
          count,
          counters: TYPE_COUNTERS[type] || [],
        });
      }
    });

    return {
      weaknessCounts,
      resistanceCounts,
      criticalWeaknesses,
    };
  };

  const coverage = calculateTypeCoverage();

  return (
    <div className="w-full text-white select-none flex flex-col gap-6">
      
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-emerald-400" />
            <span>Team Builder & Analyzer</span>
          </h2>
          <p className="text-[10px] font-mono text-neutral-500 uppercase mt-0.5">
            Construct a balanced 6-member squad
          </p>
        </div>
        <span className="font-mono text-xs text-neutral-400 bg-white/5 px-2.5 py-1 rounded-xl border border-white/5">
          Active: <strong className="text-emerald-400">{team.length} / 6</strong>
        </span>
      </div>

      {/* Autocomplete Add Member Search */}
      {team.length < 6 && (
        <div className="relative font-mono text-xs w-full max-w-md">
          <span className="text-[10px] text-neutral-500 uppercase block mb-1.5 ml-1">
            Search & add squad member
          </span>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Type Pokémon name or index..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className="flex-grow h-9 px-3 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-400 focus:outline-none"
            />
          </div>

          {/* Autocomplete dropdown options */}
          {showDropdown && dropdownOptions.length > 0 && (
            <div className="absolute top-16 left-0 w-full bg-neutral-950 border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5">
              {dropdownOptions.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onAdd(p.id);
                    setSearchQuery("");
                    setShowDropdown(false);
                  }}
                  className="w-full px-3 py-2 flex items-center justify-between hover:bg-white/5 text-left text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-6 h-6 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`;
                      }}
                    />
                    <span className="capitalize font-bold text-neutral-200">{p.name}</span>
                  </div>
                  <div className="flex gap-1">
                    {p.types.map((type) => (
                      <span
                        key={type}
                        className="text-[8px] uppercase px-1.5 py-0.5 rounded border border-white/5 bg-white/5"
                        style={{ color: TYPE_COLORS[type] }}
                      >
                        {type}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 6 Squad Slots Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, index) => {
          const member = team[index];

          if (!member) {
            return (
              <div
                key={`empty-${index}`}
                className="rounded-2xl border border-dashed border-white/10 bg-neutral-950/20 aspect-[4/5] flex flex-col items-center justify-center gap-1.5 p-3 text-neutral-500 hover:border-emerald-500/20 hover:bg-neutral-950/40 transition-all group"
              >
                <Plus className="h-6 w-6 text-neutral-600 group-hover:text-emerald-400 group-hover:scale-110 transition-all" />
                <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-600 group-hover:text-neutral-500">
                  Slot {index + 1}
                </span>
              </div>
            );
          }

          const primaryType = member.types[0] || "normal";
          const themeColor = TYPE_COLORS[primaryType] || TYPE_COLORS.normal;

          return (
            <div
              key={member.id}
              className="rounded-2xl border border-white/5 bg-white/5 aspect-[4/5] flex flex-col justify-between p-3 relative overflow-hidden group"
              style={{
                boxShadow: `0 0 15px -8px ${themeColor}`,
              }}
            >
              {/* Card BG glow */}
              <div
                className="absolute inset-0 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none"
                style={{
                  background: `radial-gradient(circle at center, ${themeColor} 0%, transparent 70%)`,
                }}
              />

              {/* Top: Remove button */}
              <div className="flex justify-between items-start z-10">
                <span className="text-[8px] font-mono text-neutral-500">#{String(member.id).padStart(3, "0")}</span>
                <button
                  onClick={() => onRemove(member.id)}
                  className="text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 p-1 rounded-lg transition-all"
                  title="Remove from squad"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Mid: Image */}
              <div className="flex-grow flex items-center justify-center py-2 z-10">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-14 h-14 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.5)] group-hover:scale-105 transition-transform"
                />
              </div>

              {/* Bottom: Info */}
              <div className="z-10 text-center font-sans">
                <h4 className="text-xs font-bold capitalize text-neutral-200 truncate">{member.name}</h4>
                <div className="flex justify-center gap-1 mt-1">
                  {member.types.map((type) => (
                    <span
                      key={type}
                      className="text-[7px] uppercase font-mono px-1 rounded bg-black/40 border border-white/5"
                      style={{ color: TYPE_COLORS[type] }}
                    >
                      {type.substring(0, 3)}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Analysis Grid */}
      {team.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
          
          {/* Left panel: Stat Averages */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <Shield className="h-4 w-4 text-emerald-400" />
              <span>Squad Average Stats</span>
            </h3>

            <div className="space-y-2.5 py-1">
              {statAverages?.map((stat) => {
                const percentage = Math.min((stat.value / 150) * 100, 100);
                
                // Color stats differently
                let barColor = "bg-neutral-500";
                if (stat.name === "hp") barColor = "bg-rose-500";
                else if (stat.name === "attack") barColor = "bg-orange-500";
                else if (stat.name === "defense") barColor = "bg-amber-500";
                else if (stat.name === "special-attack") barColor = "bg-sky-500";
                else if (stat.name === "special-defense") barColor = "bg-emerald-500";
                else if (stat.name === "speed") barColor = "bg-indigo-500";

                return (
                  <div key={stat.name} className="space-y-1">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="capitalize text-neutral-400">{stat.name.replace("-", " ")}</span>
                      <span className="font-bold text-white">{stat.value}</span>
                    </div>
                    <div className="w-full h-1.5 bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                      <div
                        className={`h-full rounded-full ${barColor}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right panel: Type weaknesses & counter advisors */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col gap-3 font-mono text-xs">
            <h3 className="text-xs font-bold text-neutral-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-white/5 pb-2">
              <ShieldAlert className="h-4 w-4 text-rose-400" />
              <span>Type Synergy & Coverage</span>
            </h3>

            {/* Critical Weakness Alerts */}
            {coverage && coverage.criticalWeaknesses.length > 0 ? (
              <div className="space-y-3 py-1 flex-grow">
                <span className="text-[10px] text-rose-400 flex items-center gap-1 uppercase font-bold">
                  ⚠️ Critical Team Weaknesses (3+ Members Share)
                </span>
                <div className="space-y-2">
                  {coverage.criticalWeaknesses.map((crit) => (
                    <div
                      key={crit.type}
                      className="p-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 flex flex-col gap-1.5"
                    >
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="uppercase font-black text-rose-400">{crit.type} Weakness</span>
                        <span className="text-neutral-300 font-bold">{crit.count} members weak</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[9px]">
                        <span className="text-neutral-400">Recommended Counter Elements:</span>
                        {crit.counters.map((c) => (
                          <span
                            key={c}
                            className="px-1.5 py-0.5 rounded border border-white/10 uppercase font-bold text-white/90"
                            style={{ backgroundColor: TYPE_COLORS[c] }}
                          >
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center py-4 text-center text-neutral-500">
                <Info className="h-8 w-8 mb-2 opacity-35 text-emerald-400" />
                <p className="text-[10px] leading-normal uppercase">
                  Synergy check complete.<br />No severe type weakness overlaps detected!
                </p>
              </div>
            )}

            {/* Weakness Matrix overview */}
            {coverage && (
              <div className="border-t border-white/5 pt-3 mt-1">
                <span className="text-[10px] text-neutral-500 uppercase block mb-2">
                  Overall Squad Vulnerabilities
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-[70px] overflow-y-auto pr-1">
                  {Object.entries(coverage.weaknessCounts)
                    .sort((a, b) => b[1] - a[1])
                    .map(([type, count]) => (
                      <span
                        key={type}
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded border ${
                          count >= 3
                            ? "bg-rose-500/10 border-rose-500/30 text-rose-400 font-bold"
                            : "bg-white/5 border-white/5 text-neutral-300"
                        }`}
                      >
                        {type}: x{count}
                      </span>
                    ))}
                </div>
              </div>
            )}

          </div>

        </div>
      ) : (
        <div className="h-32 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/10 rounded-2xl bg-neutral-950/20">
          <HelpCircle className="h-8 w-8 mb-1.5 opacity-30 text-neutral-400" />
          <span className="font-mono text-xs uppercase">No members in squad. Select Pokémon to analyze.</span>
        </div>
      )}

    </div>
  );
}

import { useState, useEffect, useRef } from "react";
import { Volume2, Loader2, Music, Ruler, Weight, ShieldAlert, ChevronLeft, ChevronRight } from "lucide-react";
import { fetchPokemonDetails } from "@/services/pokeapi";
import type { PokemonFullDetails } from "@/services/pokeapi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { calculateTypeMatchups } from "@/services/typeEffectiveness";
import { EvolutionTree } from "./EvolutionTree";
import { CatchSimulator } from "./CatchSimulator";
import { CardCreator } from "./CardCreator";
import { MEGA_EVOLUTIONS } from "@/services/megaEvolutions";
import { TYPE_COLORS } from "@/constants/types";

interface PokemonDetailsProps {
  pokemonIdOrName: number | string;
  onNavigate: (id: number) => void;
  isTeamMember: boolean;
  onTeamToggle: () => void;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

const STAT_LABELS: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SP.ATK",
  "special-defense": "SP.DEF",
  speed: "SPD",
};

function StatBar({ name, value, color }: { name: string; value: number; color: string }) {
  const pct = Math.round((value / 255) * 100);
  const label = STAT_LABELS[name] ?? name.toUpperCase();
  return (
    <div className="flex items-center gap-3">
      <span className="text-[10px] font-mono text-neutral-500 w-14 text-right flex-shrink-0">{label}</span>
      <div className="flex-1 h-[5px] rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-bold font-mono w-7 text-right flex-shrink-0" style={{ color }}>{value}</span>
    </div>
  );
}

export function PokemonDetails({
  pokemonIdOrName,
  onNavigate,
  isTeamMember,
  onTeamToggle,
  isFavorite,
  onFavoriteToggle,
}: PokemonDetailsProps) {
  const [details, setDetails] = useState<PokemonFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [isShiny, setIsShiny] = useState(false);
  const [imgFlash, setImgFlash] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [megaIndex, setMegaIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    let active = true;
    async function loadDetails() {
      setLoading(true);
      const res = await fetchPokemonDetails(pokemonIdOrName);
      if (active) {
        setDetails(res);
        setLoading(false);
        setActiveTab("stats");
        setIsShiny(false);
        setMegaIndex(-1);
      }
    }
    loadDetails();
    return () => {
      active = false;
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      window.speechSynthesis?.cancel();
    };
  }, [pokemonIdOrName]);

  const playCry = () => {
    if (!details?.cryUrl) return;
    if (audioRef.current) audioRef.current.pause();
    const audio = new Audio(details.cryUrl);
    audio.volume = 0.45;
    audioRef.current = audio;
    setIsPlaying(true);
    audio.play().catch(() => setIsPlaying(false));
    audio.onended = () => setIsPlaying(false);
  };

  const toggleNarration = () => {
    if (!window.speechSynthesis) return;
    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      return;
    }
    if (!details) return;
    window.speechSynthesis.cancel();
    const cleanDesc = details.description.replace(/["'""]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(
      `${details.name}. The ${details.types.join(" and ")} type Pokémon. ${cleanDesc}`
    );
    utterance.rate = 1.05;
    utterance.pitch = 0.95;
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(
      (v) => v.name.includes("Google US English") || v.name.includes("Microsoft David") || v.lang.startsWith("en")
    );
    if (preferred) utterance.voice = preferred;
    utterance.onstart = () => setIsNarrating(true);
    utterance.onend = () => setIsNarrating(false);
    utterance.onerror = () => setIsNarrating(false);
    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="h-[520px] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-9 w-9 animate-spin text-emerald-400" />
        <span className="text-xs text-neutral-500 font-mono tracking-widest">Loading entry…</span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="h-[400px] w-full flex flex-col items-center justify-center gap-3 text-neutral-500">
        <ShieldAlert className="h-12 w-12 text-rose-500/70" />
        <p className="font-mono text-sm">Failed to retrieve Pokédex entry.</p>
      </div>
    );
  }

  const megaForms = MEGA_EVOLUTIONS[details.id];
  const hasMega = megaForms && megaForms.length > 0;

  const currentName =
    megaIndex !== -1 ? megaForms[megaIndex].name : details.name;
  const currentShinyImage =
    megaIndex !== -1
      ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${megaForms[megaIndex].image.split("/").filter(Boolean).pop()}`
      : details.shinyImage;
  const currentImage = isShiny
    ? currentShinyImage
    : megaIndex !== -1
    ? megaForms[megaIndex].image
    : details.image;
  const currentTypes = megaIndex !== -1 ? megaForms[megaIndex].types : details.types;
  const primaryType = currentTypes[0] || "normal";
  const themeColor = TYPE_COLORS[primaryType] || "#A8A77A";

  const matchups = calculateTypeMatchups(currentTypes);

  const currentStats =
    megaIndex !== -1
      ? details.stats.map((s) =>
          s.name !== "hp" ? { name: s.name, value: Math.min(250, s.value + 20) } : s
        )
      : details.stats;

  const formattedId = `#${String(details.id).padStart(3, "0")}`;

  return (
    <div className="w-full text-white select-none">

      {/* ── Hero banner ── */}
      <div
        className="relative rounded-2xl overflow-hidden mb-4"
        style={{
          background: `linear-gradient(135deg, ${themeColor}28 0%, rgba(10,10,14,0.5) 55%, rgba(8,8,12,0) 100%)`,
        }}
      >
        {/* 3px type accent bar */}
        <div
          className="h-[3px] w-full"
          style={{
            background:
              currentTypes.length > 1
                ? `linear-gradient(90deg, ${TYPE_COLORS[currentTypes[0]] || themeColor}, ${TYPE_COLORS[currentTypes[1]] || themeColor})`
                : themeColor,
          }}
        />

        {/* Watermark type name */}
        <span
          className="absolute right-4 bottom-2 text-[64px] font-black uppercase tracking-tighter opacity-[0.05] pointer-events-none select-none leading-none"
          style={{ color: themeColor }}
        >
          {primaryType}
        </span>

        <div className="flex items-end gap-4 px-5 pt-4 pb-4">
          {/* Artwork */}
          <div className="relative flex-shrink-0 w-[120px] h-[120px] flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-full blur-2xl opacity-25"
              style={{ backgroundColor: themeColor }}
            />
            {megaIndex !== -1 && (
              <>
                <div className="absolute w-[110px] h-[110px] rounded-full border border-dashed border-amber-400/30 animate-[spin_12s_linear_infinite]" />
                <div className="absolute w-[125px] h-[125px] rounded-full border border-dotted border-cyan-400/15 animate-[spin_20s_linear_infinite_reverse]" />
              </>
            )}
            <img
              src={currentImage}
              alt={currentName}
              className="relative z-10 w-[108px] h-[108px] object-contain drop-shadow-xl transition-all duration-300"
              style={{
                filter: imgFlash ? "brightness(2.5) saturate(0)" : "brightness(1) saturate(1)",
              }}
            />
          </div>

          {/* Identity block */}
          <div className="flex-1 min-w-0 pb-1">
            <div className="text-[10px] font-mono text-neutral-500 mb-0.5">{formattedId}</div>
            <h2 className="text-2xl font-black capitalize leading-tight truncate">{currentName}</h2>

            {/* Type pills */}
            <div className="flex gap-1.5 mt-2 flex-wrap">
              {currentTypes.map((type) => (
                <span
                  key={type}
                  className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                  style={{
                    color: TYPE_COLORS[type] || "#fff",
                    backgroundColor: (TYPE_COLORS[type] || "#fff") + "20",
                    border: `1px solid ${(TYPE_COLORS[type] || "#fff")}40`,
                  }}
                >
                  {type}
                </span>
              ))}
            </div>

            {/* Physical attrs */}
            <div className="flex gap-4 mt-2.5">
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Ruler className="h-3 w-3 text-neutral-600" />
                {details.height} m
              </div>
              <div className="flex items-center gap-1 text-[11px] text-neutral-400">
                <Weight className="h-3 w-3 text-neutral-600" />
                {details.weight} kg
              </div>
            </div>
          </div>

          {/* Action cluster (top-right) */}
          <div className="flex flex-col gap-1.5 flex-shrink-0 self-start pt-2">
            {/* Cry */}
            {details.cryUrl && (
              <button
                onClick={playCry}
                title="Play cry"
                className={`h-7 w-7 rounded-lg border flex items-center justify-center transition-all ${
                  isPlaying
                    ? "bg-emerald-500/20 border-emerald-500/50 text-emerald-400"
                    : "bg-white/[0.05] border-white/[0.08] text-neutral-500 hover:text-white hover:border-white/20"
                }`}
              >
                {isPlaying ? (
                  <div className="flex items-end gap-[1.5px] h-3 w-3">
                    <div className="w-[2px] bg-emerald-400 animate-[bounce_0.6s_infinite_alternate]" style={{ height: "60%" }} />
                    <div className="w-[2px] bg-emerald-400 animate-[bounce_0.8s_infinite_alternate_0.2s]" style={{ height: "100%" }} />
                    <div className="w-[2px] bg-emerald-400 animate-[bounce_0.5s_infinite_alternate_0.1s]" style={{ height: "40%" }} />
                  </div>
                ) : (
                  <Volume2 className="h-3 w-3" />
                )}
              </button>
            )}

            {/* Narrate */}
            <button
              onClick={toggleNarration}
              title="Read Pokédex entry"
              className={`h-7 w-7 rounded-lg border flex items-center justify-center text-[10px] transition-all ${
                isNarrating
                  ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400 animate-pulse"
                  : "bg-white/[0.05] border-white/[0.08] text-neutral-500 hover:text-white hover:border-white/20"
              }`}
            >
              <Music className="h-3 w-3" />
            </button>

            {/* Shiny */}
            {details.shinyImage && (
              <button
                onClick={() => {
                  setImgFlash(true);
                  setTimeout(() => { setIsShiny((s) => !s); setImgFlash(false); }, 120);
                }}
                title={isShiny ? "Normal form" : "Shiny form"}
                className={`h-7 w-7 rounded-lg border flex items-center justify-center text-[11px] transition-all ${
                  isShiny
                    ? "bg-amber-400/20 border-amber-400/50 text-amber-300"
                    : "bg-white/[0.05] border-white/[0.08] text-neutral-500 hover:text-amber-300 hover:border-amber-400/30"
                }`}
              >
                ✨
              </button>
            )}
          </div>
        </div>

        {/* Controls row: mega forms + team/fav */}
        <div className="flex items-center gap-2 px-5 pb-4 flex-wrap">
          {/* Mega form buttons */}
          {hasMega && (
            <div className="flex items-center gap-1 bg-black/30 rounded-xl p-1 border border-white/[0.06]">
              <button
                onClick={() => setMegaIndex(-1)}
                className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                  megaIndex === -1
                    ? "bg-white/10 text-white"
                    : "text-neutral-500 hover:text-white"
                }`}
              >
                Base
              </button>
              {megaForms.map((form, idx) => (
                <button
                  key={idx}
                  onClick={() => setMegaIndex(idx)}
                  className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all ${
                    megaIndex === idx
                      ? "bg-amber-500/30 text-amber-300 shadow-[0_0_8px_rgba(245,158,11,0.3)]"
                      : "text-neutral-500 hover:text-amber-300"
                  }`}
                >
                  {form.name.includes(" X") ? "Mega X" : form.name.includes(" Y") ? "Mega Y" : "Mega"}
                </button>
              ))}
            </div>
          )}

          <div className="ml-auto flex gap-2">
            {/* Prev / Next navigation */}
            {details.id > 1 && (
              <button
                onClick={() => onNavigate(details.id - 1)}
                className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.05] text-neutral-500 hover:text-white hover:border-white/20 flex items-center justify-center transition-all"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
            )}
            {details.id < 1025 && (
              <button
                onClick={() => onNavigate(details.id + 1)}
                className="h-7 w-7 rounded-lg border border-white/[0.08] bg-white/[0.05] text-neutral-500 hover:text-white hover:border-white/20 flex items-center justify-center transition-all"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Team toggle */}
            <button
              onClick={onTeamToggle}
              className={`h-7 px-3 rounded-lg border text-[10px] font-bold font-mono uppercase transition-all ${
                isTeamMember
                  ? "bg-rose-500/15 border-rose-500/40 text-rose-400"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {isTeamMember ? "− Team" : "+ Team"}
            </button>

            {/* Favorite */}
            <button
              onClick={onFavoriteToggle}
              className={`h-7 w-7 rounded-lg border flex items-center justify-center text-sm transition-all ${
                isFavorite
                  ? "bg-rose-500/20 border-rose-500/40 text-rose-400"
                  : "bg-white/[0.05] border-white/[0.08] text-neutral-500 hover:text-rose-400 hover:border-rose-400/30"
              }`}
            >
              {isFavorite ? "♥" : "♡"}
            </button>
          </div>
        </div>
      </div>

      {/* ── Description ── */}
      <div className="flex items-start gap-3 mb-4 px-1">
        <p className="flex-1 text-xs text-neutral-400 leading-relaxed italic">
          "{details.description}"
        </p>
      </div>

      {/* ── Tabs ── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full grid grid-cols-6 mb-4">
          <TabsTrigger value="stats" className="text-[11px]">Stats</TabsTrigger>
          <TabsTrigger value="matchup" className="text-[11px]">Types</TabsTrigger>
          <TabsTrigger value="evolutions" className="text-[11px]">Evo</TabsTrigger>
          <TabsTrigger value="abilities" className="text-[11px]">Abilities</TabsTrigger>
          <TabsTrigger value="moves" className="text-[11px]">Moves</TabsTrigger>
          <TabsTrigger value="catch" className="text-[11px]">Catch</TabsTrigger>
        </TabsList>

        {/* Stats — horizontal bars */}
        <TabsContent value="stats" className="focus:outline-none space-y-2.5 px-1">
          {currentStats.map((stat) => (
            <StatBar key={stat.name} name={stat.name} value={stat.value} color={themeColor} />
          ))}
          <div className="mt-3 pt-3 border-t border-white/[0.05] flex justify-between items-center">
            <span className="text-[10px] font-mono text-neutral-600">BASE TOTAL</span>
            <span className="text-sm font-black" style={{ color: themeColor }}>
              {currentStats.reduce((sum, s) => sum + s.value, 0)}
            </span>
          </div>
        </TabsContent>

        {/* Type matchups */}
        <TabsContent value="matchup" className="focus:outline-none space-y-3 px-1">
          {[
            { label: "Weak to", items: matchups.weaknesses, color: "#f87171" },
            { label: "Resists", items: matchups.resistances, color: "#34d399" },
            ...(matchups.immunities.length > 0
              ? [{ label: "Immune", items: matchups.immunities.map((t) => ({ type: t, multiplier: 0 })), color: "#60a5fa" }]
              : []),
          ].map(({ label, items, color }) => (
            <div key={label}>
              <span className="block text-[9px] uppercase font-mono tracking-widest mb-1.5" style={{ color }}>
                {label}
              </span>
              {items.length === 0 ? (
                <span className="text-[11px] text-neutral-600 font-mono">None</span>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {items.map((w) => (
                    <span
                      key={"type" in w ? w.type : w}
                      className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                      style={{
                        color,
                        backgroundColor: color + "18",
                        border: `1px solid ${color}35`,
                      }}
                    >
                      {"type" in w ? w.type : w}
                      {"multiplier" in w && w.multiplier !== 0 && w.multiplier !== 1 && (
                        <span className="ml-1 opacity-70">
                          {w.multiplier > 1 ? `${w.multiplier}×` : `${w.multiplier}×`}
                        </span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </TabsContent>

        {/* Evolutions */}
        <TabsContent value="evolutions" className="focus:outline-none">
          {details.evolutionTree.nodes.length <= 1 ? (
            <div className="h-32 flex flex-col items-center justify-center text-neutral-500">
              <span className="text-xs font-mono">This Pokémon does not evolve.</span>
            </div>
          ) : (
            <EvolutionTree
              treeData={details.evolutionTree}
              activeId={details.id}
              onNavigate={onNavigate}
            />
          )}
        </TabsContent>

        {/* Abilities */}
        <TabsContent value="abilities" className="space-y-2 focus:outline-none">
          {details.abilities.map((ability) => (
            <div
              key={ability.name}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/[0.06]"
            >
              <span className="capitalize text-sm font-semibold text-neutral-200">
                {ability.name.replace(/-/g, " ")}
              </span>
              <span
                className={`text-[9px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${
                  ability.isHidden
                    ? "text-rose-400 bg-rose-500/10 border-rose-500/20"
                    : "text-neutral-500 bg-neutral-800/60 border-neutral-700/40"
                }`}
              >
                {ability.isHidden ? "Hidden" : "Standard"}
              </span>
            </div>
          ))}
        </TabsContent>

        {/* Moves */}
        <TabsContent value="moves" className="focus:outline-none">
          {details.moves.length === 0 ? (
            <div className="h-32 flex items-center justify-center text-neutral-600 text-xs font-mono">
              No level-up moves registered.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-1.5 max-h-[200px] overflow-y-auto pr-1">
              {details.moves.map((move) => (
                <div
                  key={move.name}
                  className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.05] text-[11px]"
                >
                  <span className="capitalize font-semibold text-neutral-300 truncate pr-2">
                    {move.name.replace(/-/g, " ")}
                  </span>
                  <span className="font-mono text-[9px] text-neutral-600 flex-shrink-0">
                    Lv {move.level}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Catch simulator */}
        <TabsContent value="catch" className="focus:outline-none">
          <CatchSimulator
            pokemonName={currentName}
            captureRate={details.captureRate}
            pokemonImage={currentImage}
            isActive={activeTab === "catch"}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

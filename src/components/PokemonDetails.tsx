import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Volume2, Loader2, Music, Ruler, Weight, ShieldAlert } from "lucide-react";
import { fetchPokemonDetails } from "@/services/pokeapi";
import type { PokemonFullDetails } from "@/services/pokeapi";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { calculateTypeMatchups } from "@/services/typeEffectiveness";
import { RadarChart } from "./RadarChart";
import { EvolutionTree } from "./EvolutionTree";
import { CatchSimulator } from "./CatchSimulator";
import { CardCreator } from "./CardCreator";
import { MEGA_EVOLUTIONS } from "@/services/megaEvolutions";

interface PokemonDetailsProps {
  pokemonIdOrName: number | string;
  onNavigate: (id: number) => void;
  isTeamMember: boolean;
  onTeamToggle: () => void;
  isFavorite: boolean;
  onFavoriteToggle: () => void;
}

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



export function PokemonDetails({ pokemonIdOrName, onNavigate, isTeamMember, onTeamToggle, isFavorite, onFavoriteToggle }: PokemonDetailsProps) {
  const [details, setDetails] = useState<PokemonFullDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeTab, setActiveTab] = useState("stats");
  const [isShiny, setIsShiny] = useState(false);
  const [isNarrating, setIsNarrating] = useState(false);
  const [megaIndex, setMegaIndex] = useState(-1);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Fetch details when ID/name changes
  useEffect(() => {
    let active = true;
    async function loadDetails() {
      setLoading(true);
      const res = await fetchPokemonDetails(pokemonIdOrName);
      if (active) {
        setDetails(res);
        setLoading(false);
        setActiveTab("stats"); // Reset to stats tab
        setIsShiny(false); // Reset shiny toggle
        setMegaIndex(-1); // Reset mega index
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

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(details.cryUrl);
    audio.volume = 0.45;
    audioRef.current = audio;

    setIsPlaying(true);
    audio.play().catch((err) => {
      console.error("Audio cry blocked or failed:", err);
      setIsPlaying(false);
    });

    audio.onended = () => {
      setIsPlaying(false);
    };
  };

  const toggleNarration = () => {
    if (!window.speechSynthesis) {
      alert("Text-to-speech voice narration is not supported in this browser.");
      return;
    }

    if (isNarrating) {
      window.speechSynthesis.cancel();
      setIsNarrating(false);
      return;
    }

    window.speechSynthesis.cancel();

    if (!details) return;

    // Clean details text description for TTS compatibility
    const cleanDesc = details.description.replace(/["'“”]/g, "").trim();
    const typeLabel = details.types.join(" and ");
    const textToSpeak = `${details.name}. The ${typeLabel} type Pokémon. ${cleanDesc}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.05; // Slightly faster for retro Pokédex flow
    utterance.pitch = 0.95; // Slightly lower pitch for robotic narrator flavor

    const voices = window.speechSynthesis.getVoices();
    // Try to choose standard English voice or narrator voices
    const preferredVoice = voices.find(
      (v) => 
        v.name.includes("Google US English") || 
        v.name.includes("Microsoft David") || 
        v.name.includes("Zira") || 
        v.lang.startsWith("en")
    );
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.onstart = () => {
      setIsNarrating(true);
    };

    utterance.onend = () => {
      setIsNarrating(false);
    };

    utterance.onerror = () => {
      setIsNarrating(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  if (loading) {
    return (
      <div className="h-[480px] w-full flex flex-col items-center justify-center gap-3">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-400" />
        <span className="text-sm text-neutral-400 font-mono tracking-wider">
          Retrieving Dex Entry...
        </span>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="h-[400px] w-full flex flex-col items-center justify-center gap-3 text-neutral-500">
        <ShieldAlert className="h-12 w-12 text-rose-500/80" />
        <p className="font-mono text-sm">Failed to retrieve database records.</p>
      </div>
    );
  }

  const megaForms = MEGA_EVOLUTIONS[details.id];
  const hasMega = megaForms && megaForms.length > 0;

  const currentName = (details && megaIndex !== -1) ? megaForms[megaIndex].name : (details?.name || "");
  const currentShinyImage = (details && megaIndex !== -1)
    ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/shiny/${megaForms[megaIndex].image.split("/").filter(Boolean).pop()}`
    : (details?.shinyImage || "");
  const currentImage = isShiny 
    ? currentShinyImage
    : ((details && megaIndex !== -1) ? megaForms[megaIndex].image : (details?.image || ""));
  
  const currentTypes = (details && megaIndex !== -1) ? megaForms[megaIndex].types : (details?.types || []);
  const primaryType = currentTypes[0] || "normal";
  const themeColor = typeColors[primaryType] || typeColors.normal;
  const matchups = calculateTypeMatchups(currentTypes);
  
  const currentStats = (details && megaIndex !== -1)
    ? details.stats.map((s) => {
        if (s.name !== "hp") {
          return { name: s.name, value: Math.min(250, s.value + 20) };
        }
        return s;
      })
    : (details?.stats || []);

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 w-full text-white mt-4 select-none">
      
      {/* Left Column: Visual Profile */}
      <div className="md:col-span-5 flex flex-col items-center border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
        
        {/* Glowing Art / Hologram Area */}
        <div className="relative w-64 h-64 flex items-center justify-center mb-2 overflow-hidden rounded-2xl bg-white/[0.01] border border-white/5">
          <div
            className="absolute inset-0 rounded-full blur-[50px] opacity-20 transition-all duration-300"
            style={{ backgroundColor: themeColor }}
          />
          <img
            ref={imageRef}
            src={currentImage}
            alt={currentName}
            className="w-44 h-44 object-contain z-10 filter drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]"
          />
        </div>

        {/* Name, Type & Cry Controls */}
        <h2 className="text-3xl font-extrabold capitalize tracking-tight mb-1 mt-2 text-center">
          {currentName}
        </h2>
        <div className="flex gap-2 mb-3">
          {currentTypes.map((type) => (
            <span
              key={type}
              className="text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border border-white/10 bg-white/5"
              style={{ color: typeColors[type] }}
            >
              {type}
            </span>
          ))}
        </div>

        {/* Shiny & Mega Controls Row */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-4 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
          {/* Shiny Toggle Slider */}
          {details?.shinyImage && (
            <div className="flex items-center gap-2">
              <span>Normal</span>
              <button
                onClick={() => {
                  const nextState = !isShiny;
                  setIsShiny(nextState);
                  if (imageRef.current) {
                    gsap.fromTo(
                      imageRef.current,
                      { filter: "brightness(2.2) contrast(1.2)", scale: 0.95 },
                      { filter: "brightness(1) contrast(1)", scale: 1, duration: 0.4, ease: "power2.out" }
                    );
                  }
                }}
                className={`relative w-8 h-4 rounded-full border transition-colors duration-200 ${
                  isShiny ? "bg-amber-400 border-amber-500" : "bg-neutral-800 border-neutral-700"
                }`}
              >
                <div
                  className={`absolute top-[2px] w-2.5 h-2.5 rounded-full bg-white transition-all duration-200 ${
                    isShiny ? "left-[16px]" : "left-[3px]"
                  }`}
                />
              </button>
              <span className={isShiny ? "text-amber-400 font-bold" : ""}>Shiny ✨</span>
            </div>
          )}

          {/* Mega Form Toggle Segmented Buttons */}
          {hasMega && (
            <div className="flex items-center gap-2">
              <span>Form</span>
              <div className="flex gap-1 bg-neutral-900 border border-neutral-800 p-0.5 rounded-lg">
                <button
                  onClick={() => setMegaIndex(-1)}
                  className={`px-1.5 py-0.5 rounded text-[8px] transition-all duration-200 ${
                    megaIndex === -1 ? "bg-cyan-500 text-white font-bold" : "text-neutral-400 hover:text-white"
                  }`}
                >
                  Base
                </button>
                {megaForms.map((form, idx) => (
                  <button
                    key={idx}
                    onClick={() => setMegaIndex(idx)}
                    className={`px-1.5 py-0.5 rounded text-[8px] transition-all duration-200 ${
                      megaIndex === idx ? "bg-amber-500 text-white font-bold shadow-[0_0_6px_rgba(245,158,11,0.4)]" : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {form.name.includes(" X") ? "Mega X" : form.name.includes(" Y") ? "Mega Y" : "Mega"}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Vocal Cry & Squad Deploy Buttons */}
        <div className="flex flex-wrap gap-2 justify-center mb-6">
          {details.cryUrl && (
            <button
              onClick={playCry}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-white/10 bg-neutral-900/60 hover:bg-neutral-800/80 hover:border-white/20 transition-all duration-200 group text-xs font-mono font-semibold"
            >
              {isPlaying ? (
                <>
                  <div className="flex items-end gap-[2px] h-3 w-3.5 mb-0.5">
                    <div className="w-[2.5px] bg-emerald-400 animate-[bounce_0.6s_infinite_alternate]" />
                    <div className="w-[2.5px] bg-emerald-400 animate-[bounce_0.8s_infinite_alternate_0.2s]" />
                    <div className="w-[2.5px] bg-emerald-400 animate-[bounce_0.5s_infinite_alternate_0.1s]" />
                  </div>
                  <span className="text-emerald-400">Playing...</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white transition-colors duration-200" />
                  <span className="text-neutral-300 group-hover:text-white">Hear Cry</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={onTeamToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 group text-xs font-mono font-semibold ${
              isTeamMember
                ? "bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20 hover:border-rose-500/30 text-rose-400"
                : "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20 hover:border-emerald-500/30 text-emerald-400"
            }`}
          >
            <span>{isTeamMember ? "Remove from Team" : "Add to Team"}</span>
          </button>

          <button
            onClick={onFavoriteToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all duration-200 group text-xs font-mono font-semibold ${
              isFavorite
                ? "bg-rose-500/25 border-rose-500/40 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.15)] font-bold"
                : "bg-neutral-900/60 border-white/10 text-neutral-400 hover:text-white hover:border-white/20"
            }`}
          >
            <span className={isFavorite ? "text-rose-400" : "text-neutral-400"}>♥</span>
            <span>{isFavorite ? "Favorited" : "Favorite"}</span>
          </button>
        </div>

        {/* Physical Attributes Grid */}
        <div className="grid grid-cols-2 gap-4 w-full max-w-[280px] bg-white/5 border border-white/5 rounded-xl p-3 text-center mb-4">
          <div className="flex flex-col items-center gap-1 border-r border-white/5">
            <Ruler className="h-4 w-4 text-neutral-400" />
            <span className="text-[10px] uppercase font-mono text-neutral-500">Height</span>
            <span className="text-sm font-semibold">{details.height} m</span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <Weight className="h-4 w-4 text-neutral-400" />
            <span className="text-[10px] uppercase font-mono text-neutral-500">Weight</span>
            <span className="text-sm font-semibold">{details.weight} kg</span>
          </div>
        </div>
      </div>

      {/* Right Column: Information & Details Tabs */}
      <div className="md:col-span-7 flex flex-col justify-start">
        
        {/* Flavor text description */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <p className="text-xs text-neutral-300 leading-relaxed italic flex-grow">
            "{details.description}"
          </p>
          <button
            onClick={toggleNarration}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-mono text-[10px] font-bold uppercase transition-all duration-300 ${
              isNarrating
                ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400 animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.3)]"
                : "bg-neutral-900 border-white/5 hover:bg-neutral-800 text-neutral-400 hover:text-white"
            }`}
          >
            {isNarrating ? (
              <>
                <div className="flex items-end gap-[1.5px] h-2.5 w-3 mb-0.5">
                  <div className="w-[2px] bg-cyan-400 animate-[bounce_0.5s_infinite_alternate]" />
                  <div className="w-[2px] bg-cyan-400 animate-[bounce_0.7s_infinite_alternate_0.1s]" />
                  <div className="w-[2px] bg-cyan-400 animate-[bounce_0.4s_infinite_alternate_0.2s]" />
                </div>
                <span>Mute Entry</span>
              </>
            ) : (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span>Read Entry</span>
              </>
            )}
          </button>
        </div>

        {/* Type Matchups Weakness Calculator */}
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 mb-6">
          <span className="block text-[9px] uppercase font-mono tracking-wider text-neutral-500 mb-2.5">
            Type Damage Matchups
          </span>
          <div className="space-y-2 text-[10px] font-mono">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] text-rose-400 uppercase w-14">Weak (2x+):</span>
              {matchups.weaknesses.length === 0 ? (
                <span className="text-neutral-500 text-[9px]">None</span>
              ) : (
                matchups.weaknesses.map((w) => (
                  <span
                    key={w.type}
                    className="px-2 py-0.5 rounded border border-rose-500/20 bg-rose-500/10 text-rose-400 uppercase font-bold text-[9px]"
                  >
                    {w.type} {w.multiplier > 2 && `${w.multiplier}x`}
                  </span>
                ))
              )}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[9px] text-emerald-400 uppercase w-14">Resist:</span>
              {matchups.resistances.length === 0 ? (
                <span className="text-neutral-500 text-[9px]">None</span>
              ) : (
                matchups.resistances.map((r) => (
                  <span
                    key={r.type}
                    className="px-2 py-0.5 rounded border border-emerald-500/20 bg-emerald-500/10 text-emerald-400 uppercase font-bold text-[9px]"
                  >
                    {r.type} {r.multiplier < 0.5 && `${r.multiplier}x`}
                  </span>
                ))
              )}
            </div>
            {matchups.immunities.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[9px] text-cyan-400 uppercase w-14">Immune:</span>
                {matchups.immunities.map((imm) => (
                  <span
                    key={imm}
                    className="px-2 py-0.5 rounded border border-cyan-500/20 bg-cyan-500/10 text-cyan-400 uppercase font-bold text-[9px]"
                  >
                    {imm}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Tabs section */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full flex overflow-x-auto gap-1 mb-4 sm:grid sm:grid-cols-6 scrollbar-none">
            <TabsTrigger value="stats" className="flex-shrink-0 sm:flex-shrink px-2.5 py-1 text-[10px] sm:text-xs md:text-sm">Stats</TabsTrigger>
            <TabsTrigger value="evolutions" className="flex-shrink-0 sm:flex-shrink px-2.5 py-1 text-[10px] sm:text-xs md:text-sm">Evo</TabsTrigger>
            <TabsTrigger value="abilities" className="flex-shrink-0 sm:flex-shrink px-2.5 py-1 text-[10px] sm:text-xs md:text-sm">Abils</TabsTrigger>
            <TabsTrigger value="moves" className="flex-shrink-0 sm:flex-shrink px-2.5 py-1 text-[10px] sm:text-xs md:text-sm">Moves</TabsTrigger>
            <TabsTrigger value="capture" className="flex-shrink-0 sm:flex-shrink px-2.5 py-1 text-[10px] sm:text-xs md:text-sm">Catch</TabsTrigger>
            <TabsTrigger value="card" className="flex-shrink-0 sm:flex-shrink px-2.5 py-1 text-[10px] sm:text-xs md:text-sm">Card</TabsTrigger>
          </TabsList>

          {/* Stats Tab Content */}
          <TabsContent value="stats" className="focus:outline-none flex justify-center">
            <RadarChart stats={currentStats} color={themeColor} />
          </TabsContent>

          {/* Evolutions Tab Content (branching SVG tree) */}
          <TabsContent value="evolutions" className="focus:outline-none">
            {details.evolutionTree.nodes.length <= 1 ? (
              <div className="h-32 flex flex-col items-center justify-center text-neutral-500">
                <Music className="h-8 w-8 mb-2 opacity-30" />
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

          {/* Abilities Tab Content */}
          <TabsContent value="abilities" className="space-y-3 focus:outline-none">
            {details.abilities.map((ability) => (
              <div
                key={ability.name}
                className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-sm"
              >
                <span className="capitalize font-bold tracking-tight text-neutral-200">
                  {ability.name.replace("-", " ")}
                </span>
                {ability.isHidden ? (
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-rose-400/90 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                    Hidden Ability
                  </span>
                ) : (
                  <span className="text-[10px] uppercase font-mono tracking-wider font-bold text-neutral-400 bg-neutral-500/10 px-2 py-0.5 rounded border border-neutral-500/20">
                    Standard
                  </span>
                )}
              </div>
            ))}
          </TabsContent>

          {/* Moves Tab Content */}
          <TabsContent value="moves" className="focus:outline-none">
            {details.moves.length === 0 ? (
              <div className="h-32 flex flex-col items-center justify-center text-neutral-500">
                <Music className="h-8 w-8 mb-2 opacity-30" />
                <span className="text-xs font-mono">No level-up moves registered.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 max-h-[170px] overflow-y-auto pr-1">
                {details.moves.map((move) => (
                  <div
                    key={move.name}
                    className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-[11px]"
                  >
                    <span className="capitalize font-semibold text-neutral-200 truncate pr-2">
                      {move.name}
                    </span>
                    <span className="font-mono text-[9px] text-neutral-400 bg-neutral-900 border border-white/5 px-2 py-0.5 rounded flex-shrink-0">
                      Lvl {move.level}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Capture Simulator Tab Content */}
          <TabsContent value="capture" className="focus:outline-none">
            <CatchSimulator
              pokemonName={currentName}
              captureRate={details.captureRate}
              pokemonImage={currentImage}
              isActive={activeTab === "capture"}
            />
          </TabsContent>

          {/* Foil Card Creator Tab Content */}
          <TabsContent value="card" className="focus:outline-none">
            <CardCreator
              pokemon={{
                id: details.id,
                name: currentName,
                types: currentTypes,
                image: currentImage,
                shinyImage: currentShinyImage,
                stats: currentStats,
                description: details.description,
                moves: details.moves,
              }}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

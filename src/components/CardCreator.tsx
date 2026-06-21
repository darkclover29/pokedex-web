import { useState, useRef } from "react";
import gsap from "gsap";
import html2canvas from "html2canvas";
import { Download, Sparkles, RefreshCw, Layers, X } from "lucide-react";

interface PokemonCardData {
  id: number;
  name: string;
  types: string[];
  image: string;
  shinyImage: string;
  stats: { name: string; value: number }[];
  description: string;
  moves?: { name: string; level: number }[];
}

interface CardCreatorProps {
  pokemon: PokemonCardData;
  onClose?: () => void;
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

const foilGradients: Record<string, string> = {
  rainbow: "linear-gradient(115deg, rgba(255,0,0,0.3) 0%, rgba(255,255,0,0.3) 20%, rgba(0,255,0,0.3) 40%, rgba(0,255,255,0.3) 60%, rgba(0,0,255,0.3) 80%, rgba(255,0,255,0.3) 100%)",
  starfield: "radial-gradient(circle at 50% 50%, rgba(255,255,255,0.2) 0%, rgba(255,200,255,0.1) 40%, rgba(0,0,0,0) 80%), repeating-linear-gradient(45deg, rgba(255,0,255,0.1) 0px, rgba(255,0,255,0.1) 10px, rgba(0,255,255,0.1) 10px, rgba(0,255,255,0.1) 20px)",
  golden: "linear-gradient(135deg, rgba(253,224,71,0.4) 0%, rgba(234,179,8,0.15) 30%, rgba(253,224,71,0.4) 60%, rgba(202,138,4,0.2) 100%)",
};

const cardThemeGradients: Record<string, string> = {
  fire: "from-amber-600/90 via-orange-700 to-red-950",
  water: "from-sky-700/90 via-blue-800 to-slate-950",
  grass: "from-emerald-700/90 via-green-800 to-stone-950",
  electric: "from-yellow-600/60 via-amber-800 to-neutral-950",
  psychic: "from-purple-800/80 via-indigo-950 to-neutral-950",
  normal: "from-neutral-600/80 via-stone-700 to-neutral-950",
  fighting: "from-red-800/80 via-orange-950 to-neutral-950",
  poison: "from-fuchsia-800/80 via-purple-950 to-neutral-950",
  ground: "from-yellow-700/80 via-amber-950 to-neutral-950",
  rock: "from-amber-800/80 via-stone-950 to-neutral-950",
  ice: "from-cyan-700/80 via-slate-900 to-neutral-950",
  bug: "from-lime-700/80 via-stone-900 to-neutral-950",
  ghost: "from-indigo-800/80 via-purple-950 to-neutral-950",
  dragon: "from-indigo-700/80 via-violet-950 to-neutral-950",
  dark: "from-zinc-800/80 via-neutral-950 to-neutral-950",
  steel: "from-slate-600/80 via-zinc-800 to-neutral-950",
  fairy: "from-rose-500/80 via-pink-950 to-neutral-950",
  flying: "from-sky-500/80 via-indigo-950 to-neutral-950"
};

const renderEnergyIcon = (type: string, className = "w-3 h-3") => {
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
};

const getCardMoveDetails = (moveName: string, pokemonTypes: string[]) => {
  let type = pokemonTypes[0] || "normal";
  const nameLower = moveName.toLowerCase();
  
  if (nameLower.includes("fire") || nameLower.includes("ember") || nameLower.includes("flame") || nameLower.includes("blast") || nameLower.includes("spin")) type = "fire";
  else if (nameLower.includes("water") || nameLower.includes("surf") || nameLower.includes("hydro") || nameLower.includes("bubble") || nameLower.includes("pump")) type = "water";
  else if (nameLower.includes("thunder") || nameLower.includes("bolt") || nameLower.includes("spark") || nameLower.includes("shock") || nameLower.includes("wave")) type = "electric";
  else if (nameLower.includes("grass") || nameLower.includes("vine") || nameLower.includes("leaf") || nameLower.includes("seed") || nameLower.includes("solar") || nameLower.includes("powder")) type = "grass";
  else if (nameLower.includes("ice") || nameLower.includes("beam") || nameLower.includes("blizzard") || nameLower.includes("hail")) type = "ice";
  else if (nameLower.includes("poison") || nameLower.includes("sludge") || nameLower.includes("toxic") || nameLower.includes("acid")) type = "poison";
  else if (nameLower.includes("ground") || nameLower.includes("earth") || nameLower.includes("quake") || nameLower.includes("mud") || nameLower.includes("dig")) type = "ground";
  else if (nameLower.includes("fly") || nameLower.includes("wing") || nameLower.includes("gust") || nameLower.includes("peck") || nameLower.includes("sky")) type = "flying";
  else if (nameLower.includes("psych") || nameLower.includes("mind") || nameLower.includes("confusion") || nameLower.includes("hypno")) type = "psychic";
  else if (nameLower.includes("bug") || nameLower.includes("bite") || nameLower.includes("leech") || nameLower.includes("string")) type = "bug";
  else if (nameLower.includes("rock") || nameLower.includes("stone") || nameLower.includes("slide") || nameLower.includes("tomb")) type = "rock";
  else if (nameLower.includes("shadow") || nameLower.includes("ghost") || nameLower.includes("lick") || nameLower.includes("confuse")) type = "ghost";
  else if (nameLower.includes("dragon") || nameLower.includes("claw") || nameLower.includes("outrage") || nameLower.includes("rage")) type = "dragon";
  else if (nameLower.includes("bite") || nameLower.includes("crunch") || nameLower.includes("dark") || nameLower.includes("sucker")) type = "dark";
  else if (nameLower.includes("iron") || nameLower.includes("steel") || nameLower.includes("metal") || nameLower.includes("flash")) type = "steel";
  else if (nameLower.includes("fairy") || nameLower.includes("moon") || nameLower.includes("charm") || nameLower.includes("pixie")) type = "fairy";
  else if (nameLower.includes("double") || nameLower.includes("tackle") || nameLower.includes("scratch") || nameLower.includes("pound") || nameLower.includes("slam") || nameLower.includes("slash")) type = "normal";

  let power = 30 + (moveName.length % 6) * 15;
  if (nameLower.includes("hyper") || nameLower.includes("blast") || nameLower.includes("earthquake") || nameLower.includes("hydro") || nameLower.includes("solar") || nameLower.includes("outrage")) {
    power = 120;
  } else if (nameLower.includes("tackle") || nameLower.includes("scratch") || nameLower.includes("growl") || nameLower.includes("absorb") || nameLower.includes("pound")) {
    power = 20;
  }

  return { name: moveName, type, power };
};

export function CardCreator({ pokemon, onClose }: CardCreatorProps) {
  const [cardName, setCardName] = useState(pokemon.name);
  const [cardHp, setCardHp] = useState(
    pokemon.stats.find((s) => s.name === "hp")?.value || 70
  );
  const [rarity, setRarity] = useState<"normal" | "rare" | "ultra">("rare");
  const [foilType, setFoilType] = useState<"rainbow" | "starfield" | "golden">("rainbow");
  const [foilOpacity, setFoilOpacity] = useState(50);
  const [customText, setCustomText] = useState(
    pokemon.description.substring(0, 90) + (pokemon.description.length > 90 ? "..." : "")
  );
  const [isShinyCard, setIsShinyCard] = useState(false);
  const [exporting, setExporting] = useState(false);

  const cardRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);

  // GSAP 3D Tilt Effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    const sheen = sheenRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    const rotateX = ((centerY - y) / centerY) * 12;
    const rotateY = ((x - centerX) / centerX) * 12;

    gsap.to(card, {
      rotateX: rotateX,
      rotateY: rotateY,
      duration: 0.15,
      ease: "power2.out",
      transformPerspective: 1000,
    });

    if (sheen) {
      const px = (x / rect.width) * 100;
      const py = (y / rect.height) * 100;
      
      gsap.to(sheen, {
        backgroundPosition: `${px}% ${py}%`,
        opacity: (foilOpacity / 100) * 0.85,
        duration: 0.15,
        ease: "power2.out",
      });
    }
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    const sheen = sheenRef.current;
    if (!card) return;

    gsap.to(card, {
      rotateX: 0,
      rotateY: 0,
      duration: 0.5,
      ease: "power2.out",
    });

    if (sheen) {
      gsap.to(sheen, {
        opacity: 0,
        duration: 0.5,
        ease: "power2.out",
      });
    }
  };

  // Trigger Download as PNG
  const downloadCardPng = async () => {
    const card = cardRef.current;
    if (!card) return;

    setExporting(true);
    gsap.set(card, { rotateX: 0, rotateY: 0 });

    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      const canvas = await html2canvas(card, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 2,
        logging: false,
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `poke-card-${cardName.toLowerCase()}.png`;
      link.click();
    } catch (error) {
      console.error("Foil card export generation failed:", error);
    } finally {
      setExporting(false);
    }
  };

  const primaryType = pokemon.types[0] || "normal";
  const themeColor = typeColors[primaryType] || typeColors.normal;
  const bgGradient = cardThemeGradients[primaryType] || cardThemeGradients.normal;

  // Extract actual moves if passed
  const movesList = pokemon.moves && pokemon.moves.length > 0 ? pokemon.moves : [];
  const rawMove1 = movesList[0]?.name || "Tackle";
  const rawMove2 = movesList.length > 1 
    ? movesList[Math.min(3, movesList.length - 1)]?.name 
    : "Elemental Burst";

  const move1 = getCardMoveDetails(rawMove1, pokemon.types);
  const move2 = getCardMoveDetails(rawMove2, pokemon.types);

  return (
    <div className="w-full text-white select-none flex flex-col items-center gap-6 p-1">
      
      {/* Top: Rendered Interactive Trading Card */}
      <div className="w-full flex flex-col items-center justify-center min-h-[440px] relative">
        <span className="text-[10px] font-mono uppercase text-neutral-500 tracking-wider mb-2">
          Hover Card to Shine & Tilt
        </span>

        {/* 3D Perspective Wrapper */}
        <div className="relative group w-[310px] h-[430px] preserve-3d">
          
          {/* Card Body - Styled like a physical retro card */}
          <div
            ref={cardRef}
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            className={`w-full h-full rounded-2xl relative flex flex-col p-[11px] border-[11px] overflow-hidden shadow-2xl transition-shadow select-none bg-gradient-to-b ${bgGradient}`}
            style={{
              borderColor: rarity === "ultra" ? "#fbbf24" : rarity === "rare" ? "#d1d5db" : "#9ca3af",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.65), inset 0 0 10px rgba(0,0,0,0.5)"
            }}
          >
            {/* Holographic Sheen Layer */}
            {rarity !== "normal" && (
              <div
                ref={sheenRef}
                className="absolute inset-0 pointer-events-none mix-blend-color-dodge opacity-0 transition-opacity duration-300 z-30"
                style={{
                  background: foilGradients[foilType],
                  backgroundSize: "200% 200%",
                }}
              />
            )}

            {/* Glowing borders on Rare/Ultra cards */}
            {rarity === "ultra" && (
              <div className="absolute inset-0 border border-amber-400/40 rounded pointer-events-none z-20 animate-pulse" />
            )}

            {/* Card Header */}
            <div className="flex justify-between items-center mb-1 z-10 px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[8px] font-extrabold font-sans text-amber-300 uppercase tracking-wider">
                  Basic
                </span>
                <h3 className="text-base font-black tracking-tight capitalize text-white filter drop-shadow-[1px_1px_1px_rgba(0,0,0,0.7)]">
                  {cardName}
                </h3>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-rose-500 font-sans filter drop-shadow-[1px_1px_1px_rgba(0,0,0,0.7)]">
                  HP {cardHp}
                </span>
                <div
                  className="w-4 h-4 rounded-full border border-black/40 shadow-[inset_0_1px_2px_rgba(255,255,255,0.4)] flex items-center justify-center text-[8px] uppercase font-bold text-neutral-900"
                  style={{ backgroundColor: themeColor }}
                >
                  {renderEnergyIcon(primaryType, "w-2.5 h-2.5")}
                </div>
              </div>
            </div>

            {/* Artwork Window Container with Gold Border */}
            <div
              className={`w-full h-[160px] rounded border-4 flex items-center justify-center relative overflow-hidden shadow-[inset_0_0_10px_rgba(0,0,0,0.8)] ${
                rarity === "ultra"
                  ? "border-amber-400/80 bg-gradient-to-b from-amber-500/10 to-neutral-950"
                  : "border-amber-600/40 bg-gradient-to-b from-neutral-900 to-neutral-950"
              }`}
            >
              {/* Custom sparkles behind Pokemon */}
              {rarity !== "normal" && (
                <div className="absolute inset-0 opacity-25 pointer-events-none flex flex-wrap gap-6 p-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Sparkles key={i} className="h-4 w-4 text-amber-100 animate-pulse" />
                  ))}
                </div>
              )}

              <img
                src={isShinyCard ? pokemon.shinyImage : pokemon.image}
                alt={cardName}
                className="w-32 h-32 object-contain z-10 filter drop-shadow-[0_8px_12px_rgba(0,0,0,0.8)]"
              />
            </div>

            {/* Description Info Ribbon */}
            <div className="bg-gradient-to-r from-amber-500/40 via-yellow-600/30 to-amber-500/40 border-y border-amber-500/30 px-2 py-0.5 my-1.5 flex justify-between items-center text-[7px] font-mono text-neutral-300 font-bold uppercase tracking-wider z-10 shadow-sm">
              <span>NO. {pokemon.id}</span>
              <span className="capitalize">{pokemon.types.join(" / ")} Pokémon</span>
            </div>

            {/* Attack Moves Block (TCG-Style) */}
            <div className="flex-grow flex flex-col justify-center gap-2 font-sans py-0.5 z-10">
              
              {/* Attack 1 */}
              <div className="flex justify-between items-center text-xs pb-1 border-b border-black/15">
                <div className="flex items-center gap-2">
                  {/* Move Cost icons */}
                  <div className="flex gap-0.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                      {renderEnergyIcon(move1.type, "w-2.5 h-2.5")}
                    </div>
                  </div>
                  <span className="font-bold text-neutral-100 capitalize text-[11px] filter drop-shadow-[1px_1px_rgba(0,0,0,0.5)]">
                    {move1.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-neutral-200 text-xs filter drop-shadow-[1px_1px_rgba(0,0,0,0.5)]">
                  {move1.power}
                </span>
              </div>

              {/* Attack 2 */}
              <div className="flex justify-between items-center text-xs pb-1 border-b border-black/15">
                <div className="flex items-center gap-2">
                  {/* Move Cost icons */}
                  <div className="flex gap-0.5">
                    <div className="w-3.5 h-3.5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                      {renderEnergyIcon(move2.type, "w-2.5 h-2.5")}
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                      {renderEnergyIcon(move2.type, "w-2.5 h-2.5")}
                    </div>
                    <div className="w-3.5 h-3.5 rounded-full bg-black/40 border border-white/10 flex items-center justify-center">
                      {renderEnergyIcon("normal", "w-2.5 h-2.5")}
                    </div>
                  </div>
                  <span className="font-bold text-neutral-100 capitalize text-[11px] filter drop-shadow-[1px_1px_rgba(0,0,0,0.5)]">
                    {move2.name}
                  </span>
                </div>
                <span className="font-mono font-bold text-neutral-200 text-xs filter drop-shadow-[1px_1px_rgba(0,0,0,0.5)]">
                  {move2.power}
                </span>
              </div>
            </div>

            {/* Flavored Text / Description Box */}
            <div className="mt-1 min-h-[38px] flex items-center justify-center p-1.5 bg-black/55 rounded border border-white/5 z-10">
              <p className="text-[8px] leading-tight text-neutral-400 italic text-center select-text font-serif">
                "{customText || "Custom description not configured."}"
              </p>
            </div>

            {/* TCG Weakness, Resistance & Retreat Footer */}
            <div className="flex justify-between items-center text-[7px] font-mono text-neutral-400 pt-1.5 border-t border-black/10 z-10">
              <div className="flex gap-3">
                <div className="flex items-center gap-0.5">
                  <span>weakness</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-black/40 flex items-center justify-center">
                    {renderEnergyIcon(primaryType, "w-2 h-2")}
                  </div>
                  <span className="text-rose-400 font-bold">x2</span>
                </div>
                <div>resistance <span className="text-emerald-400 font-bold">-30</span></div>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="flex items-center gap-0.5">
                  <span>retreat cost</span>
                  <div className="w-2.5 h-2.5 rounded-full bg-black/40 flex items-center justify-center">
                    {renderEnergyIcon("normal", "w-2 h-2")}
                  </div>
                </div>
                <span className="capitalize font-black text-amber-400">
                  {rarity === "ultra" ? "★★★" : rarity === "rare" ? "★★" : "★"}
                </span>
              </div>
            </div>

            {/* Fine print credits overlay */}
            <div className="text-[5px] text-neutral-600 font-mono flex justify-between items-center mt-1 z-10 select-none">
              <span>Illus. PocketDex Designer</span>
              <span>©1995, 96, 98 Nintendo, Creatures, GAMEFREAK</span>
            </div>

          </div>
        </div>
      </div>

      {/* Bottom: Editor Parameters Panel */}
      <div className="w-full flex flex-col gap-4 font-mono text-xs border-t border-white/5 pt-4">
        
        <div className="flex justify-between items-center border-b border-white/5 pb-2">
          <h3 className="text-sm font-bold flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-emerald-400" /> Card Customizer
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Name & HP editor */}
        <div className="grid grid-cols-3 gap-2">
          <div className="col-span-2 space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase">Card Name</span>
            <input
              type="text"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              className="w-full h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-400 focus:outline-none capitalize"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase">Card HP</span>
            <input
              type="number"
              value={cardHp}
              onChange={(e) => setCardHp(Number(e.target.value))}
              className="w-full h-8 px-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-400 focus:outline-none"
            />
          </div>
        </div>

        {/* Description Editor */}
        <div className="space-y-1">
          <span className="text-[10px] text-neutral-500 uppercase">Flavor Text Description</span>
          <textarea
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            rows={2}
            className="w-full p-2 rounded-lg bg-white/5 border border-white/10 hover:border-white/20 focus:border-emerald-400 focus:outline-none resize-none text-[11px] leading-snug font-mono"
            maxLength={130}
          />
        </div>

        {/* Shiny & Rarity Toggles */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] text-neutral-500 uppercase block">Shiny Form</span>
            <button
              onClick={() => setIsShinyCard(!isShinyCard)}
              className={`w-full h-8 px-3 rounded-lg border font-bold transition-all text-center flex items-center justify-center gap-1 ${
                isShinyCard
                  ? "bg-amber-400/20 border-amber-400 text-amber-300"
                  : "bg-white/5 border-white/10 text-neutral-400 hover:text-white"
              }`}
            >
              <span>{isShinyCard ? "Shiny ✨" : "Normal Form"}</span>
            </button>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-neutral-500 uppercase">Card Rarity</span>
            <select
              value={rarity}
              onChange={(e: any) => setRarity(e.target.value)}
              className="w-full h-8 px-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
            >
              <option value="normal">Normal Card (Common)</option>
              <option value="rare">Holo Rare (Double Star)</option>
              <option value="ultra">Ultra Rare Gold (Triple Star)</option>
            </select>
          </div>
        </div>

        {/* Foil Patterns Settings */}
        {rarity !== "normal" && (
          <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-3">
            <div className="space-y-1">
              <span className="text-[10px] text-neutral-500 uppercase">Foil Sheen</span>
              <select
                value={foilType}
                onChange={(e: any) => setFoilType(e.target.value)}
                className="w-full h-8 px-2 rounded-lg bg-neutral-900 border border-white/10 text-white focus:outline-none focus:border-emerald-400"
              >
                <option value="rainbow">Cosmo Rainbow</option>
                <option value="starfield">Starfield Galaxy</option>
                <option value="golden">Golden Foil Overlay</option>
              </select>
            </div>

            <div className="space-y-1">
              <div className="flex justify-between text-[10px] text-neutral-500 uppercase">
                <span>Sheen Opacity</span>
                <span className="text-white">{foilOpacity}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={foilOpacity}
                onChange={(e) => setFoilOpacity(Number(e.target.value))}
                className="w-full h-8 accent-emerald-400"
              />
            </div>
          </div>
        )}

        {/* Downloader Trigger */}
        <button
          onClick={downloadCardPng}
          disabled={exporting}
          className="w-full h-10 mt-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:bg-neutral-800 disabled:text-neutral-500 text-neutral-950 font-bold transition-all duration-300 flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
        >
          {exporting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Rendering Holo Textures...
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download High-Res Card
            </>
          )}
        </button>
        
      </div>
      
    </div>
  );
}

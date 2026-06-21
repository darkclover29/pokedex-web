import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Trophy, Archive, Coins, ArrowLeft } from "lucide-react";
import type { PokemonBase } from "@/services/pokeapi";

interface CardPackOpenerProps {
  allPokemonList: PokemonBase[];
}

interface OpenedCard {
  id: number;
  name: string;
  image: string;
  types: string[];
  rarity: "Common" | "Uncommon" | "Rare" | "Holo Rare";
  isNew: boolean;
}

interface PackSet {
  id: string;
  name: string;
  description: string;
  color: string;
  borderColor: string;
  range: [number, number]; // [minId, maxId]
}

const SETS: PackSet[] = [
  { id: "base", name: "Base Set v1", description: "Generation 1 classic starters & legends", color: "from-blue-600 to-indigo-800", borderColor: "border-blue-500", range: [1, 55] },
  { id: "jungle", name: "Jungle Expedition", description: "Forest, bug, and grass wilderness types", color: "from-emerald-600 to-teal-800", borderColor: "border-emerald-500", range: [56, 110] },
  { id: "genesis", name: "Neo Genesis", description: "Johto starters and steel/dark arrivals", color: "from-amber-600 to-rose-800", borderColor: "border-amber-500", range: [111, 151] },
];

const RARITY_COLORS: Record<string, string> = {
  Common: "text-neutral-400 bg-neutral-800/40",
  Uncommon: "text-sky-400 bg-sky-500/10 border-sky-500/20",
  Rare: "text-amber-400 bg-amber-500/10 border-amber-500/20 font-bold",
  "Holo Rare": "text-purple-400 bg-purple-500/15 border-purple-500/30 font-bold shadow-[0_0_12px_rgba(168,85,247,0.3)]",
};

export function CardPackOpener({ allPokemonList }: CardPackOpenerProps) {
  // Navigation states: 'shop', 'opening', 'album'
  const [view, setView] = useState<"shop" | "opening" | "album">("shop");
  const [selectedSet, setSelectedSet] = useState<PackSet | null>(null);
  
  // Pack tearing states: 'closed', 'tearing', 'opened'
  const [packState, setPackState] = useState<"closed" | "tearing" | "opened">("closed");
  
  const [packCards, setPackCards] = useState<OpenedCard[]>([]);
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  
  // Persistent collection of unlocked cards (saved in localStorage)
  // Maps pokemon ID to collected count & details
  const [collection, setCollection] = useState<Record<number, { count: number; name: string; image: string; types: string[]; rarity: string }>>(() => {
    const saved = localStorage.getItem("pocketdex_tcg_collection");
    return saved ? JSON.parse(saved) : {};
  });

  const [credits, setCredits] = useState<number>(() => {
    const saved = localStorage.getItem("pocketdex_tcg_credits");
    return saved ? parseInt(saved, 10) : 350; // starts with 350 credits
  });

  useEffect(() => {
    localStorage.setItem("pocketdex_tcg_collection", JSON.stringify(collection));
  }, [collection]);

  useEffect(() => {
    localStorage.setItem("pocketdex_tcg_credits", String(credits));
  }, [credits]);

  const packRef = useRef<HTMLDivElement>(null);
  const tearParticleContainer = useRef<HTMLDivElement>(null);

  const buyPack = (set: PackSet) => {
    if (credits < 100) {
      alert("Insufficient PokeCredits! Launch vocal board, silhoutte game, or battle arena to gather more credits.");
      return;
    }
    
    // Deduct credits
    setCredits((prev) => prev - 100);
    setSelectedSet(set);
    setPackState("closed");
    setFlippedIndices([]);
    setView("opening");

    // Pull random cards from set's pool
    const pool = allPokemonList.filter(
      (p) => p.id >= set.range[0] && p.id <= set.range[1]
    );

    if (pool.length === 0) {
      // Fallback if basic list isn't fully cached
      setPackCards([]);
      return;
    }

    const pulledCards: OpenedCard[] = [];
    for (let i = 0; i < 5; i++) {
      const randPokemon = pool[Math.floor(Math.random() * pool.length)];
      
      // Determine rarity roll
      const roll = Math.random() * 100;
      let rarity: OpenedCard["rarity"] = "Common";
      if (roll > 98) rarity = "Holo Rare";
      else if (roll > 90) rarity = "Rare";
      else if (roll > 70) rarity = "Uncommon";

      const isNew = !collection[randPokemon.id];
      pulledCards.push({
        id: randPokemon.id,
        name: randPokemon.name,
        image: randPokemon.image,
        types: randPokemon.types,
        rarity,
        isNew,
      });

      // Save to local collection record
      setCollection((prev) => {
        const existing = prev[randPokemon.id] || { count: 0, name: randPokemon.name, image: randPokemon.image, types: randPokemon.types, rarity };
        return {
          ...prev,
          [randPokemon.id]: {
            ...existing,
            count: existing.count + 1,
          },
        };
      });
    }
    setPackCards(pulledCards);
  };

  // Drag swipe to tear open booster pack
  const handleTear = () => {
    if (packState !== "closed") return;
    setPackState("tearing");

    const pack = packRef.current;
    if (!pack) return;

    // Confetti sparks when tearing wrapper
    triggerTearConfetti();

    // GSAP rip animation split
    const tl = gsap.timeline({
      onComplete: () => {
        setPackState("opened");
      },
    });

    tl.to(pack, {
      y: -15,
      rotate: -1,
      duration: 0.12,
      yoyo: true,
      repeat: 3,
    })
    .to(pack, {
      scale: 1.05,
      opacity: 0,
      filter: "blur(6px)",
      duration: 0.35,
      ease: "power2.in",
    });
  };

  const triggerTearConfetti = () => {
    const sparkles = tearParticleContainer.current;
    if (!sparkles) return;
    sparkles.innerHTML = "";

    const rect = sparkles.getBoundingClientRect();

    for (let i = 0; i < 30; i++) {
      const star = document.createElement("div");
      star.className = "absolute w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_#38bdf8]";
      
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 80 + 40;
      
      gsap.set(star, {
        x: rect.width / 2,
        y: 20,
        opacity: 1,
      });
      sparkles.appendChild(star);

      gsap.to(star, {
        x: rect.width / 2 + Math.cos(angle) * velocity,
        y: 20 + Math.sin(angle) * velocity,
        opacity: 0,
        scale: 0.1,
        duration: 0.6,
        ease: "power2.out",
      });
    }
  };

  const flipCard = (index: number) => {
    if (flippedIndices.includes(index)) return;
    setFlippedIndices((prev) => [...prev, index]);

    // Card flip sound / rumble effect using GSAP
    const cardEl = document.getElementById(`booster-card-${index}`);
    if (cardEl) {
      gsap.fromTo(
        cardEl,
        { rotateY: 0 },
        { rotateY: 180, duration: 0.45, ease: "power2.out" }
      );
    }
  };

  const flipAll = () => {
    packCards.forEach((_, idx) => {
      setTimeout(() => flipCard(idx), idx * 150);
    });
  };

  // Calculate unique collection statistics
  const totalUniqueUnlocked = Object.keys(collection).length;
  const albumProgress = ((totalUniqueUnlocked / Math.max(1, allPokemonList.length)) * 100).toFixed(1);

  return (
    <div className="w-full text-white font-mono text-xs select-none">
      
      {/* Header controls row */}
      <div className="flex justify-between items-center border-b border-white/5 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-4 w-4 text-amber-400" />
          <h2 className="text-sm font-bold uppercase tracking-wider">Booster Opener & Album</h2>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-1.5 bg-white/5 border border-white/5 px-2.5 py-1 rounded-lg">
            <Coins className="h-3.5 w-3.5 text-yellow-400" />
            <span className="font-bold text-white text-[11px]">{credits} Cr</span>
          </div>
          {view !== "shop" && (
            <button
              onClick={() => setView("shop")}
              className="flex items-center gap-1 text-[10px] text-neutral-400 hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}
        </div>
      </div>

      {/* SHOP VIEW: Purchase set packs */}
      {view === "shop" && (
        <div className="space-y-6">
          
          {/* Header Stats Box */}
          <div className="grid grid-cols-2 gap-4 bg-white/[0.01] border border-white/5 p-4 rounded-2xl text-center">
            <div>
              <span className="text-[10px] uppercase text-neutral-500 block leading-none mb-1">
                Album Progress
              </span>
              <span className="text-lg font-bold text-emerald-400">{albumProgress}%</span>
            </div>
            <div>
              <span className="text-[10px] uppercase text-neutral-500 block leading-none mb-1">
                Unlocked cards
              </span>
              <span className="text-lg font-bold text-white">
                {totalUniqueUnlocked} / {allPokemonList.length}
              </span>
            </div>
          </div>

          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] uppercase text-neutral-500">Buy Set Pack (100 Cr)</span>
            <button
              onClick={() => setView("album")}
              className="flex items-center gap-1 text-cyan-400 hover:text-white transition-colors"
            >
              <Archive className="h-3.5 w-3.5" /> View Album Binder
            </button>
          </div>

          {/* Sets list grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {SETS.map((set) => (
              <div
                key={set.id}
                className="bg-neutral-900/40 border border-white/5 rounded-2xl p-4 flex flex-col justify-between items-stretch min-h-[170px]"
              >
                <div>
                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-widest block leading-none mb-1">
                    Booster Pack
                  </span>
                  <h3 className="text-sm font-bold tracking-tight text-white mb-2">{set.name}</h3>
                  <p className="text-[10px] text-neutral-400 leading-normal">{set.description}</p>
                </div>
                <button
                  onClick={() => buyPack(set)}
                  className={`mt-4 w-full py-2 rounded-xl bg-gradient-to-r ${set.color} hover:shadow-lg transition-all duration-300 font-bold border border-white/10`}
                >
                  Buy Pack (100 Cr)
                </button>
              </div>
            ))}
          </div>

          <div className="text-center text-[10px] text-neutral-500 mt-4 leading-normal">
            Gain credits automatically by catching Pokémon or checking details profiles!
          </div>

        </div>
      )}

      {/* OPENING VIEW: Interactive swiping pack tearing & card drawing */}
      {view === "opening" && selectedSet && (
        <div className="flex flex-col items-center justify-center min-h-[420px] relative w-full overflow-hidden py-4">
          
          <div ref={tearParticleContainer} className="absolute inset-x-0 top-16 h-8 pointer-events-none z-30" />

          {/* CLOSED WRAPPER PACK */}
          {packState === "closed" && (
            <div className="flex flex-col items-center justify-center gap-6">
              <span className="text-[10px] uppercase text-neutral-400 text-center block">
                Drag downward or click pack to open!
              </span>

              {/* Booster Pack Visual Container */}
              <div
                ref={packRef}
                onClick={handleTear}
                className={`w-48 h-72 rounded-2xl bg-gradient-to-b ${selectedSet.color} border border-white/20 shadow-2xl p-4 flex flex-col justify-between items-center cursor-pointer transform hover:scale-102 transition-transform duration-300 relative overflow-hidden`}
              >
                {/* Glossy sheen reflection */}
                <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.15)_30%,rgba(0,0,0,0.2)_100%)] pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-4 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.3)_0%,transparent_100%)] border-b border-black/25 flex items-center justify-between px-2 text-[6px] text-neutral-400">
                  <span>TEAR HERE</span>
                  <span>▼</span>
                </div>

                <div className="text-center z-10 mt-6">
                  <span className="text-[8px] uppercase tracking-wider text-neutral-300">Booster Pack</span>
                  <h4 className="text-sm font-black tracking-tight text-white mt-1">{selectedSet.name}</h4>
                </div>

                {/* Central PokeBall Hologram Art */}
                <div className="w-16 h-16 rounded-full border border-white/10 flex items-center justify-center relative bg-black/20 my-auto">
                  <svg className="w-8 h-8 fill-none stroke-white/20" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" strokeWidth="6" />
                    <line x1="10" y1="50" x2="90" y2="50" strokeWidth="6" />
                    <circle cx="50" cy="50" r="14" fill="#000000" strokeWidth="6" />
                  </svg>
                </div>

                <div className="text-center z-10 mb-2">
                  <span className="text-[8px] uppercase font-bold text-neutral-300 tracking-wider">5 Cards Inside</span>
                </div>
              </div>
            </div>
          )}

          {/* OPENED DECK STACK */}
          {packState === "opened" && (
            <div className="flex flex-col items-center w-full gap-8">
              
              <div className="flex justify-between items-center w-full max-w-4xl px-2">
                <span className="text-[10px] text-neutral-400">
                  Revealed: {flippedIndices.length} / 5 Cards
                </span>
                {flippedIndices.length < 5 && (
                  <button
                    onClick={flipAll}
                    className="text-[10px] text-cyan-400 hover:text-white transition-colors"
                  >
                    Flip All
                  </button>
                )}
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 w-full max-w-4xl px-2 justify-center">
                {packCards.map((card, idx) => {
                  const isFlipped = flippedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      id={`booster-card-${idx}`}
                      onClick={() => flipCard(idx)}
                      className="aspect-[5/7] rounded-xl relative cursor-pointer select-none preserve-3d"
                      style={{
                        transformStyle: "preserve-3d",
                      }}
                    >
                      {/* CARD BACK SIDE */}
                      <div
                        className={`absolute inset-0 rounded-xl bg-neutral-900 border border-white/10 p-3 flex flex-col justify-between items-center shadow-lg transition-opacity duration-300 backface-hidden ${
                          isFlipped ? "opacity-0 pointer-events-none" : "opacity-100"
                        }`}
                        style={{ backfaceVisibility: "hidden" }}
                      >
                        <div className="w-full flex justify-between text-[6px] text-neutral-600 font-mono">
                          <span>SYS_TCG</span>
                          <span>B_BACK</span>
                        </div>
                        {/* Pokéball core icon */}
                        <div className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center bg-black/40">
                          <svg className="w-6 h-6 fill-none stroke-neutral-700" viewBox="0 0 100 100">
                            <circle cx="50" cy="50" r="40" strokeWidth="6" />
                            <line x1="10" y1="50" x2="90" y2="50" strokeWidth="6" />
                          </svg>
                        </div>
                        <span className="text-[7px] text-neutral-600 tracking-wider">UNREVEALED</span>
                      </div>

                      {/* CARD FRONT SIDE (Flipped) */}
                      <div
                        className={`absolute inset-0 rounded-xl bg-[#0b0b0e] border p-3 flex flex-col justify-between items-center shadow-2xl transition-opacity duration-300 transform rotate-y-180 ${
                          isFlipped ? "opacity-100" : "opacity-0 pointer-events-none"
                        } ${
                          card.rarity === "Holo Rare"
                            ? "border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
                            : card.rarity === "Rare"
                            ? "border-amber-500/40"
                            : "border-white/5"
                        }`}
                        style={{
                          backfaceVisibility: "hidden",
                          transform: "rotateY(180deg)",
                        }}
                      >
                        {/* Holo foil grid sheens */}
                        {card.rarity === "Holo Rare" && (
                          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.1)_0%,rgba(6,182,212,0.15)_50%,rgba(168,85,247,0.1)_100%)] pointer-events-none rounded-xl animate-[pulse_3s_infinite]" />
                        )}

                        <div className="w-full flex justify-between items-center text-[7px] font-mono text-neutral-500 leading-none">
                          <span>#{String(card.id).padStart(3, "0")}</span>
                          <span className={`px-1.5 py-0.5 rounded ${RARITY_COLORS[card.rarity]}`}>
                            {card.rarity}
                          </span>
                        </div>

                        {/* Centered Artwork */}
                        <div className="relative w-16 h-16 flex items-center justify-center my-1.5">
                          {card.rarity === "Holo Rare" && (
                            <div className="absolute inset-0 rounded-full bg-purple-500/10 blur-xl animate-ping" />
                          )}
                          <img
                            src={card.image}
                            alt={card.name}
                            className="w-14 h-14 object-contain z-10 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]"
                          />
                        </div>

                        {/* Name & Type */}
                        <div className="w-full text-center">
                          <h5 className="font-extrabold capitalize text-[10px] text-white tracking-wide truncate">
                            {card.name}
                          </h5>
                          
                          {/* New tag flag */}
                          {card.isNew && (
                            <span className="inline-block mt-1 text-[7px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-1 py-[1px] rounded scale-90">
                              NEW
                            </span>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
              </div>

              {flippedIndices.length === 5 && (
                <button
                  onClick={() => setView("shop")}
                  className="px-6 py-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors"
                >
                  Buy Another Pack
                </button>
              )}
            </div>
          )}

        </div>
      )}

      {/* ALBUM BINDER VIEW: Grid of all collected cards */}
      {view === "album" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase text-neutral-500">Collected Deck Collection</span>
            <button
              onClick={() => {
                if (window.confirm("Are you sure you want to clear your TCG collection album? This cannot be undone.")) {
                  setCollection({});
                  setCredits(350);
                  localStorage.removeItem("pocketdex_tcg_collection");
                  localStorage.removeItem("pocketdex_tcg_credits");
                }
              }}
              className="text-[9px] text-neutral-500 hover:text-rose-400 transition-colors"
            >
              Reset Binder
            </button>
          </div>

          {totalUniqueUnlocked === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-neutral-500 border border-dashed border-white/5 rounded-2xl bg-white/[0.01]">
              <span>Booster Album is empty.</span>
              <button
                onClick={() => setView("shop")}
                className="mt-4 px-4 py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono"
              >
                Go Buy Packs
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3.5 max-h-[380px] overflow-y-auto pr-1">
              {Object.entries(collection).map(([key, card]) => {
                const id = parseInt(key, 10);
                const isHolo = card.rarity === "Holo Rare";
                return (
                  <div
                    key={id}
                    className={`bg-[#0b0b0e] border p-2.5 rounded-xl flex flex-col justify-between items-center relative overflow-hidden group shadow-md transition-all duration-300 hover:scale-102 hover:border-white/25 ${
                      isHolo
                        ? "border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.15)]"
                        : card.rarity === "Rare"
                        ? "border-amber-500/30"
                        : "border-white/5"
                    }`}
                  >
                    {/* Holo animated scan line layer */}
                    {isHolo && (
                      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(168,85,247,0.08)_0%,rgba(6,182,212,0.12)_50%,rgba(168,85,247,0.08)_100%)] pointer-events-none rounded-xl" />
                    )}

                    {/* Collected Count Ribbon */}
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-[1px] rounded bg-white/5 border border-white/5 text-[7px] text-neutral-400 font-bold leading-none">
                      x{card.count}
                    </div>

                    <span className="text-[7px] text-neutral-500 font-mono self-start leading-none mb-1">
                      #{String(id).padStart(3, "0")}
                    </span>

                    <img
                      src={card.image}
                      alt={card.name}
                      className="w-11 h-11 object-contain filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.55)] group-hover:scale-105 transition-transform"
                      loading="lazy"
                    />

                    <div className="w-full text-center mt-1.5">
                      <h6 className="capitalize font-black text-[9px] text-white truncate leading-tight">
                        {card.name}
                      </h6>
                      <div className="flex gap-1 justify-center mt-1 scale-90">
                        {card.types.slice(0, 1).map((t) => (
                          <span
                            key={t}
                            className="text-[6px] font-bold uppercase px-1 rounded-sm border border-white/10"
                            style={{ color: t === "normal" ? "#A8A77A" : RARITY_COLORS[card.rarity] || "#ffffff" }}
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

    </div>
  );
}

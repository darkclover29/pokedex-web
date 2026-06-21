import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Search, RotateCcw, HelpCircle, Gamepad2, Volume2, ShieldAlert, Heart, Users, Mic, MicOff, Sword, Home, Layers, Sparkles } from "lucide-react";
import { fetchPokemonList, fetchPokemonDetails, fetchBasicPokemonList } from "./services/pokeapi";
import type { PokemonBase, PokemonFullDetails } from "./services/pokeapi";
import { PokemonCard } from "./components/PokemonCard";
import { PokemonDetails } from "./components/PokemonDetails";
import { CompareDeck } from "./components/CompareDeck";
import { WhosThatPokemon } from "./components/WhosThatPokemon";
import { Soundboard } from "./components/Soundboard";
import { GymCounters } from "./components/GymCounters";
import { TeamBuilder } from "./components/TeamBuilder";
import { BattleArena } from "./components/BattleArena";
import { CardPackOpener } from "./components/CardPackOpener";
import { Showroom } from "./components/Showroom";
import { Particles } from "./components/magicui/Particles";
import { BlurFade } from "./components/magicui/BlurFade";
import { Input } from "./components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/Select";
import { ShinyText } from "./components/react-bits/ShinyText";
import ClickSpark from "./components/react-bits/ClickSpark";
import Dock from "./components/react-bits/Dock";
import TrueFocus from "./components/react-bits/TrueFocus";
import RetroBackground from "./components/react-bits/RetroBackground";
import TargetCursor from "./components/react-bits/TargetCursor";

const POKEMON_TYPES = [
  "all", "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy"
];

const REGIONS: Record<string, { offset: number; limit: number; name: string }> = {
  kanto: { offset: 0, limit: 151, name: "Kanto (Gen 1)" },
  johto: { offset: 151, limit: 100, name: "Johto (Gen 2)" },
  hoenn: { offset: 251, limit: 135, name: "Hoenn (Gen 3)" },
  sinnoh: { offset: 386, limit: 107, name: "Sinnoh (Gen 4)" },
  unova: { offset: 493, limit: 156, name: "Unova (Gen 5)" },
  kalos: { offset: 649, limit: 72, name: "Kalos (Gen 6)" },
  alola: { offset: 721, limit: 88, name: "Alola (Gen 7)" },
  galar: { offset: 809, limit: 96, name: "Galar (Gen 8)" },
  paldea: { offset: 905, limit: 120, name: "Paldea (Gen 9)" },
};

const TYPE_COLORS: Record<string, string> = {
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

function hexToRgbStr(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result 
    ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
    : "255, 255, 255";
}

function PokemonCardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/5 bg-neutral-900/40 p-5 flex flex-col justify-between aspect-[3/4] animate-pulse">
      <div className="flex justify-between items-center">
        <div className="h-4 w-8 bg-neutral-800 rounded" />
        <div className="h-4 w-14 bg-neutral-800 rounded-full" />
      </div>
      <div className="flex-grow flex items-center justify-center my-4">
        <div className="w-24 h-24 rounded-full bg-neutral-800/60 blur-sm" />
      </div>
      <div className="flex flex-col gap-2">
        <div className="h-3 w-10 bg-neutral-800 rounded" />
        <div className="h-5 w-24 bg-neutral-800 rounded" />
      </div>
    </div>
  );
}

export default function App() {
  const revealImgRef = useRef<HTMLDivElement>(null);

  const lastMousePos = useRef({ x: -9999, y: -9999 });
  const rafId = useRef<number | null>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (rafId.current === null) {
      rafId.current = requestAnimationFrame(() => {
        const el = revealImgRef.current;
        if (el) {
          el.style.setProperty('--mx', `${lastMousePos.current.x}px`);
          el.style.setProperty('--my', `${lastMousePos.current.y}px`);
        }
        rafId.current = null;
      });
    }
  };

  const handleMouseLeave = () => {
    if (rafId.current !== null) {
      cancelAnimationFrame(rafId.current);
      rafId.current = null;
    }
    const el = revealImgRef.current;
    if (el) {
      el.style.setProperty('--mx', '-9999px');
      el.style.setProperty('--my', '-9999px');
    }
  };

  useEffect(() => {
    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, []);

  // Lists & pagination
  const [pokemonList, setPokemonList] = useState<PokemonBase[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Team Builder state
  const [team, setTeam] = useState<PokemonFullDetails[]>(() => {
    const saved = localStorage.getItem("pocketdex_team") || localStorage.getItem("neodex_team");
    return saved ? JSON.parse(saved) : [];
  });
  const [teamBuilderOpen, setTeamBuilderOpen] = useState(false);

  // Sync team state to localStorage
  useEffect(() => {
    localStorage.setItem("pocketdex_team", JSON.stringify(team));
  }, [team]);

  const handleAddToTeam = async (id: number) => {
    if (team.length >= 6) {
      alert("Squad is full! Max 6 members allowed.");
      return;
    }
    if (team.some((m) => m.id === id)) return;

    // Fetch full details
    const details = await fetchPokemonDetails(id);
    if (details) {
      setTeam((prev) => [...prev, details]);
    }
  };

  const handleRemoveFromTeam = (id: number) => {
    setTeam((prev) => prev.filter((m) => m.id !== id));
  };

  const handleToggleTeam = async (id: number) => {
    if (team.some((m) => m.id === id)) {
      handleRemoveFromTeam(id);
    } else {
      await handleAddToTeam(id);
    }
  };

  // Region / Gen selection state
  const [selectedRegion, setSelectedRegion] = useState("kanto");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [sortBy, setSortBy] = useState("id-asc");

  // Favorites state
  const [favorites, setFavorites] = useState<number[]>(() => {
    const saved = localStorage.getItem("pocketdex_favorites") || localStorage.getItem("neodex_favorites");
    return saved ? JSON.parse(saved) : [];
  });
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Single search result (from PokéAPI directly if not found locally)
  const [searchedPokemon, setSearchedPokemon] = useState<PokemonBase | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // Detail Dialog state
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Compare Deck state
  const [compareIds, setCompareIds] = useState<number[]>([]);

  // Modals Open state
  const [minigameOpen, setMinigameOpen] = useState(false);
  const [soundboardOpen, setSoundboardOpen] = useState(false);
  const [gymCountersOpen, setGymCountersOpen] = useState(false);
  const [battleArenaOpen, setBattleArenaOpen] = useState(false);
  const [packOpenerOpen, setPackOpenerOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showroomOpen, setShowroomOpen] = useState(false);

  // Voice Command Search State
  const [isListening, setIsListening] = useState(false);
  const [voiceToast, setVoiceToast] = useState<string | null>(null);

  const dockItems = [
    {
      icon: <Home size={18} className="text-blue-400" />,
      label: "Home",
      onClick: () => handleResetFilters()
    },
    {
      icon: <Sparkles size={18} className="text-amber-400" />,
      label: "3D Showroom",
      onClick: () => setShowroomOpen(true)
    },
    {
      icon: <Sword size={18} className="text-rose-500" />,
      label: "Battle Arena",
      onClick: () => setBattleArenaOpen(true)
    },
    {
      icon: <ShieldAlert size={18} className="text-rose-400" />,
      label: "Gym Advisors",
      onClick: () => setGymCountersOpen(true)
    },
    {
      icon: <Users size={18} className="text-cyan-400" />,
      label: "Squad Builder",
      onClick: () => setTeamBuilderOpen(true)
    },
    {
      icon: <Volume2 size={18} className="text-emerald-400" />,
      label: "Vocal Board",
      onClick: () => setSoundboardOpen(true)
    },
    {
      icon: <Gamepad2 size={18} className="text-amber-400" />,
      label: "Silhouette Game",
      onClick: () => setMinigameOpen(true)
    },
    {
      icon: <Layers size={18} className="text-purple-400" />,
      label: "Booster Opener",
      onClick: () => setPackOpenerOpen(true)
    }
  ];

  const startSpeechRecognition = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Web Speech API (Speech Recognition) is not supported in this browser. Try Chrome, Edge or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceToast("Listening for a Pokémon name or number...");
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
        setVoiceToast(`Speech recognition error: ${event.error}`);
        setTimeout(() => setVoiceToast(null), 3000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript.trim();
        const confidence = event.results[0][0].confidence;
        console.log(`Speech result: "${transcript}" with confidence: ${confidence}`);

        if (!transcript) return;

        // Process search spoken result
        let cleanText = transcript.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "").trim();

        // Convert common spoken numbers to digits
        const numberMap: Record<string, string> = {
          one: "1", two: "2", three: "3", four: "4", five: "5", six: "6", seven: "7", eight: "8", nine: "9", ten: "10",
          eleven: "11", twelve: "12", thirteen: "13", fourteen: "14", fifteen: "15", sixteen: "16", seventeen: "17",
          eighteen: "18", nineteen: "19", twenty: "20"
        };
        
        if (cleanText in numberMap) {
          cleanText = numberMap[cleanText];
        }

        setVoiceToast(`Heard: "${transcript}"`);
        setTimeout(() => setVoiceToast(null), 3000);

        // Try local lookup in loaded Kanto roster first
        const match = basicKantoList.find(
          (p) => p.name.toLowerCase() === cleanText || String(p.id) === cleanText
        );

        if (match) {
          setSearchQuery(match.name);
          handleCardClick(match.id);
        } else {
          // Global lookups if local matching fails
          setVoiceToast(`Searching database for: "${cleanText}"...`);
          try {
            const fetched = await fetchPokemonDetails(cleanText);
            if (fetched) {
              setSearchQuery(fetched.name);
              handleCardClick(fetched.id);
              setVoiceToast(null);
            } else {
              setVoiceToast(`No records matched "${transcript}".`);
              setTimeout(() => setVoiceToast(null), 4000);
            }
          } catch (err) {
            setVoiceToast(`No records matched "${transcript}".`);
            setTimeout(() => setVoiceToast(null), 4000);
          }
        }
      };

      recognition.start();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  // Startup Holographic Animation State
  const [showSplash, setShowSplash] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);

  // National full roster basics cache state
  const [basicKantoList, setBasicKantoList] = useState<PokemonBase[]>([]);

  // Fetch full National basics (Gen 1-9) on mount for overlays
  useEffect(() => {
    async function loadBasicKanto() {
      const list = await fetchBasicPokemonList(1025, 0);
      setBasicKantoList(list);
    }
    loadBasicKanto();
  }, []);

  // Play a clean digital synthesizer boot chime using Web Audio API
  const playRetroBeep = () => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      
      const playTone = (freq: number, startTime: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine"; // Clean glass wave
        osc.frequency.setValueAtTime(freq, startTime);
        
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(0.015, startTime + 0.05); // Smooth attack
        gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Smooth decay
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(startTime);
        osc.stop(startTime + duration);
      };

      // Play holographic synth chord arpeggio
      playTone(523.25, now, 0.4);       // C5
      playTone(659.25, now + 0.1, 0.45);  // E5
      playTone(783.99, now + 0.2, 0.5);   // G5
      playTone(1046.50, now + 0.3, 0.6);  // C6
    } catch (e) {
      console.warn("Chime Audio context blocked:", e);
    }
  };

  // Simulated Startup loading progress & laser sweep
  useEffect(() => {
    if (!showSplash) return;

    // Safety timeout: ensure splash is closed in 3.5 seconds even if animations/references fail
    const safetyTimeout = setTimeout(() => {
      console.warn("Startup animation timed out, forcing load.");
      setShowSplash(false);
    }, 3500);

    const startTime = Date.now();
    const duration = 1800; // 1.8 seconds loading
    
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setLoadingProgress(Math.floor(progress));
      
      if (progress >= 100) {
        clearInterval(interval);
        
        const splashOverlay = document.getElementById("neo-splash-overlay");
        const glassCard = document.getElementById("glass-boot-card");
        const laser = document.getElementById("scanning-laser");
        
        if (glassCard && splashOverlay) {
          playRetroBeep();

          const tl = gsap.timeline({
            onComplete: () => {
              clearTimeout(safetyTimeout);
              setShowSplash(false);
            }
          });

          // 1. Run laser sweep down
          if (laser) {
            gsap.set(laser, { display: "block", y: -10 });
            tl.to(laser, { y: 384, duration: 0.6, ease: "power1.inOut" });
          }

          // 2. Shrink and fade overlay
          tl.to(glassCard, { scale: 0.95, opacity: 0, duration: 0.3, ease: "power2.in" })
            .to(splashOverlay, { opacity: 0, duration: 0.4 }, "-=0.15");
        } else {
          clearTimeout(safetyTimeout);
          setShowSplash(false);
        }
      }
    }, 30);

    return () => {
      clearInterval(interval);
      clearTimeout(safetyTimeout);
    };
  }, [showSplash]);

  const PAGE_LIMIT = 24;

  // Load region when selectedRegion changes
  useEffect(() => {
    async function loadRegion() {
      setLoading(true);
      const reg = REGIONS[selectedRegion];
      const list = await fetchPokemonList(PAGE_LIMIT, reg.offset);
      setPokemonList(list);
      setOffset(reg.offset + PAGE_LIMIT);
      setLoading(false);
    }
    loadRegion();
  }, [selectedRegion]);

  // Fetch more Pokemon (respecting active region limit)
  const handleLoadMore = async () => {
    if (loadingMore) return;
    const reg = REGIONS[selectedRegion];
    const maxOffset = reg.offset + reg.limit;

    if (offset >= maxOffset) return;

    setLoadingMore(true);
    const remaining = maxOffset - offset;
    const fetchSize = Math.min(PAGE_LIMIT, remaining);

    const nextList = await fetchPokemonList(fetchSize, offset);
    setPokemonList((prev) => [...prev, ...nextList]);
    setOffset((prev) => prev + fetchSize);
    setLoadingMore(false);
  };

  // Search effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchedPokemon(null);
      return;
    }

    const cleanQuery = searchQuery.toLowerCase().trim();
    
    // Check if we already have it in the loaded list
    const foundLocally = pokemonList.some(
      (p) => p.name.toLowerCase() === cleanQuery || String(p.id) === cleanQuery
    );

    if (foundLocally) {
      setSearchedPokemon(null);
      return;
    }

    // Otherwise, try to fetch it globally from PokéAPI
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      const fetched = await fetchPokemonDetails(cleanQuery);
      if (fetched) {
        setSearchedPokemon({
          id: fetched.id,
          name: fetched.name,
          types: fetched.types,
          image: fetched.image,
          shinyImage: fetched.shinyImage,
        });
      } else {
        setSearchedPokemon(null);
      }
      setSearchLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, pokemonList]);

  // Filter and sort the loaded list
  const getFilteredList = () => {
    let list = [...pokemonList];

    // 1. Filter by type
    if (selectedType !== "all") {
      list = list.filter((p) => p.types.includes(selectedType));
    }

    // 2. Filter by search query (local matches)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || String(p.id) === q);
    }

    // 3. Filter by favorites
    if (showFavoritesOnly) {
      list = list.filter((p) => favorites.includes(p.id));
    }

    // 4. Sort list
    list.sort((a, b) => {
      if (sortBy === "id-asc") return a.id - b.id;
      if (sortBy === "id-desc") return b.id - a.id;
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });

    return list;
  };

  const filteredList = getFilteredList();

  const handleCardClick = (id: number) => {
    setSelectedPokemonId(id);
    setDialogOpen(true);
  };

  // Compare Toggle handler
  const handleCompareToggle = (id: number) => {
    setCompareIds((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      }
      if (prev.length >= 3) {
        alert("Visual comparison deck capped at 3 entries.");
        return prev;
      }
      return [...prev, id];
    });
  };

  // Favorite Toggle handler
  const handleFavoriteToggle = (id: number) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      localStorage.setItem("pocketdex_favorites", JSON.stringify(next));
      return next;
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedType("all");
    setSortBy("id-asc");
    setShowFavoritesOnly(false);
  };

  const reg = REGIONS[selectedRegion];
  const maxOffset = reg.offset + reg.limit;
  const themeColorRgb = selectedType === "all" ? "255, 255, 255" : hexToRgbStr(TYPE_COLORS[selectedType] || "#ffffff");

  // Determine if we show the Load More button
  const showLoadMore =
    !searchQuery &&
    selectedType === "all" &&
    !showFavoritesOnly &&
    !loading &&
    offset < maxOffset;

  return (
    <ClickSpark
      sparkColor="#fbbf24"
      sparkSize={12}
      sparkRadius={20}
      sparkCount={8}
      duration={500}
    >
      <TargetCursor
        spinDuration={2.5}
        hideDefaultCursor={true}
        parallaxOn={true}
        targetSelector="a, button, input, select, [role='button'], .cursor-target"
      />
      <div
        className="relative min-h-screen pb-32 px-4 md:px-8 select-none transition-all duration-700"
        style={{
          backgroundImage: selectedType === "all"
            ? 'none'
            : `radial-gradient(at 50% 0%, rgba(${themeColorRgb}, 0.04) 0px, transparent 65%)`
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        
        {/* Startup Animated Holographic Glass Splash Screen */}
        {showSplash && (
          <div
            id="neo-splash-overlay"
            className="fixed inset-0 bg-[#070709] flex flex-col items-center justify-center z-[9999] pointer-events-auto overflow-hidden"
          >
            {/* Neon spinning background circular grid decoration */}
            <div className="absolute w-[450px] h-[450px] rounded-full border border-emerald-500/5 blur-sm animate-[spin_50s_linear_infinite] pointer-events-none" />
          <div className="absolute w-[300px] h-[300px] rounded-full border border-dashed border-teal-500/10 animate-[spin_30s_linear_infinite_reverse] pointer-events-none" />

          {/* Floating Glassmorphic Card Container */}
          <div
            id="glass-boot-card"
            className="relative w-80 h-96 rounded-3xl bg-white/[0.02] border border-white/10 p-6 flex flex-col justify-between items-center shadow-2xl backdrop-blur-xl overflow-hidden"
            style={{
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)",
            }}
          >
            {/* Holographic glowing scanline laser sweep element */}
            <div
              id="scanning-laser"
              className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-60 shadow-[0_0_10px_#22d3ee] pointer-events-none hidden"
            />

            {/* Top: Tech corner accents */}
            <div className="w-full flex justify-between text-[8px] font-mono text-neutral-600 tracking-wider">
              <span>SYS_BOOT: POCKETDEX_v2</span>
              <span>LOC_ID: GRD_0x85</span>
            </div>

            {/* Mid: Logo & spinning radar */}
            <div className="flex flex-col items-center justify-center my-auto gap-4 relative w-full">
              {/* Spinning radial HUD ring */}
              <div className="w-24 h-24 rounded-full border border-neutral-800 flex items-center justify-center relative">
                <div className="absolute inset-1.5 rounded-full border border-dashed border-emerald-500/30 animate-[spin_20s_linear_infinite]" />
                <div className="absolute inset-4 rounded-full border border-cyan-500/20 animate-[pulse_1.5s_infinite_ease-in-out]" />
                {/* Central Pokéball Core Icon */}
                <svg className="w-10 h-10 filter drop-shadow-[0_0_8px_rgba(34,211,238,0.3)]" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                  <path d="M 14 50 A 36 36 0 0 1 86 50 Z" stroke="#22d3ee" strokeWidth="4" />
                  <line x1="10" y1="50" x2="38" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <line x1="62" y1="50" x2="90" y2="50" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
                  <circle cx="50" cy="50" r="12" stroke="rgba(255,255,255,0.2)" strokeWidth="4" fill="#0f0f12" />
                  <circle cx="50" cy="50" r="5" fill="#22d3ee" />
                </svg>
              </div>

              <div className="text-center w-full flex flex-col items-center">
                <div className="text-xl font-black tracking-widest text-white uppercase font-mono h-12 flex items-center justify-center w-full">
                  <TrueFocus
                    sentence="POCKET DEX"
                    manualMode={false}
                    blurAmount={3}
                    borderColor="#22d3ee"
                    glowColor="rgba(34, 211, 238, 0.6)"
                    animationDuration={0.4}
                    pauseBetweenAnimations={0.4}
                  />
                </div>
                <span className="text-[8px] font-mono text-cyan-400/80 uppercase tracking-widest leading-none font-bold mt-1 block">
                  Initializing Core Database
                </span>
              </div>
            </div>

            {/* Bottom: Loading progress */}
            <div className="w-full font-mono text-xs text-center space-y-2">
              <div className="text-[8px] text-neutral-500 uppercase tracking-widest min-h-[14px]">
                {loadingProgress < 40 ? (
                  <span className="animate-pulse">Loading regional map indexes...</span>
                ) : loadingProgress < 75 ? (
                  <span className="animate-pulse">Parsing type effectiveness charts...</span>
                ) : loadingProgress < 100 ? (
                  <span className="animate-pulse">Syncing localStorage vaults...</span>
                ) : (
                  <span className="text-emerald-400 font-bold">Boot sequence complete</span>
                )}
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-neutral-900 border border-white/5 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 transition-all duration-100 rounded-full"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
              
              <div className="flex justify-between items-center text-[9px] text-neutral-600">
                <span>SYS_INIT</span>
                <span>{loadingProgress}%</span>
              </div>
            </div>

          </div>
        </div>
      )}
      
      {/* Interactive Pokémon Retro Vector Reveal Background */}
      <RetroBackground
        className="transition-opacity duration-300"
        style={{
          opacity: 0.25,
        }}
      />
      {/* Flat spotlight overlay to prevent SVG re-rasterization */}
      <div
        ref={revealImgRef}
        className="fixed inset-0 pointer-events-none transition-all duration-700"
        style={{
          zIndex: 1,
          '--mx': '-9999px',
          '--my': '-9999px',
          backgroundImage: selectedType === "all"
            ? 'radial-gradient(circle 280px at var(--mx) var(--my), rgba(3,3,3,0) 0%, rgba(3,3,3,0.85) 60%, #030303 100%)'
            : `radial-gradient(circle 280px at var(--mx) var(--my), rgba(${themeColorRgb}, 0.04) 0%, rgba(3,3,3,0.85) 60%, #030303 100%)`,
        } as React.CSSProperties}
      />
      {/* Floating Canvas Particles */}
      <Particles className="absolute inset-0 z-0" quantity={45} color={themeColorRgb} />

      <div className="relative max-w-7xl mx-auto z-10">
        {/* Premium Compact Navigation Bar */}
        <header className="sticky top-0 z-40 w-full backdrop-blur-md bg-neutral-950/70 border-b border-white/5 py-4 mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black tracking-wider uppercase font-mono">
              <ShinyText text="POCKET DEX" speed={4.5} className="inline-block" />
            </h1>
            {/* Quick Stat Indicators */}
            <div className="flex gap-2.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-mono text-neutral-400 font-bold items-center leading-none">
              <div>
                <span className="text-neutral-500 uppercase">Region:</span>{" "}
                <span className="text-emerald-400">
                  {Math.min(offset - reg.offset, reg.limit)}/{reg.limit}
                </span>
              </div>
              <div className="w-[1px] bg-white/10 h-3" />
              <div>
                <span className="text-neutral-500 uppercase">Total:</span>{" "}
                <span className="text-white">{pokemonList.length}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto flex-grow md:flex-grow-0 max-w-3xl">
            {/* Search bar */}
            <div className="relative flex-grow min-w-[140px] md:min-w-[280px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-neutral-500" />
              <Input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 h-9 bg-neutral-900/40 hover:bg-neutral-900/60 text-xs"
              />
              <button
                onClick={startSpeechRecognition}
                type="button"
                className={`absolute right-2.5 top-1/2 -translate-y-1/2 p-1 transition-all duration-300 ${
                  isListening
                    ? "bg-rose-500/20 text-rose-400 animate-pulse shadow-[0_0_6px_rgba(239,68,68,0.5)]"
                    : "text-neutral-500 hover:text-white"
                }`}
                title="Voice Command Search"
              >
                {isListening ? (
                  <MicOff className="h-3.5 w-3.5" />
                ) : (
                  <Mic className="h-3.5 w-3.5" />
                )}
              </button>
            </div>

            {/* Mobile Filter Button */}
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className={`md:hidden h-9 px-3 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition-all ${
                selectedType !== "all" || selectedRegion !== "kanto" || sortBy !== "id-asc" || showFavoritesOnly
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-neutral-900/40 border-white/10 text-neutral-400"
              }`}
            >
              <span>Filters</span>
              {(selectedType !== "all" || selectedRegion !== "kanto" || sortBy !== "id-asc" || showFavoritesOnly) && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Quick Filters Flex Row for Desktop */}
            <div className="hidden md:flex items-center gap-2">
              {/* Region Selector */}
              <div className="w-28 flex-shrink-0">
                <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                  <SelectTrigger className="h-9 bg-neutral-900/40 font-mono text-[11px] px-2">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="font-mono text-[11px]">
                        {value.name.split(" ")[0]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="w-24 flex-shrink-0">
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="h-9 capitalize bg-neutral-900/40 font-mono text-[11px] px-2">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POKEMON_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize font-mono text-[11px]">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="w-28 flex-shrink-0">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-9 bg-neutral-900/40 font-mono text-[11px] px-2">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id-asc" className="font-mono text-[11px]">Index ↑</SelectItem>
                    <SelectItem value="id-desc" className="font-mono text-[11px]">Index ↓</SelectItem>
                    <SelectItem value="name-asc" className="font-mono text-[11px]">Name A-Z</SelectItem>
                    <SelectItem value="name-desc" className="font-mono text-[11px]">Name Z-A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Favorites Toggle */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title="Show Favorites Only"
                className={`h-9 w-9 rounded-md border flex items-center justify-center transition-all ${
                  showFavoritesOnly
                    ? "bg-rose-500/20 border-rose-500 text-rose-400"
                    : "bg-neutral-900/40 border-white/10 text-neutral-400 hover:text-white"
                }`}
              >
                <Heart className={`h-3.5 w-3.5 ${showFavoritesOnly ? "fill-rose-400" : ""}`} />
              </button>

              {/* Reset Controls */}
              <button
                onClick={handleResetFilters}
                title="Reset Filters"
                className="h-9 w-9 rounded-md border border-white/10 bg-neutral-900/40 hover:bg-neutral-800/80 transition-colors flex items-center justify-center"
              >
                <RotateCcw className="h-3.5 w-3.5 text-neutral-400 hover:text-white" />
              </button>
            </div>
          </div>
        </header>

        {/* Pokemon Main Grid Layout */}
        <main className="mt-8">
          {loading ? (
            // Initial Loading skeleton grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                <PokemonCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <>
              {/* If we have a single global search result */}
              {searchedPokemon && (
                <div className="mb-10 max-w-[280px] mx-auto">
                  <span className="block text-center text-xs font-mono text-emerald-400 uppercase mb-3">
                    🔍 Global Database Hit
                  </span>
                  <BlurFade delay={0.1}>
                    <PokemonCard
                      pokemon={searchedPokemon}
                      isComparing={compareIds.includes(searchedPokemon.id)}
                      onCompareToggle={() => handleCompareToggle(searchedPokemon.id)}
                      isFavorite={favorites.includes(searchedPokemon.id)}
                      onFavoriteToggle={() => handleFavoriteToggle(searchedPokemon.id)}
                      onClick={() => handleCardClick(searchedPokemon.id)}
                    />
                  </BlurFade>
                </div>
              )}

              {/* Grid content */}
              {!searchedPokemon && filteredList.length === 0 && !searchLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 gap-2 border border-dashed border-white/10 rounded-3xl bg-neutral-950/20">
                  <HelpCircle className="h-10 w-10 opacity-30 text-rose-500" />
                  <span className="font-mono text-sm">No Pokedex records found matching queries.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                  {!searchedPokemon &&
                    filteredList.map((pokemon, index) => (
                      <BlurFade
                        key={pokemon.id}
                        delay={0.03 * (index % 12)}
                        yOffset={6}
                      >
                        <PokemonCard
                          pokemon={pokemon}
                          isComparing={compareIds.includes(pokemon.id)}
                          onCompareToggle={() => handleCompareToggle(pokemon.id)}
                          isFavorite={favorites.includes(pokemon.id)}
                          onFavoriteToggle={() => handleFavoriteToggle(pokemon.id)}
                          onClick={() => handleCardClick(pokemon.id)}
                        />
                      </BlurFade>
                    ))}
                </div>
              )}
            </>
          )}

          {/* Loader indicator while doing global search */}
          {searchLoading && (
            <div className="my-10 flex justify-center items-center gap-2 text-neutral-400 font-mono text-sm">
              <span className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
              Scanning global PokéAPI index...
            </div>
          )}

          {/* Load More Button */}
          {showLoadMore && (
            <div className="mt-16 flex justify-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="relative px-8 py-3 rounded-2xl bg-neutral-900 border border-white/10 hover:border-emerald-400/40 text-neutral-200 hover:text-white font-semibold transition-all duration-300 font-mono text-sm shadow-[0_0_20px_rgba(0,0,0,0.5)] group overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-emerald-500 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-out" />
                {loadingMore ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full" />
                    Unlocking dex files...
                  </span>
                ) : (
                  <span>Load Subsequent Entries</span>
                )}
              </button>
            </div>
          )}
        </main>

        {/* Immersive Details Dialog Modal */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>Pokemon Details</DialogTitle>
            </DialogHeader>
            {selectedPokemonId !== null && (
              <PokemonDetails
                pokemonIdOrName={selectedPokemonId}
                onNavigate={handleCardClick}
                isTeamMember={team.some((m) => m.id === selectedPokemonId)}
                onTeamToggle={() => selectedPokemonId && handleToggleTeam(selectedPokemonId)}
                isFavorite={favorites.includes(selectedPokemonId)}
                onFavoriteToggle={() => selectedPokemonId && handleFavoriteToggle(selectedPokemonId)}
              />
            )}
          </DialogContent>
        </Dialog>

        {/* Minigame Modal */}
        <Dialog open={minigameOpen} onOpenChange={setMinigameOpen}>
          <DialogContent className="max-w-md bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>Who's That Pokemon Minigame</DialogTitle>
            </DialogHeader>
            <WhosThatPokemon
              allPokemonList={basicKantoList.length > 0 ? basicKantoList : pokemonList}
            />
          </DialogContent>
        </Dialog>

        {/* Soundboard Modal */}
        <Dialog open={soundboardOpen} onOpenChange={setSoundboardOpen}>
          <DialogContent className="max-w-xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>Vocal Board Launchpad</DialogTitle>
            </DialogHeader>
            <Soundboard
              allPokemonList={basicKantoList.length > 0 ? basicKantoList : pokemonList}
            />
          </DialogContent>
        </Dialog>

        {/* Gym Advisor Counters Modal */}
        <Dialog open={gymCountersOpen} onOpenChange={setGymCountersOpen}>
          <DialogContent className="max-w-2xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>Gym Advisor Guide</DialogTitle>
            </DialogHeader>
            <GymCounters
              allPokemonList={pokemonList}
              onSelectPokemon={(id) => {
                setGymCountersOpen(false);
                setSelectedPokemonId(id);
                setDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Team Builder Modal */}
        <Dialog open={teamBuilderOpen} onOpenChange={setTeamBuilderOpen}>
          <DialogContent className="max-w-4xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>Squad Builder & Analyzer</DialogTitle>
            </DialogHeader>
            <TeamBuilder
              team={team}
              onRemove={handleRemoveFromTeam}
              onAdd={handleAddToTeam}
              allPokemonList={pokemonList.length > 0 ? pokemonList : []}
            />
          </DialogContent>
        </Dialog>

        {/* Battle Arena Modal */}
        <Dialog open={battleArenaOpen} onOpenChange={setBattleArenaOpen}>
          <DialogContent className="max-w-4xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>Mini Battle Arena</DialogTitle>
            </DialogHeader>
            <BattleArena
              team={team}
              allPokemonList={basicKantoList.length > 0 ? basicKantoList : pokemonList}
            />
          </DialogContent>
        </Dialog>

        {/* Card Booster Pack Opener Modal */}
        <Dialog open={packOpenerOpen} onOpenChange={setPackOpenerOpen}>
          <DialogContent className="max-w-4xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>TCG Booster Pack Opener</DialogTitle>
            </DialogHeader>
            <CardPackOpener
              allPokemonList={basicKantoList.length > 0 ? basicKantoList : pokemonList}
            />
          </DialogContent>
        </Dialog>

        {/* Showroom 3D Binder Modal */}
        <Dialog open={showroomOpen} onOpenChange={setShowroomOpen}>
          <DialogContent className="max-w-4xl bg-neutral-950/95 border-white/10">
            <DialogHeader className="sr-only">
              <DialogTitle>3D Holographic Binder</DialogTitle>
            </DialogHeader>
            <Showroom
              favorites={favorites}
              team={team}
              allPokemonList={basicKantoList.length > 0 ? basicKantoList : pokemonList}
              compareIds={compareIds}
              onCompareToggle={handleCompareToggle}
              onFavoriteToggle={handleFavoriteToggle}
              onSelectPokemon={(id) => {
                setShowroomOpen(false);
                setSelectedPokemonId(id);
                setDialogOpen(true);
              }}
            />
          </DialogContent>
        </Dialog>

        {/* Mobile Filters Modal Dialog */}
        <Dialog open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
          <DialogContent className="max-w-md w-[95vw] rounded-2xl bg-neutral-950/95 border-white/10 p-6 font-mono text-xs">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-widest text-neutral-400 mb-4">
                Refine Pokédex Indexes
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5">
              {/* Region Selector */}
              <div className="space-y-1.5">
                <span className="text-neutral-500 uppercase tracking-wider text-[10px]">Select Region</span>
                <Select value={selectedRegion} onValueChange={(val) => { setSelectedRegion(val); setMobileFiltersOpen(false); }}>
                  <SelectTrigger className="h-10 bg-neutral-900/40 w-full text-xs">
                    <SelectValue placeholder="Region" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(REGIONS).map(([key, value]) => (
                      <SelectItem key={key} value={key} className="text-xs">
                        {value.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Type Filter */}
              <div className="space-y-1.5">
                <span className="text-neutral-500 uppercase tracking-wider text-[10px]">Select Element Type</span>
                <Select value={selectedType} onValueChange={(val) => { setSelectedType(val); setMobileFiltersOpen(false); }}>
                  <SelectTrigger className="h-10 bg-neutral-900/40 w-full capitalize text-xs">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {POKEMON_TYPES.map((type) => (
                      <SelectItem key={type} value={type} className="capitalize text-xs">
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort Order */}
              <div className="space-y-1.5">
                <span className="text-neutral-500 uppercase tracking-wider text-[10px]">Sort Order</span>
                <Select value={sortBy} onValueChange={(val) => { setSortBy(val); setMobileFiltersOpen(false); }}>
                  <SelectTrigger className="h-10 bg-neutral-900/40 w-full text-xs">
                    <SelectValue placeholder="Order" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="id-asc" className="text-xs">Index: Low to High</SelectItem>
                    <SelectItem value="id-desc" className="text-xs">Index: High to Low</SelectItem>
                    <SelectItem value="name-asc" className="text-xs">Alphabetical: A to Z</SelectItem>
                    <SelectItem value="name-desc" className="text-xs">Alphabetical: Z to A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Favorites & Reset actions in row */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowFavoritesOnly(!showFavoritesOnly);
                    setMobileFiltersOpen(false);
                  }}
                  className={`h-11 flex-1 rounded-xl border flex items-center justify-center gap-2 font-bold uppercase tracking-wider transition-all ${
                    showFavoritesOnly
                      ? "bg-rose-500/20 border-rose-500 text-rose-400"
                      : "bg-neutral-900/40 border-white/10 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-rose-400" : ""}`} />
                  <span>{showFavoritesOnly ? "Show All" : "Favorites"}</span>
                </button>

                <button
                  onClick={() => {
                    handleResetFilters();
                    setMobileFiltersOpen(false);
                  }}
                  className="h-11 px-4 rounded-xl border border-white/10 bg-neutral-900 hover:bg-neutral-800 transition-colors flex items-center justify-center gap-2 text-neutral-400 hover:text-white font-bold uppercase tracking-wider"
                >
                  <RotateCcw className="h-4 w-4" />
                  <span>Reset</span>
                </button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Floating Compare Deck Panel */}
        <CompareDeck
          compareIds={compareIds}
          allPokemonList={pokemonList}
          onRemove={(id) => setCompareIds((prev) => prev.filter((x) => x !== id))}
          onClear={() => setCompareIds([])}
        />

        {/* Floating Speech Recognition Banner Toast */}
        {voiceToast && (
          <div className="fixed bottom-6 right-6 z-[9999] p-3.5 px-6 rounded-2xl border border-white/10 bg-neutral-950/90 text-white font-mono text-xs shadow-2xl flex items-center gap-2 animate-bounce">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-400 animate-ping" />
            <span>{voiceToast}</span>
          </div>
        )}

        {/* Explore Drawer Modal for Mobile */}
        <Dialog open={exploreOpen} onOpenChange={setExploreOpen}>
          <DialogContent className="max-w-md w-[95vw] rounded-2xl bg-neutral-950/95 border-white/10 p-6">
            <DialogHeader>
              <DialogTitle className="font-mono text-xs uppercase tracking-widest text-neutral-500 mb-2">
                Explore Utilities
              </DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 gap-3 mt-2 font-mono">
              <button
                onClick={() => { setExploreOpen(false); setShowroomOpen(true); }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-400/10 flex items-center justify-center border border-amber-500/20">
                  <Sparkles className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <span className="block text-xs font-bold text-white">3D Showroom</span>
                  <span className="text-[10px] text-neutral-400">View squad & favorites in a rotating 3D carousel</span>
                </div>
              </button>
              <button
                onClick={() => { setExploreOpen(false); setBattleArenaOpen(true); }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center border border-rose-500/20">
                  <Sword className="h-5 w-5 text-rose-400" />
                </div>
                <div>
                  <span className="block font-mono text-xs font-bold text-white">Battle Arena</span>
                  <span className="text-[10px] text-neutral-400">Deploy squad & engage in simulated combat</span>
                </div>
              </button>

              <button
                onClick={() => { setExploreOpen(false); setMinigameOpen(true); }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center border border-amber-500/20">
                  <Gamepad2 className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <span className="block font-mono text-xs font-bold text-white">Silhouette Game</span>
                  <span className="text-[10px] text-neutral-400">Test your knowledge identifying silhouettes</span>
                </div>
              </button>

              <button
                onClick={() => { setExploreOpen(false); setSoundboardOpen(true); }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                  <Volume2 className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <span className="block font-mono text-xs font-bold text-white">Vocal Board</span>
                  <span className="text-[10px] text-neutral-400">Play dynamic Pokemon voice cries</span>
                </div>
              </button>

              <button
                onClick={() => { setExploreOpen(false); setGymCountersOpen(true); }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
                  <ShieldAlert className="h-5 w-5 text-red-400" />
                </div>
                <div>
                  <span className="block font-mono text-xs font-bold text-white">Gym Advisors</span>
                  <span className="text-[10px] text-neutral-400">Identify type counters for gym leaders</span>
                </div>
              </button>

              <button
                onClick={() => { setExploreOpen(false); setPackOpenerOpen(true); }}
                className="flex items-center gap-4 p-3.5 rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                  <Layers className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <span className="block font-mono text-xs font-bold text-white">Booster Opener</span>
                  <span className="text-[10px] text-neutral-400">Simulate opening official TCG packs</span>
                </div>
              </button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Mobile Bottom Navigation Bar */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90vw] max-w-[380px] z-[99] bg-[#0c0c10]/85 border border-white/10 backdrop-blur-xl py-2 px-3 rounded-2xl flex justify-around items-center shadow-[0_12px_36px_rgba(0,0,0,0.65)]">
          <button
            onClick={() => {
              handleResetFilters();
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center active:scale-90 transition-transform">
              <Home className="h-4.5 w-4.5 text-blue-400" />
            </div>
            <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-neutral-400">Home</span>
          </button>
          
          <button
            onClick={() => setTeamBuilderOpen(true)}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center active:scale-90 transition-transform">
              <Users className="h-4.5 w-4.5 text-cyan-400" />
            </div>
            <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-neutral-400">Squad</span>
          </button>

          <button
            onClick={() => setExploreOpen(true)}
            className="flex flex-col items-center gap-1 focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/25 flex items-center justify-center active:scale-90 transition-transform">
              <Layers className="h-4.5 w-4.5 text-purple-400" />
            </div>
            <span className="text-[8px] font-mono font-bold tracking-wider uppercase text-neutral-400">Explore</span>
          </button>
        </div>

        {/* macOS-style Magnifying Navigation Dock */}
        <div className="hidden md:block fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] max-w-full">
          <Dock items={dockItems} magnification={60} baseItemSize={44} panelHeight={54} />
        </div>

      </div>
    </div>
  </ClickSpark>
);
}

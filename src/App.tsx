import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, RotateCcw, HelpCircle, Gamepad2, Volume2, ShieldAlert, Heart, Users, Mic, MicOff, Sword, Home, Layers, Sparkles, WifiOff } from "lucide-react";
import { fetchPokemonList, fetchPokemonDetails, fetchBasicPokemonList } from "./services/pokeapi";
import type { PokemonBase, PokemonFullDetails } from "./services/pokeapi";
import { TYPE_COLORS, POKEMON_TYPES } from "./constants/types";
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
import { Input } from "./components/ui/Input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./components/ui/Dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./components/ui/Select";
import { ShinyText } from "./components/react-bits/ShinyText";
import Dock from "./components/react-bits/Dock";
import TrueFocus from "./components/react-bits/TrueFocus";

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

  // URL search params — sync ?pokemon=ID with detail dialog
  const [, setSearchParams] = useSearchParams();

  // Lists & pagination
  const [pokemonList, setPokemonList] = useState<PokemonBase[]>([]);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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
  const [gridVisible, setGridVisible] = useState(true);

  // Dynamic page title
  useEffect(() => {
    const regionName = REGIONS[selectedRegion]?.name.split(" ")[0] ?? "Pokédex";
    document.title = `PocketDex · ${regionName}`;
  }, [selectedRegion]);

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

  // Detail Dialog state — synced with ?pokemon= URL param
  const [selectedPokemonId, setSelectedPokemonId] = useState<number | null>(() => {
    const param = new URLSearchParams(window.location.search).get("pokemon");
    return param ? parseInt(param, 10) : null;
  });
  const [dialogOpen, setDialogOpen] = useState(() => {
    return !!new URLSearchParams(window.location.search).get("pokemon");
  });

  // Compare Deck state — persisted to localStorage
  const [compareIds, setCompareIds] = useState<number[]>(() => {
    const saved = localStorage.getItem("pocketdex_compare");
    return saved ? JSON.parse(saved) : [];
  });

  // Sync compareIds to localStorage
  useEffect(() => {
    localStorage.setItem("pocketdex_compare", JSON.stringify(compareIds));
  }, [compareIds]);

  // Sync selectedPokemonId ↔ ?pokemon= URL param
  useEffect(() => {
    if (dialogOpen && selectedPokemonId !== null) {
      setSearchParams({ pokemon: String(selectedPokemonId) }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [dialogOpen, selectedPokemonId, setSearchParams]);

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

  const anyModalOpen = showroomOpen || battleArenaOpen || gymCountersOpen || teamBuilderOpen ||
    soundboardOpen || minigameOpen || packOpenerOpen;

  const dockItems = [
    {
      icon: <Home size={18} className="text-blue-400" />,
      label: "Home",
      onClick: () => handleResetFilters(),
      isActive: !anyModalOpen,
    },
    {
      icon: <Sparkles size={18} className="text-amber-400" />,
      label: "3D Showroom",
      onClick: () => setShowroomOpen(true),
      isActive: showroomOpen,
    },
    {
      icon: <Sword size={18} className="text-rose-500" />,
      label: "Battle Arena",
      onClick: () => setBattleArenaOpen(true),
      isActive: battleArenaOpen,
    },
    {
      icon: <ShieldAlert size={18} className="text-rose-400" />,
      label: "Gym Advisors",
      onClick: () => setGymCountersOpen(true),
      isActive: gymCountersOpen,
    },
    {
      icon: <Users size={18} className="text-cyan-400" />,
      label: "Squad Builder",
      onClick: () => setTeamBuilderOpen(true),
      isActive: teamBuilderOpen,
    },
    {
      icon: <Volume2 size={18} className="text-emerald-400" />,
      label: "Vocal Board",
      onClick: () => setSoundboardOpen(true),
      isActive: soundboardOpen,
    },
    {
      icon: <Gamepad2 size={18} className="text-amber-400" />,
      label: "Silhouette Game",
      onClick: () => setMinigameOpen(true),
      isActive: minigameOpen,
    },
    {
      icon: <Layers size={18} className="text-purple-400" />,
      label: "Booster Opener",
      onClick: () => setPackOpenerOpen(true),
      isActive: packOpenerOpen,
    },
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

  // Dismiss splash once data is ready
  useEffect(() => {
    if (basicKantoList.length > 0) {
      const timer = setTimeout(() => {
        playRetroBeep();
        const splashOverlay = document.getElementById("neo-splash-overlay");
        if (splashOverlay) {
          splashOverlay.style.transition = "opacity 0.4s ease";
          splashOverlay.style.opacity = "0";
          setTimeout(() => setShowSplash(false), 420);
        } else {
          setShowSplash(false);
        }
      }, 1200);
      return () => clearTimeout(timer);
    }
  }, [basicKantoList]);

  // Safety fallback in case APIs fail
  useEffect(() => {
    const safetyTimer = setTimeout(() => {
      setShowSplash(false);
    }, 4500);
    return () => clearTimeout(safetyTimer);
  }, []);

  const PAGE_LIMIT = 24;

  // Load region when selectedRegion changes
  useEffect(() => {
    async function loadRegion() {
      setGridVisible(false);
      setLoading(true);
      setLoadError(null);
      const reg = REGIONS[selectedRegion];
      try {
        const list = await fetchPokemonList(PAGE_LIMIT, reg.offset);
        setPokemonList(list);
        setOffset(reg.offset + PAGE_LIMIT);
      } catch {
        setLoadError("Couldn't reach PokéAPI. Check your connection and try again.");
        setPokemonList([]);
      } finally {
        setLoading(false);
        setGridVisible(true);
      }
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
      <div
        className="relative min-h-screen pb-32 px-4 md:px-8 select-none"
        style={{
          backgroundImage: selectedType === "all"
            ? 'none'
            : `radial-gradient(ellipse 80% 30% at 50% 0%, rgba(${themeColorRgb}, 0.06) 0%, transparent 70%)`,
          transition: "background-image 0.5s ease",
        }}
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
                <span className="animate-pulse">Caching national index entries...</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-neutral-900 border border-white/5 rounded-full overflow-hidden relative">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 rounded-full animate-[loadingBar_1.8s_ease-out_forwards]"
                />
              </div>
              
              <div className="flex justify-between items-center text-[9px] text-neutral-600">
                <span>SYS_INIT</span>
                <span>ONLINE</span>
              </div>
            </div>

          </div>
        </div>
      )}
      

      <div className="relative max-w-7xl mx-auto z-10">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 w-full" style={{ background: "rgba(8,8,12,0.95)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>

          {/* ── Main bar ── */}
          <div className="flex items-center h-[60px] px-5 md:px-8 gap-4">

            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0 select-none">
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="13" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5"/>
                <path d="M1.5 14 A12.5 12.5 0 0 1 26.5 14" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="1.5" y1="14" x2="9" y2="14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                <line x1="19" y1="14" x2="26.5" y2="14" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="3.5" fill="#0a0a10" stroke="#34d399" strokeWidth="1.5"/>
                <circle cx="14" cy="14" r="1.5" fill="#34d399"/>
              </svg>
              <h1 className="text-[15px] font-black tracking-tight text-white leading-none">
                Pocket<span className="text-emerald-400">Dex</span>
              </h1>
            </div>

            {/* Search — center, grows */}
            <div className="relative flex-1 max-w-[480px] mx-auto">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 pointer-events-none" />
              <Input
                type="text"
                placeholder="Search by name or number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 pl-10 pr-10 rounded-2xl text-sm bg-white/[0.06] border-white/[0.09] hover:border-white/[0.18] focus:border-emerald-500/60 focus:bg-white/[0.08] placeholder:text-neutral-600 transition-all"
              />
              <button
                onClick={startSpeechRecognition}
                title="Voice search"
                className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                  isListening ? "text-rose-400 animate-pulse" : "text-neutral-600 hover:text-white"
                }`}
              >
                {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
              </button>
            </div>

            {/* Right controls */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-auto">
              <Select value={selectedRegion} onValueChange={setSelectedRegion}>
                <SelectTrigger className="h-9 w-[108px] rounded-xl text-[12px] font-medium bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.10] transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(REGIONS).map(([key, val]) => (
                    <SelectItem key={key} value={key} className="text-[12px]">
                      {val.name.split(" ")[0]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="hidden sm:flex h-9 w-[96px] rounded-xl text-[12px] font-medium bg-white/[0.06] border-white/[0.08] hover:bg-white/[0.10] transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id-asc" className="text-[12px]">ID ↑</SelectItem>
                  <SelectItem value="id-desc" className="text-[12px]">ID ↓</SelectItem>
                  <SelectItem value="name-asc" className="text-[12px]">A → Z</SelectItem>
                  <SelectItem value="name-desc" className="text-[12px]">Z → A</SelectItem>
                </SelectContent>
              </Select>

              <div className="w-px h-5 bg-white/[0.08] hidden sm:block" />

              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                title="Favorites"
                className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${
                  showFavoritesOnly
                    ? "bg-rose-500/20 text-rose-400 ring-1 ring-rose-500/40"
                    : "text-neutral-500 hover:text-rose-400 hover:bg-white/[0.06]"
                }`}
              >
                <Heart className={`h-4 w-4 ${showFavoritesOnly ? "fill-rose-400" : ""}`} />
              </button>

              <button
                onClick={handleResetFilters}
                title="Reset filters"
                className="h-9 w-9 rounded-xl text-neutral-500 hover:text-white hover:bg-white/[0.06] transition-all flex items-center justify-center"
              >
                <RotateCcw className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* ── Type filter strip ── */}
          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none px-5 md:px-8 pb-3" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 2%, black 95%, transparent 100%)" }}>
            {POKEMON_TYPES.map((type) => {
              const color = type === "all" ? "#94a3b8" : (TYPE_COLORS[type] || "#94a3b8");
              const active = selectedType === type;
              return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className="flex-shrink-0 h-7 px-3.5 rounded-full text-[11px] font-semibold capitalize transition-all duration-150"
                  style={active ? {
                    color: "#fff",
                    background: color,
                    boxShadow: `0 0 14px ${color}55, 0 2px 6px rgba(0,0,0,0.4)`,
                  } : {
                    color: "rgba(255,255,255,0.4)",
                    background: "rgba(255,255,255,0.05)",
                  }}
                >
                  {type}
                </button>
              );
            })}
          </div>
        </header>

        {/* Pokemon Main Grid */}
        <main className="px-4 md:px-8 pt-6 pb-24">
          {/* API Error state */}
          {loadError && !loading && (
            <div className="h-64 flex flex-col items-center justify-center gap-3 border border-dashed border-rose-500/20 rounded-3xl bg-rose-950/10 text-rose-400">
              <WifiOff className="h-10 w-10 opacity-60" />
              <p className="font-mono text-sm text-center px-4">{loadError}</p>
              <button
                onClick={() => setSelectedRegion(selectedRegion)}
                className="mt-1 px-4 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 font-mono text-xs hover:bg-rose-500/20 transition-colors"
              >
                Retry
              </button>
            </div>
          )}
          {loading ? (
            // Initial Loading skeleton grid
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
              {Array.from({ length: PAGE_LIMIT }).map((_, i) => (
                <PokemonCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div style={{ transition: "opacity 220ms ease", opacity: gridVisible ? 1 : 0 }}>
              {/* If we have a single global search result */}
              {searchedPokemon && (
                <div className="mb-10 max-w-[220px] mx-auto">
                  <span className="block text-center text-xs font-mono text-emerald-400 uppercase mb-3 tracking-wider">
                    Global match
                  </span>
                  <PokemonCard
                    pokemon={searchedPokemon}
                    isComparing={compareIds.includes(searchedPokemon.id)}
                    onCompareToggle={() => handleCompareToggle(searchedPokemon.id)}
                    isFavorite={favorites.includes(searchedPokemon.id)}
                    onFavoriteToggle={() => handleFavoriteToggle(searchedPokemon.id)}
                    onClick={() => handleCardClick(searchedPokemon.id)}
                  />
                </div>
              )}

              {/* Grid content */}
              {!searchedPokemon && filteredList.length === 0 && !searchLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-neutral-500 gap-2 border border-dashed border-white/10 rounded-3xl bg-neutral-950/20">
                  <HelpCircle className="h-10 w-10 opacity-30 text-rose-500" />
                  <span className="font-mono text-sm">No Pokedex records found matching queries.</span>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                  {!searchedPokemon &&
                    filteredList.map((pokemon) => (
                      <PokemonCard
                        key={pokemon.id}
                        pokemon={pokemon}
                        isComparing={compareIds.includes(pokemon.id)}
                        onCompareToggle={() => handleCompareToggle(pokemon.id)}
                        isFavorite={favorites.includes(pokemon.id)}
                        onFavoriteToggle={() => handleFavoriteToggle(pokemon.id)}
                        onClick={() => handleCardClick(pokemon.id)}
                      />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Loader indicator while doing global search */}
          {searchLoading && (
            <div className="my-10 flex justify-center items-center gap-2 text-neutral-400 font-mono text-sm">
              <span className="animate-spin h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full" />
              Scanning global PokéAPI index...
            </div>
          )}
        </main>

        {/* ── Sticky load-more bar ── */}
        {!loading && !searchedPokemon && !loadError && (
          <div className="fixed bottom-[72px] md:bottom-[80px] left-1/2 -translate-x-1/2 z-50 pointer-events-none"
               style={{ width: "min(480px, calc(100vw - 32px))" }}>
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-2xl border border-white/[0.08] bg-[#0e0e14]/90 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
              {/* Progress */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[11px] font-mono text-neutral-400">
                    <span className="text-white font-bold">{pokemonList.length}</span>
                    <span className="text-neutral-600"> / {REGIONS[selectedRegion].limit} · {REGIONS[selectedRegion].name.split(" ")[0]}</span>
                  </span>
                  {filteredList.length !== pokemonList.length && (
                    <span className="text-[10px] font-mono text-emerald-400">{filteredList.length} shown</span>
                  )}
                </div>
                <div className="h-[3px] w-full rounded-full bg-white/[0.06] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (pokemonList.length / REGIONS[selectedRegion].limit) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Load more button */}
              {showLoadMore && (
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="flex-shrink-0 h-8 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-400/60 text-[12px] font-bold font-mono transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                >
                  {loadingMore ? (
                    <span className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    "Load more"
                  )}
                </button>
              )}
              {!showLoadMore && pokemonList.length >= REGIONS[selectedRegion].limit && (
                <span className="flex-shrink-0 text-[10px] font-mono text-neutral-600">All loaded ✓</span>
              )}
            </div>
          </div>
        )}

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
);
}

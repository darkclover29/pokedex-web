import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Sword, Shield, Sparkles, RotateCcw, Search, ChevronRight } from "lucide-react";
import { fetchPokemonDetails } from "../services/pokeapi";
import type { PokemonBase, PokemonFullDetails } from "../services/pokeapi";
import { getAttackMultiplier } from "../services/typeEffectiveness";
import SideRays from "./react-bits/SideRays";

interface BattleArenaProps {
  team: PokemonFullDetails[];
  allPokemonList: PokemonBase[];
}

interface MoveDetail {
  name: string;
  type: string;
  category: "Physical" | "Special";
  power: number;
  accuracy: number;
}

// Map spoken or written move names to logical stats to simulate combat moves offline
const getMoveDetails = (moveName: string, pokemonTypes: string[]): MoveDetail => {
  let type = pokemonTypes[0] || "normal";
  const nameLower = moveName.toLowerCase();
  
  if (nameLower.includes("fire") || nameLower.includes("ember") || nameLower.includes("flame") || nameLower.includes("blast")) type = "fire";
  else if (nameLower.includes("water") || nameLower.includes("surf") || nameLower.includes("hydro") || nameLower.includes("bubble") || nameLower.includes("waterfall")) type = "water";
  else if (nameLower.includes("thunder") || nameLower.includes("bolt") || nameLower.includes("spark") || nameLower.includes("shock") || nameLower.includes("zap")) type = "electric";
  else if (nameLower.includes("grass") || nameLower.includes("vine") || nameLower.includes("leaf") || nameLower.includes("seed") || nameLower.includes("solar") || nameLower.includes("absorb")) type = "grass";
  else if (nameLower.includes("ice") || nameLower.includes("beam") || nameLower.includes("blizzard") || nameLower.includes("powder") || nameLower.includes("freeze")) type = "ice";
  else if (nameLower.includes("poison") || nameLower.includes("sludge") || nameLower.includes("toxic") || nameLower.includes("acid") || nameLower.includes("smog")) type = "poison";
  else if (nameLower.includes("ground") || nameLower.includes("earth") || nameLower.includes("quake") || nameLower.includes("mud") || nameLower.includes("dig") || nameLower.includes("sand")) type = "ground";
  else if (nameLower.includes("fly") || nameLower.includes("wing") || nameLower.includes("gust") || nameLower.includes("peck") || nameLower.includes("air") || nameLower.includes("hurricane")) type = "flying";
  else if (nameLower.includes("psych") || nameLower.includes("mind") || nameLower.includes("confusion") || nameLower.includes("dream") || nameLower.includes("zen")) type = "psychic";
  else if (nameLower.includes("bug") || nameLower.includes("bite") || nameLower.includes("leech") || nameLower.includes("string") || nameLower.includes("pin")) type = "bug";
  else if (nameLower.includes("rock") || nameLower.includes("stone") || nameLower.includes("slide") || nameLower.includes("throw") || nameLower.includes("tomb") || nameLower.includes("roll")) type = "rock";
  else if (nameLower.includes("shadow") || nameLower.includes("ghost") || nameLower.includes("lick") || nameLower.includes("night") || nameLower.includes("spook")) type = "ghost";
  else if (nameLower.includes("dragon") || nameLower.includes("claw") || nameLower.includes("rage") || nameLower.includes("breath") || nameLower.includes("outrage")) type = "dragon";
  else if (nameLower.includes("bite") || nameLower.includes("crunch") || nameLower.includes("dark") || nameLower.includes("feint") || nameLower.includes("sucker")) type = "dark";
  else if (nameLower.includes("iron") || nameLower.includes("steel") || nameLower.includes("metal") || nameLower.includes("flash")) type = "steel";
  else if (nameLower.includes("fairy") || nameLower.includes("dazzle") || nameLower.includes("moon") || nameLower.includes("pixie") || nameLower.includes("charm")) type = "fairy";
  else if (nameLower.includes("double") || nameLower.includes("tackle") || nameLower.includes("scratch") || nameLower.includes("pound") || nameLower.includes("slam") || nameLower.includes("hyper") || nameLower.includes("mega") || nameLower.includes("strike") || nameLower.includes("punch")) type = "normal";

  const physicalTypes = ["normal", "fighting", "flying", "poison", "ground", "rock", "bug", "ghost", "steel"];
  const category = physicalTypes.includes(type) ? "Physical" : "Special";
  
  let power = 50 + (moveName.length % 8) * 10;
  if (nameLower.includes("hyper") || nameLower.includes("blast") || nameLower.includes("earthquake") || nameLower.includes("hydro") || nameLower.includes("solar") || nameLower.includes("blizzard") || nameLower.includes("outrage")) {
    power = 110;
  } else if (nameLower.includes("tackle") || nameLower.includes("scratch") || nameLower.includes("growl") || nameLower.includes("tail") || nameLower.includes("absorb") || nameLower.includes("pound")) {
    power = 40;
  }

  return {
    name: moveName,
    type,
    category,
    power,
    accuracy: 85 + (moveName.length % 4) * 5,
  };
};

const getStatValue = (pokemon: PokemonFullDetails, statName: string): number => {
  const stat = pokemon.stats.find(s => s.name.toLowerCase() === statName.toLowerCase());
  return stat ? stat.value : 50;
};

// Web Audio API Synthesizer sounds
const playSynthSound = (type: "hit" | "super-effective" | "not-very-effective" | "victory" | "defeat" | "select") => {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    
    if (type === "select") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(600, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.08);
    } else if (type === "hit") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === "super-effective") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(800, now + 0.25);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.03, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === "not-very-effective") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(80, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.015, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.2);
    } else if (type === "victory") {
      const playTone = (freq: number, startOffset: number, duration: number) => {
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = "square";
        osc2.frequency.setValueAtTime(freq, now + startOffset);
        gain2.gain.setValueAtTime(0, now + startOffset);
        gain2.gain.linearRampToValueAtTime(0.015, now + startOffset + 0.01);
        gain2.gain.exponentialRampToValueAtTime(0.0001, now + startOffset + duration);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now + startOffset);
        osc2.stop(now + startOffset + duration);
      };
      playTone(523.25, 0, 0.12);       // C5
      playTone(659.25, 0.12, 0.12);     // E5
      playTone(783.99, 0.24, 0.12);     // G5
      playTone(1046.50, 0.36, 0.35);    // C6
    } else if (type === "defeat") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(300, now);
      osc.frequency.linearRampToValueAtTime(100, now + 0.6);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.02, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.6);
    }
  } catch (e) {
    console.warn("Audio blocked:", e);
  }
};

const MEGA_MAPPINGS: Record<number, { name: string; megaId: number; types: string[] }> = {
  3: { name: "Mega Venusaur", megaId: 10033, types: ["grass", "poison"] },
  6: { name: "Mega Charizard X", megaId: 10034, types: ["fire", "dragon"] },
  9: { name: "Mega Blastoise", megaId: 10036, types: ["water"] },
  65: { name: "Mega Alakazam", megaId: 10037, types: ["psychic"] },
  94: { name: "Mega Gengar", megaId: 10038, types: ["ghost", "poison"] },
  130: { name: "Mega Gyarados", megaId: 10041, types: ["water", "dark"] },
  142: { name: "Mega Aerodactyl", megaId: 10042, types: ["rock", "flying"] },
  150: { name: "Mega Mewtwo Y", megaId: 10044, types: ["psychic"] }
};

export function BattleArena({ team, allPokemonList }: BattleArenaProps) {
  // Fighter selection states
  const [playerFighter, setPlayerFighter] = useState<PokemonFullDetails | null>(null);
  const [opponentFighter, setOpponentFighter] = useState<PokemonFullDetails | null>(null);
  const [isLoadingPlayerDetails, setIsLoadingPlayerDetails] = useState(false);
  const [isLoadingOppDetails, setIsLoadingOppDetails] = useState(false);

  // Combat loop states
  const [playerHP, setPlayerHP] = useState(100);
  const [playerMaxHP, setPlayerMaxHP] = useState(100);
  const [opponentHP, setOpponentHP] = useState(100);
  const [opponentMaxHP, setOpponentMaxHP] = useState(100);

  const [battleLogs, setBattleLogs] = useState<string[]>([]);
  const [gameState, setGameState] = useState<"setup" | "combat" | "victory" | "defeat">("setup");
  const [combatTurn, setCombatTurn] = useState<"player" | "opponent" | "animating">("player");

  // Selection filter lists
  const [opponentSearch, setOpponentSearch] = useState("");
  const [playerSearch, setPlayerSearch] = useState("");

  // Mega Evolution States
  const [hasPlayerMegaEvolved, setHasPlayerMegaEvolved] = useState(false);
  const [hasOpponentMegaEvolved, setHasOpponentMegaEvolved] = useState(false);
  const [isMegaAnimating, setIsMegaAnimating] = useState(false);

  // Refs for GSAP shakes & damage counters
  const playerCardRef = useRef<HTMLDivElement>(null);
  const opponentCardRef = useRef<HTMLDivElement>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const [playerFloatDamage, setPlayerFloatDamage] = useState<number | string | null>(null);
  const [opponentFloatDamage, setOpponentFloatDamage] = useState<number | string | null>(null);

  const playerDamageFloatRef = useRef<HTMLDivElement>(null);
  const opponentDamageFloatRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [battleLogs]);

  // Load a default challenger and opponent if user has squad/list loaded
  useEffect(() => {
    if (team && team.length > 0 && !playerFighter) {
      setPlayerFighter(team[0]);
    }
    if (allPokemonList && allPokemonList.length > 0 && !opponentFighter) {
      handleRandomizeOpponent();
    }
  }, [team, allPokemonList]);

  // Pick random opponent from 151 basic list and fetch full details
  const handleRandomizeOpponent = async () => {
    if (!allPokemonList || allPokemonList.length === 0) return;
    setIsLoadingOppDetails(true);
    playSynthSound("select");
    const randomIndex = Math.floor(Math.random() * allPokemonList.length);
    const selected = allPokemonList[randomIndex];
    const details = await fetchPokemonDetails(selected.id);
    if (details) {
      setOpponentFighter(details);
    }
    setIsLoadingOppDetails(false);
  };

  // Select opponent from searches
  const handleSelectOpponent = async (pokemon: PokemonBase) => {
    setIsLoadingOppDetails(true);
    playSynthSound("select");
    setOpponentSearch("");
    const details = await fetchPokemonDetails(pokemon.id);
    if (details) {
      setOpponentFighter(details);
    }
    setIsLoadingOppDetails(false);
  };

  // Select player fighter from searches (if custom picking outside team)
  const handleSelectPlayer = async (pokemon: PokemonBase) => {
    setIsLoadingPlayerDetails(true);
    playSynthSound("select");
    setPlayerSearch("");
    const details = await fetchPokemonDetails(pokemon.id);
    if (details) {
      setPlayerFighter(details);
    }
    setIsLoadingPlayerDetails(false);
  };

  // Trigger opponent turn via useEffect to avoid stale React closures
  useEffect(() => {
    if (gameState === "combat" && combatTurn === "opponent") {
      const timer = setTimeout(() => {
        executeOpponentTurn();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [combatTurn, gameState]);

  // Initialize combat variables
  const handleCommenceBattle = () => {
    if (!playerFighter || !opponentFighter) return;
    
    // Play sound
    playSynthSound("select");

    const pHP = getStatValue(playerFighter, "hp") * 2 + 110; // Standard level 50 HP formula: 2 * Base + 110
    const oHP = getStatValue(opponentFighter, "hp") * 2 + 110;

    setPlayerMaxHP(pHP);
    setPlayerHP(pHP);
    setOpponentMaxHP(oHP);
    setOpponentHP(oHP);

    setBattleLogs([
      `⚔️ Battle commenced between Challenger ${playerFighter.name.toUpperCase()} (Lv. 50) and Wild ${opponentFighter.name.toUpperCase()} (Lv. 50)!`
    ]);

    setGameState("combat");

    // Speed comparison decides who starts
    const pSpeed = getStatValue(playerFighter, "speed");
    const oSpeed = getStatValue(opponentFighter, "speed");

    if (pSpeed >= oSpeed) {
      setCombatTurn("player");
      setBattleLogs((prev) => [
        ...prev,
        `📢 ${playerFighter.name.toUpperCase()} is faster! Choose your move to strike first.`
      ]);
    } else {
      setCombatTurn("opponent");
      setBattleLogs((prev) => [
        ...prev,
        `📢 Wild ${opponentFighter.name.toUpperCase()} is faster and prepares to strike first!`
      ]);
    }
  };

  // Trigger GSAP damage shake on target card
  const animateDamageShake = (side: "player" | "opponent") => {
    const card = side === "player" ? playerCardRef.current : opponentCardRef.current;
    if (!card) return;
    
    gsap.timeline()
      .to(card, { x: -10, duration: 0.05, ease: "power1.out" })
      .to(card, { x: 10, duration: 0.05, ease: "power1.inOut" })
      .to(card, { x: -8, duration: 0.05, ease: "power1.inOut" })
      .to(card, { x: 8, duration: 0.05, ease: "power1.inOut" })
      .to(card, { x: 0, duration: 0.05, ease: "power1.in" });
  };

  // Trigger floating damage numbers popping up
  const animateDamageFloat = (side: "player" | "opponent", damageVal: number | string) => {
    if (side === "player") {
      setPlayerFloatDamage(damageVal);
      setTimeout(() => {
        const floatEl = playerDamageFloatRef.current;
        if (floatEl) {
          gsap.fromTo(floatEl, 
            { opacity: 0, y: 10 },
            { opacity: 1, y: -30, duration: 0.4, ease: "back.out(2)" }
          );
          gsap.to(floatEl, { opacity: 0, delay: 0.6, duration: 0.2 });
        }
      }, 0);
    } else {
      setOpponentFloatDamage(damageVal);
      setTimeout(() => {
        const floatEl = opponentDamageFloatRef.current;
        if (floatEl) {
          gsap.fromTo(floatEl, 
            { opacity: 0, y: 10 },
            { opacity: 1, y: -30, duration: 0.4, ease: "back.out(2)" }
          );
          gsap.to(floatEl, { opacity: 0, delay: 0.6, duration: 0.2 });
        }
      }, 0);
    }
  };

  // Calculate damage output
  const calculateDamage = (attacker: PokemonFullDetails, defender: PokemonFullDetails, move: MoveDetail) => {
    // Check if move hits
    const hitRoll = Math.random() * 100;
    if (hitRoll > move.accuracy) {
      return { damage: 0, multiplier: 1.0, missed: true };
    }

    // Determine stats
    const isPhysical = move.category === "Physical";
    const attackVal = isPhysical 
      ? getStatValue(attacker, "attack") 
      : getStatValue(attacker, "special-attack");
    const defenseVal = isPhysical 
      ? getStatValue(defender, "defense") 
      : getStatValue(defender, "special-defense");

    // Standard simplified Level 50 damage formula:
    // Damage = (((2 * Level / 5 + 2) * MovePower * (Attack / Defense) / 50) + 2) * Modifier
    const levelFactor = (2 * 50) / 5 + 2; // 22
    const baseDamage = ((levelFactor * move.power * (attackVal / Math.max(1, defenseVal))) / 50) + 2;

    // Type Matchup modifier
    const multiplier = getAttackMultiplier(move.type, defender.types);

    // Random variance [0.85, 1.0]
    const variance = 0.85 + Math.random() * 0.15;

    const finalDamage = Math.max(1, Math.floor(baseDamage * multiplier * variance));

    return { damage: finalDamage, multiplier, missed: false };
  };

  // Player triggers action
  const handlePlayerAttack = (rawMoveName: string) => {
    if (combatTurn !== "player" || !playerFighter || !opponentFighter || gameState !== "combat") return;

    setCombatTurn("animating");
    const move = getMoveDetails(rawMoveName, playerFighter.types);
    const { damage, multiplier, missed } = calculateDamage(playerFighter, opponentFighter, move);

    // Append logs
    setBattleLogs((prev) => [...prev, `⚡ ${playerFighter.name.toUpperCase()} used ${move.name.toUpperCase()}!`]);

    setTimeout(() => {
      if (missed) {
        setBattleLogs((prev) => [...prev, `💨 The attack missed!`]);
        animateDamageFloat("opponent", "MISSED");
        playSynthSound("not-very-effective");
        proceedToOpponentTurn();
      } else {
        // Adjust HP
        const nextOppHP = Math.max(0, opponentHP - damage);
        setOpponentHP(nextOppHP);

        // Soundboard & animations
        animateDamageShake("opponent");
        animateDamageFloat("opponent", `-${damage}`);

        if (multiplier > 1) {
          setBattleLogs((prev) => [...prev, `💥 It's super effective! Dealt ${damage} damage.`]);
          playSynthSound("super-effective");
        } else if (multiplier === 0) {
          setBattleLogs((prev) => [...prev, `🛡️ It doesn't affect ${opponentFighter.name.toUpperCase()}... Dealt 0 damage.`]);
          playSynthSound("not-very-effective");
        } else if (multiplier < 1) {
          setBattleLogs((prev) => [...prev, `⚠️ It's not very effective... Dealt ${damage} damage.`]);
          playSynthSound("not-very-effective");
        } else {
          setBattleLogs((prev) => [...prev, `🤜 Dealt ${damage} damage.`]);
          playSynthSound("hit");
        }

        // Check victory
        if (nextOppHP <= 0) {
          setTimeout(() => {
            setBattleLogs((prev) => [...prev, `🏆 Wild ${opponentFighter.name.toUpperCase()} fainted! You emerged victorious!`]);
            setGameState("victory");
            playSynthSound("victory");
          }, 600);
        } else {
          proceedToOpponentTurn();
        }
      }
    }, 600);
  };

  // Hand off turn control
  const proceedToOpponentTurn = () => {
    setCombatTurn("opponent");
  };

  // Opponent AI chooses move and executes
  const executeOpponentTurn = () => {
    if (!playerFighter || !opponentFighter || gameState !== "combat" || opponentHP <= 0 || playerHP <= 0) return;

    // Check if eligible for Mega Evolution (45% chance if not evolved yet)
    const mapping = MEGA_MAPPINGS[opponentFighter.id];
    if (mapping && !hasOpponentMegaEvolved && Math.random() < 0.45) {
      setCombatTurn("animating");
      setIsMegaAnimating(true);
      playSynthSound("super-effective");

      setBattleLogs((prev) => [
        ...prev,
        `✨ Wild ${opponentFighter.name.toUpperCase()} reacts to the surrounding energy!`,
        `✨ Wild ${opponentFighter.name.toUpperCase()} Mega Evolved into ${mapping.name.toUpperCase()}!`
      ]);

      setTimeout(() => {
        setOpponentFighter((prev) => {
          if (!prev) return null;
          const boostedStats = prev.stats.map(s => {
            if (s.name.toLowerCase() === "hp") return s;
            return { name: s.name, value: Math.round(s.value * 1.35) };
          });

          // Heal and boost max HP
          const nextMax = opponentMaxHP + 50;
          setOpponentMaxHP(nextMax);
          setOpponentHP((h) => Math.min(nextMax, h + 50));

          return {
            ...prev,
            name: mapping.name,
            types: mapping.types,
            image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${mapping.megaId}.png`,
            stats: boostedStats
          };
        });

        setHasOpponentMegaEvolved(true);
        setIsMegaAnimating(false);
        setCombatTurn("player"); // Give turn back to player
      }, 1200);
      return;
    }

    setCombatTurn("animating");

    // Select random move from opponent move list, default to tackle if empty
    const rawOppMoves = opponentFighter.moves && opponentFighter.moves.length > 0
      ? opponentFighter.moves.slice(0, 4)
      : [{ name: "tackle" }];
    const randomMoveIdx = Math.floor(Math.random() * rawOppMoves.length);
    const chosenRawMove = rawOppMoves[randomMoveIdx].name;

    const move = getMoveDetails(chosenRawMove, opponentFighter.types);
    const { damage, multiplier, missed } = calculateDamage(opponentFighter, playerFighter, move);

    setBattleLogs((prev) => [...prev, `🔴 Wild ${opponentFighter.name.toUpperCase()} used ${move.name.toUpperCase()}!`]);

    setTimeout(() => {
      if (missed) {
        setBattleLogs((prev) => [...prev, `💨 The wild opponent missed!`]);
        animateDamageFloat("player", "MISSED");
        playSynthSound("not-very-effective");
        setCombatTurn("player");
      } else {
        const nextPlayerHP = Math.max(0, playerHP - damage);
        setPlayerHP(nextPlayerHP);

        // Shake player card and play sound
        animateDamageShake("player");
        animateDamageFloat("player", `-${damage}`);

        if (multiplier > 1) {
          setBattleLogs((prev) => [...prev, `💥 It's super effective! Dealt ${damage} damage to you.`]);
          playSynthSound("super-effective");
        } else if (multiplier === 0) {
          setBattleLogs((prev) => [...prev, `🛡️ It doesn't affect ${playerFighter.name.toUpperCase()}... Dealt 0 damage.`]);
          playSynthSound("not-very-effective");
        } else if (multiplier < 1) {
          setBattleLogs((prev) => [...prev, `⚠️ It's not very effective... Dealt ${damage} damage to you.`]);
          playSynthSound("not-very-effective");
        } else {
          setBattleLogs((prev) => [...prev, `🤜 Dealt ${damage} damage to your fighter.`]);
          playSynthSound("hit");
        }

        // Check defeat
        if (nextPlayerHP <= 0) {
          setTimeout(() => {
            setBattleLogs((prev) => [...prev, `💀 ${playerFighter.name.toUpperCase()} fainted! You were defeated.`]);
            setGameState("defeat");
            playSynthSound("defeat");
          }, 600);
        } else {
          setCombatTurn("player");
        }
      }
    }, 600);
  };

  const handlePlayerMegaEvolve = () => {
    if (!playerFighter || hasPlayerMegaEvolved || combatTurn !== "player" || gameState !== "combat") return;

    const mapping = MEGA_MAPPINGS[playerFighter.id];
    if (!mapping) return;

    setIsMegaAnimating(true);
    playSynthSound("super-effective");

    setBattleLogs((prev) => [
      ...prev,
      `✨ Challenger's key stone glowed! A response from the Mega Stone!`,
      `✨ ${playerFighter.name.toUpperCase()} Mega Evolved into ${mapping.name.toUpperCase()}!`
    ]);

    setTimeout(() => {
      setPlayerFighter((prev) => {
        if (!prev) return null;
        const boostedStats = prev.stats.map(s => {
          if (s.name.toLowerCase() === "hp") return s;
          return { name: s.name, value: Math.round(s.value * 1.35) };
        });

        const nextMax = playerMaxHP + 50;
        setPlayerMaxHP(nextMax);
        setPlayerHP((h) => Math.min(nextMax, h + 50));

        return {
          ...prev,
          name: mapping.name,
          types: mapping.types,
          image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${mapping.megaId}.png`,
          stats: boostedStats
        };
      });

      setHasPlayerMegaEvolved(true);
      setIsMegaAnimating(false);
    }, 1200);
  };

  // Reset or run again
  const handleRestartBattle = () => {
    setGameState("setup");
    setBattleLogs([]);
    setHasPlayerMegaEvolved(false);
    setHasOpponentMegaEvolved(false);
    setIsMegaAnimating(false);
    playSynthSound("select");
  };

  // Search filter list
  const filteredOppList = opponentSearch.trim()
    ? allPokemonList.filter(p => p.name.toLowerCase().includes(opponentSearch.toLowerCase().trim()) || String(p.id) === opponentSearch.trim()).slice(0, 5)
    : [];

  const filteredPlayerList = playerSearch.trim()
    ? allPokemonList.filter(p => p.name.toLowerCase().includes(playerSearch.toLowerCase().trim()) || String(p.id) === playerSearch.trim()).slice(0, 5)
    : [];

  // Color helper for HP bars
  const getHPBarColor = (current: number, max: number) => {
    const ratio = current / max;
    if (ratio > 0.5) return "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]";
    if (ratio > 0.2) return "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]";
    return "bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.5)] animate-pulse";
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-h-[85vh] overflow-y-auto">
      <div className="flex justify-between items-center border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold font-mono text-white tracking-widest flex items-center gap-2">
            <Sword className="h-5 w-5 text-amber-500 animate-pulse" />
            MINI BATTLE ARENA
          </h2>
          <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase tracking-widest">
            Stats-Driven Combat & Type Multipliers
          </p>
        </div>
        <button 
          onClick={handleRestartBattle}
          className="flex items-center gap-1 text-[10px] font-mono text-neutral-400 hover:text-white uppercase tracking-wider bg-white/5 px-2.5 py-1 rounded-md border border-white/5 transition-all"
        >
          <RotateCcw className="h-3 w-3" />
          Reset Arena
        </button>
      </div>

      {gameState === "setup" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-4">
          
          {/* Challenger Selection Card */}
          <div className="rounded-2xl border border-white/10 bg-neutral-950/40 p-5 flex flex-col gap-4 relative">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest block">
              🛡️ Selected Challenger
            </span>

            {isLoadingPlayerDetails ? (
              <div className="h-44 flex items-center justify-center font-mono text-xs text-neutral-400">
                <span className="animate-spin h-4 w-4 border-2 border-cyan-400 border-t-transparent rounded-full mr-2" />
                Analyzing stats...
              </div>
            ) : playerFighter ? (
              <div className="flex gap-4 items-center h-44">
                <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center p-2">
                  <img src={playerFighter.image} alt={playerFighter.name} className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(255,255,255,0.15)]" />
                </div>
                <div className="flex-grow font-mono text-xs space-y-1">
                  <span className="text-neutral-500 font-bold block">#{String(playerFighter.id).padStart(3, "0")}</span>
                  <h3 className="text-base font-black text-white capitalize tracking-wider">{playerFighter.name}</h3>
                  <div className="flex gap-1.5 mt-1.5">
                    {playerFighter.types.map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-neutral-900 border border-white/10 capitalize text-neutral-300">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-2 text-[10px] text-neutral-400">
                    <div>HP: <span className="text-white font-bold">{getStatValue(playerFighter, "hp")}</span></div>
                    <div>SPD: <span className="text-white font-bold">{getStatValue(playerFighter, "speed")}</span></div>
                    <div>ATK: <span className="text-white font-bold">{getStatValue(playerFighter, "attack")}</span></div>
                    <div>DEF: <span className="text-white font-bold">{getStatValue(playerFighter, "defense")}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-neutral-500 font-mono text-xs">
                No challenger loaded
              </div>
            )}

            {/* Select Challenger source */}
            <div className="space-y-2 mt-2">
              <span className="text-[9px] font-mono text-neutral-500 block uppercase">Choose from active team or search roster:</span>
              
              {/* Active team quick links */}
              {team && team.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {team.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        playSynthSound("select");
                        setPlayerFighter(m);
                      }}
                      className={`px-2.5 py-1 rounded-lg border text-[10px] font-mono capitalize transition-all ${
                        playerFighter?.id === m.id
                          ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                          : "bg-white/5 border-white/5 text-neutral-400 hover:text-white"
                      }`}
                    >
                      {m.name}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-[10px] font-mono text-neutral-500 italic bg-white/5 p-2 rounded-lg border border-white/5">
                  Squad Builder is empty. Add Pokémon to your team from the details sheet to quick-select them here!
                </div>
              )}

              {/* Roster search for Player */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search and replace challenger..."
                  value={playerSearch}
                  onChange={(e) => setPlayerSearch(e.target.value)}
                  className="pl-8 h-8 w-full bg-neutral-900 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500/40"
                />
                
                {filteredPlayerList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-950 border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden font-mono text-xs">
                    {filteredPlayerList.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPlayer(p)}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 text-neutral-300 capitalize border-b border-white/5 last:border-0 flex items-center justify-between"
                      >
                        <span>{p.name}</span>
                        <ChevronRight className="h-3 w-3 text-neutral-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Opponent Selection Card */}
          <div className="rounded-2xl border border-white/10 bg-neutral-950/40 p-5 flex flex-col gap-4 relative">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-mono text-rose-400 uppercase tracking-widest block">
                🔥 Wild Opponent
              </span>
              <button
                onClick={handleRandomizeOpponent}
                className="text-[9px] font-mono bg-rose-500/10 border border-rose-500/30 text-rose-400 px-2 py-0.5 rounded hover:bg-rose-500/20 transition-all uppercase"
              >
                Randomize
              </button>
            </div>

            {isLoadingOppDetails ? (
              <div className="h-44 flex items-center justify-center font-mono text-xs text-neutral-400">
                <span className="animate-spin h-4 w-4 border-2 border-rose-400 border-t-transparent rounded-full mr-2" />
                Analyzing stats...
              </div>
            ) : opponentFighter ? (
              <div className="flex gap-4 items-center h-44">
                <div className="w-24 h-24 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center p-2">
                  <img src={opponentFighter.image} alt={opponentFighter.name} className="w-full h-full object-contain filter drop-shadow-[0_4px_6px_rgba(255,255,255,0.15)]" />
                </div>
                <div className="flex-grow font-mono text-xs space-y-1">
                  <span className="text-neutral-500 font-bold block">#{String(opponentFighter.id).padStart(3, "0")}</span>
                  <h3 className="text-base font-black text-white capitalize tracking-wider">{opponentFighter.name}</h3>
                  <div className="flex gap-1.5 mt-1.5">
                    {opponentFighter.types.map(t => (
                      <span key={t} className="px-1.5 py-0.5 rounded text-[8px] uppercase font-bold bg-neutral-900 border border-white/10 capitalize text-neutral-300">
                        {t}
                      </span>
                    ))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 pt-2 text-[10px] text-neutral-400">
                    <div>HP: <span className="text-white font-bold">{getStatValue(opponentFighter, "hp")}</span></div>
                    <div>SPD: <span className="text-white font-bold">{getStatValue(opponentFighter, "speed")}</span></div>
                    <div>ATK: <span className="text-white font-bold">{getStatValue(opponentFighter, "attack")}</span></div>
                    <div>DEF: <span className="text-white font-bold">{getStatValue(opponentFighter, "defense")}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center border border-dashed border-white/5 rounded-xl text-neutral-500 font-mono text-xs">
                No opponent loaded
              </div>
            )}

            {/* Roster Search for Opponent */}
            <div className="space-y-2 mt-2">
              <span className="text-[9px] font-mono text-neutral-500 block uppercase">Search roster to choose opponent:</span>
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Type name or number (e.g. mewtwo, 150)..."
                  value={opponentSearch}
                  onChange={(e) => setOpponentSearch(e.target.value)}
                  className="pl-8 h-8 w-full bg-neutral-900 border border-white/10 rounded-lg text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-rose-500/40"
                />

                {filteredOppList.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-neutral-950 border border-white/10 rounded-lg shadow-2xl z-20 overflow-hidden font-mono text-xs">
                    {filteredOppList.map(p => (
                      <button
                        key={p.id}
                        onClick={() => handleSelectOpponent(p)}
                        className="w-full text-left px-3 py-2 hover:bg-white/5 text-neutral-300 capitalize border-b border-white/5 last:border-0 flex items-center justify-between"
                      >
                        <span>{p.name}</span>
                        <ChevronRight className="h-3 w-3 text-neutral-500" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Commencement Button */}
          <div className="col-span-1 md:col-span-2 flex justify-center mt-4">
            <button
              onClick={handleCommenceBattle}
              disabled={!playerFighter || !opponentFighter}
              className="px-10 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-600 via-amber-600 to-rose-600 border border-white/10 text-white font-mono font-bold tracking-widest text-xs uppercase shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:scale-100 flex items-center gap-2 group"
            >
              <Sword className="h-4 w-4 group-hover:rotate-12 transition-transform" />
              Commence Battle Sequence
            </button>
          </div>
        </div>
      )}

      {gameState !== "setup" && playerFighter && opponentFighter && (
        <div className="flex flex-col gap-6 py-2 relative overflow-hidden rounded-2xl border border-white/5 bg-neutral-950/20 p-4">
          {/* SideRays Combat Energy Background */}
          <div className="absolute inset-0 z-0 opacity-15 pointer-events-none">
            <SideRays
              speed={2.2}
              rayColor1="#EAB308"
              rayColor2="#3b82f6"
              intensity={2.0}
              spread={1.6}
              origin="bottom-right"
              tilt={30}
              saturation={1.4}
              blend={0.5}
              falloff={1.6}
            />
          </div>

          {/* Active fighters dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center z-10 relative">
            
            {/* Player active card */}
            <div 
              ref={playerCardRef}
              className="rounded-2xl border border-cyan-500/30 bg-cyan-950/5 p-5 relative overflow-hidden backdrop-blur-sm"
            >
              {/* Damage Float Indicator */}
              {playerFloatDamage !== null && (
                <div 
                  ref={playerDamageFloatRef}
                  className="absolute top-12 left-1/2 -translate-x-1/2 font-mono font-black text-rose-500 text-2xl filter drop-shadow-[0_0_4px_#ef4444] z-30 opacity-0 pointer-events-none"
                >
                  {playerFloatDamage}
                </div>
              )}

              {/* Red Hit-flash overlay */}
              {combatTurn === "opponent" && gameState === "combat" && (
                <div className="absolute inset-0 bg-rose-600/10 pointer-events-none animate-pulse" />
              )}

              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center p-1.5 relative">
                  <img src={playerFighter.image} alt={playerFighter.name} className="w-full h-full object-contain" />
                  {combatTurn === "player" && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border border-neutral-950 text-[7px] font-bold text-neutral-950 items-center justify-center">ATK</span>
                    </span>
                  )}
                </div>
                
                <div className="flex-grow font-mono text-xs space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-black text-white capitalize tracking-wider flex items-center gap-1.5">
                      {playerFighter.name}
                      <span className="text-[9px] font-normal text-cyan-400 bg-cyan-950 border border-cyan-800/40 px-1 py-0.2 rounded">Challenger</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400">Lv. 50</span>
                  </div>

                  <div className="flex gap-1.5">
                    {playerFighter.types.map(t => (
                      <span key={t} className="px-1 text-[8px] uppercase font-bold bg-neutral-900 border border-white/5 text-neutral-400">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* HP bar */}
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500 font-bold">HP</span>
                      <span className="text-neutral-300 font-bold">{playerHP} / {playerMaxHP}</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${getHPBarColor(playerHP, playerMaxHP)}`}
                        style={{ width: `${(playerHP / playerMaxHP) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Opponent active card */}
            <div 
              ref={opponentCardRef}
              className="rounded-2xl border border-rose-500/30 bg-rose-950/5 p-5 relative overflow-hidden backdrop-blur-sm"
            >
              {/* Damage Float Indicator */}
              {opponentFloatDamage !== null && (
                <div 
                  ref={opponentDamageFloatRef}
                  className="absolute top-12 left-1/2 -translate-x-1/2 font-mono font-black text-rose-500 text-2xl filter drop-shadow-[0_0_4px_#ef4444] z-30 opacity-0 pointer-events-none"
                >
                  {opponentFloatDamage}
                </div>
              )}

              {/* Red Hit-flash overlay */}
              {combatTurn === "player" && gameState === "combat" && (
                <div className="absolute inset-0 bg-rose-600/10 pointer-events-none animate-pulse" />
              )}

              <div className="flex gap-4 items-center">
                <div className="w-20 h-20 rounded-full bg-neutral-900 border border-white/5 flex items-center justify-center p-1.5 relative">
                  <img src={opponentFighter.image} alt={opponentFighter.name} className="w-full h-full object-contain" />
                  {combatTurn === "opponent" && (
                    <span className="absolute -top-1 -right-1 flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-rose-500 border border-neutral-950 text-[7px] font-bold text-neutral-950 items-center justify-center">ATK</span>
                    </span>
                  )}
                </div>

                <div className="flex-grow font-mono text-xs space-y-1">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-sm font-black text-white capitalize tracking-wider flex items-center gap-1.5">
                      {opponentFighter.name}
                      <span className="text-[9px] font-normal text-rose-400 bg-rose-950 border border-rose-800/40 px-1 py-0.2 rounded">Wild</span>
                    </h3>
                    <span className="text-[10px] text-neutral-400">Lv. 50</span>
                  </div>

                  <div className="flex gap-1.5">
                    {opponentFighter.types.map(t => (
                      <span key={t} className="px-1 text-[8px] uppercase font-bold bg-neutral-900 border border-white/5 text-neutral-400">
                        {t}
                      </span>
                    ))}
                  </div>

                  {/* HP bar */}
                  <div className="pt-2 space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-neutral-500 font-bold">HP</span>
                      <span className="text-neutral-300 font-bold">{opponentHP} / {opponentMaxHP}</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-900 rounded-full overflow-hidden border border-white/5">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${getHPBarColor(opponentHP, opponentMaxHP)}`}
                        style={{ width: `${(opponentHP / opponentMaxHP) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Center battle controls */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mt-2 relative z-10">
            
            {/* Player active moves selection grid (occupies 3/5 cols) */}
            <div className="col-span-1 md:col-span-3 rounded-2xl border border-white/5 bg-neutral-950/20 p-5 flex flex-col justify-between min-h-[220px]">
              <div>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mb-4">
                  🕹️ Active Moves list
                </span>

                {gameState === "combat" && (
                  <>
                    {combatTurn === "player" ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          {playerFighter.moves && playerFighter.moves.length > 0 ? (
                            playerFighter.moves.slice(0, 4).map(m => {
                              const details = getMoveDetails(m.name, playerFighter.types);
                              return (
                                <button
                                  key={m.name}
                                  onClick={() => handlePlayerAttack(m.name)}
                                  className="group relative flex flex-col items-start p-3 rounded-xl border border-white/10 bg-white/2 hover:bg-cyan-500/10 hover:border-cyan-500/35 transition-all text-left font-mono"
                                >
                                  <span className="text-xs font-bold text-white capitalize group-hover:text-cyan-400 transition-colors">
                                    {details.name}
                                  </span>
                                  <div className="flex justify-between items-center w-full mt-2 text-[9px] text-neutral-400 uppercase font-semibold">
                                    <span className="capitalize">{details.type}</span>
                                    <span>PWR: {details.power}</span>
                                  </div>
                                </button>
                              );
                            })
                          ) : (
                            // Fallbacks if moves aren't returned
                            ["tackle", "growl", "scratch", "slap"].map(m => {
                              const details = getMoveDetails(m, playerFighter.types);
                              return (
                                <button
                                  key={m}
                                  onClick={() => handlePlayerAttack(m)}
                                  className="group relative flex flex-col items-start p-3 rounded-xl border border-white/10 bg-white/2 hover:bg-cyan-500/10 hover:border-cyan-500/35 transition-all text-left font-mono"
                                >
                                  <span className="text-xs font-bold text-white capitalize group-hover:text-cyan-400 transition-colors">
                                    {details.name}
                                  </span>
                                  <div className="flex justify-between items-center w-full mt-2 text-[9px] text-neutral-400 uppercase font-semibold">
                                    <span className="capitalize">{details.type}</span>
                                    <span>PWR: {details.power}</span>
                                  </div>
                                </button>
                              );
                            })
                          )}
                        </div>

                        {/* Mega Evolve Action Button */}
                        {MEGA_MAPPINGS[playerFighter.id] && !hasPlayerMegaEvolved && (
                          <button
                            onClick={handlePlayerMegaEvolve}
                            className="w-full mt-3 py-2 rounded-xl border border-amber-400/30 bg-gradient-to-r from-amber-500/10 via-yellow-500/15 to-amber-500/10 hover:from-amber-500/20 hover:via-yellow-500/30 hover:border-amber-400/50 hover:scale-[1.01] transition-all font-mono text-[10px] font-bold text-amber-300 uppercase tracking-widest flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.15)]"
                          >
                            <Sparkles className="h-3 w-3 text-amber-400 animate-spin" />
                            <span>Trigger Mega Evolution</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <div className="h-28 flex flex-col items-center justify-center text-center gap-1.5 font-mono text-xs text-neutral-500 border border-dashed border-white/5 rounded-xl bg-neutral-950/30">
                        {combatTurn === "opponent" ? (
                          <>
                            <span className="animate-pulse">Opponent is choosing its move...</span>
                            <span className="text-[9px] text-neutral-600">GET READY TO ABSORB DAMAGE</span>
                          </>
                        ) : (
                          <>
                            <span className="animate-spin h-4 w-4 border-2 border-amber-400 border-t-transparent rounded-full mb-1" />
                            <span>Computing strike impacts...</span>
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}

                {gameState === "victory" && (
                  <div className="h-32 flex flex-col items-center justify-center text-center gap-2 font-mono border border-emerald-500/20 rounded-xl bg-emerald-950/5 relative overflow-hidden">
                    <Sparkles className="h-6 w-6 text-amber-400 animate-bounce" />
                    <span className="text-sm font-bold text-emerald-400 uppercase tracking-widest">VICTORY SECURED</span>
                    <p className="text-[10px] text-neutral-400 max-w-[220px]">Your fighter successfully outmatched the wild opponent!</p>
                  </div>
                )}

                {gameState === "defeat" && (
                  <div className="h-32 flex flex-col items-center justify-center text-center gap-2 font-mono border border-rose-500/20 rounded-xl bg-rose-950/5 relative overflow-hidden">
                    <Shield className="h-6 w-6 text-rose-500 animate-pulse" />
                    <span className="text-sm font-bold text-rose-500 uppercase tracking-widest">CHALLENGER DEFEATED</span>
                    <p className="text-[10px] text-neutral-400 max-w-[220px]">Your fighter fainted in battle. Better luck next time!</p>
                  </div>
                )}
              </div>

              {(gameState === "victory" || gameState === "defeat") && (
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleCommenceBattle}
                    className="flex-grow py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono font-bold text-white uppercase tracking-wider transition-all"
                  >
                    Rematch
                  </button>
                  <button
                    onClick={handleRestartBattle}
                    className="flex-grow py-2 rounded-xl bg-neutral-900 border border-white/10 text-xs font-mono font-bold text-neutral-400 hover:text-white uppercase tracking-wider transition-all"
                  >
                    Select Fighters
                  </button>
                </div>
              )}
            </div>

            {/* Vintage digital terminal logs (occupies 2/5 cols) */}
            <div className="col-span-1 md:col-span-2 rounded-2xl border border-white/5 bg-neutral-950 p-4 flex flex-col h-[220px]">
              <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-widest block border-b border-white/5 pb-2 mb-2 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                DEX_TERMINAL_LOG v1.0
              </span>

              <div className="flex-grow overflow-y-auto font-mono text-[9px] text-neutral-400 space-y-1.5 pr-1 select-text">
                {battleLogs.map((log, index) => (
                  <div key={index} className="leading-relaxed border-l border-white/5 pl-1.5">
                    {log}
                  </div>
                ))}
                <div ref={terminalBottomRef} />
              </div>
            </div>

          </div>

        </div>
      )}
      {/* Mega Evolution Animation Flash Overlay */}
      {isMegaAnimating && (
        <div className="absolute inset-0 bg-neutral-950/95 z-[9999] flex flex-col items-center justify-center p-6 border border-white/10 rounded-2xl">
          <div className="text-center font-mono flex flex-col items-center gap-4">
            <Sparkles className="h-16 w-16 text-amber-400 animate-spin" />
            <h3 className="text-lg font-black text-amber-300 tracking-widest uppercase animate-pulse">
              🧬 DNA RE-ALIGNMENT IN PROGRESS...
            </h3>
            <p className="text-[10px] text-neutral-400 max-w-[280px]">
              Channeling Mega Stone energy to trigger temporary form ascension.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}

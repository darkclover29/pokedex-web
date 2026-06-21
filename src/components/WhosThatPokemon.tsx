import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { Volume2, Trophy, ArrowRight, RotateCcw, ShieldAlert, Sparkles } from "lucide-react";
import { fetchPokemonDetails } from "@/services/pokeapi";
import type { PokemonFullDetails, PokemonBase } from "@/services/pokeapi";

interface WhosThatPokemonProps {
  allPokemonList: PokemonBase[];
}

export function WhosThatPokemon({ allPokemonList }: WhosThatPokemonProps) {
  const [loading, setLoading] = useState(true);
  const [correctPokemon, setCorrectPokemon] = useState<PokemonFullDetails | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [guessedCorrectly, setGuessedCorrectly] = useState<boolean | null>(null);
  const [wrongGuesses, setWrongGuesses] = useState<string[]>([]);
  const [streak, setStreak] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem("whos_that_pokemon_highscore");
    return saved ? parseInt(saved, 10) : 0;
  });

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize a new round
  const startNewRound = async () => {
    if (allPokemonList.length === 0) return;
    setLoading(true);
    setGuessedCorrectly(null);
    setWrongGuesses([]);

    // 1. Pick a random pokemon from the loaded list
    const randomIndex = Math.floor(Math.random() * Math.min(allPokemonList.length, 151));
    const selectedBase = allPokemonList[randomIndex];
    
    // 2. Fetch full details to get cry audio and artwork
    const details = await fetchPokemonDetails(selectedBase.id);
    if (!details) {
      setLoading(false);
      return;
    }

    setCorrectPokemon(details);

    // 3. Generate 3 wrong options
    const wrongOptions: string[] = [];
    while (wrongOptions.length < 3) {
      const wrongIndex = Math.floor(Math.random() * allPokemonList.length);
      const wrongPokeName = allPokemonList[wrongIndex].name;
      
      if (wrongPokeName !== details.name && !wrongOptions.includes(wrongPokeName)) {
        wrongOptions.push(wrongPokeName);
      }
    }

    // 4. Combine and shuffle options
    const allOptions = [details.name, ...wrongOptions];
    // Fisher-Yates shuffle
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    setOptions(allOptions);
    setLoading(false);

    // Play cry hint on mount after small delay
    if (details.cryUrl) {
      setTimeout(() => {
        playCry(details.cryUrl!);
      }, 800);
    }
  };

  useEffect(() => {
    startNewRound();
    return () => {
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const playCry = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(url);
    audio.volume = 0.4;
    audioRef.current = audio;
    audio.play().catch((err) => console.log("Audio play blocked:", err));
  };

  const handleOptionClick = (option: string) => {
    if (guessedCorrectly !== null) return; // Round already over

    if (option === correctPokemon?.name) {
      // Correct guess!
      setGuessedCorrectly(true);
      const newStreak = streak + 1;
      setStreak(newStreak);

      // Save highscore
      if (newStreak > highScore) {
        setHighScore(newStreak);
        localStorage.setItem("whos_that_pokemon_highscore", String(newStreak));
      }

      // Play cry again as victory vocal
      if (correctPokemon.cryUrl) {
        playCry(correctPokemon.cryUrl);
      }

      // GSAP Victory flash animation
      if (imageRef.current) {
        gsap.fromTo(
          imageRef.current,
          { filter: "brightness(0) contrast(1)", scale: 0.9 },
          {
            filter: "brightness(1) contrast(1)",
            scale: 1.1,
            duration: 0.6,
            ease: "back.out(2)",
          }
        );
      }
    } else {
      // Wrong guess
      setWrongGuesses((prev) => [...prev, option]);
      setStreak(0); // Reset streak
      setGuessedCorrectly(false);

      // Shake container animation
      if (containerRef.current) {
        gsap.fromTo(
          containerRef.current,
          { x: -6 },
          { x: 0, duration: 0.08, repeat: 5, yoyo: true, ease: "power2.out" }
        );
      }
    }
  };

  const handleResetStreak = () => {
    setStreak(0);
    startNewRound();
  };

  return (
    <div className="w-full text-white select-none flex flex-col items-center py-4" ref={containerRef}>
      
      {/* Header Stat Panel */}
      <div className="w-full flex items-center justify-between border-b border-white/5 pb-4 mb-6">
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-400" />
          <h3 className="text-lg font-bold tracking-tight">Who's That Pokémon?</h3>
        </div>
        <div className="flex gap-4 font-mono text-xs">
          <div>
            <span className="text-neutral-500 uppercase">Streak:</span>{" "}
            <span className="font-bold text-emerald-400">{streak}</span>
          </div>
          <div className="border-r border-white/10" />
          <div>
            <span className="text-neutral-500 uppercase">Best:</span>{" "}
            <span className="font-bold text-yellow-400">{highScore}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <span className="animate-spin h-8 w-8 border-2 border-emerald-400 border-t-transparent rounded-full" />
          <span className="font-mono text-xs text-neutral-400">Loading challenger...</span>
        </div>
      ) : (
        correctPokemon && (
          <div className="flex flex-col items-center w-full max-w-sm">
            
            {/* The Silhouette Image Panel */}
            <div className="relative w-48 h-48 bg-white/5 border border-white/5 rounded-3xl flex items-center justify-center mb-6 overflow-hidden">
              <div
                className="absolute inset-0 blur-3xl opacity-20"
                style={{
                  backgroundColor: guessedCorrectly
                    ? "#10b981"
                    : guessedCorrectly === false
                    ? "#ef4444"
                    : "rgba(255, 255, 255, 0.1)",
                }}
              />
              
              <img
                ref={imageRef}
                src={correctPokemon.image}
                alt="Silhouette Challenger"
                className="w-36 h-36 object-contain z-10 transition-all duration-300"
                style={{
                  filter: guessedCorrectly
                    ? "brightness(1) contrast(1)"
                    : "brightness(0) contrast(1)",
                }}
              />

              {/* Cry Sound Hint Button */}
              {correctPokemon.cryUrl && (
                <button
                  onClick={() => playCry(correctPokemon.cryUrl!)}
                  className="absolute bottom-2 right-2 p-2 rounded-xl bg-neutral-900/80 border border-white/10 hover:border-white/20 hover:bg-neutral-800 transition-all z-20"
                  title="Play Cry Hint"
                >
                  <Volume2 className="h-4 w-4 text-neutral-400" />
                </button>
              )}
            </div>

            {/* Win/Lose Prompt */}
            {guessedCorrectly ? (
              <div className="text-center mb-6 animate-[scaleIn_0.3s_ease-out]">
                <span className="text-emerald-400 font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1">
                  <Sparkles className="h-3.5 w-3.5" /> Correct!
                </span>
                <h4 className="text-2xl font-black capitalize mt-0.5">{correctPokemon.name}</h4>
              </div>
            ) : guessedCorrectly === false ? (
              <div className="text-center mb-6 text-rose-400">
                <span className="font-mono text-xs uppercase tracking-widest font-bold flex items-center justify-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5" /> Streak Reset!
                </span>
                <p className="text-xs text-neutral-400 mt-1">Select another option to try again.</p>
              </div>
            ) : (
              <div className="text-center mb-6 text-neutral-400 text-xs font-mono uppercase tracking-widest">
                Identify the silhouette
              </div>
            )}

            {/* Options Buttons Grid */}
            <div className="grid grid-cols-2 gap-3 w-full mb-6">
              {options.map((option) => {
                const isCorrectOption = option === correctPokemon.name;
                const isWrongGuessed = wrongGuesses.includes(option);
                
                let btnStyle = "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10 text-white";
                
                if (guessedCorrectly && isCorrectOption) {
                  btnStyle = "bg-emerald-500/20 border-emerald-500 text-emerald-400 font-bold";
                } else if (isWrongGuessed) {
                  btnStyle = "bg-rose-500/10 border-rose-500/30 text-rose-500 line-through opacity-50 cursor-default";
                }

                return (
                  <button
                    key={option}
                    disabled={isWrongGuessed || (guessedCorrectly !== null && !isCorrectOption)}
                    onClick={() => handleOptionClick(option)}
                    className={`px-4 py-2.5 rounded-xl border text-sm capitalize transition-all duration-150 truncate ${btnStyle}`}
                  >
                    {option}
                  </button>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="w-full flex items-center justify-center gap-3">
              {guessedCorrectly ? (
                <button
                  onClick={startNewRound}
                  className="w-full py-2.5 rounded-xl bg-white text-black font-semibold hover:bg-neutral-200 transition-colors flex items-center justify-center gap-1 font-mono text-sm"
                >
                  Next Pokémon <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleResetStreak}
                  className="py-2.5 px-4 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white transition-colors flex items-center justify-center gap-1.5 font-mono text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Skip / Reset
                </button>
              )}
            </div>

          </div>
        )
      )}
    </div>
  );
}

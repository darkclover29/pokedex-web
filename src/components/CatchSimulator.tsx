import { useState, useRef, useEffect, useCallback } from "react";
import gsap from "gsap";
import { RefreshCw } from "lucide-react";

interface CatchSimulatorProps {
  pokemonName: string;
  captureRate: number; // 3-255
  pokemonImage: string;
  isActive?: boolean;
}

interface BallOption {
  name: string;
  modifier: number;
  color: string;
  borderColor: string;
  bgClass: string;
}

const BALLS: BallOption[] = [
  { name: "Poké Ball", modifier: 1.0, color: "#ef4444", borderColor: "border-red-500", bgClass: "bg-red-500" },
  { name: "Great Ball", modifier: 1.5, color: "#3b82f6", borderColor: "border-blue-500", bgClass: "bg-blue-500" },
  { name: "Ultra Ball", modifier: 2.0, color: "#eab308", borderColor: "border-yellow-500", bgClass: "bg-yellow-500" },
  { name: "Master Ball", modifier: 255.0, color: "#a855f7", borderColor: "border-purple-500", bgClass: "bg-purple-500" },
];

interface StatusOption {
  name: string;
  modifier: number;
  label: string;
  colorClass: string;
}

const STATUSES: StatusOption[] = [
  { name: "none", modifier: 1.0, label: "Healthy", colorClass: "text-neutral-400 bg-white/5" },
  { name: "paralyzed", modifier: 1.5, label: "Paralyzed / Poisoned", colorClass: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  { name: "sleep", modifier: 2.5, label: "Sleep / Freeze", colorClass: "text-sky-400 bg-sky-500/10 border-sky-500/20" },
];

export function CatchSimulator({ pokemonName, captureRate, pokemonImage, isActive = true }: CatchSimulatorProps) {
  const [selectedBallIndex, setSelectedBallIndex] = useState(0);
  const [hpPercentage, setHpPercentage] = useState(100);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);

  // States: 'idle', 'throwing', 'caught', 'breakout'
  const [animationState, setAnimationState] = useState<"idle" | "throwing" | "caught" | "breakout">("idle");
  const [promptMessage, setPromptMessage] = useState<string>("Swipe up to flick Pokéball!");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number | null>(null);

  const selectedBall = BALLS[selectedBallIndex];
  const selectedStatus = STATUSES[selectedStatusIndex];

  // Game physics entity refs
  const ballPos = useRef({ x: 150, y: 300, z: 1.0 }); // z from 1.0 (near) to 0.0 (far)
  const ballVel = useRef({ x: 0, y: 0, z: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const currentDrag = useRef({ x: 0, y: 0 });
  
  // Game states cached in refs for render loop access
  const targetPos = useRef({ x: 150, y: 75, r: 35 });
  const targetOffset = useRef(0);
  const wiggleAngle = useRef(0);
  const wigglePhase = useRef(0);
  const catchRollOutcome = useRef(false);
  const particleSystem = useRef<{ x: number; y: number; vx: number; vy: number; r: number; color: string; a: number }[]>([]);

  // Calculate official catch rate formula:
  // a = ((3 * MaxHP - 2 * CurrentHP) * CatchRate * BallModifier) / (3 * MaxHP) * StatusModifier
  const calculateCatchChance = useCallback(() => {
    if (selectedBall.name === "Master Ball") return 100;

    const maxHp = 100;
    const currentHp = (hpPercentage / 100) * maxHp;
    const rate = captureRate;
    const ballMod = selectedBall.modifier;
    const statusMod = selectedStatus.modifier;

    const a = (((3 * maxHp - 2 * currentHp) * rate * ballMod) / (3 * maxHp)) * statusMod;
    
    if (a >= 255) return 100;
    
    const chance = (a / 255) * 100;
    return parseFloat(chance.toFixed(1));
  }, [selectedBall, selectedStatus, hpPercentage, captureRate]);

  const catchChance = calculateCatchChance();

  const handleReset = useCallback(() => {
    setAnimationState("idle");
    setPromptMessage("Swipe up to flick Pokéball!");
    
    const canvas = canvasRef.current;
    if (canvas) {
      ballPos.current = { x: canvas.width / 2, y: canvas.height - 40, z: 1.0 };
    }
    ballVel.current = { x: 0, y: 0, z: 0 };
    isDragging.current = false;
    wiggleAngle.current = 0;
    wigglePhase.current = 0;
    particleSystem.current = [];
  }, []);

  // Sync canvas dimensions
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (canvas && container) {
      canvas.width = container.clientWidth;
      canvas.height = 360;
      ballPos.current = { x: canvas.width / 2, y: canvas.height - 45, z: 1.0 };
      targetPos.current = { x: canvas.width / 2, y: 90, r: 35 };
    }
    handleReset();
  }, [pokemonImage, handleReset]);

  // Procedural Sparks Confetti Generator
  const spawnParticles = (x: number, y: number, color: string, count = 25) => {
    const nextParticles = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 5 + 3;
      nextParticles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        r: Math.random() * 2 + 1.5,
        color: color,
        a: 1.0,
      });
    }
    particleSystem.current.push(...nextParticles);
  };

  // Game Loop
  useEffect(() => {
    if (!isActive) {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
        requestRef.current = null;
      }
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let targetFloat = 0;

    // Load Pokémon Image in JS Image Node
    const targetImg = new Image();
    targetImg.crossOrigin = "anonymous";
    targetImg.src = pokemonImage;

    const updatePhysics = () => {
      // 1. floating Pokémon
      targetFloat += 0.05;
      targetOffset.current = Math.sin(targetFloat) * 6;

      // 2. update particles
      particleSystem.current = particleSystem.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.08; // gravity on particles
        p.a -= 0.025; // fade out
        return p.a > 0;
      });

      // 3. update ball trajectory in flight
      if (animationState === "throwing") {
        if (ballPos.current.z > 0.0) {
          ballPos.current.x += ballVel.current.x;
          ballPos.current.y += ballVel.current.y;
          ballVel.current.y += 0.55; // simulated gravity

          // depth scale decay rate
          ballPos.current.z -= ballVel.current.z;

          if (ballPos.current.z <= 0.0) {
            // Collision Detection point at target depth z=0
            ballPos.current.z = 0.0;
            const dist = Math.hypot(
              ballPos.current.x - targetPos.current.x,
              ballPos.current.y - (targetPos.current.y + targetOffset.current)
            );

            // check collision with Pokémon radius
            if (dist < targetPos.current.r + 15) {
              // HIT! Trigger catch rolls
              spawnParticles(ballPos.current.x, ballPos.current.y, selectedBall.color, 15);
              
              const roll = Math.random() * 100;
              catchRollOutcome.current = roll <= catchChance;
              wigglePhase.current = 1;
              wiggleAngle.current = 0;
              setPromptMessage("Wiggling... Hold tight!");

              // drop ball downward onto floor grid
              gsap.to(ballPos.current, {
                y: canvas.height - 50,
                duration: 0.5,
                ease: "bounce.out",
                onComplete: () => {
                  // Roll wiggles
                  let maxWiggles = catchRollOutcome.current ? 3 : Math.floor(Math.random() * 3) + 1;
                  
                  const tl = gsap.timeline({
                    onComplete: () => {
                      if (catchRollOutcome.current) {
                        setAnimationState("caught");
                        setPromptMessage("Gotcha! Pokémon caught!");
                        spawnParticles(ballPos.current.x, ballPos.current.y, "#fbbf24", 40);
                      } else {
                        setAnimationState("breakout");
                        setPromptMessage("Oh no! Pokémon broke free!");
                        spawnParticles(ballPos.current.x, ballPos.current.y, "#ffffff", 15);
                      }
                    }
                  });

                  for (let i = 0; i < maxWiggles; i++) {
                    const delayStr = i === 0 ? "+=0" : "+=0.35";
                    tl.to(wiggleAngle, { value: -20, duration: 0.08, ease: "power1.inOut" }, delayStr)
                      .to(wiggleAngle, { value: 20, duration: 0.14, ease: "power1.inOut", yoyo: true, repeat: 1 })
                      .to(wiggleAngle, { value: 0, duration: 0.08, ease: "power1.inOut" });
                  }
                }
              });
            } else {
              // Missed throw! Ball flies away
              gsap.to(ballPos.current, {
                y: canvas.height + 50,
                x: ballPos.current.x + ballVel.current.x * 10,
                duration: 0.6,
                ease: "power1.in",
                onComplete: () => {
                  setAnimationState("breakout");
                  setPromptMessage("Missed! Throw again.");
                }
              });
            }
          }
        }
      }
    };

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw Grid helper (Tech style arena base)
      ctx.strokeStyle = "rgba(6, 182, 212, 0.07)";
      ctx.lineWidth = 1;
      const gridY = canvas.height - 35;
      ctx.beginPath();
      ctx.moveTo(0, gridY);
      ctx.lineTo(canvas.width, gridY);
      ctx.stroke();

      for (let i = 0; i < canvas.width; i += 30) {
        ctx.beginPath();
        ctx.moveTo(i, gridY);
        ctx.lineTo(i + (i - canvas.width / 2) * 0.45, canvas.height);
        ctx.stroke();
      }

      // Draw floating target ring around Pokémon
      if (animationState !== "caught") {
        ctx.strokeStyle = isDragging.current ? "rgba(251, 191, 36, 0.2)" : "rgba(34, 211, 238, 0.1)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.arc(targetPos.current.x, targetPos.current.y + targetOffset.current, targetPos.current.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw Pokémon image
      if (animationState !== "caught") {
        // fade out slightly if ball is currently flying/intersecting
        if (animationState === "throwing" && wigglePhase.current > 0) {
          ctx.globalAlpha = 0.0;
        } else if (animationState === "throwing") {
          ctx.globalAlpha = 0.45;
        } else {
          ctx.globalAlpha = 1.0;
        }

        try {
          if (targetImg.complete) {
            const size = targetPos.current.r * 2.1;
            ctx.drawImage(
              targetImg,
              targetPos.current.x - size / 2,
              targetPos.current.y + targetOffset.current - size / 2,
              size,
              size
            );
          } else {
            // Draw loading placeholder circle
            ctx.fillStyle = "rgba(255,255,255,0.05)";
            ctx.beginPath();
            ctx.arc(targetPos.current.x, targetPos.current.y + targetOffset.current, 20, 0, Math.PI * 2);
            ctx.fill();
          }
        } catch (e) {}
        ctx.globalAlpha = 1.0;
      }

      // Draw particles
      particleSystem.current.forEach((p) => {
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.a;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      // Draw Swipe Drag Helper path line
      if (isDragging.current && animationState === "idle") {
        ctx.strokeStyle = "rgba(34, 211, 238, 0.45)";
        ctx.lineWidth = 2.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(dragStart.current.x, dragStart.current.y);
        ctx.lineTo(currentDrag.current.x, currentDrag.current.y);
        ctx.stroke();
        ctx.setLineDash([]);

        // draw target glow point
        const dy = dragStart.current.y - currentDrag.current.y;
        const dx = dragStart.current.x - currentDrag.current.x;
        const targetForecastX = targetPos.current.x - dx * 0.75;
        const targetForecastY = targetPos.current.y - dy * 0.75;

        ctx.fillStyle = "rgba(34, 211, 238, 0.25)";
        ctx.beginPath();
        ctx.arc(targetForecastX, Math.max(40, targetForecastY), 8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw Pokéball
      if (animationState !== "idle" || isDragging.current || animationState === "idle") {
        const x = ballPos.current.x;
        const y = ballPos.current.y;
        
        // size scaling: 1.0 (scale 22px) down to 0.0 (scale 12px)
        const scale = 11 + ballPos.current.z * 11;

        ctx.save();
        ctx.translate(x, y);
        
        // apply wiggle rotation angle
        if (wiggleAngle.current !== 0) {
          ctx.rotate((wiggleAngle.current * Math.PI) / 180);
        }

        // draw sphere path
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 8;
        
        // top half (colored dome)
        ctx.fillStyle = selectedBall.color;
        ctx.beginPath();
        ctx.arc(0, 0, scale, Math.PI, 0);
        ctx.fill();

        // bottom half (white base)
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, scale, 0, Math.PI);
        ctx.fill();

        // black center seam
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = scale * 0.08 + 0.6;
        ctx.beginPath();
        ctx.moveTo(-scale, 0);
        ctx.lineTo(scale, 0);
        ctx.stroke();

        // outer black border circle
        ctx.beginPath();
        ctx.arc(0, 0, scale, 0, Math.PI * 2);
        ctx.stroke();

        // center button
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(0, 0, scale * 0.28, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle =
          animationState === "caught"
            ? "#10b981" // pulsing green if caught
            : animationState === "breakout"
            ? "#ef4444"
            : "#ffffff";
        ctx.beginPath();
        ctx.arc(0, 0, scale * 0.14, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      updatePhysics();
      requestRef.current = requestAnimationFrame(draw);
    };

    requestRef.current = requestAnimationFrame(draw);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [pokemonImage, animationState, catchChance, selectedBall, isActive]);

  // Flick Gestures Pointer Handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (animationState !== "idle") return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    // Check if clicked near the ball
    const distToBall = Math.hypot(px - ballPos.current.x, py - ballPos.current.y);
    if (distToBall < 35) {
      isDragging.current = true;
      dragStart.current = { x: px, y: py };
      currentDrag.current = { x: px, y: py };
      canvas.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const px = e.clientX - rect.left;
    const py = e.clientY - rect.top;

    currentDrag.current = { x: px, y: py };

    // Move ball visually along drag (drag restriction)
    ballPos.current.x = px;
    ballPos.current.y = py;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.releasePointerCapture(e.pointerId);

    const dy = dragStart.current.y - currentDrag.current.y;
    const dx = dragStart.current.x - currentDrag.current.x;

    // Calculate swipe gesture velocity vector
    // Swipe must be upward (dy > 30)
    if (dy > 35) {
      setAnimationState("throwing");
      setPromptMessage("Flicked! Pokéball in flight...");

      // Compute velocity vectors based on swipe speed
      const throwSpeed = Math.min(dy * 0.08, 14); // speed limit
      const angle = Math.atan2(-dy, -dx);

      ballVel.current = {
        x: Math.cos(angle) * throwSpeed,
        y: Math.sin(angle) * throwSpeed,
        z: throwSpeed * 0.0035, // forward speed decay
      };
    } else {
      // cancel drag, return ball to launcher
      gsap.to(ballPos.current, {
        x: canvas.width / 2,
        y: canvas.height - 45,
        duration: 0.25,
        ease: "power2.out"
      });
      setPromptMessage("Swipe up faster to flick.");
    }
  };

  return (
    <div className="w-full text-white select-none bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col md:flex-row gap-5 items-stretch">
      
      {/* Simulation Screen (The Interactive Arena) */}
      <div className="md:w-1/2 bg-black/40 border border-white/5 rounded-2xl p-2 flex flex-col items-center justify-between min-h-[360px] relative overflow-hidden">
        
        {/* Dynamic State Overlay */}
        <div className="absolute top-3 left-3 right-3 z-30 flex justify-between items-center px-1 font-mono text-[9px] uppercase tracking-wider text-neutral-400">
          <span>Target: {pokemonName}</span>
          <span className={animationState === "caught" ? "text-emerald-400" : ""}>{promptMessage}</span>
        </div>

        {/* Flick Arena Canvas */}
        <div ref={containerRef} className="relative w-full h-[360px] bg-neutral-950/20 border border-white/[0.02] rounded-xl overflow-hidden cursor-grab active:cursor-grabbing">
          <canvas
            ref={canvasRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="w-full h-full block"
          />

          {/* Glitch CRT grid scanner line effects */}
          <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_bottom,rgba(255,255,255,0)_96%,rgba(34,211,238,0.02)_96%)] bg-[size:100%_6px] mix-blend-color-dodge opacity-60" />
        </div>

        {/* Action Button */}
        <div className="w-full mt-2.5 z-10 px-1">
          {animationState !== "idle" && animationState !== "throwing" ? (
            <button
              onClick={handleReset}
              className="w-full py-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono transition-colors flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5 text-neutral-400" /> Reload Poké Ball
            </button>
          ) : (
            <div className="w-full py-1.5 text-center font-mono text-[10px] text-neutral-500 border border-white/[0.02] bg-white/[0.01] rounded-xl select-none">
              SWIPE / FLICK BALL TO CATCH
            </div>
          )}
        </div>
      </div>

      {/* Simulator Parameters Panel (The Inputs) */}
      <div className="md:w-1/2 flex flex-col justify-between gap-4 font-mono text-xs">
        
        {/* Ball Selectors */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase text-neutral-500">Select Poké Ball</span>
          <div className="grid grid-cols-2 gap-2">
            {BALLS.map((ball, idx) => (
              <button
                key={ball.name}
                onClick={() => setSelectedBallIndex(idx)}
                className={`py-1.5 px-2.5 rounded-xl border text-left flex justify-between items-center transition-all ${
                  selectedBallIndex === idx
                    ? `bg-white/10 ${ball.borderColor} text-white font-bold`
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                <span>{ball.name}</span>
                <span className="text-[9px] text-neutral-500">x{ball.modifier === 255 ? "∞" : ball.modifier}</span>
              </button>
            ))}
          </div>
        </div>

        {/* HP remaining slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] uppercase text-neutral-500">Target remaining HP</span>
            <span className={`font-semibold ${hpPercentage < 25 ? "text-rose-500 font-bold" : "text-emerald-400"}`}>
              {hpPercentage}%
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="100"
            value={hpPercentage}
            onChange={(e) => setHpPercentage(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer accent-emerald-400 border border-white/5"
          />
        </div>

        {/* Status Effect Dropdown */}
        <div className="space-y-1.5">
          <span className="text-[10px] uppercase text-neutral-500">Status Condition</span>
          <div className="grid grid-cols-3 gap-2">
            {STATUSES.map((status, idx) => (
              <button
                key={status.name}
                onClick={() => setSelectedStatusIndex(idx)}
                className={`py-1.5 px-1.5 rounded-xl border text-center transition-all truncate text-[10px] ${
                  selectedStatusIndex === idx
                    ? "bg-white/10 text-white font-bold border-white/20"
                    : "bg-white/5 border-white/5 text-neutral-400 hover:text-white"
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Calculations display */}
        <div className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between mt-1">
          <div>
            <span className="text-[9px] text-neutral-500 uppercase block leading-none mb-1">
              Estimated Catch Rate
            </span>
            <span className="text-xl font-bold tracking-tight text-emerald-400">
              {catchChance}%
            </span>
          </div>
          <div className="text-right text-[10px] text-neutral-500 leading-normal">
            <div>Base Rate: {captureRate}</div>
            <div>HP Mod: {hpPercentage < 30 ? "x3" : "x1.5"}</div>
          </div>
        </div>

      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import gsap from "gsap";
import type { PokemonStat } from "@/services/pokeapi";

interface RadarChartProps {
  stats: PokemonStat[];
  color: string;
}

const statLabels: Record<string, string> = {
  hp: "HP",
  attack: "ATK",
  defense: "DEF",
  "special-attack": "SATK",
  "special-defense": "SDEF",
  speed: "SPD",
};

// Order stats specifically to look balanced
const STAT_ORDER = ["hp", "attack", "defense", "speed", "special-defense", "special-attack"];

export function RadarChart({ stats, color }: RadarChartProps) {
  const [scale, setScale] = useState(0);

  // Re-run animation when stats change
  useEffect(() => {
    const obj = { val: 0 };
    const tween = gsap.to(obj, {
      val: 1,
      duration: 0.75,
      ease: "power2.out",
      onUpdate: () => {
        setScale(obj.val);
      },
    });

    return () => {
      tween.kill();
    };
  }, [stats]);

  const cx = 150;
  const cy = 130;
  const r = 80; // max radius

  // Map incoming stats to STAT_ORDER
  const orderedStats = STAT_ORDER.map((name) => {
    const s = stats.find((item) => item.name === name);
    return {
      name,
      value: s ? s.value : 50,
    };
  });

  // Concentric levels (rings)
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Helper to get coordinates for a given axis index and distance factor
  const getCoordinates = (index: number, factor: number) => {
    const angle = index * (2 * Math.PI / 6) - Math.PI / 2;
    const dist = r * factor;
    return {
      x: cx + dist * Math.cos(angle),
      y: cy + dist * Math.sin(angle),
    };
  };

  // Build polygon points for the rings
  const getRingPoints = (factor: number) => {
    return Array.from({ length: 6 })
      .map((_, i) => {
        const { x, y } = getCoordinates(i, factor);
        return `${x},${y}`;
      })
      .join(" ");
  };

  // Build player stats polygon points
  const getStatsPolygonPoints = () => {
    return orderedStats
      .map((stat, i) => {
        // Max base stat value in Pokemon is typically around 255
        const factor = (stat.value / 255) * scale;
        const { x, y } = getCoordinates(i, factor);
        return `${x},${y}`;
      })
      .join(" ");
  };

  return (
    <div className="w-full flex items-center justify-center bg-white/5 border border-white/5 rounded-2xl p-4 select-none">
      <svg width="300" height="260" viewBox="0 0 300 260" className="overflow-visible">
        {/* Grids / Concentric Hexagons */}
        {levels.map((factor) => (
          <polygon
            key={factor}
            points={getRingPoints(factor)}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="1"
          />
        ))}

        {/* Axes lines radiating from center */}
        {Array.from({ length: 6 }).map((_, i) => {
          const { x, y } = getCoordinates(i, 1.0);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={x}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}

        {/* Filled Stats Polygon */}
        <polygon
          points={getStatsPolygonPoints()}
          fill={`${color}22`}
          stroke={color}
          strokeWidth="2"
          style={{ filter: `drop-shadow(0 0 4px ${color}44)` }}
        />

        {/* Handles on each stat vertex */}
        {orderedStats.map((stat, i) => {
          const factor = (stat.value / 255) * scale;
          const { x, y } = getCoordinates(i, factor);
          return (
            <circle
              key={stat.name}
              cx={x}
              cy={y}
              r="3.5"
              fill={color}
              stroke="white"
              strokeWidth="1"
              style={{ filter: `drop-shadow(0 0 3px ${color})` }}
            />
          );
        })}

        {/* Axis Labels */}
        {orderedStats.map((stat, i) => {
          const angle = i * (2 * Math.PI / 6) - Math.PI / 2;
          // Place label slightly past max radius
          const labelDist = r + 18;
          const x = cx + labelDist * Math.cos(angle);
          const y = cy + labelDist * Math.sin(angle);
          
          // Determine text anchor alignment
          let textAnchor: "middle" | "start" | "end" = "middle";
          if (Math.cos(angle) > 0.1) textAnchor = "start";
          else if (Math.cos(angle) < -0.1) textAnchor = "end";

          // Vertical alignment adjustment
          let dy = "0.35em";
          if (Math.sin(angle) < -0.8) dy = "-0.2em";
          else if (Math.sin(angle) > 0.8) dy = "0.9em";

          const label = statLabels[stat.name] || stat.name.toUpperCase();

          return (
            <g key={stat.name}>
              <text
                x={x}
                y={y}
                dy={dy}
                textAnchor={textAnchor}
                className="fill-neutral-400 font-mono font-bold text-[9px] uppercase tracking-wider"
              >
                {label}
              </text>
              <text
                x={x}
                y={y}
                dy={dy === "0.9em" ? "2em" : dy === "-0.2em" ? "-1.2em" : "1.4em"}
                textAnchor={textAnchor}
                className="fill-white font-mono text-[9px] font-bold"
              >
                {stat.value}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

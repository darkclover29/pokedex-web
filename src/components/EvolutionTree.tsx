import { useState, useEffect, useRef } from "react";
import type { EvolutionTreeData } from "@/services/pokeapi";

interface EvolutionTreeProps {
  treeData: EvolutionTreeData;
  activeId: number;
  onNavigate: (id: number) => void;
}

interface RenderLine {
  d: string;
  fromId: number;
  toId: number;
  details: string;
  midX: number;
  midY: number;
}

export function EvolutionTree({ treeData, activeId, onNavigate }: EvolutionTreeProps) {
  const [lines, setLines] = useState<RenderLine[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  // Group nodes by stage (0, 1, 2)
  const baseNodes = treeData.nodes.filter((n) => n.stage === 0);
  const stage1Nodes = treeData.nodes.filter((n) => n.stage === 1);
  const stage2Nodes = treeData.nodes.filter((n) => n.stage === 2);

  const calculateLines = () => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const svgRect = container.getBoundingClientRect();

    const calculated: RenderLine[] = [];

    treeData.edges.forEach((edge) => {
      const fromEl = container.querySelector(`[data-node-id="${edge.fromId}"]`);
      const toEl = container.querySelector(`[data-node-id="${edge.toId}"]`);

      if (fromEl && toEl) {
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        // Calculate line endpoints relative to the container
        const x1 = fromRect.right - svgRect.left;
        const y1 = fromRect.top - svgRect.top + fromRect.height / 2;

        const x2 = toRect.left - svgRect.left;
        const y2 = toRect.top - svgRect.top + toRect.height / 2;

        // Smooth cubic bezier curve
        const d = `M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`;

        // Human-readable trigger details
        let details = "";
        if (edge.minLevel) {
          details = `Lvl ${edge.minLevel}`;
        } else if (edge.item) {
          details = edge.item.replace("-", " ");
        } else if (edge.trigger && edge.trigger !== "level-up") {
          details = edge.trigger.replace("-", " ");
        }

        calculated.push({
          d,
          fromId: edge.fromId,
          toId: edge.toId,
          details,
          midX: (x1 + x2) / 2,
          midY: (y1 + y2) / 2,
        });
      }
    });

    setLines(calculated);
  };

  useEffect(() => {
    // Run after DOM rendering has settled
    const timer = setTimeout(calculateLines, 100);
    window.addEventListener("resize", calculateLines);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", calculateLines);
    };
  }, [treeData]);

  // Render a single Pokemon Node card in the tree
  const renderNode = (node: any) => {
    const isCurrent = node.id === activeId;
    return (
      <button
        key={node.id}
        data-node-id={node.id}
        disabled={isCurrent}
        onClick={() => onNavigate(node.id)}
        className={`flex flex-col items-center p-3 rounded-xl border transition-all duration-200 z-10 w-24 ${
          isCurrent
            ? "bg-white/10 border-white/20 cursor-default"
            : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/15 hover:scale-105 cursor-pointer"
        }`}
      >
        <img
          src={node.image}
          alt={node.name}
          className="w-12 h-12 object-contain mb-1.5 filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
          onError={(e) => {
            (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${node.id}.png`;
          }}
        />
        <span className="text-[10px] capitalize font-bold text-neutral-200 group-hover:text-white truncate max-w-full">
          {node.name}
        </span>
        {isCurrent && (
          <span className="text-[8px] font-mono uppercase tracking-wider text-emerald-400 mt-0.5">
            Active
          </span>
        )}
      </button>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full min-h-[160px] bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center justify-between overflow-hidden"
    >
      {/* Background Connecting Lines SVG layer */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
        <defs>
          <linearGradient id="curveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.08)" />
            <stop offset="50%" stopColor="rgba(255, 255, 255, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.08)" />
          </linearGradient>
        </defs>
        
        {/* Draw bezier lines */}
        {lines.map((line, idx) => (
          <g key={idx}>
            <path
              d={line.d}
              fill="none"
              stroke="url(#curveGrad)"
              strokeWidth="2.5"
              strokeDasharray="4 2"
              className="animate-[dash_20s_linear_infinite]"
            />
            {/* Trigger detail label text */}
            {line.details && (
              <g transform={`translate(${line.midX}, ${line.midY})`}>
                <rect
                  x={-30}
                  y={-7}
                  width={60}
                  height={14}
                  rx={4}
                  fill="#0c0c0e"
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  textAnchor="middle"
                  dy="0.3em"
                  className="fill-neutral-400 font-mono text-[8px] font-bold uppercase tracking-wider scale-[0.85]"
                >
                  {line.details}
                </text>
              </g>
            )}
          </g>
        ))}
      </svg>

      {/* Column 0: Base */}
      <div className="flex flex-col gap-3 justify-center">
        {baseNodes.map(renderNode)}
      </div>

      {/* Column 1: Stage 1 */}
      {stage1Nodes.length > 0 && (
        <div className="flex flex-col gap-3 justify-center">
          {stage1Nodes.map(renderNode)}
        </div>
      )}

      {/* Column 2: Stage 2 */}
      {stage2Nodes.length > 0 && (
        <div className="flex flex-col gap-3 justify-center">
          {stage2Nodes.map(renderNode)}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Trophy, Sword, ShieldAlert } from "lucide-react";
import type { PokemonBase } from "@/services/pokeapi";

interface GymCountersProps {
  allPokemonList: PokemonBase[];
  onSelectPokemon: (id: number) => void;
}

interface GymLeader {
  name: string;
  badge: string;
  city: string;
  specialty: string;
  color: string;
  team: { name: string; id: number }[];
  counterTypes: string[];
}

const KANTO_GYM_LEADERS: GymLeader[] = [
  {
    name: "Brock",
    badge: "Boulder Badge",
    city: "Pewter City",
    specialty: "Rock",
    color: "#B6A136",
    team: [
      { name: "Geodude", id: 74 },
      { name: "Onix", id: 95 },
    ],
    counterTypes: ["water", "grass", "fighting", "ground"],
  },
  {
    name: "Misty",
    badge: "Cascade Badge",
    city: "Cerulean City",
    specialty: "Water",
    color: "#6390F0",
    team: [
      { name: "Staryu", id: 120 },
      { name: "Starmie", id: 121 },
    ],
    counterTypes: ["electric", "grass"],
  },
  {
    name: "Lt. Surge",
    badge: "Thunder Badge",
    city: "Vermilion City",
    specialty: "Electric",
    color: "#F7D02C",
    team: [
      { name: "Voltorb", id: 100 },
      { name: "Pikachu", id: 25 },
      { name: "Raichu", id: 26 },
    ],
    counterTypes: ["ground"],
  },
  {
    name: "Erika",
    badge: "Rainbow Badge",
    city: "Celadon City",
    specialty: "Grass",
    color: "#7AC74C",
    team: [
      { name: "Victreebel", id: 71 },
      { name: "Tangela", id: 114 },
      { name: "Vileplume", id: 45 },
    ],
    counterTypes: ["fire", "ice", "flying", "poison", "bug"],
  },
  {
    name: "Koga",
    badge: "Soul Badge",
    city: "Fuchsia City",
    specialty: "Poison",
    color: "#A33EA1",
    team: [
      { name: "Koffing", id: 109 },
      { name: "Muk", id: 89 },
      { name: "Weezing", id: 110 },
      { name: "Venomoth", id: 49 },
    ],
    counterTypes: ["ground", "psychic"],
  },
  {
    name: "Sabrina",
    badge: "Marsh Badge",
    city: "Saffron City",
    specialty: "Psychic",
    color: "#F95587",
    team: [
      { name: "Kadabra", id: 64 },
      { name: "Mr. Mime", id: 122 },
      { name: "Venomoth", id: 49 },
      { name: "Alakazam", id: 65 },
    ],
    counterTypes: ["bug", "ghost", "dark"],
  },
  {
    name: "Blaine",
    badge: "Volcano Badge",
    city: "Cinnabar Island",
    specialty: "Fire",
    color: "#EE8130",
    team: [
      { name: "Growlithe", id: 58 },
      { name: "Ponyta", id: 77 },
      { name: "Rapidash", id: 78 },
      { name: "Arcanine", id: 59 },
    ],
    counterTypes: ["water", "ground", "rock"],
  },
  {
    name: "Giovanni",
    badge: "Earth Badge",
    city: "Viridian City",
    specialty: "Ground",
    color: "#E2BF65",
    team: [
      { name: "Rhyhorn", id: 111 },
      { name: "Dugtrio", id: 51 },
      { name: "Nidoqueen", id: 31 },
      { name: "Nidoking", id: 34 },
      { name: "Rhydon", id: 112 },
    ],
    counterTypes: ["water", "grass", "ice"],
  },
];

export function GymCounters({ allPokemonList, onSelectPokemon }: GymCountersProps) {
  const [selectedLeaderIndex, setSelectedLeaderIndex] = useState(0);

  const leader = KANTO_GYM_LEADERS[selectedLeaderIndex];

  // Counter Suggestion Logic: find up to 3 loaded pokemon that match leader counter types
  const getSuggestions = () => {
    const matches = allPokemonList.filter((p) => {
      // Find overlap between pokemon's types and leader counterTypes
      return p.types.some((type) => leader.counterTypes.includes(type));
    });

    // Shuffle and pick 3 recommendations
    return matches.sort(() => 0.5 - Math.random()).slice(0, 3);
  };

  const suggestions = getSuggestions();

  return (
    <div className="w-full text-white select-none flex flex-col md:flex-row gap-6 py-4">
      
      {/* Left Sidebar: Leader Selector */}
      <div className="md:w-1/3 flex flex-col gap-2 border-b md:border-b-0 md:border-r border-white/5 pb-4 md:pb-0 md:pr-4">
        <div className="flex items-center gap-2 mb-2">
          <Trophy className="h-4 w-4 text-yellow-400" />
          <span className="text-[10px] uppercase font-mono text-neutral-400">Gym Leaders</span>
        </div>
        <div className="flex md:flex-col overflow-x-auto md:overflow-x-visible gap-1.5 pb-2 md:pb-0 pr-1 max-h-[280px] overflow-y-auto">
          {KANTO_GYM_LEADERS.map((gl, index) => {
            const isSelected = index === selectedLeaderIndex;
            return (
              <button
                key={gl.name}
                onClick={() => setSelectedLeaderIndex(index)}
                className={`flex-shrink-0 text-left px-3 py-2 rounded-xl border text-xs capitalize transition-all ${
                  isSelected
                    ? "bg-white/10 border-white/20 font-bold"
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
                }`}
                style={{
                  borderLeftColor: isSelected ? gl.color : undefined,
                  borderLeftWidth: isSelected ? "4px" : undefined,
                }}
              >
                <div className="font-semibold">{gl.name}</div>
                <div className="text-[9px] text-neutral-500 font-mono mt-0.5">{gl.badge}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Right Column: Leader Profile & Counter Pick suggestions */}
      <div className="md:w-2/3 flex flex-col justify-start">
        
        {/* Profile Card */}
        <div className="relative glass-panel border-white/5 p-4 rounded-2xl mb-4 overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1 blur-md"
            style={{ backgroundColor: leader.color }}
          />
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold tracking-tight">{leader.name}</h3>
              <p className="text-[10px] font-mono text-neutral-400 mt-0.5">
                {leader.city} • {leader.badge}
              </p>
            </div>
            <span
              className="text-[10px] uppercase tracking-wider font-bold font-mono px-2 py-0.5 rounded border border-white/15"
              style={{ color: leader.color, borderColor: `${leader.color}33` }}
            >
              {leader.specialty} Specialty
            </span>
          </div>

          {/* Signature Roster */}
          <div className="mt-4">
            <span className="block text-[9px] uppercase font-mono tracking-wider text-neutral-500 mb-2">
              Signature Roster
            </span>
            <div className="flex gap-2">
              {leader.team.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/5 bg-white/5 text-xs capitalize cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => onSelectPokemon(member.id)}
                  title="Click to view details"
                >
                  <img
                    src={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${member.id}.png`}
                    alt={member.name}
                    className="w-6 h-6 object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${member.id}.png`;
                    }}
                  />
                  <span className="font-semibold text-neutral-200">{member.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Counter Advisor Recommendations */}
        <div className="flex flex-col flex-1">
          <div className="flex items-center gap-1.5 mb-2.5">
            <Sword className="h-4 w-4 text-emerald-400" />
            <span className="text-[10px] uppercase font-mono tracking-wider text-neutral-400">
              Optimal Counter Recommendations
            </span>
          </div>

          {suggestions.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-2xl bg-white/5 text-neutral-500 gap-1 text-center">
              <ShieldAlert className="h-7 w-7 text-neutral-600 mb-1" />
              <span className="font-mono text-[11px]">Database Suggestion Index Empty.</span>
              <span className="text-[9px] text-neutral-600 max-w-xs mt-0.5">
                Load more Pokémon from Kanto elements ({leader.counterTypes.join(", ")}) to unlock advisors.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {suggestions.map((pokemon) => (
                <button
                  key={pokemon.id}
                  onClick={() => onSelectPokemon(pokemon.id)}
                  className="flex flex-col items-center p-3 rounded-xl border border-white/5 bg-white/5 hover:bg-emerald-500/5 hover:border-emerald-500/20 hover:scale-[1.02] transition-all group"
                >
                  <div className="relative w-12 h-12 flex items-center justify-center mb-1.5">
                    <img
                      src={pokemon.image}
                      alt={pokemon.name}
                      className="w-10 h-10 object-contain z-10"
                      loading="lazy"
                    />
                  </div>
                  <span className="text-[10px] capitalize font-bold text-neutral-200 group-hover:text-white truncate max-w-full">
                    {pokemon.name}
                  </span>
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {pokemon.types
                      .filter((type) => leader.counterTypes.includes(type))
                      .map((type) => (
                        <span
                          key={type}
                          className="text-[8px] font-bold uppercase px-1 rounded border border-white/10 bg-emerald-500/10 text-emerald-400"
                        >
                          {type}
                        </span>
                      ))}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

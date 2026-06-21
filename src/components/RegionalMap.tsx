import { useState } from "react";
import { Compass, Map, HelpCircle, ChevronRight, Pin } from "lucide-react";
import type { PokemonBase } from "../services/pokeapi";
import { getOfficialArtwork } from "../services/pokeapi";

interface RegionalMapProps {
  allPokemonList: PokemonBase[];
  onSelectPokemon?: (id: number) => void;
}

interface MapLocation {
  id: string;
  name: string;
  description: string;
  x: number; // percentage coordinate X (0-100)
  y: number; // percentage coordinate Y (0-100)
  type: "city" | "town" | "route" | "cave" | "forest" | "landmark";
  encounters: number[]; // Pokemon IDs
  pointsOfInterest?: string[];
}

const KANTO_LOCATIONS: MapLocation[] = [
  {
    id: "pallet-town",
    name: "Pallet Town",
    description: "A cozy, quiet town nestled in the southwest. The starting point for legendary journeys and home of the famous Oak Pokémon Lab.",
    x: 22,
    y: 82,
    type: "town",
    encounters: [60, 72, 79, 98, 116, 129], // Poliwag, Tentacool, Shellder, Krabby, Horsea, Magikarp
    pointsOfInterest: ["Prof. Oak's Lab", "Your House", "Rival's House"]
  },
  {
    id: "route-1",
    name: "Route 1",
    description: "A grassy trail connecting Pallet Town to Viridian City. Known for being peaceful and filled with beginner-friendly Pokémon.",
    x: 22,
    y: 68,
    type: "route",
    encounters: [16, 19], // Pidgey, Rattata
    pointsOfInterest: ["Free Potion Marketeer"]
  },
  {
    id: "viridian-city",
    name: "Viridian City",
    description: "A beautiful city enveloped by green. It features a mysterious Gym that remains locked for most of the trainer's journey.",
    x: 22,
    y: 54,
    type: "city",
    encounters: [60, 116, 129], // Poliwag, Goldeen, Magikarp (fishing)
    pointsOfInterest: ["Viridian Gym (Giovanni)", "Pokémon Academy"]
  },
  {
    id: "route-2",
    name: "Route 2",
    description: "A path winding north toward Pewter City, split in two by the massive Viridian Forest canopy.",
    x: 22,
    y: 43,
    type: "route",
    encounters: [10, 13, 16, 19], // Caterpie, Weedle, Pidgey, Rattata
    pointsOfInterest: ["Diglett's Cave Exit"]
  },
  {
    id: "viridian-forest",
    name: "Viridian Forest",
    description: "A deep, natural maze of towering trees and thick foliage. Frequented by bug catchers and home to elusive electric mice.",
    x: 22,
    y: 32,
    type: "forest",
    encounters: [10, 11, 13, 14, 25], // Caterpie, Metapod, Weedle, Kakuna, Pikachu
    pointsOfInterest: ["Hidden Items", "Bug Catcher Squads"]
  },
  {
    id: "pewter-city",
    name: "Pewter City",
    description: "A stone-walled city sitting on rocky terrain. Celebrated for its Science Museum and formidable rock-type specialists.",
    x: 22,
    y: 20,
    type: "city",
    encounters: [],
    pointsOfInterest: ["Pewter Gym (Brock)", "Pewter Museum of Science"]
  },
  {
    id: "route-3",
    name: "Route 3",
    description: "A windswept mountain road leading east toward Mt. Moon. Filled with eager trainers practicing their battle strategies.",
    x: 36,
    y: 20,
    type: "route",
    encounters: [16, 19, 21, 27, 39, 56], // Pidgey, Rattata, Spearow, Sandshrew, Jigglypuff, Mankey
  },
  {
    id: "mt-moon",
    name: "Mt. Moon",
    description: "A legendary, cavernous mountain tunnel known for rare Moon Stone meteorites and Clefairy dancing circles.",
    x: 48,
    y: 20,
    type: "cave",
    encounters: [35, 41, 46, 74], // Clefairy, Zubat, Paras, Geodude
    pointsOfInterest: ["Fossil Discoveries", "Team Rocket Grunts"]
  },
  {
    id: "route-4",
    name: "Route 4",
    description: "A steep, descending path extending from Mt. Moon's exit down into the outskirts of Cerulean City.",
    x: 60,
    y: 20,
    type: "route",
    encounters: [19, 21, 23, 27], // Rattata, Spearow, Ekans, Sandshrew
  },
  {
    id: "cerulean-city",
    name: "Cerulean City",
    description: "A floral city surrounded by flowing water. Home to the Water Gym and a nearby bridge famous for testing trainers' mettle.",
    x: 72,
    y: 20,
    type: "city",
    encounters: [116, 118, 129], // Magikarp, Goldeen, Seaking
    pointsOfInterest: ["Cerulean Gym (Misty)", "Bike Shop", "Miracle Cycle"]
  },
  {
    id: "route-24-25",
    name: "Route 24 & 25",
    description: "Also known as the Golden Hills. Leads up past Nugget Bridge to Bill's Sea Cottage overlooking the Cape.",
    x: 72,
    y: 8,
    type: "route",
    encounters: [10, 13, 16, 43, 63, 69], // Caterpie, Weedle, Pidgey, Oddish, Abra, Bellsprout
    pointsOfInterest: ["Nugget Bridge", "Sea Cottage (Bill's Lab)"]
  },
  {
    id: "route-5",
    name: "Route 5",
    description: "A short, peaceful lane running south from Cerulean City. Features a local Day Care center for raising Pokémon.",
    x: 72,
    y: 31,
    type: "route",
    encounters: [16, 19, 43, 52, 69], // Pidgey, Rattata, Oddish, Meowth, Bellsprout
    pointsOfInterest: ["Pokémon Day Care"]
  },
  {
    id: "route-6",
    name: "Route 6",
    description: "A path passing beside rivers down to Vermilion City. Highly active with bird keepers and picnickers.",
    x: 72,
    y: 43,
    type: "route",
    encounters: [16, 19, 39, 52, 54, 96], // Pidgey, Rattata, Jigglypuff, Meowth, Psyduck, Drowzee
  },
  {
    id: "vermilion-city",
    name: "Vermilion City",
    description: "A bustling, sun-drenched port city. Famous for hosting the luxurious S.S. Anne cruise ship and an electric gym.",
    x: 72,
    y: 55,
    type: "city",
    encounters: [72, 90, 116, 129], // Tentacool, Shellder, Magikarp, Krabby
    pointsOfInterest: ["Vermilion Gym (Lt. Surge)", "S.S. Anne Harbor", "Pokémon Fan Club"]
  },
  {
    id: "digletts-cave",
    name: "Diglett's Cave",
    description: "A subterranean tunnel dug out entirely by wild Diglett. Creates a convenient shortcut back to Route 2.",
    x: 58,
    y: 55,
    type: "cave",
    encounters: [50, 51], // Diglett, Dugtrio
  },
  {
    id: "route-9",
    name: "Route 9",
    description: "A rugged, rocky road leading east to the Rock Tunnel. Features elevated ledges that block simple return travels.",
    x: 83,
    y: 20,
    type: "route",
    encounters: [19, 20, 21, 22, 23, 27], // Rattata, Raticate, Spearow, Fearow, Ekans, Sandshrew
  },
  {
    id: "rock-tunnel",
    name: "Rock Tunnel",
    description: "A pitch-black, unlit cavern route cutting through the mountains. Needs a Flash light to traverse safely without getting lost.",
    x: 91,
    y: 20,
    type: "cave",
    encounters: [41, 66, 74, 95], // Zubat, Machop, Geodude, Onix
  },
  {
    id: "lavender-town",
    name: "Lavender Town",
    description: "A solemn, purple-tinged town. Revered for housing the grand Pokémon Tower memorial site where departed souls rest.",
    x: 91,
    y: 35,
    type: "town",
    encounters: [],
    pointsOfInterest: ["Pokémon Tower", "Volunteer House (Mr. Fuji)"]
  },
  {
    id: "pokemon-tower",
    name: "Pokémon Tower",
    description: "A towering, spooky monument filled with graves. Riddled with dense mist and ghostly apparitions.",
    x: 93,
    y: 29,
    type: "landmark",
    encounters: [92, 93, 104], // Gastly, Haunter, Cubone
    pointsOfInterest: ["Restless Spirit (Marowak)", "Spooky Channelers"]
  },
  {
    id: "celadon-city",
    name: "Celadon City",
    description: "The dream city of rainbow colors. Kanto's largest metropolis, housing a massive Department Store, Game Corner, and floral Gym.",
    x: 50,
    y: 35,
    type: "city",
    encounters: [],
    pointsOfInterest: ["Celadon Gym (Erika)", "Celadon Department Store", "Rocket Game Corner"]
  },
  {
    id: "route-7",
    name: "Route 7",
    description: "A brief, highly traveled strip of highway linking Celadon City to the underground path junctions.",
    x: 60,
    y: 35,
    type: "route",
    encounters: [16, 19, 37, 58, 63], // Pidgey, Rattata, Vulpix, Growlithe, Abra
  },
  {
    id: "route-8",
    name: "Route 8",
    description: "An east-west connection path linking Lavender Town with the Saffron City gates.",
    x: 80,
    y: 35,
    type: "route",
    encounters: [16, 19, 37, 58, 63], // Pidgey, Rattata, Vulpix, Growlithe, Abra
  },
  {
    id: "cycling-road",
    name: "Cycling Road",
    description: "A long, downward sloping bridge over the sea. Highly popular for bikers and triathletes (Routes 16, 17, and 18).",
    x: 35,
    y: 50,
    type: "route",
    encounters: [19, 20, 21, 22, 84, 85, 88, 89], // Rattata, Raticate, Spearow, Fearow, Doduo, Dodrio, Grimer, Muk
    pointsOfInterest: ["Water-gate Snorlax Bridge"]
  },
  {
    id: "fuchsia-city",
    name: "Fuchsia City",
    description: "A historic city nestled next to the sea. Home to the Safari Zone and the toxic ninja Gym leaders.",
    x: 50,
    y: 70,
    type: "city",
    encounters: [],
    pointsOfInterest: ["Fuchsia Gym (Koga)", "Safari Zone Gate", "Warden's House"]
  },
  {
    id: "safari-zone",
    name: "Safari Zone",
    description: "An open-air wildlife preserve where trainers pay to catch exotic species using special Safari balls and bait.",
    x: 50,
    y: 59,
    type: "forest",
    encounters: [29, 32, 102, 111, 113, 123, 127, 128], // Nidoran F, Nidoran M, Exeggcute, Rhyhorn, Chansey, Scyther, Pinsir, Tauros
    pointsOfInterest: ["Secret House (Surf HM)", "Rare Pokemon Habitation"]
  },
  {
    id: "seafoam-islands",
    name: "Seafoam Islands",
    description: "A set of twin islands containing freezing caves with strong water currents. Rumored nesting grounds of a legendary ice bird.",
    x: 35,
    y: 94,
    type: "cave",
    encounters: [72, 73, 90, 116, 117, 120, 144], // Tentacool, Tentacruel, Shellder, Horsea, Seadra, Staryu, Articuno
    pointsOfInterest: ["Ice Cavern Current", "Articuno Sanctum"]
  },
  {
    id: "cinnabar-island",
    name: "Cinnabar Island",
    description: "A volcanic island in the south. Hosts a grand research lab and a hot-headed fire Gym inside a volcanic crater.",
    x: 22,
    y: 94,
    type: "city",
    encounters: [],
    pointsOfInterest: ["Cinnabar Gym (Blaine)", "Pokémon Lab", "Fossil Restoration"]
  },
  {
    id: "pokemon-mansion",
    name: "Pokémon Mansion",
    description: "A burned-down, abandoned mansion filled with old research journals detailing a legendary clone project.",
    x: 17,
    y: 94,
    type: "landmark",
    encounters: [37, 58, 77, 88, 109, 110, 126], // Vulpix, Growlithe, Ponyta, Grimer, Koffing, Weezing, Magmar
    pointsOfInterest: ["Scientist Diaries", "Mewtwo Project Records"]
  },
  {
    id: "route-21",
    name: "Route 21",
    description: "A water channel stretching north from Cinnabar Island up to Pallet Town, popular for swimmers and fishers.",
    x: 22,
    y: 88,
    type: "route",
    encounters: [16, 19, 72, 114, 116], // Pidgey, Rattata, Tentacool, Tangela, Magikarp
  },
  {
    id: "route-22",
    name: "Route 22",
    description: "A short western route from Viridian City that acts as the entry checkpoint to the Indigo Plateau gates.",
    x: 12,
    y: 54,
    type: "route",
    encounters: [19, 21, 29, 32, 56], // Rattata, Spearow, Nidoran F, Nidoran M, Mankey
    pointsOfInterest: ["Rival Battle Gate"]
  },
  {
    id: "victory-road",
    name: "Victory Road & Route 23",
    description: "A gruelling, puzzle-filled mountain tunnel that tests if trainers have earned all 8 badges before challenging the Elite Four.",
    x: 12,
    y: 35,
    type: "cave",
    encounters: [41, 42, 66, 67, 74, 75, 95, 105], // Zubat, Golbat, Machop, Machoke, Geodude, Graveler, Onix, Marowak
    pointsOfInterest: ["Badge Check Gates", "Moltres Nest"]
  },
  {
    id: "indigo-plateau",
    name: "Indigo Plateau",
    description: "The ultimate destination. The headquarters of the Pokémon League where trainers challenge the Elite Four and Champion.",
    x: 12,
    y: 20,
    type: "landmark",
    encounters: [],
    pointsOfInterest: ["Elite Four Chambers", "Champion Arena"]
  }
];

// Map node connections to draw topological route lines
const LOCATION_CONNECTIONS = [
  ["pallet-town", "route-1"],
  ["route-1", "viridian-city"],
  ["viridian-city", "route-2"],
  ["route-2", "viridian-forest"],
  ["viridian-forest", "pewter-city"],
  ["pewter-city", "route-3"],
  ["route-3", "mt-moon"],
  ["mt-moon", "route-4"],
  ["route-4", "cerulean-city"],
  ["cerulean-city", "route-24-25"],
  ["cerulean-city", "route-5"],
  ["route-5", "route-7"], // Junction
  ["route-7", "celadon-city"],
  ["route-7", "route-6"],
  ["route-6", "vermilion-city"],
  ["route-7", "route-8"],
  ["route-8", "lavender-town"],
  ["lavender-town", "pokemon-tower"],
  ["cerulean-city", "route-9"],
  ["route-9", "rock-tunnel"],
  ["rock-tunnel", "lavender-town"],
  ["vermilion-city", "digletts-cave"],
  ["digletts-cave", "route-2"],
  ["celadon-city", "cycling-road"],
  ["cycling-road", "fuchsia-city"],
  ["fuchsia-city", "safari-zone"],
  ["lavender-town", "fuchsia-city"], // Route 12-15 represented directly
  ["fuchsia-city", "seafoam-islands"],
  ["seafoam-islands", "cinnabar-island"],
  ["cinnabar-island", "pokemon-mansion"],
  ["cinnabar-island", "route-21"],
  ["route-21", "pallet-town"],
  ["viridian-city", "route-22"],
  ["route-22", "victory-road"],
  ["victory-road", "indigo-plateau"]
];

export function RegionalMap({ allPokemonList, onSelectPokemon }: RegionalMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<MapLocation>(KANTO_LOCATIONS[0]);

  // Color mappings for location nodes based on category
  const getNodeColor = (type: string, isSelected: boolean) => {
    if (isSelected) return "fill-amber-400 stroke-white stroke-[2px] filter drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]";
    switch (type) {
      case "city":
        return "fill-cyan-400 stroke-cyan-200 stroke-[1px] hover:fill-cyan-300";
      case "town":
        return "fill-indigo-400 stroke-indigo-200 stroke-[1px] hover:fill-indigo-300";
      case "route":
        return "fill-emerald-500 stroke-emerald-300/40 stroke-[1px] hover:fill-emerald-400";
      case "cave":
        return "fill-amber-600 stroke-amber-500/40 stroke-[1px] hover:fill-amber-500";
      case "forest":
        return "fill-teal-500 stroke-teal-300/40 stroke-[1px] hover:fill-teal-400";
      case "landmark":
        return "fill-rose-500 stroke-rose-300/40 stroke-[1px] hover:fill-rose-400";
      default:
        return "fill-neutral-400";
    }
  };

  const getLineCoordinates = (conn: string[]) => {
    const fromLoc = KANTO_LOCATIONS.find((l) => l.id === conn[0]);
    const toLoc = KANTO_LOCATIONS.find((l) => l.id === conn[1]);
    if (!fromLoc || !toLoc) return null;
    return {
      x1: `${fromLoc.x}%`,
      y1: `${fromLoc.y}%`,
      x2: `${toLoc.x}%`,
      y2: `${toLoc.y}%`,
    };
  };

  // Find details for wild encounters
  const getEncounterPokemon = (id: number): PokemonBase => {
    const found = allPokemonList.find((p) => p.id === id);
    if (found) return found;
    // Fallback if list lacks detailed cache
    return {
      id,
      name: `pokemon #${id}`,
      types: [],
      image: getOfficialArtwork(id),
      shinyImage: ""
    };
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-4 max-h-[85vh] overflow-y-auto">
      
      {/* Header title */}
      <div className="lg:col-span-12 flex justify-between items-center border-b border-white/10 pb-4 mb-2">
        <div>
          <h2 className="text-xl font-bold font-mono text-white tracking-widest flex items-center gap-2">
            <Compass className="h-5 w-5 text-emerald-400 animate-[spin_8s_linear_infinite]" />
            KANTO REGIONAL MAP
          </h2>
          <p className="text-[10px] font-mono text-neutral-400 mt-1 uppercase tracking-widest">
            Encounter Guides & Point of Interest Locator
          </p>
        </div>
      </div>

      {/* Left Column: Interactive Map (occupies 7/12 cols) */}
      <div className="col-span-1 lg:col-span-7 flex flex-col gap-3">
        <div className="relative aspect-[4/3] w-full rounded-2xl border border-white/10 bg-neutral-950/60 shadow-2xl backdrop-blur-sm overflow-hidden p-2 select-none">
          
          {/* Compass Rose Accent */}
          <div className="absolute top-4 right-4 flex flex-col items-center opacity-25 pointer-events-none">
            <Compass className="h-10 w-10 text-neutral-500" />
            <span className="font-mono text-[8px] text-neutral-500 tracking-widest mt-1">KANTO</span>
          </div>

          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            
            {/* Draw topological routes connections */}
            {LOCATION_CONNECTIONS.map((conn, idx) => {
              const coords = getLineCoordinates(conn);
              if (!coords) return null;
              return (
                <line
                  key={idx}
                  x1={coords.x1}
                  y1={coords.y1}
                  x2={coords.x2}
                  y2={coords.y2}
                  className="stroke-neutral-800 stroke-[3px] stroke-dasharray-[4,4] opacity-50"
                  style={{ strokeDasharray: "4, 4" }}
                />
              );
            })}

            {/* Draw interactive location nodes */}
            {KANTO_LOCATIONS.map((loc) => {
              const isSelected = selectedLocation.id === loc.id;
              return (
                <g key={loc.id} className="cursor-pointer" onClick={() => setSelectedLocation(loc)}>
                  {/* Glowing ring under selected */}
                  {isSelected && (
                    <circle
                      cx={`${loc.x}%`}
                      cy={`${loc.y}%`}
                      r="14"
                      className="fill-transparent stroke-amber-500/40 stroke-[2px] animate-ping"
                    />
                  )}
                  {/* Base node circle */}
                  <circle
                    cx={`${loc.x}%`}
                    cy={`${loc.y}%`}
                    r={loc.type === "city" || loc.type === "town" ? "8" : "6"}
                    className={`transition-all duration-200 ${getNodeColor(loc.type, isSelected)}`}
                  />
                </g>
              );
            })}
          </svg>

          {/* Location names overlay text for cities/towns */}
          {KANTO_LOCATIONS.map((loc) => {
            if (loc.type !== "city" && loc.type !== "town" && loc.type !== "landmark") return null;
            return (
              <span
                key={loc.id}
                onClick={() => setSelectedLocation(loc)}
                className={`absolute font-mono text-[8px] tracking-wide pointer-events-auto cursor-pointer uppercase ${
                  selectedLocation.id === loc.id
                    ? "text-amber-400 font-bold"
                    : "text-neutral-500 hover:text-white"
                }`}
                style={{
                  left: `${loc.x}%`,
                  top: `${loc.y + 4}%`,
                  transform: "translateX(-50%)",
                }}
              >
                {loc.name}
              </span>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 justify-center font-mono text-[8px] text-neutral-500 uppercase tracking-widest bg-white/2 p-2 border border-white/5 rounded-xl">
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-cyan-400" /> City
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-indigo-400" /> Town
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-emerald-500" /> Route
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-amber-600" /> Cave
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-teal-500" /> Forest
          </div>
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-rose-500" /> Landmark
          </div>
        </div>
      </div>

      {/* Right Column: Location Details & Wild Encounters Sidebar (occupies 5/12 cols) */}
      <div className="col-span-1 lg:col-span-5 flex flex-col gap-4">
        
        {/* Selected location profile */}
        <div className="rounded-2xl border border-white/10 bg-neutral-950/40 p-4 flex flex-col gap-3 relative overflow-hidden">
          <div className="absolute top-3 right-3 opacity-15 pointer-events-none">
            <Map className="h-10 w-10 text-neutral-400" />
          </div>

          <div className="flex items-center gap-2">
            <Pin className={`h-4 w-4 ${selectedLocation.type === "city" || selectedLocation.type === "town" ? "text-indigo-400" : "text-emerald-400"}`} />
            <h3 className="text-base font-extrabold font-mono text-white tracking-wider capitalize">
              {selectedLocation.name}
            </h3>
          </div>

          <span className="inline-block text-[8px] font-mono font-bold uppercase tracking-widest px-2 py-0.5 rounded border border-white/10 bg-white/5 text-neutral-400 self-start">
            Type: {selectedLocation.type}
          </span>

          <p className="text-xs text-neutral-300 font-mono leading-relaxed select-text">
            {selectedLocation.description}
          </p>

          {/* Points of Interest */}
          {selectedLocation.pointsOfInterest && selectedLocation.pointsOfInterest.length > 0 && (
            <div className="border-t border-white/5 pt-3">
              <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest mb-1.5">
                📍 Points of Interest
              </span>
              <ul className="text-[10px] font-mono text-neutral-300 space-y-1">
                {selectedLocation.pointsOfInterest.map((p) => (
                  <li key={p} className="flex items-center gap-1">
                    <span className="h-1 w-1 bg-amber-400 rounded-full" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Wild Encounters Grid */}
        <div className="flex-grow rounded-2xl border border-white/5 bg-neutral-950/20 p-4 flex flex-col">
          <span className="block text-[8px] font-mono text-neutral-500 uppercase tracking-widest mb-3">
            🌾 Wild Pokémon Spawns
          </span>

          {selectedLocation.encounters.length === 0 ? (
            <div className="flex-grow flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/5 rounded-xl text-neutral-500 gap-2 h-44">
              <HelpCircle className="h-8 w-8 opacity-25 text-neutral-500" />
              <span className="font-mono text-xs">No wild spawns cataloged at this location.</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-1">
              {selectedLocation.encounters.map((id) => {
                const pokemon = getEncounterPokemon(id);
                return (
                  <button
                    key={id}
                    onClick={() => onSelectPokemon?.(id)}
                    className="group relative flex items-center gap-2.5 p-2 rounded-xl border border-white/5 bg-white/2 hover:bg-emerald-500/10 hover:border-emerald-500/25 transition-all text-left font-mono"
                  >
                    <div className="h-10 w-10 rounded-full bg-neutral-950 border border-white/5 flex items-center justify-center p-1 group-hover:scale-105 transition-transform">
                      <img src={pokemon.image} alt={pokemon.name} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-grow min-w-0">
                      <span className="block text-[8px] text-neutral-500 font-bold leading-none">#{String(id).padStart(3, "0")}</span>
                      <span className="block text-xs font-bold text-neutral-200 capitalize truncate group-hover:text-emerald-400 transition-colors mt-0.5">
                        {pokemon.name.replace("-", " ")}
                      </span>
                    </div>
                    <ChevronRight className="h-3 w-3 text-neutral-500 group-hover:text-white transition-colors flex-shrink-0" />
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

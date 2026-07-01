// Shared Pokémon type constants — single source of truth used across all components.

export const TYPE_COLORS: Record<string, string> = {
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

/** HSL triplet strings (no commas) for CSS box-shadow / glow effects. */
export const TYPE_GLOW_HSL: Record<string, string> = {
  normal: "40 10 70",
  fire: "20 85 55",
  water: "220 80 60",
  electric: "50 90 55",
  grass: "120 70 50",
  ice: "180 65 65",
  fighting: "0 75 45",
  poison: "300 65 45",
  ground: "40 60 50",
  flying: "255 70 70",
  psychic: "340 90 60",
  bug: "80 75 40",
  rock: "50 50 45",
  ghost: "260 40 50",
  dragon: "260 85 60",
  dark: "20 20 30",
  steel: "240 10 70",
  fairy: "325 70 70",
};

/** Types that are strong counters against each key type. */
export const TYPE_COUNTERS: Record<string, string[]> = {
  normal: ["fighting"],
  fire: ["water", "ground", "rock"],
  water: ["grass", "electric"],
  electric: ["ground"],
  grass: ["fire", "ice", "poison", "flying", "bug"],
  ice: ["fire", "fighting", "rock", "steel"],
  fighting: ["flying", "psychic", "fairy"],
  poison: ["ground", "psychic"],
  ground: ["water", "grass", "ice"],
  flying: ["electric", "ice", "rock"],
  psychic: ["bug", "ghost", "dark"],
  bug: ["fire", "flying", "rock"],
  rock: ["water", "grass", "fighting", "ground", "steel"],
  ghost: ["ghost", "dark"],
  dragon: ["ice", "dragon", "fairy"],
  dark: ["fighting", "bug", "fairy"],
  steel: ["fire", "fighting", "ground"],
  fairy: ["poison", "steel"],
};

export const POKEMON_TYPES = [
  "all", "normal", "fire", "water", "electric", "grass", "ice",
  "fighting", "poison", "ground", "flying", "psychic", "bug",
  "rock", "ghost", "dragon", "dark", "steel", "fairy",
] as const;

export type PokemonTypeName = typeof POKEMON_TYPES[number];

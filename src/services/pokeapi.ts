// ─── Public data types ──────────────────────────────────────────────────────

export interface PokemonBase {
  id: number;
  name: string;
  types: string[];
  image: string;
  shinyImage: string;
}

export interface PokemonStat {
  name: string;
  value: number;
}

export interface PokemonAbility {
  name: string;
  isHidden: boolean;
}

export interface EvolutionNode {
  id: number;
  name: string;
  image: string;
  stage: number; // 0: base, 1: stage 1, 2: stage 2
}

export interface EvolutionEdge {
  fromId: number;
  toId: number;
  minLevel?: number;
  trigger?: string;
  item?: string;
}

export interface EvolutionTreeData {
  nodes: EvolutionNode[];
  edges: EvolutionEdge[];
}

export interface PokemonMove {
  name: string;
  level: number;
}

export interface PokemonFullDetails extends PokemonBase {
  height: number;
  weight: number;
  stats: PokemonStat[];
  abilities: PokemonAbility[];
  cryUrl: string | null;
  description: string;
  evolutionTree: EvolutionTreeData;
  moves: PokemonMove[];
  captureRate: number; // Base species capture rate (3–255)
}

// ─── Raw API shapes (internal — not exported) ────────────────────────────────

interface RawSprites {
  front_default: string | null;
  front_shiny: string | null;
  other: {
    "official-artwork": {
      front_default: string | null;
      front_shiny: string | null;
    };
  };
}

interface RawPokemonResponse {
  id: number;
  name: string;
  height: number;
  weight: number;
  types: { type: { name: string } }[];
  sprites: RawSprites;
  abilities: { ability: { name: string }; is_hidden: boolean }[];
  stats: { stat: { name: string }; base_stat: number }[];
  cries: { latest: string | null; legacy: string | null } | null;
  moves: {
    move: { name: string };
    version_group_details: {
      move_learn_method: { name: string };
      level_learned_at: number;
    }[];
  }[];
  species: { url: string } | null;
}

interface RawSpeciesResponse {
  capture_rate: number;
  flavor_text_entries: { flavor_text: string; language: { name: string } }[];
  evolution_chain: { url: string } | null;
}

interface RawEvolutionNode {
  species: { name: string; url: string };
  evolves_to: RawEvolutionNode[];
  evolution_details: {
    min_level: number | null;
    trigger: { name: string } | null;
    item: { name: string } | null;
  }[];
}

interface RawEvolutionChainResponse {
  chain: RawEvolutionNode;
}

interface RawPokemonListResponse {
  results: { name: string; url: string }[];
}

// ─── localStorage cache helpers ───────────────────────────────────────────────

const CACHE_VERSION = "v2";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  ts: number;
}

function cacheKey(suffix: string): string {
  return `pokedex_${CACHE_VERSION}_${suffix}`;
}

function readCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > CACHE_TTL_MS) {
      localStorage.removeItem(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function writeCache<T>(key: string, data: T): void {
  try {
    const entry: CacheEntry<T> = { data, ts: Date.now() };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch {
    // localStorage quota exceeded — skip silently; app still works without cache.
  }
}

// ─── Shared utilities ─────────────────────────────────────────────────────────

const BASE_URL = "https://pokeapi.co/api/v2";

export function extractIdFromUrl(url: string): number {
  const parts = url.split("/").filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
}

export function getOfficialArtwork(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

function extractBase(data: RawPokemonResponse): PokemonBase {
  return {
    id: data.id,
    name: data.name,
    types: data.types.map((t) => t.type.name),
    image:
      data.sprites.other["official-artwork"].front_default ??
      data.sprites.front_default ??
      "",
    shinyImage:
      data.sprites.other["official-artwork"].front_shiny ??
      data.sprites.front_shiny ??
      "",
  };
}

// ─── Evolution tree parser ────────────────────────────────────────────────────

function parseEvolutionTree(chain: RawEvolutionNode): EvolutionTreeData {
  const nodes: EvolutionNode[] = [];
  const edges: EvolutionEdge[] = [];
  const addedIds = new Set<number>();

  function traverse(node: RawEvolutionNode, stage: number): void {
    const id = extractIdFromUrl(node.species.url);

    if (!addedIds.has(id)) {
      nodes.push({ id, name: node.species.name, image: getOfficialArtwork(id), stage });
      addedIds.add(id);
    }

    for (const child of node.evolves_to ?? []) {
      const childId = extractIdFromUrl(child.species.url);
      const details = child.evolution_details?.[0];
      edges.push({
        fromId: id,
        toId: childId,
        minLevel: details?.min_level ?? undefined,
        trigger: details?.trigger?.name ?? undefined,
        item: details?.item?.name ?? undefined,
      });
      traverse(child, stage + 1);
    }
  }

  traverse(chain, 0);
  return { nodes, edges };
}

// ─── Public API functions ─────────────────────────────────────────────────────

/**
 * Fetches a paginated list of Pokémon with basic info.
 * Cached in localStorage for 24 h.
 * Throws on network failure so callers can render an error state.
 */
export async function fetchPokemonList(limit = 20, offset = 0): Promise<PokemonBase[]> {
  const key = cacheKey(`list_${limit}_${offset}`);
  const cached = readCache<PokemonBase[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to fetch Pokémon list (HTTP ${res.status})`);
  const data: RawPokemonListResponse = await res.json();

  const results = await Promise.all(
    data.results.map(async (p) => {
      const detailRes = await fetch(p.url);
      if (!detailRes.ok) return null;
      const detailData: RawPokemonResponse = await detailRes.json();
      return extractBase(detailData);
    })
  );

  const list = results.filter((p): p is PokemonBase => p !== null);
  writeCache(key, list);
  return list;
}

/**
 * Fetches full details for one Pokémon by ID or name.
 * Cached in localStorage for 24 h.
 * Returns null if the Pokémon is not found (404).
 * Throws on other network failures.
 */
export async function fetchPokemonDetails(
  idOrName: string | number
): Promise<PokemonFullDetails | null> {
  const key = cacheKey(`details_${String(idOrName).toLowerCase()}`);
  const cached = readCache<PokemonFullDetails>(key);
  if (cached) return cached;

  // 1. Base Pokémon data
   const res = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to fetch details for ${idOrName} (HTTP ${res.status})`);
  const pokemonData: RawPokemonResponse = await res.json();

  const base = extractBase(pokemonData);

  const stats: PokemonStat[] = pokemonData.stats.map((s) => ({
    name: s.stat.name,
    value: s.base_stat,
  }));

  const abilities: PokemonAbility[] = pokemonData.abilities.map((a) => ({
    name: a.ability.name,
    isHidden: a.is_hidden,
  }));

  const cryUrl = pokemonData.cries?.latest ?? pokemonData.cries?.legacy ?? null;

  const moves: PokemonMove[] = pokemonData.moves
    .filter((m) => m.version_group_details?.[0]?.move_learn_method?.name === "level-up")
    .map((m) => ({
      name: m.move.name.replace("-", " "),
      level: m.version_group_details[0].level_learned_at,
    }))
    .sort((a, b) => a.level - b.level)
    .slice(0, 15);

  // 2. Species data — description, capture rate, evolution chain URL
  let description = "No description available.";
  let evolutionTree: EvolutionTreeData = { nodes: [], edges: [] };
  let captureRate = 45;

  if (pokemonData.species?.url) {
    const speciesRes = await fetch(pokemonData.species.url);
    if (speciesRes.ok) {
      const speciesData: RawSpeciesResponse = await speciesRes.json();
      captureRate = speciesData.capture_rate ?? 45;

      const engEntry = speciesData.flavor_text_entries.find(
        (entry) => entry.language.name === "en"
      );
      if (engEntry) {
        description = engEntry.flavor_text.replace(/[\n\f]/g, " ");
      }

      // 3. Evolution chain
      if (speciesData.evolution_chain?.url) {
        const evoRes = await fetch(speciesData.evolution_chain.url);
        if (evoRes.ok) {
          const evoData: RawEvolutionChainResponse = await evoRes.json();
          evolutionTree = parseEvolutionTree(evoData.chain);
        }
      }
    }
  }

  const result: PokemonFullDetails = {
    ...base,
    height: pokemonData.height / 10,
    weight: pokemonData.weight / 10,
    stats,
    abilities,
    cryUrl,
    description,
    evolutionTree,
    moves,
    captureRate,
  };

  writeCache(key, result);
  return result;
}

/**
 * Fetches a lightweight list (id + name + artwork only) for overlays
 * like Soundboard and Who's That Pokémon.
 * Cached in localStorage for 24 h.
 */
export async function fetchBasicPokemonList(limit = 151, offset = 0): Promise<PokemonBase[]> {
  const key = cacheKey(`basic_${limit}_${offset}`);
  const cached = readCache<PokemonBase[]>(key);
  if (cached) return cached;

  const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
  if (!res.ok) throw new Error(`Failed to fetch basic Pokémon list (HTTP ${res.status})`);
  const data: RawPokemonListResponse = await res.json();

  const list: PokemonBase[] = data.results.map((p) => {
    const id = extractIdFromUrl(p.url);
    return {
      id,
      name: p.name,
      types: [],
      image: getOfficialArtwork(id),
      shinyImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
    };
  });

  writeCache(key, list);
  return list;
}

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
  captureRate: number; // Base species capture rate (3-255)
}

const BASE_URL = "https://pokeapi.co/api/v2";

export function extractIdFromUrl(url: string): number {
  const parts = url.split("/").filter(Boolean);
  return parseInt(parts[parts.length - 1], 10);
}

export function getOfficialArtwork(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

// Fetch a list of Pokemon basic info in a paginated way
export async function fetchPokemonList(limit = 20, offset = 0): Promise<PokemonBase[]> {
  try {
    const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch Pokémon list");
    const data = await res.json();

    const detailsPromises = data.results.map(async (p: any) => {
      const detailRes = await fetch(p.url);
      if (!detailRes.ok) return null;
      const detailData = await detailRes.json();
      return {
        id: detailData.id,
        name: detailData.name,
        types: detailData.types.map((t: any) => t.type.name),
        image: detailData.sprites.other["official-artwork"].front_default || detailData.sprites.front_default || "",
        shinyImage: detailData.sprites.other["official-artwork"].front_shiny || detailData.sprites.front_shiny || "",
      } as PokemonBase;
    });

    const results = await Promise.all(detailsPromises);
    return results.filter((p): p is PokemonBase => p !== null);
  } catch (error) {
    console.error("Error in fetchPokemonList:", error);
    return [];
  }
}

// Traverse evolution chain and construct full node/edge branching tree
function parseEvolutionTree(chain: any): EvolutionTreeData {
  const nodes: EvolutionNode[] = [];
  const edges: EvolutionEdge[] = [];
  const addedIds = new Set<number>();

  function traverse(node: any, stage: number) {
    if (!node) return;
    const id = extractIdFromUrl(node.species.url);
    
    if (!addedIds.has(id)) {
      nodes.push({
        id,
        name: node.species.name,
        image: getOfficialArtwork(id),
        stage,
      });
      addedIds.add(id);
    }

    if (node.evolves_to && node.evolves_to.length > 0) {
      node.evolves_to.forEach((child: any) => {
        const childId = extractIdFromUrl(child.species.url);
        const details = child.evolution_details?.[0];
        
        edges.push({
          fromId: id,
          toId: childId,
          minLevel: details?.min_level || undefined,
          trigger: details?.trigger?.name || undefined,
          item: details?.item?.name || undefined,
        });

        traverse(child, stage + 1);
      });
    }
  }

  traverse(chain, 0);
  return { nodes, edges };
}

// Fetch full details of a specific Pokemon, including species details and evolution chain
export async function fetchPokemonDetails(idOrName: string | number): Promise<PokemonFullDetails | null> {
  try {
    // 1. Fetch base pokemon data
    const res = await fetch(`${BASE_URL}/pokemon/${idOrName}`);
    if (!res.ok) throw new Error(`Failed to fetch details for ${idOrName}`);
    const pokemonData = await res.json();

    const id = pokemonData.id;
    const name = pokemonData.name;
    const types = pokemonData.types.map((t: any) => t.type.name);
    const image = pokemonData.sprites.other["official-artwork"].front_default || pokemonData.sprites.front_default || "";
    const shinyImage = pokemonData.sprites.other["official-artwork"].front_shiny || pokemonData.sprites.front_shiny || "";

    const stats: PokemonStat[] = pokemonData.stats.map((s: any) => ({
      name: s.stat.name,
      value: s.base_stat,
    }));

    const abilities: PokemonAbility[] = pokemonData.abilities.map((a: any) => ({
      name: a.ability.name,
      isHidden: a.is_hidden,
    }));

    const cryUrl = pokemonData.cries?.latest || pokemonData.cries?.legacy || null;

    const moves: PokemonMove[] = pokemonData.moves
      .filter((m: any) => {
        const detail = m.version_group_details?.[0];
        return detail?.move_learn_method?.name === "level-up";
      })
      .map((m: any) => ({
        name: m.move.name.replace("-", " "),
        level: m.version_group_details[0].level_learned_at,
      }))
      .sort((a: any, b: any) => a.level - b.level)
      .slice(0, 15);

    // 2. Fetch species details for description, capture rate, and evolution chain url
    let description = "No description available.";
    let evolutionTree: EvolutionTreeData = { nodes: [], edges: [] };
    let captureRate = 45; // standard fallback

    if (pokemonData.species?.url) {
      const speciesRes = await fetch(pokemonData.species.url);
      if (speciesRes.ok) {
        const speciesData = await speciesRes.json();
        
        captureRate = speciesData.capture_rate ?? 45;

        const engEntry = speciesData.flavor_text_entries.find(
          (entry: any) => entry.language.name === "en"
        );
        if (engEntry) {
          description = engEntry.flavor_text.replace(/[\n\f]/g, " ");
        }

        if (speciesData.evolution_chain?.url) {
          const evoRes = await fetch(speciesData.evolution_chain.url);
          if (evoRes.ok) {
            const evoData = await evoRes.json();
            evolutionTree = parseEvolutionTree(evoData.chain);
          }
        }
      }
    }

    return {
      id,
      name,
      types,
      image,
      shinyImage,
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
  } catch (error) {
    console.error("Error in fetchPokemonDetails:", error);
    return null;
  }
}

// Fetch a basic list of Pokemon details for overlays (Soundboard/Minigame) in a single request
export async function fetchBasicPokemonList(limit = 151, offset = 0): Promise<PokemonBase[]> {
  try {
    const res = await fetch(`${BASE_URL}/pokemon?limit=${limit}&offset=${offset}`);
    if (!res.ok) throw new Error("Failed to fetch basic Pokemon list");
    const data = await res.json();
    
    return data.results.map((p: any) => {
      const id = extractIdFromUrl(p.url);
      return {
        id,
        name: p.name,
        types: [],
        image: getOfficialArtwork(id),
        shinyImage: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${id}.png`,
      } as PokemonBase;
    });
  } catch (error) {
    console.error("Error in fetchBasicPokemonList:", error);
    return [];
  }
}

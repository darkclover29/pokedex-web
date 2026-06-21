const typeRelations: Record<string, Record<string, number>> = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: { fire: 0.5, water: 0.5, grass: 2, ice: 2, bug: 2, rock: 0.5, dragon: 0.5, steel: 2 },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: { fire: 0.5, water: 2, grass: 0.5, poison: 0.5, ground: 2, flying: 0.5, bug: 0.5, rock: 2, dragon: 0.5, steel: 0.5 },
  ice: { fire: 0.5, water: 0.5, grass: 2, ice: 0.5, ground: 2, flying: 2, dragon: 2, steel: 0.5 },
  fighting: { normal: 2, ice: 2, poison: 0.5, flying: 0.5, psychic: 0.5, bug: 0.5, rock: 2, ghost: 0, dark: 2, steel: 2, fairy: 0.5 },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: { fire: 0.5, grass: 2, fighting: 0.5, poison: 0.5, flying: 0.5, psychic: 2, ghost: 0.5, dark: 2, steel: 0.5, fairy: 0.5 },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: { fire: 0.5, water: 0.5, electric: 0.5, ice: 2, rock: 2, steel: 0.5, fairy: 2 },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const ALL_TYPES = Object.keys(typeRelations);

export interface TypeMatchups {
  weaknesses: { type: string; multiplier: number }[];
  resistances: { type: string; multiplier: number }[];
  immunities: string[];
}

export function calculateTypeMatchups(types: string[]): TypeMatchups {
  const weaknesses: { type: string; multiplier: number }[] = [];
  const resistances: { type: string; multiplier: number }[] = [];
  const immunities: string[] = [];

  for (const attackingType of ALL_TYPES) {
    let multiplier = 1.0;

    for (const defendingType of types) {
      if (typeRelations[attackingType] && defendingType in typeRelations[attackingType]) {
        multiplier *= typeRelations[attackingType][defendingType];
      }
    }

    if (multiplier > 1.0) {
      weaknesses.push({ type: attackingType, multiplier });
    } else if (multiplier === 0) {
      immunities.push(attackingType);
    } else if (multiplier < 1.0) {
      resistances.push({ type: attackingType, multiplier });
    }
  }

  // Sort by multiplier descending for weaknesses (4x first, then 2x)
  weaknesses.sort((a, b) => b.multiplier - a.multiplier);
  // Sort by multiplier ascending for resistances (0.25x first, then 0.5x)
  resistances.sort((a, b) => a.multiplier - b.multiplier);

  return { weaknesses, resistances, immunities };
}

export function getAttackMultiplier(moveType: string, defenderTypes: string[]): number {
  let multiplier = 1.0;
  const lowercaseMove = moveType.toLowerCase();
  for (const defType of defenderTypes) {
    const lowercaseDef = defType.toLowerCase();
    if (typeRelations[lowercaseMove] && lowercaseDef in typeRelations[lowercaseMove]) {
      multiplier *= typeRelations[lowercaseMove][lowercaseDef];
    }
  }
  return multiplier;
}


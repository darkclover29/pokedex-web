export interface MegaForm {
  name: string;
  types: string[];
  image: string;
}

export const MEGA_EVOLUTIONS: Record<number, MegaForm[]> = {
  3: [ // Venusaur
    {
      name: "Mega Venusaur",
      types: ["grass", "poison"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10033.png"
    }
  ],
  6: [ // Charizard
    {
      name: "Mega Charizard X",
      types: ["fire", "dragon"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10034.png"
    },
    {
      name: "Mega Charizard Y",
      types: ["fire", "flying"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10035.png"
    }
  ],
  9: [ // Blastoise
    {
      name: "Mega Blastoise",
      types: ["water"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10036.png"
    }
  ],
  15: [ // Beedrill
    {
      name: "Mega Beedrill",
      types: ["bug", "poison"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10090.png"
    }
  ],
  18: [ // Pidgeot
    {
      name: "Mega Pidgeot",
      types: ["normal", "flying"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10091.png"
    }
  ],
  65: [ // Alakazam
    {
      name: "Mega Alakazam",
      types: ["psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10037.png"
    }
  ],
  80: [ // Slowbro
    {
      name: "Mega Slowbro",
      types: ["water", "psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10071.png"
    }
  ],
  94: [ // Gengar
    {
      name: "Mega Gengar",
      types: ["ghost", "poison"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10038.png"
    }
  ],
  115: [ // Kangaskhan
    {
      name: "Mega Kangaskhan",
      types: ["normal"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10039.png"
    }
  ],
  127: [ // Pinsir
    {
      name: "Mega Pinsir",
      types: ["bug", "flying"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10072.png"
    }
  ],
  130: [ // Gyarados
    {
      name: "Mega Gyarados",
      types: ["water", "dark"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10041.png"
    }
  ],
  142: [ // Aerodactyl
    {
      name: "Mega Aerodactyl",
      types: ["rock", "flying"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10042.png"
    }
  ],
  150: [ // Mewtwo
    {
      name: "Mega Mewtwo X",
      types: ["psychic", "fighting"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10043.png"
    },
    {
      name: "Mega Mewtwo Y",
      types: ["psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10044.png"
    }
  ],
  181: [ // Ampharos
    {
      name: "Mega Ampharos",
      types: ["electric", "dragon"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10045.png"
    }
  ],
  208: [ // Steelix
    {
      name: "Mega Steelix",
      types: ["steel", "ground"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10081.png"
    }
  ],
  212: [ // Scizor
    {
      name: "Mega Scizor",
      types: ["bug", "steel"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10046.png"
    }
  ],
  214: [ // Heracross
    {
      name: "Mega Heracross",
      types: ["bug", "fighting"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10074.png"
    }
  ],
  229: [ // Houndoom
    {
      name: "Mega Houndoom",
      types: ["dark", "fire"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10075.png"
    }
  ],
  248: [ // Tyranitar
    {
      name: "Mega Tyranitar",
      types: ["rock", "dark"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10047.png"
    }
  ],
  254: [ // Sceptile
    {
      name: "Mega Sceptile",
      types: ["grass", "dragon"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10076.png"
    }
  ],
  257: [ // Blaziken
    {
      name: "Mega Blaziken",
      types: ["fire", "fighting"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10050.png"
    }
  ],
  260: [ // Swampert
    {
      name: "Mega Swampert",
      types: ["water", "ground"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10077.png"
    }
  ],
  282: [ // Gardevoir
    {
      name: "Mega Gardevoir",
      types: ["psychic", "fairy"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10051.png"
    }
  ],
  302: [ // Sableye
    {
      name: "Mega Sableye",
      types: ["dark", "ghost"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10082.png"
    }
  ],
  303: [ // Mawile
    {
      name: "Mega Mawile",
      types: ["steel", "fairy"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10052.png"
    }
  ],
  306: [ // Aggron
    {
      name: "Mega Aggron",
      types: ["steel"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10053.png"
    }
  ],
  308: [ // Medicham
    {
      name: "Mega Medicham",
      types: ["fighting", "psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10054.png"
    }
  ],
  310: [ // Manectric
    {
      name: "Mega Manectric",
      types: ["electric"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10055.png"
    }
  ],
  319: [ // Sharpedo
    {
      name: "Mega Sharpedo",
      types: ["water", "dark"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10070.png"
    }
  ],
  323: [ // Camerupt
    {
      name: "Mega Camerupt",
      types: ["fire", "ground"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10083.png"
    }
  ],
  334: [ // Altaria
    {
      name: "Mega Altaria",
      types: ["dragon", "fairy"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10084.png"
    }
  ],
  354: [ // Banette
    {
      name: "Mega Banette",
      types: ["ghost"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10085.png"
    }
  ],
  359: [ // Absol
    {
      name: "Mega Absol",
      types: ["dark"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10057.png"
    }
  ],
  362: [ // Glalie
    {
      name: "Mega Glalie",
      types: ["ice"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10086.png"
    }
  ],
  373: [ // Salamence
    {
      name: "Mega Salamence",
      types: ["dragon", "flying"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10087.png"
    }
  ],
  376: [ // Metagross
    {
      name: "Mega Metagross",
      types: ["steel", "psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10088.png"
    }
  ],
  380: [ // Latias
    {
      name: "Mega Latias",
      types: ["dragon", "psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10089.png"
    }
  ],
  381: [ // Latios
    {
      name: "Mega Latios",
      types: ["dragon", "psychic"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10090.png"
    }
  ],
  384: [ // Rayquaza
    {
      name: "Mega Rayquaza",
      types: ["dragon", "flying"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10092.png"
    }
  ],
  428: [ // Lopunny
    {
      name: "Mega Lopunny",
      types: ["normal", "fighting"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10093.png"
    }
  ],
  445: [ // Garchomp
    {
      name: "Mega Garchomp",
      types: ["dragon", "ground"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10058.png"
    }
  ],
  448: [ // Lucario
    {
      name: "Mega Lucario",
      types: ["steel", "fighting"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10059.png"
    }
  ],
  460: [ // Abomasnow
    {
      name: "Mega Abomasnow",
      types: ["grass", "ice"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10060.png"
    }
  ],
  475: [ // Gallade
    {
      name: "Mega Gallade",
      types: ["psychic", "fighting"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10094.png"
    }
  ],
  531: [ // Audino
    {
      name: "Mega Audino",
      types: ["normal", "fairy"],
      image: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/10095.png"
    }
  ]
};

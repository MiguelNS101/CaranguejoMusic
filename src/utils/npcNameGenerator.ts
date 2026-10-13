/**
 * Random NPC Name Generator for CaranguejoRPG
 * 
 * Supports themes:
 * - fantasy: Medieval Fantasy (Elves, Dwarves, Humans, Halflings, Orcs, Dragons)
 * - scifi: Science Fiction, Space Opera, Cybernetic & Android Designations
 * - modern: Contemporary / Investigative / Noir (Realistic & Crime / Detectives)
 * - gothic: World of Darkness / Gothic Horror / Vampires / Werewolves / Occultists
 * - cyberpunk: High-Tech Low-Life, Netrunners, Street Samurai, Corporate Agents
 * - tavern: Commoners, Barkeeps, Sailors, Pirates, Rogues & Folk Nicknames
 */

export type NpcTheme = 'fantasy' | 'scifi' | 'modern' | 'gothic' | 'cyberpunk' | 'tavern';
export type NpcGender = 'any' | 'male' | 'female' | 'neutral';

export interface GeneratedNpcName {
  id: string;
  firstName: string;
  lastName: string;
  title?: string;
  fullName: string;
  fullWithTitle: string;
  theme: NpcTheme;
  themeLabel: string;
  gender: NpcGender;
}

export const NPC_THEMES: Array<{ id: NpcTheme; label: string; icon: string; description: string }> = [
  { id: 'fantasy', label: 'Fantasia Medieval', icon: '⚔️', description: 'Elfos, Anões, Nobres, Magos e Heróis de Espada e Feitiçaria' },
  { id: 'scifi', label: 'Sci-Fi / Espacial', icon: '🚀', description: 'Pilotos estelares, ciborgues, cientistas quânticos e androides' },
  { id: 'modern', label: 'Moderno / Investigação', icon: '🕵️', description: 'Detetives, agentes, peritos, civis e magnatas contemporâneos' },
  { id: 'gothic', label: 'Mundo das Trevas / Gótico', icon: '🩸', description: 'Vampiros, nobres vitorianos, licantropos e ocultistas' },
  { id: 'cyberpunk', label: 'Cyberpunk & Alta Tecnologia', icon: '⚡', description: 'Netrunners, mercenários urbanos, fixers e executivos de megacorporações' },
  { id: 'tavern', label: 'Taverna & Plebeus', icon: '🍺', description: 'Taverneiros, marinheiros, ladrões de rua e camponeses' }
];

// Names Database
const NAMES_DATA: Record<NpcTheme, {
  maleFirst: string[];
  femaleFirst: string[];
  neutralFirst: string[];
  lastNames: string[];
  titles: string[];
}> = {
  fantasy: {
    maleFirst: [
      'Althor', 'Cassian', 'Darian', 'Eldrin', 'Faelan', 'Garrick', 'Kaelen', 'Lorien', 'Merek',
      'Orion', 'Ragnor', 'Sylas', 'Thalor', 'Valen', 'Zephyrus', 'Baelor', 'Doran', 'Fintan',
      'Galen', 'Gwydion', 'Harek', 'Jorund', 'Kael', 'Leofric', 'Maelor', 'Osric', 'Rathgar',
      'Torin', 'Ulric', 'Vaelin', 'Wulfric', 'Yorick', 'Zarek', 'Brom', 'Durin', 'Thrain'
    ],
    femaleFirst: [
      'Althea', 'Breena', 'Celeste', 'Dahlia', 'Elowen', 'Faelina', 'Gwendolyn', 'Isolde', 'Lyra',
      'Morrigan', 'Nyx', 'Ophelia', 'Rowan', 'Seraphina', 'Thalia', 'Valeria', 'Yvaine', 'Aeloria',
      'Briar', 'Callista', 'Elysia', 'Kaelia', 'Linnea', 'Mireille', 'Rhiannon', 'Sylphira',
      'Vespera', 'Wynne', 'Zephyra', 'Astrid', 'Freya', 'Sigrid', 'Morwen', 'Elara'
    ],
    neutralFirst: [
      'Rowan', 'Vesper', 'Ash', 'Briar', 'Corin', 'Kael', 'Morgan', 'Raven', 'Sage', 'Silver',
      'Storm', 'Vale', 'Winter', 'Bramble', 'Fable', 'Gale', 'Lark', 'Phaedra', 'Rune', 'Sol'
    ],
    lastNames: [
      'Coração-de-Aço', 'Chama-Eterna', 'Lâmina-da-Lua', 'Corvo-Negro', 'Vento-do-Norte', 'Passo-Silencioso',
      'Lança-Brilhante', 'Martelo-de-Ferro', 'Guarda-da-Noite', 'Valente', 'Sombra-da-Mata', 'Sol-Poente',
      'Blackwood', 'Silverleaf', 'Stormcaller', 'Fireforge', 'Starfall', 'Ironfoot', 'Winterfell',
      'Oakenshield', 'Crowfeather', 'Shadowbane', 'Brightwater', 'Stonehaven', 'Dragoncrest'
    ],
    titles: [
      'o Arcano', 'o Andarilho', 'a Caçadora de Sombras', 'o Guardião da Cripta', 'a Feiticeira Branca',
      'o Paladino Caído', 'a Lâmina da Aurora', 'o Alquimista Real', 'o Escudeiro Fiel', 'a Senhora das Feras',
      'o Bardo Errante', 'o Último Dragoneiro', 'a Vidente Cega', 'o Inquisidor Implacável', 'o Rastreador dos Ermos'
    ]
  },

  scifi: {
    maleFirst: [
      'Jax', 'Orion', 'Kaelen', 'Dax', 'Zephyr', 'Nova', 'Xander', 'Tarek', 'Corvus', 'Vance',
      'Cyrus', 'Malik', 'Zane', 'Soren', 'Dante', 'Ryker', 'Cassian', 'Felix', 'Jethro', 'Nico',
      'Atlas', 'Castor', 'Deckard', 'Jonas', 'Kenji', 'Leon', 'Ronan', 'Stellan', 'Vaughn'
    ],
    femaleFirst: [
      'Lyra', 'Vesper', 'Nyx', 'Astra', 'Sloane', 'Elena', 'Kira', 'Zara', 'Talia', 'Maya',
      'Selene', 'Veda', 'Kallisto', 'Rhea', 'Elora', 'Kaia', 'Sora', 'Nova', 'Cora', 'Lyris',
      'Andromeda', 'Cassiopeia', 'Electra', 'Io', 'Mirai', 'Sari', 'Thora', 'Yuki'
    ],
    neutralFirst: [
      'Cipher', 'Echo', 'Vector', 'Pixel', 'Helix', 'Quantum', 'Nexus', 'Apex', 'Zero', 'Flux',
      'Specter', 'Vortex', 'Grid', 'Synapse', 'Volt', 'Byte', 'Sol', 'Strobe', 'Zenith'
    ],
    lastNames: [
      'Vance', 'Sterling', 'Chen', 'Novak', 'Thorne', 'Takeda', 'Al-Mansoor', 'Kowalski', 'Petrov',
      'Vector', 'Solari', 'Cross', 'Morrow', 'Nakamura', 'Mercer', 'Vane', 'Ashford', 'Hawthorne',
      'Proxima', 'Hyperion', 'Kepler', 'Cortex', 'Chronos', 'Aero', 'Starlight'
    ],
    titles: [
      'Piloto de Salto Quântico', 'Engenheiro de Propulsão', 'Oficial de Comunicações', 'Mercenário Estelar',
      'Oficial Tático MK-VII', 'Hacker do Vácuo', 'Cientista de Astrobiologia', 'Comandante de Esquadra',
      'Sintético Rebelde', 'Operador de Drones', 'Contrabandista do Hiperespaço', 'Médico de Bordo'
    ]
  },

  modern: {
    maleFirst: [
      'Carlos', 'Gabriel', 'Lucas', 'Rodrigo', 'Arthur', 'Felipe', 'Mateus', 'Rafael', 'Diego',
      'Bruno', 'Thiago', 'Marcus', 'Victor', 'Renato', 'Samuel', 'James', 'Michael', 'David',
      'Daniel', 'Thomas', 'Ethan', 'Oliver', 'Henry', 'Sebastian', 'Alexander', 'Julian'
    ],
    femaleFirst: [
      'Beatriz', 'Camila', 'Mariana', 'Larissa', 'Helena', 'Juliana', 'Renata', 'Sofia', 'Carolina',
      'Isabela', 'Natália', 'Valentina', 'Amanda', 'Letícia', 'Alice', 'Emma', 'Clara', 'Sarah',
      'Hannah', 'Chloe', 'Mia', 'Victoria', 'Grace', 'Zoe', 'Sophia', 'Evelyn'
    ],
    neutralFirst: [
      'Alex', 'Jordan', 'Taylor', 'Sam', 'Robin', 'Chris', 'Morgan', 'Casey', 'Jesse', 'Riley',
      'Cameron', 'Avery', 'Jamie', 'Rowan', 'Quinn', 'Harper', 'Eden', 'Sky'
    ],
    lastNames: [
      'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves', 'Pereira', 'Lima',
      'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho', 'Almeida', 'Mendes', 'Vieira', 'Barbosa',
      'Black', 'Miller', 'Watson', 'Bennett', 'Cooper', 'Sullivan', 'Hastings', 'Davenport'
    ],
    titles: [
      'Detetive Particular', 'Perito Criminal', 'Delegado da Civil', 'Jornalista Investigativo',
      'Advogado de Defesa', 'Promotor de Justiça', 'Médico Legista', 'Agente Secreto',
      'Investigador de Homicídios', 'Magnata da Tecnologia', 'Psicólogo Forense', 'Hacker White-Hat'
    ]
  },

  gothic: {
    maleFirst: [
      'Vladislav', 'Damien', 'Lucian', 'Victor', 'Balthazar', 'Alistair', 'Roderick', 'Moritz',
      'Cassius', 'Dorian', 'Valentin', 'Nathaniel', 'Maximilian', 'Gideon', 'Sebastian', 'Ignatius',
      'Silas', 'Thaddeus', 'Ambrose', 'Dante', 'Gabriel', 'Konrad', 'Malachi', 'Nikolai'
    ],
    femaleFirst: [
      'Carmilla', 'Selene', 'Cassandra', 'Morwenna', 'Vivienne', 'Cordelia', 'Eleonora', 'Lilith',
      'Ophelia', 'Lenore', 'Seraphina', 'Evelina', 'Genevieve', 'Rowena', 'Beatrix', 'Mina',
      'Helena', 'Isolda', 'Verona', 'Clarissa', 'Morgana', 'Astrid', 'Vespera'
    ],
    neutralFirst: [
      'Raven', 'Shade', 'Obsidian', 'Cinder', 'Ghost', 'Nocturne', 'Onyx', 'Salem', 'Sorrow',
      'Winter', 'Ash', 'Gloom', 'Hallow', 'Eclipse', 'Requiem'
    ],
    lastNames: [
      'Von Carstein', 'Van Helsing', 'Ravenscroft', 'De Winter', 'Montclaire', 'Blackwood', 'Von Draken',
      'Sombra-da-Lua', 'Valois', 'Carmine', 'Sangue-Nobre', 'Nocturna', 'Holloway', 'Pendleton',
      'Vanderbilt', 'Du Maurier', 'Baudelaire', 'Le Fanu', 'Crowley', 'Mortensen'
    ],
    titles: [
      'Ancião do Conselho Ventrue', 'Carrasco do Clã Tremere', 'Guardião da Matilha', 'Ocultista da Ordem Hermética',
      'Lorde da Noite Eterna', 'Inquisidor da Sociedade Secreta', 'Herdeiro da Família Amaldiçoada',
      'Coveiro da Cidade Baixa', 'Médico da Peste', 'Médium Espiritualista', 'Senhor das Sombras'
    ]
  },

  cyberpunk: {
    maleFirst: [
      'Crash', 'Razor', 'Neon', 'Echo', 'Dex', 'Kuro', 'Zero', 'Spike', 'Jinx', 'Byte',
      'Chrome', 'Vibe', 'Reno', 'Riku', 'Jax', 'Cipher', 'Blitz', 'Cable', 'Drift', 'Ghost'
    ],
    femaleFirst: [
      'Nyx', 'Pixel', 'Siren', 'Glitch', 'Nova', 'Viper', 'Raven', 'Kira', 'Rogue', 'Trinity',
      'Pulse', 'Mirage', 'Faye', 'Astra', 'Roxy', 'Bliss', 'Karma', 'Slick', 'Vex', 'Zero'
    ],
    neutralFirst: [
      'Glitch', 'Cipher', 'Byte', 'Proxy', 'Static', 'Shade', 'Vector', 'Echo', 'Patch', 'Rivet',
      'Wire', 'Matrix', 'Neon', 'Ghost', 'Zero', 'Flux', 'Syn'
    ],
    lastNames: [
      'Arasaka', 'Militech', 'Biotechnica', 'Kang Tao', 'Silverhand', 'Corvo', 'Kowloon', 'Tanaka',
      'Kuroda', 'Vance', 'Crosswire', 'Sub-Zero', 'Netrunner', 'Overdrive', 'Blackout', 'Datastream'
    ],
    titles: [
      'Netrunner Solo', 'Street Samurai', 'Fixer do Subsolo', 'Ripperdoc Clandestino', 'Corpo-Executivo',
      'Corredor de Dados', 'Piloto de Hovercar', 'Mercenário Cibernético', 'Líder de Gangue Urbana',
      'Engenheiro de Implantes', 'Especialista em Intrusão ICE'
    ]
  },

  tavern: {
    maleFirst: [
      'Barnabé', 'Tobias', 'Pip', 'Zeca', 'Gregório', 'Chico', 'Tonho', 'Manoel', 'Bastião',
      'Gaspar', 'Nicanor', 'Damião', 'Geraldo', 'Olavo', 'Simão', 'Bartolomeu', 'Fidélis', 'Quirino'
    ],
    femaleFirst: [
      'Berta', 'Marta', 'Dorotéia', 'Zulmira', 'Maricota', 'Filomena', 'Clotilde', 'Mariquinha',
      'Benedita', 'Eulália', 'Luzia', 'Catarina', 'Gertrudes', 'Alzira', 'Severina', 'Adelaide'
    ],
    neutralFirst: [
      'Pip', 'Marreco', 'Faísca', 'Pingo', 'Toco', 'Siri', 'Caranguejo', 'Cascudo', 'Pequeno', 'Gordo'
    ],
    lastNames: [
      'do Barril Furado', 'Perna-de-Pau', 'Olho-Torto', 'Barba-Rala', 'Dente-de-Ouro', 'Cerveja-Forte',
      'Mão-Leve', 'Manolho', 'Nariz-de-Batata', 'Pão-Duro', 'Pé-de-Pano', 'Quebra-Canela', 'Siri-Bravo'
    ],
    titles: [
      'Taverneiro Chefe', 'Cozinheiro Suspeito', 'Marinheiro Aposentado', 'Ladrão de Galinhas',
      'Bêbado Tagarela', 'Menestrel de Esquina', 'Vendedor de Peixes', 'Ferreiro do Vilarejo',
      'Contrabandista de Cachaça', 'Contador de Histórias Falaciosas'
    ]
  }
};

/**
 * Random helper
 */
function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Generates an NPC name based on theme, gender, and options.
 */
export function generateNpcName(options?: {
  theme?: NpcTheme;
  gender?: NpcGender;
  includeTitle?: boolean;
}): GeneratedNpcName {
  const theme = options?.theme || 'fantasy';
  const gender = options?.gender || 'any';
  const includeTitle = options?.includeTitle ?? (Math.random() > 0.4); // 60% chance of title if not specified

  const dataset = NAMES_DATA[theme] || NAMES_DATA.fantasy;

  // Select first name based on gender
  let firstNamePool: string[] = [];
  let effectiveGender = gender;

  if (gender === 'male') {
    firstNamePool = dataset.maleFirst;
  } else if (gender === 'female') {
    firstNamePool = dataset.femaleFirst;
  } else if (gender === 'neutral') {
    firstNamePool = dataset.neutralFirst;
  } else {
    // 'any'
    const roll = Math.random();
    if (roll < 0.45) {
      firstNamePool = dataset.maleFirst;
      effectiveGender = 'male';
    } else if (roll < 0.90) {
      firstNamePool = dataset.femaleFirst;
      effectiveGender = 'female';
    } else {
      firstNamePool = dataset.neutralFirst;
      effectiveGender = 'neutral';
    }
  }

  const firstName = pickRandom(firstNamePool);
  const lastName = pickRandom(dataset.lastNames);
  const title = includeTitle ? pickRandom(dataset.titles) : undefined;

  const fullName = `${firstName} ${lastName}`;
  const fullWithTitle = title ? `${fullName}, ${title}` : fullName;

  const themeMeta = NPC_THEMES.find(t => t.id === theme) || NPC_THEMES[0];

  return {
    id: `name-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    firstName,
    lastName,
    title,
    fullName,
    fullWithTitle,
    theme,
    themeLabel: themeMeta.label,
    gender: effectiveGender
  };
}

/**
 * Generates a batch of NPC names for quick picking.
 */
export function generateNpcNameBatch(
  theme: NpcTheme = 'fantasy',
  count: number = 8,
  gender: NpcGender = 'any',
  includeTitle: boolean = true
): GeneratedNpcName[] {
  const result: GeneratedNpcName[] = [];
  for (let i = 0; i < count; i++) {
    result.push(generateNpcName({ theme, gender, includeTitle }));
  }
  return result;
}

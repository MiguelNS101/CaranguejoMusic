import React, { useState, useEffect } from 'react';
import {
  Swords,
  Dices,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Shield,
  Sparkles,
  Flame,
  Skull,
  Trees,
  Castle,
  Building2,
  Mountain,
  Compass,
  Zap,
  Users,
  AlertTriangle,
  Gift
} from 'lucide-react';
import { safeFetchJson } from '../services/api';
import { useAudio } from '../context/AudioContext';
import { getEncounterPresets, EncounterPreset } from '../utils/presetStore';

export type EnvironmentType =
  | 'floresta'
  | 'masmorra'
  | 'cidade'
  | 'caverna'
  | 'montanha'
  | 'pantano'
  | 'deserto'
  | 'costa';

export type DifficultyType = 'facil' | 'medio' | 'dificil' | 'mortal';

export interface EnemyUnit {
  name: string;
  role: string;
  count: number;
  cr: string;
  hp: string;
  ac: string;
  keyFeature: string;
}

export interface GeneratedEncounterData {
  title: string;
  environmentName: string;
  difficultyLabel: string;
  enemies: EnemyUnit[];
  tacticalObjective: string;
  environmentalHazard: string;
  quickReward: string;
}

const ENVIRONMENTS = [
  { id: 'floresta', name: 'Floresta & Selva', icon: '🌲', color: 'emerald' },
  { id: 'masmorra', name: 'Masmorra & Cripta', icon: '🏰', color: 'purple' },
  { id: 'cidade', name: 'Cidade & Beco', icon: '🏙️', color: 'amber' },
  { id: 'caverna', name: 'Caverna & Subsolo', icon: '🕳️', color: 'zinc' },
  { id: 'montanha', name: 'Montanha & Gelo', icon: '🏔️', color: 'cyan' },
  { id: 'pantano', name: 'Pântano Sombrio', icon: '🌾', color: 'lime' },
  { id: 'deserto', name: 'Deserto & Ruínas', icon: '🏜️', color: 'orange' },
  { id: 'costa', name: 'Alto Mar & Costa', icon: '⛵', color: 'blue' }
];

const ENEMY_TEMPLATES: Record<EnvironmentType, Record<string, { names: string[]; roles: string[]; features: string[] }>> = {
  floresta: {
    solo: {
      names: ['Urso-Coruja Alfa Ancestral', 'Ent Guardião Corrompido', 'Quimera Verde Venenosa', 'Espírito Fada Predatório'],
      roles: ['Predador Colossal', 'Guardião Elemental', 'Besta Alada', 'Terror Fey'],
      features: ['Rugido atordoante (CD 14 Con)', 'Garras dilacerantes que causam sangramento', 'Camuflagem fey nas folhagens']
    },
    squad: {
      names: ['Patrulha de Elfos Silvanos Renegados', 'Alcatea de Lobos do Inverno', 'Goblins Rastreadores de Armadilhas', 'Cultistas da Deusa da Caça'],
      roles: ['Atiradores de Emboscada', 'Predadores de Matilha', 'Batedores Furtivos', 'Líder de Caça'],
      features: ['Vantagem ao atacar alvos flanqueados', 'Flechas com veneno entorpecente (CD 12)', 'Movimentação sem penalidade em terreno difícil']
    },
    horde: {
      names: ['Enxame de Besouros Espinhosos', 'Bandoleiros Salteadores da Estrada', 'Goblins do Espinheiro', 'Ratos Gigantes Raivosos'],
      roles: ['Lacaios de Vanguarda', 'Assaltantes Rápidos', 'Atiradores de Zarabatana', 'Carniceiros'],
      features: ['Ataques em massa com vantagem se houver 2+ aliados adjacentes', 'Tentam derrubar jogadores ao chão']
    }
  },
  masmorra: {
    solo: {
      names: ['Cavaleiro Negro Espectral', 'Golem de Pedra Rúnica', 'Minotauro Devorador de Labirintos', 'Mímico Colossal do Trono'],
      roles: ['Guerreiro Imortal', 'Constructo Titânico', 'Bruto Devastador', 'Aberração Disfarçada'],
      features: ['Resistência a dano físico não-mágico', 'Aura necrótica que impede cura a 3m', 'Pancada que arremessa a 6 metros']
    },
    squad: {
      names: ['Guarda Esquelética de Elite', 'Cultistas do Olho Sombrio', 'Necromante e seus Acólitos', 'Drow Caçadores de Escravos'],
      roles: ['Falange com Escudos', 'Conjuradores de Maldição', 'Invocadores de Mortos', 'Guerreiros com Armas de Veneno'],
      features: ['Escudos entrelaçados (+2 CA)', 'Reanimam 1 esqueleto a cada 2 rodadas', 'Disparo de Besta com Veneno Sonífero']
    },
    horde: {
      names: ['Zumbis Arrastantes Famintos', 'Ghouls Vorazes', 'Esqueletos Arqueiros Enferrujados', 'Cobras Gigantes do Fosso'],
      roles: ['Corpos de Vanguarda', 'Mordedores Paralisantes', 'Atiradores de Ossos', 'Rastejantes'],
      features: ['Robustez zumbi (CD para não morrer com 1 PV)', 'Garra paralisante (CD 11 Con)']
    }
  },
  cidade: {
    solo: {
      names: ['Assassino Mestre da Guilda das Sombras', 'Gladiador Campeão Ilegal', 'Inquisidor Corrompido em Armadura', 'Lobisomem Disfarçado de Nobre'],
      roles: ['Carrasco Silencioso', 'Duelista Implacável', 'Juiz Fanático', 'Besta Oculta'],
      features: ['Ataque furtivo devastador (+3d6)', 'Aparar golpes com reação (+3 CA)', 'Uso de bombas de fumaça para sumir']
    },
    squad: {
      names: ['Guarda Urbana Subornada', 'Valentões do Sindicato do Crime', 'Espiões e Balestristas dos Telhados', 'Monge Mercenário e Discípulos'],
      roles: ['Capangas Armados', 'Atiradores de Telhado', 'Lutadores de Punho Fechado', 'Cobrador de Dívidas'],
      features: ['Cercam e desarmam armas dos heróis', 'Bônus de cobertura elevada nos telhados', 'Gritam por reforços a cada rodada']
    },
    horde: {
      names: ['Punguistas e Moleques de Rua', 'Plebeus Enfurecidos com Tochas', 'Cães de Briga da Milícia', 'Contrabandistas Clandestinos'],
      roles: ['Batedores de Carteira', 'Multidão Caótica', 'Cães de Ataque', 'Fugitivos'],
      features: ['Tentam roubar poções e bolsas durante o combate', 'Espalham óleo inflamável no chão']
    }
  },
  caverna: {
    solo: {
      names: ['Vorme Púrpura Jovem', 'Observador Renegado (Beholder Menor)', 'Troglodita Alfa Radioativo', 'Aranha Tecedora Gigante de Cristal'],
      roles: ['Engolidor Subterrâneo', 'Atirador de Raios Mágicos', 'Mutante Brutal', 'Tecedor Venenoso'],
      features: ['Escavação rápida pela rocha sólida', 'Gera raios de medo e lentidão', 'Teias aderentes com CD 14 para soltar']
    },
    squad: {
      names: ['Bando de Trogloditas Carniceiros', 'Caçadores Duergar Invisíveis', 'Dríades das Cavernas Fúngicas', 'Grimlocks Cegos e Ferozes'],
      roles: ['Lutadores Fétidos', 'Guerreiros Invisíveis', 'Esporos Alucinógenos', 'Predadores por Eco'],
      features: ['Fedor nauseante (CD 12 Con ou envenenado)', 'Ataques furtivos saindo da invisibilidade', 'Imunidade a escuridão mágica']
    },
    horde: {
      names: ['Morcegos Carnívoros Gigantes', 'Lagartos Fúngicos Rápidos', 'Besouros de Fogo Cavernoso', 'Cobras das Fissuras'],
      roles: ['Voadores Barulhentos', 'Mordedores Ácidos', 'Explosivos Naturais', 'Rastejantes'],
      features: ['Eco desorientador que cancela magia com concentração', 'Explodem em chamas quando morrem']
    }
  },
  montanha: {
    solo: {
      names: ['Dragão Branco Jovem', 'Yeti Alfa das Nevascas', 'Gigante do Gelo Exilado', 'Roc Guardiã dos Picos'],
      roles: ['Terror Alado Gélido', 'Predador da Nevasca', 'Titã das Rochas', 'Águia Lendária'],
      features: ['Sopro congelante em cone (dano de frio)', 'Olhar gélido paralisante', 'Arremesso de rochas a 30m de distância']
    },
    squad: {
      names: ['Orcs da Tribo do Gelo Uivante', 'Xamãs das Tempestades de Neve', 'Lobos Invernais com Presas de Gelo', 'Anões Proscritos do Cume'],
      roles: ['Bárbaros Furiosos', 'Conjuradores de Vento', 'Mordida Congelante', 'Atiradores de Balista'],
      features: ['Resistência e dano adicional por fúria', 'Rajadas de vento empurram para penhascos', 'Aura de frio congelante']
    },
    horde: {
      names: ['Goblins das Cavernas de Gelo', 'Cabras-da-Montanha Furiosas', 'Pequenos Elementais de Neve', 'Abutres das Alturas'],
      roles: ['Lançadores de Estalactites', 'Corredores de Encosta', 'Seres Glaciais', 'Mergulhadores'],
      features: ['Camuflagem perfeita na neve branca', 'Chutam pedras soltas provocando deslizamento']
    }
  },
  pantano: {
    solo: {
      names: ['Bruxa da Noite do Pântano Verde', 'Hidra Venenosa de Sete Cabeças', 'Espírito do Lodo Lamacento', 'Crocodilo Colossal Pré-Histórico'],
      roles: ['Feiticeira das Pragas', 'Besta Multicabeça', 'Elemental de Lodo', 'Predador da Água Rasa'],
      features: ['Corta 1 cabeça e nascem 2 se não usar fogo', 'Agarra e arrasta para o fundo da água turva', 'Ilusões sedutoras com CD 14']
    },
    squad: {
      names: ['Homens-Lagarto Batedores', 'Bruxas do Covil Lamacento', 'Ghouls do Cemitério Alagado', 'Mórmicos do Lodo'],
      roles: ['Guerreiros Anfíbios', 'Pragas e Maldições', 'Infectados da Podridão', 'Garras Ácidas'],
      features: ['Prendem a respiração e atacam debaixo d’água', 'Mordida infecta com febre do pântano', 'Veneno debilita a Força do alvo']
    },
    horde: {
      names: ['Sanguessugas Gigantes da Lama', 'Moscas Cadavéricas Venenosas', 'Cobras d’Água Camufladas', 'Sapos Alucinógenos'],
      roles: ['Drenadores de Sangue', 'Enxames Irritantes', 'Picadas Velozes', 'Toxinas Soníferas'],
      features: ['Reduzem PV máximo ao sugar sangue', 'Causam náusea e desvantagem em testes']
    }
  },
  deserto: {
    solo: {
      names: ['Víbora Gigante das Areias Vermelhas', 'Múmia Nobre Amaldiçoada', 'Esfinge Guardiã Enigmática', 'Espírito do Vento Cortante (Djinn)'],
      roles: ['Predador Sob a Areia', 'Morto-Vivo Amaldiçoado', 'Guardião de Testes', 'Gênio Elemental'],
      features: ['Toque causa Podridão da Múmia (cura nula)', 'Ataque surpresa emergindo da areia', 'Lança redemoinhos cegantes']
    },
    squad: {
      names: ['Saqueadores Nômades a Camelo', 'Guerreiros de Anúbis Ressuscitados', 'Escaravelhos Múmia Voadores', 'Feiticeiros do Sol Ardente'],
      roles: ['Atiradores Montados', 'Lanceiros Blindados', 'Enxame Carnívoro', 'Magos de Chamas'],
      features: ['Mobilidade extrema montada', 'Resistência a calor e sede', 'Escaravelhos perfuram armaduras']
    },
    horde: {
      names: ['Escorpiões da Areia Furtivos', 'Hienas Carniceiras Fanáticas', 'Esqueletos Nômades Secos', 'Lagartos da Duna'],
      roles: ['Ferrão Venenoso', 'Mordida em Bando', 'Espadachins Rápidos', 'Velozes'],
      features: ['Ferrão de veneno com paralisia rápida', 'Ataques vorazes em alvos feridos']
    }
  },
  costa: {
    solo: {
      names: ['Kraken Jovem dos Rochedos', 'Capitão Pirata Amaldiçoado Pela Névoa', 'Sereia Abissal Rainha do Coral', 'Tartaruga Dragão Juvenil'],
      roles: ['Terror dos Tentáculos', 'Espadachim Fantasma', 'Encantadora Hipnótica', 'Carapaça Incandescente'],
      features: ['Tentáculos agarram e puxam para a água', 'Canção hipnótica que atrai para rochas afiadas', 'Sopro de vapor superaquecido']
    },
    squad: {
      names: ['Marujos Piratas Corsários', 'Guerreiros Sahuagin de Sangue', 'Espectros de Náufragos Afogados', 'Assassinos do Porto Clandestino'],
      roles: ['Mosqueteiros & Espadachins', 'Guerreiros Tubarão', 'Fantasmas da Água Salgada', 'Ladrões de Cais'],
      features: ['Fúria de sangue (vantagem contra alvos sangrando)', 'Disparo de bacamarte a queima-roupa', 'Toque gélido reduz velocidade']
    },
    horde: {
      names: ['Caranguejos Gigantes Blindados', 'Gaivotas Raivosas da Tormenta', 'Cobras Marinhas Tóxicas', 'Enguias Elétricas'],
      roles: ['Garras de Prensagem', 'Perturbadores de Linha', 'Veneno Aquático', 'Descarga de Choque'],
      features: ['Garras com agarrão automático no acerto', 'Descarga de choque que atordoa alvos molhados']
    }
  }
};

const HAZARDS: Record<EnvironmentType, string[]> = {
  floresta: [
    'Raízes traiçoeiras e terreno difícil: requer teste de Destreza (Acrobacia) para avançar sem tropeçar.',
    'Névoa densa matinal: visibilidade máxima restrita a 9 metros (penumbra constante).',
    'Colmeia de vespas ferozes pendurada em galho acima: se atingida por fogo ou ataque em área, ataca todos próximos.',
    'Fogo florestal iniciado por faíscas: fumaça asfixiante se expande a cada rodada.'
  ],
  masmorra: [
    'Teto desmoronando com estalactites pontiagudas: impactos fortes fazem pedras caírem na área.',
    'Ladrilhos falsos com poço de estacas envenenadas (CD 13 Percepção para notar).',
    'Tochas apagadas por lufada de ar: escuridão súbita favorece quem tem visão no escuro.',
    'Gás tóxico inflamável acumulado no chão da câmara: faíscas ou fogo provocam explosão em área.'
  ],
  cidade: [
    'Rua estreita cheia de pedestres em pânico: movimento limitado e risco de atingir inocentes.',
    'Carroça de barris desgovernada descendo a ladeira na rodada 2.',
    'Telhados escorregadios pela chuva recente: teste de Acrobacia para não escorregar e cair na sarjeta.',
    'Guarda da cidade soando apito a 3 quarteirões: chegarão reforços em 4 rodadas.'
  ],
  caverna: [
    'Fissura com lava subterrânea: calor extremo causa 1d6 de dano de fogo a quem terminar o turno a 1,5m.',
    'Eco ensurdecedor: magias de comunicação e comandos verbais exigem teste de Concentração.',
    'Gotejamento de água ácida: corrói proteções e causa dano contínuo leve.',
    'Gás sonífero natural brotando de fendas: teste de Constituição CD 12 a cada rodada.'
  ],
  montanha: [
    'Ventos uivantes congelantes: ataques à distância com arco sofrem desvantagem.',
    'Borda de penhasco íngreme: empurrões bem-sucedidos arremessam o alvo a uma queda fatal de 18m.',
    'Placa de gelo liso: qualquer investida rápida exige teste de Destreza para não cair de bruços.',
    'Risco de avalanche na enchente de barulho forte ou trovão mágico.'
  ],
  pantano: [
    'Areia movediça / lamaçal profundo: criaturas médias afundam e ficam presas até passarem em teste de Atletismo.',
    'Gás dos pântanos pútrido: desvantagem em testes de resistência contra envenenamento.',
    'Água barrenta camuflada: não se sabe onde há 30cm ou 3m de profundidade.',
    'Vegetação espinhosa tóxica: causa dano de veneno ao passar correndo.'
  ],
  deserto: [
    'Tempestade de areia súbita: cega alvos sem óculos de proteção e apaga rastros.',
    'Calor escaldante do meio-dia: armaduras pesadas impõem desvantagem em testes de resistência.',
    'Duna movediça que desaba quando pisada, soterrando pernas.',
    'Espejismo mágico que distorce distâncias reais.'
  ],
  costa: [
    'Ondas violentas arrebentando nas pedras a cada 2 rodadas: empurram alvos para o mar.',
    'Deck de navio oscilante: teste de equilíbrio ao sofrer acerto crítico.',
    'Cordas e mastros balançando que podem ser usados para acrobacias ou derrubar oponentes.',
    'Névoa salina densa que corrói pólvora e dificulta disparos de armas de fogo.'
  ]
};

const MOTIVATIONS = [
  'Proteger o covil e filhotes / artefato ancestral a qualquer custo, lutando até a morte.',
  'Capturar aventureiros vivos para cobrar resgate no submundo ou sacrifício ritual.',
  'Retardar o grupo enquanto o líder foge pela rota de fuga com o pergaminho roubado.',
  'Emboscada planejada: atacar pela retaguarda, visando primeiro os conjuradores de vestes frágeis.',
  'Fome desesperada: focar no alvo mais ferido ou na montaria para arrastar para longe.',
  'Executar ordens de um lorde rival: têm um retrato desenhado de um dos membros do grupo.'
];

const REWARDS = [
  'Bolsa de veludo com 80 PO, 3 gemas de ametista e chave de ferro enferrujada.',
  'Adaga de prata gravada com o símbolo de um ducado esquecido (valor 45 PO).',
  '2x Poções de Cura Simples e mapa desenhado à mão mostrando armadilhas adiante.',
  'Pergaminho com feitiço de utilidade e anel com brasão nobre que abre uma porta secreta.',
  'Balança de mercador forjada com metal raro e 140 PO em moedas estrangeiras.',
  'Fragmento de diário detalhando fraquezas e medos do chefe da região.'
];

export const EncounterGeneratorWidget: React.FC = () => {
  const { botStatus } = useAudio();

  const [encounterPresets, setEncounterPresets] = useState<EncounterPreset[]>(() => getEncounterPresets());

  useEffect(() => {
    const handleUpdate = () => {
      setEncounterPresets(getEncounterPresets());
    };
    window.addEventListener('caranguejo_presets_updated', handleUpdate);
    return () => window.removeEventListener('caranguejo_presets_updated', handleUpdate);
  }, []);

  const [playerLevel, setPlayerLevel] = useState<number>(3);
  const [environment, setEnvironment] = useState<EnvironmentType>('floresta');
  const [enemyCountType, setEnemyCountType] = useState<'solo' | 'squad' | 'horde'>('squad');
  const [difficulty, setDifficulty] = useState<DifficultyType>('medio');

  const [currentEncounter, setCurrentEncounter] = useState<GeneratedEncounterData | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  const generateEncounter = () => {
    setIsGenerating(true);

    const envData = ENEMY_TEMPLATES[environment][enemyCountType];
    const envObj = ENVIRONMENTS.find(e => e.id === environment)!;

    // Pick random enemy names and features
    const selectedName = envData.names[Math.floor(Math.random() * envData.names.length)];
    const selectedRole = envData.roles[Math.floor(Math.random() * envData.roles.length)];
    const selectedFeature = envData.features[Math.floor(Math.random() * envData.features.length)];

    let unitCount = 1;
    let crStr = 'CR 2';
    let hpStr = '45';
    let acStr = '14';

    if (enemyCountType === 'solo') {
      unitCount = 1;
      const baseHp = Math.max(25, playerLevel * 24);
      hpStr = `${baseHp} PV`;
      acStr = `${Math.min(20, 13 + Math.floor(playerLevel / 3))} CA`;
      crStr = `CR ${Math.max(1, playerLevel + 1)}`;
    } else if (enemyCountType === 'squad') {
      unitCount = Math.floor(Math.random() * 2) + 3; // 3 to 4
      const baseHp = Math.max(15, playerLevel * 9);
      hpStr = `${baseHp} PV cada`;
      acStr = `${Math.min(17, 12 + Math.floor(playerLevel / 4))} CA`;
      crStr = `CR ${Math.max(0.5, Math.floor(playerLevel / 2))}`;
    } else {
      unitCount = Math.floor(Math.random() * 5) + 6; // 6 to 10
      const baseHp = Math.max(8, playerLevel * 4);
      hpStr = `${baseHp} PV cada`;
      acStr = `${Math.min(15, 11 + Math.floor(playerLevel / 5))} CA`;
      crStr = `CR 1/4`;
    }

    const enemiesList: EnemyUnit[] = [
      {
        name: selectedName,
        role: selectedRole,
        count: unitCount,
        cr: crStr,
        hp: hpStr,
        ac: acStr,
        keyFeature: selectedFeature
      }
    ];

    // If squad, optionally add a support/lieutenant
    if (enemyCountType === 'squad' && Math.random() > 0.4) {
      enemiesList.push({
        name: `Líder / Xamã do ${selectedName.split(' ')[0]}`,
        role: 'Líder / Suporte Conjurador',
        count: 1,
        cr: `CR ${playerLevel}`,
        hp: `${Math.round(playerLevel * 14)} PV`,
        ac: '13 CA',
        keyFeature: 'Conjura Escudo da Fé e Bênção no grupo'
      });
    }

    const hazardList = HAZARDS[environment];
    const selectedHazard = hazardList[Math.floor(Math.random() * hazardList.length)];
    const selectedMotivation = MOTIVATIONS[Math.floor(Math.random() * MOTIVATIONS.length)];
    const selectedReward = REWARDS[Math.floor(Math.random() * REWARDS.length)];

    const diffLabels: Record<DifficultyType, string> = {
      facil: 'Fácil (Exploração)',
      medio: 'Média (Desafio Balanceado)',
      dificil: 'Difícil (Tensão Alta)',
      mortal: 'Mortal (Risco de Morte)'
    };

    const titlePrefixes = ['Emboscada no', 'O Covil do', 'Encontro Inesperado no', 'Patrulha Hostil no', 'A Fúria do'];
    const title = `${titlePrefixes[Math.floor(Math.random() * titlePrefixes.length)]} ${selectedName}`;

    setTimeout(() => {
      setCurrentEncounter({
        title,
        environmentName: envObj.name,
        difficultyLabel: diffLabels[difficulty],
        enemies: enemiesList,
        tacticalObjective: selectedMotivation,
        environmentalHazard: selectedHazard,
        quickReward: selectedReward
      });
      setIsGenerating(false);
    }, 150);
  };

  const formatDiscordMessage = (enc: GeneratedEncounterData) => {
    let text = `⚔️ **ENCONTRO ALEATÓRIO DE RPG: ${enc.title}**\n`;
    text += `📍 **Ambiente:** ${enc.environmentName} | ⚖️ **Dificuldade:** ${enc.difficultyLabel} (Nv. ${playerLevel})\n\n`;
    text += `👾 **INIMIGOS & NPCs:**\n`;
    enc.enemies.forEach((e) => {
      text += `• **${e.count}x ${e.name}** (${e.role}) — ${e.hp}, ${e.ac}, ${e.cr}\n  ↳ *Habilidade:* ${e.keyFeature}\n`;
    });
    text += `\n⚠️ **PERIGO AMBIENTAL:**\n${enc.environmentalHazard}\n`;
    text += `\n🎯 **OBJETIVO / MOTIVAÇÃO DOS INIMIGOS:**\n${enc.tacticalObjective}\n`;
    text += `\n💎 **RECOMPENSA RÁPIDA / LOOT:**\n${enc.quickReward}`;
    return text;
  };

  const handleSendToDiscord = async () => {
    if (!currentEncounter) return;

    setIsSending(true);
    setFeedback({ status: 'idle' });

    try {
      const message = formatDiscordMessage(currentEncounter);
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type: 'narration'
        })
      });

      if (res.success) {
        setFeedback({ status: 'success', message: 'Encontro enviado ao chat do Discord!' });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', message: res.error || 'Falha ao enviar ao Discord.' });
        setTimeout(() => setFeedback({ status: 'idle' }), 4000);
      }
    } catch {
      setFeedback({ status: 'error', message: 'Erro de conexão ao enviar.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    if (!currentEncounter) return;
    navigator.clipboard.writeText(formatDiscordMessage(currentEncounter));
    setFeedback({ status: 'success', message: 'Copiado para a área de transferência!' });
    setTimeout(() => setFeedback({ status: 'idle' }), 3000);
  };

  return (
    <div className="w-full h-full flex flex-col space-y-3.5 text-zinc-100">
      {/* Quick Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Predefinições:
        </span>
        {encounterPresets.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => {
              const envObj = ENVIRONMENTS.find(e => e.id === preset.environment) || ENVIRONMENTS[0];
              setCurrentEncounter({
                title: preset.name,
                environmentName: envObj.name,
                difficultyLabel: preset.difficulty === 'facil' ? 'Fácil' : preset.difficulty === 'medio' ? 'Médio' : preset.difficulty === 'dificil' ? 'Difícil' : 'Mortal',
                enemies: preset.enemies,
                tacticalObjective: preset.tacticalObjective,
                environmentalHazard: preset.environmentalHazard,
                quickReward: preset.quickReward
              });
              setEnvironment(preset.environment);
              setDifficulty(preset.difficulty);
            }}
            className="px-2.5 py-1 rounded-lg bg-[#141619] border border-[#2D3139] hover:border-zinc-500 hover:text-white text-zinc-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Parameters Controls */}
      <div className="bg-[#141619] border border-[#2D3139] rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {/* Nível do Grupo */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Nível do Grupo ({playerLevel})
            </label>
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="1"
                max="20"
                value={playerLevel}
                onChange={(e) => setPlayerLevel(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span className="w-7 text-center text-xs font-mono font-bold bg-[#1A1D21] border border-[#2D3139] py-0.5 rounded text-indigo-400">
                {playerLevel}
              </span>
            </div>
          </div>

          {/* Ambiente */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Ambiente
            </label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value as EnvironmentType)}
              className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              {ENVIRONMENTS.map((env) => (
                <option key={env.id} value={env.id}>
                  {env.icon} {env.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quantidade de Inimigos */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Estrutura Inimiga
            </label>
            <select
              value={enemyCountType}
              onChange={(e) => setEnemyCountType(e.target.value as any)}
              className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="solo">👑 1 Chefe / Predador Solo</option>
              <option value="squad">👥 3-4 Patrulha / Bando</option>
              <option value="horde">💀 6-10 Horda / Lacaios</option>
            </select>
          </div>

          {/* Dificuldade */}
          <div>
            <label className="block text-[11px] font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Dificuldade
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as DifficultyType)}
              className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="facil">🟢 Fácil</option>
              <option value="medio">🟡 Médio</option>
              <option value="dificil">🟠 Difícil</option>
              <option value="mortal">🔴 Mortal</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateEncounter}
          disabled={isGenerating}
          className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
        >
          <Dices className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Rolando Parâmetros...' : 'Gerar Encontro Aleatório'}
        </button>
      </div>

      {/* Feedback Banner */}
      {feedback.status !== 'idle' && (
        <div
          className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-medium animate-fade-in ${
            feedback.status === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Encounter Output Card */}
      {currentEncounter ? (
        <div className="flex-1 bg-[#141619] border border-[#2D3139] rounded-2xl p-4 flex flex-col justify-between space-y-3.5 shadow-md">
          {/* Header */}
          <div className="border-b border-[#2D3139]/80 pb-3 flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {currentEncounter.environmentName}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {currentEncounter.difficultyLabel}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white mt-1.5 flex items-center gap-2">
                <Swords className="w-4 h-4 text-red-400 shrink-0" />
                {currentEncounter.title}
              </h3>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg bg-[#1A1D21] border border-[#2D3139] text-zinc-400 hover:text-white hover:bg-[#252830] transition-colors"
                title="Copiar Texto"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleSendToDiscord}
                disabled={isSending}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                title="Mandar Encontro no Chat do Discord"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Enviando...' : 'Mandar no Chat'}</span>
              </button>
            </div>
          </div>

          {/* Content Sections */}
          <div className="space-y-3 flex-1 overflow-y-auto pr-1">
            {/* Enemies List */}
            <div>
              <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Users className="w-3.5 h-3.5 text-indigo-400" />
                Inimigos & Estatísticas Sugeridas
              </h4>
              <div className="space-y-2">
                {currentEncounter.enemies.map((e, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-[#1A1D21] border border-[#282C34] flex flex-col gap-1 text-xs"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-400" />
                        {e.count}x {e.name}
                      </span>
                      <div className="flex items-center gap-2 text-[11px] font-mono">
                        <span className="text-red-300 font-bold">{e.hp}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-blue-300">{e.ac}</span>
                        <span className="text-zinc-500">•</span>
                        <span className="text-amber-300 font-bold">{e.cr}</span>
                      </div>
                    </div>
                    <div className="text-[11px] text-zinc-400 flex items-center justify-between gap-2">
                      <span>Papel: <strong className="text-zinc-300">{e.role}</strong></span>
                      <span className="text-zinc-400 italic">⚡ {e.keyFeature}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Environmental Hazard */}
            <div className="p-2.5 rounded-xl bg-amber-950/20 border border-amber-500/25">
              <h5 className="text-[11px] font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                Perigo / Complicação do Terreno
              </h5>
              <p className="text-xs text-amber-100/90 leading-relaxed">
                {currentEncounter.environmentalHazard}
              </p>
            </div>

            {/* Tactical Motivation */}
            <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-[#282C34]">
              <h5 className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Compass className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                Objetivo & Comportamento dos Inimigos
              </h5>
              <p className="text-xs text-zinc-300 leading-relaxed">
                {currentEncounter.tacticalObjective}
              </p>
            </div>

            {/* Quick Reward */}
            <div className="p-2.5 rounded-xl bg-emerald-950/20 border border-emerald-500/25">
              <h5 className="text-[11px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1 mb-1">
                <Gift className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                Recompensa Imediata / Espólios
              </h5>
              <p className="text-xs text-emerald-100/90 leading-relaxed">
                {currentEncounter.quickReward}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 bg-[#141619] border border-dashed border-[#2D3139] rounded-2xl p-8 flex flex-col items-center justify-center text-center text-zinc-500 min-h-[220px]">
          <Swords className="w-8 h-8 text-indigo-400/50 mb-3" />
          <h4 className="text-sm font-bold text-zinc-300">Nenhum encontro gerado ainda</h4>
          <p className="text-xs text-zinc-500 max-w-sm mt-1">
            Selecione o nível dos jogadores, o tipo de bioma e a estrutura para criar instantaneamente monstros, perigos e desafios com envio ao Discord.
          </p>
          <button
            onClick={generateEncounter}
            className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Dices className="w-4 h-4" />
            Gerar Primeiro Encontro
          </button>
        </div>
      )}
    </div>
  );
};

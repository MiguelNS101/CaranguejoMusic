/**
 * Preset Store & Management for CaranguejoRPG
 * Centralizes defaults and custom presets for:
 * - Gerador de Encontros
 * - Gerador de Loot
 * - Roleta Customizável
 * - Temporizadores & Cronômetro
 * - Bloco de Notas Multiabas
 * 
 * Includes export/import helpers and reactive storage event syncing.
 */

import { EnvironmentType, DifficultyType, EnemyUnit } from '../components/EncounterGeneratorWidget';
import { TimerType, TimerItem } from '../types';

export interface EncounterPreset {
  id: string;
  name: string;
  environment: EnvironmentType;
  difficulty: DifficultyType;
  enemies: EnemyUnit[];
  tacticalObjective: string;
  environmentalHazard: string;
  quickReward: string;
}

export interface LootItemDef {
  name: string;
  type: string;
  value: string;
  description: string;
  icon: string;
}

export interface LootTablePreset {
  id: string;
  tier: 'low' | 'medium' | 'high' | 'boss' | 'wod' | string;
  tierName: string;
  items: LootItemDef[];
}

export interface RoulettePreset {
  id: string;
  name: string;
  options: Array<{ id?: string; label: string; weight: number; color: string }>;
}

export interface TimerPreset {
  id: string;
  title: string;
  type: TimerType;
  minutes: number;
  category: TimerItem['category'];
  color: string;
  icon: string;
}

export interface NoteTabTemplate {
  id: string;
  title: string;
  emoji: string;
  defaultContent: string;
  category?: string;
}

export interface ConditionRulePreset {
  id: string;
  name: string;
  category: 'status' | 'difficulty' | 'action' | 'wod' | 'custom';
  icon: string;
  summary: string;
  description: string;
  discordFormat: string;
}

export interface WeatherAtmospherePreset {
  id: string;
  name: string;
  icon: string;
  effect: string;
  discordEmoji: string;
  timeOfDay?: 'dawn' | 'noon' | 'afternoon' | 'dusk' | 'midnight' | 'deep_night';
  lightLevel?: string;
  description?: string;
}

// =========================================================================
// DEFAULT DATA SETS
// =========================================================================

export const DEFAULT_LOOT_TABLES: LootTablePreset[] = [
  {
    id: 'loot-low',
    tier: 'low',
    tierName: 'Nível Baixo (Nv 1-4)',
    items: [
      { name: 'Bolsa de Moedas de Prata', type: 'Moedas', value: '35 PP / 12 PO', description: 'Moedas gastas com inscrições do antigo reino.', icon: '💰' },
      { name: 'Poção de Cura Simples', type: 'Consumível', value: '50 PO', description: 'Líquido vermelho brilhante que cura 2d4 + 2 pontos de vida.', icon: '🧪' },
      { name: 'Adaga de Aço Élfico', type: 'Arma', value: '25 PO', description: 'Lâmina leve com empunhadura entalhada em madeira nobre.', icon: '🗡️' },
      { name: 'Gema de Quartzo Fumê', type: 'Gema', value: '15 PO', description: 'Pedra translúcida que reluz levemente no escuro.', icon: '💎' },
      { name: 'Pedaço de Pergaminho Misterioso', type: 'Pista', value: 'Inestimável', description: 'Fragmento contendo coordenadas cifradas de um túmulo esquecido.', icon: '📜' },
      { name: 'Tocha de Fogo Perpétuo (Gasta)', type: 'Utilitário', value: '30 PO', description: 'Queima sem calor por mais 4 horas antes de se extinguir.', icon: '🔥' }
    ]
  },
  {
    id: 'loot-medium',
    tier: 'medium',
    tierName: 'Nível Médio (Nv 5-10)',
    items: [
      { name: 'Saco de Moedas de Ouro e Platina', type: 'Moedas', value: '250 PO + 15 PP', description: 'Moedas nobres seladas com cera real.', icon: '🪙' },
      { name: 'Poção de Invisibilidade', type: 'Consumível', value: '180 PO', description: 'Líquido etéreo que concede invisibilidade por 1 hora.', icon: '🧪' },
      { name: 'Anel de Proteção +1', type: 'Item Mágico', value: '400 PO', description: 'Concede +1 em CA e salvaguardas enquanto sintonizado.', icon: '💍' },
      { name: 'Gema de Rubi Estelar', type: 'Gema', value: '200 PO', description: 'Rubi lapidado que brilha como uma brasa viva.', icon: '💎' },
      { name: 'Capa da Sombra Sussurrante', type: 'Armadura/Veste', value: '350 PO', description: 'Vantagem em testes de Furtividade em escuridão ou penumbra.', icon: '🧥' },
      { name: 'Varinha de Mísseis Mágicos', type: 'Varinha', value: '300 PO', description: 'Possui 7 cargas para disparar dardos de energia sem errar.', icon: '🪄' }
    ]
  },
  {
    id: 'loot-high',
    tier: 'high',
    tierName: 'Nível Alto (Nv 11-16)',
    items: [
      { name: 'Baú de Riquezas da Guilda', type: 'Tesouro', value: '1.200 PO + 80 PP', description: 'Pilhas de lingotes de prata e moedas cunhadas.', icon: '👑' },
      { name: 'Espada Longa Flamejante (+2)', type: 'Arma Mágica', value: '1.800 PO', description: 'Causa +2d6 de dano de fogo adicional a cada golpe.', icon: '⚔️' },
      { name: 'Amuleto de Saúde (Constituição 19)', type: 'Item Mágico', value: '2.500 PO', description: 'Fixa o atributo Constituição do portador em 19.', icon: '📿' },
      { name: 'Diamante Astral Lapidado', type: 'Gema Nobre', value: '1.000 PO', description: 'Reagente perfeito para rituais de ressurreição.', icon: '💎' },
      { name: 'Pergaminho de Teletransporte', type: 'Pergaminho 7º Nível', value: '1.500 PO', description: 'Permite transportar o grupo instantaneamente a um círculo familiar.', icon: '📜' }
    ]
  },
  {
    id: 'loot-boss',
    tier: 'boss',
    tierName: 'Tesouro de Chefe / Épico',
    items: [
      { name: 'Tesouro Imperial do Soberano Caído', type: 'Loot Lendário', value: '5.000 PO + 350 PP', description: 'Ouro maciço, coroas e cálices de platina com safiras.', icon: '🏰' },
      { name: 'Lâmina Devoradora de Almas', type: 'Artefato Lendário', value: 'Inestimável', description: 'Lâmina que absorve a essência dos inimigos derrotados e regenera o portador.', icon: '🖤' },
      { name: 'Orbe das Tempestades Elementais', type: 'Artefato', value: '4.500 PO', description: 'Controla o clima regional e invoca tempestades de relâmpagos.', icon: '🔮' },
      { name: 'Tomo do Arcano Proibido', type: 'Livro Mágico', value: '3.000 PO', description: 'Aumenta permanentemente a Inteligência em +2 após 48 horas de estudo.', icon: '📖' }
    ]
  },
  {
    id: 'loot-wod',
    tier: 'wod',
    tierName: 'Recompensa WoD / Vampiro',
    items: [
      { name: 'Frasco de Sangue de Ancião (Vitae)', type: 'Relíquia WoD', value: '3 Pontos de Sangue Especial', description: 'Sangue concentrado da 6ª geração que fortalece temporariamente Disciplinas.', icon: '🩸' },
      { name: 'Ficha Policial Confidencial & Dossiê', type: 'Pista / Chantagem', value: '3 Pontos de Influência', description: 'Segredos comprometedores sobre o chefe de polícia e o prefeito.', icon: '📁' },
      { name: 'Adaga de Prata Abençoada por Caçadores', type: 'Arma Ritual', value: 'Dano Agravado em Licantropos', description: 'Lâmina forjada com prata pura e runas da Inquisição.', icon: '🗡️' },
      { name: 'Chave do Cofre Bancário Suíço', type: 'Recursos', value: 'Recursos Nível 4', description: 'Dá acesso a 100.000 dólares não rastreáveis e passaportes falsos.', icon: '🔑' },
      { name: 'Fita K7 com Gravação da Camarilla', type: 'Pista WoD', value: 'Quebra de Máscara Potencial', description: 'Áudio vazado de um príncipe negociando com Anarquistas.', icon: '📼' }
    ]
  }
];

export const DEFAULT_ENCOUNTER_PRESETS: EncounterPreset[] = [
  {
    id: 'enc-1',
    name: 'Emboscada dos Salteadores na Floresta',
    environment: 'floresta',
    difficulty: 'medio',
    enemies: [
      { name: 'Capitão dos Salteadores', role: 'Líder Tático', count: 1, cr: '2', hp: '38', ac: '15', keyFeature: 'Aura de comando que concede +2 no ataque aos aliados' },
      { name: 'Arqueiros Camuflados', role: 'Atiradores de Emboscada', count: 3, cr: '1/2', hp: '16', ac: '13', keyFeature: 'Disparam das copas das árvores com vantagem na 1ª rodada' },
      { name: 'Cães de Caça Ferozes', role: 'Vanguarda / Derrubar', count: 2, cr: '1/4', hp: '11', ac: '12', keyFeature: 'Tentam derrubar alvos mordidos no chão (CD 12 For)' }
    ],
    tacticalObjective: 'Interceptar o líder antes que ele soe o berrante chamando reforços da guilda.',
    environmentalHazard: 'Terreno acidentado com raízes escorregadias e névoa densa na altura do chão.',
    quickReward: 'Bolsa com 65 PO, mapa desenhado em couro e 2x Poções de Cura Simples.'
  },
  {
    id: 'enc-2',
    name: 'Cripta dos Esqueletos Rúnicos',
    environment: 'masmorra',
    difficulty: 'dificil',
    enemies: [
      { name: 'Cavaleiro Espectral da Tumba', role: 'Chefe Morto-Vivo', count: 1, cr: '4', hp: '65', ac: '17', keyFeature: 'Lâmina gélida que causa 2d8 de dano necrótico e impede cura por 1 rodada' },
      { name: 'Guardiões Esqueléticos com Escudo', role: 'Falange de Defesa', count: 4, cr: '1', hp: '22', ac: '16', keyFeature: 'Formação em muralha: concedem cobertura parcial entre si' }
    ],
    tacticalObjective: 'Destruir os 2 obeliscos rúnicos que revitalizam o Cavaleiro a cada turno.',
    environmentalHazard: 'Lápides profanadas que emitem pulsos necróticos periódicos (1d6 de dano a cada 3 rodadas).',
    quickReward: 'Espada Longa de Aço Forjado (+1 contra mortos-vivos) e 140 PO em cálices funerários.'
  },
  {
    id: 'enc-3',
    name: 'Confronto em Beco Escuro de Cidade',
    environment: 'cidade',
    difficulty: 'facil',
    enemies: [
      { name: 'Assassino Encapuzado da Guilda', role: 'Furtivo Letal', count: 1, cr: '2', hp: '32', ac: '14', keyFeature: 'Ataque furtivo: +3d6 de dano caso tenha vantagem' },
      { name: 'Capangas Valentões do Porto', role: 'Contenção', count: 3, cr: '1/2', hp: '18', ac: '12', keyFeature: 'Tentam agarrar e desarmar os aventureiros' }
    ],
    tacticalObjective: 'Capturar o informante vivo antes que ele escape pulando pelos telhados.',
    environmentalHazard: 'Caixotes empilhados e cordas de varal que podem ser derrubadas para bloquear passagem.',
    quickReward: 'Adaga envenenada, anel de sinete falso e carta selada com chantagem.'
  }
];

export const DEFAULT_ROULETTE_PRESETS: RoulettePreset[] = [
  {
    id: 'roulette-hero-fate',
    name: '🎯 Destino do Herói (Sorte / Azar)',
    options: [
      { label: 'Sucesso Extraordinário', weight: 15, color: '#10b981' },
      { label: 'Sucesso Normal', weight: 40, color: '#06b6d4' },
      { label: 'Complicação / Preço a Pagar', weight: 30, color: '#f59e0b' },
      { label: 'Desastre / Falha Crítica', weight: 15, color: '#ef4444' }
    ]
  },
  {
    id: 'roulette-attack-target',
    name: '⚔️ Quem é o Alvo do Ataque?',
    options: [
      { label: 'Guerreiro / Tanque', weight: 40, color: '#6366f1' },
      { label: 'Ladino / Furtivo', weight: 20, color: '#f59e0b' },
      { label: 'Mago / Conjurador', weight: 20, color: '#a855f7' },
      { label: 'Clérigo / Suporte', weight: 20, color: '#10b981' }
    ]
  },
  {
    id: 'roulette-weather-travel',
    name: '🌦️ Clima da Viagem',
    options: [
      { label: 'Céu Limpo & Ensolarado', weight: 45, color: '#f59e0b' },
      { label: 'Nublado & Vento Cortante', weight: 25, color: '#06b6d4' },
      { label: 'Chuva Torrencial', weight: 20, color: '#6366f1' },
      { label: 'Tempestade de Raios / Nevasca', weight: 10, color: '#ef4444' }
    ]
  },
  {
    id: 'roulette-wod-sanity',
    name: '💀 Tensão & Sanidade (WoD / CoC)',
    options: [
      { label: 'Mente Firme & Concentrada', weight: 50, color: '#10b981' },
      { label: 'Perturbado (Alucinações Leves)', weight: 30, color: '#f59e0b' },
      { label: 'Frenesi / Pânico Cego', weight: 20, color: '#ef4444' }
    ]
  }
];

export const DEFAULT_TIMER_PRESETS: TimerPreset[] = [
  { id: 'timer-torch', title: 'Tocha / Vela', type: 'countdown', minutes: 60, category: 'torch', color: '#f59e0b', icon: '🔥' },
  { id: 'timer-concentration', title: 'Magia / Concentração', type: 'countdown', minutes: 1, category: 'buff', color: '#8b5cf6', icon: '✨' },
  { id: 'timer-short-rest', title: 'Descanso Curto (5e)', type: 'countdown', minutes: 60, category: 'rest', color: '#10b981', icon: '⛺' },
  { id: 'timer-poison', title: 'Veneno / Dano Contínuo', type: 'countdown', minutes: 0.5, category: 'combat', color: '#ec4899', icon: '☠️' },
  { id: 'timer-exploration', title: 'Exploração de Masmorra', type: 'stopwatch', minutes: 0, category: 'session', color: '#3b82f6', icon: '🧭' }
];

export const DEFAULT_NOTE_TEMPLATES: NoteTabTemplate[] = [
  {
    id: 'note-tpl-general',
    title: 'Notas Gerais',
    emoji: '📜',
    defaultContent: '',
    category: 'Sessão'
  },
  {
    id: 'note-tpl-clues',
    title: 'Pistas & Segredos',
    emoji: '🗝️',
    defaultContent: '',
    category: 'Mistério'
  },
  {
    id: 'note-tpl-loot',
    title: 'Loot Concedido',
    emoji: '💰',
    defaultContent: '',
    category: 'Recompensas'
  },
  {
    id: 'note-tpl-npcs',
    title: 'NPCs & Contatos',
    emoji: '👤',
    defaultContent: '',
    category: 'Personagens'
  }
];

export const DEFAULT_CONDITION_RULES: ConditionRulePreset[] = [
  {
    id: 'cond-blinded',
    name: 'Cego (Blinded)',
    category: 'status',
    icon: '🙈',
    summary: 'Falha em visão. Ataques contra têm vantagem, próprios têm desvantagem.',
    description: 'Uma criatura cega não enxerga e falha automaticamente em qualquer teste que dependa da visão. Ataques contra têm vantagem, e os seus têm desvantagem.',
    discordFormat: '🙈 **Condição: Cego (Blinded)**\n• Falha automática em testes de visão.\n• Ataques contra a criatura têm **Vantagem**.\n• Ataques da criatura têm **Desvantagem**.'
  },
  {
    id: 'cond-charmed',
    name: 'Enfeitiçado (Charmed)',
    category: 'status',
    icon: '💖',
    summary: 'Não pode atacar o conjurador. Conjurador tem vantagem social contra ela.',
    description: 'Não pode atacar o encantador ou tê-lo como alvo de habilidades nocivas. O encantador tem vantagem em testes sociais.',
    discordFormat: '💖 **Condição: Enfeitiçado (Charmed)**\n• Não pode atacar o encantador.\n• Encantador tem **Vantagem** em interações sociais.'
  },
  {
    id: 'cond-frightened',
    name: 'Amedrontado (Frightened)',
    category: 'status',
    icon: '😱',
    summary: 'Desvantagem em testes e ataques enquanto avistar a fonte. Não pode se aproximar.',
    description: 'Desvantagem em testes e ataques com a fonte em vista. Não pode se aproximar voluntariamente.',
    discordFormat: '😱 **Condição: Amedrontado (Frightened)**\n• **Desvantagem** em testes e ataques enquanto avistar a fonte do medo.\n• Não pode se aproximar voluntariamente da fonte.'
  },
  {
    id: 'cond-poisoned',
    name: 'Envenenado (Poisoned)',
    category: 'status',
    icon: '🧪',
    summary: 'Desvantagem em jogadas de ataque e testes de atributo.',
    description: 'Sofre dores, náuseas ou toxinas no sangue, impondo desvantagem contínua.',
    discordFormat: '🧪 **Condição: Envenenado (Poisoned)**\n• Sofre **Desvantagem** em jogadas de ataque e testes de atributo.'
  },
  {
    id: 'cond-prone',
    name: 'Caído (Prone)',
    category: 'status',
    icon: '🛌',
    summary: 'Gasta metade do movimento para levantar. Ataques a 1,5m têm vantagem.',
    description: 'Apenas rasteja ou gasta metade do deslocamento para levantar. Ataques próprios têm desvantagem; ataques a 1,5m contra têm vantagem.',
    discordFormat: '🛌 **Condição: Caído (Prone)**\n• Gastar metade do movimento para levantar.\n• Ataques próprios têm **Desvantagem**.\n• Ataques a 1,5m contra têm **Vantagem** (à distância têm desvantagem).'
  },
  {
    id: 'cond-paralyzed',
    name: 'Paralisado (Paralyzed)',
    category: 'status',
    icon: '⚡',
    summary: 'Incapacitado, falha em For/Des. Ataques a 1,5m que acertam são críticos!',
    description: 'Não pode se mover ou falar. Falha em salvaguardas de Força/Destreza. Qualquer acerto a até 1,5m é crítico automático.',
    discordFormat: '⚡ **Condição: Paralisado (Paralyzed)**\n• Incapacitado total (não age nem move).\n• Falha automática em testes de FOR/DES.\n• Ataques a 1,5m que acertarem são **Acertos Críticos automáticos**!'
  },
  {
    id: 'cond-stunned',
    name: 'Atordoado (Stunned)',
    category: 'status',
    icon: '💫',
    summary: 'Incapacitado, mal se move, fala vacilante. Ataques contra têm vantagem.',
    description: 'Uma criatura atordoada está incapacitada, não pode se mover e fala apenas aos tropeços. Falha em FOR/DES e ataques contra têm vantagem.',
    discordFormat: '💫 **Condição: Atordoado (Stunned)**\n• Incapacitado e imóvel.\n• Ataques contra a criatura têm **Vantagem**.\n• Falha automática em testes de FOR e DES.'
  },
  {
    id: 'cond-invisible',
    name: 'Invisível (Invisible)',
    category: 'status',
    icon: '👻',
    summary: 'Impossível ver sem magia. Ataques próprios têm vantagem, contra têm desvantagem.',
    description: 'Considerada em escuridão pesada para detecção. Seus ataques têm vantagem e ataques contra têm desvantagem.',
    discordFormat: '👻 **Condição: Invisível (Invisible)**\n• Ataques próprios com **Vantagem**.\n• Ataques inimigos contra a criatura com **Desvantagem**.\n• Localização requer teste de Percepção auditiva.'
  },
  {
    id: 'cond-exhaustion',
    name: 'Exaustão (Níveis 1-6)',
    category: 'difficulty',
    icon: '⏳',
    summary: 'Acumula penalidades progressivas: desvantagem, metade do deslocamento até a morte.',
    description: 'Nv 1: Desvantagem em testes. Nv 2: Metade do deslocamento. Nv 3: Desvantagem em ataques/TS. Nv 4: PV máximo pela metade. Nv 5: Movimento 0. Nv 6: Morte.',
    discordFormat: '⏳ **Efeito de Exaustão**\n• Nv 1: Desvantagem em testes de atributo.\n• Nv 2: Deslocamento reduzido à metade.\n• Nv 3: Desvantagem em ataques e salvaguardas.\n• Nv 4: PV máximo reduzido à metade.\n• Nv 5: Deslocamento 0.\n• Nv 6: Morte.'
  },
  {
    id: 'wod-frenzy',
    name: 'WoD: Frenesi da Besta',
    category: 'wod',
    icon: '🩸',
    summary: 'Vampiro perde o controle consciente. Imune a medo e penalidades de ferimento.',
    description: 'A Besta assume o controle. Ignora penalidades de ferimento, imune a poderes mentais e Dominação, prioriza destruir a ameaça ou alimentar-se.',
    discordFormat: '🩸 **WoD: Frenesi da Besta (Frenzy)**\n• Controle total assumido pela Besta Interior!\n• Imunidade temporária a penalidades de ferimento e controle mental.\n• Dificuldade de Autocontrole para cessar o surto.'
  },
  {
    id: 'wod-rotsckreck',
    name: 'WoD: Rötschreck (Pânico Vermelho)',
    category: 'wod',
    icon: '🔥',
    summary: 'Terror cego e incontrolável perante fogo ou luz solar.',
    description: 'Terror instintivo diante das maiores fraquezas vampíricas. Fuga imediata em velocidade máxima sem medir consequências.',
    discordFormat: '🔥 **WoD: Rötschreck (Medo Vermelho)**\n• Fuga incontrolável perante fogo ou luz do sol!\n• Teste de Coragem imediato para não ceder ao pânico total.'
  }
];

export const DEFAULT_WEATHER_PRESETS: WeatherAtmospherePreset[] = [
  {
    id: 'weather-clear-sun',
    name: 'Céu Limpo & Sol Radiante',
    icon: '☀️',
    effect: 'Visibilidade perfeita. Nenhum impedimento.',
    discordEmoji: '☀️',
    timeOfDay: 'noon',
    lightLevel: 'Luz Plena Direta',
    description: 'Dia claro e ensolarado com excelente visibilidade até o horizonte.'
  },
  {
    id: 'weather-dense-fog',
    name: 'Névoa Espessa & Sombria',
    icon: '🌫️',
    effect: 'Visibilidade reduzida a 9m. Desvantagem em Percepção visual.',
    discordEmoji: '🌫️',
    timeOfDay: 'dusk',
    lightLevel: 'Penumbra / Neblina',
    description: 'Camada densa de névoa fria que esconde emboscadas e silencia passos.'
  },
  {
    id: 'weather-cold-rain',
    name: 'Chuva Fria & Lamaçal',
    icon: '🌧️',
    effect: 'Fogo exposto apaga. Desvantagem em Percepção auditiva e rastreamento.',
    discordEmoji: '🌧️',
    timeOfDay: 'afternoon',
    lightLevel: 'Luz Penumbrosa',
    description: 'Precipitação contínua que encharca roupas, apaga tochas e torna o chão escorregadio.'
  },
  {
    id: 'weather-lightning-storm',
    name: 'Tempestade de Raios & Trovões',
    icon: '⛈️',
    effect: 'Terreno difícil aberto. Ataques à distância com desvantagem. Barulho ensurdecedor.',
    discordEmoji: '⛈️',
    timeOfDay: 'midnight',
    lightLevel: 'Escuridão com Clarões',
    description: 'Rajadas violentas de vento com relâmpagos ensurdecedores cortando o céu.'
  },
  {
    id: 'weather-blizzard',
    name: 'Nevasca & Frio Extremo',
    icon: '❄️',
    effect: 'Testes de Constituição CD 10 contra Exaustão se não houver agasalhos adequados.',
    discordEmoji: '❄️',
    timeOfDay: 'deep_night',
    lightLevel: 'Visibilidade Nula',
    description: 'Frio cortante que congela poções e exige fogueiras protegidas para sobrevivência.'
  },
  {
    id: 'weather-blood-moon',
    name: 'Noite de Lua Sangrenta',
    icon: '🌕',
    effect: 'Criaturas da noite e Vampiros recebem +1 dado de bônus em testes sobrenaturais.',
    discordEmoji: '🩸',
    timeOfDay: 'midnight',
    lightLevel: 'Luz Carmesim Obscura',
    description: 'A lua surge vermelha como sangue fresco, excitando licantropos e mortos-vivos.'
  },
  {
    id: 'weather-desert-heat',
    name: 'Calor Escaldante do Deserto',
    icon: '🔥',
    effect: 'Consumo de água triplicado. Armaduras pesadas causam desvantagem.',
    discordEmoji: '🔥',
    timeOfDay: 'noon',
    lightLevel: 'Luz Cegante',
    description: 'Ar escaldante com miragens no horizonte e risco elevado de insolação.'
  },
  {
    id: 'weather-astral-rift',
    name: 'Fenda Astral & Tempestade de Éter',
    icon: '🌌',
    effect: 'Magias selvagens (Wild Magic) em 1 no d20. Bônus de +2 em testes arcanos.',
    discordEmoji: '✨',
    timeOfDay: 'deep_night',
    lightLevel: 'Luz Etérea Roxa',
    description: 'Céu rasgado por auroras púrpuras e ondulações na trama cósmica da realidade.'
  }
];

// =========================================================================
// STORAGE ACCESSORS & SYNC
// =========================================================================

const STORAGE_KEYS = {
  loot: 'caranguejo_preset_loots_v2',
  encounters: 'caranguejo_preset_encounters_v2',
  roulette: 'caranguejo_preset_roulettes_v2',
  timers: 'caranguejo_preset_timers_v2',
  notes: 'caranguejo_preset_notes_v2',
  rules: 'caranguejo_preset_rules_v2',
  weather: 'caranguejo_preset_weather_v2'
};

function notifyPresetChange(type: string) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('caranguejo_presets_updated', { detail: { type } }));
  }
}

// LOOT
export function getLootPresets(): LootTablePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.loot);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_LOOT_TABLES;
}

export function saveLootPresets(presets: LootTablePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.loot, JSON.stringify(presets));
    notifyPresetChange('loot');
  } catch (e) {
    console.error('Error saving loot presets:', e);
  }
}

// ENCOUNTERS
export function getEncounterPresets(): EncounterPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.encounters);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_ENCOUNTER_PRESETS;
}

export function saveEncounterPresets(presets: EncounterPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.encounters, JSON.stringify(presets));
    notifyPresetChange('encounters');
  } catch (e) {
    console.error('Error saving encounter presets:', e);
  }
}

// ROULETTE
export function getRoulettePresets(): RoulettePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.roulette);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_ROULETTE_PRESETS;
}

export function saveRoulettePresets(presets: RoulettePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.roulette, JSON.stringify(presets));
    notifyPresetChange('roulette');
  } catch (e) {
    console.error('Error saving roulette presets:', e);
  }
}

// TIMERS
export function getTimerPresets(): TimerPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.timers);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_TIMER_PRESETS;
}

export function saveTimerPresets(presets: TimerPreset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.timers, JSON.stringify(presets));
    notifyPresetChange('timers');
  } catch (e) {
    console.error('Error saving timer presets:', e);
  }
}

// NOTES
export function getNoteTabTemplates(): NoteTabTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notes);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_NOTE_TEMPLATES;
}

export function saveNoteTabTemplates(presets: NoteTabTemplate[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(presets));
    notifyPresetChange('notes');
  } catch (e) {
    console.error('Error saving note presets:', e);
  }
}

// RULES & CONDITIONS
export function getConditionRulePresets(): ConditionRulePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.rules);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CONDITION_RULES;
}

export function saveConditionRulePresets(presets: ConditionRulePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.rules, JSON.stringify(presets));
    notifyPresetChange('rules');
  } catch (e) {
    console.error('Error saving condition rule presets:', e);
  }
}

// WEATHER & ATMOSPHERE
export function getWeatherPresets(): WeatherAtmospherePreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.weather);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_WEATHER_PRESETS;
}

export function saveWeatherPresets(presets: WeatherAtmospherePreset[]) {
  try {
    localStorage.setItem(STORAGE_KEYS.weather, JSON.stringify(presets));
    notifyPresetChange('weather');
  } catch (e) {
    console.error('Error saving weather presets:', e);
  }
}

// EXPORT ALL PRESETS AS CLEAN JSON
export function exportAllPresetsJson(): string {
  const payload = {
    app: 'CaranguejoRPG',
    version: '3.0',
    exportedAt: new Date().toISOString(),
    presets: {
      loots: getLootPresets(),
      encounters: getEncounterPresets(),
      roulettes: getRoulettePresets(),
      timers: getTimerPresets(),
      noteTemplates: getNoteTabTemplates(),
      rules: getConditionRulePresets(),
      weather: getWeatherPresets()
    }
  };
  return JSON.stringify(payload, null, 2);
}

// IMPORT ALL PRESETS FROM JSON
export function importPresetsFromJson(jsonString: string): { success: boolean; message: string } {
  try {
    const parsed = JSON.parse(jsonString);
    const data = parsed.presets || parsed;

    if (Array.isArray(data.loots)) saveLootPresets(data.loots);
    if (Array.isArray(data.encounters)) saveEncounterPresets(data.encounters);
    if (Array.isArray(data.roulettes)) saveRoulettePresets(data.roulettes);
    if (Array.isArray(data.timers)) saveTimerPresets(data.timers);
    if (Array.isArray(data.noteTemplates)) saveNoteTabTemplates(data.noteTemplates);
    if (Array.isArray(data.rules)) saveConditionRulePresets(data.rules);
    if (Array.isArray(data.weather)) saveWeatherPresets(data.weather);

    return { success: true, message: 'Predefinições importadas com sucesso!' };
  } catch (e: any) {
    return { success: false, message: e?.message || 'Arquivo de predefinições inválido.' };
  }
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Sparkles,
  Send,
  Dices,
  UserCheck,
  Eye,
  EyeOff,
  Flame,
  Plus,
  PlusCircle,
  Trash2,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  ListMusic,
  HardDrive,
  FolderDown,
  LayoutGrid,
  Zap,
  Swords,
  ChevronRight,
  FlameKindling,
  Headphones,
  Radio,
  Megaphone,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  MapPin,
  Maximize2,
  Minimize2,
  ChevronDown,
  ChevronUp,
  Settings2,
  RotateCcw,
  Sliders,
  X,
  Layers,
  Columns,
  Grid3X3,
  GripVertical,
  GripHorizontal,
  Move,
  MoveVertical,
  MoveHorizontal,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  Activity,
  Image as ImageIcon,
  Edit3,
  BookOpen,
  Gem,
  CloudSun,
  StickyNote,
  HelpCircle,
  Compass,
  Search,
  Coins,
  Clock
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import {
  NPC,
  DiceRollResult,
  WodDiceRollResult,
  WidgetType,
  MasterWidgetId,
  MasterWidgetConfig,
  WidgetWidth,
  WidgetHeight,
  WidgetDensity
} from '../types';
import { safeFetchJson } from '../services/api';
import { AudioScrubber } from './AudioScrubber';
import { MultiTimersWidget } from './MultiTimersWidget';
import { MultiTabNotepad } from './MultiTabNotepad';
import { SummaryStatsWidget } from './SummaryStatsWidget';
import { MasterImageViewerWidget } from './MasterImageViewerWidget';
import { QuickRulesWidget } from './QuickRulesWidget';
import { LootGeneratorWidget } from './LootGeneratorWidget';
import { WeatherClockWidget } from './WeatherClockWidget';
import { ScratchpadWidget } from './ScratchpadWidget';

interface MasterScreenProps {
  onOpenMusicTab: () => void;
  onOpenSoundboardTab: () => void;
  onOpenNpcTab: () => void;
  onOpenChatTab: () => void;
  onOpenSessionModal: () => void;
}

export interface WidgetCatalogItem {
  type: WidgetType;
  name: string;
  category: 'core' | 'lore' | 'tools' | 'audio';
  icon: string;
  defaultTitle: string;
  defaultWidth: WidgetWidth;
  defaultDensity: WidgetDensity;
  description: string;
  allowMultiple: boolean;
  tags: string[];
}

export const WIDGET_CATALOG: WidgetCatalogItem[] = [
  {
    type: 'notepad',
    name: 'Bloco de Notas Multiabas',
    category: 'lore',
    icon: '📝',
    defaultTitle: 'Bloco de Notas do Mestre',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Anotações em abas, pistas secretas, tesouro e formatação Markdown sincronizada.',
    allowMultiple: true,
    tags: ['notas', 'lore', 'abas', 'segredos']
  },
  {
    type: 'scratchpad',
    name: 'Rascunho Rápido (Post-it)',
    category: 'lore',
    icon: '📌',
    defaultTitle: 'Rascunho Rápido',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Post-it rápido para HP temporário, senhas, iniciativa de emergência e notas rápidas.',
    allowMultiple: true,
    tags: ['post-it', 'rascunho', 'rápido', 'hp']
  },
  {
    type: 'image_viewer',
    name: 'Cenários, Mapas & Handouts',
    category: 'lore',
    icon: '🗺️',
    defaultTitle: 'Cenários, Mapas & Handouts',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Galeria visual com zoom in/out, cartas secretas, retratos de NPCs e exibição no Discord.',
    allowMultiple: true,
    tags: ['mapas', 'imagens', 'handouts', 'zoom']
  },
  {
    type: 'quick_rules',
    name: 'Guia Rápido de Regras & Condições',
    category: 'tools',
    icon: '📖',
    defaultTitle: 'Guia de Regras & Condições',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Condições de combate (Cego, Paralisado, etc.), regras de Frenesi WoD, CDs e cobertura.',
    allowMultiple: true,
    tags: ['regras', 'condições', 'd&d', 'wod']
  },
  {
    type: 'loot_generator',
    name: 'Gerador Rápido de Tesouros & Loot',
    category: 'tools',
    icon: '💎',
    defaultTitle: 'Gerador de Tesouros & Loot',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Rolagem instantânea de recompensas, ouro, itens mágicos e relíquias WoD por nível.',
    allowMultiple: true,
    tags: ['loot', 'tesouro', 'ouro', 'itens']
  },
  {
    type: 'weather_clock',
    name: 'Clima, Horário & Atmosfera',
    category: 'tools',
    icon: '⛅',
    defaultTitle: 'Clima & Atmosfera da Sessão',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Controle de dia da campanha, período do dia (Alvorecer/Crepúsculo) e efeitos climáticos.',
    allowMultiple: true,
    tags: ['clima', 'relógio', 'tempo', 'dia']
  },
  {
    type: 'dice_roller',
    name: 'Rolador de Dados (WoD & D&D)',
    category: 'tools',
    icon: '🎲',
    defaultTitle: 'Rolador de Dados (WoD & D&D)',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Rolagem com suporte a dados de Vampiro (explosão de 10s, KEEN) e poliédricos D20/D6/D8.',
    allowMultiple: false,
    tags: ['dados', 'd20', 'wod', 'rolador']
  },
  {
    type: 'initiative',
    name: 'Rastreador de Iniciativa & Combate',
    category: 'core',
    icon: '⚔️',
    defaultTitle: 'Rastreador de Iniciativa & Combate',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Ordem de iniciativa, PV de monstros/heróis, contador de rodadas e anúncio no Discord.',
    allowMultiple: false,
    tags: ['iniciativa', 'combate', 'turnos', 'pv']
  },
  {
    type: 'stats_summary',
    name: 'Resumo da Mesa & Estatísticas',
    category: 'core',
    icon: '📊',
    defaultTitle: 'Resumo da Mesa & Estatísticas',
    defaultWidth: 'full',
    defaultDensity: 'expanded',
    description: 'Visão geral de saves, notas, contatos de NPCs, músicas e status do bot Discord.',
    allowMultiple: false,
    tags: ['estatísticas', 'resumo', 'painel', 'sessão']
  },
  {
    type: 'now_playing',
    name: 'Tocando Agora & Player de Áudio',
    category: 'audio',
    icon: '🎵',
    defaultTitle: 'Tocando Agora & Player de Áudio',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Controle de trilha sonora, volume, barra de progresso e fila de reprodução.',
    allowMultiple: false,
    tags: ['música', 'player', 'trilha', 'áudio']
  },
  {
    type: 'soundboard',
    name: 'Soundboard do Mestre (Efeitos Sonoros)',
    category: 'audio',
    icon: '🔊',
    defaultTitle: 'Soundboard do Mestre (Efeitos Sonoros)',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Disparo de efeitos de áudio (SFX) imediatos para aumentar a imersão da sessão.',
    allowMultiple: false,
    tags: ['sfx', 'efeitos', 'som', 'soundboard']
  },
  {
    type: 'timers',
    name: 'Temporizadores & Cronômetro',
    category: 'tools',
    icon: '⏱️',
    defaultTitle: 'Temporizadores & Cronômetro da Mesa',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Duração de tochas, magias com concentração, descansos e duração total da sessão.',
    allowMultiple: false,
    tags: ['tempo', 'tocha', 'cronometro', 'descanso']
  },
  {
    type: 'narrative',
    name: 'Narração Direta para o Discord',
    category: 'lore',
    icon: '📜',
    defaultTitle: 'Narração Direta para o Discord',
    defaultWidth: 'half',
    defaultDensity: 'expanded',
    description: 'Envio de descrições épicas e textos destacados com moldura dourada no Discord.',
    allowMultiple: false,
    tags: ['narração', 'lore', 'discord', 'texto']
  },
  {
    type: 'npc_spotlight',
    name: 'NPCs em Destaque & Envio 1-Clique',
    category: 'lore',
    icon: '👤',
    defaultTitle: 'NPCs em Destaque & Envio 1-Clique',
    defaultWidth: 'full',
    defaultDensity: 'expanded',
    description: 'Catálogo rápido de NPCs ativos com notas secretas e envio de retrato para o chat.',
    allowMultiple: false,
    tags: ['npcs', 'personagens', 'monstros', 'chat']
  },
  {
    type: 'session_bar',
    name: 'Sessão da Mesa & Backup Local',
    category: 'core',
    icon: '💾',
    defaultTitle: 'Sessão da Mesa & Backup Local',
    defaultWidth: 'full',
    defaultDensity: 'compact',
    description: 'Gerenciamento de saves, backup JSON e status de sincronização da crônica.',
    allowMultiple: false,
    tags: ['backup', 'salvar', 'sessão', 'arquivo']
  }
];

const DEFAULT_WIDGETS_CONFIG: MasterWidgetConfig[] = [
  { id: 'stats_summary', type: 'stats_summary', title: 'Resumo da Mesa & Estatísticas', visible: true, width: 'full', density: 'expanded' },
  { id: 'session_bar', type: 'session_bar', title: 'Sessão da Mesa & Backup Local', visible: true, width: 'full', density: 'compact' },
  { id: 'now_playing', type: 'now_playing', title: 'Tocando Agora & Player de Áudio', visible: true, width: 'half', density: 'expanded' },
  { id: 'image_viewer', type: 'image_viewer', title: 'Cenários, Mapas & Handouts', visible: true, width: 'half', density: 'expanded' },
  { id: 'timers', type: 'timers', title: 'Temporizadores & Cronômetro da Mesa', visible: true, width: 'half', density: 'expanded' },
  { id: 'notepad', type: 'notepad', title: 'Bloco de Notas Multiabas do Mestre', visible: true, width: 'half', density: 'expanded' },
  { id: 'dice_roller', type: 'dice_roller', title: 'Rolador de Dados (WoD & D&D)', visible: true, width: 'half', density: 'expanded' },
  { id: 'initiative', type: 'initiative', title: 'Rastreador de Iniciativa & Combate', visible: true, width: 'half', density: 'expanded' },
  { id: 'soundboard', type: 'soundboard', title: 'Soundboard do Mestre (Efeitos Sonoros)', visible: true, width: 'half', density: 'expanded' },
  { id: 'narrative', type: 'narrative', title: 'Narração Direta para o Discord', visible: true, width: 'half', density: 'expanded' },
  { id: 'npc_spotlight', type: 'npc_spotlight', title: 'NPCs em Destaque & Envio 1-Clique', visible: true, width: 'full', density: 'expanded' },
];

const PRESETS: Record<string, { name: string; icon: string; desc: string; layout: MasterWidgetConfig[] }> = {
  balanced: {
    name: 'Equilibrado (Padrão)',
    icon: '🎯',
    desc: 'Visão balanceada com estatísticas, player, mapas, notas, dados e iniciativa.',
    layout: DEFAULT_WIDGETS_CONFIG
  },
  combat: {
    name: 'Foco em Combate & Ação',
    icon: '⚔️',
    desc: 'Iniciativa, Rolador de Dados, Guia de Regras e Mapas Táticos no topo em destaque.',
    layout: [
      { id: 'initiative', type: 'initiative', title: 'Rastreador de Iniciativa & Combate', visible: true, width: 'full', density: 'expanded' },
      { id: 'dice_roller', type: 'dice_roller', title: 'Rolador de Dados (WoD & D&D)', visible: true, width: 'half', density: 'expanded' },
      { id: 'quick_rules', type: 'quick_rules', title: 'Guia de Regras & Condições', visible: true, width: 'half', density: 'expanded' },
      { id: 'image_viewer', type: 'image_viewer', title: 'Cenários, Mapas & Handouts', visible: true, width: 'half', density: 'expanded' },
      { id: 'scratchpad', type: 'scratchpad', title: 'Rascunho Rápido de Combate', visible: true, width: 'half', density: 'expanded', storageKey: 'caranguejo_scratchpad_combat' },
      { id: 'npc_spotlight', type: 'npc_spotlight', title: 'NPCs em Destaque & Envio 1-Clique', visible: true, width: 'half', density: 'expanded' },
      { id: 'soundboard', type: 'soundboard', title: 'Soundboard do Mestre (Efeitos Sonoros)', visible: true, width: 'half', density: 'expanded' },
      { id: 'stats_summary', type: 'stats_summary', title: 'Resumo da Mesa & Estatísticas', visible: true, width: 'half', density: 'compact' },
      { id: 'timers', type: 'timers', title: 'Temporizadores & Cronômetro da Mesa', visible: true, width: 'half', density: 'compact' },
      { id: 'now_playing', type: 'now_playing', title: 'Tocando Agora & Player de Áudio', visible: true, width: 'half', density: 'compact' },
      { id: 'notepad', type: 'notepad', title: 'Bloco de Notas Multiabas do Mestre', visible: true, width: 'half', density: 'compact' },
      { id: 'narrative', type: 'narrative', title: 'Narração Direta para o Discord', visible: true, width: 'half', density: 'compact' },
      { id: 'session_bar', type: 'session_bar', title: 'Sessão da Mesa & Backup Local', visible: true, width: 'full', density: 'compact' },
    ]
  },
  narrative: {
    name: 'Foco em Narração & Lore',
    icon: '📜',
    desc: 'Cenários visuais, clima e atmosfera, bloco de notas e narração destacados no topo.',
    layout: [
      { id: 'image_viewer', type: 'image_viewer', title: 'Cenários, Mapas & Handouts', visible: true, width: 'half', density: 'expanded' },
      { id: 'weather_clock', type: 'weather_clock', title: 'Clima & Atmosfera da Sessão', visible: true, width: 'half', density: 'expanded' },
      { id: 'notepad', type: 'notepad', title: 'Bloco de Notas Multiabas do Mestre', visible: true, width: 'full', density: 'expanded' },
      { id: 'narrative', type: 'narrative', title: 'Narração Direta para o Discord', visible: true, width: 'half', density: 'expanded' },
      { id: 'loot_generator', type: 'loot_generator', title: 'Gerador de Tesouros & Loot', visible: true, width: 'half', density: 'expanded' },
      { id: 'stats_summary', type: 'stats_summary', title: 'Resumo da Mesa & Estatísticas', visible: true, width: 'half', density: 'expanded' },
      { id: 'timers', type: 'timers', title: 'Temporizadores & Cronômetro da Mesa', visible: true, width: 'half', density: 'expanded' },
      { id: 'npc_spotlight', type: 'npc_spotlight', title: 'NPCs em Destaque & Envio 1-Clique', visible: true, width: 'half', density: 'expanded' },
      { id: 'soundboard', type: 'soundboard', title: 'Soundboard do Mestre (Efeitos Sonoros)', visible: true, width: 'half', density: 'compact' },
      { id: 'now_playing', type: 'now_playing', title: 'Tocando Agora & Player de Áudio', visible: true, width: 'half', density: 'compact' },
      { id: 'dice_roller', type: 'dice_roller', title: 'Rolador de Dados (WoD & D&D)', visible: true, width: 'half', density: 'compact' },
      { id: 'initiative', type: 'initiative', title: 'Rastreador de Iniciativa & Combate', visible: true, width: 'half', density: 'compact' },
      { id: 'session_bar', type: 'session_bar', title: 'Sessão da Mesa & Backup Local', visible: true, width: 'full', density: 'compact' },
    ]
  },
  audio: {
    name: 'Foco em Áudio & Ambiência',
    icon: '🔊',
    desc: 'Player de áudio, soundboard e cenários ampliados no topo com controle total de som.',
    layout: [
      { id: 'now_playing', type: 'now_playing', title: 'Tocando Agora & Player de Áudio', visible: true, width: 'full', density: 'expanded' },
      { id: 'soundboard', type: 'soundboard', title: 'Soundboard do Mestre (Efeitos Sonoros)', visible: true, width: 'full', density: 'expanded' },
      { id: 'image_viewer', type: 'image_viewer', title: 'Cenários, Mapas & Handouts', visible: true, width: 'half', density: 'expanded' },
      { id: 'weather_clock', type: 'weather_clock', title: 'Clima & Atmosfera da Sessão', visible: true, width: 'half', density: 'expanded' },
      { id: 'timers', type: 'timers', title: 'Temporizadores & Cronômetro da Mesa', visible: true, width: 'half', density: 'expanded' },
      { id: 'stats_summary', type: 'stats_summary', title: 'Resumo da Mesa & Estatísticas', visible: true, width: 'half', density: 'compact' },
      { id: 'narrative', type: 'narrative', title: 'Narração Direta para o Discord', visible: true, width: 'half', density: 'expanded' },
      { id: 'notepad', type: 'notepad', title: 'Bloco de Notas Multiabas do Mestre', visible: true, width: 'half', density: 'compact' },
      { id: 'npc_spotlight', type: 'npc_spotlight', title: 'NPCs em Destaque & Envio 1-Clique', visible: true, width: 'half', density: 'compact' },
      { id: 'dice_roller', type: 'dice_roller', title: 'Rolador de Dados (WoD & D&D)', visible: true, width: 'half', density: 'compact' },
      { id: 'initiative', type: 'initiative', title: 'Rastreador de Iniciativa & Combate', visible: true, width: 'half', density: 'compact' },
      { id: 'session_bar', type: 'session_bar', title: 'Sessão da Mesa & Backup Local', visible: true, width: 'full', density: 'compact' },
    ]
  }
};

const STORAGE_LAYOUT_KEY = 'caranguejo_master_screen_layout_v5';

export const MasterScreen: React.FC<MasterScreenProps> = ({
  onOpenMusicTab,
  onOpenSoundboardTab,
  onOpenNpcTab,
  onOpenChatTab,
  onOpenSessionModal
}) => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    togglePlayPause,
    stopTrack,
    isLocalAudioEnabled,
    toggleLocalAudio,
    skipNext,
    skipPrevious,
    seek,
    queue,
    soundboardItems,
    playSoundboard,
    activeSfxIds,
    npcs,
    postNpcToDiscord,
    botStatus,
    soundboardLayouts,
    activeLayoutId,
    setActiveLayoutId,
    savedSessions,
    rollWodDiceAction,
    announceInitiativeTurn
  } = useAudio();

  // Layout & Widget Management State
  const [widgets, setWidgets] = useState<MasterWidgetConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_LAYOUT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((item: any) => ({
            ...item,
            type: item.type || item.id
          }));
        }
      } else {
        const legacy = localStorage.getItem('caranguejo_master_screen_layout_v4');
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            return parsedLegacy.map((item: any) => ({
              ...item,
              type: item.type || item.id
            }));
          }
        }
      }
    } catch {}
    return DEFAULT_WIDGETS_CONFIG;
  });

  // Organize Mode State (Drag & Drop + Hidden Options)
  const [isOrganizeMode, setIsOrganizeMode] = useState<boolean>(false);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);
  const [isAddWidgetModalOpen, setIsAddWidgetModalOpen] = useState<boolean>(false);
  const [focusedWidgetId, setFocusedWidgetId] = useState<string | null>(null);

  // Widget Title Editing Modal State
  const [editingTitleWidgetId, setEditingTitleWidgetId] = useState<string | null>(null);
  const [tempWidgetTitle, setTempWidgetTitle] = useState<string>('');

  // Add Widget Modal Filter
  const [widgetFilterCategory, setWidgetFilterCategory] = useState<'all' | 'core' | 'lore' | 'tools' | 'audio'>('all');
  const [widgetSearchQuery, setWidgetSearchQuery] = useState<string>('');

  // Drag & Drop State with 2D Grid Positioning & Free Resizing
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const [draggedWidgetId, setDraggedWidgetId] = useState<string | null>(null);
  const [dragOverWidgetId, setDragOverWidgetId] = useState<string | null>(null);
  const [dropSlotPosition, setDropSlotPosition] = useState<'before' | 'after'>('after');
  const [gridDropTarget, setGridDropTarget] = useState<{ col: number; row: number; cols: number } | null>(null);

  // Save layout changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_LAYOUT_KEY, JSON.stringify(widgets));
    } catch {}
  }, [widgets]);

  // Narrative message state
  const [narrativeText, setNarrativeText] = useState('');
  const [isSendingNarrative, setIsSendingNarrative] = useState(false);
  const [narrativeFeedback, setNarrativeFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Dice System Tab: 'standard' | 'wod'
  const [diceSystem, setDiceSystem] = useState<'standard' | 'wod'>('wod');

  // Standard Dice Roller State
  const [diceSides, setDiceSides] = useState<number>(20);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [diceModifier, setDiceModifier] = useState<number>(0);
  const [diceLabel] = useState<string>('');
  const [broadcastDice, setBroadcastDice] = useState<boolean>(true);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);

  // World of Darkness (WoD) Roller State
  const [wodDiceCount, setWodDiceCount] = useState<number>(6);
  const [wodIsKeen, setWodIsKeen] = useState<boolean>(false);
  const [wodLabel, setWodLabel] = useState<string>('');
  const [lastWodRoll, setLastWodRoll] = useState<WodDiceRollResult | null>(null);
  const [isWodRolling, setIsWodRolling] = useState<boolean>(false);

  // NPC Secret Notes Toggle
  const [revealedNpcSecrets, setRevealedNpcSecrets] = useState<Record<string, boolean>>({});
  const [postingNpcId, setPostingNpcId] = useState<string | null>(null);

  // Initiative Tracker State
  const [initiativeList, setInitiativeList] = useState<Array<{ id: string; name: string; init: number; hp: number; maxHp: number; isNpc: boolean }>>([
    { id: 'init-1', name: 'Guerreiro (Thoran)', init: 19, hp: 45, maxHp: 45, isNpc: false },
    { id: 'init-2', name: 'Lorde Malakor', init: 16, hp: 145, maxHp: 145, isNpc: true },
    { id: 'init-3', name: 'Maga (Lyra)', init: 14, hp: 28, maxHp: 28, isNpc: false },
    { id: 'init-4', name: 'Goblin Espião', init: 11, hp: 12, maxHp: 12, isNpc: true },
  ]);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);
  const [newCombatantName, setNewCombatantName] = useState('');
  const [newCombatantInit, setNewCombatantInit] = useState('');
  const [autoAnnounceTurn, setAutoAnnounceTurn] = useState<boolean>(false);
  const [isAnnouncingTurn, setIsAnnouncingTurn] = useState<boolean>(false);
  const [turnAnnouncementFeedback, setTurnAnnouncementFeedback] = useState<string | null>(null);
  const [combatRound, setCombatRound] = useState<number>(1);

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Quick Send Narrative
  const handleSendNarrative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrativeText.trim()) return;

    setIsSendingNarrative(true);
    setNarrativeFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: narrativeText.trim(),
          type: 'narrative'
        })
      });
      if (res.success && res.data?.success !== false) {
        setNarrativeFeedback({ status: 'success', msg: 'Narração enviada ao Discord!' });
        setNarrativeText('');
        setTimeout(() => setNarrativeFeedback({ status: 'idle' }), 3000);
      } else {
        setNarrativeFeedback({ status: 'error', msg: res.data?.error || res.error || 'Falha ao enviar ao Discord.' });
      }
    } catch (err: any) {
      setNarrativeFeedback({ status: 'error', msg: err?.message || 'Erro de conexão' });
    } finally {
      setIsSendingNarrative(false);
    }
  };

  // Roll Standard RPG Dice Action
  const handleRollDice = async (customSides?: number, customCount?: number) => {
    const sides = customSides !== undefined ? customSides : diceSides;
    const count = customCount !== undefined ? customCount : diceCount;
    setIsRolling(true);

    const notation = `${count}d${sides}${diceModifier > 0 ? `+${diceModifier}` : diceModifier < 0 ? `${diceModifier}` : ''}`;

    try {
      const res = await safeFetchJson<{ roll: DiceRollResult }>('/api/bot/roll-dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notation,
          label: diceLabel || undefined,
          broadcastToDiscord: broadcastDice
        })
      });

      if (res.success && res.data?.roll) {
        const roll = res.data.roll;
        setLastRoll(roll);
      }
    } catch (err) {
      console.error('Error rolling dice:', err);
    } finally {
      setIsRolling(false);
    }
  };

  // Roll World of Darkness (WoD) Storyteller Action
  const handleRollWod = async () => {
    setIsWodRolling(true);
    try {
      const result = await rollWodDiceAction(
        wodDiceCount,
        wodIsKeen,
        'Mestre',
        wodLabel.trim() || undefined,
        broadcastDice
      );

      if (result) {
        setLastWodRoll(result);
      }
    } catch (err) {
      console.error('Error rolling WoD dice:', err);
    } finally {
      setIsWodRolling(false);
    }
  };

  // Post NPC to Discord
  const handlePostNpc = async (npc: NPC) => {
    setPostingNpcId(npc.id);
    const res = await postNpcToDiscord(npc.id);
    setPostingNpcId(null);
    if (res.success) {
      // NPC posted
    }
  };

  const toggleNpcSecret = (id: string) => {
    setRevealedNpcSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Initiative Actions
  const handleAnnounceTurn = async (combatantToAnnounce?: { name: string; init: number; isNpc: boolean }, targetRound?: number) => {
    const currentCombatant = combatantToAnnounce || initiativeList[activeTurnIdx];
    if (!currentCombatant) return;

    setIsAnnouncingTurn(true);
    setTurnAnnouncementFeedback(null);

    const round = targetRound ?? combatRound;
    const res = await announceInitiativeTurn(currentCombatant.name, currentCombatant.init, currentCombatant.isNpc, round);
    setIsAnnouncingTurn(false);

    if (res.success) {
      setTurnAnnouncementFeedback(`⚔️ Turno de "${currentCombatant.name}" anunciado no Discord!`);
      setTimeout(() => setTurnAnnouncementFeedback(null), 3500);
    } else {
      setTurnAnnouncementFeedback(`❌ Falha ao anunciar: ${res.error || 'Verifique o bot'}`);
      setTimeout(() => setTurnAnnouncementFeedback(null), 4000);
    }
  };

  const handleAddCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombatantName.trim()) return;

    const matchedNpc = npcs.find(n => n.name.toLowerCase() === newCombatantName.trim().toLowerCase());
    const parsedInit = parseInt(newCombatantInit, 10) || Math.floor(Math.random() * 20) + 1;

    const item = {
      id: `init-${Date.now()}`,
      name: newCombatantName.trim(),
      init: parsedInit,
      hp: matchedNpc ? (matchedNpc.hp || 25) : 25,
      maxHp: matchedNpc ? (matchedNpc.maxHp || matchedNpc.hp || 25) : 25,
      isNpc: !!matchedNpc || true
    };

    const newList = [...initiativeList, item].sort((a, b) => b.init - a.init);
    setInitiativeList(newList);
    setNewCombatantName('');
    setNewCombatantInit('');
  };

  const handleNextTurn = () => {
    if (initiativeList.length === 0) return;
    const nextIdx = (activeTurnIdx + 1) % initiativeList.length;
    let nextRound = combatRound;
    if (nextIdx === 0) {
      nextRound = combatRound + 1;
      setCombatRound(nextRound);
    }
    setActiveTurnIdx(nextIdx);

    if (autoAnnounceTurn) {
      handleAnnounceTurn(initiativeList[nextIdx], nextRound);
    }
  };

  const handleRemoveCombatant = (id: string) => {
    setInitiativeList(prev => prev.filter(i => i.id !== id));
  };

  // --- Drag & Drop 2D Grid Positioning Handlers ---
  const handleDragStart = (e: React.DragEvent, id: MasterWidgetId) => {
    if (!isOrganizeMode) return;
    setDraggedWidgetId(id);
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleContainerDragOver = (e: React.DragEvent) => {
    if (!isOrganizeMode || !draggedWidgetId || !gridContainerRef.current) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = gridContainerRef.current.getBoundingClientRect();
    const relX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const relY = Math.max(0, e.clientY - rect.top);

    const colWidth = Math.max(10, rect.width / 12);
    const rawCol = Math.max(1, Math.min(12, Math.floor(relX / colWidth) + 1));

    const draggedWidget = widgets.find(w => w.id === draggedWidgetId);
    const widgetCols = draggedWidget ? getWidgetCols(draggedWidget) : 6;

    let snappedCol = rawCol;
    if (widgetCols === 4) { // 1/3
      if (rawCol <= 4) snappedCol = 1;
      else if (rawCol <= 8) snappedCol = 5;
      else snappedCol = 9;
    } else if (widgetCols === 6) { // 1/2
      if (rawCol <= 6) snappedCol = 1;
      else snappedCol = 7;
    } else { // 1/1
      snappedCol = 1;
    }

    const rowHeight = 220;
    const rawRow = Math.max(1, Math.floor(relY / rowHeight) + 1);

    setGridDropTarget({ col: snappedCol, row: rawRow, cols: widgetCols });
  };

  const handleContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedWidgetId || !gridDropTarget) {
      setDraggedWidgetId(null);
      setGridDropTarget(null);
      setDragOverWidgetId(null);
      return;
    }

    setWidgets(prev => prev.map(w => {
      if (w.id === draggedWidgetId) {
        return {
          ...w,
          colStart: gridDropTarget.col,
          rowStart: gridDropTarget.row
        };
      }
      return w;
    }));

    setDraggedWidgetId(null);
    setGridDropTarget(null);
    setDragOverWidgetId(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: MasterWidgetId) => {
    if (!isOrganizeMode || !draggedWidgetId) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Calculate whether cursor is in top half (before) or bottom half (after) of target element for magnetic snapping
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = targetRect.top + targetRect.height / 2;
    const isBefore = e.clientY < midY;

    setDropSlotPosition(isBefore ? 'before' : 'after');

    if (dragOverWidgetId !== targetId) {
      setDragOverWidgetId(targetId);
    }
  };

  const handleDragLeave = () => {
    // Keep target until actual leave
  };

  const handleDrop = (e: React.DragEvent, targetId: MasterWidgetId) => {
    e.preventDefault();
    if (!draggedWidgetId) return;

    if (gridDropTarget) {
      handleContainerDrop(e);
      return;
    }

    if (draggedWidgetId === targetId) {
      setDraggedWidgetId(null);
      setDragOverWidgetId(null);
      return;
    }

    const currentIdx = widgets.findIndex(w => w.id === draggedWidgetId);
    let targetIdx = widgets.findIndex(w => w.id === targetId);

    if (currentIdx !== -1 && targetIdx !== -1) {
      const updated = [...widgets];
      const [removed] = updated.splice(currentIdx, 1);

      targetIdx = updated.findIndex(w => w.id === targetId);
      const insertIdx = dropSlotPosition === 'before' ? targetIdx : targetIdx + 1;

      updated.splice(insertIdx, 0, removed);
      setWidgets(updated);
    }

    setDraggedWidgetId(null);
    setDragOverWidgetId(null);
  };

  const handleDragEnd = () => {
    setDraggedWidgetId(null);
    setGridDropTarget(null);
    setDragOverWidgetId(null);
  };

  // --- Widget Dimensions & 2D Grid Positioning Helpers ---
  const getWidgetCols = (widget: MasterWidgetConfig): number => {
    if (widget.cols === 4 || widget.width === 'third') return 4;
    if (widget.cols === 6 || widget.width === 'half') return 6;
    if (widget.cols === 12 || widget.width === 'full') return 12;

    if (typeof widget.cols === 'number') {
      if (widget.cols <= 5) return 4;
      if (widget.cols <= 9) return 6;
      return 12;
    }
    if (typeof widget.width === 'number') {
      if (widget.width <= 5) return 4;
      if (widget.width <= 9) return 6;
      return 12;
    }
    if (widget.width === 'quarter') return 4;
    if (widget.width === 'two_thirds' || widget.width === 'three_quarters') return 6;
    return 6;
  };

  const getWidgetSizeBadgeText = (widget: MasterWidgetConfig): string => {
    const cols = getWidgetCols(widget);
    if (cols <= 4) return '1/3';
    if (cols <= 6) return '1/2';
    return '1/1';
  };

  const shiftWidgetCol = (id: string, direction: 'left' | 'right') => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      const cols = getWidgetCols(w);
      const currentCol = w.colStart || 1;
      let newCol = currentCol;

      if (cols === 4) { // 1/3 layout (slots 1, 5, 9)
        if (direction === 'left') {
          newCol = currentCol > 5 ? 5 : 1;
        } else {
          newCol = currentCol < 5 ? 5 : 9;
        }
      } else if (cols === 6) { // 1/2 layout (slots 1, 7)
        if (direction === 'left') {
          newCol = 1;
        } else {
          newCol = 7;
        }
      } else {
        newCol = 1;
      }

      return { ...w, colStart: newCol };
    }));
  };

  const shiftWidgetRow = (id: string, delta: number) => {
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      const currentRow = w.rowStart || 1;
      const newRow = Math.max(1, currentRow + delta);
      return { ...w, rowStart: newRow };
    }));
  };

  const setWidgetDirectCol = (id: string, colStart: number) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, colStart } : w));
  };

  const clearWidgetPosition = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, colStart: undefined, rowStart: undefined } : w));
  };

  const autoAlignAllGridWidgets = () => {
    setWidgets(prev => prev.map(w => ({ ...w, colStart: undefined, rowStart: undefined })));
  };

  const moveWidget = (id: string, direction: 'up' | 'down') => {
    const idx = widgets.findIndex(w => w.id === id);
    if (idx === -1) return;
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= widgets.length) return;

    const updated = [...widgets];
    const temp = updated[idx];
    updated[idx] = updated[targetIdx];
    updated[targetIdx] = temp;
    setWidgets(updated);
  };

  const setWidgetWidth = (id: string, width: WidgetWidth) => {
    const cols = width === 'third' ? 4 : width === 'full' ? 12 : 6;
    setWidgets(prev => prev.map(w => {
      if (w.id !== id) return w;
      let newColStart = w.colStart;
      if (cols === 12) newColStart = 1;
      else if (cols === 6 && newColStart && newColStart > 7) newColStart = 7;
      else if (cols === 4 && newColStart && newColStart > 9) newColStart = 9;
      return { ...w, width, cols, colStart: newColStart };
    }));
  };

  const setWidgetHeight = (id: string, height: WidgetHeight) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, height, customHeight: undefined } : w));
  };

  // Universal Drag-to-Resize Handler (Horizontal: strictly 1/3, 1/2, 1/1; Vertical: 20px increments)
  const handleStartResize = (
    e: React.MouseEvent,
    widgetId: string,
    mode: 'horizontal' | 'vertical' | 'both'
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startY = e.clientY;

    const currentWidget = widgets.find(w => w.id === widgetId);
    const initialCols = currentWidget ? getWidgetCols(currentWidget) : 6;

    const targetElement = document.getElementById(`master-widget-${widgetId}`);
    const initialHeight = targetElement ? targetElement.getBoundingClientRect().height : 380;

    const containerWidth = gridContainerRef.current
      ? gridContainerRef.current.getBoundingClientRect().width
      : (typeof window !== 'undefined' ? (window.innerWidth > 1280 ? 1200 : window.innerWidth - 48) : 1200);

    const colWidth = Math.max(20, containerWidth / 12);

    const onMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      // Horizontal calculation (strictly whitelisted snap to 1/3 = 4 cols, 1/2 = 6 cols, 1/1 = 12 cols)
      if (mode === 'horizontal' || mode === 'both') {
        const addedCols = deltaX / colWidth;
        const rawCols = initialCols + addedCols;
        let snappedCols: number = 6;
        let snappedWidth: WidgetWidth = 'half';

        if (rawCols <= 5) {
          snappedCols = 4; // 1/3
          snappedWidth = 'third';
        } else if (rawCols <= 9) {
          snappedCols = 6; // 1/2
          snappedWidth = 'half';
        } else {
          snappedCols = 12; // 1/1
          snappedWidth = 'full';
        }

        setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, cols: snappedCols, width: snappedWidth } : w));
      }

      // Vertical calculation (snapped to 20px increments)
      if (mode === 'vertical' || mode === 'both') {
        const rawHeight = Math.max(140, Math.min(1600, initialHeight + deltaY));
        const snappedHeight = Math.round(rawHeight / 20) * 20;
        setWidgets(prev => prev.map(w => w.id === widgetId ? { ...w, height: 'custom', customHeight: snappedHeight } : w));
      }
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const setWidgetDensity = (id: string, density: WidgetDensity) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, density } : w));
  };

  const toggleWidgetVisibility = (id: string) => {
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: !w.visible } : w));
  };

  const addWidget = (catalogItem: WidgetCatalogItem) => {
    const existingSameType = widgets.filter(w => w.type === catalogItem.type);
    if (!catalogItem.allowMultiple && existingSameType.length > 0) {
      // Unhide single-instance widget if hidden
      setWidgets(prev => prev.map(w => w.type === catalogItem.type ? { ...w, visible: true } : w));
      setIsAddWidgetModalOpen(false);
      return;
    }

    const timestamp = Date.now();
    const instanceNumber = existingSameType.length + 1;
    const newInstanceTitle = catalogItem.allowMultiple && instanceNumber > 1
      ? `${catalogItem.defaultTitle} #${instanceNumber}`
      : catalogItem.defaultTitle;

    const newWidget: MasterWidgetConfig = {
      id: `${catalogItem.type}-${timestamp}`,
      type: catalogItem.type,
      title: newInstanceTitle,
      visible: true,
      cols: catalogItem.defaultWidth === 'full' ? 12 : catalogItem.defaultWidth === 'third' ? 4 : 6,
      width: catalogItem.defaultWidth,
      density: catalogItem.defaultDensity,
      storageKey: `caranguejo_${catalogItem.type}_${timestamp}`,
      isRemovable: true
    };

    setWidgets(prev => [newWidget, ...prev]);
    setIsAddWidgetModalOpen(false);
  };

  const removeWidget = (id: string) => {
    const target = widgets.find(w => w.id === id);
    if (!target) return;
    const sameTypeCount = widgets.filter(w => w.type === target.type).length;
    if (target.isRemovable || sameTypeCount > 1 || target.type === 'spacer') {
      setWidgets(prev => prev.filter(w => w.id !== id));
    } else {
      setWidgets(prev => prev.map(w => w.id === id ? { ...w, visible: false } : w));
    }
  };

  const renameWidget = (id: string, newTitle: string) => {
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, title: trimmed } : w));
    setEditingTitleWidgetId(null);
  };

  const applyPreset = (presetKey: string) => {
    const preset = PRESETS[presetKey];
    if (preset) {
      setWidgets(preset.layout);
    }
  };

  const resetToDefaultLayout = () => {
    setWidgets(DEFAULT_WIDGETS_CONFIG);
  };

  // --- Clean Widget Header Controls Component ---
  const renderWidgetHeaderControls = (widget: MasterWidgetConfig, badgeText?: string) => {
    const sameTypeCount = widgets.filter(w => w.type === widget.type).length;
    const canDelete = widget.isRemovable || sameTypeCount > 1 || widget.type === 'spacer';
    const sizeBadge = getWidgetSizeBadgeText(widget);

    // In Normal Mode (Organize Mode OFF), keep header clean and uncluttered
    if (!isOrganizeMode) {
      return (
        <div className="flex items-center gap-1.5 shrink-0">
          {badgeText && (
            <span className="hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-md bg-[#141619] text-[#9E9E9E] border border-[#2D3139] font-mono">
              {badgeText}
            </span>
          )}

          {/* Quick Density & Focus Buttons */}
          <button
            type="button"
            onClick={() => setWidgetDensity(widget.id, widget.density === 'minimized' ? 'expanded' : 'minimized')}
            className="p-1 text-[#9E9E9E] hover:text-white rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title={widget.density === 'minimized' ? 'Expandir painel' : 'Minimizar painel'}
          >
            {widget.density === 'minimized' ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          <button
            type="button"
            onClick={() => setFocusedWidgetId(widget.id)}
            className="p-1 text-[#9E9E9E] hover:text-indigo-400 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Modo Foco em Tela Cheia"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      );
    }

    // In Organize Mode (Edit Mode ON), show clean controls: live grid coordinates, column/row shifts, rename, density toggle, and remove/hide
    const widgetCols = getWidgetCols(widget);
    const hasFixedPosition = typeof widget.colStart === 'number' || typeof widget.rowStart === 'number';

    return (
      <div className="flex items-center gap-1.5 shrink-0 animate-fadeIn flex-wrap justify-end">
        {/* Live 2D Grid Coordinate & Size Badge */}
        <span
          className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono font-bold flex items-center gap-1"
          title={`Largura: ${sizeBadge} (${widgetCols}/12 colunas)${widget.colStart ? ` • Coluna Inicial: ${widget.colStart}` : ''}${widget.rowStart ? ` • Linha: ${widget.rowStart}` : ''}`}
        >
          <MapPin className="w-2.5 h-2.5" />
          <span>{sizeBadge}</span>
          <span className="text-amber-400/70">•</span>
          <span>Col {widget.colStart || 'auto'}</span>
          {widget.rowStart && <span>, L{widget.rowStart}</span>}
          {widget.customHeight ? <span className="text-amber-200">({widget.customHeight}px)</span> : null}
        </span>

        {/* 2D Horizontal Column Alignment Quick Switches */}
        {widgetCols === 4 && (
          <div className="flex items-center bg-[#141619] rounded-md p-0.5 border border-[#2D3139] text-[9px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setWidgetDirectCol(widget.id, 1)}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${widget.colStart === 1 ? 'bg-amber-500 text-black' : 'text-[#9E9E9E] hover:text-white'}`}
              title="Posicionar na 1ª Coluna (Esquerda)"
            >
              1/3
            </button>
            <button
              type="button"
              onClick={() => setWidgetDirectCol(widget.id, 5)}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${widget.colStart === 5 ? 'bg-amber-500 text-black' : 'text-[#9E9E9E] hover:text-white'}`}
              title="Posicionar na 2ª Coluna (Centro)"
            >
              2/3
            </button>
            <button
              type="button"
              onClick={() => setWidgetDirectCol(widget.id, 9)}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${widget.colStart === 9 ? 'bg-amber-500 text-black' : 'text-[#9E9E9E] hover:text-white'}`}
              title="Posicionar na 3ª Coluna (Direita)"
            >
              3/3
            </button>
          </div>
        )}

        {widgetCols === 6 && (
          <div className="flex items-center bg-[#141619] rounded-md p-0.5 border border-[#2D3139] text-[9px] font-mono font-bold">
            <button
              type="button"
              onClick={() => setWidgetDirectCol(widget.id, 1)}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${widget.colStart === 1 ? 'bg-amber-500 text-black' : 'text-[#9E9E9E] hover:text-white'}`}
              title="Posicionar na Metade Esquerda"
            >
              Esq
            </button>
            <button
              type="button"
              onClick={() => setWidgetDirectCol(widget.id, 7)}
              className={`px-1.5 py-0.5 rounded transition-colors cursor-pointer ${widget.colStart === 7 ? 'bg-amber-500 text-black' : 'text-[#9E9E9E] hover:text-white'}`}
              title="Posicionar na Metade Direita"
            >
              Dir
            </button>
          </div>
        )}

        {/* Column Left/Right Shift Buttons */}
        <div className="flex items-center bg-[#141619] rounded-md p-0.5 border border-[#2D3139]">
          <button
            type="button"
            onClick={() => shiftWidgetCol(widget.id, 'left')}
            className="p-1 text-[#9E9E9E] hover:text-amber-300 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Mover Coluna para a Esquerda"
          >
            <ArrowLeft className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => shiftWidgetCol(widget.id, 'right')}
            className="p-1 text-[#9E9E9E] hover:text-amber-300 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Mover Coluna para a Direita"
          >
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {/* Row Up/Down Shift Buttons */}
        <div className="flex items-center bg-[#141619] rounded-md p-0.5 border border-[#2D3139]">
          <button
            type="button"
            onClick={() => shiftWidgetRow(widget.id, -1)}
            className="p-1 text-[#9E9E9E] hover:text-amber-300 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Mover Linha para Cima"
          >
            <ArrowUp className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => shiftWidgetRow(widget.id, 1)}
            className="p-1 text-[#9E9E9E] hover:text-amber-300 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Mover Linha para Baixo"
          >
            <ArrowDown className="w-3 h-3" />
          </button>
        </div>

        {/* Clear Fixed Coordinate to Auto-Flow */}
        {hasFixedPosition && (
          <button
            type="button"
            onClick={() => clearWidgetPosition(widget.id)}
            className="px-1.5 py-0.5 rounded text-[9px] bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-colors cursor-pointer"
            title="Remover posição fixa na grade e voltar ao fluxo automático"
          >
            Auto
          </button>
        )}

        {/* Rename Title Button */}
        {widget.type !== 'spacer' && (
          <button
            type="button"
            onClick={() => {
              setEditingTitleWidgetId(widget.id);
              setTempWidgetTitle(widget.title);
            }}
            className="p-1 text-[#9E9E9E] hover:text-amber-400 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Renomear Título deste Bloco"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Height / Density Toggle: Expanded, Compact, Minimized */}
        <div className="flex items-center bg-[#141619] rounded-lg p-0.5 border border-[#2D3139]">
          {widget.density === 'minimized' ? (
            <button
              type="button"
              onClick={() => setWidgetDensity(widget.id, 'expanded')}
              className="p-1 text-indigo-400 hover:text-white rounded hover:bg-[#22262B] transition-colors cursor-pointer"
              title="Expandir painel"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setWidgetDensity(widget.id, widget.density === 'compact' ? 'expanded' : 'compact')}
                className={`p-1 rounded text-[10px] transition-colors cursor-pointer ${
                  widget.density === 'compact'
                    ? 'bg-indigo-600/40 text-indigo-300'
                    : 'text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
                }`}
                title={widget.density === 'compact' ? 'Modo Expandido' : 'Modo Compacto'}
              >
                {widget.density === 'compact' ? <Layers className="w-3 h-3" /> : <Columns className="w-3 h-3" />}
              </button>
              <button
                type="button"
                onClick={() => setWidgetDensity(widget.id, 'minimized')}
                className="p-1 text-[#9E9E9E] hover:text-white rounded hover:bg-[#22262B] transition-colors cursor-pointer"
                title="Minimizar painel"
              >
                <ChevronUp className="w-3 h-3" />
              </button>
            </>
          )}
        </div>

        {/* Remove or Hide Widget */}
        {canDelete ? (
          <button
            type="button"
            onClick={() => removeWidget(widget.id)}
            className="p-1.5 text-[#6E7681] hover:text-rose-400 rounded-lg hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Excluir este bloco"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          </button>
        ) : (
          <button
            type="button"
            onClick={() => toggleWidgetVisibility(widget.id)}
            className="p-1.5 text-[#6E7681] hover:text-amber-400 rounded-lg hover:bg-[#22262B] transition-colors cursor-pointer"
            title="Ocultar este painel (reativável na Central de Personalização)"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    );
  };

  // --- Render Individual Widgets ---
  const renderWidgetContent = (widget: MasterWidgetConfig, isModal = false) => {
    const isMinimized = widget.density === 'minimized' && !isModal;
    const isCompact = widget.density === 'compact' && !isModal;

    switch (widget.type || widget.id) {
      case 'stats_summary':
        return (
          <div className={`bg-[#1A1D21] border border-[#2D3139] rounded-2xl shadow-lg transition-all ${
            isMinimized ? 'p-3' : isCompact ? 'p-3.5' : 'p-4 md:p-5'
          }`}>
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Resumo da Mesa & Estatísticas'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] flex items-center justify-between">
                <span>Estatísticas recolhidas: {savedSessions.length} saves • {npcs.length} NPCs • {queue.length} faixas</span>
                <button
                  type="button"
                  onClick={() => setWidgetDensity(widget.id, 'expanded')}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-xs"
                >
                  Expandir
                </button>
              </div>
            ) : (
              <SummaryStatsWidget
                onOpenSessionModal={onOpenSessionModal}
                onOpenNpcTab={onOpenNpcTab}
                onOpenMusicTab={onOpenMusicTab}
              />
            )}
          </div>
        );

      case 'image_viewer':
        return (
          <div className={`bg-[#1A1D21] border border-[#2D3139] rounded-2xl shadow-lg transition-all ${
            isMinimized ? 'p-3' : isCompact ? 'p-3.5' : 'p-4 md:p-5'
          }`}>
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Cenários, Mapas & Handouts'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] flex items-center justify-between">
                <span>Galeria de mapas e cenários visuais recolhida.</span>
                <button
                  type="button"
                  onClick={() => setWidgetDensity(widget.id, 'expanded')}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-xs"
                >
                  Exibir
                </button>
              </div>
            ) : (
              <MasterImageViewerWidget
                storageKey={widget.storageKey}
                defaultCategory={widget.customConfig?.defaultCategory}
              />
            )}
          </div>
        );

      case 'session_bar':
        return (
          <div className={`bg-[#1A1D21] border border-[#2D3139] rounded-2xl shadow-md transition-all ${
            isMinimized ? 'p-3' : 'px-5 py-3'
          }`}>
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                  <HardDrive className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">Sessão da Mesa & Backup Local</span>
                    <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
                      {savedSessions.length} Save(s) Armazenados
                    </span>
                  </div>
                  {!isMinimized && (
                    <p className="text-[11px] text-[#9E9E9E] truncate">
                      O estado da mesa (fila, soundboard, NPCs e notas) é salvo na pasta <code className="text-indigo-300 font-mono">data/saves/</code>.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  onClick={onOpenSessionModal}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <FolderDown className="w-3.5 h-3.5" />
                  Gerenciar Saves
                </button>
                {!isModal && renderWidgetHeaderControls(widget)}
              </div>
            </div>
          </div>
        );

      case 'now_playing':
        return (
          <div className={`bg-[#1A1D21] border border-[#2D3139] rounded-2xl shadow-lg transition-all ${
            isMinimized ? 'p-3' : isCompact ? 'p-3.5' : 'p-4 md:p-5'
          }`}>
            <div className="flex items-center justify-between mb-3 border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Tocando Agora
                </h2>
                {playbackState === 'playing' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded animate-pulse">
                    EM REPRODUÇÃO
                  </span>
                )}
              </div>
              {!isModal && renderWidgetHeaderControls(widget, currentTrack?.title)}
            </div>

            {isMinimized ? (
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-white font-bold truncate">
                  {currentTrack?.title || 'Nenhuma música tocando'}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={togglePlayPause}
                    className="p-1.5 rounded-full bg-indigo-600 text-white cursor-pointer"
                  >
                    {playbackState === 'playing' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
                {/* Track Info */}
                <div className="flex items-center gap-3.5 w-full lg:w-auto min-w-0">
                  <div className="relative w-12 h-12 md:w-14 md:h-14 rounded-xl overflow-hidden bg-[#141619] shrink-0 border border-[#2D3139]">
                    {currentTrack?.coverUrl ? (
                      <img
                        src={currentTrack.coverUrl}
                        alt={currentTrack.title}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-[#141619] text-indigo-400">
                        <Flame className="w-6 h-6" />
                      </div>
                    )}
                    {playbackState === 'playing' && (
                      <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-[1px] flex items-center justify-center">
                        <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
                        {playbackState === 'playing' ? 'Tocando' : 'Pausado'}
                      </span>
                      {botStatus.isOnline ? (
                        <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                          <Radio className="w-3 h-3 text-emerald-400" />
                          Discord Bot
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                          Discord Offline
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={toggleLocalAudio}
                        className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer ${
                          isLocalAudioEnabled
                            ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 hover:bg-purple-900/60'
                            : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white hover:border-[#4B5263]'
                        }`}
                        title={isLocalAudioEnabled ? 'Clique para silenciar áudio local' : 'Clique para ouvir preview do áudio'}
                      >
                        <Headphones className="w-3 h-3" />
                        {isLocalAudioEnabled ? 'Navegador (ON)' : 'Local OFF'}
                      </button>
                    </div>

                    <h3 className="text-sm md:text-base font-bold text-[#FFFFFF] truncate mt-1">
                      {currentTrack?.title || 'Nenhuma música selecionada'}
                    </h3>
                    <p className="text-xs text-[#9E9E9E] truncate">
                      {currentTrack?.artist || 'Bardos & Trilha de RPG'}
                    </p>
                  </div>
                </div>

                {/* Controls & Scrubber */}
                <div className="flex flex-col items-center gap-2 w-full lg:w-80">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={skipPrevious}
                      className="p-1.5 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                      title="Música Anterior"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>

                    <button
                      id="master-play-pause-btn"
                      onClick={togglePlayPause}
                      className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                      title={playbackState === 'playing' ? 'Pausar Música' : 'Tocar Música'}
                    >
                      {playbackState === 'playing' ? (
                        <Pause className="w-4 h-4 fill-current" />
                      ) : (
                        <Play className="w-4 h-4 fill-current translate-x-0.5" />
                      )}
                    </button>

                    <button
                      onClick={stopTrack}
                      className="p-1.5 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                      title="Parar Música"
                    >
                      <Square className="w-4 h-4" />
                    </button>

                    <button
                      onClick={skipNext}
                      className="p-1.5 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                      title="Próxima Música"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>

                    <button
                      onClick={onOpenMusicTab}
                      className="ml-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                    >
                      Player →
                    </button>
                  </div>

                  <div className="w-full">
                    <AudioScrubber
                      currentTime={currentTime}
                      duration={duration}
                      fallbackDuration={currentTrack?.duration}
                      onSeek={seek}
                      formatTime={formatTime}
                      size="sm"
                    />
                  </div>
                </div>

                {/* Queue Link */}
                <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
                  <button
                    onClick={onOpenMusicTab}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#141619] hover:bg-[#22262B] text-xs font-semibold text-[#E0E0E0] border border-[#2D3139] transition-colors shadow-sm cursor-pointer"
                  >
                    <ListMusic className="w-4 h-4 text-indigo-400" />
                    Fila ({queue.length})
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'timers':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <FlameKindling className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Temporizadores & Cronômetro
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Temporizadores recolhidos. Clique em expandir para ver contagens e tochas ativas.
              </div>
            ) : (
              <MultiTimersWidget />
            )}
          </div>
        );

      case 'notepad':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Bloco de Notas Multiabas'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Bloco de notas recolhido. Suas abas e segredos estão sincronizados.
              </div>
            ) : (
              <MultiTabNotepad
                storageKey={widget.storageKey}
                defaultTabs={widget.customConfig?.defaultTabs}
              />
            )}
          </div>
        );

      case 'dice_roller':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Dices className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Rolador de Dados
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[#141619] p-0.5 rounded-lg border border-[#2D3139]">
                  <button
                    onClick={() => setDiceSystem('wod')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      diceSystem === 'wod' ? 'bg-indigo-600 text-white' : 'text-[#9E9E9E]'
                    }`}
                  >
                    WoD
                  </button>
                  <button
                    onClick={() => setDiceSystem('standard')}
                    className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all cursor-pointer ${
                      diceSystem === 'standard' ? 'bg-indigo-600 text-white' : 'text-[#9E9E9E]'
                    }`}
                  >
                    D&D
                  </button>
                </div>
                {!isModal && renderWidgetHeaderControls(widget, diceSystem === 'wod' ? `WoD ${wodDiceCount}d10` : `d${diceSides}`)}
              </div>
            </div>

            {isMinimized ? (
              <div className="flex items-center justify-between text-xs text-[#9E9E9E]">
                <span>Sistema ativo: {diceSystem === 'wod' ? 'Mundo das Trevas (d10)' : 'D&D Standard'}</span>
                <button
                  type="button"
                  onClick={diceSystem === 'wod' ? handleRollWod : () => handleRollDice()}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                >
                  Rolar Rápido
                </button>
              </div>
            ) : (
              <>
                {/* Broadcast Checkbox */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#9E9E9E]">
                    {diceSystem === 'wod' ? 'Regra 10s explodem • 1s anulam' : 'Notação: NdX+Mod'}
                  </span>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#9E9E9E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={broadcastDice}
                      onChange={(e) => setBroadcastDice(e.target.checked)}
                      className="rounded bg-[#141619] border-[#2D3139] text-indigo-600 focus:ring-0"
                    />
                    Enviar ao Discord
                  </label>
                </div>

                {/* WoD System Panel */}
                {diceSystem === 'wod' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="text-[10px] font-bold text-[#9E9E9E] uppercase block mb-1">
                          Parada de Dados (d10)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={wodDiceCount}
                          onChange={(e) => setWodDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-[#9E9E9E] uppercase block mb-1">
                          Regra de Críticos
                        </label>
                        <button
                          type="button"
                          onClick={() => setWodIsKeen(!wodIsKeen)}
                          className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            wodIsKeen
                              ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-sm'
                              : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white'
                          }`}
                        >
                          {wodIsKeen ? '9 e 10 (\\kr)' : 'Apenas 10 (\\r)'}
                        </button>
                      </div>
                    </div>

                    <input
                      type="text"
                      placeholder="Ação / Teste (Ex: Furtividade)..."
                      value={wodLabel}
                      onChange={(e) => setWodLabel(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                    />

                    <button
                      type="button"
                      onClick={handleRollWod}
                      disabled={isWodRolling}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Dices className="w-4 h-4" />
                      {isWodRolling ? 'Rolando...' : `Rolar ${wodDiceCount}d10 (${wodIsKeen ? '\\kr' : '\\r'})`}
                    </button>

                    {lastWodRoll && (
                      <div className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{lastWodRoll.command}</span>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                            lastWodRoll.totalCriticalFails > 0 && lastWodRoll.totalSuccesses === 0
                              ? 'bg-rose-950/80 text-rose-400 border border-rose-600/40'
                              : lastWodRoll.totalSuccesses >= 5
                              ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                              : lastWodRoll.totalSuccesses > 0
                              ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                              : 'bg-[#242830] text-[#9E9E9E]'
                          }`}>
                            {lastWodRoll.totalCriticalFails > 0 && lastWodRoll.totalSuccesses === 0
                              ? 'Falha Crítica (Botch)'
                              : lastWodRoll.totalSuccesses >= 5
                              ? 'Sucesso Excepcional'
                              : lastWodRoll.totalSuccesses > 0
                              ? `${lastWodRoll.totalSuccesses} Sucesso(s)`
                              : 'Falha'}
                          </span>
                        </div>

                        <div className="flex items-center justify-around py-1.5 bg-[#0F1113] rounded-lg border border-[#2D3139]">
                          <div className="text-center">
                            <span className="text-[9px] text-[#9E9E9E] block">Sucessos</span>
                            <span className="text-lg font-bold font-mono text-emerald-400">{lastWodRoll.totalSuccesses}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-[#9E9E9E] block">Críticos</span>
                            <span className="text-lg font-bold font-mono text-amber-400">{lastWodRoll.totalCriticalHits}</span>
                          </div>
                          <div className="text-center">
                            <span className="text-[9px] text-[#9E9E9E] block">1s</span>
                            <span className="text-lg font-bold font-mono text-rose-400">{lastWodRoll.totalCriticalFails}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 flex-wrap text-xs">
                          {lastWodRoll.baseRolls.map((val, i) => (
                            <span
                              key={i}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                                val >= lastWodRoll.critThreshold
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  : val >= lastWodRoll.successThreshold
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : val === 1
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-[#242830] text-[#9E9E9E]'
                              }`}
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Standard System Panel */}
                {diceSystem === 'standard' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-7 gap-1">
                      {[4, 6, 8, 10, 12, 20, 100].map((d) => (
                        <button
                          key={d}
                          onClick={() => {
                            setDiceSides(d);
                            handleRollDice(d, diceCount);
                          }}
                          className={`py-1.5 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                            diceSides === d
                              ? 'bg-indigo-600 text-white border-indigo-400 shadow-md scale-105'
                              : 'bg-[#141619] text-[#E0E0E0] border-[#2D3139] hover:bg-[#22262B]'
                          }`}
                        >
                          d{d}
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#9E9E9E] block mb-1">Quantidade</label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={diceCount}
                          onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                          className="w-full bg-[#141619] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-[#E0E0E0] text-center font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-[#9E9E9E] block mb-1">Modificador</label>
                        <input
                          type="number"
                          value={diceModifier}
                          onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                          className="w-full bg-[#141619] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-[#E0E0E0] text-center font-mono focus:border-indigo-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRollDice()}
                      disabled={isRolling}
                      className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Dices className="w-4 h-4" />
                      {isRolling ? 'Rolando...' : `Rolar ${diceCount}d${diceSides}${diceModifier > 0 ? `+${diceModifier}` : diceModifier < 0 ? `${diceModifier}` : ''}`}
                    </button>

                    {lastRoll && (
                      <div className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-white">{lastRoll.notation}</span>
                          <span className="text-lg font-black font-mono text-indigo-400">{lastRoll.total}</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap text-xs text-[#9E9E9E]">
                          <span>Dados: [{lastRoll.rolls.join(', ')}]</span>
                          {lastRoll.modifier !== 0 && <span>Mod: {lastRoll.modifier > 0 ? `+${lastRoll.modifier}` : lastRoll.modifier}</span>}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        );

      case 'initiative':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-rose-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Iniciativa & Combate
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-[#141619] text-[#9E9E9E] font-mono border border-[#2D3139]">
                  Rodada {combatRound}
                </span>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="flex items-center justify-between text-xs text-[#9E9E9E]">
                <span>Combatente Atual: <strong className="text-white">{initiativeList[activeTurnIdx]?.name || 'Nenhum'}</strong></span>
                <button
                  type="button"
                  onClick={handleNextTurn}
                  className="px-2.5 py-1 rounded bg-indigo-600 text-white font-bold text-xs cursor-pointer"
                >
                  Próximo Turno →
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Announcement Feedback Banner */}
                {turnAnnouncementFeedback && (
                  <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-500/40 text-indigo-200 text-xs flex items-center justify-between animate-fadeIn">
                    <span className="font-bold">{turnAnnouncementFeedback}</span>
                    <span className="text-[10px] opacity-75 font-mono">Discord Sync</span>
                  </div>
                )}

                {/* Combatants List */}
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {initiativeList.map((item, idx) => {
                    const isActive = idx === activeTurnIdx;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setActiveTurnIdx(idx)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer ${
                          isActive
                            ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500 shadow-md'
                            : 'bg-[#141619] border-[#2D3139] hover:border-[#3D424E]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-mono font-bold text-xs ${
                            isActive ? 'bg-indigo-600 text-white' : 'bg-[#22262B] text-[#9E9E9E]'
                          }`}>
                            {item.init}
                          </span>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                              {item.name}
                              {item.isNpc && (
                                <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950/50 text-rose-300 border border-rose-800/40">
                                  NPC
                                </span>
                              )}
                            </h4>
                            <span className="text-[10px] text-[#9E9E9E]">
                              PV: {item.hp}/{item.maxHp}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {isActive && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAnnounceTurn(item);
                              }}
                              disabled={isAnnouncingTurn}
                              className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[10px] flex items-center gap-1 shadow-sm cursor-pointer"
                              title="Anunciar turno deste combatente no Discord"
                            >
                              <Megaphone className="w-3 h-3" />
                              <span className="hidden sm:inline">Anunciar</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCombatant(item.id);
                            }}
                            className="p-1 text-[#6E7681] hover:text-rose-400 rounded hover:bg-[#22262B] transition-colors cursor-pointer"
                            title="Remover do Combate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Combatant Form */}
                <form onSubmit={handleAddCombatant} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Nome do Combatente / NPC..."
                    value={newCombatantName}
                    onChange={(e) => setNewCombatantName(e.target.value)}
                    className="flex-1 bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Inic."
                    value={newCombatantInit}
                    onChange={(e) => setNewCombatantInit(e.target.value)}
                    className="w-16 bg-[#141619] border border-[#2D3139] rounded-xl px-2 py-1.5 text-xs text-white text-center font-mono focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shrink-0 cursor-pointer"
                  >
                    + Add
                  </button>
                </form>

                {/* Action Controls */}
                <div className="flex items-center justify-between pt-1 gap-2">
                  <label className="flex items-center gap-1.5 text-[11px] text-[#9E9E9E] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoAnnounceTurn}
                      onChange={(e) => setAutoAnnounceTurn(e.target.checked)}
                      className="rounded bg-[#141619] border-[#2D3139] text-indigo-600 focus:ring-0"
                    />
                    Auto-Anunciar no Discord
                  </label>

                  <button
                    type="button"
                    onClick={handleNextTurn}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Próximo Turno</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        );

      case 'soundboard':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Soundboard do Mestre
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenSoundboardTab}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Ver Todos ({soundboardItems.length}) →
                </button>
                {!isModal && renderWidgetHeaderControls(widget)}
              </div>
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] flex items-center justify-between">
                <span>{soundboardItems.length} efeitos sonoros disponíveis.</span>
                <button
                  type="button"
                  onClick={() => setWidgetDensity(widget.id, 'expanded')}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-xs"
                >
                  Expandir
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {soundboardItems.slice(0, 8).map((sfx) => {
                  const isPlaying = activeSfxIds.includes(sfx.id);
                  return (
                    <button
                      key={sfx.id}
                      onClick={() => playSoundboard(sfx)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-center transition-all cursor-pointer ${
                        isPlaying
                          ? 'bg-amber-600/30 border-amber-500 text-amber-300 shadow-md ring-1 ring-amber-500 scale-105'
                          : 'bg-[#141619] border-[#2D3139] text-[#E0E0E0] hover:bg-[#22262B] hover:border-indigo-500/40'
                      }`}
                    >
                      <span className="text-xl">{sfx.icon || '🔊'}</span>
                      <span className="text-[11px] font-bold truncate w-full">
                        {sfx.title}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'narrative':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Narração Direta para o Discord
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Painel de narração recolhido. Envie descrições dramáticas direto para o canal de texto.
              </div>
            ) : (
              <form onSubmit={handleSendNarrative} className="space-y-2.5">
                <textarea
                  rows={3}
                  value={narrativeText}
                  onChange={(e) => setNarrativeText(e.target.value)}
                  placeholder="Escreva uma descrição de cena dramática para aparecer em destaque no Discord..."
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-3 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none resize-none"
                />

                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] text-[#9E9E9E]">
                    Aparece formatado com moldura dourada no Discord.
                  </span>

                  <div className="flex items-center gap-2">
                    {narrativeFeedback.status === 'success' && (
                      <span className="text-xs text-emerald-400 flex items-center gap-1 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Enviado!
                      </span>
                    )}
                    {narrativeFeedback.status === 'error' && (
                      <span className="text-xs text-rose-400 flex items-center gap-1 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        {narrativeFeedback.msg}
                      </span>
                    )}

                    <button
                      type="submit"
                      disabled={isSendingNarrative || !narrativeText.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center gap-1.5 disabled:opacity-40 transition-all cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isSendingNarrative ? 'Enviando...' : 'Narrar ao Discord'}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        );

      case 'npc_spotlight':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  NPCs em Destaque
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenNpcTab}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                >
                  Ver Catálogo ({npcs.length}) →
                </button>
                {!isModal && renderWidgetHeaderControls(widget)}
              </div>
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] flex items-center justify-between">
                <span>{npcs.length} personagens no catálogo.</span>
                <button
                  type="button"
                  onClick={() => setWidgetDensity(widget.id, 'expanded')}
                  className="text-indigo-400 hover:text-indigo-300 font-bold text-xs"
                >
                  Expandir
                </button>
              </div>
            ) : (
              <div className={`grid gap-3 ${
                widget.width === 'full'
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2'
              }`}>
                {npcs.slice(0, widget.width === 'full' ? 3 : 2).map((npc) => {
                  const isRevealed = !!revealedNpcSecrets[npc.id];
                  const isPosting = postingNpcId === npc.id;

                  return (
                    <div
                      key={npc.id}
                      className="bg-[#141619] border border-[#2D3139] rounded-xl p-3 flex flex-col justify-between hover:border-[#363B44] transition-colors group shadow-sm"
                    >
                      <div>
                        <div className="flex items-start gap-2.5 mb-2">
                          <img
                            src={npc.imageUrl}
                            alt={npc.name}
                            className="w-12 h-12 rounded-lg object-cover border border-[#2D3139] shrink-0"
                            referrerPolicy="no-referrer"
                          />
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-white truncate group-hover:text-indigo-300 transition-colors">
                              {npc.name}
                            </h4>
                            <p className="text-[10px] text-[#9E9E9E] truncate">
                              {npc.title || `${npc.race || 'Criatura'} • ${npc.classOrType || 'Especial'}`}
                            </p>
                            <div className="flex items-center gap-1.5 mt-1">
                              {npc.ac && (
                                <span className="text-[9px] bg-[#22262B] text-[#E0E0E0] px-1 py-0.2 rounded font-mono border border-[#2D3139]">
                                  CA {npc.ac}
                                </span>
                              )}
                              {npc.hp && (
                                <span className="text-[9px] bg-rose-950/50 text-rose-300 border border-rose-800/40 px-1 py-0.2 rounded font-mono">
                                  PV {npc.hp}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <p className="text-[11px] text-[#9E9E9E] line-clamp-2 italic mb-2">
                          "{npc.quote || npc.description}"
                        </p>

                        {npc.secretDmNotes && (
                          <div className="mb-2">
                            <button
                              type="button"
                              onClick={() => toggleNpcSecret(npc.id)}
                              className="flex items-center gap-1 text-[10px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                            >
                              {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              {isRevealed ? 'Ocultar Segredos' : 'Ver Segredos'}
                            </button>
                            {isRevealed && (
                              <div className="mt-1 p-2 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-[10px] text-indigo-200">
                                🔒 <strong>Nota:</strong> {npc.secretDmNotes}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => handlePostNpc(npc)}
                        disabled={isPosting}
                        className="w-full mt-1.5 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition-colors cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        {isPosting ? 'Enviando...' : 'Postar NPC no Discord'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case 'quick_rules':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Regras Rápidas & Condições'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Guia de regras rápidas e status D&D 5e / WoD recolhido.
              </div>
            ) : (
              <QuickRulesWidget />
            )}
          </div>
        );

      case 'loot_generator':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Gerador de Tesouros & Loot'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Gerador de loot e tesouros da mesa recolhido.
              </div>
            ) : (
              <LootGeneratorWidget />
            )}
          </div>
        );

      case 'weather_clock':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Compass className="w-4 h-4 text-sky-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Clima, Horário & Ambiente'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Relógio de campanha e clima atmosférico recolhidos.
              </div>
            ) : (
              <WeatherClockWidget storageKey={widget.storageKey} />
            )}
          </div>
        );

      case 'scratchpad':
        return (
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between border-b border-[#2D3139]/60 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  {widget.title || 'Rascunho Rápido'}
                </h2>
              </div>
              {!isModal && renderWidgetHeaderControls(widget)}
            </div>

            {isMinimized ? (
              <div className="text-xs text-[#9E9E9E] italic">
                Rascunho rápido da sessão recolhido.
              </div>
            ) : (
              <ScratchpadWidget storageKey={widget.storageKey} />
            )}
          </div>
        );

      default:
        return null;
    }
  };

  // Helper to compute Tailwind column span class (12-column grid snapped to 1/3, 1/2, 1/1)
  const getColSpanClass = (widgetOrCols: MasterWidgetConfig | number | WidgetWidth) => {
    let cols = 6;

    if (typeof widgetOrCols === 'object' && widgetOrCols !== null) {
      cols = getWidgetCols(widgetOrCols);
    } else if (typeof widgetOrCols === 'number') {
      cols = widgetOrCols;
    } else {
      cols = widgetOrCols === 'third' ? 4 : widgetOrCols === 'full' ? 12 : 6;
    }

    if (cols <= 4) {
      return 'col-span-12 sm:col-span-6 lg:col-auto'; // 1/3
    } else if (cols <= 6) {
      return 'col-span-12 sm:col-span-6 lg:col-auto'; // 1/2
    } else {
      return 'col-span-12 lg:col-auto'; // 1/1
    }
  };

  // Helper to compute Widget Height style for flexible and custom vertical resizing
  const getWidgetHeightStyle = (widget: MasterWidgetConfig, isModal = false): React.CSSProperties => {
    if (isModal || widget.density === 'minimized') return {};
    if (widget.height === 'custom' && widget.customHeight && widget.customHeight > 100) {
      return { minHeight: `${widget.customHeight}px`, maxHeight: `${widget.customHeight}px` };
    }
    switch (widget.height) {
      case 'sm':
        return { minHeight: '240px', maxHeight: '240px' };
      case 'md':
        return { minHeight: '380px', maxHeight: '380px' };
      case 'lg':
        return { minHeight: '540px', maxHeight: '540px' };
      case 'xl':
        return { minHeight: '720px', maxHeight: '720px' };
      case 'auto':
      default:
        return {};
    }
  };

  // Helper to compute Widget Grid & Height style for flexible 2D positioning and resizing
  const getWidgetGridStyle = (widget: MasterWidgetConfig, isModal = false): React.CSSProperties => {
    if (isModal) return {};
    const heightStyle = getWidgetHeightStyle(widget, isModal);
    const cols = getWidgetCols(widget);

    const style: React.CSSProperties = {
      ...heightStyle
    };

    if (widget.colStart && widget.colStart >= 1 && widget.colStart <= 12) {
      style.gridColumnStart = widget.colStart;
      style.gridColumnEnd = `span ${cols}`;
    } else {
      style.gridColumn = `span ${cols}`;
    }

    if (widget.rowStart && widget.rowStart >= 1) {
      style.gridRowStart = widget.rowStart;
      if (widget.rowSpan && widget.rowSpan >= 1) {
        style.gridRowEnd = `span ${widget.rowSpan}`;
      }
    }

    return style;
  };

  const focusedWidget = widgets.find(w => w.id === focusedWidgetId);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Bar: Single Unified Layout & Modules Customizer Button */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl px-4 py-3 shadow-md flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
            <LayoutGrid className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white font-rpg uppercase tracking-wider">
              Escudo do Mestre Modular
            </h1>
            <p className="text-[11px] text-[#9E9E9E]">
              {isOrganizeMode
                ? 'Modo Grade Livre 2D ativo: arraste para qualquer posição da grade ou use os controles de coluna e linha.'
                : 'Painel unificado da mesa: notas, dados, mapas, estatísticas e combate.'}
            </p>
          </div>
        </div>

        {/* Single Unified Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer shadow-md ${
              isOrganizeMode
                ? 'bg-amber-500 hover:bg-amber-400 text-black ring-2 ring-amber-300/60 shadow-amber-500/30'
                : isCustomizerOpen
                  ? 'bg-indigo-600 text-white ring-2 ring-indigo-400/50 shadow-indigo-600/30'
                  : 'bg-[#141619] hover:bg-[#22262B] text-white border border-[#2D3139] hover:border-indigo-500/50'
            }`}
            title="Central de Personalização: organize, adicione blocos e configure o Escudo do Mestre"
          >
            <SlidersHorizontal className="w-4 h-4 text-amber-400" />
            <span>{isOrganizeMode ? 'Organizando Escudo...' : 'Personalizar Escudo & Módulos'}</span>
            {isOrganizeMode && (
              <span className="w-2 h-2 rounded-full bg-black animate-ping" />
            )}
          </button>
        </div>
      </div>

      {/* Organize Mode Active Banner */}
      {isOrganizeMode && (
        <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-amber-200 text-xs animate-fadeIn shadow-lg">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
              <Move className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <span className="font-bold text-amber-300 block">Modo Grade Livre 2D Ativo (Posicionamento em Qualquer Célula)</span>
              <span className="text-[11px] opacity-90">
                Arraste qualquer bloco para soltar na coluna e linha desejadas da grade, ou use os botões <b>[1/3, 2/3, 3/3]</b> e <b>(◀ Col / Col ▶)</b> no cabeçalho do bloco.
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={autoAlignAllGridWidgets}
              className="px-3 py-1.5 rounded-xl bg-[#141619] hover:bg-[#22262B] text-amber-300 border border-amber-500/40 font-bold text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
              title="Limpar posições fixas e auto-alinhar blocos em fluxo contínuo"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Auto-Alinhar Tudo</span>
            </button>

            <button
              type="button"
              onClick={() => setIsOrganizeMode(false)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>Concluir Organização</span>
            </button>
          </div>
        </div>
      )}

      {/* Unified Master Customizer / Layout & Modules Hub */}
      {isCustomizerOpen && (
        <div className="bg-[#141619] border border-indigo-500/40 rounded-2xl p-4 md:p-5 shadow-2xl space-y-4 animate-fadeIn">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-[#2D3139] pb-3 flex-wrap gap-2">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Settings2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2 font-rpg">
                  Central de Personalização do Escudo
                </h3>
                <p className="text-xs text-[#9E9E9E]">
                  Adicione novos módulos, ative o modo de organização com snap na grade e configure o tamanho dos blocos.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={resetToDefaultLayout}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#22262B] hover:bg-[#2B3037] text-xs text-[#E0E0E0] border border-[#2D3139] cursor-pointer transition-colors"
                title="Restaurar layout original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Padrão</span>
              </button>

              <button
                type="button"
                onClick={() => setIsCustomizerOpen(false)}
                className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#22262B] transition-colors cursor-pointer"
                title="Fechar Central"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Actions Hub: Organize Mode Toggle, Add Block, and Presets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* Action 1: Toggle Organize Mode */}
            <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    Modo Organizar & Snapping
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isOrganizeMode ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' : 'bg-[#22262B] text-[#9E9E9E]'
                  }`}>
                    {isOrganizeMode ? 'Ativado' : 'Desativado'}
                  </span>
                </div>
                <p className="text-[11px] text-[#9E9E9E] mt-1">
                  Habilita arrastar blocos com alinhamento magnético na grade de 12 colunas e redimensionamento completo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsOrganizeMode(!isOrganizeMode)}
                className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                  isOrganizeMode
                    ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-[#22262B] hover:bg-[#2D3139] text-white border border-[#3A3F4A]'
                }`}
              >
                {isOrganizeMode ? (
                  <>
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Concluir e Salvar Posições</span>
                  </>
                ) : (
                  <>
                    <Move className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ativar Modo Organizar</span>
                  </>
                )}
              </button>
            </div>

            {/* Action 2: Add New Block / Catalog */}
            <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 flex flex-col justify-between gap-2.5">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                  Catálogo de Blocos
                </span>
                <p className="text-[11px] text-[#9E9E9E] mt-1">
                  Adicione múltiplos blocos de notas, visualizadores de imagem, relógio de clima, gerador de loot ou dados ao escudo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setIsAddWidgetModalOpen(true);
                  setIsCustomizerOpen(false);
                }}
                className="w-full py-2 px-3 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>+ Adicionar Novo Bloco</span>
              </button>
            </div>

            {/* Action 3: Quick RPG Presets */}
            <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 flex flex-col justify-between gap-2">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Presets de Mesa Rápidos
                </span>
                <p className="text-[11px] text-[#9E9E9E] mt-1">
                  Aplique layouts pré-configurados com 1 clique:
                </p>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                {Object.entries(PRESETS).map(([key, p]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyPreset(key)}
                    className="px-2 py-1.5 rounded-lg text-[11px] font-semibold text-[#E0E0E0] hover:text-white bg-[#141619] hover:bg-[#22262B] border border-[#2D3139] transition-all flex items-center gap-1.5 cursor-pointer justify-center truncate"
                    title={p.desc}
                  >
                    <span>{p.icon}</span>
                    <span className="truncate">{p.name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Module List Manager: Visibility, Dimensions, and Order */}
          <div className="space-y-2 pt-2 border-t border-[#2D3139]/60">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#9E9E9E]">
                Módulos Ativos no Escudo ({widgets.filter(w => w.visible).length}/{widgets.length})
              </h4>
              <span className="text-[11px] text-[#6E7681]">
                Controle a visibilidade, largura horizontal e altura vertical de cada card
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {widgets.map((widget) => {
                const cols = getWidgetCols(widget);
                return (
                  <div
                    key={widget.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
                      widget.visible
                        ? 'bg-[#1A1D21] border-[#2D3139]'
                        : 'bg-[#141619]/60 border-[#2D3139]/40 opacity-60'
                    }`}
                  >
                    <label className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={widget.visible}
                        onChange={() => toggleWidgetVisibility(widget.id)}
                        className="rounded bg-[#141619] border-[#2D3139] text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white truncate block">
                          {widget.title}
                        </span>
                        <span className="text-[10px] text-[#6E7681]">
                          Grade: {cols}/12 colunas {widget.customHeight ? `• ${widget.customHeight}px` : ''}
                        </span>
                      </div>
                    </label>

                    <button
                      type="button"
                      onClick={() => toggleWidgetVisibility(widget.id)}
                      className={`text-xs px-2.5 py-1 rounded-lg border font-bold transition-all cursor-pointer ${
                        widget.visible
                          ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-600/30'
                          : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white'
                      }`}
                    >
                      {widget.visible ? 'Visível' : 'Oculto'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modular Fluid 2D Grid with Snap & Free Coordinate Positioning */}
      <div className="relative">
        {/* Virtual 12-Column Snapping Grid Background Guides (Organize Mode) */}
        {isOrganizeMode && (
          <div className="absolute inset-0 pointer-events-none grid grid-cols-12 gap-5 z-0 opacity-15 min-h-[500px]">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-full border-x border-dashed border-indigo-400 bg-indigo-500/5 rounded-lg flex items-start justify-center pt-2"
              >
                <span className="text-[9px] font-mono text-indigo-300 font-bold">Col {i + 1}</span>
              </div>
            ))}
          </div>
        )}

        <div
          ref={gridContainerRef}
          onDragOver={handleContainerDragOver}
          onDrop={handleContainerDrop}
          className="grid grid-cols-12 gap-5 relative z-10 min-h-[400px]"
        >
          {/* Landing Target Visual Ghost Preview (Organize Mode 2D Drag-over) */}
          {isOrganizeMode && gridDropTarget && draggedWidgetId && (
            <div
              style={{
                gridColumnStart: gridDropTarget.col,
                gridColumnEnd: `span ${gridDropTarget.cols}`,
                gridRowStart: gridDropTarget.row,
                minHeight: '180px'
              }}
              className="border-2 border-dashed border-amber-400 bg-amber-500/10 rounded-2xl flex items-center justify-center p-4 text-amber-300 font-mono text-xs font-bold animate-pulse pointer-events-none z-20 shadow-lg shadow-amber-500/10"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                <span>Soltar aqui: Coluna {gridDropTarget.col} • Linha {gridDropTarget.row} ({gridDropTarget.cols}/12 cols)</span>
              </div>
            </div>
          )}

          {widgets
            .filter(w => w.visible)
            .map((widget) => {
              const isDraggingThis = draggedWidgetId === widget.id;
              const isDragOverThis = dragOverWidgetId === widget.id && !isDraggingThis;
              const cols = getWidgetCols(widget);

              return (
                <div
                  id={`master-widget-${widget.id}`}
                  key={widget.id}
                  draggable={isOrganizeMode}
                  onDragStart={(e) => handleDragStart(e, widget.id)}
                  onDragOver={(e) => handleDragOver(e, widget.id)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, widget.id)}
                  onDragEnd={handleDragEnd}
                  style={getWidgetGridStyle(widget)}
                  className={`${getColSpanClass(widget)} transition-all duration-200 relative flex flex-col min-w-0 max-w-full ${
                    isOrganizeMode ? 'cursor-grab active:cursor-grabbing select-none' : ''
                  } ${
                    isDraggingThis
                      ? 'opacity-30 scale-95 border-2 border-dashed border-indigo-400 rounded-2xl bg-indigo-950/30'
                      : ''
                  } ${
                    isDragOverThis
                      ? dropSlotPosition === 'before'
                        ? 'border-t-4 border-amber-400 ring-2 ring-amber-400/40 rounded-2xl scale-[1.01]'
                        : 'border-b-4 border-amber-400 ring-2 ring-amber-400/40 rounded-2xl scale-[1.01]'
                      : ''
                  }`}
                >
                  {/* Organize Mode Visual Snapping Boundary Overlay */}
                  {isOrganizeMode && (
                    <div className="absolute -top-2.5 left-4 z-20 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-md uppercase tracking-wider flex items-center gap-1 shadow-md">
                      <LayoutGrid className="w-2.5 h-2.5" />
                      <span>
                        Grade: {getWidgetSizeBadgeText(widget)} ({cols}/12 cols) • Col {widget.colStart || 'auto'}
                      </span>
                    </div>
                  )}

                  {/* Widget Card Body with strict overflow containment */}
                  <div className="flex-1 min-h-0 min-w-0 max-w-full overflow-hidden flex flex-col [&>div]:h-full [&>div]:flex [&>div]:flex-col [&>div>div:last-child]:flex-1 [&>div>div:last-child]:overflow-y-auto [&>div>div:last-child]:custom-scrollbar">
                    {renderWidgetContent(widget)}
                  </div>

                  {/* Interactive Right Horizontal Resize Handle (Organize Mode - Snapped to 1/3, 1/2, 1/1) */}
                  {isOrganizeMode && (
                    <div
                      onMouseDown={(e) => handleStartResize(e, widget.id, 'horizontal')}
                      className="absolute right-0 top-0 bottom-0 w-3 hover:w-4 bg-amber-500/10 hover:bg-amber-500/40 cursor-col-resize z-20 flex items-center justify-center transition-all group rounded-r-2xl"
                      title="Arraste para alternar largura na grade (Snap: 1/3, 1/2 ou 1/1)"
                    >
                      <div className="w-1 h-8 bg-amber-400/60 group-hover:bg-amber-400 rounded-full" />
                    </div>
                  )}

                  {/* Interactive Bottom Vertical Resize Handle (Organize Mode) */}
                  {isOrganizeMode && widget.density !== 'minimized' && (
                    <div
                      onMouseDown={(e) => handleStartResize(e, widget.id, 'vertical')}
                      className="w-full py-1.5 bg-[#141619]/95 hover:bg-amber-500/20 border-t border-[#2D3139] rounded-b-2xl flex items-center justify-center gap-2 cursor-row-resize text-[10px] text-[#9E9E9E] hover:text-amber-300 transition-colors select-none group mt-auto shadow-inner"
                      title="Clique e arraste para redimensionar a altura deste bloco livremente"
                    >
                      <MoveVertical className="w-3 h-3 group-hover:scale-125 transition-transform text-amber-400" />
                      <span className="font-mono text-[9px] font-bold text-[#E0E0E0]">
                        {widget.customHeight
                          ? `Altura: ${widget.customHeight}px (Arraste para ajustar)`
                          : 'Altura Livre (Arraste para ajustar)'}
                      </span>
                    </div>
                  )}

                  {/* Interactive 2D Corner Resize Handle (Organize Mode) */}
                  {isOrganizeMode && widget.density !== 'minimized' && (
                    <div
                      onMouseDown={(e) => handleStartResize(e, widget.id, 'both')}
                      className="absolute -bottom-1 -right-1 w-6 h-6 bg-amber-500 hover:bg-amber-400 text-black rounded-tl-xl rounded-br-2xl flex items-center justify-center cursor-nwse-resize z-30 shadow-lg transition-transform hover:scale-110"
                      title="Arraste o canto para redimensionar largura e altura simultaneamente"
                    >
                      <Move className="w-3 h-3 rotate-45" />
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>

      {/* Focus Mode Fullscreen Modal */}
      {focusedWidget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-8 animate-fadeIn">
          <div className="bg-[#1A1D21] border border-indigo-500/50 rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                <h3 className="text-base font-bold text-white font-rpg">
                  Modo Foco: {focusedWidget.title}
                </h3>
              </div>

              <button
                type="button"
                onClick={() => setFocusedWidgetId(null)}
                className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#22262B] transition-colors cursor-pointer"
                title="Fechar Modo Foco"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              {renderWidgetContent(focusedWidget, true)}
            </div>
          </div>
        </div>
      )}

      {/* Add Widget / Block Modal */}
      {isAddWidgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-6 animate-fadeIn">
          <div className="bg-[#1A1D21] border border-indigo-500/50 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 md:p-6 border-b border-[#2D3139] flex items-center justify-between bg-[#141619]/60 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base md:text-lg font-bold text-white font-rpg">
                    Catálogo de Módulos & Blocos
                  </h3>
                  <p className="text-xs text-[#9E9E9E]">
                    Escolha blocos para adicionar ao seu Escudo do Mestre. Você pode adicionar múltiplos blocos de notas e visualizadores de imagem.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddWidgetModalOpen(false)}
                className="p-2 text-[#9E9E9E] hover:text-white rounded-xl hover:bg-[#22262B] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Filter Categories & Search Bar */}
            <div className="p-4 md:px-6 border-b border-[#2D3139] bg-[#141619]/30 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1.5 flex-wrap w-full sm:w-auto">
                {[
                  { key: 'all', label: 'Todos os Módulos' },
                  { key: 'core', label: 'Essenciais' },
                  { key: 'lore', label: 'Anotações & Imagens' },
                  { key: 'tools', label: 'Ferramentas & RPG' },
                  { key: 'audio', label: 'Áudio & Música' },
                ].map((cat) => (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setWidgetFilterCategory(cat.key as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      widgetFilterCategory === cat.key
                        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                        : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search input */}
              <div className="relative w-full sm:w-64 shrink-0">
                <Search className="w-3.5 h-3.5 text-[#6E7681] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar módulo..."
                  value={widgetSearchQuery}
                  onChange={(e) => setWidgetSearchQuery(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl pl-8.5 pr-3 py-1.5 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Widgets Catalog Grid */}
            <div className="p-4 md:p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 flex-1">
              {WIDGET_CATALOG
                .filter((item) => {
                  if (widgetFilterCategory !== 'all' && item.category !== widgetFilterCategory) return false;
                  if (widgetSearchQuery.trim()) {
                    const q = widgetSearchQuery.toLowerCase();
                    return (
                      item.name.toLowerCase().includes(q) ||
                      item.description.toLowerCase().includes(q) ||
                      item.tags.some(t => t.toLowerCase().includes(q))
                    );
                  }
                  return true;
                })
                .map((item) => {
                  const existingList = widgets.filter(w => w.type === item.type);
                  const isSingleActive = !item.allowMultiple && existingList.some(w => w.visible);
                  const isSingleHidden = !item.allowMultiple && existingList.length > 0 && !existingList.some(w => w.visible);
                  const multipleCount = item.allowMultiple ? existingList.length : 0;

                  return (
                    <div
                      key={item.type}
                      className="bg-[#141619] border border-[#2D3139] hover:border-indigo-500/50 rounded-2xl p-4 flex flex-col justify-between transition-all group shadow-sm"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="text-2xl p-1.5 rounded-xl bg-[#1A1D21] border border-[#2D3139] shrink-0">
                              {item.icon}
                            </span>
                            <div>
                              <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors">
                                {item.name}
                              </h4>
                              <span className="text-[10px] text-indigo-400/80 uppercase font-mono">
                                {item.category}
                              </span>
                            </div>
                          </div>

                          {multipleCount > 0 && (
                            <span className="px-2 py-0.5 rounded-full bg-indigo-600/20 border border-indigo-500/30 text-[10px] font-bold text-indigo-300">
                              {multipleCount} {multipleCount === 1 ? 'bloco' : 'blocos'}
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-[#9E9E9E] line-clamp-3 leading-relaxed">
                          {item.description}
                        </p>

                        <div className="flex flex-wrap gap-1 pt-1">
                          {item.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="text-[9px] px-1.5 py-0.5 rounded bg-[#1A1D21] text-[#9E9E9E] border border-[#2D3139]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 mt-3 border-t border-[#2D3139]/60">
                        {isSingleActive ? (
                          <button
                            type="button"
                            disabled
                            className="w-full py-2 px-3 rounded-xl bg-[#22262B] text-[#9E9E9E] font-bold text-xs flex items-center justify-center gap-1.5 opacity-60 cursor-not-allowed"
                          >
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Já Ativo no Painel</span>
                          </button>
                        ) : isSingleHidden ? (
                          <button
                            type="button"
                            onClick={() => addWidget(item)}
                            className="w-full py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-600/20 cursor-pointer transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>Reativar no Escudo</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => addWidget(item)}
                            className="w-full py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer transition-all group-hover:scale-[1.02]"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{item.allowMultiple && multipleCount > 0 ? '+ Adicionar Mais Um' : 'Adicionar ao Escudo'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#2D3139] bg-[#141619]/80 flex items-center justify-between text-xs text-[#9E9E9E] shrink-0">
              <span>💡 Dica: No <strong>Modo Organizar</strong>, você pode redimensionar cada bloco para 1/3, 50% ou 100% da tela.</span>
              <button
                type="button"
                onClick={() => setIsAddWidgetModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2B3037] text-white font-semibold cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Widget Title Rename Modal */}
      {editingTitleWidgetId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-[#1A1D21] border border-indigo-500/50 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white font-rpg">
                  Renomear Bloco
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setEditingTitleWidgetId(null)}
                className="p-1 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#22262B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs text-[#9E9E9E]">Novo Título do Bloco:</label>
              <input
                type="text"
                value={tempWidgetTitle}
                onChange={(e) => setTempWidgetTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') renameWidget(editingTitleWidgetId, tempWidgetTitle);
                  if (e.key === 'Escape') setEditingTitleWidgetId(null);
                }}
                autoFocus
                placeholder="Ex: Segredos do Vilão, Mapa da Taverna..."
                className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingTitleWidgetId(null)}
                className="px-3.5 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2B3037] text-xs text-[#E0E0E0] font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => renameWidget(editingTitleWidgetId, tempWidgetTitle)}
                className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs text-white font-bold cursor-pointer"
              >
                Salvar Título
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

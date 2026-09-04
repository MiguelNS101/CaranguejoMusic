export interface MediaDirectoriesConfig {
  musicDir: string;
  sfxDir: string;
  imagesDir: string;
}

export interface Folder {
  id: string;
  name: string;
  type: 'music' | 'soundboard' | 'npc' | 'ambience';
  color?: string;
  icon?: string;
  parentFolderId?: string;
  createdAt: number;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist?: string;
  duration: number; // in seconds
  url: string; // local file path or stream url
  folderId?: string;
  tags: string[];
  isLocal: boolean;
  coverUrl?: string;
  createdAt: number;
}

export interface AmbienceTrack {
  id: string;
  title: string;
  category?: string; // e.g. "Chuva & Tempestade", "Taverna & Cidade", "Masmorra & Ecos", "Natureza & Ermos", "Terror & Sombrio"
  environment?: string;
  duration: number; // in seconds
  url: string; // local file path or stream url
  folderId?: string;
  tags: string[];
  isLocal: boolean;
  coverUrl?: string;
  createdAt: number;
}

export interface QueueItem {
  id: string;
  track: MusicTrack;
  addedAt: number;
  addedBy?: string;
}

export type PlaybackState = 'idle' | 'playing' | 'paused' | 'buffering';
export type LoopMode = 'off' | 'track' | 'queue';

export interface SoundboardItem {
  id: string;
  name: string;
  emoji?: string;
  color?: string;
  url: string;
  duration?: number;
  folderId?: string;
  tags: string[];
  volume: number; // 0 - 100
  isLocal: boolean;
  createdAt: number;
}

export interface NPC {
  id: string;
  name: string;
  title?: string; // e.g. "Taverneiro de Valfenda", "Alto Inquisidor"
  description: string;
  secretDmNotes?: string;
  imageUrl: string;
  folderId?: string;
  tags: string[];
  alignment?: string;
  race?: string;
  classOrType?: string;
  hp?: number;
  maxHp?: number;
  ac?: number;
  cr?: string;
  quote?: string;
  isGeneralImage?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface DiscordChannel {
  id: string;
  name: string;
  type: 'text' | 'voice';
  guildId: string;
  isVoiceWithChat?: boolean;
}

export interface DiscordGuild {
  id: string;
  name: string;
  icon?: string;
  channels: DiscordChannel[];
}

export interface DiagnosticLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  source: 'voice' | 'bot' | 'audio' | 'system';
  message: string;
  details?: string;
}

export interface VoiceDiagnostics {
  modules: {
    opusDiscord: { available: boolean; version?: string; error?: string };
    nodeOpus: { available: boolean; version?: string; error?: string };
    opusscript: { available: boolean; version?: string; error?: string };
    activeOpusEngine: string;
    tweetnacl: { available: boolean; active: boolean };
    libsodium: { available: boolean; active: boolean };
    ffmpeg: { available: boolean; path?: string };
  };
  connection: {
    botOnline: boolean;
    botTag?: string;
    botPing?: number;
    voiceState: string;
    voiceChannelName?: string;
    voiceChannelId?: string;
    guildName?: string;
    guildId?: string;
    voicePing?: number;
    playerState: string;
    currentTrack?: string;
  };
  environment: {
    nodeVersion: string;
    platform: string;
    arch: string;
    uptime: number;
    memoryUsageMB: number;
  };
  logs: DiagnosticLog[];
}

export interface BotConfig {
  token: string;
  guildId?: string;
  voiceChannelId?: string;
  textChannelId?: string;
  clientId?: string;
  autoConnectVoice: boolean;
  prefix: string;
}

export interface BotStatus {
  isConfigured: boolean;
  isOnline: boolean;
  isVoiceConnected?: boolean;
  username?: string;
  avatar?: string;
  guildsCount: number;
  currentGuild?: {
    id: string;
    name: string;
  };
  connectedVoiceChannel?: {
    id: string;
    name: string;
  };
  targetTextChannel?: {
    id: string;
    name: string;
  };
  error?: string | null;
  mode: 'discord' | 'local_only';
}

export interface DiscordMessagePayload {
  content?: string;
  channelId?: string;
  type?: 'narrative' | 'embed' | 'plain' | 'npc' | 'dice';
  embed?: {
    title?: string;
    description?: string;
    color?: string | number;
    authorName?: string;
    authorIcon?: string;
    thumbnailUrl?: string;
    imageUrl?: string;
    footerText?: string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
  };
}

export interface DiceRollResult {
  id: string;
  notation: string; // e.g. "1d20+5", "2d6+3"
  rolls: number[];
  modifier: number;
  total: number;
  isCriticalSuccess?: boolean;
  isCriticalFail?: boolean;
  label?: string;
  timestamp: number;
}

export type SoundboardButtonSize = 'sm' | 'md' | 'lg' | 'wide' | 'tall' | 'tile';

export interface SoundboardButtonConfig {
  id: string;
  itemId: string; // references SoundboardItem.id
  size?: SoundboardButtonSize;
  order: number;
  customName?: string;
  customEmoji?: string;
  customColor?: string;
}

export interface SoundboardLayout {
  id: string;
  name: string; // e.g. "Combate", "Exploração", "NPC Específico", "Taverna & Social"
  description?: string;
  themeColor?: string;
  icon?: string;
  isDefault?: boolean;
  buttons: SoundboardButtonConfig[];
  createdAt: number;
  updatedAt: number;
}

export interface SessionSaveMeta {
  id: string;
  name: string;
  description?: string;
  fileName: string;
  createdAt: number;
  updatedAt: number;
  stats: {
    musicCount: number;
    soundboardCount: number;
    npcCount: number;
    folderCount: number;
    hasNotes: boolean;
    queueCount: number;
  };
}

export interface SessionSave {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  state: {
    folders: Folder[];
    musicTracks: MusicTrack[];
    soundboardItems: SoundboardItem[];
    soundboardLayouts: SoundboardLayout[];
    activeLayoutId?: string;
    npcs: NPC[];
    sessionNotes: string;
    noteTabs?: NoteTab[];
    customTimers?: TimerItem[];
    sessionSeconds?: number;
    initiativeList: Array<{ id: string; name: string; initiative: number; hp?: number; maxHp?: number; isNpc: boolean }>;
    currentTrack: MusicTrack | null;
    queue: QueueItem[];
    volume: number;
    loopMode: LoopMode;
    mediaDirectories?: MediaDirectoriesConfig;
  };
}

export interface NoteTab {
  id: string;
  title: string;
  emoji?: string;
  content: string;
  isDefault?: boolean;
  createdAt: number;
  updatedAt: number;
}

export type TimerType = 'countdown' | 'stopwatch';

export type WidgetType =
  | 'stats_summary'
  | 'image_viewer'
  | 'session_bar'
  | 'now_playing'
  | 'timers'
  | 'notepad'
  | 'dice_roller'
  | 'initiative'
  | 'soundboard'
  | 'narrative'
  | 'npc_spotlight'
  | 'quick_rules'
  | 'loot_generator'
  | 'weather_clock'
  | 'scratchpad'
  | 'encounter_generator'
  | 'custom_roulette'
  | 'spacer';

export type MasterWidgetId = string;

export type WidgetWidth = 'quarter' | 'third' | 'half' | 'two_thirds' | 'three_quarters' | 'full' | number;
export type WidgetHeight = 'auto' | 'sm' | 'md' | 'lg' | 'xl' | 'custom' | number;
export type WidgetDensity = 'expanded' | 'compact' | 'minimized';

export interface MasterWidgetConfig {
  id: string; // Unique instance ID, e.g. 'stats_summary', 'notepad-1', 'notepad-2', 'custom-123'
  type: WidgetType; // Underlying widget renderer type
  title: string;
  visible: boolean;
  width?: WidgetWidth;
  cols?: number; // 4 (1/3), 6 (1/2), 12 (1/1) columns on the virtual grid
  colStart?: number; // 1 to 12 - explicit starting column in 2D grid
  rowStart?: number; // 1, 2, 3... - explicit starting row in 2D grid
  rowSpan?: number; // span rows in 2D grid
  height?: WidgetHeight;
  customHeight?: number; // In pixels
  density: WidgetDensity;
  startNewRow?: boolean; // Force starting on a new line/row in the grid
  storageKey?: string; // Optional custom storage key for multiple instances
  isRemovable?: boolean; // Can be deleted/removed from layout
  customConfig?: Record<string, any>;
}

export interface TimerItem {
  id: string;
  title: string;
  type: TimerType;
  totalDurationSeconds: number; // For countdown (e.g. 600 for 10 min)
  remainingSeconds: number; // For countdown
  elapsedSeconds: number; // For stopwatch
  isRunning: boolean;
  lastUpdatedTimestamp: number;
  category?: 'combat' | 'buff' | 'torch' | 'rest' | 'session' | 'custom';
  color?: string;
  alertOnComplete?: boolean;
  isCompleted?: boolean;
  createdAt: number;
}

export interface WodDiceWave {
  waveIndex: number;
  rolls: number[];
  note?: string;
}

export interface WodDiceRollResult {
  id: string;
  command: string; // e.g. "\r 8d10" or "\kr 6d10"
  diceCount: number;
  isKeenRoll: boolean; // true for \kr (crits on 9 and 10), false for \r (crits on 10)
  critThreshold: number; // 9 or 10
  successThreshold: number; // always 7
  baseRolls: number[];
  bonusWaves: WodDiceWave[];
  totalSuccesses: number;
  totalCriticalHits: number;
  totalCriticalFails: number;
  cancelledSuccesses: number;
  cancelledCritsCount: number;
  formattedOutput: string;
  rollerName?: string;
  timestamp: number;
}

// Encounter Generator Types
export type EnvironmentType =
  | 'forest'
  | 'dungeon'
  | 'city'
  | 'mountain'
  | 'swamp'
  | 'desert'
  | 'aquatic'
  | 'sewer'
  | 'planar';

export type EnemyCountStyle = 'solo' | 'pair' | 'squad' | 'horde' | 'ambush';

export type EncounterDifficulty = 'easy' | 'medium' | 'hard' | 'deadly';

export interface EncounterEnemy {
  name: string;
  count: number;
  crOrLevel: string;
  hp: number;
  ac: number;
  tactics: string;
  specialAbility?: string;
}

export interface GeneratedEncounter {
  id: string;
  title: string;
  playerLevel: number;
  environment: EnvironmentType;
  environmentName: string;
  enemyStyle: EnemyCountStyle;
  difficulty: EncounterDifficulty;
  settingDescription: string;
  enemies: EncounterEnemy[];
  environmentalHazard: string;
  tacticalTwist: string;
  suggestedLoot: string;
  timestamp: number;
}

// Custom Roulette Types
export interface RouletteSlice {
  id: string;
  label: string;
  percentage: number; // calculated percentage chance 0 - 100
  weight: number; // raw weight for probability
  color: string;
  description?: string;
  icon?: string;
}

export interface RoulettePreset {
  id: string;
  name: string;
  description: string;
  category: string;
  slices: Omit<RouletteSlice, 'id'>[];
}



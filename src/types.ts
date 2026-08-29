export interface Folder {
  id: string;
  name: string;
  type: 'music' | 'soundboard' | 'npc';
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
    initiativeList: Array<{ id: string; name: string; initiative: number; hp?: number; maxHp?: number; isNpc: boolean }>;
    currentTrack: MusicTrack | null;
    queue: QueueItem[];
    volume: number;
    loopMode: LoopMode;
  };
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


import fs from 'fs';
import path from 'path';
import { Folder, MusicTrack, SoundboardItem, NPC, BotConfig, SoundboardLayout, SessionSaveMeta, SessionSave } from '../src/types.js';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const SAVES_DIR = path.join(DATA_DIR, 'saves');
const UPLOADS_DIR = path.join(DATA_DIR, 'uploads');
const MUSIC_DIR = path.join(DATA_DIR, 'music');
const SFX_DIR = path.join(DATA_DIR, 'sfx');
const NPCS_DIR = path.join(DATA_DIR, 'npcs');

export interface DatabaseSchema {
  folders: Folder[];
  musicTracks: MusicTrack[];
  soundboardItems: SoundboardItem[];
  soundboardLayouts: SoundboardLayout[];
  activeSoundboardLayoutId?: string;
  npcs: NPC[];
  botConfig: BotConfig;
  sessionNotes: string;
  initiativeList: Array<{ id: string; name: string; initiative: number; hp?: number; maxHp?: number; isNpc: boolean }>;
  currentTrack?: MusicTrack | null;
  queue?: any[];
  volume?: number;
  loopMode?: string;
}

const DEFAULT_FOLDERS: Folder[] = [
  // Music Folders
  { id: 'f-m-combat', name: 'Combate Épico', type: 'music', color: '#ef4444', icon: 'Swords', createdAt: Date.now() },
  { id: 'f-m-tavern', name: 'Taverna & Descanso', type: 'music', color: '#f59e0b', icon: 'Beer', createdAt: Date.now() },
  { id: 'f-m-dungeon', name: 'Masmorra & Mistério', type: 'music', color: '#8b5cf6', icon: 'Compass', createdAt: Date.now() },
  { id: 'f-m-ambient', name: 'Ambiente Natural', type: 'music', color: '#10b981', icon: 'Trees', createdAt: Date.now() },
  
  // Soundboard Folders
  { id: 'f-s-spells', name: 'Magias & Arcano', type: 'soundboard', color: '#3b82f6', icon: 'Sparkles', createdAt: Date.now() },
  { id: 'f-s-weapons', name: 'Ataques & Impactos', type: 'soundboard', color: '#dc2626', icon: 'ShieldAlert', createdAt: Date.now() },
  { id: 'f-s-monsters', name: 'Rugidos & Monstros', type: 'soundboard', color: '#ea580c', icon: 'Flame', createdAt: Date.now() },
  { id: 'f-s-ambient', name: 'Efeitos de Clima & Sala', type: 'soundboard', color: '#06b6d4', icon: 'CloudRain', createdAt: Date.now() },
  { id: 'f-s-tavern', name: 'Taverna & Risadas', type: 'soundboard', color: '#eab308', icon: 'PartyPopper', createdAt: Date.now() },
  { id: 'f-s-dialogue', name: 'Vozes & NPCs', type: 'soundboard', color: '#a855f7', icon: 'Users', createdAt: Date.now() },

  // NPC Folders
  { id: 'f-n-allies', name: 'Aliados & NPCs Amigáveis', type: 'npc', color: '#10b981', icon: 'Shield', createdAt: Date.now() },
  { id: 'f-n-villains', name: 'Vilões & Chefes', type: 'npc', color: '#ef4444', icon: 'Skull', createdAt: Date.now() },
  { id: 'f-n-citizens', name: 'Cidadãos & Comerciantes', type: 'npc', color: '#f59e0b', icon: 'Store', createdAt: Date.now() },
  { id: 'f-n-monsters', name: 'Monstros & Feras', type: 'npc', color: '#8b5cf6', icon: 'Bug', createdAt: Date.now() },
];

const DEFAULT_MUSIC_TRACKS: MusicTrack[] = [];

const DEFAULT_SFX: SoundboardItem[] = [];

const DEFAULT_SOUNDBOARD_LAYOUTS: SoundboardLayout[] = [
  {
    id: 'layout-default',
    name: 'Layout Principal',
    description: 'Seu layout customizável de efeitos sonoros rápidos.',
    themeColor: '#6366f1',
    icon: 'Sparkles',
    isDefault: true,
    buttons: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const DEFAULT_NPCS: NPC[] = [];

const DEFAULT_BOT_CONFIG: BotConfig = {
  token: process.env.DISCORD_BOT_TOKEN || '',
  guildId: process.env.DISCORD_GUILD_ID || '',
  voiceChannelId: process.env.DISCORD_VOICE_CHANNEL_ID || '',
  textChannelId: process.env.DISCORD_TEXT_CHANNEL_ID || '',
  clientId: process.env.DISCORD_CLIENT_ID || '',
  autoConnectVoice: true,
  prefix: '!'
};

export class JsonDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectories();
    this.data = this.loadData();
  }

  private ensureDirectories() {
    const dirs = [DATA_DIR, SAVES_DIR, UPLOADS_DIR, MUSIC_DIR, SFX_DIR, NPCS_DIR];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const fileContent = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(fileContent);
        return {
          folders: parsed.folders || DEFAULT_FOLDERS,
          musicTracks: parsed.musicTracks || DEFAULT_MUSIC_TRACKS,
          soundboardItems: parsed.soundboardItems || DEFAULT_SFX,
          soundboardLayouts: parsed.soundboardLayouts || DEFAULT_SOUNDBOARD_LAYOUTS,
          activeSoundboardLayoutId: parsed.activeSoundboardLayoutId || 'layout-combat',
          npcs: parsed.npcs || DEFAULT_NPCS,
          botConfig: { ...DEFAULT_BOT_CONFIG, ...(parsed.botConfig || {}) },
          sessionNotes: parsed.sessionNotes ?? 'Bem-vindo à sessão de RPG! Use este bloco de notas para registrar pistas, tesouros concedidos e iniciativa.',
          initiativeList: parsed.initiativeList || [],
          currentTrack: parsed.currentTrack || null,
          queue: parsed.queue || [],
          volume: parsed.volume !== undefined ? parsed.volume : 0.8,
          loopMode: parsed.loopMode || 'queue'
        };
      }
    } catch (e) {
      console.error('Error loading db.json, falling back to defaults:', e);
    }

    const defaultData: DatabaseSchema = {
      folders: DEFAULT_FOLDERS,
      musicTracks: DEFAULT_MUSIC_TRACKS,
      soundboardItems: DEFAULT_SFX,
      soundboardLayouts: DEFAULT_SOUNDBOARD_LAYOUTS,
      activeSoundboardLayoutId: 'layout-combat',
      npcs: DEFAULT_NPCS,
      botConfig: DEFAULT_BOT_CONFIG,
      sessionNotes: 'Bem-vindo à sessão de RPG! Use este bloco de notas para registrar pistas, tesouros concedidos e iniciativa.',
      initiativeList: [],
      currentTrack: null,
      queue: [],
      volume: 0.8,
      loopMode: 'queue'
    };

    this.saveData(defaultData);
    return defaultData;
  }

  public saveData(customData?: DatabaseSchema) {
    try {
      const dataToSave = customData || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(dataToSave, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db.json:', e);
    }
  }

  // Getters & Setters
  public getFolders(type?: 'music' | 'soundboard' | 'npc'): Folder[] {
    if (!type) return this.data.folders;
    return this.data.folders.filter(f => f.type === type);
  }

  public addFolder(folder: Folder): Folder {
    this.data.folders.push(folder);
    this.saveData();
    return folder;
  }

  public updateFolder(id: string, updates: Partial<Folder>): Folder | null {
    const idx = this.data.folders.findIndex(f => f.id === id);
    if (idx === -1) return null;
    this.data.folders[idx] = { ...this.data.folders[idx], ...updates };
    this.saveData();
    return this.data.folders[idx];
  }

  public deleteFolder(id: string): boolean {
    const prevLen = this.data.folders.length;
    this.data.folders = this.data.folders.filter(f => f.id !== id);
    // Unassign folderId from items
    this.data.musicTracks.forEach(m => { if (m.folderId === id) delete m.folderId; });
    this.data.soundboardItems.forEach(s => { if (s.folderId === id) delete s.folderId; });
    this.data.npcs.forEach(n => { if (n.folderId === id) delete n.folderId; });
    this.saveData();
    return this.data.folders.length < prevLen;
  }

  // Music Tracks
  public getMusicTracks(): MusicTrack[] {
    return this.data.musicTracks;
  }

  public addMusicTrack(track: MusicTrack): MusicTrack {
    this.data.musicTracks.unshift(track);
    this.saveData();
    return track;
  }

  public addMusicTracksBulk(tracks: MusicTrack[]): MusicTrack[] {
    this.data.musicTracks = [...tracks, ...this.data.musicTracks];
    this.saveData();
    return tracks;
  }

  public updateMusicTrack(id: string, updates: Partial<MusicTrack>): MusicTrack | null {
    const idx = this.data.musicTracks.findIndex(m => m.id === id);
    if (idx === -1) return null;
    this.data.musicTracks[idx] = { ...this.data.musicTracks[idx], ...updates };
    this.saveData();
    return this.data.musicTracks[idx];
  }

  public deleteMusicTrack(id: string): boolean {
    const prevLen = this.data.musicTracks.length;
    this.data.musicTracks = this.data.musicTracks.filter(m => m.id !== id);
    this.saveData();
    return this.data.musicTracks.length < prevLen;
  }

  // Soundboard Items
  public getSoundboardItems(): SoundboardItem[] {
    return this.data.soundboardItems;
  }

  public addSoundboardItem(item: SoundboardItem): SoundboardItem {
    this.data.soundboardItems.push(item);
    this.saveData();
    return item;
  }

  public addSoundboardItemsBulk(items: SoundboardItem[]): SoundboardItem[] {
    this.data.soundboardItems = [...this.data.soundboardItems, ...items];
    this.saveData();
    return items;
  }

  public updateSoundboardItem(id: string, updates: Partial<SoundboardItem>): SoundboardItem | null {
    const idx = this.data.soundboardItems.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.data.soundboardItems[idx] = { ...this.data.soundboardItems[idx], ...updates };
    this.saveData();
    return this.data.soundboardItems[idx];
  }

  public deleteSoundboardItem(id: string): boolean {
    const prevLen = this.data.soundboardItems.length;
    this.data.soundboardItems = this.data.soundboardItems.filter(s => s.id !== id);
    // Remove references in layouts
    this.data.soundboardLayouts.forEach(layout => {
      layout.buttons = layout.buttons.filter(b => b.itemId !== id);
    });
    this.saveData();
    return this.data.soundboardItems.length < prevLen;
  }

  // Soundboard Layouts
  public getSoundboardLayouts(): SoundboardLayout[] {
    return this.data.soundboardLayouts || [];
  }

  public getActiveSoundboardLayoutId(): string {
    return this.data.activeSoundboardLayoutId || 'layout-combat';
  }

  public setActiveSoundboardLayoutId(id: string): void {
    this.data.activeSoundboardLayoutId = id;
    this.saveData();
  }

  public addSoundboardLayout(layout: SoundboardLayout): SoundboardLayout {
    if (!this.data.soundboardLayouts) this.data.soundboardLayouts = [];
    this.data.soundboardLayouts.push(layout);
    this.saveData();
    return layout;
  }

  public updateSoundboardLayout(id: string, updates: Partial<SoundboardLayout>): SoundboardLayout | null {
    if (!this.data.soundboardLayouts) this.data.soundboardLayouts = [];
    const idx = this.data.soundboardLayouts.findIndex(l => l.id === id);
    if (idx === -1) return null;
    this.data.soundboardLayouts[idx] = {
      ...this.data.soundboardLayouts[idx],
      ...updates,
      updatedAt: Date.now()
    };
    this.saveData();
    return this.data.soundboardLayouts[idx];
  }

  public deleteSoundboardLayout(id: string): boolean {
    if (!this.data.soundboardLayouts) return false;
    const prevLen = this.data.soundboardLayouts.length;
    this.data.soundboardLayouts = this.data.soundboardLayouts.filter(l => l.id !== id);
    if (this.data.activeSoundboardLayoutId === id) {
      this.data.activeSoundboardLayoutId = this.data.soundboardLayouts[0]?.id || 'layout-combat';
    }
    this.saveData();
    return this.data.soundboardLayouts.length < prevLen;
  }

  // NPCs
  public getNpcs(): NPC[] {
    return this.data.npcs;
  }

  public getNpcById(id: string): NPC | undefined {
    return this.data.npcs.find(n => n.id === id);
  }

  public addNpc(npc: NPC): NPC {
    this.data.npcs.unshift(npc);
    this.saveData();
    return npc;
  }

  public addNpcsBulk(npcs: NPC[]): NPC[] {
    this.data.npcs = [...npcs, ...this.data.npcs];
    this.saveData();
    return npcs;
  }

  public updateNpc(id: string, updates: Partial<NPC>): NPC | null {
    const idx = this.data.npcs.findIndex(n => n.id === id);
    if (idx === -1) return null;
    this.data.npcs[idx] = { ...this.data.npcs[idx], ...updates, updatedAt: Date.now() };
    this.saveData();
    return this.data.npcs[idx];
  }

  public deleteNpc(id: string): boolean {
    const prevLen = this.data.npcs.length;
    this.data.npcs = this.data.npcs.filter(n => n.id !== id);
    this.saveData();
    return this.data.npcs.length < prevLen;
  }

  // Bot Config
  public getBotConfig(): BotConfig {
    return this.data.botConfig;
  }

  public updateBotConfig(updates: Partial<BotConfig>): BotConfig {
    this.data.botConfig = { ...this.data.botConfig, ...updates };
    this.saveData();
    return this.data.botConfig;
  }

  // Notes & Initiative & Playback persistence
  public getSessionNotes(): string {
    return this.data.sessionNotes || '';
  }

  public setSessionNotes(notes: string): void {
    this.data.sessionNotes = notes;
    this.saveData();
  }

  public getInitiativeList() {
    return this.data.initiativeList || [];
  }

  public setInitiativeList(list: any[]) {
    this.data.initiativeList = list;
    this.saveData();
  }

  public setPlaybackPersistence(playback: { currentTrack?: any; queue?: any[]; volume?: number; loopMode?: string }) {
    if (playback.currentTrack !== undefined) this.data.currentTrack = playback.currentTrack;
    if (playback.queue !== undefined) this.data.queue = playback.queue;
    if (playback.volume !== undefined) this.data.volume = playback.volume;
    if (playback.loopMode !== undefined) this.data.loopMode = playback.loopMode;
    this.saveData();
  }

  public getFullState(): DatabaseSchema {
    return this.data;
  }

  public replaceFullState(newState: Partial<DatabaseSchema>): DatabaseSchema {
    this.data = {
      ...this.data,
      ...newState,
      folders: newState.folders || this.data.folders,
      musicTracks: newState.musicTracks || this.data.musicTracks,
      soundboardItems: newState.soundboardItems || this.data.soundboardItems,
      soundboardLayouts: newState.soundboardLayouts || this.data.soundboardLayouts,
      npcs: newState.npcs || this.data.npcs,
      sessionNotes: newState.sessionNotes ?? this.data.sessionNotes,
      initiativeList: newState.initiativeList || this.data.initiativeList,
    };
    this.saveData();
    return this.data;
  }

  // ==========================================
  // SESSIONS MANAGEMENT (SAVES/ DIRECTORY)
  // ==========================================

  public getSavedSessions(): SessionSaveMeta[] {
    if (!fs.existsSync(SAVES_DIR)) {
      fs.mkdirSync(SAVES_DIR, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(SAVES_DIR).filter(f => f.endsWith('.json'));
    const list: SessionSaveMeta[] = [];

    for (const file of files) {
      try {
        const fullPath = path.join(SAVES_DIR, file);
        const content = fs.readFileSync(fullPath, 'utf-8');
        const parsed = JSON.parse(content);
        list.push({
          id: parsed.id || path.basename(file, '.json'),
          name: parsed.name || path.basename(file, '.json'),
          description: parsed.description || '',
          fileName: file,
          createdAt: parsed.createdAt || Date.now(),
          updatedAt: parsed.updatedAt || Date.now(),
          stats: {
            musicCount: parsed.state?.musicTracks?.length || 0,
            soundboardCount: parsed.state?.soundboardItems?.length || 0,
            npcCount: parsed.state?.npcs?.length || 0,
            folderCount: parsed.state?.folders?.length || 0,
            hasNotes: !!parsed.state?.sessionNotes?.trim(),
            queueCount: parsed.state?.queue?.length || 0
          }
        });
      } catch (err) {
        console.error(`Error reading session save file ${file}:`, err);
      }
    }

    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public saveSession(name: string, description?: string, clientSnapshot?: Partial<DatabaseSchema>): SessionSave {
    if (!fs.existsSync(SAVES_DIR)) {
      fs.mkdirSync(SAVES_DIR, { recursive: true });
    }

    const id = `save-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fileName = `${id}.json`;
    const fullPath = path.join(SAVES_DIR, fileName);

    const snapshotState = {
      folders: clientSnapshot?.folders || this.data.folders,
      musicTracks: clientSnapshot?.musicTracks || this.data.musicTracks,
      soundboardItems: clientSnapshot?.soundboardItems || this.data.soundboardItems,
      soundboardLayouts: clientSnapshot?.soundboardLayouts || this.data.soundboardLayouts,
      activeLayoutId: clientSnapshot?.activeSoundboardLayoutId || this.data.activeSoundboardLayoutId,
      npcs: clientSnapshot?.npcs || this.data.npcs,
      sessionNotes: clientSnapshot?.sessionNotes !== undefined ? clientSnapshot.sessionNotes : this.data.sessionNotes,
      initiativeList: clientSnapshot?.initiativeList || this.data.initiativeList,
      currentTrack: clientSnapshot?.currentTrack || this.data.currentTrack || null,
      queue: clientSnapshot?.queue || this.data.queue || [],
      volume: clientSnapshot?.volume !== undefined ? clientSnapshot.volume : this.data.volume || 0.8,
      loopMode: (clientSnapshot?.loopMode as any) || this.data.loopMode || 'queue'
    };

    const sessionSave: SessionSave = {
      id,
      name: name || `Sessão RPG ${new Date().toLocaleDateString('pt-BR')}`,
      description: description || '',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      state: snapshotState
    };

    fs.writeFileSync(fullPath, JSON.stringify(sessionSave, null, 2), 'utf-8');
    return sessionSave;
  }

  public loadSession(id: string): SessionSave | null {
    const fileName = id.endsWith('.json') ? id : `${id}.json`;
    const fullPath = path.join(SAVES_DIR, fileName);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const sessionSave: SessionSave = JSON.parse(content);

    // Apply to active DB
    if (sessionSave.state) {
      this.replaceFullState({
        folders: sessionSave.state.folders,
        musicTracks: sessionSave.state.musicTracks,
        soundboardItems: sessionSave.state.soundboardItems,
        soundboardLayouts: sessionSave.state.soundboardLayouts,
        activeSoundboardLayoutId: sessionSave.state.activeLayoutId,
        npcs: sessionSave.state.npcs,
        sessionNotes: sessionSave.state.sessionNotes,
        initiativeList: sessionSave.state.initiativeList,
        currentTrack: sessionSave.state.currentTrack,
        queue: sessionSave.state.queue,
        volume: sessionSave.state.volume,
        loopMode: sessionSave.state.loopMode
      });
    }

    return sessionSave;
  }

  public deleteSession(id: string): boolean {
    const fileName = id.endsWith('.json') ? id : `${id}.json`;
    const fullPath = path.join(SAVES_DIR, fileName);

    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
      return true;
    }
    return false;
  }

  public importSession(sessionData: any): SessionSave {
    if (!sessionData || typeof sessionData !== 'object') {
      throw new Error('Arquivo de sessão inválido.');
    }

    const id = `save-imported-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const fileName = `${id}.json`;
    const fullPath = path.join(SAVES_DIR, fileName);

    const sessionSave: SessionSave = {
      id,
      name: sessionData.name || `Sessão Importada ${new Date().toLocaleDateString('pt-BR')}`,
      description: sessionData.description || 'Importada de arquivo JSON externo',
      createdAt: sessionData.createdAt || Date.now(),
      updatedAt: Date.now(),
      state: sessionData.state || {
        folders: sessionData.folders || DEFAULT_FOLDERS,
        musicTracks: sessionData.musicTracks || DEFAULT_MUSIC_TRACKS,
        soundboardItems: sessionData.soundboardItems || DEFAULT_SFX,
        soundboardLayouts: sessionData.soundboardLayouts || DEFAULT_SOUNDBOARD_LAYOUTS,
        activeLayoutId: sessionData.activeSoundboardLayoutId || 'layout-combat',
        npcs: sessionData.npcs || DEFAULT_NPCS,
        sessionNotes: sessionData.sessionNotes || '',
        initiativeList: sessionData.initiativeList || [],
        currentTrack: sessionData.currentTrack || null,
        queue: sessionData.queue || [],
        volume: sessionData.volume || 0.8,
        loopMode: sessionData.loopMode || 'queue'
      }
    };

    fs.writeFileSync(fullPath, JSON.stringify(sessionSave, null, 2), 'utf-8');
    return sessionSave;
  }
}

export const db = new JsonDatabase();
export { DATA_DIR, SAVES_DIR, UPLOADS_DIR, MUSIC_DIR, SFX_DIR, NPCS_DIR };

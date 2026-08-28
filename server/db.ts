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
  
  // Soundboard Folders (with subfolder organization)
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

const DEFAULT_MUSIC_TRACKS: MusicTrack[] = [
  {
    id: 'm-1',
    title: 'Marcha do Dragão Vermelho',
    artist: 'Trilha Orquestral RPG',
    duration: 184,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=epic-battle-trailer-115984.mp3',
    folderId: 'f-m-combat',
    tags: ['Combate', 'Chefe', 'Orquestra', 'Épico'],
    isLocal: false,
    coverUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now()
  },
  {
    id: 'm-2',
    title: 'A Noite no Dragão Bêbado',
    artist: 'Bardos de Valfenda',
    duration: 145,
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c8c8a73467.mp3?filename=medieval-tavern-107086.mp3',
    folderId: 'f-m-tavern',
    tags: ['Taverna', 'Violão', 'Lute', 'Festa'],
    isLocal: false,
    coverUrl: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now()
  },
  {
    id: 'm-3',
    title: 'Sussurros nas Catacumbas Esquecidas',
    artist: 'Masmorras Arcanas',
    duration: 210,
    url: 'https://cdn.pixabay.com/download/audio/2022/10/14/audio_9939f792cb.mp3?filename=dark-ambient-soundscape-123473.mp3',
    folderId: 'f-m-dungeon',
    tags: ['Masmorra', 'Suspense', 'Mistério', 'Sombrio'],
    isLocal: false,
    coverUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now()
  },
  {
    id: 'm-4',
    title: 'Chuva e Vento nas Colinas da Floresta',
    artist: 'Ambiente Natural',
    duration: 240,
    url: 'https://cdn.pixabay.com/download/audio/2022/05/16/audio_db6591201e.mp3?filename=rain-and-thunder-nature-sounds-7803.mp3',
    folderId: 'f-m-ambient',
    tags: ['Chuva', 'Trovão', 'Natureza', 'Imersão'],
    isLocal: false,
    coverUrl: 'https://images.unsplash.com/photo-1519692933481-e162a57d6721?auto=format&fit=crop&w=400&q=80',
    createdAt: Date.now()
  }
];

const DEFAULT_SFX: SoundboardItem[] = [
  {
    id: 'sfx-1',
    name: 'Bola de Fogo (Explosão Arcana)',
    emoji: '🔥',
    color: '#ef4444',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_51c6c066e0.mp3?filename=spell-fire-impact-80493.mp3',
    duration: 4,
    folderId: 'f-s-spells',
    tags: ['Magia', 'Fogo', 'Dano em Área'],
    volume: 90,
    isLocal: false,
    createdAt: Date.now()
  },
  {
    id: 'sfx-2',
    name: 'Impacto Crítico de Espada',
    emoji: '⚔️',
    color: '#dc2626',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_247a32dbb8.mp3?filename=sword-slash-and-flesh-hit-94883.mp3',
    duration: 2,
    folderId: 'f-s-weapons',
    tags: ['Combate', 'Crítico', 'Espada'],
    volume: 95,
    isLocal: false,
    createdAt: Date.now()
  },
  {
    id: 'sfx-3',
    name: 'Trovão Distante e Relâmpago',
    emoji: '⚡',
    color: '#06b6d4',
    url: 'https://cdn.pixabay.com/download/audio/2022/01/18/audio_d0a13f69d2.mp3?filename=thunder-strike-1-7170.mp3',
    duration: 5,
    folderId: 'f-s-ambient',
    tags: ['Clima', 'Trovão', 'Susto'],
    volume: 85,
    isLocal: false,
    createdAt: Date.now()
  },
  {
    id: 'sfx-4',
    name: 'Rugido do Monstro das Sombras',
    emoji: '👹',
    color: '#ea580c',
    url: 'https://cdn.pixabay.com/download/audio/2021/08/04/audio_33877b0369.mp3?filename=monster-roar-6841.mp3',
    duration: 4,
    folderId: 'f-s-monsters',
    tags: ['Monstro', 'Medo', 'Rugido'],
    volume: 90,
    isLocal: false,
    createdAt: Date.now()
  },
  {
    id: 'sfx-5',
    name: 'Brinde de Canecas na Taverna',
    emoji: '🍻',
    color: '#eab308',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/15/audio_9ec169e5d4.mp3?filename=cheering-and-beer-glasses-clinking-89345.mp3',
    duration: 3,
    folderId: 'f-s-tavern',
    tags: ['Taverna', 'Festa', 'Hidromel'],
    volume: 80,
    isLocal: false,
    createdAt: Date.now()
  },
  {
    id: 'sfx-6',
    name: 'Curativo Mágico & Bênção',
    emoji: '✨',
    color: '#10b981',
    url: 'https://cdn.pixabay.com/download/audio/2022/03/10/audio_c36399c43d.mp3?filename=magic-wand-spell-sparkle-80494.mp3',
    duration: 3,
    folderId: 'f-s-spells',
    tags: ['Cura', 'Magia', 'Sucesso'],
    volume: 85,
    isLocal: false,
    createdAt: Date.now()
  }
];

const DEFAULT_SOUNDBOARD_LAYOUTS: SoundboardLayout[] = [
  {
    id: 'layout-combat',
    name: 'Combate & Batalha',
    description: 'Layout otimizado com botões rápidos de magias, impactos de espada e rugidos.',
    themeColor: '#ef4444',
    icon: 'Swords',
    isDefault: true,
    buttons: [
      { id: 'b-1', itemId: 'sfx-2', size: 'wide', order: 0, customName: 'Crítico de Espada' },
      { id: 'b-2', itemId: 'sfx-1', size: 'lg', order: 1, customName: 'Bola de Fogo!' },
      { id: 'b-3', itemId: 'sfx-4', size: 'md', order: 2, customName: 'Rugido do Monstro' },
      { id: 'b-4', itemId: 'sfx-6', size: 'wide', order: 3, customName: 'Cura Divina' },
      { id: 'b-5', itemId: 'sfx-3', size: 'sm', order: 4, customName: 'Relâmpago' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'layout-exploration',
    name: 'Exploração & Clima',
    description: 'Layout para viagens, clima sombrio, masmorras e suspense.',
    themeColor: '#06b6d4',
    icon: 'Compass',
    isDefault: false,
    buttons: [
      { id: 'b-6', itemId: 'sfx-3', size: 'wide', order: 0, customName: 'Trovão Distante' },
      { id: 'b-7', itemId: 'sfx-4', size: 'md', order: 1, customName: 'Passos / Monstro' },
      { id: 'b-8', itemId: 'sfx-6', size: 'sm', order: 2, customName: 'Detector Arcano' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'layout-tavern',
    name: 'Taverna & Social',
    description: 'Layout descontraído para cidades, encontros com NPCs e descanso.',
    themeColor: '#f59e0b',
    icon: 'Beer',
    isDefault: false,
    buttons: [
      { id: 'b-9', itemId: 'sfx-5', size: 'tile', order: 0, customName: 'Brinde de Canecas' },
      { id: 'b-10', itemId: 'sfx-6', size: 'md', order: 1, customName: 'Truque Mágico' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'layout-npc-custom',
    name: 'NPC Específico & Diálogo',
    description: 'Layout personalizado para reações de chefes, monstros e falas marcantes.',
    themeColor: '#8b5cf6',
    icon: 'Users',
    isDefault: false,
    buttons: [
      { id: 'b-11', itemId: 'sfx-4', size: 'wide', order: 0, customName: 'Presença Ameaçadora' },
      { id: 'b-12', itemId: 'sfx-1', size: 'md', order: 1, customName: 'Conjurando Feitiço' },
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

const DEFAULT_NPCS: NPC[] = [
  {
    id: 'npc-1',
    name: 'Arquimago Malakor, o Sussurrante',
    title: 'Grão-Mestre da Ordem da Obsidiana',
    description: 'Um conjurador sombrio de olhar penetrante cujos mantos flutuam como névoa da meia-noite. Carrega um cajado esculpido em obsidiana pura que sussurra em línguas esquecidas.',
    secretDmNotes: 'Malakor é secretamente manipulado pela entidade do espelho no subsolo da torre. Ele tem fraqueza a dano radiante e hesita se vir o medalhão de sua falecida irmã.',
    imageUrl: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    folderId: 'f-n-villains',
    tags: ['Vilão', 'Mago', 'Nível 14', 'Obsidiana'],
    alignment: 'Neutro e Mau',
    race: 'Elfo da Noite',
    classOrType: 'Arquimago / Feiticeiro',
    hp: 145,
    maxHp: 145,
    ac: 18,
    cr: 'ND 12',
    quote: '"Vocês rastejam sob a luz do sol sem compreender a vastidão eterna do silêncio."',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'npc-2',
    name: 'Eldrin Som-de-Prata',
    title: 'Bardo Andarilho & Informante de Taverna',
    description: 'Um meio-elfo de sorriso carismático, alaúde de madeira élfica e anéis cheios de truques. Conhece todas as fofocas do reino e sempre aceita um hidromel em troca de segredos.',
    secretDmNotes: 'Trabalha secretamente para os Corvos da Noite (a guilda de ladrões local), mas tem afeição pelo grupo. Caso seja pago com ouro do reino do sul, revelará a passagem secreta.',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    folderId: 'f-n-allies',
    tags: ['Aliado', 'Bardo', 'Taverna', 'Informante'],
    alignment: 'Caótico e Bom',
    race: 'Meio-Elfo',
    classOrType: 'Bardo do Colégio do Conhecimento',
    hp: 42,
    maxHp: 42,
    ac: 14,
    cr: 'ND 3',
    quote: '"Uma canção pode abrir mais portas do que o aríete mais pesado do rei!"',
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'npc-3',
    name: 'Gromm Dente-de-Ferro',
    title: 'Ferreiro Veterano da Vila de Pedra-Alta',
    description: 'Um anão corpulento com cicatrizes de forja e uma barba trançada com anéis de prata bruta. Não suporta enrolação e cobra caro por reparos mágicos, mas seu aço nunca falha.',
    secretDmNotes: 'Possui escondida embaixo da bigorna uma espada de mitral ancestral forjada por seu avô que concede +2 de ataque contra gigantes.',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
    folderId: 'f-n-citizens',
    tags: ['Comerciante', 'Anão', 'Ferreiro', 'Forja'],
    alignment: 'Leal e Neutro',
    race: 'Anão da Montanha',
    classOrType: 'Guerreiro / Artífice',
    hp: 68,
    maxHp: 68,
    ac: 16,
    cr: 'ND 4',
    quote: '"O aço não mente, forasteiro. Mostre seu ouro ou tire a mão da bigorna."',
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

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

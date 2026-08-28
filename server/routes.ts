import express, { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, UPLOADS_DIR, MUSIC_DIR, SFX_DIR, NPCS_DIR, SAVES_DIR } from './db.js';
import { discordBot } from './discordBot.js';
import { Folder, MusicTrack, SoundboardItem, NPC, DiceRollResult, SoundboardLayout } from '../src/types.js';
import { rollWodDice } from './wodDice.js';

const router = Router();

// Configure Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.query.type as string;
    let targetDir = UPLOADS_DIR;
    if (type === 'music') targetDir = MUSIC_DIR;
    else if (type === 'sfx') targetDir = SFX_DIR;
    else if (type === 'npc') targetDir = NPCS_DIR;

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const sanitizedBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e4)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB
});

// Helper to clean audio/image filenames into human-readable titles
function formatFileNameToTitle(fileName: string): string {
  const ext = path.extname(fileName);
  let base = path.basename(fileName, ext);
  // remove leading numbers or track order, e.g. "01 - Dragon Attack" -> "Dragon Attack"
  base = base.replace(/^\d+[\s._-]+/, '');
  // replace underscores and dashes with spaces
  base = base.replace(/[_-]+/g, ' ');
  // capitalize first letters
  base = base.trim();
  if (!base) return 'Faixa Importada';
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// GET complete initial state
router.get('/state', (req: Request, res: Response) => {
  const fullState = db.getFullState();
  const botStatus = discordBot.getStatus();
  const wodHistory = discordBot.getRecentWodRolls();
  const savedSessions = db.getSavedSessions();

  res.json({
    ...fullState,
    botStatus,
    wodHistory,
    savedSessions
  });
});

// BOT ENDPOINTS
router.get('/bot/status', (req: Request, res: Response) => {
  const status = discordBot.getStatus();
  res.json(status);
});

router.get('/bot/guilds', (req: Request, res: Response) => {
  const guilds = discordBot.getGuilds();
  res.json(guilds);
});

router.post('/bot/config', async (req: Request, res: Response) => {
  const { token, guildId, voiceChannelId, textChannelId, clientId, autoConnectVoice, prefix } = req.body;
  
  const updatedConfig = db.updateBotConfig({
    token: token !== undefined ? token : db.getBotConfig().token,
    guildId,
    voiceChannelId,
    textChannelId,
    clientId,
    autoConnectVoice,
    prefix
  });

  if (token && token.trim()) {
    const result = await discordBot.start(token);
    return res.json({
      config: updatedConfig,
      botStatus: discordBot.getStatus(),
      connectionResult: result
    });
  }

  res.json({
    config: updatedConfig,
    botStatus: discordBot.getStatus()
  });
});

router.post('/bot/start', async (req: Request, res: Response) => {
  const config = db.getBotConfig();
  const token = req.body.token || config.token;
  if (!token) {
    return res.status(400).json({ error: 'Nenhum token fornecido.' });
  }

  if (req.body.token) {
    db.updateBotConfig({ token: req.body.token });
  }

  const result = await discordBot.start(token);
  res.json({ ...result, botStatus: discordBot.getStatus() });
});

router.post('/bot/stop', async (req: Request, res: Response) => {
  await discordBot.stop();
  res.json({ success: true, botStatus: discordBot.getStatus() });
});

// DISCORD ACTIONS
router.post('/discord/send-message', async (req: Request, res: Response) => {
  const result = await discordBot.sendMessage(req.body);
  res.json(result);
});

router.post('/discord/post-npc', async (req: Request, res: Response) => {
  const { npcId, customChannelId } = req.body;
  const npc = db.getNpcById(npcId);
  if (!npc) {
    return res.status(404).json({ error: 'NPC não encontrado.' });
  }
  const result = await discordBot.postNpc(npc, customChannelId);
  res.json(result);
});

router.post('/discord/announce-turn', async (req: Request, res: Response) => {
  const { name, initiative, isNpc, round, customChannelId } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome do combatente é obrigatório.' });
  }
  const result = await discordBot.announceTurn(name, initiative ?? 10, !!isNpc, round, customChannelId);
  res.json(result);
});

router.post('/discord/roll-dice', async (req: Request, res: Response) => {
  const roll = req.body as DiceRollResult;
  const result = await discordBot.broadcastDiceRoll(roll);
  res.json(result);
});

// ==========================================
// DISCORD VOICE PLAYBACK ENDPOINTS
// ==========================================

router.post('/bot/voice/play', async (req: Request, res: Response) => {
  const { trackUrl, volume, voiceChannelId } = req.body;
  if (!trackUrl) {
    return res.status(400).json({ error: 'URL da faixa é obrigatória.' });
  }
  if (voiceChannelId) {
    await discordBot.ensureVoiceConnection(voiceChannelId);
  }
  const result = await discordBot.playVoiceAudio(trackUrl, volume ?? 0.8);
  res.json(result);
});

router.post('/bot/voice/pause', async (req: Request, res: Response) => {
  const result = await discordBot.pauseVoiceAudio();
  res.json(result);
});

router.post('/bot/voice/resume', async (req: Request, res: Response) => {
  const result = await discordBot.resumeVoiceAudio();
  res.json(result);
});

router.post('/bot/voice/stop', async (req: Request, res: Response) => {
  const result = await discordBot.stopVoiceAudio();
  res.json(result);
});

router.post('/bot/voice/volume', async (req: Request, res: Response) => {
  const { volume } = req.body;
  const result = await discordBot.setVoiceVolume(typeof volume === 'number' ? volume : 0.8);
  res.json(result);
});

router.post('/bot/voice/sfx', async (req: Request, res: Response) => {
  const { sfxUrl, volume } = req.body;
  if (!sfxUrl) {
    return res.status(400).json({ error: 'URL do efeito sonoro é obrigatória.' });
  }
  const result = await discordBot.playVoiceAudio(sfxUrl, volume ?? 0.9);
  res.json(result);
});

// ==========================================
// WORLD OF DARKNESS (WoD) DICE API
// ==========================================

router.post('/dice/wod', async (req: Request, res: Response) => {
  const { count, isKeen, rollerName, label, broadcastToDiscord, channelId } = req.body;
  const numDice = parseInt(count, 10) || 1;
  const name = rollerName || 'Mestre';
  
  const rollResult = rollWodDice(numDice, !!isKeen, name, label);
  discordBot.addRecentWodRoll(rollResult);

  let discordSent = false;
  let discordError: string | undefined;

  if (broadcastToDiscord) {
    const broadcastRes = await discordBot.broadcastWodDiceRoll(rollResult, channelId);
    discordSent = broadcastRes.success;
    discordError = broadcastRes.error;
  }

  res.json({
    roll: rollResult,
    discordSent,
    discordError
  });
});

router.get('/dice/wod/history', (req: Request, res: Response) => {
  res.json(discordBot.getRecentWodRolls());
});

// ==========================================
// FOLDERS ENDPOINTS
// ==========================================

router.get('/folders', (req: Request, res: Response) => {
  const type = req.query.type as any;
  res.json(db.getFolders(type));
});

router.post('/folders', (req: Request, res: Response) => {
  const { name, type, color, icon, parentFolderId } = req.body;
  if (!name || !type) {
    return res.status(400).json({ error: 'Nome e tipo são obrigatórios.' });
  }
  const newFolder: Folder = {
    id: `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    type,
    color: color || '#6366f1',
    icon: icon || 'Folder',
    parentFolderId,
    createdAt: Date.now()
  };
  const created = db.addFolder(newFolder);
  res.status(201).json(created);
});

router.put('/folders/:id', (req: Request, res: Response) => {
  const updated = db.updateFolder(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Pasta não encontrada.' });
  res.json(updated);
});

router.delete('/folders/:id', (req: Request, res: Response) => {
  const success = db.deleteFolder(req.params.id);
  res.json({ success });
});

// ==========================================
// MUSIC TRACKS ENDPOINTS
// ==========================================

router.get('/music', (req: Request, res: Response) => {
  res.json(db.getMusicTracks());
});

router.post('/music', (req: Request, res: Response) => {
  const { title, artist, duration, url, folderId, tags, isLocal, coverUrl } = req.body;
  if (!title || !url) {
    return res.status(400).json({ error: 'Título e URL são obrigatórios.' });
  }
  const track: MusicTrack = {
    id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    title,
    artist: artist || 'Desconhecido',
    duration: duration || 120,
    url,
    folderId,
    tags: Array.isArray(tags) ? tags : [],
    isLocal: !!isLocal,
    coverUrl,
    createdAt: Date.now()
  };
  const created = db.addMusicTrack(track);
  res.status(201).json(created);
});

router.put('/music/:id', (req: Request, res: Response) => {
  const updated = db.updateMusicTrack(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Música não encontrada.' });
  res.json(updated);
});

router.delete('/music/:id', (req: Request, res: Response) => {
  const success = db.deleteMusicTrack(req.params.id);
  res.json({ success });
});

// ==========================================
// SOUNDBOARD ITEMS ENDPOINTS
// ==========================================

router.get('/soundboard', (req: Request, res: Response) => {
  res.json(db.getSoundboardItems());
});

router.post('/soundboard', (req: Request, res: Response) => {
  const { name, emoji, color, url, duration, folderId, tags, volume, isLocal } = req.body;
  if (!name || !url) {
    return res.status(400).json({ error: 'Nome e URL são obrigatórios.' });
  }
  const sfx: SoundboardItem = {
    id: `sfx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    emoji: emoji || '🔊',
    color: color || '#6366f1',
    url,
    duration: duration || 3,
    folderId,
    tags: Array.isArray(tags) ? tags : [],
    volume: volume !== undefined ? volume : 90,
    isLocal: !!isLocal,
    createdAt: Date.now()
  };
  const created = db.addSoundboardItem(sfx);
  res.status(201).json(created);
});

router.put('/soundboard/:id', (req: Request, res: Response) => {
  const updated = db.updateSoundboardItem(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Efeito sonoro não encontrado.' });
  res.json(updated);
});

router.delete('/soundboard/:id', (req: Request, res: Response) => {
  const success = db.deleteSoundboardItem(req.params.id);
  res.json({ success });
});

// ==========================================
// SOUNDBOARD LAYOUTS ENDPOINTS (DYNAMIC SOUNDBOARD)
// ==========================================

router.get('/soundboard-layouts', (req: Request, res: Response) => {
  res.json({
    layouts: db.getSoundboardLayouts(),
    activeLayoutId: db.getActiveSoundboardLayoutId()
  });
});

router.post('/soundboard-layouts', (req: Request, res: Response) => {
  const { name, description, themeColor, icon, buttons } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Nome do layout é obrigatório.' });
  }
  const newLayout: SoundboardLayout = {
    id: `layout-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    description: description || '',
    themeColor: themeColor || '#6366f1',
    icon: icon || 'LayoutGrid',
    isDefault: false,
    buttons: Array.isArray(buttons) ? buttons : [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const created = db.addSoundboardLayout(newLayout);
  res.status(201).json(created);
});

router.put('/soundboard-layouts/:id', (req: Request, res: Response) => {
  const updated = db.updateSoundboardLayout(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Layout não encontrado.' });
  res.json(updated);
});

router.delete('/soundboard-layouts/:id', (req: Request, res: Response) => {
  const success = db.deleteSoundboardLayout(req.params.id);
  res.json({ success, activeLayoutId: db.getActiveSoundboardLayoutId() });
});

router.post('/soundboard-layouts/active', (req: Request, res: Response) => {
  const { layoutId } = req.body;
  if (!layoutId) return res.status(400).json({ error: 'ID de layout inválido.' });
  db.setActiveSoundboardLayoutId(layoutId);
  res.json({ success: true, activeLayoutId: layoutId });
});

// ==========================================
// NPC ENDPOINTS
// ==========================================

router.get('/npcs', (req: Request, res: Response) => {
  res.json(db.getNpcs());
});

router.post('/npcs', (req: Request, res: Response) => {
  const { name, title, description, secretDmNotes, imageUrl, folderId, tags, alignment, race, classOrType, hp, maxHp, ac, cr, quote } = req.body;
  if (!name || !description) {
    return res.status(400).json({ error: 'Nome e descrição são obrigatórios.' });
  }
  const npc: NPC = {
    id: `npc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name,
    title,
    description,
    secretDmNotes,
    imageUrl: imageUrl || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=600&q=80',
    folderId,
    tags: Array.isArray(tags) ? tags : [],
    alignment,
    race,
    classOrType,
    hp: hp || 20,
    maxHp: maxHp || hp || 20,
    ac: ac || 12,
    cr,
    quote,
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const created = db.addNpc(npc);
  res.status(201).json(created);
});

router.put('/npcs/:id', (req: Request, res: Response) => {
  const updated = db.updateNpc(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'NPC não encontrado.' });
  res.json(updated);
});

router.delete('/npcs/:id', (req: Request, res: Response) => {
  const success = db.deleteNpc(req.params.id);
  res.json({ success });
});

// ==========================================
// SESSIONS MANAGEMENT (SAVES FOLDER)
// ==========================================

router.get('/sessions', (req: Request, res: Response) => {
  const list = db.getSavedSessions();
  res.json(list);
});

router.post('/sessions/save', (req: Request, res: Response) => {
  const { name, description, clientSnapshot } = req.body;
  try {
    const saved = db.saveSession(name, description, clientSnapshot);
    res.status(201).json({
      success: true,
      session: saved,
      allSessions: db.getSavedSessions()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao salvar sessão.' });
  }
});

router.post('/sessions/load/:id', (req: Request, res: Response) => {
  try {
    const loaded = db.loadSession(req.params.id);
    if (!loaded) {
      return res.status(404).json({ error: 'Arquivo de sessão salvo não encontrado.' });
    }
    res.json({
      success: true,
      session: loaded,
      state: db.getFullState()
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Falha ao carregar sessão.' });
  }
});

router.delete('/sessions/:id', (req: Request, res: Response) => {
  const success = db.deleteSession(req.params.id);
  res.json({ success, allSessions: db.getSavedSessions() });
});

router.get('/sessions/export/:id', (req: Request, res: Response) => {
  const fileName = req.params.id.endsWith('.json') ? req.params.id : `${req.params.id}.json`;
  const filePath = path.join(SAVES_DIR, fileName);
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo de save não encontrado.' });
  }
  res.download(filePath);
});

router.post('/sessions/import', (req: Request, res: Response) => {
  try {
    const sessionData = req.body;
    const imported = db.importSession(sessionData);
    res.status(201).json({
      success: true,
      session: imported,
      allSessions: db.getSavedSessions()
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Dados de sessão inválidos.' });
  }
});

// NOTES & INITIATIVE & PLAYBACK
router.post('/notes', (req: Request, res: Response) => {
  const { notes } = req.body;
  db.setSessionNotes(notes || '');
  res.json({ success: true, notes });
});

router.post('/initiative', (req: Request, res: Response) => {
  const { list } = req.body;
  db.setInitiativeList(Array.isArray(list) ? list : []);
  res.json({ success: true, list });
});

router.post('/playback/state', (req: Request, res: Response) => {
  db.setPlaybackPersistence(req.body);
  res.json({ success: true });
});

// ==========================================
// FILE & FOLDER IMPORT HANDLER
// ==========================================

router.post('/upload', upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Nenhum arquivo enviado.' });
  }

  const type = req.query.type as string;
  let relativePath = `/media/uploads/${req.file.filename}`;
  if (type === 'music') relativePath = `/media/music/${req.file.filename}`;
  else if (type === 'sfx') relativePath = `/media/sfx/${req.file.filename}`;
  else if (type === 'npc') relativePath = `/media/npcs/${req.file.filename}`;

  res.json({
    success: true,
    filename: req.file.filename,
    originalName: req.file.originalname,
    cleanTitle: formatFileNameToTitle(req.file.originalname),
    size: req.file.size,
    mimetype: req.file.mimetype,
    url: relativePath
  });
});

// Helper to choose distinct folder colors and icons
const FOLDER_COLORS = ['#6366f1', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
function getFolderIcon(name: string, type: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('combate') || lower.includes('boss') || lower.includes('batalha') || lower.includes('luta')) return 'Swords';
  if (lower.includes('taverna') || lower.includes('bar') || lower.includes('festa')) return 'Beer';
  if (lower.includes('masmorra') || lower.includes('dungeon') || lower.includes('caverna')) return 'Compass';
  if (lower.includes('magia') || lower.includes('arcano') || lower.includes('feitico')) return 'Sparkles';
  if (lower.includes('monstro') || lower.includes('dragao') || lower.includes('fera')) return 'Skull';
  if (lower.includes('vilao') || lower.includes('inimigo') || lower.includes('chefe')) return 'Flame';
  if (lower.includes('ambiente') || lower.includes('floresta') || lower.includes('natureza')) return 'Trees';
  if (lower.includes('clima') || lower.includes('chuva') || lower.includes('vento')) return 'CloudRain';
  if (type === 'npc') return 'Users';
  if (type === 'sfx') return 'Volume2';
  return 'Folder';
}

// BULK FOLDER IMPORT: Imports an entire folder / batch of files with automatic names & subfolder organization
router.post('/upload/bulk', upload.array('files', 150), (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[]) || [];
  if (files.length === 0) {
    return res.status(400).json({ error: 'Nenhum arquivo recebido para importação em lote.' });
  }

  const targetCategory = (req.query.type as string) || 'music';
  const folderType = targetCategory === 'sfx' ? 'soundboard' : (targetCategory as 'music' | 'npc');
  let targetFolderId = (req.body.folderId as string) || (req.query.folderId as string) || undefined;
  const autoCreateItems = req.body.autoCreateItems !== 'false';

  // Parse relative paths if sent from frontend
  let relativePaths: string[] = [];
  try {
    if (req.body.paths) {
      relativePaths = typeof req.body.paths === 'string' ? JSON.parse(req.body.paths) : req.body.paths;
    }
  } catch (e) {
    relativePaths = [];
  }

  const importedResults: any[] = [];
  const newMusicTracks: MusicTrack[] = [];
  const newSfxItems: SoundboardItem[] = [];
  const newNpcs: NPC[] = [];

  // Cache newly created folders in this request
  const folderCache = new Map<string, Folder>();
  const existingFolders = db.getFolders(folderType);
  existingFolders.forEach(f => folderCache.set(f.name.toLowerCase().trim(), f));

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const relPath = relativePaths[i] || file.originalname;
    const cleanTitle = formatFileNameToTitle(file.originalname);
    let relativeUrl = `/media/uploads/${file.filename}`;

    // Extract subfolders from relative path: e.g. "Combate/Chefes/dragao.mp3" -> ["Combate", "Chefes"]
    const pathParts = relPath.replace(/\\/g, '/').split('/').filter(p => Boolean(p.trim()));
    let itemFolderId = targetFolderId;
    const autoTags: string[] = ['Importado', 'Local'];

    if (pathParts.length > 1) {
      // There are subfolders! e.g. "Musicas/Combate/dragao.mp3" or "Combate/dragao.mp3"
      const subfolderNames = pathParts.slice(0, -1);
      // Main folder is the most descriptive folder (last folder before filename or top folder)
      const primaryFolderName = subfolderNames[subfolderNames.length - 1];

      // Add all folder names as tags
      subfolderNames.forEach(name => {
        if (!autoTags.includes(name)) autoTags.push(name);
      });

      // Auto-create folder if not existing
      const key = primaryFolderName.toLowerCase().trim();
      let matchedFolder = folderCache.get(key);

      if (!matchedFolder) {
        const colorIdx = (folderCache.size + Math.floor(Math.random() * 5)) % FOLDER_COLORS.length;
        const newFolder: Folder = {
          id: `f-${targetCategory[0]}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          name: primaryFolderName,
          type: folderType,
          color: FOLDER_COLORS[colorIdx],
          icon: getFolderIcon(primaryFolderName, targetCategory),
          createdAt: Date.now()
        };
        db.addFolder(newFolder);
        folderCache.set(key, newFolder);
        matchedFolder = newFolder;
      }

      itemFolderId = matchedFolder.id;
    }

    if (targetCategory === 'music') {
      relativeUrl = `/media/music/${file.filename}`;
      const track: MusicTrack = {
        id: `m-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
        title: cleanTitle,
        artist: 'Arquivo Local Importado',
        duration: 180,
        url: relativeUrl,
        folderId: itemFolderId,
        tags: autoTags,
        isLocal: true,
        createdAt: Date.now()
      };
      newMusicTracks.push(track);
      importedResults.push(track);
    } else if (targetCategory === 'sfx') {
      relativeUrl = `/media/sfx/${file.filename}`;
      const sfx: SoundboardItem = {
        id: `sfx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
        name: cleanTitle,
        emoji: '🔊',
        color: '#6366f1',
        url: relativeUrl,
        duration: 4,
        folderId: itemFolderId,
        tags: autoTags,
        volume: 90,
        isLocal: true,
        createdAt: Date.now()
      };
      newSfxItems.push(sfx);
      importedResults.push(sfx);
    } else if (targetCategory === 'npc') {
      relativeUrl = `/media/npcs/${file.filename}`;
      const npc: NPC = {
        id: `npc-${Date.now()}-${Math.random().toString(36).substring(2, 6)}-${i}`,
        name: cleanTitle,
        title: 'NPC / Criatura',
        description: '',
        imageUrl: relativeUrl,
        folderId: itemFolderId,
        tags: autoTags.filter(t => t !== 'Local'),
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      newNpcs.push(npc);
      importedResults.push(npc);
    }
  }

  if (autoCreateItems) {
    if (newMusicTracks.length > 0) db.addMusicTracksBulk(newMusicTracks);
    if (newSfxItems.length > 0) db.addSoundboardItemsBulk(newSfxItems);
    if (newNpcs.length > 0) db.addNpcsBulk(newNpcs);
  }

  res.json({
    success: true,
    totalFiles: files.length,
    category: targetCategory,
    items: importedResults,
    state: db.getFullState()
  });
});

// ENV / CONFIGURATION MANAGEMENT ENDPOINTS
router.get('/config/env', (req: Request, res: Response) => {
  const envPath = path.join(process.cwd(), '.env');
  const configPath = path.join(process.cwd(), 'config.env');
  
  let rawContent = '';
  if (fs.existsSync(envPath)) {
    rawContent = fs.readFileSync(envPath, 'utf-8');
  } else if (fs.existsSync(configPath)) {
    rawContent = fs.readFileSync(configPath, 'utf-8');
  }

  const botConfig = db.getBotConfig();

  res.json({
    hasEnvFile: fs.existsSync(envPath) || fs.existsSync(configPath),
    rawContent,
    parsed: {
      DISCORD_BOT_TOKEN: process.env.DISCORD_BOT_TOKEN || botConfig.token || '',
      DISCORD_CLIENT_ID: process.env.DISCORD_CLIENT_ID || botConfig.clientId || '',
      DISCORD_GUILD_ID: process.env.DISCORD_GUILD_ID || botConfig.guildId || '',
      DISCORD_VOICE_CHANNEL_ID: process.env.DISCORD_VOICE_CHANNEL_ID || botConfig.voiceChannelId || '',
      DISCORD_TEXT_CHANNEL_ID: process.env.DISCORD_TEXT_CHANNEL_ID || botConfig.textChannelId || '',
      DISCORD_PREFIX: process.env.DISCORD_PREFIX || botConfig.prefix || '!',
      PORT: process.env.PORT || '3000',
      DATA_DIR: process.env.DATA_DIR || path.join(process.cwd(), 'data'),
      NODE_ENV: process.env.NODE_ENV || 'production'
    }
  });
});

router.post('/config/env', async (req: Request, res: Response) => {
  const {
    DISCORD_BOT_TOKEN,
    DISCORD_CLIENT_ID,
    DISCORD_GUILD_ID,
    DISCORD_VOICE_CHANNEL_ID,
    DISCORD_TEXT_CHANNEL_ID,
    DISCORD_PREFIX,
    PORT,
    DATA_DIR
  } = req.body;

  const envPath = path.join(process.cwd(), '.env');
  const content = `# ==========================================
# RPG Bot & Escudo do Mestre - Configurações
# ==========================================

DISCORD_BOT_TOKEN=${DISCORD_BOT_TOKEN || ''}
DISCORD_CLIENT_ID=${DISCORD_CLIENT_ID || ''}
DISCORD_GUILD_ID=${DISCORD_GUILD_ID || ''}
DISCORD_VOICE_CHANNEL_ID=${DISCORD_VOICE_CHANNEL_ID || ''}
DISCORD_TEXT_CHANNEL_ID=${DISCORD_TEXT_CHANNEL_ID || ''}
DISCORD_PREFIX=${DISCORD_PREFIX || '!'}

PORT=${PORT || '3000'}
DATA_DIR=${DATA_DIR || './data'}
NODE_ENV=production
`;

  try {
    fs.writeFileSync(envPath, content, 'utf-8');

    // Update in-memory process.env
    if (DISCORD_BOT_TOKEN !== undefined) process.env.DISCORD_BOT_TOKEN = DISCORD_BOT_TOKEN;
    if (DISCORD_CLIENT_ID !== undefined) process.env.DISCORD_CLIENT_ID = DISCORD_CLIENT_ID;
    if (DISCORD_GUILD_ID !== undefined) process.env.DISCORD_GUILD_ID = DISCORD_GUILD_ID;
    if (DISCORD_VOICE_CHANNEL_ID !== undefined) process.env.DISCORD_VOICE_CHANNEL_ID = DISCORD_VOICE_CHANNEL_ID;
    if (DISCORD_TEXT_CHANNEL_ID !== undefined) process.env.DISCORD_TEXT_CHANNEL_ID = DISCORD_TEXT_CHANNEL_ID;
    if (DISCORD_PREFIX !== undefined) process.env.DISCORD_PREFIX = DISCORD_PREFIX;

    // Update DB
    db.updateBotConfig({
      token: DISCORD_BOT_TOKEN || '',
      clientId: DISCORD_CLIENT_ID || '',
      guildId: DISCORD_GUILD_ID || '',
      voiceChannelId: DISCORD_VOICE_CHANNEL_ID || '',
      textChannelId: DISCORD_TEXT_CHANNEL_ID || '',
      prefix: DISCORD_PREFIX || '!'
    });

    // If bot token is present, try connecting
    let connectionResult;
    if (DISCORD_BOT_TOKEN && DISCORD_BOT_TOKEN.trim()) {
      connectionResult = await discordBot.start(DISCORD_BOT_TOKEN.trim());
    }

    res.json({
      success: true,
      message: 'Arquivo .env salvo com sucesso!',
      connectionResult,
      botStatus: discordBot.getStatus()
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err?.message || 'Erro ao salvar .env' });
  }
});

export default router;

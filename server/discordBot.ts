import {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  TextChannel,
  VoiceChannel,
  ChannelType,
  ActivityType,
  ColorResolvable,
  Guild
} from 'discord.js';
import {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  StreamType,
  AudioPlayerStatus,
  VoiceConnection,
  AudioPlayer,
  VoiceConnectionStatus,
  VoiceConnectionDisconnectReason,
  entersState,
  NoSubscriberBehavior
} from '@discordjs/voice';
import path from 'path';
import fs from 'fs';
import http from 'http';
import https from 'https';
import { Readable } from 'stream';
import prism from 'prism-media';
import { spawn } from 'child_process';
import { createRequire } from 'module';
import ffmpegStatic from 'ffmpeg-static';
import playdl from 'play-dl';
import { db } from './db.js';
import {
  BotStatus,
  DiscordGuild,
  DiscordMessagePayload,
  NPC,
  DiceRollResult,
  WodDiceRollResult,
  DiagnosticLog,
  VoiceDiagnostics,
  GeneratedEncounter,
  ScenarioMap,
  MapMarker,
  AdvancedDiceRollResult
} from '../src/types.js';
import { rollWodDice, parseWodCommand } from './wodDice.js';
import { parseAdvancedDiceFormula, rollAdvancedDice } from '../src/utils/advancedDice.js';

function loadCaranguejoCuriosities(): Array<{ id: number; title: string; fact: string; category?: string; rpg_hook?: string }> {
  try {
    const filePath = path.join(process.cwd(), 'data', 'caranguejoCuriosities.json');
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (e) {
    console.error('Error loading caranguejoCuriosities.json:', e);
  }
  return [
    {
      id: 1,
      title: "A Grande Carcinização",
      fact: "Na biologia evolutiva, crustáceos evoluíram independentemente para a anatomia de caranguejo pelo menos 5 vezes diferentes ao longo de centenas de milhões de anos! A natureza parece convergir sempre para caranguejos.",
      category: "Evolução & Biologia",
      rpg_hook: "Um feitiço arcano de transmutação proibido que lentamente converte criaturas em crustáceos blindados perfeitos."
    }
  ];
}

// Helper to safely require packages in both CommonJS bundled output and ESM
function safeRequire(modulePath: string): any {
  try {
    if (typeof require === 'function') {
      return require(modulePath);
    }
  } catch {}
  try {
    const { createRequire } = require('module');
    const req = createRequire(process.cwd());
    return req(modulePath);
  } catch {}
  return null;
}

// Configure FFMPEG path if ffmpeg-static is installed
if (ffmpegStatic) {
  process.env.FFMPEG_PATH = ffmpegStatic;
}

export class DiscordBotService {
  private client: Client | null = null;
  private isConnecting: boolean = false;
  private lastError: string | null = null;
  private recentWodRolls: WodDiceRollResult[] = [];
  
  // Voice connection & player state
  private voiceConnection: VoiceConnection | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private currentResource: any = null;
  private currentTrackName: string | null = null;
  private currentTrackUrl: string | null = null;
  private currentTrackVolume: number = 0.8;
  private isPlayingVoice: boolean = false;

  // Diagnostic Logs Circular Buffer
  private diagnosticLogs: DiagnosticLog[] = [];
  private maxLogs: number = 150;

  // Audio Performance & Lag Tracking (Non-invasive diagnostic monitors)
  private bufferStallCount: number = 0;
  private lastBufferingTimestamp?: string;
  private voiceDisconnectCount: number = 0;
  private lastHighPingLoggedAt: number = 0;

  // Active audio stream & transcode process tracking (leak prevention)
  private currentAudioStream: Readable | null = null;
  private activeTranscodeProcess: any | null = null;
  private bufferWatchdogTimer: NodeJS.Timeout | null = null;
  private bufferingStartTime: number | null = null;
  private stallRecoveryCount: number = 0;
  private isRecoveringBuffer: boolean = false;

  private cleanupCurrentAudio(): void {
    if (this.bufferWatchdogTimer) {
      clearTimeout(this.bufferWatchdogTimer);
      this.bufferWatchdogTimer = null;
    }
    this.bufferingStartTime = null;

    if (this.activeTranscodeProcess) {
      try {
        this.activeTranscodeProcess.kill('SIGKILL');
      } catch {}
      this.activeTranscodeProcess = null;
    }

    if (this.currentAudioStream) {
      try {
        this.currentAudioStream.destroy();
      } catch {}
      this.currentAudioStream = null;
    }

    if (this.currentResource) {
      try {
        this.currentResource.playStream?.destroy?.();
      } catch {}
      this.currentResource = null;
    }
  }

  constructor() {
    this.logDiagnostic('info', 'system', 'Inicializando serviço DiscordBot do CaranguejoRPG...', `Node ${process.version} em ${process.platform} (${process.arch})`);
    
    // Initial auto-connect if token in env or db
    const config = db.getBotConfig();
    if (config.token) {
      this.start(config.token);
    }
  }

  public logDiagnostic(level: 'info' | 'warn' | 'error' | 'success', source: 'voice' | 'bot' | 'audio' | 'system', message: string, details?: string) {
    const entry: DiagnosticLog = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      level,
      source,
      message,
      details
    };

    this.diagnosticLogs.unshift(entry);
    if (this.diagnosticLogs.length > this.maxLogs) {
      this.diagnosticLogs.pop();
    }

    // Console mirror for server logs
    const prefix = `[${entry.timestamp}] [${source.toUpperCase()}] [${level.toUpperCase()}]`;
    if (level === 'error') {
      console.error(`${prefix} ${message}`, details || '');
    } else if (level === 'warn') {
      console.warn(`${prefix} ${message}`, details || '');
    } else {
      console.log(`${prefix} ${message}`, details || '');
    }
  }

  public getDiagnostics(): VoiceDiagnostics {
    let opusDiscord = { available: false, version: undefined as string | undefined, error: undefined as string | undefined };
    let nodeOpus = { available: false, version: undefined as string | undefined, error: undefined as string | undefined };
    let opusscript = { available: false, version: undefined as string | undefined, error: undefined as string | undefined };
    let tweetnacl = { available: false, active: false };
    let libsodium = { available: false, active: false };
    let ffmpeg = {
      available: !!(ffmpegStatic || (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH))),
      path: ffmpegStatic || process.env.FFMPEG_PATH || 'Não configurado'
    };

    // Safe dynamic check for Opus decoders
    try {
      // @ts-ignore
      const dOpus = safeRequire('@discordjs/opus');
      if (dOpus) {
        opusDiscord.available = true;
        try {
          const pkg = safeRequire('@discordjs/opus/package.json');
          if (pkg?.version) opusDiscord.version = pkg.version;
        } catch {}
      }
    } catch (e: any) {
      opusDiscord.error = e?.message || 'Módulo nativo @discordjs/opus não carregado (esperado caso use opusscript).';
    }

    try {
      // @ts-ignore
      const nOpus = safeRequire('node-opus');
      if (nOpus) {
        nodeOpus.available = true;
        try {
          const pkg = safeRequire('node-opus/package.json');
          if (pkg?.version) nodeOpus.version = pkg.version;
        } catch {}
      }
    } catch (e: any) {
      nodeOpus.error = e?.message || 'Módulo nativo node-opus não carregado.';
    }

    try {
      // @ts-ignore
      const OpusScript = safeRequire('opusscript');
      if (OpusScript) {
        opusscript.available = true;
        try {
          const pkg = safeRequire('opusscript/package.json');
          if (pkg?.version) opusscript.version = pkg.version;
        } catch {}
      }
    } catch (e: any) {
      opusscript.error = e?.message || 'opusscript não encontrado';
    }

    try {
      // @ts-ignore
      safeRequire('tweetnacl');
      tweetnacl.available = true;
      tweetnacl.active = true;
    } catch {}

    try {
      // @ts-ignore
      safeRequire('libsodium-wrappers');
      libsodium.available = true;
    } catch {}

    let activeOpusEngine = 'Nenhum (Áudio não disponível)';
    if (opusDiscord.available) {
      activeOpusEngine = '@discordjs/opus (Nativo C++ de Alta Performance)';
    } else if (nodeOpus.available) {
      activeOpusEngine = 'node-opus (Nativo)';
    } else if (opusscript.available) {
      activeOpusEngine = 'opusscript (JavaScript/WebAssembly Portátil 100% Funcional)';
    }

    // Voice & Bot states
    const isOnline = !!this.client?.isReady();
    let voiceState = 'Desconectado';
    let voiceChannelName: string | undefined;
    let voiceChannelId: string | undefined;
    let guildName: string | undefined;
    let guildId: string | undefined;
    let voicePing: number | undefined;

    if (this.voiceConnection) {
      voiceState = this.voiceConnection.state.status;
      // @ts-ignore
      if (this.voiceConnection.ping?.ws) {
        // @ts-ignore
        voicePing = this.voiceConnection.ping.ws;
      }
    }

    if (isOnline && this.client) {
      const config = db.getBotConfig();
      if (config.guildId) {
        const guild = this.client.guilds.cache.get(config.guildId);
        if (guild) {
          guildName = guild.name;
          guildId = guild.id;
        }
      }
      if (config.voiceChannelId) {
        const voiceChannel = this.client.channels.cache.get(config.voiceChannelId);
        if (voiceChannel && voiceChannel.isVoiceBased()) {
          voiceChannelName = voiceChannel.name;
          voiceChannelId = voiceChannel.id;
        }
      }
    }

    let playerState = 'Não inicializado';
    if (this.audioPlayer) {
      playerState = this.audioPlayer.state.status;
    }

    // Audio Performance Assessment & Lag Analysis
    const diagnosticNotes: string[] = [];
    let latencyStatus: 'excellent' | 'good' | 'high' | 'critical' | 'unknown' = 'unknown';

    if (voicePing !== undefined) {
      if (voicePing < 80) {
        latencyStatus = 'excellent';
      } else if (voicePing < 160) {
        latencyStatus = 'good';
      } else if (voicePing < 280) {
        latencyStatus = 'high';
        diagnosticNotes.push(`Latência de voz moderadamente alta (${voicePing}ms). Pode causar pequenos atrasos no áudio.`);
        if (Date.now() - this.lastHighPingLoggedAt > 60000) {
          this.lastHighPingLoggedAt = Date.now();
          this.logDiagnostic(
            'warn',
            'voice',
            `[PING ALTO] Latência no canal de voz está em ${voicePing}ms.`,
            'Pode haver pequenos atrasos ou microcortes no áudio transmitido para o Discord.'
          );
        }
      } else {
        latencyStatus = 'critical';
        diagnosticNotes.push(`Latência crítica no canal de voz (${voicePing}ms). Alto risco de áudio picotado, voz robótica ou travamentos.`);
        if (Date.now() - this.lastHighPingLoggedAt > 30000) {
          this.lastHighPingLoggedAt = Date.now();
          this.logDiagnostic(
            'warn',
            'voice',
            `[ALERTA DE LAG CRÍTICO] Latência do canal de voz extremamente alta (${voicePing}ms).`,
            'A conexão UDP com os servidores do Discord está lenta ou instável. Recomenda-se trocar a região do canal de voz no Discord.'
          );
        }
      }
    }

    if (this.bufferStallCount > 0) {
      diagnosticNotes.push(`${this.bufferStallCount} interrupções de buffer (stalls) registradas nesta sessão.`);
    }

    if (activeOpusEngine.includes('opusscript')) {
      diagnosticNotes.push('Motor Opus baseado em JavaScript (opusscript) em uso. Se a CPU estiver sob estresse, pode haver pequenos engasgos.');
    }

    let streamHealth: 'excellent' | 'good' | 'warning' | 'critical' | 'idle' = 'idle';
    if (this.isPlayingVoice) {
      if (latencyStatus === 'critical' || this.bufferStallCount >= 3) {
        streamHealth = 'critical';
      } else if (latencyStatus === 'high' || this.bufferStallCount >= 1) {
        streamHealth = 'warning';
      } else if (latencyStatus === 'good') {
        streamHealth = 'good';
      } else {
        streamHealth = 'excellent';
      }
    }

    const audioPerformance = {
      bufferStallCount: this.bufferStallCount,
      stallRecoveryCount: this.stallRecoveryCount,
      lastBufferingTimestamp: this.lastBufferingTimestamp,
      voicePingWs: voicePing,
      voicePingUdp: (this.voiceConnection as any)?.ping?.udp,
      streamHealth,
      latencyStatus,
      activeEngine: activeOpusEngine,
      diagnosticNotes
    };

    const mem = process.memoryUsage();

    return {
      modules: {
        opusDiscord,
        nodeOpus,
        opusscript,
        activeOpusEngine,
        tweetnacl,
        libsodium,
        ffmpeg
      },
      connection: {
        botOnline: isOnline,
        botTag: this.client?.user?.tag,
        botPing: this.client?.ws.ping,
        voiceState,
        voiceChannelName,
        voiceChannelId,
        guildName,
        guildId,
        voicePing,
        playerState,
        currentTrack: this.currentTrackName || undefined
      },
      audioPerformance,
      environment: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        uptime: Math.floor(process.uptime()),
        memoryUsageMB: Math.round(mem.rss / (1024 * 1024))
      },
      logs: this.diagnosticLogs
    };
  }

  public clearDiagnosticsLogs(): void {
    this.diagnosticLogs = [];
    this.logDiagnostic('info', 'system', 'Histórico de logs de diagnóstico limpo pelo usuário.');
  }

  public async testVoiceDiagnostics(targetVoiceChannelId?: string): Promise<{ success: boolean; diagnostics: VoiceDiagnostics; error?: string }> {
    this.logDiagnostic('info', 'voice', '🧪 Iniciando teste completo de diagnóstico do pipeline de voz...');
    
    const diagBefore = this.getDiagnostics();
    if (!diagBefore.connection.botOnline) {
      const errMsg = 'O bot não está online no Discord. Conecte com o token antes de testar o canal de voz.';
      this.logDiagnostic('error', 'voice', `Falha no teste: ${errMsg}`);
      return { success: false, diagnostics: this.getDiagnostics(), error: errMsg };
    }

    if (!diagBefore.modules.opusscript.available && !diagBefore.modules.opusDiscord.available && !diagBefore.modules.nodeOpus.available) {
      const errMsg = 'Nenhum decodificador Opus encontrado (instale opusscript ou @discordjs/opus).';
      this.logDiagnostic('error', 'audio', `Falha no motor de áudio: ${errMsg}`);
      return { success: false, diagnostics: this.getDiagnostics(), error: errMsg };
    }

    const config = db.getBotConfig();
    const chId = targetVoiceChannelId || config.voiceChannelId;
    if (!chId) {
      const errMsg = 'Nenhum canal de voz selecionado para o teste.';
      this.logDiagnostic('error', 'voice', `Falha no teste: ${errMsg}`);
      return { success: false, diagnostics: this.getDiagnostics(), error: errMsg };
    }

    const connRes = await this.ensureVoiceConnection(chId);
    if (!connRes.success) {
      this.logDiagnostic('error', 'voice', `Erro ao conectar na sala de voz para teste: ${connRes.error}`);
      return { success: false, diagnostics: this.getDiagnostics(), error: connRes.error };
    }

    this.logDiagnostic('success', 'voice', `✅ Teste de canal de voz concluído com sucesso! Motor ativo: ${diagBefore.modules.activeOpusEngine}`);
    return { success: true, diagnostics: this.getDiagnostics() };
  }

  public async start(token: string): Promise<{ success: boolean; error?: string }> {
    if (this.isConnecting) return { success: false, error: 'Bot já está em processo de conexão...' };
    if (!token || token.trim() === '') {
      this.logDiagnostic('error', 'bot', 'Tentativa de login com token vazio.');
      return { success: false, error: 'O token do Discord está vazio. Cole o token do bot nas configurações.' };
    }

    try {
      this.isConnecting = true;
      this.lastError = null;
      this.logDiagnostic('info', 'bot', 'Iniciando conexão com a API Gateway do Discord...');

      if (this.client) {
        try {
          await this.client.destroy();
        } catch {
          // ignore
        }
        this.client = null;
      }

      const cleanToken = token.trim();

      // Try full intents (Guilds, Messages, MessageContent, Voice)
      try {
        this.client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildVoiceStates,
          ]
        });

        this.setupEventHandlers();

        // 12-second login timeout
        const loginPromise = this.client.login(cleanToken);
        const timeoutPromise = new Promise<{ isTimeout: true }>((resolve) =>
          setTimeout(() => resolve({ isTimeout: true }), 12000)
        );

        const raceRes = await Promise.race([loginPromise, timeoutPromise]);
        if (raceRes && typeof raceRes === 'object' && (raceRes as any).isTimeout) {
          this.isConnecting = false;
          try {
            if (this.client) await this.client.destroy();
          } catch {}
          this.client = null;
          const timeoutMsg = 'Tempo limite excedido ao autenticar no Discord. Verifique sua conexão à internet ou o token fornecido.';
          this.lastError = timeoutMsg;
          this.logDiagnostic('error', 'bot', timeoutMsg);
          return { success: false, error: timeoutMsg };
        }

        this.isConnecting = false;
        this.logDiagnostic('success', 'bot', `Autenticação bem-sucedida! Bot conectado como @${this.client?.user?.tag}.`);
        return { success: true };
      } catch (firstErr: any) {
        const errStr = (firstErr?.message || '').toLowerCase();
        // Check for disallowed intent (e.g. MessageContent intent not enabled in Discord Developer Portal)
        if (
          firstErr?.code === 'DisallowedIntents' ||
          errStr.includes('intent') ||
          errStr.includes('disallowed_intents')
        ) {
          this.logDiagnostic('warn', 'bot', 'Intents privilegiadas não habilitadas no Developer Portal. Conectando em modo Essencial (Voz + Comandos Slash/Mestre)...');
          if (this.client) {
            try { await this.client.destroy(); } catch {}
          }

          this.client = new Client({
            intents: [
              GatewayIntentBits.Guilds,
              GatewayIntentBits.GuildVoiceStates,
            ]
          });

          this.setupEventHandlers();
          await this.client.login(cleanToken);
          this.isConnecting = false;
          this.logDiagnostic('success', 'bot', `Bot conectado com sucesso em modo de Voz e Som como @${this.client?.user?.tag}!`);
          return { success: true };
        }
        throw firstErr;
      }
    } catch (err: any) {
      this.isConnecting = false;
      let rawMsg = err?.message || 'Falha ao autenticar o bot no Discord.';
      let userFriendly = rawMsg;

      if (rawMsg.includes('TOKEN_INVALID') || rawMsg.toLowerCase().includes('invalid token') || rawMsg.toLowerCase().includes('an invalid token')) {
        userFriendly = 'Token do Discord inválido. Copie novamente o Bot Token no Discord Developer Portal.';
      } else if (rawMsg.includes('DISALLOWED_INTENTS')) {
        userFriendly = 'Permissão de Intents negada. Habilite "Privileged Gateway Intents" (Message Content Intent) no Discord Developer Portal.';
      } else if (rawMsg.includes('ENOTFOUND') || rawMsg.includes('EAI_AGAIN')) {
        userFriendly = 'Sem conexão com os servidores do Discord. Verifique sua conexão com a internet.';
      }

      this.lastError = userFriendly;
      this.logDiagnostic('error', 'bot', `Falha ao autenticar bot no Discord: ${userFriendly}`, err?.stack);
      console.error('Discord bot login error:', userFriendly);
      return { success: false, error: userFriendly };
    }
  }

  public async stop(): Promise<void> {
    this.logDiagnostic('info', 'bot', 'Desligando bot do Discord e liberando conexões e processos de áudio...');
    this.cleanupCurrentAudio();
    if (this.audioPlayer) {
      try {
        this.audioPlayer.stop(true);
      } catch {
        // ignore
      }
      this.audioPlayer = null;
    }
    if (this.voiceConnection) {
      try {
        this.voiceConnection.destroy();
      } catch {
        // ignore
      }
      this.voiceConnection = null;
    }
    if (this.client) {
      try {
        await this.client.destroy();
      } catch (err) {
        console.error('Error destroying Discord client:', err);
      }
      this.client = null;
    }
    this.lastError = null;
    this.isPlayingVoice = false;
    this.currentTrackName = null;
    this.currentTrackUrl = null;
    this.logDiagnostic('info', 'bot', 'Bot do Discord desligado com sucesso e recursos liberados.');
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('ready', () => {
      this.logDiagnostic('success', 'bot', `🤖 Discord Bot online e pronto: ${this.client?.user?.tag} (${this.client?.guilds.cache.size} servidores)`);
      console.log(`🤖 Discord Bot logged in as ${this.client?.user?.tag}!`);
      this.client?.user?.setPresence({
        activities: [{ name: 'RPG 🎲 \\r Multi-Dados | \\wr WoD | \\kr Keen', type: ActivityType.Playing }],
        status: 'online'
      });

      // Auto-select first available guild/channels if none set
      this.autoPopulateInitialChannels();
    });

    this.client.on('guildCreate', (guild) => {
      this.logDiagnostic('info', 'bot', `🏰 Adicionado ao novo servidor: ${guild.name} (${guild.id})`);
      console.log(`🏰 Entrou em um novo servidor: ${guild.name} (${guild.id})`);
      this.autoPopulateInitialChannels();
    });

    this.client.on('error', (err) => {
      this.logDiagnostic('error', 'bot', `Erro de conexão do cliente Discord: ${err.message}`, err.stack);
      console.error('Discord client encountered an error:', err);
      this.lastError = err.message;
    });

    // Message listener: WoD rolls (\r, \kr) and commands
    this.client.on('messageCreate', async (message) => {
      if (message.author.bot) return;

      const content = message.content.trim();

      // Check for World of Darkness roll commands (\r Nd10, \kr Nd10, /r, /kr, !r, !kr)
      const wodParsed = parseWodCommand(content);
      if (wodParsed) {
        const rollerName = message.member?.displayName || message.author.username;
        const result = rollWodDice(wodParsed.count, wodParsed.isKeen, rollerName, wodParsed.label);
        this.addRecentWodRoll(result);

        const embed = this.createWodEmbed(result);
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check for \caranguejo commands (\caranguejo, /caranguejo, !caranguejo)
      if (
        content === '\\caranguejo' || content === '!caranguejo' || content === '/caranguejo' ||
        content.startsWith('\\caranguejo ') || content.startsWith('!caranguejo ') || content.startsWith('/caranguejo ')
      ) {
        const embed = this.getCrabCuriosityEmbed(content);
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check for \help and \ajuda commands
      if (
        content === '\\help' || content === '!help' || content === '/help' ||
        content === '\\ajuda' || content === '!ajuda' || content === '/ajuda' ||
        content.startsWith('\\help ') || content.startsWith('!help ') || content.startsWith('/help ') ||
        content.startsWith('\\ajuda ') || content.startsWith('!ajuda ') || content.startsWith('/ajuda ')
      ) {
        const helpEmbed = this.createComprehensiveHelpEmbed();
        await message.reply({ embeds: [helpEmbed] });
        return;
      }

      // Check for !mapa or !cenario or !map
      const isMapCmd = /^[!/\\](?:mapa|cenario|map)(?:\s+(.*))?$/i.exec(content);
      if (isMapCmd) {
        const query = isMapCmd[1]?.trim();
        const maps = db.getMaps();
        let targetMap: ScenarioMap | undefined;
        if (query) {
          targetMap = maps.find(m => m.name.toLowerCase().includes(query.toLowerCase()) || m.region?.toLowerCase().includes(query.toLowerCase()));
          if (!targetMap) {
            await message.reply(`❌ Nenhum mapa encontrado com o termo "**${query}**". Mapas disponíveis: ${maps.map(m => `\`${m.name}\``).join(', ')}`);
            return;
          }
        } else {
          targetMap = db.getCurrentMap();
          if (!targetMap) {
            await message.reply('🗺️ Nenhum mapa ativo no momento. O Mestre pode selecionar um mapa no painel web do CaranguejoRPG!');
            return;
          }
        }

        const embed = this.createScenarioMapEmbed(targetMap);
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check for !mapas (list all scenarios)
      if (/^[!/\\](?:mapas|cenarios|maps)$/i.test(content)) {
        const maps = db.getMaps();
        if (maps.length === 0) {
          await message.reply('🗺️ Nenhum mapa cadastrado ainda.');
          return;
        }
        const current = db.getCurrentMap();
        const listStr = maps.map(m => `• **${m.name}** ${m.id === current?.id ? '⭐ *(Mapa Atual)*' : ''}\n  *${m.description || 'Sem descrição'}* (${m.markers.filter(x => !x.isSecret).length} pontos de interesse públicos)`).join('\n\n');
        const embed = new EmbedBuilder()
          .setColor('#3b82f6')
          .setTitle('🗺️ Mapas & Cenários da Mesa')
          .setDescription(listStr)
          .setFooter({ text: 'Digite !mapa [nome] para inspecionar um cenário' });
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check for !marcador, !poi, !local
      const isMarkerCmd = /^[!/\\](?:marcador|poi|local|ponto)(?:\s+(.+))?$/i.exec(content);
      if (isMarkerCmd) {
        const query = isMarkerCmd[1]?.trim();
        if (!query) {
          await message.reply('ℹ️ Digite o nome do marcador que deseja inspecionar. Ex: `!marcador Taverna do Siri`');
          return;
        }
        const maps = db.getMaps();
        const currentMap = db.getCurrentMap();
        let matched: { map: ScenarioMap; marker: MapMarker } | null = null;
        if (currentMap) {
          const m = currentMap.markers.find(x => !x.isSecret && x.name.toLowerCase().includes(query.toLowerCase()));
          if (m) matched = { map: currentMap, marker: m };
        }
        if (!matched) {
          for (const mp of maps) {
            const m = mp.markers.find(x => !x.isSecret && x.name.toLowerCase().includes(query.toLowerCase()));
            if (m) {
              matched = { map: mp, marker: m };
              break;
            }
          }
        }

        if (!matched) {
          await message.reply(`❌ Marcador público "**${query}**" não encontrado nos mapas ativos.`);
          return;
        }

        const embed = this.createMapMarkerEmbed(matched.map, matched.marker);
        await message.reply({ embeds: [embed] });
        return;
      }

      // Check for Advanced Multi-Dice Roll commands:
      // Comandos: \r <formula> [motivo], !r, /r, \roll, !roll, /roll
      // Ou shorthand: \d20, !2d6+3, \1d100, etc.
      const rollMatch = /^[!/\\](?:roll|r)(?:\s+(.*))?$/i.exec(content) || /^[!/\\](d\d+|[0-9]+d[0-9]+.*)$/i.exec(content);
      if (rollMatch) {
        let rawInput = (rollMatch[1] || '').trim();
        if (!rawInput) {
          rawInput = '1d20';
        }

        // Separate formula from optional action label
        // Matches tokens like 1d20, 2d20kh1, +5, -2, etc.
        const formulaMatch = rawInput.match(/^((?:[+-]?\s*(?:\d*d\d+(?:kh\d+|kl\d+)?|\d+)\s*)+)(.*)$/i);
        let formulaStr = formulaMatch && formulaMatch[1].trim() ? formulaMatch[1].trim() : rawInput;
        const labelStr = (formulaMatch && formulaMatch[2]?.trim()) || undefined;

        // If just a plain number like '20', '6', '100', treat as '1d20', '1d6', '1d100'
        if (/^\d+$/.test(formulaStr)) {
          formulaStr = `1d${formulaStr}`;
        } else if (/^d\d+$/i.test(formulaStr)) {
          formulaStr = `1${formulaStr}`;
        }

        const parsed = parseAdvancedDiceFormula(formulaStr);
        if (parsed) {
          const rollerName = message.member?.displayName || message.author.username;
          const result = rollAdvancedDice(formulaStr, rollerName, labelStr);
          result.source = 'discord';
          db.addDiceRoll(result);
          const embed = this.createAdvancedDiceEmbed(result);
          await message.reply({ embeds: [embed] });
          return;
        } else {
          await message.reply(
            `⚠️ **Fórmula de dados inválida.**\n` +
            `Exemplos de uso para Multi-Dados:\n` +
            `• \`\\r 1d20+5\` *(D20 com modificador)*\n` +
            `• \`\\r 2d20kh1 + 2d6 + 3 Ataque com Vantagem\`\n` +
            `• \`\\r 4d6\` ou \`\\r 1d100\`\n\n` +
            `*Para rolar Mundo das Trevas (d10), use:*\n` +
            `• \`\\wr 6\` (Normal, 10s explodem)\n` +
            `• \`\\kr 6\` (Keen Roll, 9 e 10 explodem)`
          );
          return;
        }
      }

      // Other prefix commands
      const prefix = db.getBotConfig().prefix || '!';
      if (content.startsWith(prefix + 'ping')) {
        await message.reply('🎲 **Escudo do Mestre Online!** Sistema de áudio, ambientação, soundboard e dados WoD prontos.');
      }
    });
  }

  private autoPopulateInitialChannels() {
    if (!this.client?.isReady()) return;
    const config = db.getBotConfig();
    const guilds = Array.from(this.client.guilds.cache.values());
    if (guilds.length === 0) return;

    let targetGuild = guilds.find(g => g.id === config.guildId) || guilds[0];
    let updates: Partial<typeof config> = {};

    if (!config.guildId || config.guildId !== targetGuild.id) {
      updates.guildId = targetGuild.id;
    }

    if (!config.textChannelId) {
      const defaultText = targetGuild.channels.cache.find(
        ch => ch.type === ChannelType.GuildText && ch.permissionsFor(targetGuild.members.me!)?.has('SendMessages')
      );
      if (defaultText) updates.textChannelId = defaultText.id;
    }

    if (!config.voiceChannelId) {
      const defaultVoice = targetGuild.channels.cache.find(ch => ch.type === ChannelType.GuildVoice);
      if (defaultVoice) updates.voiceChannelId = defaultVoice.id;
    }

    if (Object.keys(updates).length > 0) {
      db.updateBotConfig(updates);
      console.log('📡 Canais do Discord auto-configurados com sucesso:', updates);
    }
  }

  public getRecentWodRolls(): WodDiceRollResult[] {
    return this.recentWodRolls;
  }

  public addRecentWodRoll(result: WodDiceRollResult): void {
    this.recentWodRolls.unshift(result);
    if (this.recentWodRolls.length > 50) {
      this.recentWodRolls.pop();
    }
  }

  private createWodEmbed(result: WodDiceRollResult): EmbedBuilder {
    let color: ColorResolvable = '#6366f1';
    let statusSummary = '';

    if (result.totalSuccesses > 0) {
      if (result.totalCriticalHits > 0) {
        color = '#eab308'; // Gold for Critical
        statusSummary = `🌟 **${result.totalSuccesses} SUCESSO(S)** com **${result.totalCriticalHits} CRÍTICO(S)**!`;
      } else {
        color = '#22c55e'; // Green for normal successes
        statusSummary = `✅ **${result.totalSuccesses} SUCESSO(S)**!`;
      }
    } else {
      if (result.totalCriticalFails > 0) {
        color = '#ef4444'; // Red for Botch
        statusSummary = `💀 **FALHA CRÍTICA (BOTCH)!** Nenhum sucesso e ${result.totalCriticalFails} dado(s) 1.`;
      } else {
        color = '#64748b'; // Slate for simple failure
        statusSummary = `❌ **FALHA!** Nenhum sucesso obtido.`;
      }
    }

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(
        result.isKeenRoll
          ? `🩸 WoD Keen Roll (9-10 Crítico): \`${result.command}\``
          : `🎲 WoD Rolagem (10 Crítico): \`${result.command}\``
      )
      .setDescription(
        `**Rolado por:** ${result.rollerName || 'Mestre'}\n` +
        `**Resultado:** ${statusSummary}\n\n` +
        `🎲 **Roll Base (${result.diceCount}d10):** \`[ ${result.baseRolls.join(', ')} ]\``
      )
      .setTimestamp();

    result.bonusWaves.forEach((w) => {
      embed.addFields({
        name: `⚡ Explosão (${w.waveIndex}ª Rodada)`,
        value: `\`[ ${w.rolls.join(', ')} ]\``,
        inline: true
      });
    });

    embed.addFields([
      { name: '✨ Total Acertos', value: `**${result.totalSuccesses}**`, inline: true },
      { name: '🌟 Críticos Ativos', value: `**${result.totalCriticalHits}**`, inline: true },
      { name: '💀 Erros Críticos (1s)', value: `**${result.totalCriticalFails}** (${result.cancelledSuccesses} cancelamento${result.cancelledSuccesses !== 1 ? 's' : ''})`, inline: true }
    ]);

    embed.setFooter({ text: 'Sistema de Dados • Mundo das Trevas (WoD)' });
    return embed;
  }

  private getCrabCuriosityEmbed(content: string): EmbedBuilder {
    const curiosities = loadCaranguejoCuriosities();
    let selected = curiosities[0];

    // Check if user requested a specific ID like \caranguejo 4
    const parts = content.trim().split(/\s+/);
    if (parts.length > 1) {
      const requestedId = parseInt(parts[1], 10);
      const found = curiosities.find(c => c.id === requestedId);
      if (found) {
        selected = found;
      } else {
        selected = curiosities[Math.floor(Math.random() * curiosities.length)];
      }
    } else {
      selected = curiosities[Math.floor(Math.random() * curiosities.length)];
    }

    const embed = new EmbedBuilder()
      .setColor('#ea580c')
      .setTitle(`🦀 Curiosidade Crustácea #${selected.id}: ${selected.title}`)
      .setDescription(selected.fact)
      .setTimestamp();

    if (selected.category) {
      embed.addFields({
        name: '🔬 Categoria Científica',
        value: selected.category,
        inline: true
      });
    }

    if (selected.rpg_hook) {
      embed.addFields({
        name: '⚔️ Gancho de Mesa (RPG Hook)',
        value: `*${selected.rpg_hook}*`,
        inline: false
      });
    }

    embed.setFooter({
      text: 'CaranguejoRPG • O Guardião da Mesa | Digite \\caranguejo para outra curiosidade ou \\help'
    });

    return embed;
  }

  private createComprehensiveHelpEmbed(): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor('#6366f1')
      .setTitle('🦀 CaranguejoRPG — Guia de Comandos & Funcionalidades')
      .setDescription(
        '**Bem-vindo ao CaranguejoRPG!** O assistente definitivo de mesa para o Mestre, integrando áudio contínuo, som ambiente, efeitos instantâneos (SFX), rolador de dados e ferramentas de sessão no Discord.'
      )
      .addFields([
        {
          name: '🎲 Rolagem Multi-Dados (d4 a d100 • D&D e Sistemas Gerais)',
          value:
            '• `\\r 1d20+5` — Rola d20 com modificador\n' +
            '• `\\r 2d20kh1 + 2d6 + 3 Ataque com Vantagem` — Multi-dados com vantagem (`kh1`) e motivo\n' +
            '• `\\r 4d6` ou `\\r 1d100` — Rola qualquer combinação (d4, d6, d8, d10, d12, d20, d100)\n' +
            '• `\\r 2d20kl1` — Rolagem com desvantagem (`kl1`)',
          inline: false
        },
        {
          name: '🩸 Rolagem Mundo das Trevas (WoD Storyteller d10)',
          value:
            '• `\\wr 8` ou `\\wr 8d10` — **WoD Normal** (Sucesso 7+, 10s explodem, pares de 1 anulam)\n' +
            '• `\\kr 6` ou `\\kr 6d10` — **Keen Roll** (Críticos e explosões no 9 e 10)\n' +
            '• `\\wr 7 Furtividade` — Rola com anotação da ação',
          inline: false
        },
        {
          name: '🗺️ Mapas & Cenários da Mesa',
          value:
            '• `!mapa` — Exibe o mapa ativo com imagem e pontos de interesse públicos\n' +
            '• `!mapas` — Lista todos os cenários e mapas disponíveis da campanha\n' +
            '• `!marcador [nome]` ou `!poi [nome]` — Inspeciona detalhes de um ponto de interesse',
          inline: false
        },
        {
          name: '🦀 Curiosidades Crustáceas',
          value:
            '• `\\caranguejo` — Sorteia uma curiosidade real sobre caranguejos com gancho de campanha de RPG\n' +
            '• `\\caranguejo [número]` — Mostra uma curiosidade específica (ex: `\\caranguejo 3`)',
          inline: false
        },
        {
          name: '📖 Informações do Bot',
          value:
            '• `\\help` ou `\\ajuda` — Exibe este manual completo de comandos\n' +
            '• `!ping` — Verifica se a conexão com o bot está ativa',
          inline: false
        },
        {
          name: '🛡️ Funcionalidades do Painel Web do Mestre',
          value:
            '• **🎵 Músicas & 🌿 Ambientação:** Duas trilhas independentes no Mixer com volume individual e loop contínuo.\n' +
            '• **🔊 Soundboard:** Disparo instantâneo de efeitos sonoros com teclas de atalho.\n' +
            '• **⚔️ Gerador de Encontros:** Geração balanceada por nível, ambiente e quantidade com envio direto para o Discord.\n' +
            '• **🎯 Roleta Customizável:** Sorteios aleatórios com porcentagens e fatias configuráveis enviados ao chat.\n' +
            '• **🖼️ Envio de NPCs:** Divulgação anônima de artes conceituais para os jogadores.\n' +
            '• **⏱️ Rastreador de Combate:** Gerenciamento de iniciativa com avisos de turnos no Discord.',
          inline: false
        }
      ])
      .setFooter({
        text: 'CaranguejoRPG • Desenvolvido para Mestres Lendários'
      })
      .setTimestamp();

    return embed;
  }

  public async broadcastWodDiceRoll(result: WodDiceRollResult, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot offline. A rolagem foi salva no painel local.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) return { success: false, error: 'Nenhum canal de texto configurado.' };

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) return { success: false, error: 'Canal inválido.' };

      const embed = this.createWodEmbed(result);
      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public createAdvancedDiceEmbed(result: AdvancedDiceRollResult): EmbedBuilder {
    let color: ColorResolvable = '#6366f1';
    let critText = '';
    if (result.isCriticalSuccess) {
      color = '#10b981'; // Green for nat 20 / crit
      critText = ' 🌟 **CRÍTICO SUPREMO (NAT 20)!**';
    } else if (result.isCriticalFail) {
      color = '#ef4444'; // Red for nat 1
      critText = ' 💀 **FALHA CRÍTICA (NAT 1)!**';
    }

    const titlePrefix = result.isCriticalSuccess ? '✨' : result.isCriticalFail ? '💥' : '🎲';
    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${titlePrefix} Rolagem: \`${result.cleanFormula}\`${result.label ? ` • ${result.label}` : ''}`)
      .setDescription(
        `**Rolado por:** ${result.rollerName || 'Jogador/Mestre'}\n` +
        (result.label ? `**Ação / Motivo:** *${result.label}*\n` : '') +
        `**Resultado Total:** 💥 **\`${result.total}\`**${critText}\n\n` +
        `📝 **Detalhamento:** \`${result.breakdown}\``
      )
      .setTimestamp();

    result.groups.forEach(g => {
      let valStr = `\`[ ${g.keptRolls.join(', ')} ]\``;
      if (g.droppedRolls && g.droppedRolls.length > 0) {
        valStr += `\n*(Descartados: [ ${g.droppedRolls.join(', ')} ])*`;
      }
      valStr += `\n**Subtotal:** ${g.subtotal}`;
      embed.addFields({
        name: `🎲 Grupo ${g.notation}`,
        value: valStr,
        inline: true
      });
    });

    if (result.modifier !== 0) {
      embed.addFields({
        name: '⚖️ Modificador',
        value: `\`${result.modifier > 0 ? `+${result.modifier}` : result.modifier}\``,
        inline: true
      });
    }

    embed.setFooter({ text: 'CaranguejoRPG • Rolador Avançado Multi-Dados (d4, d6, d8, d10, d12, d20, d100)' });
    return embed;
  }

  public async broadcastAdvancedDiceRoll(result: AdvancedDiceRollResult, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot offline. A rolagem foi salva no painel do navegador.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) return { success: false, error: 'Nenhum canal de texto do Discord configurado.' };

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) return { success: false, error: 'Canal de texto inválido.' };

      const embed = this.createAdvancedDiceEmbed(result);
      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public createScenarioMapEmbed(map: ScenarioMap): EmbedBuilder {
    const embed = new EmbedBuilder()
      .setColor('#3b82f6')
      .setTitle(`🗺️ Cenário & Mapa: ${map.name}`)
      .setDescription(
        `${map.description || 'Explore as terras deste cenário detalhado!'}\n\n` +
        (map.region ? `🌍 **Região:** ${map.region}\n` : '') +
        (map.climate ? `🌤️ **Clima & Atmosfera:** ${map.climate}\n` : '')
      )
      .setTimestamp();

    if (map.imageUrl && (map.imageUrl.startsWith('http://') || map.imageUrl.startsWith('https://'))) {
      embed.setImage(map.imageUrl);
    }

    const publicMarkers = (map.markers || []).filter(m => !m.isSecret);
    if (publicMarkers.length > 0) {
      const categoryEmojiMap: Record<string, string> = {
        tavern: '🍺',
        danger: '⚠️',
        treasure: '💎',
        npc: '👤',
        monster: '👹',
        quest: '📜',
        location: '📍',
        poi: '🔍',
        custom: '⭐'
      };

      const markersSummary = publicMarkers.slice(0, 10).map(m => {
        const emoji = categoryEmojiMap[m.category] || '📍';
        const descPreview = m.description ? `— ${m.description.slice(0, 60)}${m.description.length > 60 ? '...' : ''}` : '';
        return `${emoji} **${m.name}** ${descPreview}`;
      }).join('\n');

      embed.addFields({
        name: `📍 Pontos de Interesse Conhecidos (${publicMarkers.length})`,
        value: markersSummary + (publicMarkers.length > 10 ? `\n*...e mais ${publicMarkers.length - 10} pontos de interesse.*` : ''),
        inline: false
      });
    }

    embed.setFooter({
      text: 'CaranguejoRPG • Digite !marcador [nome] para inspecionar um local detalhado'
    });

    return embed;
  }

  public async broadcastMap(map: ScenarioMap, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot do Discord desconectado. Inicie o bot no menu superior.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) return { success: false, error: 'Nenhum canal de texto do Discord configurado.' };

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) return { success: false, error: 'Canal de texto inválido.' };

      const embed = this.createScenarioMapEmbed(map);
      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public createMapMarkerEmbed(map: ScenarioMap, marker: MapMarker): EmbedBuilder {
    const categoryEmojiMap: Record<string, string> = {
      tavern: '🍺 Taverna & Comércio',
      danger: '⚠️ Perigo & Armadilha',
      treasure: '💎 Tesouro & Recompensa',
      npc: '👤 Personagem & Aliado',
      monster: '👹 Monstro & Covil',
      quest: '📜 Missão & Objetivo',
      location: '📍 Localidade Geográfica',
      poi: '🔍 Ponto de Interesse',
      custom: '⭐ Ponto Especial'
    };

    const categoryTitle = categoryEmojiMap[marker.category] || '📍 Ponto de Interesse';
    const embed = new EmbedBuilder()
      .setColor((marker.color as ColorResolvable) || '#f59e0b')
      .setTitle(`${categoryTitle}: ${marker.name}`)
      .setDescription(
        `${marker.description || 'Nenhuma descrição detalhada disponível.'}\n\n` +
        (marker.linkedItem ? `🎒 **Item / Loot Vinculado:** ${marker.linkedItem}\n` : '') +
        (marker.linkedNpcName ? `👤 **NPC Vinculado:** ${marker.linkedNpcName}\n` : '') +
        `🧭 **Coordenadas:** X: \`${marker.x.toFixed(1)}%\`, Y: \`${marker.y.toFixed(1)}%\`\n` +
        `🗺️ **Cenário:** \`${map.name}\``
      )
      .setTimestamp();

    if (map.imageUrl && (map.imageUrl.startsWith('http://') || map.imageUrl.startsWith('https://'))) {
      embed.setThumbnail(map.imageUrl);
    }

    embed.setFooter({
      text: 'CaranguejoRPG • Mapeamento Tático & Interativo'
    });

    return embed;
  }

  public async broadcastMapMarker(map: ScenarioMap, marker: MapMarker, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot do Discord desconectado. Inicie o bot no menu superior.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) return { success: false, error: 'Nenhum canal de texto do Discord configurado.' };

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) return { success: false, error: 'Canal de texto inválido.' };

      const embed = this.createMapMarkerEmbed(map, marker);
      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public getStatus(): BotStatus {
    const config = db.getBotConfig();
    const isOnline = !!this.client?.isReady();

    let currentGuildInfo: { id: string; name: string } | undefined;
    let connectedVoiceChannelInfo: { id: string; name: string } | undefined;
    let targetTextChannelInfo: { id: string; name: string } | undefined;

    const isVoiceConnected = !!(
      this.voiceConnection &&
      this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed &&
      this.voiceConnection.state.status !== VoiceConnectionStatus.Disconnected
    );

    if (isOnline && this.client) {
      if (config.guildId) {
        const guild = this.client.guilds.cache.get(config.guildId);
        if (guild) {
          currentGuildInfo = { id: guild.id, name: guild.name };
        }
      }
      if (config.voiceChannelId) {
        const voiceChannel = this.client.channels.cache.get(config.voiceChannelId);
        if (voiceChannel && voiceChannel.isVoiceBased()) {
          connectedVoiceChannelInfo = { id: voiceChannel.id, name: voiceChannel.name };
        }
      }
      if (config.textChannelId) {
        const textChannel = this.client.channels.cache.get(config.textChannelId);
        if (textChannel && textChannel.isTextBased()) {
          targetTextChannelInfo = { id: textChannel.id, name: (textChannel as any).name || 'Chat' };
        }
      }
    }

    return {
      isConfigured: !!config.token,
      isOnline,
      isVoiceConnected,
      username: this.client?.user?.username,
      avatar: this.client?.user?.displayAvatarURL(),
      guildsCount: this.client?.guilds.cache.size || 0,
      currentGuild: currentGuildInfo,
      connectedVoiceChannel: isVoiceConnected ? connectedVoiceChannelInfo : undefined,
      targetTextChannel: targetTextChannelInfo,
      error: this.lastError,
      mode: isOnline ? 'discord' : 'local_only'
    };
  }

  public getGuilds(): DiscordGuild[] {
    if (!this.client?.isReady()) return [];

    const guilds: DiscordGuild[] = [];
    this.client.guilds.cache.forEach((guild) => {
      const channels: Array<{ id: string; name: string; type: 'text' | 'voice'; guildId: string; isVoiceWithChat?: boolean }> = [];
      guild.channels.cache.forEach((ch) => {
        if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildAnnouncement) {
          channels.push({ id: ch.id, name: ch.name, type: 'text', guildId: guild.id, isVoiceWithChat: false });
        } else if (ch.type === ChannelType.GuildVoice || ch.type === ChannelType.GuildStageVoice) {
          channels.push({ id: ch.id, name: ch.name, type: 'voice', guildId: guild.id, isVoiceWithChat: true });
        }
      });

      guilds.push({
        id: guild.id,
        name: guild.name,
        icon: guild.iconURL() || undefined,
        channels
      });
    });

    return guilds;
  }

  public async sendMessage(payload: DiscordMessagePayload): Promise<{ success: boolean; messageId?: string; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'O bot do Discord não está conectado. Ative-o nas configurações ou use no modo local.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = payload.channelId || config.textChannelId;

    if (!targetChannelId) {
      return { success: false, error: 'Nenhum canal de texto configurado ou selecionado.' };
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) {
        return { success: false, error: 'Canal de texto não encontrado ou inválido.' };
      }

      const textChannel = channel as TextChannel;

      // Prepare file attachments if provided (base64 image, local file path or url)
      const files: AttachmentBuilder[] = [];
      if (payload.base64Image) {
        const matches = payload.base64Image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        const b64Data = matches && matches.length === 3 ? matches[2] : payload.base64Image;
        try {
          const buffer = Buffer.from(b64Data, 'base64');
          const fileName = payload.attachmentName || 'desenho_mestre.png';
          files.push(new AttachmentBuilder(buffer, { name: fileName }));
        } catch (e) {
          console.warn('Could not parse base64 image:', e);
        }
      } else if (payload.imageUrl || payload.attachmentUrl) {
        const imgUrl = payload.imageUrl || payload.attachmentUrl;
        if (imgUrl.startsWith('/media/')) {
          let localPath = '';
          if (imgUrl.startsWith('/media/npcs/')) {
            localPath = path.join(process.cwd(), 'data', 'npcs', imgUrl.replace('/media/npcs/', ''));
          } else if (imgUrl.startsWith('/media/uploads/')) {
            localPath = path.join(process.cwd(), 'data', 'uploads', imgUrl.replace('/media/uploads/', ''));
          }
          if (localPath && fs.existsSync(localPath)) {
            files.push(new AttachmentBuilder(localPath, { name: path.basename(localPath) }));
          }
        }
      }

      // Handle styled types
      if (payload.type === 'narrative') {
        const narrativeEmbed = new EmbedBuilder()
          .setColor('#c2410c') // Amber/orange narrative tone
          .setAuthor({ name: '📜 Narração do Mestre' })
          .setDescription(payload.content ? `*${payload.content}*` : '*[Imagem enviada pelo Mestre]*')
          .setTimestamp();
        
        if (files.length > 0) {
          narrativeEmbed.setImage(`attachment://${files[0].name}`);
        } else if (payload.imageUrl && (payload.imageUrl.startsWith('http://') || payload.imageUrl.startsWith('https://'))) {
          narrativeEmbed.setImage(payload.imageUrl);
        }

        const sent = await textChannel.send({ embeds: [narrativeEmbed], files: files.length > 0 ? files : undefined });
        return { success: true, messageId: sent.id };
      }

      if (payload.embed) {
        const embed = new EmbedBuilder();
        if (payload.embed.title) embed.setTitle(payload.embed.title);
        if (payload.embed.description) embed.setDescription(payload.embed.description);
        if (payload.embed.color) {
          embed.setColor(payload.embed.color as ColorResolvable);
        } else {
          embed.setColor('#6366f1');
        }
        if (payload.embed.authorName) {
          embed.setAuthor({
            name: payload.embed.authorName,
            iconURL: payload.embed.authorIcon
          });
        }
        if (payload.embed.thumbnailUrl) embed.setThumbnail(payload.embed.thumbnailUrl);
        if (files.length > 0 && !payload.embed.imageUrl) {
          embed.setImage(`attachment://${files[0].name}`);
        } else if (payload.embed.imageUrl) {
          embed.setImage(payload.embed.imageUrl);
        }
        if (payload.embed.footerText) embed.setFooter({ text: payload.embed.footerText });
        if (payload.embed.fields && payload.embed.fields.length > 0) {
          embed.addFields(payload.embed.fields);
        }

        const sent = await textChannel.send({
          content: payload.content || undefined,
          embeds: [embed],
          files: files.length > 0 ? files : undefined
        });
        return { success: true, messageId: sent.id };
      }

      // Plain text message (or message with image attachment)
      if (payload.content || files.length > 0) {
        const sent = await textChannel.send({
          content: payload.content || undefined,
          files: files.length > 0 ? files : undefined
        });
        return { success: true, messageId: sent.id };
      }

      return { success: false, error: 'Mensagem vazia.' };
    } catch (err: any) {
      console.error('Error sending discord message:', err);
      return { success: false, error: err?.message || 'Falha ao enviar mensagem no Discord.' };
    }
  }

  // ==========================================
  // DISCORD CHAT MESSAGES READER
  // ==========================================

  public async getChannelMessages(channelId: string, limit: number = 40): Promise<{ success: boolean; messages?: any[]; channelName?: string; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot do Discord não está conectado.' };
    }
    try {
      const channel = await this.client.channels.fetch(channelId);
      if (!channel || !channel.isTextBased()) {
        return { success: false, error: 'Canal de texto não encontrado ou inacessível.' };
      }
      const textChannel = channel as TextChannel;
      const fetched = await textChannel.messages.fetch({ limit: Math.min(limit, 100) });
      const messages = Array.from(fetched.values()).map(msg => ({
        id: msg.id,
        author: {
          id: msg.author.id,
          username: msg.author.username,
          discriminator: msg.author.discriminator,
          avatar: msg.author.displayAvatarURL(),
          bot: msg.author.bot,
        },
        content: msg.content,
        cleanContent: msg.cleanContent,
        createdAt: msg.createdAt.toISOString(),
        attachments: Array.from(msg.attachments.values()).map(att => ({
          id: att.id,
          name: att.name,
          url: att.url,
          proxyURL: att.proxyURL,
          contentType: att.contentType,
          size: att.size,
        })),
        embeds: msg.embeds.map(e => ({
          title: e.title,
          description: e.description,
          color: e.color,
          fields: e.fields,
          image: e.image?.url,
          thumbnail: e.thumbnail?.url,
          footer: e.footer?.text,
        }))
      })).reverse();

      return {
        success: true,
        channelName: textChannel.name,
        messages
      };
    } catch (err: any) {
      console.error('Error fetching channel messages:', err);
      return { success: false, error: err?.message || 'Falha ao buscar mensagens do canal.' };
    }
  }

  // ==========================================
  // DISCORD VOICE AUDIO STREAMING
  // ==========================================

  public async ensureVoiceConnection(voiceChannelId?: string): Promise<{ success: boolean; connection?: VoiceConnection; error?: string }> {
    if (!this.client?.isReady()) {
      const err = 'Bot do Discord não está conectado à API.';
      this.logDiagnostic('error', 'voice', err);
      return { success: false, error: err };
    }
    const config = db.getBotConfig();
    const targetChannelId = voiceChannelId || config.voiceChannelId;
    if (!targetChannelId) {
      const err = 'Nenhum canal de voz configurado para conectar.';
      this.logDiagnostic('warn', 'voice', err);
      return { success: false, error: err };
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        const err = `Canal ID ${targetChannelId} não é um canal de voz válido.`;
        this.logDiagnostic('error', 'voice', err);
        return { success: false, error: err };
      }

      const voiceChannel = channel as VoiceChannel;
      const guild = voiceChannel.guild;

      if (!this.voiceConnection || this.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) {
        this.logDiagnostic('info', 'voice', `Conectando ao canal de voz "${voiceChannel.name}" no servidor "${guild.name}"...`);
        
        this.voiceConnection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator as any
        });

        // Monitor Voice Connection State & Network Lag
        this.voiceConnection.on('stateChange', async (oldState, newState) => {
          const isReconnecting = newState.status === VoiceConnectionStatus.Signalling || newState.status === VoiceConnectionStatus.Connecting;
          if (isReconnecting && oldState.status === VoiceConnectionStatus.Ready) {
            this.voiceDisconnectCount++;
            this.logDiagnostic(
              'warn',
              'voice',
              `[ALERTA DE REDE/LAG] Canal de voz perdeu estado Ready e está reconectando: ${oldState.status} -> ${newState.status}. O áudio foi interrompido temporariamente.`,
              `Possível causa: oscilação na rota UDP, perda de pacotes da internet ou troca de região de voz pelo Discord.`
            );
          } else if (newState.status === VoiceConnectionStatus.Disconnected) {
            // Disconnect handling with automatic reconnection
            const isWebSocketClose = (newState as any).reason === VoiceConnectionDisconnectReason.WebSocketClose;
            const closeCode = (newState as any).closeCode;
            if (isWebSocketClose && closeCode === 4014) {
              // 4014: Moved channels or kicked from channel
              try {
                await entersState(this.voiceConnection!, VoiceConnectionStatus.Connecting, 5_000);
                this.logDiagnostic('info', 'voice', 'Bot restabeleceu conexão após mudança de canal de voz.');
              } catch {
                this.logDiagnostic('warn', 'voice', 'Bot foi desconectado da sala de voz no Discord.');
                this.cleanupCurrentAudio();
                if (this.voiceConnection) {
                  try { this.voiceConnection.destroy(); } catch {}
                  this.voiceConnection = null;
                }
              }
            } else if (this.voiceConnection && (this.voiceConnection as any).rejoinAttempts < 5) {
              this.voiceDisconnectCount++;
              const attempt = ((this.voiceConnection as any).rejoinAttempts || 0) + 1;
              this.logDiagnostic(
                'warn',
                'voice',
                `[RECONEXÃO AUTOMÁTICA] Queda no socket UDP do canal de voz (tentativa ${attempt}/5). Reconectando...`,
                `O Discord reiniciou a conexão de voz. Reconectando sem interromper o aplicativo...`
              );
              await new Promise(r => setTimeout(r, attempt * 500));
              if (this.voiceConnection && this.voiceConnection.state.status !== VoiceConnectionStatus.Destroyed) {
                this.voiceConnection.rejoin();
              }
            } else {
              this.logDiagnostic('error', 'voice', 'Limite de reconexões imediatas atingido. Reiniciando sessão de voz com o canal...');
              this.cleanupCurrentAudio();
              if (this.voiceConnection) {
                try { this.voiceConnection.destroy(); } catch {}
                this.voiceConnection = null;
              }
              // Auto-reconnect cleanly
              setTimeout(async () => {
                const reconnected = await this.ensureVoiceConnection();
                if (reconnected.success && this.currentTrackUrl) {
                  this.logDiagnostic('success', 'voice', 'Canal de voz restaurado com sucesso! Retomando reprodução...');
                  this.playVoiceAudio(this.currentTrackUrl, this.currentTrackVolume);
                }
              }, 2000);
            }
          } else {
            this.logDiagnostic(
              newState.status === VoiceConnectionStatus.Ready ? 'success' : 'info',
              'voice',
              `Estado da conexão de voz alterado: ${oldState.status} -> ${newState.status}`
            );
          }
        });

        this.voiceConnection.on('error', (error) => {
          this.logDiagnostic('error', 'voice', `Erro na conexão de voz: ${error.message}`, error.stack);
          console.error('Discord voice connection error:', error);
        });

        if (!this.audioPlayer) {
          this.audioPlayer = createAudioPlayer({
            behaviors: {
              noSubscriber: NoSubscriberBehavior.Play,
              maxMissedFrames: 30
            }
          });
          
          this.audioPlayer.on(AudioPlayerStatus.Idle, (oldState) => {
            this.isPlayingVoice = false;
            this.cleanupCurrentAudio();
            this.logDiagnostic('info', 'audio', 'Audio Player ocioso (reprodução terminada ou em espera).');
          });

          this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
            this.isPlayingVoice = true;
            if (this.bufferWatchdogTimer) {
              clearTimeout(this.bufferWatchdogTimer);
              this.bufferWatchdogTimer = null;
            }
            if (this.bufferingStartTime) {
              const stallDuration = Date.now() - this.bufferingStartTime;
              this.bufferingStartTime = null;
              if (stallDuration > 200) {
                this.logDiagnostic(
                  'info',
                  'audio',
                  `[ÁUDIO RESTABELECIDO] O fluxo de som normalizou após ${stallDuration}ms. Reprodução contínua.`
                );
              }
            }
            this.logDiagnostic('success', 'audio', `Reproduzindo áudio no Discord: ${this.currentTrackName || 'Faixa de áudio'}`);
          });

          this.audioPlayer.on(AudioPlayerStatus.Buffering, () => {
            this.bufferStallCount++;
            this.lastBufferingTimestamp = new Date().toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
            this.bufferingStartTime = Date.now();

            const mem = process.memoryUsage();
            const memMB = Math.round(mem.rss / (1024 * 1024));
            const heapMB = Math.round(mem.heapUsed / (1024 * 1024));
            const voicePing = (this.voiceConnection as any)?.ping?.ws;
            const pingStr = typeof voicePing === 'number' ? `${voicePing}ms` : 'medindo...';
            const voiceState = this.voiceConnection?.state?.status || 'Desconhecido';

            this.logDiagnostic(
              'warn',
              'audio',
              `[PERFORMANCE] Buffer stall #${this.bufferStallCount} na faixa "${this.currentTrackName || 'Áudio'}".`,
              `Diagnóstico em tempo real: Ping Discord: ${pingStr} | RAM do Processo: ${memMB}MB (Heap: ${heapMB}MB) | Conexão Voz: ${voiceState}. Aguardando preenchimento do buffer...`
            );

            // Watchdog: If player stays buffering for > 3.5s, auto-recover stream
            if (this.bufferWatchdogTimer) clearTimeout(this.bufferWatchdogTimer);
            this.bufferWatchdogTimer = setTimeout(async () => {
              if (this.audioPlayer?.state.status === AudioPlayerStatus.Buffering && !this.isRecoveringBuffer) {
                this.isRecoveringBuffer = true;
                this.stallRecoveryCount++;
                this.logDiagnostic(
                  'warn',
                  'audio',
                  `[AUTO-RECUPERAÇÃO #${this.stallRecoveryCount}] O buffer congelou por 3.5s na faixa "${this.currentTrackName}". O stream travou na fonte. Restaurando fluxo automaticamente...`
                );
                try {
                  if (this.currentTrackUrl) {
                    await this.playVoiceAudio(this.currentTrackUrl, this.currentTrackVolume);
                  }
                } finally {
                  this.isRecoveringBuffer = false;
                }
              }
            }, 3500);
          });

          this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
            this.isPlayingVoice = false;
            this.logDiagnostic('info', 'audio', 'Reprodução de áudio pausada.');
          });

          this.audioPlayer.on('error', (error) => {
            this.logDiagnostic('error', 'audio', `Erro no player de áudio Discord: ${error.message}`, error.stack);
            console.error('Discord voice audio player error:', error);
            this.isPlayingVoice = false;
            this.cleanupCurrentAudio();
          });
        }

        this.voiceConnection.subscribe(this.audioPlayer);
      }
      return { success: true, connection: this.voiceConnection };
    } catch (err: any) {
      this.logDiagnostic('error', 'voice', `Exceção ao conectar no canal de voz: ${err?.message}`, err?.stack);
      console.error('Error connecting to voice channel:', err);
      return { success: false, error: err?.message || 'Falha ao conectar no canal de voz.' };
    }
  }

  public async disconnectVoice(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      this.logDiagnostic('info', 'voice', 'Desconectando bot do canal de voz e liberando player...');
      this.cleanupCurrentAudio();
      if (this.audioPlayer) {
        try {
          this.audioPlayer.stop(true);
        } catch {
          // ignore
        }
        this.isPlayingVoice = false;
        this.currentResource = null;
        this.currentTrackName = null;
      }

      if (this.voiceConnection) {
        try {
          this.voiceConnection.destroy();
        } catch {
          // ignore
        }
        this.voiceConnection = null;
      }

      this.logDiagnostic('success', 'voice', '🔇 Bot desconectado da sala de voz com sucesso.');
      console.log('🔇 Bot desconectado da sala de voz com sucesso.');
      return { success: true, message: 'Bot desconectado do canal de voz.' };
    } catch (err: any) {
      this.logDiagnostic('error', 'voice', `Erro ao desconectar da sala de voz: ${err?.message}`, err?.stack);
      console.error('Error disconnecting from voice channel:', err);
      return { success: false, error: err?.message || 'Falha ao desconectar do canal de voz.' };
    }
  }

  private async getAudioReadableStream(urlOrPath: string): Promise<Readable> {
    if (urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')) {
      const client = urlOrPath.startsWith('https://') ? https : http;
      return new Promise((resolve, reject) => {
        client.get(urlOrPath, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            this.getAudioReadableStream(res.headers.location).then(resolve).catch(reject);
          } else if (res.statusCode === 200) {
            resolve(res);
          } else {
            reject(new Error(`HTTP Status ${res.statusCode} ao carregar áudio.`));
          }
        }).on('error', reject);
      });
    } else {
      return fs.createReadStream(urlOrPath);
    }
  }

  public async playVoiceAudio(urlOrPath: string, volume: number = 0.8, seekSeconds?: number): Promise<{ success: boolean; error?: string }> {
    const voiceRes = await this.ensureVoiceConnection();
    if (!voiceRes.success || !this.audioPlayer) {
      return { success: false, error: voiceRes.error || 'Não conectado ao canal de voz.' };
    }

    // Clean up any previously playing stream or transcode process before starting a new track
    this.cleanupCurrentAudio();

    try {
      let resolvedPath = urlOrPath;
      let trackLabel = urlOrPath;

      if (urlOrPath.includes('/api/media/file?path=')) {
        const rawParam = urlOrPath.split('path=')[1];
        resolvedPath = decodeURIComponent(rawParam.split('&')[0]);
        trackLabel = path.basename(resolvedPath);
      } else if (urlOrPath.includes('/media/music/')) {
        const fileName = urlOrPath.split('/media/music/')[1].split('?')[0];
        resolvedPath = path.join(process.cwd(), 'data', 'music', fileName);
        trackLabel = fileName;
      } else if (urlOrPath.includes('/media/ambience/')) {
        const fileName = urlOrPath.split('/media/ambience/')[1].split('?')[0];
        resolvedPath = path.join(process.cwd(), 'data', 'ambience', fileName);
        trackLabel = fileName;
      } else if (urlOrPath.includes('/media/sfx/')) {
        const fileName = urlOrPath.split('/media/sfx/')[1].split('?')[0];
        resolvedPath = path.join(process.cwd(), 'data', 'sfx', fileName);
        trackLabel = `SFX: ${fileName}`;
      } else if (urlOrPath.includes('/media/npcs/')) {
        const fileName = urlOrPath.split('/media/npcs/')[1].split('?')[0];
        resolvedPath = path.join(process.cwd(), 'data', 'npcs', fileName);
        trackLabel = `NPC: ${fileName}`;
      } else if (urlOrPath.includes('/media/uploads/')) {
        const fileName = urlOrPath.split('/media/uploads/')[1].split('?')[0];
        resolvedPath = path.join(process.cwd(), 'data', 'uploads', fileName);
        trackLabel = fileName;
      } else if (path.isAbsolute(urlOrPath)) {
        resolvedPath = urlOrPath;
        trackLabel = path.basename(urlOrPath);
      }

      this.currentTrackName = trackLabel;
      this.currentTrackUrl = urlOrPath;
      this.currentTrackVolume = volume;

      // Check if file exists on disk
      if (!fs.existsSync(resolvedPath) && !urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
        const notFoundErr = `Arquivo de áudio não encontrado no disco: ${resolvedPath}`;
        this.logDiagnostic('error', 'audio', notFoundErr);
        return { success: false, error: notFoundErr };
      }

      const offsetStr = seekSeconds && seekSeconds > 0 ? ` (a partir de ${Math.round(seekSeconds)}s)` : '';
      this.logDiagnostic('info', 'audio', `Carregando recurso de áudio "${trackLabel}"${offsetStr} (Volume: ${Math.round(volume * 100)}%)...`);

      let resource: any;
      const isOnlineUrl = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://');
      const isYoutube = isOnlineUrl && /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)/i.test(urlOrPath);
      const isSoundcloud = isOnlineUrl && /soundcloud\.com\//i.test(urlOrPath);
      const isSpotify = isOnlineUrl && /open\.spotify\.com\/(?:track|album|playlist)\//i.test(urlOrPath);

      if (isYoutube || isSoundcloud) {
        try {
          this.logDiagnostic('info', 'audio', `Iniciando streaming online de ${isYoutube ? 'YouTube' : 'SoundCloud'}: ${urlOrPath}`);
          const stream = await playdl.stream(urlOrPath, {
            quality: 2,
            seek: seekSeconds && seekSeconds > 0 ? Math.floor(seekSeconds) : undefined
          });
          this.currentAudioStream = stream.stream;
          resource = createAudioResource(stream.stream, {
            inputType: stream.type,
            inlineVolume: true
          });
        } catch (streamErr: any) {
          this.logDiagnostic('error', 'audio', `play-dl falhou ao extrair stream direto (${streamErr?.message})`);
          return { success: false, error: `Falha ao transmitir stream online (${streamErr?.message || 'Erro desconhecido'}).` };
        }
      } else if (isSpotify) {
        try {
          this.logDiagnostic('info', 'audio', `Resolvendo faixa do Spotify: ${urlOrPath}`);
          const spData: any = await playdl.spotify(urlOrPath);
          const searchQuery = `${spData.name} ${spData.artists?.[0]?.name || ''}`;
          this.logDiagnostic('info', 'audio', `Buscando stream equivalente no YouTube para "${searchQuery}"...`);
          const searchResults = await playdl.search(searchQuery, { limit: 1 });
          if (searchResults && searchResults.length > 0) {
            const stream = await playdl.stream(searchResults[0].url, {
              quality: 2,
              seek: seekSeconds && seekSeconds > 0 ? Math.floor(seekSeconds) : undefined
            });
            this.currentAudioStream = stream.stream;
            resource = createAudioResource(stream.stream, {
              inputType: stream.type,
              inlineVolume: true
            });
            trackLabel = `${spData.name} - ${spData.artists?.[0]?.name || ''}`;
          } else {
            throw new Error('Nenhum stream encontrado para a faixa do Spotify.');
          }
        } catch (spErr: any) {
          this.logDiagnostic('error', 'audio', `Erro ao reproduzir faixa do Spotify: ${spErr?.message}`);
          return { success: false, error: `Falha ao reproduzir faixa do Spotify: ${spErr?.message}` };
        }
      } else if (seekSeconds && seekSeconds > 0) {
        try {
          const sourceStream = await this.getAudioReadableStream(resolvedPath);
          this.currentAudioStream = sourceStream;
          const ffmpeg = new prism.FFmpeg({
            args: [
              '-ss', String(Math.floor(seekSeconds)),
              '-i', '-',
              '-analyzeduration', '0',
              '-loglevel', '0',
              '-f', 's16le',
              '-ar', '48000',
              '-ac', '2'
            ]
          });
          this.activeTranscodeProcess = ffmpeg.process;
          ffmpeg.on('close', () => {
            if (this.activeTranscodeProcess === ffmpeg.process) {
              this.activeTranscodeProcess = null;
            }
          });
          const pipeStream = sourceStream.pipe(ffmpeg);
          resource = createAudioResource(pipeStream, {
            inputType: StreamType.Raw,
            inlineVolume: true
          });
        } catch (seekErr: any) {
          console.warn('Prism FFmpeg seek error, falling back to direct stream:', seekErr);
          const sourceStream = await this.getAudioReadableStream(resolvedPath);
          this.currentAudioStream = sourceStream;
          resource = createAudioResource(sourceStream, { inlineVolume: true });
        }
      } else {
        const sourceStream = await this.getAudioReadableStream(resolvedPath);
        this.currentAudioStream = sourceStream;
        resource = createAudioResource(sourceStream, { inlineVolume: true });
      }

      if (resource.volume) {
        resource.volume.setVolume(Math.max(0, Math.min(1, volume)));
      }
      this.currentResource = resource;
      this.audioPlayer.play(resource);
      this.isPlayingVoice = true;
      return { success: true };
    } catch (err: any) {
      this.logDiagnostic('error', 'audio', `Falha ao iniciar streaming de áudio: ${err?.message}`, err?.stack);
      console.error('Error playing audio in voice channel:', err);
      return { success: false, error: err?.message || 'Erro ao reproduzir áudio no Discord.' };
    }
  }

  public async seekVoiceAudio(seconds: number, urlOrPath?: string, volume?: number): Promise<{ success: boolean; error?: string }> {
    const targetUrl = urlOrPath || this.currentTrackUrl;
    if (!targetUrl) {
      return { success: false, error: 'Nenhuma faixa selecionada para avançar/retroceder.' };
    }
    const targetVol = typeof volume === 'number' ? volume : this.currentTrackVolume;
    return this.playVoiceAudio(targetUrl, targetVol, seconds);
  }

  public async pauseVoiceAudio(): Promise<{ success: boolean }> {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.isPlayingVoice = false;
    }
    return { success: true };
  }

  public async resumeVoiceAudio(): Promise<{ success: boolean; error?: string }> {
    if (this.audioPlayer) {
      if (this.audioPlayer.state.status === AudioPlayerStatus.Paused) {
        this.audioPlayer.unpause();
        this.isPlayingVoice = true;
        return { success: true };
      }
      if (this.currentTrackUrl) {
        return this.playVoiceAudio(this.currentTrackUrl, this.currentTrackVolume);
      }
    }
    return { success: true };
  }

  public async stopVoiceAudio(): Promise<{ success: boolean }> {
    this.cleanupCurrentAudio();
    if (this.audioPlayer) {
      this.audioPlayer.stop(true);
      this.isPlayingVoice = false;
    }
    return { success: true };
  }

  public async setVoiceVolume(volume: number): Promise<{ success: boolean }> {
    if (this.currentResource?.volume) {
      this.currentResource.volume.setVolume(Math.max(0, Math.min(1, volume)));
    }
    return { success: true };
  }

  // ==========================================
  // NPC POSTING (SPOILER-FREE IMAGE ONLY)
  // ==========================================

  public async postNpc(npc: NPC, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'O bot do Discord não está conectado. Conecte o bot para postar no chat.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;

    if (!targetChannelId) {
      return { success: false, error: 'Canal de texto não selecionado.' };
    }

    if (!npc.imageUrl) {
      return { success: false, error: 'Este NPC não possui imagem para enviar.' };
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) {
        return { success: false, error: 'Canal de texto inválido.' };
      }

      const textChannel = channel as TextChannel;

      // Safe anonymous filename to prevent players from inspecting the original filename or metadata
      const ANONYMOUS_IMAGE_NAME = 'retrato_revelado.png';

      // Check if local file
      if (npc.imageUrl.startsWith('/media/')) {
        let localPath = '';
        if (npc.imageUrl.startsWith('/media/npcs/')) {
          localPath = path.join(process.cwd(), 'data', 'npcs', npc.imageUrl.replace('/media/npcs/', ''));
        } else if (npc.imageUrl.startsWith('/media/uploads/')) {
          localPath = path.join(process.cwd(), 'data', 'uploads', npc.imageUrl.replace('/media/uploads/', ''));
        }

        if (fs.existsSync(localPath)) {
          const attachment = new AttachmentBuilder(localPath, { name: ANONYMOUS_IMAGE_NAME, description: 'Retrato do Mestre' });
          // Post ONLY the image attachment - NO text, NO name, NO embed title, NO stat block
          await textChannel.send({ files: [attachment] });
          return { success: true };
        }
      }

      // If it's a web URL (http/https)
      if (npc.imageUrl.startsWith('http://') || npc.imageUrl.startsWith('https://')) {
        // Send embed with ONLY the image, absolutely no text/titles/fields
        const embed = new EmbedBuilder()
          .setColor('#1e2229')
          .setImage(npc.imageUrl);

        await textChannel.send({ embeds: [embed] });
        return { success: true };
      }

      return { success: false, error: 'Formato ou caminho de imagem inválido.' };
    } catch (err: any) {
      console.error('Error posting anonymous NPC image to Discord:', err);
      return { success: false, error: err?.message || 'Falha ao enviar imagem do NPC ao Discord.' };
    }
  }

  // ==========================================
  // INITIATIVE TURN ANNOUNCEMENT
  // ==========================================

  public async announceTurn(
    combatantName: string,
    initiative: number,
    isNpc: boolean = false,
    round?: number,
    customChannelId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot offline. Não foi possível avisar o turno no Discord.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) return { success: false, error: 'Nenhum canal de texto configurado.' };

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) return { success: false, error: 'Canal inválido.' };

      const color: ColorResolvable = isNpc ? '#ef4444' : '#10b981';
      const icon = isNpc ? '👹' : '🛡️';
      const roundLabel = round ? ` • Rodada ${round}` : '';

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`⚔️ Turno de Combate${roundLabel}`)
        .setDescription(`🎯 **É a vez de ${icon} \`${combatantName}\` agir!**\n\n📊 **Iniciativa:** \`${initiative}\``)
        .setFooter({ text: 'Rastreador de Iniciativa • Escudo do Mestre' })
        .setTimestamp();

      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      console.error('Error announcing turn to Discord:', err);
      return { success: false, error: err?.message || 'Falha ao avisar turno no Discord.' };
    }
  }

  public async broadcastDiceRoll(roll: DiceRollResult, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'Bot offline. A rolagem foi computada localmente.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) return { success: false, error: 'Nenhum canal de texto ativo.' };

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) return { success: false, error: 'Canal inválido.' };

      let color: ColorResolvable = '#6366f1';
      let statusBadge = '';
      if (roll.isCriticalSuccess) {
        color = '#22c55e';
        statusBadge = '🌟 **SUCESSO CRÍTICO (NATURAL 20)!**';
      } else if (roll.isCriticalFail) {
        color = '#ef4444';
        statusBadge = '💀 **FALHA CRÍTICA (NATURAL 1)!**';
      }

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`🎲 Rolagem do Mestre: ${roll.notation} ${roll.label ? `(${roll.label})` : ''}`)
        .setDescription(`Resultados dos Dados: \`[${roll.rolls.join(', ')}]\`${roll.modifier !== 0 ? ` + Modificador: \`${roll.modifier}\`` : ''}\n\n# 🎯 Total: **${roll.total}**\n${statusBadge}`)
        .setTimestamp();

      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message };
    }
  }

  public async postEncounter(encounter: GeneratedEncounter, customChannelId?: string): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'O bot do Discord não está conectado. Conecte o bot para postar o encontro no chat.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) {
      return { success: false, error: 'Nenhum canal de texto selecionado nas configurações do Discord.' };
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) {
        return { success: false, error: 'Canal de texto inválido.' };
      }

      const difficultyColors: Record<string, ColorResolvable> = {
        facil: '#22c55e',
        medio: '#eab308',
        dificil: '#f97316',
        mortal: '#ef4444'
      };

      const color = difficultyColors[encounter.difficulty] || '#ea580c';

      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`⚔️ Encontro: ${encounter.title}`)
        .setDescription(
          `🌲 **Ambiente:** ${encounter.environmentName} | 🛡️ **Nível:** ${encounter.playerLevel} | ⚠️ **Dificuldade:** ${encounter.difficulty.toUpperCase()}\n\n` +
          `*${encounter.settingDescription}*`
        )
        .setTimestamp();

      if (encounter.enemies && encounter.enemies.length > 0) {
        const enemiesSummary = encounter.enemies.map(e => 
          `• **${e.count}x ${e.name}** (ND ${e.crOrLevel || '1'} | PV ${e.hp} | CA ${e.ac}) — *${e.tactics}*`
        ).join('\n');

        embed.addFields({
          name: '👾 Inimigos & Ameaças',
          value: enemiesSummary.slice(0, 1024),
          inline: false
        });
      }

      if (encounter.environmentalHazard) {
        embed.addFields({
          name: '🌪️ Perigo de Terreno / Obstáculo',
          value: encounter.environmentalHazard.slice(0, 1024),
          inline: false
        });
      }

      if (encounter.tacticalTwist) {
        embed.addFields({
          name: '⚡ Reviravolta Tática',
          value: encounter.tacticalTwist.slice(0, 1024),
          inline: false
        });
      }

      if (encounter.suggestedLoot) {
        embed.addFields({
          name: '💎 Recompensa / Espólio Sugerido',
          value: encounter.suggestedLoot.slice(0, 1024),
          inline: false
        });
      }

      embed.setFooter({ text: 'CaranguejoRPG • Gerador de Encontros Aleatórios' });

      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      console.error('Error posting encounter to Discord:', err);
      return { success: false, error: err?.message || 'Falha ao enviar encontro ao Discord.' };
    }
  }

  public async postRouletteResult(
    result: { sliceLabel: string; percentage: number; color?: string; description?: string; presetName?: string; rollerName?: string },
    customChannelId?: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client?.isReady()) {
      return { success: false, error: 'O bot do Discord não está conectado. Conecte o bot para postar na roleta.' };
    }

    const config = db.getBotConfig();
    const targetChannelId = customChannelId || config.textChannelId;
    if (!targetChannelId) {
      return { success: false, error: 'Nenhum canal de texto configurado.' };
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || !channel.isTextBased()) {
        return { success: false, error: 'Canal de texto inválido.' };
      }

      const embed = new EmbedBuilder()
        .setColor((result.color as ColorResolvable) || '#ec4899')
        .setTitle(`🎯 Roleta do Destino: ${result.sliceLabel}`)
        .setDescription(
          `**Resultado Sorteado:** 🎲 **${result.sliceLabel}**\n` +
          `**Probabilidade:** \`${result.percentage}%\`\n` +
          (result.description ? `\n*${result.description}*` : '')
        )
        .setTimestamp();

      if (result.presetName) {
        embed.addFields({
          name: '📜 Tabela / Roleta',
          value: result.presetName,
          inline: true
        });
      }

      embed.addFields({
        name: '👤 Girado por',
        value: result.rollerName || 'Mestre da Mesa',
        inline: true
      });

      embed.setFooter({ text: 'CaranguejoRPG • Roleta Customizável da Mesa' });

      await (channel as TextChannel).send({ embeds: [embed] });
      return { success: true };
    } catch (err: any) {
      console.error('Error posting roulette result to Discord:', err);
      return { success: false, error: err?.message || 'Falha ao postar resultado da roleta no Discord.' };
    }
  }
}

export const discordBot = new DiscordBotService();

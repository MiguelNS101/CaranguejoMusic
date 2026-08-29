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
  AudioPlayerStatus,
  VoiceConnection,
  AudioPlayer,
  VoiceConnectionStatus
} from '@discordjs/voice';
import path from 'path';
import fs from 'fs';
import { createRequire } from 'module';
import ffmpegStatic from 'ffmpeg-static';
import { db } from './db.js';
import { BotStatus, DiscordGuild, DiscordMessagePayload, NPC, DiceRollResult, WodDiceRollResult, DiagnosticLog, VoiceDiagnostics } from '../src/types.js';
import { rollWodDice, parseWodCommand } from './wodDice.js';

const nodeRequire = createRequire(import.meta.url);

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
  private isPlayingVoice: boolean = false;

  // Diagnostic Logs Circular Buffer
  private diagnosticLogs: DiagnosticLog[] = [];
  private maxLogs: number = 120;

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

    // Safe dynamic check for Opus decoders using ESM-compatible createRequire
    try {
      // @ts-ignore
      const dOpus = nodeRequire('@discordjs/opus');
      if (dOpus) {
        opusDiscord.available = true;
        try {
          const pkg = nodeRequire('@discordjs/opus/package.json');
          if (pkg?.version) opusDiscord.version = pkg.version;
        } catch {}
      }
    } catch (e: any) {
      opusDiscord.error = e?.message || 'Módulo nativo @discordjs/opus não carregado (esperado caso use opusscript).';
    }

    try {
      // @ts-ignore
      const nOpus = nodeRequire('node-opus');
      if (nOpus) {
        nodeOpus.available = true;
        try {
          const pkg = nodeRequire('node-opus/package.json');
          if (pkg?.version) nodeOpus.version = pkg.version;
        } catch {}
      }
    } catch (e: any) {
      nodeOpus.error = e?.message || 'Módulo nativo node-opus não carregado.';
    }

    try {
      // @ts-ignore
      const OpusScript = nodeRequire('opusscript');
      if (OpusScript) {
        opusscript.available = true;
        try {
          const pkg = nodeRequire('opusscript/package.json');
          if (pkg?.version) opusscript.version = pkg.version;
        } catch {}
      }
    } catch (e: any) {
      opusscript.error = e?.message || 'opusscript não encontrado';
    }

    try {
      // @ts-ignore
      nodeRequire('tweetnacl');
      tweetnacl.available = true;
      tweetnacl.active = true;
    } catch {}

    try {
      // @ts-ignore
      nodeRequire('libsodium-wrappers');
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
    if (this.isConnecting) return { success: false, error: 'Bot is already connecting...' };
    if (!token || token.trim() === '') {
      this.logDiagnostic('error', 'bot', 'Tentativa de login com token vazio.');
      return { success: false, error: 'Token is empty.' };
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

      this.client = new Client({
        intents: [
          GatewayIntentBits.Guilds,
          GatewayIntentBits.GuildMessages,
          GatewayIntentBits.MessageContent,
          GatewayIntentBits.GuildVoiceStates,
        ]
      });

      this.setupEventHandlers();

      await this.client.login(token.trim());
      this.isConnecting = false;
      this.logDiagnostic('success', 'bot', `Autenticação bem-sucedida! Bot conectado como @${this.client?.user?.tag}.`);
      return { success: true };
    } catch (err: any) {
      this.isConnecting = false;
      this.lastError = err?.message || 'Failed to login with provided Discord token.';
      this.logDiagnostic('error', 'bot', `Falha ao autenticar bot no Discord: ${this.lastError}`, err?.stack);
      console.error('Discord bot login error:', this.lastError);
      return { success: false, error: this.lastError };
    }
  }

  public async stop(): Promise<void> {
    this.logDiagnostic('info', 'bot', 'Desligando bot do Discord e limpando conexões ativas...');
    if (this.voiceConnection) {
      try {
        this.voiceConnection.destroy();
      } catch {
        // ignore
      }
      this.voiceConnection = null;
    }
    if (this.audioPlayer) {
      try {
        this.audioPlayer.stop();
      } catch {
        // ignore
      }
      this.audioPlayer = null;
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
    this.logDiagnostic('info', 'bot', 'Bot do Discord desligado com sucesso.');
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('ready', () => {
      this.logDiagnostic('success', 'bot', `🤖 Discord Bot online e pronto: ${this.client?.user?.tag} (${this.client?.guilds.cache.size} servidores)`);
      console.log(`🤖 Discord Bot logged in as ${this.client?.user?.tag}!`);
      this.client?.user?.setPresence({
        activities: [{ name: 'RPG Mundo das Trevas 🎲 \\r \\kr', type: ActivityType.Playing }],
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

      // Other prefix commands
      const prefix = db.getBotConfig().prefix || '!';
      if (content.startsWith(prefix + 'ping')) {
        await message.reply('🎲 **Escudo do Mestre Online!** Sistema de áudio, soundboard e dados WoD prontos.');
      } else if (content.startsWith(prefix + 'ajuda') || content.startsWith(prefix + 'help')) {
        const helpEmbed = new EmbedBuilder()
          .setColor('#6366f1')
          .setTitle('📖 Comandos do Escudo do Mestre')
          .setDescription(
            '**🎲 Rolagem Mundo das Trevas (D10):**\n' +
            '`\\r 8d10` ou `\\r 8` - Rola 8 dados D10 (Sucesso 7+, Crítico no 10 que explode, 1s cancelam sucessos priorizando críticos)\n' +
            '`\\kr 6d10` ou `\\kr 6` - Keen Roll (Acerto Crítico no 9 e 10 explodindo)\n' +
            '`\\r 7d10 Esquiva` - Rola com motivo/ação anotada\n\n' +
            '**🎵 Sons & NPCs:**\n' +
            'Controlados diretamente pela interface web do mestre!'
          );
        await message.reply({ embeds: [helpEmbed] });
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
      const channels: Array<{ id: string; name: string; type: 'text' | 'voice'; guildId: string }> = [];
      guild.channels.cache.forEach((ch) => {
        if (ch.type === ChannelType.GuildText) {
          channels.push({ id: ch.id, name: ch.name, type: 'text', guildId: guild.id });
        } else if (ch.type === ChannelType.GuildVoice) {
          channels.push({ id: ch.id, name: ch.name, type: 'voice', guildId: guild.id });
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

      // Handle styled types
      if (payload.type === 'narrative') {
        const narrativeEmbed = new EmbedBuilder()
          .setColor('#c2410c') // Amber/orange narrative tone
          .setAuthor({ name: '📜 Narração do Mestre' })
          .setDescription(`*${payload.content}*`)
          .setTimestamp();
        
        const sent = await textChannel.send({ embeds: [narrativeEmbed] });
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
        if (payload.embed.imageUrl) embed.setImage(payload.embed.imageUrl);
        if (payload.embed.footerText) embed.setFooter({ text: payload.embed.footerText });
        if (payload.embed.fields && payload.embed.fields.length > 0) {
          embed.addFields(payload.embed.fields);
        }

        const sent = await textChannel.send({
          content: payload.content || undefined,
          embeds: [embed]
        });
        return { success: true, messageId: sent.id };
      }

      // Plain text message
      if (payload.content) {
        const sent = await textChannel.send({ content: payload.content });
        return { success: true, messageId: sent.id };
      }

      return { success: false, error: 'Mensagem vazia.' };
    } catch (err: any) {
      console.error('Error sending discord message:', err);
      return { success: false, error: err?.message || 'Falha ao enviar mensagem no Discord.' };
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

        // Monitor Voice Connection State
        this.voiceConnection.on('stateChange', (oldState, newState) => {
          this.logDiagnostic(
            newState.status === VoiceConnectionStatus.Ready ? 'success' : 'info',
            'voice',
            `Estado da conexão de voz alterado: ${oldState.status} -> ${newState.status}`
          );
        });

        this.voiceConnection.on('error', (error) => {
          this.logDiagnostic('error', 'voice', `Erro na conexão de voz: ${error.message}`, error.stack);
          console.error('Discord voice connection error:', error);
        });

        if (!this.audioPlayer) {
          this.audioPlayer = createAudioPlayer();
          
          this.audioPlayer.on(AudioPlayerStatus.Idle, (oldState) => {
            this.isPlayingVoice = false;
            this.logDiagnostic('info', 'audio', 'Audio Player ocioso (reprodução terminada ou em espera).');
          });

          this.audioPlayer.on(AudioPlayerStatus.Playing, () => {
            this.isPlayingVoice = true;
            this.logDiagnostic('success', 'audio', `Reproduzindo áudio no Discord: ${this.currentTrackName || 'Faixa de áudio'}`);
          });

          this.audioPlayer.on(AudioPlayerStatus.Buffering, () => {
            this.logDiagnostic('info', 'audio', 'Buffering de áudio em andamento...');
          });

          this.audioPlayer.on(AudioPlayerStatus.Paused, () => {
            this.isPlayingVoice = false;
            this.logDiagnostic('info', 'audio', 'Reprodução de áudio pausada.');
          });

          this.audioPlayer.on('error', (error) => {
            this.logDiagnostic('error', 'audio', `Erro no player de áudio Discord: ${error.message}`, error.stack);
            console.error('Discord voice audio player error:', error);
            this.isPlayingVoice = false;
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

  public async playVoiceAudio(urlOrPath: string, volume: number = 0.8): Promise<{ success: boolean; error?: string }> {
    const voiceRes = await this.ensureVoiceConnection();
    if (!voiceRes.success || !this.audioPlayer) {
      return { success: false, error: voiceRes.error || 'Não conectado ao canal de voz.' };
    }

    try {
      let resolvedPath = urlOrPath;
      let trackLabel = urlOrPath;
      if (urlOrPath.startsWith('/media/music/')) {
        const fileName = urlOrPath.replace('/media/music/', '');
        resolvedPath = path.join(process.cwd(), 'data', 'music', fileName);
        trackLabel = fileName;
      } else if (urlOrPath.startsWith('/media/sfx/')) {
        const fileName = urlOrPath.replace('/media/sfx/', '');
        resolvedPath = path.join(process.cwd(), 'data', 'sfx', fileName);
        trackLabel = `SFX: ${fileName}`;
      } else if (urlOrPath.startsWith('/media/uploads/')) {
        const fileName = urlOrPath.replace('/media/uploads/', '');
        resolvedPath = path.join(process.cwd(), 'data', 'uploads', fileName);
        trackLabel = fileName;
      }

      this.currentTrackName = trackLabel;

      // Check if file exists on disk
      if (!fs.existsSync(resolvedPath) && !urlOrPath.startsWith('http://') && !urlOrPath.startsWith('https://')) {
        const notFoundErr = `Arquivo de áudio não encontrado no disco: ${resolvedPath}`;
        this.logDiagnostic('error', 'audio', notFoundErr);
        return { success: false, error: notFoundErr };
      }

      this.logDiagnostic('info', 'audio', `Carregando recurso de áudio "${trackLabel}" (Volume: ${Math.round(volume * 100)}%)...`);
      const resource = createAudioResource(resolvedPath, { inlineVolume: true });
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

  public async pauseVoiceAudio(): Promise<{ success: boolean }> {
    if (this.audioPlayer) {
      this.audioPlayer.pause();
      this.isPlayingVoice = false;
    }
    return { success: true };
  }

  public async resumeVoiceAudio(): Promise<{ success: boolean }> {
    if (this.audioPlayer) {
      this.audioPlayer.unpause();
      this.isPlayingVoice = true;
    }
    return { success: true };
  }

  public async stopVoiceAudio(): Promise<{ success: boolean }> {
    if (this.audioPlayer) {
      this.audioPlayer.stop();
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
}

export const discordBot = new DiscordBotService();

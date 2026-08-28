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
import { db } from './db.js';
import { BotStatus, DiscordGuild, DiscordMessagePayload, NPC, DiceRollResult, WodDiceRollResult } from '../src/types.js';
import { rollWodDice, parseWodCommand } from './wodDice.js';

export class DiscordBotService {
  private client: Client | null = null;
  private isConnecting: boolean = false;
  private lastError: string | null = null;
  private recentWodRolls: WodDiceRollResult[] = [];
  
  // Voice connection & player state
  private voiceConnection: VoiceConnection | null = null;
  private audioPlayer: AudioPlayer | null = null;
  private currentResource: any = null;
  private isPlayingVoice: boolean = false;

  constructor() {
    // Initial auto-connect if token in env or db
    const config = db.getBotConfig();
    if (config.token) {
      this.start(config.token);
    }
  }

  public async start(token: string): Promise<{ success: boolean; error?: string }> {
    if (this.isConnecting) return { success: false, error: 'Bot is already connecting...' };
    if (!token || token.trim() === '') {
      return { success: false, error: 'Token is empty.' };
    }

    try {
      this.isConnecting = true;
      this.lastError = null;

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
      return { success: true };
    } catch (err: any) {
      this.isConnecting = false;
      this.lastError = err?.message || 'Failed to login with provided Discord token.';
      console.error('Discord bot login error:', this.lastError);
      return { success: false, error: this.lastError };
    }
  }

  public async stop(): Promise<void> {
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
  }

  private setupEventHandlers() {
    if (!this.client) return;

    this.client.on('ready', () => {
      console.log(`🤖 Discord Bot logged in as ${this.client?.user?.tag}!`);
      this.client?.user?.setPresence({
        activities: [{ name: 'RPG Mundo das Trevas 🎲 \\r \\kr', type: ActivityType.Playing }],
        status: 'online'
      });

      // Auto-select first available guild/channels if none set
      this.autoPopulateInitialChannels();
    });

    this.client.on('guildCreate', (guild) => {
      console.log(`🏰 Entrou em um novo servidor: ${guild.name} (${guild.id})`);
      this.autoPopulateInitialChannels();
    });

    this.client.on('error', (err) => {
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
      username: this.client?.user?.username,
      avatar: this.client?.user?.displayAvatarURL(),
      guildsCount: this.client?.guilds.cache.size || 0,
      currentGuild: currentGuildInfo,
      connectedVoiceChannel: connectedVoiceChannelInfo,
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
      return { success: false, error: 'Bot do Discord não está conectado.' };
    }
    const config = db.getBotConfig();
    const targetChannelId = voiceChannelId || config.voiceChannelId;
    if (!targetChannelId) {
      return { success: false, error: 'Nenhum canal de voz configurado.' };
    }

    try {
      const channel = await this.client.channels.fetch(targetChannelId);
      if (!channel || channel.type !== ChannelType.GuildVoice) {
        return { success: false, error: 'Canal de voz inválido ou não encontrado.' };
      }

      const voiceChannel = channel as VoiceChannel;
      const guild = voiceChannel.guild;

      if (!this.voiceConnection || this.voiceConnection.state.status === VoiceConnectionStatus.Destroyed) {
        this.voiceConnection = joinVoiceChannel({
          channelId: voiceChannel.id,
          guildId: guild.id,
          adapterCreator: guild.voiceAdapterCreator as any
        });

        if (!this.audioPlayer) {
          this.audioPlayer = createAudioPlayer();
          this.audioPlayer.on(AudioPlayerStatus.Idle, () => {
            this.isPlayingVoice = false;
          });
          this.audioPlayer.on('error', (error) => {
            console.error('Discord voice audio player error:', error);
            this.isPlayingVoice = false;
          });
        }

        this.voiceConnection.subscribe(this.audioPlayer);
      }
      return { success: true, connection: this.voiceConnection };
    } catch (err: any) {
      console.error('Error connecting to voice channel:', err);
      return { success: false, error: err?.message || 'Falha ao conectar no canal de voz.' };
    }
  }

  public async playVoiceAudio(urlOrPath: string, volume: number = 0.8): Promise<{ success: boolean; error?: string }> {
    const voiceRes = await this.ensureVoiceConnection();
    if (!voiceRes.success || !this.audioPlayer) {
      return { success: false, error: voiceRes.error || 'Não conectado ao canal de voz.' };
    }

    try {
      let resolvedPath = urlOrPath;
      if (urlOrPath.startsWith('/media/music/')) {
        const fileName = urlOrPath.replace('/media/music/', '');
        resolvedPath = path.join(process.cwd(), 'data', 'music', fileName);
      } else if (urlOrPath.startsWith('/media/sfx/')) {
        const fileName = urlOrPath.replace('/media/sfx/', '');
        resolvedPath = path.join(process.cwd(), 'data', 'sfx', fileName);
      } else if (urlOrPath.startsWith('/media/uploads/')) {
        const fileName = urlOrPath.replace('/media/uploads/', '');
        resolvedPath = path.join(process.cwd(), 'data', 'uploads', fileName);
      }

      const resource = createAudioResource(resolvedPath, { inlineVolume: true });
      if (resource.volume) {
        resource.volume.setVolume(Math.max(0, Math.min(1, volume)));
      }
      this.currentResource = resource;
      this.audioPlayer.play(resource);
      this.isPlayingVoice = true;
      return { success: true };
    } catch (err: any) {
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

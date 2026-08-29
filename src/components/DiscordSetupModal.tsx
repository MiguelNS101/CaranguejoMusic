import React, { useState, useEffect } from 'react';
import {
  Bot,
  Key,
  Server,
  Volume2,
  VolumeX,
  MessageSquare,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Eye,
  EyeOff,
  Container,
  HelpCircle,
  Copy,
  Check,
  Radio,
  PhoneOff,
  LogIn,
  Terminal,
  Activity,
  RotateCcw
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { DiscordGuild, DiscordChannel } from '../types';
import { safeFetchJson } from '../services/api';
import { ensureDesktopBackend, addDesktopLog, forceRestartBackend, isDesktopEnvironment } from '../services/desktopBackend';
import { DiscordDiagnosticsPanel } from './DiscordDiagnosticsPanel';

interface DiscordSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiscordSetupModal: React.FC<DiscordSetupModalProps> = ({ isOpen, onClose }) => {
  const { botConfig, botStatus, refreshBotStatus, disconnectVoiceChannel, connectVoiceChannel } = useAudio();

  const [token, setToken] = useState(botConfig.token || '');
  const [showToken, setShowToken] = useState(false);
  const [clientId, setClientId] = useState(botConfig.clientId || '');
  const [guildId, setGuildId] = useState(botConfig.guildId || '');
  const [voiceChannelId, setVoiceChannelId] = useState(botConfig.voiceChannelId || '');
  const [textChannelId, setTextChannelId] = useState(botConfig.textChannelId || '');
  const [prefix, setPrefix] = useState(botConfig.prefix || '!');

  const [guilds, setGuilds] = useState<DiscordGuild[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgressMsg, setSaveProgressMsg] = useState('');
  const [isVoiceConnecting, setIsVoiceConnecting] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });
  const [activeSubTab, setActiveSubTab] = useState<'bot' | 'diagnostics' | 'guide' | 'docker' | 'portable'>('bot');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedEnv, setCopiedEnv] = useState(false);
  const [envRawText, setEnvRawText] = useState('');
  const [isEnvSaving, setIsEnvSaving] = useState(false);
  const [envStatus, setEnvStatus] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Fetch .env values
  useEffect(() => {
    if (activeSubTab === 'portable' && isOpen) {
      safeFetchJson<any>('/api/config/env')
        .then(res => {
          if (res.data?.rawContent) {
            setEnvRawText(res.data.rawContent);
          } else {
            setEnvRawText(`# ==========================================
# RPG Bot & Escudo do Mestre - Configurações
# ==========================================

DISCORD_BOT_TOKEN=${token}
DISCORD_CLIENT_ID=${clientId}
DISCORD_GUILD_ID=${guildId}
DISCORD_VOICE_CHANNEL_ID=${voiceChannelId}
DISCORD_TEXT_CHANNEL_ID=${textChannelId}
DISCORD_PREFIX=${prefix}

PORT=3000
DATA_DIR=./data
NODE_ENV=production
`);
          }
        })
        .catch(console.error);
    }
  }, [activeSubTab, isOpen, token, clientId, guildId, voiceChannelId, textChannelId, prefix]);

  const handleSaveEnvText = async () => {
    setIsEnvSaving(true);
    setEnvStatus({ status: 'idle' });
    try {
      const res = await safeFetchJson<any>('/api/config/env', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          DISCORD_BOT_TOKEN: token,
          DISCORD_CLIENT_ID: clientId,
          DISCORD_GUILD_ID: guildId,
          DISCORD_VOICE_CHANNEL_ID: voiceChannelId,
          DISCORD_TEXT_CHANNEL_ID: textChannelId,
          DISCORD_PREFIX: prefix,
          PORT: '3000',
          DATA_DIR: './data'
        })
      });
      if (res.success) {
        setEnvStatus({ status: 'success', msg: 'Arquivo .env salvo no disco com sucesso!' });
        await refreshBotStatus();
      } else {
        setEnvStatus({ status: 'error', msg: res.error || 'Erro ao salvar' });
      }
    } catch (e: any) {
      setEnvStatus({ status: 'error', msg: e?.message || 'Erro ao salvar' });
    } finally {
      setIsEnvSaving(false);
    }
  };

  const handleCopyEnv = () => {
    navigator.clipboard.writeText(envRawText);
    setCopiedEnv(true);
    setTimeout(() => setCopiedEnv(false), 2000);
  };

  const handleDownloadEnv = () => {
    const blob = new Blob([envRawText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    setToken(botConfig.token || '');
    setClientId(botConfig.clientId || '');
    setGuildId(botConfig.guildId || '');
    setVoiceChannelId(botConfig.voiceChannelId || '');
    setTextChannelId(botConfig.textChannelId || '');
    setPrefix(botConfig.prefix || '!');
  }, [botConfig]);

  // Load guilds when bot is online
  useEffect(() => {
    const fetchGuilds = async () => {
      try {
        const res = await safeFetchJson<DiscordGuild[]>('/api/bot/guilds');
        if (res.success && res.data) {
          const list = res.data;
          setGuilds(list);
          if (list.length > 0 && !guildId) {
            setGuildId(list[0].id);
          }
        }
      } catch (err) {
        console.error('Failed to load guilds:', err);
      }
    };

    if (botStatus.isOnline && isOpen) {
      fetchGuilds();
    }
  }, [botStatus.isOnline, isOpen]);

  if (!isOpen) return null;

  const currentGuild = guilds.find(g => g.id === guildId);
  const textChannels = currentGuild?.channels.filter(c => c.type === 'text') || [];
  const voiceChannels = currentGuild?.channels.filter(c => c.type === 'voice') || [];

  const handleSaveAndConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFeedback({ status: 'idle' });
    setSaveProgressMsg('1/3 Verificando motor local na porta 3000...');

    try {
      addDesktopLog('info', 'Iniciando processo de conexão do Bot do Discord...');
      // Ensure desktop local backend is ready before saving
      await ensureDesktopBackend();

      setSaveProgressMsg('2/3 Enviando configurações para o servidor local...');
      const res = await safeFetchJson<any>('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.trim(),
          clientId: clientId.trim(),
          guildId,
          voiceChannelId,
          textChannelId,
          prefix
        })
      }, 15000);

      setSaveProgressMsg('3/3 Processando resposta da autenticação...');
      await refreshBotStatus();

      if (res.success) {
        const data = res.data;
        if (data?.connectionResult?.success || data?.botStatus?.isOnline) {
          setFeedback({ status: 'success', msg: 'Bot conectado ao Discord com sucesso!' });
          addDesktopLog('success', 'Bot conectado com sucesso ao Discord!');
        } else if (data?.connectionResult?.error) {
          setFeedback({ status: 'error', msg: data.connectionResult.error });
          addDesktopLog('error', `Falha de autenticação do bot: ${data.connectionResult.error}`);
        } else {
          setFeedback({ status: 'success', msg: 'Configurações salvas no servidor local!' });
          addDesktopLog('success', 'Configurações salvas no banco de dados local.');
        }
      } else {
        const errorMsg = res.error || 'Erro ao comunicar com o bot.';
        setFeedback({ status: 'error', msg: errorMsg });
        addDesktopLog('error', `Erro na resposta do servidor: ${errorMsg}`);
      }
    } catch (err: any) {
      const errorMsg = err?.message || 'Erro ao salvar configurações do bot';
      setFeedback({ status: 'error', msg: errorMsg });
      addDesktopLog('error', `Erro de exceção: ${errorMsg}`);
    } finally {
      setIsSaving(false);
      setSaveProgressMsg('');
    }
  };

  const handleDisconnectBot = async () => {
    try {
      await safeFetchJson('/api/bot/stop', { method: 'POST' });
      await refreshBotStatus();
      setFeedback({ status: 'idle', msg: 'Bot desconectado.' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnectVoiceOnly = async () => {
    try {
      setIsVoiceConnecting(true);
      const res = await disconnectVoiceChannel();
      if (res.success) {
        setFeedback({ status: 'success', msg: 'Bot desconectado do canal de voz.' });
      } else {
        setFeedback({ status: 'error', msg: res.error || 'Falha ao desconectar da voz.' });
      }
    } catch (err: any) {
      setFeedback({ status: 'error', msg: err?.message || 'Erro ao desconectar da voz.' });
    } finally {
      setIsVoiceConnecting(false);
    }
  };

  const handleJoinVoiceChannel = async () => {
    if (!voiceChannelId) {
      setFeedback({ status: 'error', msg: 'Selecione um canal de voz primeiro.' });
      return;
    }
    try {
      setIsVoiceConnecting(true);
      const res = await connectVoiceChannel(voiceChannelId);
      if (res.success) {
        setFeedback({ status: 'success', msg: 'Bot conectado ao canal de voz com sucesso!' });
      } else {
        setFeedback({ status: 'error', msg: res.error || 'Falha ao entrar no canal de voz.' });
      }
    } catch (err: any) {
      setFeedback({ status: 'error', msg: err?.message || 'Erro ao conectar no canal de voz.' });
    } finally {
      setIsVoiceConnecting(false);
    }
  };

  const inviteLink = clientId
    ? `https://discord.com/oauth2/authorize?client_id=${clientId.trim()}&permissions=3214336&scope=bot%20applications.commands`
    : 'https://discord.com/developers/applications';

  const copyInvite = () => {
    navigator.clipboard.writeText(inviteLink);
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center p-1">
              <img src="/icon.png" alt="CaranguejoRPG" className="w-full h-full object-contain" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#FFFFFF] font-rpg">
                Integração Discord Bot & Docker
              </h3>
              <p className="text-xs text-[#9E9E9E]">
                Conecte o bot ao seu servidor de RPG e configure canais de voz/chat.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9E9E9E] hover:text-[#FFFFFF]"
          >
            ✕
          </button>
        </div>

        {/* Sub Navigation */}
        <div className="flex items-center gap-1.5 bg-[#141619] p-1 rounded-2xl border border-[#2D3139] overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('bot')}
            className={`flex-1 min-w-[100px] py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'bot' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            Conexão do Bot
          </button>
          <button
            onClick={() => setActiveSubTab('diagnostics')}
            className={`flex-1 min-w-[130px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'diagnostics' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>Diagnóstico & Logs</span>
          </button>
          <button
            onClick={() => setActiveSubTab('portable')}
            className={`flex-1 min-w-[120px] py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeSubTab === 'portable' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            <span>⚡ Portable .exe</span>
          </button>
          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex-1 min-w-[110px] py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'guide' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            Guia Discord
          </button>
          <button
            onClick={() => setActiveSubTab('docker')}
            className={`flex-1 min-w-[80px] py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'docker' ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            Docker
          </button>
        </div>

        {/* TAB 1: Bot Connection */}
        {activeSubTab === 'bot' && (
          <form onSubmit={handleSaveAndConnect} className="space-y-4">
            
            {/* Status Card */}
            <div className={`p-4 rounded-2xl border flex items-center justify-between ${
              botStatus.isOnline
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                : 'bg-[#141619] border-[#2D3139] text-[#E0E0E0]'
            }`}>
              <div className="flex items-center gap-3">
                <span className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                  botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-[#6E7681]'
                }`} />
                <div>
                  <h4 className="text-xs font-bold flex items-center gap-2">
                    {botStatus.isOnline
                      ? `Bot Online: ${botStatus.username}`
                      : 'Bot Desconectado (Modo Local Navegador)'}
                    {botStatus.connectedVoiceChannel && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        🔊 Voz: {botStatus.connectedVoiceChannel.name}
                      </span>
                    )}
                  </h4>
                  <p className="text-[11px] text-[#9E9E9E]">
                    {botStatus.isOnline
                      ? `Conectado a ${botStatus.guildsCount} servidor(es)`
                      : 'O áudio tocará localmente pelo navegador até que você adicione o token.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveSubTab('diagnostics')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#2D3139] text-xs font-medium transition-colors cursor-pointer"
                  title="Abrir painel de diagnósticos de voz e decodificadores"
                >
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Diagnóstico</span>
                </button>

                {botStatus.connectedVoiceChannel && (
                  <button
                    type="button"
                    onClick={handleDisconnectVoiceOnly}
                    disabled={isVoiceConnecting}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 border border-amber-500/40 text-xs font-medium transition-colors"
                    title="Desconectar o bot da sala de voz atual"
                  >
                    <PhoneOff className="w-3.5 h-3.5" />
                    <span>Desconectar da Sala</span>
                  </button>
                )}

                {botStatus.isOnline && (
                  <button
                    type="button"
                    onClick={handleDisconnectBot}
                    className="px-3 py-1.5 rounded-lg bg-[#22262B] hover:bg-rose-950/60 hover:text-rose-300 hover:border-rose-800 text-[#E0E0E0] border border-[#2D3139] text-xs font-medium transition-colors"
                  >
                    Desligar Bot
                  </button>
                )}
              </div>
            </div>

            {/* Token Input */}
            <div>
              <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                Token do Bot do Discord *
              </label>
              <div className="relative">
                <input
                  type={showToken ? 'text' : 'password'}
                  placeholder="MTM0..."
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl pl-3 pr-10 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9E9E9E] hover:text-[#FFFFFF]"
                >
                  {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <span className="text-[10px] text-[#6E7681] block mt-1">
                Obtenha seu token no{' '}
                <a
                  href="https://discord.com/developers/applications"
                  target="_blank"
                  rel="noreferrer"
                  className="text-indigo-400 hover:underline"
                >
                  Discord Developer Portal
                </a>
              </span>
            </div>

            {/* Client ID & Invite Link */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Client ID (Application ID)
                </label>
                <input
                  type="text"
                  placeholder="123456789012345678"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Link de Convite do Bot
                </label>
                <div className="flex items-center gap-2">
                  <a
                    href={inviteLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] text-xs font-medium rounded-xl border border-[#2D3139] truncate"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Convidar para o Servidor
                  </a>
                  <button
                    type="button"
                    onClick={copyInvite}
                    className="p-2 bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] rounded-xl border border-[#2D3139]"
                    title="Copiar Link"
                  >
                    {copiedInvite ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Guild & Channels Selection (Auto-populated if online) */}
            {botStatus.isOnline && guilds.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-[#2D3139]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                  Canais do Servidor
                </h4>

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Servidor Discord (Guild)
                  </label>
                  <select
                    value={guildId}
                    onChange={(e) => setGuildId(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  >
                    {guilds.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-[#E0E0E0]">
                        Canal de Voz (Áudio / Músicas)
                      </label>
                      {voiceChannelId && (
                        <div className="flex items-center gap-1">
                          {botStatus.connectedVoiceChannel ? (
                            <button
                              type="button"
                              onClick={handleDisconnectVoiceOnly}
                              disabled={isVoiceConnecting}
                              className="text-[10px] px-2 py-0.5 rounded bg-amber-950/60 hover:bg-amber-900 text-amber-300 border border-amber-500/40 flex items-center gap-1"
                            >
                              <PhoneOff className="w-2.5 h-2.5" />
                              Desconectar
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleJoinVoiceChannel}
                              disabled={isVoiceConnecting}
                              className="text-[10px] px-2 py-0.5 rounded bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 flex items-center gap-1"
                            >
                              <LogIn className="w-2.5 h-2.5" />
                              Entrar na Sala
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    <select
                      value={voiceChannelId}
                      onChange={(e) => setVoiceChannelId(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    >
                      <option value="">Nenhum Canal Selecionado</option>
                      {voiceChannels.map(vc => (
                        <option key={vc.id} value={vc.id}>🔊 {vc.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                      Canal de Texto (Mensagens / NPCs)
                    </label>
                    <select
                      value={textChannelId}
                      onChange={(e) => setTextChannelId(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    >
                      <option value="">Nenhum Canal Selecionado</option>
                      {textChannels.length > 0 && (
                        <optgroup label="💬 Canais de Texto">
                          {textChannels.map(tc => (
                            <option key={tc.id} value={tc.id}># {tc.name}</option>
                          ))}
                        </optgroup>
                      )}
                      {voiceChannels.length > 0 && (
                        <optgroup label="🎙️💬 Chat de Texto dos Canais de Voz">
                          {voiceChannels.map(vc => (
                            <option key={vc.id} value={vc.id}>🎙️💬 [Chat de Voz] {vc.name}</option>
                          ))}
                        </optgroup>
                      )}
                    </select>
                    {voiceChannels.some(vc => vc.id === textChannelId) && (
                      <p className="text-[11px] text-indigo-300/90 mt-1 flex items-center gap-1">
                        <span>🎙️💬</span>
                        <span>Chat de voz selecionado: as mensagens e rolagens serão postadas no chat de texto embutido da sala de voz.</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Feedback & Actions */}
            <div className="pt-3 border-t border-[#2D3139] flex flex-col gap-3">
              {feedback.status !== 'idle' && (
                <div
                  className={`p-3 rounded-xl border flex flex-col gap-2 text-xs ${
                    feedback.status === 'success'
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    {feedback.status === 'success' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <p className="font-semibold leading-tight">
                        {feedback.status === 'success' ? 'Sucesso' : 'Atenção ao Conectar'}
                      </p>
                      <p className="text-[11px] leading-relaxed text-[#E0E0E0] break-words">
                        {feedback.msg}
                      </p>
                    </div>
                  </div>

                  {feedback.status === 'error' && (
                    <div className="flex items-center gap-2 pt-2 border-t border-rose-500/20 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setActiveSubTab('diagnostics')}
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 text-[11px] font-bold border border-indigo-500/30 flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <Activity className="w-3 h-3 text-emerald-400" />
                        <span>Abrir Diagnóstico & Logs</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          setIsSaving(true);
                          setSaveProgressMsg('Forçando reinício do motor...');
                          await forceRestartBackend();
                          setIsSaving(false);
                          setSaveProgressMsg('');
                          await refreshBotStatus();
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[#2D3139] hover:bg-[#3D424D] text-white text-[11px] font-medium flex items-center gap-1 cursor-pointer transition-colors"
                      >
                        <RotateCcw className="w-3 h-3 text-amber-400" />
                        <span>Forçar Início do Motor Local</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-[11px] text-[#9E9E9E]">
                  {botStatus.isOnline ? `🟢 Bot Conectado: @${botStatus.username}` : '⚪ Bot Offline (Modo Local)'}
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 rounded-xl text-xs text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    {isSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    <span>{isSaving ? (saveProgressMsg || 'Salvando & Conectando...') : 'Salvar & Conectar Bot'}</span>
                  </button>
                </div>
              </div>
            </div>

          </form>
        )}

        {/* TAB: Real-time Audio & Voice Diagnostics */}
        {activeSubTab === 'diagnostics' && (
          <DiscordDiagnosticsPanel
            currentVoiceChannelId={voiceChannelId || botConfig.voiceChannelId}
            onRefreshBot={refreshBotStatus}
          />
        )}

        {/* TAB 2: Step-by-step Guide */}
        {activeSubTab === 'guide' && (
          <div className="space-y-4 text-xs text-[#E0E0E0] leading-relaxed">
            <div className="p-3 bg-[#141619] rounded-xl border border-[#2D3139] space-y-2">
              <h4 className="font-bold text-indigo-400 text-sm">
                Como criar e configurar seu Bot do Discord em 3 passos:
              </h4>
              <ol className="list-decimal list-inside space-y-2 text-[#E0E0E0]">
                <li>
                  Acesse o{' '}
                  <a
                    href="https://discord.com/developers/applications"
                    target="_blank"
                    rel="noreferrer"
                    className="text-indigo-400 underline"
                  >
                    Discord Developer Portal
                  </a>{' '}
                  e clique em <strong>"New Application"</strong>.
                </li>
                <li>
                  Vá na aba <strong>"Bot"</strong> no menu lateral, clique em <strong>"Reset Token"</strong> ou <strong>"Copy"</strong> para copiar o Token do bot.
                </li>
                <li>
                  <strong>Importante (Privileged Gateway Intents):</strong> Na mesma aba "Bot", role até a seção <strong>"Privileged Gateway Intents"</strong> e ATIVE:
                  <ul className="list-disc list-inside ml-4 mt-1 text-[#9E9E9E] space-y-0.5">
                    <li><strong className="text-[#FFFFFF]">Message Content Intent</strong> (para responder mensagens no chat)</li>
                    <li><strong className="text-[#FFFFFF]">Server Members Intent</strong></li>
                  </ul>
                </li>
                <li>
                  Copie o <strong>Application ID</strong> na aba "General Information" e insira no campo Client ID deste painel para gerar seu link de convite.
                </li>
              </ol>
            </div>
          </div>
        )}

        {/* TAB 4: Portable .exe & .env Config */}
        {activeSubTab === 'portable' && (
          <div className="space-y-4 text-xs text-[#E0E0E0] leading-relaxed">
            {/* Quick Actions & Status */}
            <div className="p-4 bg-[#141619] rounded-2xl border border-indigo-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                    ⚡ Executável Portable (Neutralino.js) & Variáveis .env
                  </h4>
                  <p className="text-[#9E9E9E] text-[11px] mt-0.5">
                    Execute como um aplicativo leve (~5MB) no Windows/Linux/Mac sem precisar de instalação pesada.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyEnv}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#2D3139] text-xs font-semibold cursor-pointer transition-colors"
                  >
                    {copiedEnv ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEnv ? 'Copiado!' : 'Copiar .env'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadEnv}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm cursor-pointer transition-colors"
                  >
                    Baixar .env
                  </button>
                </div>
              </div>

              {envStatus.msg && (
                <div className={`p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
                  envStatus.status === 'success' ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
                }`}>
                  {envStatus.status === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{envStatus.msg}</span>
                </div>
              )}
            </div>

            {/* .env Editor Section */}
            <div className="p-4 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="font-bold text-[#FFFFFF] text-xs flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-indigo-400" />
                  Arquivo de Configurações (.env):
                </label>
                <span className="text-[10px] text-[#8E95A5]">
                  Localização: pasta raiz do executável
                </span>
              </div>

              <textarea
                rows={7}
                value={envRawText}
                onChange={(e) => setEnvRawText(e.target.value)}
                className="w-full bg-[#0D0F12] border border-[#2D3139] rounded-xl p-3 text-[11px] font-mono text-indigo-200 focus:outline-none focus:border-indigo-500/70"
                placeholder="DISCORD_BOT_TOKEN=...&#10;DISCORD_GUILD_ID=...&#10;PORT=3000"
              />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleSaveEnvText}
                  disabled={isEnvSaving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm cursor-pointer transition-colors"
                >
                  {isEnvSaving ? 'Salvando...' : 'Salvar no Arquivo .env'}
                </button>
              </div>
            </div>

            {/* How to generate Portable Executable Tutorial */}
            <div className="p-4 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-3">
              <h5 className="font-bold text-[#FFFFFF] text-xs flex items-center gap-1.5">
                📖 Como Gerar e Usar o Executável (.exe) Portable em 2 Minutos
              </h5>

              <div className="space-y-2 text-[#C9D1D9]">
                <div className="p-2.5 bg-[#0D0F12] rounded-xl border border-[#22262B] space-y-1">
                  <p className="font-bold text-indigo-300">1. Gerar o .exe com 1-Clique:</p>
                  <p className="text-[11px] text-[#9E9E9E]">
                    Basta dar dois cliques no arquivo <code className="text-emerald-400 font-mono">gerar-executavel.bat</code> presente na raiz do projeto (ou rodar <code className="text-emerald-400 font-mono">npm run neu:build</code>).
                  </p>
                </div>

                <div className="p-2.5 bg-[#0D0F12] rounded-xl border border-[#22262B] space-y-1">
                  <p className="font-bold text-indigo-300">2. Estrutura Portable Gerada:</p>
                  <p className="text-[11px] text-[#9E9E9E]">
                    O comando gera uma pasta pronta <code className="text-indigo-300 font-mono">dist-portable/</code> contendo:
                  </p>
                  <ul className="list-disc list-inside text-[11px] text-[#9E9E9E] ml-2 space-y-0.5">
                    <li><strong className="text-white">CaranguejoRPG-win_x64.exe</strong> (ou <strong className="text-white">CaranguejoRPG.bat</strong> - executável portátil de ~5MB)</li>
                    <li><strong className="text-white">.env</strong> (onde ficam seu Token do Discord e portas)</li>
                    <li><strong className="text-white">data/</strong> (suas músicas, soundboard e fichas de NPCs)</li>
                  </ul>
                </div>

                <div className="p-2.5 bg-[#0D0F12] rounded-xl border border-[#22262B] space-y-1">
                  <p className="font-bold text-indigo-300">3. Usar em Qualquer PC ou Pen Drive:</p>
                  <p className="text-[11px] text-[#9E9E9E]">
                    Não requer instalação, nem permissão de administrador. Você pode copiar a pasta inteira para um Pen Drive e abrir direto no computador do jogo!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: Docker & Persistence */}
        {activeSubTab === 'docker' && (
          <div className="space-y-4 text-xs text-[#E0E0E0] leading-relaxed">
            <div className="p-3.5 bg-[#141619] rounded-xl border border-[#2D3139] space-y-2">
              <h4 className="font-bold text-indigo-400 text-sm flex items-center gap-1.5">
                <Container className="w-4 h-4" />
                Estrutura Docker & Volumes Persistentes
              </h4>
              <p className="text-[#9E9E9E]">
                Este projeto vem pronto com <code className="text-indigo-300 bg-[#22262B] px-1 py-0.5 rounded">Dockerfile</code> e <code className="text-indigo-300 bg-[#22262B] px-1 py-0.5 rounded">docker-compose.yml</code> completos para rodar 100% isolado e localmente em seu servidor ou máquina pessoal.
              </p>

              <div className="bg-[#141619] p-3 rounded-lg border border-[#2D3139] font-mono text-[11px] text-[#E0E0E0] space-y-1">
                <p className="text-[#6E7681]"># 1. Clone o projeto e configure o .env</p>
                <p className="text-indigo-400">cp .env.example .env</p>
                <p className="text-[#6E7681] mt-2"># 2. Inicie tudo com Docker Compose em segundo plano</p>
                <p className="text-indigo-400">docker compose up -d</p>
              </div>

              <h5 className="font-bold text-[#FFFFFF] pt-2">Volumes de Persistência:</h5>
              <ul className="list-disc list-inside text-[#9E9E9E] space-y-1">
                <li><code className="text-[#FFFFFF]">./data/db.json</code>: Banco de dados com pastas, fichas de NPCs e notas do mestre.</li>
                <li><code className="text-[#FFFFFF]">./data/music/</code>: Arquivos locais de áudio e trilhas.</li>
                <li><code className="text-[#FFFFFF]">./data/sfx/</code>: Efeitos sonoros do soundboard.</li>
                <li><code className="text-[#FFFFFF]">./data/npcs/</code>: Retratos e imagens locais de NPCs.</li>
              </ul>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

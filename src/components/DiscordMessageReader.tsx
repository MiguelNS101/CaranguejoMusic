import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquare,
  RefreshCw,
  Send,
  Scroll,
  Image as ImageIcon,
  X,
  Bot,
  ExternalLink,
  Clock,
  Sparkles,
  Upload,
  Dices,
  Volume2,
  FileText,
  Plus,
  Palette,
  Columns,
  Maximize2,
  Minimize2,
  AtSign,
  Shield,
  Eye,
  Swords,
  Heart,
  ChevronDown,
  Check,
  RotateCcw,
  Sparkle
} from 'lucide-react';
import { DiscordChannel } from '../types';
import { safeFetchJson } from '../services/api';
import { useAudio } from '../context/AudioContext';

export interface DiscordMessage {
  id: string;
  author: {
    id: string;
    username: string;
    discriminator?: string;
    avatar?: string;
    bot?: boolean;
  };
  content: string;
  cleanContent?: string;
  createdAt: string;
  attachments: Array<{
    id: string;
    name: string;
    url: string;
    proxyURL?: string;
    contentType?: string;
    size?: number;
  }>;
  embeds: Array<{
    title?: string;
    description?: string;
    color?: number | string;
    fields?: Array<{ name: string; value: string; inline?: boolean }>;
    image?: string;
    thumbnail?: string;
    footer?: string;
  }>;
}

interface DiscordMessageReaderProps {
  channels: DiscordChannel[];
  initialChannelId?: string;
  isBotOnline: boolean;
}

// Preset RPG fantasy color palette for distinct player identification
const RPG_USER_PALETTE = [
  '#38bdf8', // Sky Blue
  '#4ade80', // Emerald Green
  '#fbbf24', // Amber Gold
  '#f43f5e', // Crimson Rose
  '#a855f7', // Arcane Purple
  '#f97316', // Flame Orange
  '#2dd4bf', // Teal Water
  '#e879f9', // Fuchsia
  '#a3e635', // Lime
  '#818cf8', // Indigo
  '#facc15', // Sun Yellow
  '#60a5fa'  // Blue Magic
];

// Hash function to get a deterministic color for any username
export function getDeterministicColor(username: string): string {
  if (!username) return '#818cf8';
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % RPG_USER_PALETTE.length;
  return RPG_USER_PALETTE[index];
}

export const DiscordMessageReader: React.FC<DiscordMessageReaderProps> = ({
  channels,
  initialChannelId,
  isBotOnline
}) => {
  const { logAction } = useAudio();

  // Multi-tab channel state
  const [openTabChannelIds, setOpenTabChannelIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_chat_tabs');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [initialChannelId || channels[0]?.id || ''];
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => {
    return initialChannelId || channels[0]?.id || '';
  });

  // Split view mode: view two tabs side by side!
  const [isSplitView, setIsSplitView] = useState<boolean>(false);
  const [secondaryTabId, setSecondaryTabId] = useState<string>('');

  // Channel tab dropdown open state
  const [isAddTabOpen, setIsAddTabOpen] = useState<boolean>(false);

  // Messages per channel cache
  const [messagesByChannel, setMessagesByChannel] = useState<Record<string, DiscordMessage[]>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lastFetchedAt, setLastFetchedAt] = useState<Date | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Custom Player Colors state (saved in localStorage)
  const [customUserColors, setCustomUserColors] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_user_colors');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      'mestre': '#fbbf24',
      'gm': '#fbbf24',
      'bot': '#818cf8'
    };
  });
  const [isColorModalOpen, setIsColorModalOpen] = useState<boolean>(false);
  const [newPlayerNameInput, setNewPlayerNameInput] = useState<string>('');
  const [newPlayerColorInput, setNewPlayerColorInput] = useState<string>('#4ade80');

  // Quick Action Menu on message hover/click
  const [activeQuickMenuMsgId, setActiveQuickMenuMsgId] = useState<string | null>(null);

  // Quick Reply Box State
  const [quickContent, setQuickContent] = useState<string>('');
  const [quickMode, setQuickMode] = useState<'plain' | 'narrative'>('plain');
  const [quickImage, setQuickImage] = useState<{ name: string; base64: string } | null>(null);
  const [isSendingQuick, setIsSendingQuick] = useState<boolean>(false);
  const [isDraggingQuickImage, setIsDraggingQuickImage] = useState<boolean>(false);
  const [quickFeedback, setQuickFeedback] = useState<string | null>(null);

  // Lightbox for full images
  const [activeLightboxImg, setActiveLightboxImg] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const quickInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Keep tabs persisted
  useEffect(() => {
    try {
      localStorage.setItem('caranguejo_chat_tabs', JSON.stringify(openTabChannelIds.filter(Boolean)));
    } catch {}
  }, [openTabChannelIds]);

  // Keep colors persisted
  useEffect(() => {
    try {
      localStorage.setItem('caranguejo_user_colors', JSON.stringify(customUserColors));
    } catch {}
  }, [customUserColors]);

  // If initial channels loaded and no tabs open, open first channel
  useEffect(() => {
    if (channels.length > 0 && (!openTabChannelIds.length || !openTabChannelIds[0])) {
      setOpenTabChannelIds([channels[0].id]);
      setActiveTabId(channels[0].id);
    }
  }, [channels]);

  // Helper to get color for a username
  const getUserColor = (username: string): string => {
    const lower = username.toLowerCase().trim();
    if (customUserColors[lower]) {
      return customUserColors[lower];
    }
    return getDeterministicColor(username);
  };

  // Fetch messages for a specific channel
  const fetchChannelMessages = useCallback(async (channelId: string, isSilent = false) => {
    if (!channelId || !isBotOnline) return;

    if (!isSilent) setIsLoading(true);
    setFetchError(null);

    try {
      const res = await safeFetchJson<{ success: boolean; messages: DiscordMessage[]; error?: string }>(
        `/api/bot/channel-messages?channelId=${channelId}&limit=50`
      );

      if (res.success && res.data?.messages) {
        setMessagesByChannel(prev => ({
          ...prev,
          [channelId]: res.data?.messages || []
        }));
        setLastFetchedAt(new Date());
      } else {
        setFetchError(res.data?.error || res.error || 'Não foi possível carregar as mensagens.');
      }
    } catch (err: any) {
      setFetchError(err?.message || 'Erro de conexão.');
    } finally {
      setIsLoading(false);
    }
  }, [isBotOnline]);

  // Auto refresh active channels every 4 seconds
  useEffect(() => {
    if (!autoRefresh || !isBotOnline) return;

    // Fetch initial for active tab immediately
    if (activeTabId) fetchChannelMessages(activeTabId, true);
    if (isSplitView && secondaryTabId) fetchChannelMessages(secondaryTabId, true);

    const interval = setInterval(() => {
      if (activeTabId) fetchChannelMessages(activeTabId, true);
      if (isSplitView && secondaryTabId) fetchChannelMessages(secondaryTabId, true);
    }, 4000);

    return () => clearInterval(interval);
  }, [activeTabId, secondaryTabId, isSplitView, autoRefresh, isBotOnline, fetchChannelMessages]);

  // When active tab changes, fetch its messages if empty
  useEffect(() => {
    if (activeTabId && !messagesByChannel[activeTabId]) {
      fetchChannelMessages(activeTabId, false);
    }
  }, [activeTabId, messagesByChannel, fetchChannelMessages]);

  // Add channel tab
  const handleAddTab = (channelId: string) => {
    if (!openTabChannelIds.includes(channelId)) {
      setOpenTabChannelIds(prev => [...prev, channelId]);
    }
    setActiveTabId(channelId);
    setIsAddTabOpen(false);
  };

  // Close channel tab
  const handleCloseTab = (e: React.MouseEvent, channelId: string) => {
    e.stopPropagation();
    if (openTabChannelIds.length <= 1) return; // Keep at least one tab
    const nextTabs = openTabChannelIds.filter(id => id !== channelId);
    setOpenTabChannelIds(nextTabs);
    if (activeTabId === channelId) {
      setActiveTabId(nextTabs[0]);
    }
    if (secondaryTabId === channelId) {
      setSecondaryTabId('');
      setIsSplitView(false);
    }
  };

  // Quick image file handler
  const handleQuickImageFile = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setQuickImage({
        name: file.name,
        base64: ev.target?.result as string
      });
    };
    reader.readAsDataURL(file);
  };

  // Send quick reply
  const handleSendQuickReply = async (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const textToSend = customText !== undefined ? customText : quickContent;

    if (!textToSend.trim() && !quickImage) return;
    if (!activeTabId) return;

    setIsSendingQuick(true);
    setQuickFeedback(null);

    const payload: any = {
      channelId: activeTabId,
      content: textToSend.trim(),
      type: quickMode
    };

    if (quickImage) {
      payload.base64Image = quickImage.base64;
      payload.attachmentName = quickImage.name;
    }

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.success && res.data?.success) {
        logAction(`Mensagem enviada no canal #${activeChannel?.name || 'chat'}`, 'chat');
        setQuickContent('');
        setQuickImage(null);
        setQuickFeedback('Mensagem transmitida com sucesso!');
        setTimeout(() => setQuickFeedback(null), 3000);
        setTimeout(() => fetchChannelMessages(activeTabId, true), 600);
      } else {
        setQuickFeedback(res.data?.error || res.error || 'Falha ao enviar mensagem.');
      }
    } catch (err: any) {
      setQuickFeedback(err?.message || 'Erro de envio.');
    } finally {
      setIsSendingQuick(false);
    }
  };

  // Quick player actions
  const handleMentionPlayer = (username: string) => {
    setQuickContent(prev => `@${username} ${prev}`);
    quickInputRef.current?.focus();
    setActiveQuickMenuMsgId(null);
  };

  const handleRequestRoll = async (username: string, rollType: string) => {
    const text = `🎲 **[Chamado do Mestre]** @${username}, role um **${rollType}**!`;
    await handleSendQuickReply(undefined, text);
    setActiveQuickMenuMsgId(null);
  };

  const handleDirectCombatTurn = async (username: string) => {
    const text = `⚔️ **[Combate]** É o seu turno, @${username}! O que você faz?`;
    await handleSendQuickReply(undefined, text);
    setActiveQuickMenuMsgId(null);
  };

  const formatMessageTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const activeChannel = channels.find(c => c.id === activeTabId);
  const activeMessages = messagesByChannel[activeTabId] || [];

  const secondaryChannel = channels.find(c => c.id === secondaryTabId);
  const secondaryMessages = messagesByChannel[secondaryTabId] || [];

  // Extract all unique usernames from loaded messages for quick color configuration
  const allLoadedUsernames = Array.from(
    new Set(
      (Object.values(messagesByChannel) as DiscordMessage[][])
        .flat()
        .map(m => m?.author?.username)
        .filter((name): name is string => Boolean(name))
    )
  );

  return (
    <div id="caranguejo-discord-reader-container" className="space-y-4">
      {/* Top Controls Toolbar with Multi-Tabs */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 shadow-xl space-y-3">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
          {/* Channel Tabs Strip */}
          <div className="flex items-center gap-2 overflow-x-auto max-w-full pb-1 lg:pb-0 no-scrollbar">
            {openTabChannelIds.map(channelId => {
              const ch = channels.find(c => c.id === channelId);
              const isActive = activeTabId === channelId;
              const chName = ch ? ch.name : 'canal';
              const isVoice = ch?.type === 'voice';

              return (
                <div
                  key={channelId}
                  onClick={() => setActiveTabId(channelId)}
                  className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border shrink-0 shadow-sm ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                      : 'bg-[#141619] hover:bg-[#22262B] text-[#9E9E9E] hover:text-white border-[#2D3139]'
                  }`}
                >
                  <span className={isActive ? 'text-white/80 font-mono text-[11px]' : 'text-indigo-400 font-mono text-[11px]'}>
                    {isVoice ? '🎙️' : '#'}
                  </span>
                  <span className="truncate max-w-[130px] sm:max-w-[180px]">{chName}</span>

                  {/* Close Tab Button */}
                  {openTabChannelIds.length > 1 && (
                    <button
                      type="button"
                      onClick={(e) => handleCloseTab(e, channelId)}
                      className="p-0.5 rounded-md hover:bg-zinc-700/60 text-zinc-400 hover:text-rose-300 transition-colors ml-1 cursor-pointer"
                      title="Fechar aba"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              );
            })}

            {/* Add Tab Dropdown */}
            <div className="relative">
              <button
                type="button"
                id="btn-add-chat-tab"
                onClick={() => setIsAddTabOpen(prev => !prev)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                title="Abrir novo canal em uma aba"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Aba</span>
                <ChevronDown className="w-3 h-3 text-zinc-400" />
              </button>

              {isAddTabOpen && (
                <div className="absolute left-0 mt-1.5 w-64 bg-[#16181D] border border-[#2D3139] rounded-2xl shadow-2xl z-50 p-2 space-y-1 max-h-72 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] uppercase font-bold text-zinc-400 border-b border-[#282C34]">
                    Selecionar Canal para Abrir
                  </div>
                  {channels.map(c => {
                    const isAlreadyOpen = openTabChannelIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => handleAddTab(c.id)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                          isAlreadyOpen
                            ? 'bg-indigo-950/40 text-indigo-300 font-semibold'
                            : 'text-zinc-300 hover:bg-[#20242a] hover:text-white'
                        }`}
                      >
                        <span className="truncate flex items-center gap-1.5">
                          <span className="text-indigo-400 font-mono">{c.type === 'voice' ? '🎙️' : '#'}</span>
                          {c.name}
                        </span>
                        {isAlreadyOpen && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Toolbar Buttons */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {/* Split Screen Mode Toggle */}
            <button
              type="button"
              id="btn-toggle-split-view"
              onClick={() => {
                if (!isSplitView) {
                  // pick another channel for secondary pane
                  const other = openTabChannelIds.find(id => id !== activeTabId) || channels.find(c => c.id !== activeTabId)?.id || '';
                  setSecondaryTabId(other);
                  setIsSplitView(true);
                } else {
                  setIsSplitView(false);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                isSplitView
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                  : 'bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border-[#3A3F4A]'
              }`}
              title="Dividir tela para visualizar dois canais simultaneamente"
            >
              <Columns className={`w-3.5 h-3.5 ${isSplitView ? 'text-white' : 'text-indigo-400'}`} />
              <span>{isSplitView ? 'Unir Telas' : 'Dividir Tela'}</span>
            </button>

            {/* Custom User Colors Button */}
            <button
              type="button"
              id="btn-open-user-colors-modal"
              onClick={() => setIsColorModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold transition-all shadow-sm cursor-pointer"
              title="Configurar cores personalizadas por jogador"
            >
              <Palette className="w-3.5 h-3.5 text-indigo-400" />
              <span>Cores dos Jogadores</span>
            </button>

            {/* Auto Refresh Toggle (Focus Selector 1) */}
            <button
              id="discord-reader-auto-refresh-btn"
              type="button"
              onClick={() => setAutoRefresh(prev => !prev)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shadow-sm ${
                autoRefresh
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-[#22262B] hover:bg-[#2D3139] text-[#9E9E9E] hover:text-white border-[#3A3F4A]'
              }`}
              title="Alternar sincronização contínua de mensagens a cada 4 segundos"
            >
              <span className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
              <span>Auto {autoRefresh ? 'Ligado' : 'Pausado'}</span>
            </button>

            {/* Manual Refresh Button (Focus Selector 2) */}
            <button
              id="discord-reader-manual-refresh-btn"
              type="button"
              onClick={() => {
                if (activeTabId) fetchChannelMessages(activeTabId, false);
                if (isSplitView && secondaryTabId) fetchChannelMessages(secondaryTabId, false);
              }}
              disabled={isLoading || !isBotOnline}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-md shadow-indigo-600/30 disabled:opacity-50"
              title="Buscar mensagens agora do canal ativo"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-white ${isLoading ? 'animate-spin' : ''}`} />
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Messages Viewer Grid (Single or Split View) */}
      <div className={`grid gap-4 ${isSplitView ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {/* Pane 1: Active Tab */}
        <MessagePane
          channel={activeChannel}
          messages={activeMessages}
          isLoading={isLoading}
          fetchError={fetchError}
          isBotOnline={isBotOnline}
          onRefresh={() => activeTabId && fetchChannelMessages(activeTabId, false)}
          getUserColor={getUserColor}
          onMentionPlayer={handleMentionPlayer}
          onRequestRoll={handleRequestRoll}
          onDirectCombatTurn={handleDirectCombatTurn}
          onOpenLightbox={(url) => setActiveLightboxImg(url)}
          formatMessageTime={formatMessageTime}
          activeQuickMenuMsgId={activeQuickMenuMsgId}
          setActiveQuickMenuMsgId={setActiveQuickMenuMsgId}
        />

        {/* Pane 2: Secondary Tab (in Split View) */}
        {isSplitView && (
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-[#1A1D21] border border-[#2D3139] rounded-t-2xl">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                <Columns className="w-3.5 h-3.5 text-amber-400" />
                <span>Segundo Painel:</span>
                <select
                  value={secondaryTabId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSecondaryTabId(id);
                    if (id) fetchChannelMessages(id, false);
                  }}
                  className="bg-[#141619] border border-[#2D3139] rounded-xl px-2 py-1 text-xs text-white"
                >
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.type === 'voice' ? '🎙️ ' : '#'}{c.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={() => setIsSplitView(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800"
                title="Fechar segundo painel"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1">
              <MessagePane
                channel={secondaryChannel}
                messages={secondaryMessages}
                isLoading={isLoading}
                fetchError={fetchError}
                isBotOnline={isBotOnline}
                onRefresh={() => secondaryTabId && fetchChannelMessages(secondaryTabId, false)}
                getUserColor={getUserColor}
                onMentionPlayer={handleMentionPlayer}
                onRequestRoll={handleRequestRoll}
                onDirectCombatTurn={handleDirectCombatTurn}
                onOpenLightbox={(url) => setActiveLightboxImg(url)}
                formatMessageTime={formatMessageTime}
                activeQuickMenuMsgId={activeQuickMenuMsgId}
                setActiveQuickMenuMsgId={setActiveQuickMenuMsgId}
                isRoundedTop={false}
              />
            </div>
          </div>
        )}
      </div>

      {/* Quick Action Presets Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-3 shadow-md">
        <span className="text-[10px] uppercase font-bold text-zinc-400 flex items-center gap-1 mr-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Avisos Rápidos:
        </span>

        <button
          type="button"
          onClick={() => handleSendQuickReply(undefined, '🎲 **[Aviso do Mestre]** Rolem Iniciativa! O combate começou!')}
          className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-amber-950/40 text-amber-300 border border-amber-500/30 hover:border-amber-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          🎲 Rolem Iniciativa!
        </button>

        <button
          type="button"
          onClick={() => handleSendQuickReply(undefined, '⚔️ **[Combate]** Preparem suas ações para a rodada.')}
          className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-rose-950/40 text-rose-300 border border-rose-500/30 hover:border-rose-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          ⚔️ Preparar Rodada
        </button>

        <button
          type="button"
          onClick={() => handleSendQuickReply(undefined, '👁️ **[Percepção]** Todos façam um teste de Percepção / Prontidão agora!')}
          className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-cyan-950/40 text-cyan-300 border border-cyan-500/30 hover:border-cyan-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          👁️ Teste de Percepção Geral
        </button>

        <button
          type="button"
          onClick={() => handleSendQuickReply(undefined, '🛡️ **[Resistência]** Todos na área façam um teste de Resistência!')}
          className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 hover:border-emerald-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          🛡️ Teste de Resistência
        </button>

        <button
          type="button"
          onClick={() => handleSendQuickReply(undefined, '✨ **[Descanso]** O grupo inicia um descanso seguro.')}
          className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-purple-950/40 text-purple-300 border border-purple-500/30 hover:border-purple-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          ✨ Descanso
        </button>

        <button
          type="button"
          onClick={() => handleSendQuickReply(undefined, '🤫 **[Silêncio]** Atenção total para a narração da cena!')}
          className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-indigo-950/40 text-indigo-300 border border-indigo-500/30 hover:border-indigo-400 text-[11px] font-bold transition-all shadow-sm cursor-pointer"
        >
          🤫 Silêncio no Canal
        </button>
      </div>

      {/* Quick Reply & Send Box at the Bottom of Reader */}
      <form
        onSubmit={handleSendQuickReply}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingQuickImage(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingQuickImage(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDraggingQuickImage(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleQuickImageFile(file);
        }}
        className={`bg-[#1A1D21] border rounded-2xl p-4 shadow-xl space-y-3 transition-colors ${
          isDraggingQuickImage ? 'border-indigo-400 bg-indigo-950/30' : 'border-[#2D3139]'
        }`}
      >
        {/* Attached image preview if any */}
        {quickImage && (
          <div className="flex items-center gap-3 bg-[#141619] p-2.5 rounded-xl border border-indigo-500/40">
            <img
              src={quickImage.base64}
              alt={quickImage.name}
              className="w-12 h-12 object-cover rounded-lg border border-[#2D3139]"
            />
            <div className="flex-1 min-w-0 text-xs">
              <p className="font-bold text-emerald-400 truncate">Imagem pronta para envio no chat</p>
              <p className="text-zinc-400 text-[11px] truncate">{quickImage.name}</p>
            </div>
            <button
              type="button"
              onClick={() => setQuickImage(null)}
              className="p-1 text-zinc-400 hover:text-rose-400 rounded-lg"
              title="Remover imagem"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Input Bar */}
        <div className="flex items-center gap-2">
          {/* Mode switch: Plain vs Narrative */}
          <div className="flex items-center bg-[#141619] p-1 rounded-xl border border-[#2D3139] shrink-0">
            <button
              type="button"
              onClick={() => setQuickMode('plain')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                quickMode === 'plain'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Mensagem normal de chat"
            >
              💬 Fala
            </button>
            <button
              type="button"
              onClick={() => setQuickMode('narrative')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                quickMode === 'narrative'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
              title="Narração épica em destaque dourado"
            >
              📜 Narração
            </button>
          </div>

          {/* Text Input */}
          <input
            ref={quickInputRef}
            type="text"
            value={quickContent}
            onChange={(e) => setQuickContent(e.target.value)}
            placeholder={
              quickMode === 'narrative'
                ? `Narrar cena no canal #${activeChannel?.name || 'chat'}...`
                : `Responder aos jogadores no canal #${activeChannel?.name || 'chat'}... (arraste imagens aqui)`
            }
            className="flex-1 bg-[#141619] border border-[#2D3139] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500/70"
          />

          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleQuickImageFile(f);
            }}
            accept="image/*"
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-[#141619] hover:bg-[#20242a] text-zinc-300 hover:text-white border border-[#2D3139] rounded-xl transition-colors cursor-pointer shrink-0"
            title="Anexar imagem ao chat"
          >
            <ImageIcon className="w-4 h-4 text-indigo-400" />
          </button>

          {/* Send Button */}
          <button
            type="submit"
            disabled={isSendingQuick || (!quickContent.trim() && !quickImage)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-indigo-600/30 cursor-pointer shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Enviar</span>
          </button>
        </div>

        {quickFeedback && (
          <p className="text-xs text-emerald-400 font-semibold text-center animate-fadeIn">
            {quickFeedback}
          </p>
        )}
      </form>

      {/* Lightbox Modal */}
      {activeLightboxImg && (
        <div
          onClick={() => setActiveLightboxImg(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <img
              src={activeLightboxImg}
              alt="Ampliação"
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl border border-zinc-800"
            />
            <button
              onClick={() => setActiveLightboxImg(null)}
              className="absolute top-3 right-3 p-2 rounded-full bg-black/60 text-white hover:bg-black/90 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Player Colors Modal */}
      {isColorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-[#16181D] border border-[#2D3139] rounded-3xl w-full max-w-md shadow-2xl overflow-hidden text-zinc-100 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#282C34] pb-3">
              <div className="flex items-center gap-2">
                <Palette className="w-5 h-5 text-purple-400" />
                <h3 className="text-base font-bold text-white font-rpg">Cores dos Jogadores</h3>
              </div>
              <button
                onClick={() => setIsColorModalOpen(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Personalize a cor de destaque de cada jogador no chat do Discord para identificação imediata das falas e rolagens.
            </p>

            {/* Existing configured colors list */}
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                Jogadores Configurados ({Object.keys(customUserColors).length})
              </div>
              {Object.entries(customUserColors).map(([uname, col]) => (
                <div
                  key={uname}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#141619] border border-[#2D3139]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-4 h-4 rounded-full border border-white/20 shadow-sm shrink-0"
                      style={{ backgroundColor: col }}
                    />
                    <span className="text-xs font-bold capitalize text-white">{uname}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Quick Palette Picker */}
                    <div className="flex items-center gap-1">
                      {RPG_USER_PALETTE.slice(0, 5).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            setCustomUserColors(prev => ({ ...prev, [uname]: c }));
                          }}
                          className="w-3.5 h-3.5 rounded-full hover:scale-125 transition-transform"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>

                    <input
                      type="color"
                      value={col}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomUserColors(prev => ({ ...prev, [uname]: val }));
                      }}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
                      title="Escolher cor personalizada"
                    />

                    <button
                      type="button"
                      onClick={() => {
                        setCustomUserColors(prev => {
                          const copy = { ...prev };
                          delete copy[uname];
                          return copy;
                        });
                      }}
                      className="p-1 text-zinc-500 hover:text-rose-400"
                      title="Remover cor customizada"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Detected users from loaded messages without custom color */}
              {allLoadedUsernames.filter(u => !customUserColors[u.toLowerCase()]).length > 0 && (
                <div className="pt-2">
                  <div className="text-[10px] font-bold text-zinc-400 uppercase mb-1">
                    Detectados no Chat (Clique para fixar cor):
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allLoadedUsernames
                      .filter(u => !customUserColors[u.toLowerCase()])
                      .map(u => {
                        const autoCol = getDeterministicColor(u);
                        return (
                          <button
                            key={u}
                            type="button"
                            onClick={() => {
                              setCustomUserColors(prev => ({ ...prev, [u.toLowerCase()]: autoCol }));
                            }}
                            className="px-2 py-1 rounded-lg text-xs font-semibold bg-[#141619] border border-[#2D3139] hover:border-zinc-500 flex items-center gap-1.5 transition-colors"
                          >
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: autoCol }} />
                            <span>{u}</span>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Add New Custom Player Color form */}
            <div className="pt-2 border-t border-[#282C34] space-y-2">
              <span className="text-[11px] font-bold text-zinc-300">Adicionar Jogador Manualmente:</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newPlayerNameInput}
                  onChange={(e) => setNewPlayerNameInput(e.target.value)}
                  placeholder="Nome do Jogador / Discord..."
                  className="flex-1 bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
                <input
                  type="color"
                  value={newPlayerColorInput}
                  onChange={(e) => setNewPlayerColorInput(e.target.value)}
                  className="w-8 h-8 rounded-xl cursor-pointer bg-transparent border border-[#2D3139]"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newPlayerNameInput.trim()) return;
                    setCustomUserColors(prev => ({
                      ...prev,
                      [newPlayerNameInput.trim().toLowerCase()]: newPlayerColorInput
                    }));
                    setNewPlayerNameInput('');
                  }}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Salvar
                </button>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setIsColorModalOpen(false)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Subcomponent: Message Pane for single or split view
interface MessagePaneProps {
  channel?: DiscordChannel;
  messages: DiscordMessage[];
  isLoading: boolean;
  fetchError: string | null;
  isBotOnline: boolean;
  onRefresh: () => void;
  getUserColor: (username: string) => string;
  onMentionPlayer: (username: string) => void;
  onRequestRoll: (username: string, rollType: string) => void;
  onDirectCombatTurn: (username: string) => void;
  onOpenLightbox: (url: string) => void;
  formatMessageTime: (iso: string) => string;
  activeQuickMenuMsgId: string | null;
  setActiveQuickMenuMsgId: (id: string | null) => void;
  isRoundedTop?: boolean;
}

const MessagePane: React.FC<MessagePaneProps> = ({
  channel,
  messages,
  isLoading,
  fetchError,
  isBotOnline,
  onRefresh,
  getUserColor,
  onMentionPlayer,
  onRequestRoll,
  onDirectCombatTurn,
  onOpenLightbox,
  formatMessageTime,
  activeQuickMenuMsgId,
  setActiveQuickMenuMsgId,
  isRoundedTop = true
}) => {
  return (
    <div
      className={`bg-[#1A1D21] border border-[#2D3139] shadow-xl flex flex-col h-[520px] overflow-hidden ${
        isRoundedTop ? 'rounded-2xl' : 'rounded-b-2xl'
      }`}
    >
      {/* Messages Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#2D3139] bg-[#141619]/90 shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#E0E0E0]">
          <span className="text-indigo-400 font-mono font-bold">
            {channel?.type === 'voice' ? '🎙️' : '#'}
          </span>
          <span className="font-bold text-white">
            {channel ? channel.name : 'Selecionar Canal'}
          </span>
          <span className="text-[10px] text-zinc-400 ml-1">
            ({messages.length} msgs)
          </span>
        </div>
      </div>

      {/* Messages Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!isBotOnline ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-3">
            <Bot className="w-12 h-12 text-zinc-600 animate-bounce" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-white font-rpg">Bot do Discord Offline</p>
              <p className="text-xs text-zinc-400 max-w-sm">
                Conecte o bot para ler as mensagens dos jogadores em tempo real sem precisar de Alt+Tab.
              </p>
            </div>
          </div>
        ) : fetchError ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <p className="text-xs text-rose-400 font-semibold">{fetchError}</p>
            <button
              type="button"
              onClick={onRefresh}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold"
            >
              Tentar Novamente
            </button>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 space-y-2">
            <MessageSquare className="w-10 h-10 text-zinc-600" />
            <p className="text-xs text-zinc-400">
              {isLoading ? 'Carregando histórico...' : 'Nenhuma mensagem recente neste canal.'}
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const userColor = getUserColor(msg.author.username);
            const isMenuOpen = activeQuickMenuMsgId === msg.id;

            return (
              <div
                key={msg.id || index}
                id={`discord-msg-${msg.id || index}`}
                className="group relative rounded-2xl bg-[#15171B] border border-[#282C34] hover:border-[#3E4450] p-3.5 shadow-sm transition-all duration-150"
                style={{
                  borderLeftWidth: '4px',
                  borderLeftColor: userColor
                }}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    {/* Avatar with custom color ring */}
                    {msg.author.avatar ? (
                      <img
                        src={msg.author.avatar}
                        alt={msg.author.username}
                        className="w-7 h-7 rounded-full object-cover border"
                        style={{ borderColor: userColor }}
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-sm"
                        style={{ backgroundColor: userColor }}
                      >
                        {msg.author.username.charAt(0).toUpperCase()}
                      </div>
                    )}

                    {/* Username & Badges */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className="text-xs font-bold tracking-wide"
                        style={{ color: userColor }}
                      >
                        {msg.author.username}
                      </span>

                      {msg.author.bot && (
                        <span className="px-1.5 py-0.2 text-[9px] font-bold bg-indigo-600 text-white rounded uppercase tracking-wider">
                          BOT
                        </span>
                      )}

                      <span className="text-[10px] text-zinc-400 font-mono">
                        {formatMessageTime(msg.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Quick Action Button for this player */}
                  <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={() => onMentionPlayer(msg.author.username)}
                      className="px-2 py-0.5 rounded-lg bg-[#1D2026] hover:bg-indigo-950/60 text-indigo-300 border border-indigo-500/30 text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                      title={`Responder / Mencionar @${msg.author.username}`}
                    >
                      <AtSign className="w-3 h-3 text-indigo-400" />
                      <span className="hidden sm:inline">Responder</span>
                    </button>

                    {/* Quick Rolls & Prompt Dropdown */}
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setActiveQuickMenuMsgId(isMenuOpen ? null : msg.id)}
                        className="p-1 rounded-lg bg-[#1D2026] hover:bg-zinc-700 text-zinc-300 border border-[#2D3139] transition-colors cursor-pointer"
                        title="Ações rápidas para este jogador"
                      >
                        <Dices className="w-3.5 h-3.5 text-amber-400" />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-1 w-48 bg-[#181A1F] border border-[#2D3139] rounded-2xl shadow-2xl z-50 p-1.5 space-y-1 animate-fadeIn">
                          <div className="px-2 py-1 text-[9px] uppercase font-bold text-zinc-400 border-b border-[#282C34]">
                            Ações para @{msg.author.username}
                          </div>
                          <button
                            type="button"
                            onClick={() => onRequestRoll(msg.author.username, 'Teste de Percepção')}
                            className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-zinc-200 hover:bg-indigo-950/50 hover:text-indigo-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Eye className="w-3 h-3 text-cyan-400" />
                            <span>Pedir Percepção</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestRoll(msg.author.username, 'Teste de Iniciativa')}
                            className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-zinc-200 hover:bg-amber-950/50 hover:text-amber-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Dices className="w-3 h-3 text-amber-400" />
                            <span>Pedir Iniciativa</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onRequestRoll(msg.author.username, 'Teste de Resistência')}
                            className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-zinc-200 hover:bg-emerald-950/50 hover:text-emerald-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span>Pedir Resistência</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDirectCombatTurn(msg.author.username)}
                            className="w-full text-left px-2 py-1 rounded-lg text-[11px] text-zinc-200 hover:bg-rose-950/50 hover:text-rose-300 flex items-center gap-1.5 transition-colors"
                          >
                            <Swords className="w-3 h-3 text-rose-400" />
                            <span>Avisar Turno</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Content */}
                {msg.content && (
                  <p className="text-xs sm:text-sm text-zinc-200 whitespace-pre-wrap leading-relaxed break-words font-sans">
                    {msg.content}
                  </p>
                )}

                {/* Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2">
                    {msg.attachments.map((att) => (
                      <div
                        key={att.id}
                        onClick={() => onOpenLightbox(att.url)}
                        className="group/img relative rounded-xl overflow-hidden border border-[#2D3139] bg-black/40 cursor-zoom-in hover:border-indigo-500/60 transition-all"
                      >
                        <img
                          src={att.url}
                          alt={att.name}
                          className="w-full h-32 object-cover transition-transform group-hover/img:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-1.5 text-[10px] text-zinc-300 truncate">
                          {att.name}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Embeds */}
                {msg.embeds && msg.embeds.length > 0 && (
                  <div className="space-y-2 pt-2">
                    {msg.embeds.map((emb, eIdx) => (
                      <div
                        key={eIdx}
                        className="border-l-4 rounded-r-xl bg-[#181A1F] p-3 space-y-1.5 border-[#2D3139]"
                        style={{ borderLeftColor: userColor }}
                      >
                        {emb.title && (
                          <h4 className="text-xs font-bold text-white font-rpg">{emb.title}</h4>
                        )}
                        {emb.description && (
                          <p className="text-[11px] text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {emb.description}
                          </p>
                        )}
                        {emb.fields && emb.fields.length > 0 && (
                          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#282C34]">
                            {emb.fields.map((f, fIdx) => (
                              <div key={fIdx} className="text-[10px]">
                                <span className="font-bold text-zinc-400 block">{f.name}</span>
                                <span className="text-zinc-200">{f.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {emb.image && (
                          <img
                            src={emb.image}
                            alt="Embed"
                            onClick={() => onOpenLightbox(emb.image!)}
                            className="mt-1.5 rounded-lg max-h-48 object-cover border border-[#2D3139] cursor-zoom-in"
                          />
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

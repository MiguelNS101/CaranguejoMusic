import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Headphones,
  MessageSquare,
  Dices,
  Flame,
  Volume2,
  RefreshCw,
  Sparkles,
  TrendingUp,
  Radio,
  Clock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Skull,
  Award,
  ChevronRight,
  Send,
  Zap,
  Server
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { RealtimeUsageStats } from '../types';
import { safeFetchJson } from '../services/api';

interface RealtimeDashboardWidgetProps {
  onOpenDiceTab?: () => void;
  onOpenDiscordReader?: () => void;
  onOpenMusicTab?: () => void;
  density?: 'expanded' | 'compact' | 'minimized';
}

export const RealtimeDashboardWidget: React.FC<RealtimeDashboardWidgetProps> = ({
  onOpenDiceTab,
  onOpenDiscordReader,
  onOpenMusicTab,
  density = 'expanded'
}) => {
  const {
    playbackState,
    currentTrack,
    ambiencePlaybackState,
    currentAmbienceTrack,
    botStatus,
    sessionSeconds,
    formatDuration
  } = useAudio();

  const [activeTab, setActiveTab] = useState<'overview' | 'dice_history' | 'bot_messages'>('overview');
  const [stats, setStats] = useState<RealtimeUsageStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Local seconds ticker for ultra-smooth real-time ticking when audio is active
  const [localAudioTick, setLocalAudioTick] = useState<number>(0);
  const isAudioPlaying = playbackState === 'playing' || ambiencePlaybackState === 'playing' || stats?.activeAudio?.isPlaying;

  // Fetch stats from backend
  const fetchStats = async () => {
    try {
      const res = await safeFetchJson<RealtimeUsageStats>('/api/stats/realtime');
      if (res.success && res.data) {
        setStats(res.data);
        setLastRefreshedAt(new Date());
        setLocalAudioTick(0);
      }
    } catch (e) {
      console.warn('Could not fetch realtime usage stats:', e);
    }
  };

  // Initial load and periodic refresh (every 3.5s)
  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 3500);
    return () => clearInterval(interval);
  }, []);

  // Smooth local ticker when audio is playing in browser
  useEffect(() => {
    if (!isAudioPlaying) return;

    const tickTimer = setInterval(() => {
      setLocalAudioTick(prev => prev + 1);
    }, 1000);

    return () => clearInterval(tickTimer);
  }, [isAudioPlaying]);

  // Audio heartbeat to backend if browser is playing local music
  useEffect(() => {
    if (playbackState !== 'playing' && ambiencePlaybackState !== 'playing') return;

    const hbTimer = setInterval(() => {
      safeFetchJson('/api/stats/audio-heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seconds: 5, source: playbackState === 'playing' ? 'music' : 'ambience' })
      }).catch(() => {});
    }, 5000);

    return () => clearInterval(hbTimer);
  }, [playbackState, ambiencePlaybackState]);

  // Format seconds into human readable format: e.g. "01h 24m 30s" or "15m 42s"
  const formatAudioTime = (seconds: number) => {
    if (isNaN(seconds) || seconds < 0) return '00s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
  };

  const totalPlayedSecs = (stats?.totalAudioPlayedSeconds || 0) + localAudioTick;
  const sessionPlayedSecs = (stats?.sessionAudioPlayedSeconds || 0) + localAudioTick;

  const totalBotMsgs = stats?.totalBotMessagesSent || 0;
  const msgTypes = stats?.messagesByType || { narrative: 0, initiative: 0, dice: 0, npc: 0, map: 0, chat: 0 };
  const diceStats = stats?.diceStats || { totalRolls: 0, criticalHits: 0, criticalFails: 0, successRate: 100, averageTotal: 0 };
  const recentRolls = stats?.recentDiceRolls || [];

  return (
    <div className="space-y-3.5">
      {/* Top Real-time Header & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2.5 border-b border-[#2D3139]/80">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-300">
            <span className={`w-2 h-2 rounded-full ${isAudioPlaying ? 'bg-emerald-400 animate-ping' : 'bg-emerald-500'}`} />
            <span>AO VIVO NO ESCUDO</span>
          </div>

          <span className="text-[11px] text-[#9E9E9E] font-mono hidden md:inline">
            Atualizado: {lastRefreshedAt.toLocaleTimeString('pt-BR')}
          </span>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center gap-1 bg-[#141619] p-1 rounded-xl border border-[#2D3139] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            Visão Geral
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('dice_history')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dice_history'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <Dices className="w-3.5 h-3.5" />
            <span>Rolagens ({recentRolls.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bot_messages')}
            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'bot_messages'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Bot ({totalBotMsgs})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLoading(true);
              fetchStats().finally(() => setIsLoading(false));
            }}
            className="p-1 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#22262B] transition-colors cursor-pointer ml-1"
            title="Atualizar estatísticas agora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* VIEW 1: OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-3">
          {/* Main 3 KPI Cards: Audio Time, Bot Messages, Recent Dice Activity */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {/* KPI 1: TEMPO TOTAL DE ÁUDIO REPRODUZIDO */}
            <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <Headphones className="w-3.5 h-3.5 text-amber-400" />
                    Tempo Total de Áudio
                  </span>
                  {isAudioPlaying && (
                    <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                      Tocando
                    </span>
                  )}
                </div>

                <div className="mt-2.5 mb-1.5">
                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    {formatAudioTime(totalPlayedSecs)}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-[#9E9E9E] mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-400/80" />
                    <span>Nesta sessão: <strong className="text-amber-200 font-mono">{formatAudioTime(sessionPlayedSecs)}</strong></span>
                  </div>
                </div>

                <div className="pt-2 border-t border-[#2D3139]/70 text-[11px] text-[#9E9E9E] space-y-1">
                  <div className="flex items-center justify-between">
                    <span>Faixa Atual:</span>
                    <strong className="text-white truncate max-w-[140px]">
                      {currentTrack?.title || currentAmbienceTrack?.title || (stats?.activeAudio?.currentTrack) || 'Nenhuma'}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Transmissão:</span>
                    <span className={`font-semibold ${botStatus.isVoiceConnected ? 'text-emerald-400' : 'text-zinc-400'}`}>
                      {botStatus.isVoiceConnected ? '🔊 Canal de Voz Discord' : '🎧 Prévia Local'}
                    </span>
                  </div>
                </div>
              </div>

              {onOpenMusicTab && (
                <button
                  type="button"
                  onClick={onOpenMusicTab}
                  className="mt-3 pt-2 border-t border-[#2D3139]/60 flex items-center justify-between w-full text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Abrir Player de Trilha</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* KPI 2: MENSAGENS ENVIADAS PELO BOT */}
            <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] hover:border-indigo-500/40 transition-all flex flex-col justify-between group shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                    Mensagens do Bot
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    botStatus.isOnline
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                  }`}>
                    {botStatus.isOnline ? 'Discord Conectado' : 'Offline'}
                  </span>
                </div>

                <div className="mt-2.5 mb-1.5">
                  <div className="text-2xl font-black font-mono text-white tracking-tight">
                    {totalBotMsgs}
                  </div>
                  <div className="text-xs text-[#9E9E9E] mt-1">
                    mensagens & embeds transmitidos ao chat
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#2D3139]/70 text-[10px]">
                  <div className="p-1.5 rounded-lg bg-[#0F1113] border border-[#262A32] flex items-center justify-between">
                    <span className="text-[#9E9E9E]">📜 Narrações:</span>
                    <strong className="text-orange-300 font-mono">{msgTypes.narrative || 0}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0F1113] border border-[#262A32] flex items-center justify-between">
                    <span className="text-[#9E9E9E]">⚔️ Iniciativa:</span>
                    <strong className="text-rose-300 font-mono">{msgTypes.initiative || 0}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0F1113] border border-[#262A32] flex items-center justify-between">
                    <span className="text-[#9E9E9E]">🎲 Dados:</span>
                    <strong className="text-indigo-300 font-mono">{msgTypes.dice || 0}</strong>
                  </div>
                  <div className="p-1.5 rounded-lg bg-[#0F1113] border border-[#262A32] flex items-center justify-between">
                    <span className="text-[#9E9E9E]">👤 Retratos:</span>
                    <strong className="text-emerald-300 font-mono">{msgTypes.npc || 0}</strong>
                  </div>
                </div>
              </div>

              {onOpenDiscordReader && (
                <button
                  type="button"
                  onClick={onOpenDiscordReader}
                  className="mt-3 pt-2 border-t border-[#2D3139]/60 flex items-center justify-between w-full text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer group-hover:translate-x-0.5 transition-transform"
                >
                  <span>Abrir Chat do Discord</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* KPI 3: HISTÓRICO RECENTE & ESTATÍSTICAS DE DADOS */}
            <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-sm">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Dices className="w-3.5 h-3.5 text-emerald-400" />
                    Atividade de Dados
                  </span>
                  <span className="text-[10px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-mono">
                    {diceStats.successRate}% Acertos
                  </span>
                </div>

                <div className="mt-2.5 mb-1.5">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black font-mono text-white tracking-tight">
                      {diceStats.totalRolls}
                    </span>
                    <span className="text-xs text-[#9E9E9E]">rolagens computadas</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-300">
                    <span className="text-amber-400 font-bold">⭐ {diceStats.criticalHits} Críticos</span>
                    <span className="text-zinc-600">•</span>
                    <span className="text-rose-400 font-bold">💀 {diceStats.criticalFails} Falhas Críticas</span>
                  </div>
                </div>

                {/* Ultima rolagem preview */}
                <div className="pt-2 border-t border-[#2D3139]/70 text-[11px] text-[#9E9E9E]">
                  {recentRolls.length > 0 ? (
                    <div className="p-2 rounded-xl bg-[#0F1113] border border-[#262A32] flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-zinc-400 block truncate">Último: {recentRolls[0].rollerName}</span>
                        <strong className="text-white text-xs font-mono truncate block">{recentRolls[0].formula}</strong>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`text-sm font-black font-mono ${
                          recentRolls[0].isCriticalSuccess
                            ? 'text-amber-400'
                            : recentRolls[0].isCriticalFail
                            ? 'text-rose-400'
                            : 'text-emerald-400'
                        }`}>
                          {recentRolls[0].isWod ? `${recentRolls[0].total} suc` : recentRolls[0].total}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="italic">Nenhuma rolagem feita ainda.</span>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('dice_history')}
                className="mt-3 pt-2 border-t border-[#2D3139]/60 flex items-center justify-between w-full text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer group-hover:translate-x-0.5 transition-transform"
              >
                <span>Ver Todas as Rolagens ({recentRolls.length})</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Recent Mini-Feed of Dice & Server Status */}
          <div className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 text-xs text-[#9E9E9E] w-full sm:w-auto">
              <Server className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Servidor: <strong className="text-white">{botStatus.currentGuild?.name || 'Local'}</strong> |
                Canal: <strong className="text-white">{botStatus.targetTextChannel?.name || '#geral'}</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[11px] text-[#9E9E9E]">Sessão Corrida:</span>
              <span className="text-xs font-bold font-mono text-indigo-300 bg-indigo-950/50 border border-indigo-500/30 px-2 py-0.5 rounded-lg">
                {formatDuration(sessionSeconds)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: FULL RECENT DICE ROLLS HISTORY */}
      {activeTab === 'dice_history' && (
        <div className="space-y-3">
          {/* Summary Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[#141619] border border-[#2D3139]">
              <span className="text-[10px] text-[#9E9E9E] uppercase font-bold block">Total de Rolagens</span>
              <span className="text-lg font-black font-mono text-white">{diceStats.totalRolls}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#141619] border border-[#2D3139]">
              <span className="text-[10px] text-emerald-400 uppercase font-bold block">Taxa de Sucesso</span>
              <span className="text-lg font-black font-mono text-emerald-400">{diceStats.successRate}%</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#141619] border border-[#2D3139]">
              <span className="text-[10px] text-amber-400 uppercase font-bold block">Críticos</span>
              <span className="text-lg font-black font-mono text-amber-400">{diceStats.criticalHits}</span>
            </div>
            <div className="p-2.5 rounded-xl bg-[#141619] border border-[#2D3139]">
              <span className="text-[10px] text-rose-400 uppercase font-bold block">Falhas Críticas</span>
              <span className="text-lg font-black font-mono text-rose-400">{diceStats.criticalFails}</span>
            </div>
          </div>

          {/* Roll Items List */}
          <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
            {recentRolls.length === 0 ? (
              <div className="p-6 text-center rounded-xl bg-[#141619] border border-dashed border-[#2D3139] text-[#9E9E9E] text-xs">
                Nenhuma rolagem de dados recente no histórico. Rolar dados no painel ou no Discord através de <code>\r</code>, <code>\d</code> ou <code>\k</code> fará as rolagens aparecerem aqui ao vivo.
              </div>
            ) : (
              recentRolls.map((roll) => {
                const dateStr = new Date(roll.timestamp).toLocaleTimeString('pt-BR', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });

                return (
                  <div
                    key={roll.id}
                    className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition-all ${
                      roll.isCriticalSuccess
                        ? 'bg-amber-950/25 border-amber-500/40 shadow-sm'
                        : roll.isCriticalFail
                        ? 'bg-rose-950/25 border-rose-500/40 shadow-sm'
                        : 'bg-[#141619] border-[#2D3139]'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <strong className="text-xs text-white flex items-center gap-1.5">
                          {roll.rollerName}
                        </strong>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#0F1113] text-[#9E9E9E] border border-[#262A32]">
                          {roll.formula}
                        </span>
                        {roll.source === 'discord' ? (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 font-mono">
                            Discord Bot
                          </span>
                        ) : (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 font-mono">
                            Mestre Web
                          </span>
                        )}
                        {roll.isCriticalSuccess && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40">
                            🌟 CRÍTICO
                          </span>
                        )}
                        {roll.isCriticalFail && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                            💀 FALHA CRÍTICA
                          </span>
                        )}
                        <span className="text-[10px] text-[#6E7681] ml-auto font-mono">
                          {dateStr}
                        </span>
                      </div>

                      {roll.label && (
                        <p className="text-[11px] text-[#9E9E9E] mt-0.5 italic">
                          Ação: "{roll.label}"
                        </p>
                      )}

                      {/* Dice values pills */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap text-xs">
                        {roll.rolls && roll.rolls.length > 0 && roll.rolls.map((val, idx) => (
                          <span
                            key={idx}
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${
                              val === 20 || (roll.isWod && val === 10)
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : (roll.isWod && val >= 7)
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : val === 1
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : 'bg-[#0F1113] text-[#9E9E9E] border border-[#2D3139]'
                            }`}
                          >
                            {val}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Total Score / Successes */}
                    <div className="text-right shrink-0 border-t sm:border-t-0 sm:border-l border-[#2D3139] pt-1.5 sm:pt-0 sm:pl-3">
                      <span className="text-[10px] text-[#9E9E9E] block uppercase font-bold">
                        {roll.isWod ? 'Sucessos' : 'Total'}
                      </span>
                      <span className={`text-xl font-black font-mono ${
                        roll.isCriticalSuccess
                          ? 'text-amber-400'
                          : roll.isCriticalFail
                          ? 'text-rose-400'
                          : 'text-emerald-400'
                      }`}>
                        {roll.total}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: BOT MESSAGES BREAKDOWN */}
      {activeTab === 'bot_messages' && (
        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Estatísticas de Mensagens & Embeds do Bot
                </h4>
                <p className="text-xs text-[#9E9E9E]">
                  Total de mensagens enviadas aos jogadores no Discord desde o início da campanha.
                </p>
              </div>

              <div className="text-right">
                <span className="text-2xl font-black font-mono text-indigo-400">{totalBotMsgs}</span>
                <span className="text-[10px] text-[#9E9E9E] block">total enviadas</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 border-t border-[#2D3139]">
              <div className="p-3 rounded-lg bg-[#0F1113] border border-[#262A32]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  📜 Narração
                </span>
                <span className="text-xl font-black font-mono text-orange-400 mt-1 block">
                  {msgTypes.narrative || 0}
                </span>
                <span className="text-[10px] text-[#9E9E9E]">descrições dramáticas</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1113] border border-[#262A32]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  ⚔️ Turnos de Iniciativa
                </span>
                <span className="text-xl font-black font-mono text-rose-400 mt-1 block">
                  {msgTypes.initiative || 0}
                </span>
                <span className="text-[10px] text-[#9E9E9E]">avisos de ação</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1113] border border-[#262A32]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  🎲 Rolagens de Dados
                </span>
                <span className="text-xl font-black font-mono text-indigo-400 mt-1 block">
                  {msgTypes.dice || 0}
                </span>
                <span className="text-[10px] text-[#9E9E9E]">dados transmitidos</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1113] border border-[#262A32]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  👤 Retratos de NPCs
                </span>
                <span className="text-xl font-black font-mono text-emerald-400 mt-1 block">
                  {msgTypes.npc || 0}
                </span>
                <span className="text-[10px] text-[#9E9E9E]">handouts sem spoilers</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1113] border border-[#262A32]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  🗺️ Mapas & POIs
                </span>
                <span className="text-xl font-black font-mono text-sky-400 mt-1 block">
                  {msgTypes.map || 0}
                </span>
                <span className="text-[10px] text-[#9E9E9E]">locais táticos</span>
              </div>

              <div className="p-3 rounded-lg bg-[#0F1113] border border-[#262A32]">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  💬 Avisos Gerais
                </span>
                <span className="text-xl font-black font-mono text-purple-400 mt-1 block">
                  {msgTypes.chat || 0}
                </span>
                <span className="text-[10px] text-[#9E9E9E]">mensagens do mestre</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState } from 'react';
import {
  Volume2,
  VolumeX,
  Bot,
  Radio,
  Sparkles,
  Music,
  Users,
  MessageSquare,
  Shield,
  Settings,
  FolderOpen,
  HardDrive,
  Sliders,
  Headphones,
  SlidersHorizontal,
  ChevronDown,
  Clock,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { AudioMixerModal } from './AudioMixerModal';

interface HeaderProps {
  currentTab: 'master' | 'music' | 'soundboard' | 'npcs' | 'chat' | 'settings';
  setCurrentTab: (tab: 'master' | 'music' | 'soundboard' | 'npcs' | 'chat' | 'settings') => void;
  onOpenDiscordModal: () => void;
  onOpenFolderModal: () => void;
  onOpenSessionModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenDiscordModal,
  onOpenFolderModal,
  onOpenSessionModal
}) => {
  const {
    botStatus,
    volume,
    setVolume,
    musicVolume,
    sfxVolume,
    isMuted,
    toggleMute,
    isMusicMuted,
    isSfxMuted,
    currentTrack,
    playbackState,
    activeSfxIds,
    isLocalAudioEnabled,
    sessionSeconds,
    isSessionTimerRunning,
    toggleSessionTimer,
    resetSessionTimer,
    formatDuration
  } = useAudio();

  const [isMixerOpen, setIsMixerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#121417]/95 backdrop-blur-md border-b border-[#282C34] px-3 sm:px-5 py-2.5 transition-colors shadow-lg shadow-black/30">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Bot Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-orange-500/30 p-1 shadow-md shadow-orange-500/10 flex items-center justify-center">
                <img
                  src="/icon.png"
                  alt="CaranguejoRPG"
                  className="w-full h-full object-contain drop-shadow"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div className="hidden sm:block">
                <div className="flex items-center gap-2">
                  <h1 className="text-sm font-bold tracking-wide text-white font-rpg leading-tight">
                    CaranguejoRPG
                  </h1>
                  <span className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Mesa
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                  Bot Discord & Painel do Mestre
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Expanded & Prominent */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 sm:px-3">
            <nav className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto max-w-full py-1.5 px-2 scrollbar-thin scrollbar-thumb-zinc-700/60 scrollbar-track-transparent rounded-2xl bg-[#16181D]/90 border border-[#2D3139] shadow-inner">
              {/* Escudo do Mestre */}
              <button
                id="tab-master-screen"
                onClick={() => setCurrentTab('master')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
                  currentTab === 'master'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-400" />
                <span>Escudo do Mestre</span>
              </button>

              {/* Músicas */}
              <button
                id="tab-music"
                onClick={() => setCurrentTab('music')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
                  currentTab === 'music'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Music className="w-4 h-4 text-amber-400" />
                <span>Músicas</span>
                {playbackState === 'playing' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                )}
              </button>

              {/* Soundboard */}
              <button
                id="tab-soundboard"
                onClick={() => setCurrentTab('soundboard')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
                  currentTab === 'soundboard'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Soundboard</span>
                {activeSfxIds.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {activeSfxIds.length}
                  </span>
                )}
              </button>

              {/* NPCs */}
              <button
                id="tab-npcs"
                onClick={() => setCurrentTab('npcs')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
                  currentTab === 'npcs'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Users className="w-4 h-4 text-cyan-400" />
                <span>NPCs</span>
              </button>

              {/* Chat Discord */}
              <button
                id="tab-chat"
                onClick={() => setCurrentTab('chat')}
                className={`shrink-0 flex items-center gap-2 px-3.5 sm:px-4 py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap ${
                  currentTab === 'chat'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-violet-400" />
                <span>Chat Discord</span>
              </button>

              <div className="w-px h-5 bg-zinc-700/60 mx-1 shrink-0" />

              {/* Pastas Modal Button */}
              <button
                id="tab-folders"
                onClick={onOpenFolderModal}
                title="Gerenciador de Pastas"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800/70 transition-colors whitespace-nowrap"
              >
                <FolderOpen className="w-4 h-4 text-zinc-400" />
                <span>Pastas</span>
              </button>

              {/* Saves & Sessões Button */}
              <button
                id="tab-saves"
                onClick={onOpenSessionModal}
                title="Sessões Salvas & Saves da Mesa"
                className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs sm:text-[13px] font-semibold text-indigo-300 hover:text-white bg-indigo-600/15 hover:bg-indigo-600/30 border border-indigo-500/35 transition-colors whitespace-nowrap"
              >
                <HardDrive className="w-4 h-4 text-indigo-400" />
                <span>Saves</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: Session Timer + Audio Mixer + Discord Status */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Session Duration Timer Widget in Header */}
            <div
              id="header-session-timer-widget"
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs transition-all shadow-sm ${
                isSessionTimerRunning
                  ? 'bg-indigo-950/40 border-indigo-500/50 text-indigo-100 shadow-indigo-600/10'
                  : 'bg-[#181B20] border-[#282C34] text-zinc-300'
              }`}
              title="Duração da Sessão (Persistente)"
            >
              <div
                onClick={() => setCurrentTab('master')}
                className="flex items-center gap-1.5 cursor-pointer hover:text-white"
                title="Clique para ir ao Escudo do Mestre"
              >
                <Clock className={`w-3.5 h-3.5 ${isSessionTimerRunning ? 'text-indigo-400 animate-pulse' : 'text-zinc-400'}`} />
                <span className="font-mono font-bold tracking-wider text-white text-xs sm:text-sm">
                  {formatDuration(sessionSeconds)}
                </span>
              </div>

              <div className="flex items-center gap-1 pl-1 border-l border-zinc-700/60">
                {/* Play / Pause Toggle Button */}
                <button
                  type="button"
                  onClick={toggleSessionTimer}
                  className={`p-1 rounded-lg transition-colors cursor-pointer ${
                    isSessionTimerRunning
                      ? 'bg-amber-600/30 text-amber-300 hover:bg-amber-600/50'
                      : 'bg-indigo-600/30 text-indigo-300 hover:bg-indigo-600/50'
                  }`}
                  title={isSessionTimerRunning ? 'Pausar Duração da Sessão' : 'Iniciar Duração da Sessão'}
                >
                  {isSessionTimerRunning ? (
                    <Pause className="w-3 h-3 fill-current" />
                  ) : (
                    <Play className="w-3 h-3 fill-current" />
                  )}
                </button>

                {/* Reset Button */}
                <button
                  type="button"
                  onClick={resetSessionTimer}
                  className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
                  title="Zerar Tempo da Sessão"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Audio Mixer Studio Button */}
            <button
              id="btn-open-audio-mixer"
              onClick={() => setIsMixerOpen(true)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs sm:text-[13px] font-semibold transition-all shadow-sm ${
                isMuted || isMusicMuted || isSfxMuted
                  ? 'bg-rose-950/40 border-rose-500/40 text-rose-200 hover:bg-rose-900/40'
                  : 'bg-[#181B20] border-[#282C34] hover:border-indigo-500/40 text-zinc-200 hover:bg-[#20242B]'
              }`}
              title="Abrir Mixer de Áudio (Separar Música e Efeitos)"
            >
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Mixer</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/80 px-1.5 py-0.5 rounded border border-zinc-700/50">
                {isMuted ? 'Mudo' : `${Math.round(volume * 100)}%`}
              </span>
            </button>

            {/* Discord Status Button */}
            <button
              id="btn-discord-status-modal"
              onClick={onOpenDiscordModal}
              className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                botStatus.isOnline
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40 shadow-sm shadow-emerald-500/10'
                  : 'bg-[#181B20] text-zinc-300 border-[#282C34] hover:border-zinc-600 hover:bg-[#20242B]'
              }`}
              title={botStatus.isOnline ? 'Discord Conectado' : 'Clique para configurar o bot do Discord'}
            >
              <div className="relative flex items-center justify-center">
                <Bot className="w-3.5 h-3.5 text-indigo-400" />
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                  }`}
                />
              </div>
              <div className="hidden xl:flex flex-col items-start leading-none">
                <span className="text-[11px] font-semibold">
                  {botStatus.isOnline ? (botStatus.username || 'Discord Conectado') : 'Discord Offline'}
                </span>
                <span className="text-[9px] text-zinc-400 truncate max-w-[120px]">
                  {botStatus.isOnline
                    ? (botStatus.connectedVoiceChannel ? botStatus.connectedVoiceChannel.name : 'Sem Voz')
                    : 'Modo Local'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Audio Mixer Studio Modal */}
      <AudioMixerModal isOpen={isMixerOpen} onClose={() => setIsMixerOpen(false)} />
    </>
  );
};

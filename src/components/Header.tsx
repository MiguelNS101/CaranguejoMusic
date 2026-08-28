import React from 'react';
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
  HardDrive
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

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
  const { botStatus, volume, setVolume, isMuted, toggleMute, currentTrack, playbackState } = useAudio();

  return (
    <header className="sticky top-0 z-40 bg-[#141619]/90 backdrop-blur-md border-b border-[#2D3139] px-4 lg:px-6 py-3 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Brand & Bot Status */}
        <div className="flex items-center justify-between w-full md:w-auto gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-indigo-600 to-amber-500 p-0.5 shadow-md shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-[#0F1113] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-wide text-[#FFFFFF] font-rpg">
                  CaranguejoRPG
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Escudo do Mestre
                </span>
              </div>
              <p className="text-xs text-[#9E9E9E]">
                Bot Discord + Painel de Áudio & NPCs Local
              </p>
            </div>
          </div>

          {/* Quick Bot Status Indicator (Mobile friendly) */}
          <button
            onClick={onOpenDiscordModal}
            className={`flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
              botStatus.isOnline
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                : 'bg-[#1A1D21] text-[#9E9E9E] border-[#2D3139] hover:border-[#363B44]'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
            {botStatus.isOnline ? 'Discord Online' : 'Modo Local'}
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 md:pb-0 scrollbar-none">
          <button
            id="tab-master-screen"
            onClick={() => setCurrentTab('master')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'master'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#1A1D21]'
            }`}
          >
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            Escudo do Mestre
          </button>

          <button
            id="tab-music"
            onClick={() => setCurrentTab('music')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'music'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#1A1D21]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Músicas & Fila
            {playbackState === 'playing' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            )}
          </button>

          <button
            id="tab-soundboard"
            onClick={() => setCurrentTab('soundboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'soundboard'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#1A1D21]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Soundboard
          </button>

          <button
            id="tab-npcs"
            onClick={() => setCurrentTab('npcs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'npcs'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#1A1D21]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            NPCs & Retratos
          </button>

          <button
            id="tab-chat"
            onClick={() => setCurrentTab('chat')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
              currentTab === 'chat'
                ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#1A1D21]'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat Discord
          </button>

          <button
            id="tab-folders"
            onClick={onOpenFolderModal}
            title="Gerenciador de Pastas"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#1A1D21] transition-colors whitespace-nowrap"
          >
            <FolderOpen className="w-3.5 h-3.5 text-[#9E9E9E]" />
            Pastas
          </button>

          <button
            id="tab-saves"
            onClick={onOpenSessionModal}
            title="Sessões Salvas & Saves da Mesa"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 transition-colors whitespace-nowrap"
          >
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            Saves & Sessões
          </button>
        </nav>

        {/* Global Controls & Bot Indicator */}
        <div className="hidden md:flex items-center gap-3">
          {/* Master Volume */}
          <div className="flex items-center gap-2 bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-1.5 shadow-sm">
            <button
              onClick={toggleMute}
              className="text-[#9E9E9E] hover:text-[#FFFFFF] transition-colors"
              title={isMuted ? 'Desmutar' : 'Mutar'}
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-400" />
              ) : (
                <Volume2 className="w-4 h-4 text-zinc-300" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 h-1.5 bg-[#2D3139] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              title={`Volume Geral: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
            />
            <span className="text-[11px] font-mono text-[#9E9E9E] w-8 text-right">
              {Math.round((isMuted ? 0 : volume) * 100)}%
            </span>
          </div>

          {/* Discord Status Button */}
          <button
            id="btn-discord-status-modal"
            onClick={onOpenDiscordModal}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
              botStatus.isOnline
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/40 shadow-sm shadow-emerald-500/10'
                : 'bg-[#1A1D21] text-[#E0E0E0] border-[#2D3139] hover:border-[#363B44] hover:bg-[#22262B]'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bot className="w-4 h-4 text-indigo-400" />
              <span
                className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                  botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-amber-500'
                }`}
              />
            </div>
            <div className="flex flex-col items-start leading-none">
              <span className="text-[11px] font-semibold">
                {botStatus.isOnline ? (botStatus.username || 'Bot Online') : 'Discord Desconectado'}
              </span>
              <span className="text-[9px] text-[#9E9E9E]">
                {botStatus.isOnline
                  ? (botStatus.connectedVoiceChannel ? `Voz: ${botStatus.connectedVoiceChannel.name}` : 'Aguardando Canal de Voz')
                  : 'Modo Local (Clique para configurar)'}
              </span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

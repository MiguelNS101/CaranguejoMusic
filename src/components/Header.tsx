import React, { useState } from 'react';
import {
  Bot,
  Sparkles,
  Music,
  Users,
  MessageSquare,
  Shield,
  ChevronDown,
  CloudRain,
  Image as ImageIcon
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { AudioMixerModal } from './AudioMixerModal';
import { ConfigurationModal } from './ConfigurationModal';
import { PresetManagerModal } from './PresetManagerModal';

interface HeaderProps {
  currentTab: 'master' | 'music' | 'ambience' | 'soundboard' | 'npcs' | 'chat' | 'settings';
  setCurrentTab: (tab: 'master' | 'music' | 'ambience' | 'soundboard' | 'npcs' | 'chat' | 'settings') => void;
  onOpenDiscordModal: () => void;
  onOpenFolderModal: () => void;
  onOpenSessionModal: () => void;
  onOpenTutorialModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenPresetModal?: (initialTab?: 'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'json') => void;
  onOpenConfigModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenDiscordModal,
  onOpenFolderModal,
  onOpenSessionModal,
  onOpenTutorialModal,
  onOpenThemeModal,
  onOpenPresetModal,
  onOpenConfigModal
}) => {
  const {
    botStatus,
    playbackState,
    ambiencePlaybackState,
    activeSfxIds
  } = useAudio();

  const [isInternalConfigOpen, setIsInternalConfigOpen] = useState(false);
  const [isInternalMixerOpen, setIsInternalMixerOpen] = useState(false);
  const [isInternalPresetOpen, setIsInternalPresetOpen] = useState(false);
  const [internalPresetTab, setInternalPresetTab] = useState<'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'json'>('encounters');

  const handleOpenConfig = () => {
    if (onOpenConfigModal) {
      onOpenConfigModal();
    } else {
      setIsInternalConfigOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#121417]/95 backdrop-blur-md border-b border-[#282C34] px-3 sm:px-5 py-2.5 transition-colors shadow-lg shadow-black/30">
        <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between gap-2 sm:gap-4">
          {/* Brand & Logo */}
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
                  <span
                    className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md border"
                    style={{
                      backgroundColor: 'var(--rpg-accent-muted)',
                      color: 'var(--rpg-accent-primary)',
                      borderColor: 'var(--rpg-accent-primary)'
                    }}
                  >
                    Mesa
                  </span>
                </div>
                <p className="text-[10px] text-zinc-400 leading-none mt-0.5">
                  Bot Discord & Painel do Mestre
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Tabs - Only 6 core buttons: Escudo do Mestre, Músicas, Ambientação, Soundboard, NPCs, Chat */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-1 sm:px-2">
            <nav className="flex items-center justify-center gap-1 sm:gap-1.5 md:gap-2 py-1 px-1.5 sm:px-2 rounded-2xl bg-[#16181D]/90 border border-[#2D3139] shadow-inner max-w-full">
              {/* Escudo do Mestre */}
              <button
                id="tab-master-screen"
                onClick={() => setCurrentTab('master')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'master'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Escudo do Mestre</span>
              </button>

              {/* Músicas */}
              <button
                id="tab-music"
                onClick={() => setCurrentTab('music')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'music'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Music className="w-4 h-4 text-amber-400 shrink-0" />
                <span>Músicas</span>
                {playbackState === 'playing' && (
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse shrink-0" />
                )}
              </button>

              {/* Ambientação */}
              <button
                id="tab-ambience"
                onClick={() => setCurrentTab('ambience')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'ambience'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <CloudRain className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Ambientação</span>
                {ambiencePlaybackState === 'playing' && (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                )}
              </button>

              {/* Soundboard */}
              <button
                id="tab-soundboard"
                onClick={() => setCurrentTab('soundboard')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'soundboard'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Soundboard</span>
                {activeSfxIds.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 shrink-0">
                    {activeSfxIds.length}
                  </span>
                )}
              </button>

              {/* Imagens (NPCs e Gerais) */}
              <button
                id="tab-npcs"
                onClick={() => setCurrentTab('npcs')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'npcs'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>Imagens</span>
              </button>

              {/* Chat */}
              <button
                id="tab-chat"
                onClick={() => setCurrentTab('chat')}
                className={`shrink-0 flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  currentTab === 'chat'
                    ? 'bg-indigo-600/35 text-indigo-100 border border-indigo-500/60 shadow-md shadow-indigo-500/25 font-bold'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/70'
                }`}
              >
                <MessageSquare className="w-4 h-4 text-violet-400 shrink-0" />
                <span>Chat</span>
              </button>
            </nav>
          </div>

          {/* Right Controls: Unified Configuration Button with Bot Status Icon */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-open-configuration-tab"
              onClick={handleOpenConfig}
              className={`flex items-center gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
                botStatus.isOnline
                  ? 'bg-emerald-950/30 text-emerald-200 border-emerald-500/40 hover:bg-emerald-900/40 hover:border-emerald-400 shadow-emerald-500/10'
                  : 'bg-[#181B20] text-zinc-200 border-[#282C34] hover:border-indigo-500/50 hover:bg-[#20242B]'
              }`}
              title="Painel de Configuração (Pastas, Saves, Discord Bot, Áudio Mixer, Guia, Temas & Predefinições)"
            >
              {/* Bot status icon with pulsing indicator */}
              <div className="relative flex items-center justify-center">
                <Bot className="w-4 h-4 text-indigo-400" />
                <span
                  className={`absolute -top-1 -right-1 w-2 h-2 rounded-full ${
                    botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                  }`}
                />
              </div>

              <div className="flex flex-col items-start leading-tight">
                <span className="text-xs font-bold text-white flex items-center gap-1">
                  Configurações
                  <ChevronDown className="w-3 h-3 text-zinc-400" />
                </span>
                <span className="text-[10px] text-zinc-400 truncate max-w-[110px] font-normal hidden sm:inline">
                  {botStatus.isOnline ? (botStatus.username || 'Discord Online') : 'Discord Offline'}
                </span>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Internal Configuration Modal */}
      <ConfigurationModal
        isOpen={isInternalConfigOpen}
        onClose={() => setIsInternalConfigOpen(false)}
        onOpenDiscordSetup={() => {
          setIsInternalConfigOpen(false);
          onOpenDiscordModal();
        }}
        onOpenMixerModal={() => {
          setIsInternalConfigOpen(false);
          setIsInternalMixerOpen(true);
        }}
        onOpenThemeModal={() => {
          setIsInternalConfigOpen(false);
          if (onOpenThemeModal) onOpenThemeModal();
        }}
        onOpenTutorialModal={() => {
          setIsInternalConfigOpen(false);
          if (onOpenTutorialModal) onOpenTutorialModal();
        }}
        onOpenPresetModal={(tab) => {
          setIsInternalConfigOpen(false);
          if (onOpenPresetModal) {
            onOpenPresetModal(tab);
          } else {
            setInternalPresetTab(tab || 'encounters');
            setIsInternalPresetOpen(true);
          }
        }}
        onOpenFolderModal={() => {
          setIsInternalConfigOpen(false);
          onOpenFolderModal();
        }}
        onOpenSessionModal={() => {
          setIsInternalConfigOpen(false);
          onOpenSessionModal();
        }}
      />

      {/* Audio Mixer Studio Modal */}
      <AudioMixerModal isOpen={isInternalMixerOpen} onClose={() => setIsInternalMixerOpen(false)} />

      {/* Preset Manager Modal fallback */}
      <PresetManagerModal
        isOpen={isInternalPresetOpen}
        onClose={() => setIsInternalPresetOpen(false)}
        initialTab={internalPresetTab}
      />
    </>
  );
};

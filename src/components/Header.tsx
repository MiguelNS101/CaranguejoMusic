import React, { useState } from 'react';
import {
  Bot,
  Music,
  Users,
  MessageSquare,
  Shield,
  CloudRain,
  Image as ImageIcon,
  Compass,
  Save,
  FolderOpen,
  Settings,
  Sparkles
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { AudioMixerModal } from './AudioMixerModal';
import { ConfigurationModal } from './ConfigurationModal';
import { PresetManagerModal } from './PresetManagerModal';
import { Button } from './Button';

interface HeaderProps {
  currentTab: 'master' | 'maps' | 'audio' | 'music' | 'ambience' | 'soundboard' | 'npcs' | 'images' | 'chat' | 'settings';
  setCurrentTab: (tab: 'master' | 'maps' | 'audio' | 'music' | 'ambience' | 'soundboard' | 'npcs' | 'images' | 'chat' | 'settings') => void;
  onOpenDiscordModal: () => void;
  onOpenFolderModal: () => void;
  onOpenSessionModal: () => void;
  onOpenTutorialModal?: () => void;
  onOpenThemeModal?: () => void;
  onOpenPresetModal?: (initialTab?: 'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'diceSounds' | 'json') => void;
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
  const [internalPresetTab, setInternalPresetTab] = useState<'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'diceSounds' | 'json'>('encounters');

  const handleOpenConfig = () => {
    if (onOpenConfigModal) {
      onOpenConfigModal();
    } else {
      setIsInternalConfigOpen(true);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#121417]/95 backdrop-blur-md border-b border-[#282C34] px-2 sm:px-4 py-2 transition-colors shadow-lg shadow-black/30">
        <div className="w-full max-w-[1700px] mx-auto flex items-center justify-between gap-1.5 sm:gap-3">
          {/* Brand & Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-amber-500/20 via-orange-500/20 to-red-500/20 border border-orange-500/30 p-1 shadow-md shadow-orange-500/10 flex items-center justify-center shrink-0">
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
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs sm:text-sm font-bold tracking-wide text-white font-rpg leading-tight">
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
              <p className="text-[10px] text-zinc-400 leading-none mt-0.5 hidden md:block">
                Bot Discord & Painel do Mestre
              </p>
            </div>
          </div>

          {/* Navigation Tabs - 6 Core Modules with Unified Audio */}
          <div className="flex-1 min-w-0 flex items-center justify-center px-1">
            <nav className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-2xl bg-[#14171D]/90 border border-[#262A33] shadow-inner shadow-black/40 overflow-x-auto scrollbar-none max-w-full touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Escudo do Mestre */}
              <Button
                id="tab-master-screen"
                variant="tab"
                size="sm"
                isActive={currentTab === 'master'}
                onClick={() => setCurrentTab('master')}
                icon={<Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0" />}
                title="Escudo do Mestre: Iniciativa, Anotações, Dados e Resumo da Sessão"
              >
                <span className="hidden xl:inline">Escudo do </span>
                <span>Mestre</span>
              </Button>

              {/* Cenários & Mapas */}
              <Button
                id="tab-maps"
                variant="tab"
                size="sm"
                isActive={currentTab === 'maps'}
                onClick={() => setCurrentTab('maps')}
                icon={<Compass className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                title="Cenários & Mapas Interativos com Marcadores e Transmissão para Discord"
              >
                <span>Mapas</span>
              </Button>

              {/* Central de Áudio (Músicas, Ambiente e Soundboard unificados) */}
              <Button
                id="tab-audio"
                variant="tab"
                size="sm"
                isActive={currentTab === 'audio' || currentTab === 'music' || currentTab === 'ambience' || currentTab === 'soundboard'}
                onClick={() => setCurrentTab('audio')}
                icon={<Music className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                title="Central de Áudio: Músicas, Ambientação e Soundboard em 3 sub-abas"
              >
                <span>Áudio</span>
                {(playbackState === 'playing' || ambiencePlaybackState === 'playing' || activeSfxIds.length > 0) && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
                )}
              </Button>

              {/* NPCs & Criaturas */}
              <Button
                id="tab-npcs"
                variant="tab"
                size="sm"
                isActive={currentTab === 'npcs'}
                onClick={() => setCurrentTab('npcs')}
                icon={<Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />}
                title="Catálogo de NPCs, Monstros, Fichas de Combate e Segredos do Mestre"
              >
                <span>NPCs</span>
              </Button>

              {/* Imagens & Paint */}
              <Button
                id="tab-images"
                variant="tab"
                size="sm"
                isActive={currentTab === 'images'}
                onClick={() => setCurrentTab('images')}
                icon={<ImageIcon className="w-3.5 h-3.5 text-cyan-400 shrink-0" />}
                title="Galeria de Imagens de Cenário, Pistas e Estúdio de Desenho & Paint"
              >
                <span>Imagens</span>
              </Button>

              {/* Chat Discord */}
              <Button
                id="tab-chat"
                variant="tab"
                size="sm"
                isActive={currentTab === 'chat'}
                onClick={() => setCurrentTab('chat')}
                icon={<MessageSquare className="w-3.5 h-3.5 text-violet-400 shrink-0" />}
                title="Chat Discord ao Vivo e Mensageiro do Mestre"
              >
                <span>Chat</span>
              </Button>
            </nav>
          </div>

          {/* Right Action Buttons - Unified Button Component */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Discord Bot Button */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenDiscordModal}
              icon={
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                    }`}
                  />
                  <Bot className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                </div>
              }
              title={botStatus.isOnline ? `Discord Bot Online (${botStatus.username || 'Conectado'}) - Clique para Gerenciar` : 'Configurar Bot Discord'}
            >
              <span className="hidden md:inline">
                {botStatus.isOnline ? 'Discord' : 'Conectar Bot'}
              </span>
            </Button>

            {/* Sessão & Saves */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenSessionModal}
              icon={<Save className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
              title="Gerenciador de Saves, Carregamento de Sessão e Backup"
            >
              <span className="hidden md:inline">Sessão</span>
            </Button>

            {/* Pastas de Mídia */}
            <Button
              variant="secondary"
              size="sm"
              onClick={onOpenFolderModal}
              icon={<FolderOpen className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
              title="Gerenciador de Pastas de Mídia e Categorias"
            >
              <span className="hidden md:inline">Pastas</span>
            </Button>

            {/* Configurações Gerais */}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleOpenConfig}
              icon={<Settings className="w-3.5 h-3.5 text-zinc-400 shrink-0" />}
              title="Painel de Configuração (Mixer de Áudio, Guia, Temas & Predefinições)"
            >
              <span className="hidden md:inline">Config</span>
            </Button>
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

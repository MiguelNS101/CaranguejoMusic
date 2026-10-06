import React, { useState, useEffect } from 'react';
import { AudioProvider } from './context/AudioContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { MasterScreen } from './components/MasterScreen';
import { ScenarioMapManager } from './components/ScenarioMapManager';
import { AudioUnifiedView } from './components/AudioUnifiedView';
import { MusicPlayerView } from './components/MusicPlayerView';
import { AmbiencePlayerView } from './components/AmbiencePlayerView';
import { SoundboardView } from './components/SoundboardView';
import { NpcView } from './components/NpcView';
import { ChatMessengerView } from './components/ChatMessengerView';
import { DiscordSetupModal } from './components/DiscordSetupModal';
import { FolderManagerModal } from './components/FolderManagerModal';
import { SessionManagerModal } from './components/SessionManagerModal';
import { AppTutorialModal } from './components/AppTutorialModal';
import { ThemeCustomizerModal } from './components/ThemeCustomizerModal';
import { PresetManagerModal } from './components/PresetManagerModal';
import { ConfigurationModal } from './components/ConfigurationModal';
import { AudioMixerModal } from './components/AudioMixerModal';
import { MasterSessionPdfExportModal } from './components/MasterSessionPdfExportModal';
import { ActionLogFooter } from './components/ActionLogFooter';
import { Button } from './components/Button';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'master' | 'maps' | 'audio' | 'music' | 'ambience' | 'soundboard' | 'npcs' | 'images' | 'chat' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_active_tab');
      if (saved && ['master', 'maps', 'audio', 'music', 'ambience', 'soundboard', 'npcs', 'images', 'chat', 'settings'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return 'master';
  });

  useEffect(() => {
    try {
      localStorage.setItem('caranguejo_active_tab', currentTab);
    } catch {}
  }, [currentTab]);

  const [isDiscordModalOpen, setIsDiscordModalOpen] = useState<boolean>(false);
  const [discordModalTab, setDiscordModalTab] = useState<'bot' | 'diagnostics' | 'guide' | 'docker' | 'portable'>('bot');
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isPdfExportModalOpen, setIsPdfExportModalOpen] = useState<boolean>(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [presetModalTab, setPresetModalTab] = useState<'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'diceSounds' | 'json'>('encounters');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isMixerModalOpen, setIsMixerModalOpen] = useState<boolean>(false);

  return (
    <ThemeProvider>
      <AudioProvider>
        <div
          className="min-h-screen flex flex-col antialiased transition-colors duration-200"
          style={{
            backgroundColor: 'var(--rpg-bg-primary)',
            color: 'var(--rpg-text-primary)'
          }}
        >
          
          {/* Header Bar */}
          <Header
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            onOpenDiscordModal={() => setIsDiscordModalOpen(true)}
            onOpenFolderModal={() => setIsFolderModalOpen(true)}
            onOpenSessionModal={() => setIsSessionModalOpen(true)}
            onOpenTutorialModal={() => setIsTutorialModalOpen(true)}
            onOpenThemeModal={() => setIsThemeModalOpen(true)}
            onOpenPresetModal={(tab) => {
              setPresetModalTab(tab || 'encounters');
              setIsPresetModalOpen(true);
            }}
            onOpenConfigModal={() => setIsConfigModalOpen(true)}
          />

          {/* Main Content Area */}
          <main className="flex-1 px-4 lg:px-8 pt-6">
            {currentTab === 'master' && (
              <MasterScreen
                onOpenMusicTab={() => setCurrentTab('music')}
                onOpenAmbienceTab={() => setCurrentTab('ambience')}
                onOpenSoundboardTab={() => setCurrentTab('soundboard')}
                onOpenNpcTab={() => setCurrentTab('npcs')}
                onOpenChatTab={() => setCurrentTab('chat')}
                onOpenSessionModal={() => setIsSessionModalOpen(true)}
                onOpenPdfExportModal={() => setIsPdfExportModalOpen(true)}
              />
            )}

            {currentTab === 'maps' && (
              <div className="max-w-7xl mx-auto space-y-4">
                <div className="flex items-center justify-between border-b border-[#282C34] pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white font-rpg flex items-center gap-2">
                      <span>🗺️</span>
                      <span>Módulo de Gerenciamento de Cenários & Mapas</span>
                    </h2>
                    <p className="text-xs text-zinc-400">
                      Upload e links de mapas, pontos de interesse interativos, NPCs vinculados e exibição no Discord.
                    </p>
                  </div>
                </div>
                <ScenarioMapManager isWidgetMode={false} />
              </div>
            )}

            {(currentTab === 'audio' || currentTab === 'music' || currentTab === 'ambience' || currentTab === 'soundboard') && (
              <AudioUnifiedView
                initialSubTab={
                  currentTab === 'ambience'
                    ? 'ambience'
                    : currentTab === 'soundboard'
                    ? 'soundboard'
                    : 'music'
                }
                onSubTabChange={(tab) => setCurrentTab(tab)}
              />
            )}
 
            <div className={currentTab === 'npcs' ? 'block' : 'hidden'}>
              <NpcView mode="npcs" />
            </div>

            <div className={currentTab === 'images' ? 'block' : 'hidden'}>
              <NpcView mode="images" />
            </div>

            {currentTab === 'chat' && <ChatMessengerView />}

            {currentTab === 'settings' && (
              <div className="max-w-4xl mx-auto py-8">
                <div className="p-8 rounded-3xl bg-[#16181D] border border-[#2D3139] shadow-xl text-center space-y-4">
                  <h2 className="text-xl font-bold text-white font-rpg">Central de Configurações da Mesa</h2>
                  <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                    Gerencie o bot do Discord, áudio mixer, customização visual com CSS, guias e predefinições.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => setIsDiscordModalOpen(true)}
                    >
                      Discord Bot & Docker
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsMixerModalOpen(true)}
                    >
                      Mixer de Áudio
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsThemeModalOpen(true)}
                    >
                      Temas & CSS
                    </Button>
                    <Button
                      variant="warning"
                      size="sm"
                      onClick={() => setIsPresetModalOpen(true)}
                    >
                      Predefinições (JSON)
                    </Button>
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => setIsTutorialModalOpen(true)}
                    >
                      Manual & Guia
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Action Log Footer (Last 3 Actions History) */}
          <ActionLogFooter
            onOpenDiagnostics={() => {
              setDiscordModalTab('diagnostics');
              setIsDiscordModalOpen(true);
            }}
          />

          {/* Global Modals */}
          <ConfigurationModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onOpenDiscordSetup={() => {
              setIsConfigModalOpen(false);
              setDiscordModalTab('bot');
              setIsDiscordModalOpen(true);
            }}
            onOpenMixerModal={() => {
              setIsConfigModalOpen(false);
              setIsMixerModalOpen(true);
            }}
            onOpenThemeModal={() => {
              setIsConfigModalOpen(false);
              setIsThemeModalOpen(true);
            }}
            onOpenTutorialModal={() => {
              setIsConfigModalOpen(false);
              setIsTutorialModalOpen(true);
            }}
            onOpenPresetModal={(tab) => {
              setIsConfigModalOpen(false);
              setPresetModalTab(tab || 'encounters');
              setIsPresetModalOpen(true);
            }}
            onOpenFolderModal={() => {
              setIsConfigModalOpen(false);
              setIsFolderModalOpen(true);
            }}
            onOpenSessionModal={() => {
              setIsConfigModalOpen(false);
              setIsSessionModalOpen(true);
            }}
          />

          <AudioMixerModal
            isOpen={isMixerModalOpen}
            onClose={() => setIsMixerModalOpen(false)}
          />

          <PresetManagerModal
            isOpen={isPresetModalOpen}
            onClose={() => setIsPresetModalOpen(false)}
            initialTab={presetModalTab}
          />

          <DiscordSetupModal
            isOpen={isDiscordModalOpen}
            onClose={() => setIsDiscordModalOpen(false)}
            initialTab={discordModalTab}
          />

          <FolderManagerModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
          />

          <SessionManagerModal
            isOpen={isSessionModalOpen}
            onClose={() => setIsSessionModalOpen(false)}
            onOpenPdfExportModal={() => setIsPdfExportModalOpen(true)}
          />

          <MasterSessionPdfExportModal
            isOpen={isPdfExportModalOpen}
            onClose={() => setIsPdfExportModalOpen(false)}
          />

          <AppTutorialModal
            isOpen={isTutorialModalOpen}
            onClose={() => setIsTutorialModalOpen(false)}
            onOpenDiscordConfig={() => setIsDiscordModalOpen(true)}
            onOpenFolderImport={() => setIsFolderModalOpen(true)}
          />

          <ThemeCustomizerModal
            isOpen={isThemeModalOpen}
            onClose={() => setIsThemeModalOpen(false)}
          />

        </div>
      </AudioProvider>
    </ThemeProvider>
  );
}

import React, { useState, useEffect } from 'react';
import { AudioProvider } from './context/AudioContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { MasterScreen } from './components/MasterScreen';
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

export default function App() {
  const [currentTab, setCurrentTab] = useState<'master' | 'music' | 'ambience' | 'soundboard' | 'npcs' | 'chat' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_active_tab');
      if (saved && ['master', 'music', 'ambience', 'soundboard', 'npcs', 'chat', 'settings'].includes(saved)) {
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
  const [isFolderModalOpen, setIsFolderModalOpen] = useState<boolean>(false);
  const [isSessionModalOpen, setIsSessionModalOpen] = useState<boolean>(false);
  const [isTutorialModalOpen, setIsTutorialModalOpen] = useState<boolean>(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState<boolean>(false);
  const [isPresetModalOpen, setIsPresetModalOpen] = useState<boolean>(false);
  const [presetModalTab, setPresetModalTab] = useState<'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'json'>('encounters');
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
                onOpenSoundboardTab={() => setCurrentTab('soundboard')}
                onOpenNpcTab={() => setCurrentTab('npcs')}
                onOpenChatTab={() => setCurrentTab('chat')}
                onOpenSessionModal={() => setIsSessionModalOpen(true)}
              />
            )}

            {currentTab === 'music' && <MusicPlayerView />}

            {currentTab === 'ambience' && <AmbiencePlayerView />}

            {currentTab === 'soundboard' && <SoundboardView />}

            {currentTab === 'npcs' && <NpcView />}

            {currentTab === 'chat' && <ChatMessengerView />}

            {currentTab === 'settings' && (
              <div className="max-w-4xl mx-auto py-8">
                <div className="p-8 rounded-3xl bg-[#16181D] border border-[#2D3139] shadow-xl text-center space-y-4">
                  <h2 className="text-xl font-bold text-white font-rpg">Central de Configurações da Mesa</h2>
                  <p className="text-sm text-zinc-400 max-w-xl mx-auto">
                    Gerencie o bot do Discord, áudio mixer, customização visual com CSS, guias e predefinições.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                    <button
                      onClick={() => setIsDiscordModalOpen(true)}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Discord Bot & Docker
                    </button>
                    <button
                      onClick={() => setIsMixerModalOpen(true)}
                      className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-bold transition-all border border-zinc-700"
                    >
                      Mixer de Áudio
                    </button>
                    <button
                      onClick={() => setIsThemeModalOpen(true)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Temas & CSS
                    </button>
                    <button
                      onClick={() => setIsPresetModalOpen(true)}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Predefinições (JSON)
                    </button>
                    <button
                      onClick={() => setIsTutorialModalOpen(true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow"
                    >
                      Manual & Guia
                    </button>
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Global Modals */}
          <ConfigurationModal
            isOpen={isConfigModalOpen}
            onClose={() => setIsConfigModalOpen(false)}
            onOpenDiscordSetup={() => {
              setIsConfigModalOpen(false);
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
          />

          <FolderManagerModal
            isOpen={isFolderModalOpen}
            onClose={() => setIsFolderModalOpen(false)}
          />

          <SessionManagerModal
            isOpen={isSessionModalOpen}
            onClose={() => setIsSessionModalOpen(false)}
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

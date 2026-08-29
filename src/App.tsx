import React, { useState, useEffect } from 'react';
import { AudioProvider } from './context/AudioContext';
import { Header } from './components/Header';
import { MasterScreen } from './components/MasterScreen';
import { MusicPlayerView } from './components/MusicPlayerView';
import { SoundboardView } from './components/SoundboardView';
import { NpcView } from './components/NpcView';
import { ChatMessengerView } from './components/ChatMessengerView';
import { DiscordSetupModal } from './components/DiscordSetupModal';
import { FolderManagerModal } from './components/FolderManagerModal';
import { SessionManagerModal } from './components/SessionManagerModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'master' | 'music' | 'soundboard' | 'npcs' | 'chat' | 'settings'>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_active_tab');
      if (saved && ['master', 'music', 'soundboard', 'npcs', 'chat', 'settings'].includes(saved)) {
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

  return (
    <AudioProvider>
      <div className="min-h-screen bg-[#0F1113] text-[#E0E0E0] flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200 antialiased">
        
        {/* Header Bar */}
        <Header
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          onOpenDiscordModal={() => setIsDiscordModalOpen(true)}
          onOpenFolderModal={() => setIsFolderModalOpen(true)}
          onOpenSessionModal={() => setIsSessionModalOpen(true)}
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

          {currentTab === 'soundboard' && <SoundboardView />}

          {currentTab === 'npcs' && <NpcView />}

          {currentTab === 'chat' && <ChatMessengerView />}
        </main>

        {/* Global Modals */}
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

      </div>
    </AudioProvider>
  );
}

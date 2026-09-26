import React, { useState, useEffect } from 'react';
import { Music, CloudRain, Sparkles, Volume2 } from 'lucide-react';
import { MusicPlayerView } from './MusicPlayerView';
import { AmbiencePlayerView } from './AmbiencePlayerView';
import { SoundboardView } from './SoundboardView';
import { useAudio } from '../context/AudioContext';
import { Button } from './Button';

interface AudioUnifiedViewProps {
  initialSubTab?: 'music' | 'ambience' | 'soundboard';
  onSubTabChange?: (tab: 'music' | 'ambience' | 'soundboard') => void;
}

export const AudioUnifiedView: React.FC<AudioUnifiedViewProps> = ({
  initialSubTab = 'music',
  onSubTabChange
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'music' | 'ambience' | 'soundboard'>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_audio_subtab');
      if (saved && ['music', 'ambience', 'soundboard'].includes(saved)) {
        return saved as any;
      }
    } catch {}
    return initialSubTab;
  });

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  const {
    playbackState,
    ambiencePlaybackState,
    activeSfxIds
  } = useAudio();

  const handleSelectTab = (tab: 'music' | 'ambience' | 'soundboard') => {
    setActiveSubTab(tab);
    if (onSubTabChange) onSubTabChange(tab);
    try {
      localStorage.setItem('caranguejo_audio_subtab', tab);
    } catch {}
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Unified Audio Header & Navigation Subtabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#282C34] pb-3">
        <div>
          <h2 className="text-lg font-bold text-white font-rpg flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-indigo-400" />
            <span>Central de Áudio & Trilha Sonora</span>
          </h2>
          <p className="text-xs text-zinc-400">
            Controle de Músicas da campanha, Clima & Ambientação contínua e Efeitos sonoros (Soundboard).
          </p>
        </div>

        {/* Subtab Selector using unified Button component */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#14171D] border border-[#282C34] shadow-inner">
          {/* Músicas */}
          <Button
            variant={activeSubTab === 'music' ? 'tab' : 'ghost'}
            size="sm"
            isActive={activeSubTab === 'music'}
            onClick={() => handleSelectTab('music')}
            icon={<Music className={`w-3.5 h-3.5 ${activeSubTab === 'music' ? 'text-amber-300' : 'text-amber-400'}`} />}
          >
            <span>Músicas</span>
            {playbackState === 'playing' && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse ml-0.5" />
            )}
          </Button>

          {/* Ambiente */}
          <Button
            variant={activeSubTab === 'ambience' ? 'tab' : 'ghost'}
            size="sm"
            isActive={activeSubTab === 'ambience'}
            onClick={() => handleSelectTab('ambience')}
            icon={<CloudRain className={`w-3.5 h-3.5 ${activeSubTab === 'ambience' ? 'text-sky-300' : 'text-sky-400'}`} />}
          >
            <span>Ambiente</span>
            {ambiencePlaybackState === 'playing' && (
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse ml-0.5" />
            )}
          </Button>

          {/* Soundboard */}
          <Button
            variant={activeSubTab === 'soundboard' ? 'tab' : 'ghost'}
            size="sm"
            isActive={activeSubTab === 'soundboard'}
            onClick={() => handleSelectTab('soundboard')}
            icon={<Sparkles className={`w-3.5 h-3.5 ${activeSubTab === 'soundboard' ? 'text-yellow-300' : 'text-yellow-400'}`} />}
          >
            <span>Soundboard</span>
            {activeSfxIds.length > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-yellow-400/20 text-yellow-300 border border-yellow-400/30 ml-0.5">
                {activeSfxIds.length}
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Subtab Contents */}
      {activeSubTab === 'music' && <MusicPlayerView />}
      {activeSubTab === 'ambience' && <AmbiencePlayerView />}
      {activeSubTab === 'soundboard' && <SoundboardView />}
    </div>
  );
};

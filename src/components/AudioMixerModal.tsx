import React from 'react';
import {
  Volume2,
  VolumeX,
  Music,
  Sparkles,
  Sliders,
  X,
  Headphones,
  Radio,
  Check,
  RotateCcw,
  Zap,
  Volume1,
  Mic,
  Wind,
  CloudRain
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface AudioMixerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioMixerModal: React.FC<AudioMixerModalProps> = ({ isOpen, onClose }) => {
  const {
    volume,
    setVolume,
    musicVolume,
    setMusicVolume,
    ambienceVolume,
    setAmbienceVolume,
    sfxVolume,
    setSfxVolume,
    isMuted,
    toggleMute,
    isMusicMuted,
    toggleMusicMute,
    isAmbienceMuted,
    toggleAmbienceMute,
    isSfxMuted,
    toggleSfxMute,
    effectiveMusicVolume,
    setAudioMix,
    isLocalAudioEnabled,
    toggleLocalAudio,
    currentTrack,
    playbackState,
    currentAmbienceTrack,
    ambiencePlaybackState,
    botStatus,
    activeSfxIds
  } = useAudio();

  if (!isOpen) return null;

  const presets = [
    {
      name: 'Equilibrado',
      desc: 'Música, ambiente e efeitos claros',
      icon: '⚖️',
      master: 0.8,
      music: 0.7,
      ambience: 0.75,
      sfx: 0.9
    },
    {
      name: 'Cinema & Ação',
      desc: 'Imersão alta, batidas e efeitos estrondosos',
      icon: '🎬',
      master: 1.0,
      music: 0.85,
      ambience: 0.6,
      sfx: 1.0
    },
    {
      name: 'Foco na Voz / Mesa',
      desc: 'Música suave para não atrapalhar a fala',
      icon: '🗣️',
      master: 0.7,
      music: 0.35,
      ambience: 0.45,
      sfx: 0.7
    },
    {
      name: 'Sussurro / Mistério',
      desc: 'Ambiente de chuva/vento com trilha mínima',
      icon: '🤫',
      master: 0.5,
      music: 0.2,
      ambience: 0.8,
      sfx: 0.4
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        id="audio-mixer-modal"
        className="bg-[#141619] border border-[#2D3139] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2D3139] flex items-center justify-between bg-[#1A1D21]/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Mixer de Áudio da Mesa
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Estúdio RPG
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Ajuste os canais de Música, Ambientação Contínua, SFX e Áudio Local
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-lg hover:bg-[#22262B] transition-colors"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6">
          {/* Master Channel */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Volume Geral (Master)</h4>
                  <p className="text-[11px] text-zinc-400">Controla o nível final de todas as saídas de som</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={toggleMute}
                  className={`p-1.5 rounded-lg border transition-all ${
                    isMuted
                      ? 'bg-rose-950/40 text-rose-300 border-rose-500/30 hover:bg-rose-900/40'
                      : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white hover:bg-zinc-700'
                  }`}
                  title={isMuted ? 'Desmutar Geral' : 'Mutar Geral'}
                >
                  {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <span className="text-xs font-mono font-bold text-indigo-300 w-10 text-right">
                  {Math.round((isMuted ? 0 : volume) * 100)}%
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Individual Channel Strips (3 Separated Tracks: Music, Ambience, SFX) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* Music Channel */}
            <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <Music className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Trilha Sonora</h4>
                    <p className="text-[10px] text-zinc-400">Músicas & Batalhas</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleMusicMute}
                    className={`p-1 rounded-md border transition-all ${
                      isMusicMuted
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                    }`}
                    title={isMusicMuted ? 'Desmutar Música' : 'Mutar Música'}
                  >
                    {isMusicMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[11px] font-mono font-bold text-amber-300 w-8 text-right">
                    {Math.round((isMusicMuted ? 0 : musicVolume) * 100)}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMusicMuted ? 0 : musicVolume}
                onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />

              <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                <span className={`w-2 h-2 rounded-full shrink-0 ${playbackState === 'playing' ? 'bg-amber-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="truncate">{currentTrack ? currentTrack.title : 'Nenhuma música'}</span>
              </div>
            </div>

            {/* Ambientation Channel */}
            <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center">
                    <CloudRain className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Ambientação</h4>
                    <p className="text-[10px] text-zinc-400">Chuva, Vento, Taverna</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleAmbienceMute}
                    className={`p-1 rounded-md border transition-all ${
                      isAmbienceMuted
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                    }`}
                    title={isAmbienceMuted ? 'Desmutar Ambientação' : 'Mutar Ambientação'}
                  >
                    {isAmbienceMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[11px] font-mono font-bold text-teal-300 w-8 text-right">
                    {Math.round((isAmbienceMuted ? 0 : ambienceVolume) * 100)}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isAmbienceMuted ? 0 : ambienceVolume}
                onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-teal-500"
              />

              <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                <span className={`w-2 h-2 rounded-full shrink-0 ${ambiencePlaybackState === 'playing' ? 'bg-teal-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="truncate">{currentAmbienceTrack ? currentAmbienceTrack.title : 'Nenhum ambiente'}</span>
              </div>
            </div>

            {/* SFX Channel */}
            <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-white">Efeitos (SFX)</h4>
                    <p className="text-[10px] text-zinc-400">Soundboard & Golpes</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={toggleSfxMute}
                    className={`p-1 rounded-md border transition-all ${
                      isSfxMuted
                        ? 'bg-rose-950/40 text-rose-300 border-rose-500/30'
                        : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:text-white'
                    }`}
                    title={isSfxMuted ? 'Desmutar Efeitos' : 'Mutar Efeitos'}
                  >
                    {isSfxMuted ? <VolumeX className="w-3.5 h-3.5 text-rose-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                  <span className="text-[11px] font-mono font-bold text-emerald-300 w-8 text-right">
                    {Math.round((isSfxMuted ? 0 : sfxVolume) * 100)}%
                  </span>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isSfxMuted ? 0 : sfxVolume}
                onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />

              <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1.5 pt-1 border-t border-zinc-800/80">
                <span className={`w-2 h-2 rounded-full shrink-0 ${activeSfxIds.length > 0 ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
                <span>{activeSfxIds.length > 0 ? `${activeSfxIds.length} efeito(s) ativo(s)` : 'Aguardando som'}</span>
              </div>
            </div>
          </div>

          {/* Quick Balance Presets */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Presets de Balanço Rápido da Mesa
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((p) => {
                const isActive =
                  Math.abs(volume - p.master) < 0.05 &&
                  Math.abs(musicVolume - p.music) < 0.05 &&
                  Math.abs(ambienceVolume - p.ambience) < 0.05 &&
                  Math.abs(sfxVolume - p.sfx) < 0.05;

                return (
                  <button
                    key={p.name}
                    onClick={() => setAudioMix(p.master, p.music, p.sfx, p.ambience)}
                    className={`p-2.5 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isActive
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                        : 'bg-[#1A1D21] border-[#2D3139] text-zinc-300 hover:border-zinc-600 hover:bg-[#22262B]'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{p.icon}</span>
                        {p.name}
                      </span>
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-1 line-clamp-1">{p.desc}</p>
                    <div className="flex items-center gap-2 mt-2 text-[9px] font-mono text-zinc-400">
                      <span>Mús: {Math.round(p.music * 100)}%</span>
                      <span>•</span>
                      <span>Amb: {Math.round(p.ambience * 100)}%</span>
                      <span>•</span>
                      <span>SFX: {Math.round(p.sfx * 100)}%</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Local Audio Output Switch */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isLocalAudioEnabled ? 'bg-cyan-500/20 text-cyan-300' : 'bg-zinc-800 text-zinc-500'}`}>
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-semibold text-white flex items-center gap-2">
                  Ouvir Áudio no Navegador (Local)
                  {isLocalAudioEnabled && (
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      ATIVO
                    </span>
                  )}
                </h4>
                <p className="text-[11px] text-zinc-400">
                  {isLocalAudioEnabled
                    ? 'Tocando no fone/caixa local E transmitindo para o Discord.'
                    : 'Apenas transmitindo para o canal de voz do Discord (sem eco local).'}
                </p>
              </div>
            </div>

            <button
              onClick={toggleLocalAudio}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isLocalAudioEnabled ? 'bg-cyan-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isLocalAudioEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#2D3139] bg-[#1A1D21]/80 flex items-center justify-between">
          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {botStatus.isOnline
                ? `Discord Conectado (${botStatus.connectedVoiceChannel?.name || 'Voz Pronta'})`
                : 'Discord Desconectado (Modo Somente Local)'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-sm shadow-indigo-600/20"
          >
            Concluir Ajustes
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  Upload,
  Search,
  Check,
  Radio,
  Clock,
  Layers,
  FolderUp,
  FolderPlus,
  ListPlus,
  Headphones,
  CloudRain,
  PhoneOff,
  SkipBack,
  SkipForward,
  Sparkles,
  Wind,
  Flame
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { AmbienceTrack } from '../types';
import { FolderImportModal } from './FolderImportModal';
import { FolderManagerModal } from './FolderManagerModal';
import { OnlineMediaModal } from './OnlineMediaModal';
import { AudioScrubber } from './AudioScrubber';
import { apiFetch, resolveApiUrl } from '../services/api';

export const AmbiencePlayerView: React.FC = () => {
  const {
    currentAmbienceTrack,
    ambiencePlaybackState,
    ambienceCurrentTime,
    ambienceDuration,
    ambienceVolume,
    setAmbienceVolume,
    isAmbienceMuted,
    toggleAmbienceMute,
    isLocalAudioEnabled,
    toggleLocalAudio,
    ambienceLoopMode,
    setAmbienceLoopMode,
    playAmbienceTrack,
    stopAmbienceTrack,
    toggleAmbiencePlayPause,
    seekAmbience,
    ambienceTracks,
    ambienceQueue,
    addToAmbienceQueue,
    removeFromAmbienceQueue,
    clearAmbienceQueue,
    folders,
    createAmbienceTrack,
    updateAmbienceTrack,
    deleteAmbienceTrack,
    botStatus,
    disconnectVoiceChannel
  } = useAudio();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isFolderImportOpen, setIsFolderImportOpen] = useState<boolean>(false);
  const [isFolderManagerOpen, setIsFolderManagerOpen] = useState<boolean>(false);
  const [isOnlineMediaOpen, setIsOnlineMediaOpen] = useState<boolean>(false);

  // New Track Form State
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [newIsLoop, setNewIsLoop] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const ambienceFolders = folders.filter(f => f.type === 'ambience');

  const filteredTracks = ambienceTracks.filter(track => {
    const matchesFolder = selectedFolderId === 'all' || track.folderId === selectedFolderId;
    const matchesSearch = searchQuery === '' ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      track.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const uploadAudioFile = async (file: File) => {
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/upload?type=ambience', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setNewUrl(data.url);
        if (!newTitle) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
          setNewTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    } catch (err) {
      console.error('Upload failed:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadAudioFile(file);
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const tagsArray = newTags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    await createAmbienceTrack({
      title: newTitle.trim(),
      url: newUrl.trim(),
      folderId: newFolderId || (ambienceFolders.length > 0 ? ambienceFolders[0].id : undefined),
      tags: tagsArray,
      isLoop: newIsLoop,
      coverUrl: newCoverUrl.trim() || undefined
    });

    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    setNewFolderId('');
    setNewTags('');
    setNewCoverUrl('');
    setNewIsLoop(true);
    setIsAddModalOpen(false);
  };

  const toggleLoop = () => {
    if (ambienceLoopMode === 'none' || !ambienceLoopMode) {
      setAmbienceLoopMode('track');
    } else {
      setAmbienceLoopMode('none');
    }
  };

  const skipNext = () => {
    if (filteredTracks.length === 0) return;
    const currentIndex = filteredTracks.findIndex(t => t.id === currentAmbienceTrack?.id);
    const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % filteredTracks.length;
    playAmbienceTrack(filteredTracks[nextIndex]);
  };

  const skipPrevious = () => {
    if (filteredTracks.length === 0) return;
    const currentIndex = filteredTracks.findIndex(t => t.id === currentAmbienceTrack?.id);
    const prevIndex = currentIndex <= 0 ? filteredTracks.length - 1 : currentIndex - 1;
    playAmbienceTrack(filteredTracks[prevIndex]);
  };

  const isPlaying = ambiencePlaybackState === 'playing';

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner Player (Harmonized with MusicPlayerView) */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Cover & Main Details */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#141619] shrink-0 border border-[#2D3139] shadow-lg">
              {currentAmbienceTrack?.coverUrl ? (
                <img
                  src={resolveApiUrl(currentAmbienceTrack.coverUrl)}
                  alt={currentAmbienceTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#141619] text-indigo-400">
                  <CloudRain className={`w-8 h-8 ${isPlaying ? 'animate-pulse' : ''}`} />
                </div>
              )}
              {isPlaying && (
                <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {isPlaying ? 'Ambiente Ativo' : ambiencePlaybackState === 'paused' ? 'Pausado' : 'Parado'}
                </span>
                {botStatus.isOnline ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    {botStatus.connectedVoiceChannel
                      ? `Voz: ${botStatus.connectedVoiceChannel.name}`
                      : 'Transmitindo no Discord Bot'}
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/30">
                    Discord Bot Offline
                  </span>
                )}

                {/* Disconnect Voice Channel Button */}
                {botStatus.connectedVoiceChannel && disconnectVoiceChannel && (
                  <button
                    type="button"
                    onClick={() => disconnectVoiceChannel()}
                    className="text-[10px] px-2.5 py-0.5 rounded-full border border-amber-500/40 bg-amber-950/50 hover:bg-amber-900/70 text-amber-300 flex items-center gap-1 transition-all cursor-pointer font-medium"
                    title="Desconectar o bot da sala de voz do Discord"
                  >
                    <PhoneOff className="w-3 h-3" />
                    Desconectar da Sala
                  </button>
                )}

                {/* Local audio preview toggle */}
                <button
                  type="button"
                  onClick={toggleLocalAudio}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border flex items-center gap-1 transition-all cursor-pointer ${
                    isLocalAudioEnabled
                      ? 'bg-purple-950/70 text-purple-300 border-purple-500/50 hover:bg-purple-900/60 font-semibold'
                      : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white hover:border-[#4B5263]'
                  }`}
                  title={isLocalAudioEnabled ? 'Clique para desativar o som local no navegador (continua tocando no Discord)' : 'Clique para ouvir o áudio também nesta página web'}
                >
                  <Headphones className="w-3 h-3" />
                  {isLocalAudioEnabled ? 'Ouvindo no Navegador (Preview ON)' : 'Somente no Discord (Local OFF)'}
                </button>
              </div>

              <h2 className="text-xl font-extrabold text-[#FFFFFF] truncate font-rpg tracking-wide">
                {currentAmbienceTrack?.title || 'Selecione um ambiente para imersão'}
              </h2>
              <p className="text-sm text-[#9E9E9E] truncate">
                Atmosfera & Imersão da Mesa
              </p>

              {currentAmbienceTrack?.tags && currentAmbienceTrack.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentAmbienceTrack.tags.map((tag, i) => (
                    <span key={i} className="text-[10px] bg-[#141619] text-[#E0E0E0] border border-[#2D3139] px-2 py-0.5 rounded-md">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Master Transport Controls */}
          <div className="flex flex-col items-center gap-3 w-full md:w-1/2 max-w-md">
            <div className="flex items-center gap-3">
              <button
                onClick={toggleLoop}
                className={`p-2 rounded-lg transition-colors cursor-pointer ${
                  ambienceLoopMode === 'track'
                    ? 'text-indigo-400 bg-indigo-500/15 border border-indigo-500/30'
                    : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
                }`}
                title={`Loop Contínuo de Ambiente: ${ambienceLoopMode === 'track' ? 'Ativo (Recomendado para BG)' : 'Desligado'}`}
              >
                <Repeat className="w-4 h-4" />
                {ambienceLoopMode === 'track' && <span className="text-[8px] absolute font-bold font-mono">∞</span>}
              </button>

              <button
                onClick={skipPrevious}
                className="p-2.5 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-xl transition-colors cursor-pointer"
                title="Ambiente Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                id="ambience-play-btn"
                onClick={toggleAmbiencePlayPause}
                disabled={!currentAmbienceTrack && ambienceTracks.length === 0}
                className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer disabled:opacity-40"
                title={isPlaying ? 'Pausar Ambiente' : 'Tocar Ambiente'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Stop Button */}
              <button
                onClick={stopAmbienceTrack}
                className="p-2.5 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#22262B] rounded-xl transition-colors cursor-pointer"
                title="Parar Som de Ambiente"
              >
                <Square className="w-5 h-5" />
              </button>

              <button
                onClick={skipNext}
                className="p-2.5 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-xl transition-colors cursor-pointer"
                title="Próximo Ambiente"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              {/* Ambience Volume Controller */}
              <div className="flex items-center gap-1.5 ml-2 bg-[#141619] border border-[#2D3139] rounded-xl px-2.5 py-1">
                <button
                  onClick={toggleAmbienceMute}
                  className="text-zinc-400 hover:text-white transition-colors"
                  title={isAmbienceMuted ? 'Desmutar Ambientação' : 'Mutar Ambientação'}
                >
                  {isAmbienceMuted || ambienceVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-sky-400" />
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Ambiente</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isAmbienceMuted ? 0 : ambienceVolume}
                    onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-sky-500"
                    title={`Volume da Ambientação: ${Math.round((isAmbienceMuted ? 0 : ambienceVolume) * 100)}%`}
                  />
                  <span className="text-[10px] font-mono text-sky-300 w-7 text-right">
                    {Math.round((isAmbienceMuted ? 0 : ambienceVolume) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Seek Bar */}
            <div className="w-full">
              <AudioScrubber
                currentTime={ambienceCurrentTime}
                duration={ambienceDuration}
                fallbackDuration={currentAmbienceTrack?.duration}
                onSeek={seekAmbience}
                formatTime={formatTime}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Main Track Library & Preset Manager Side-by-Side (Matching MusicPlayerView) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Track Browser & Folders (8 cols) */}
        <div className="lg:col-span-8 space-y-4">
          {/* Action Header & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar ambiente, chuva, caverna, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500/70 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsFolderImportOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <FolderUp className="w-4 h-4 text-indigo-400" />
                <span>Importar Pasta</span>
              </button>

              {/* Online Stream / Playlist Import */}
              <button
                onClick={() => setIsOnlineMediaOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-sky-300 hover:text-white border border-sky-500/30 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Vincular áudio ou playlist online (YouTube, Spotify, SoundCloud)"
              >
                <Radio className="w-4 h-4 text-sky-400" />
                <span>Link Online / Playlist</span>
              </button>

              {/* Add Ambience Track Button */}
              <button
                id="btn-add-ambience"
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4 text-white" />
                <span>Adicionar Ambiente</span>
              </button>
            </div>
          </div>

          {/* Folder Category Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shadow-sm ${
                selectedFolderId === 'all'
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                  : 'bg-[#141619] hover:bg-[#22262B] text-[#9E9E9E] hover:text-white border-[#2D3139]'
              }`}
            >
              Todos os Ambientes ({ambienceTracks.length})
            </button>

            {ambienceFolders.map(folder => {
              const count = ambienceTracks.filter(m => m.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border cursor-pointer shadow-sm ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-500 shadow-indigo-600/30'
                      : 'bg-[#141619] hover:bg-[#22262B] text-[#9E9E9E] hover:text-white border-[#2D3139]'
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full ring-1 ring-white/30"
                    style={{ backgroundColor: folder.color || '#38bdf8' }}
                  />
                  <span>{folder.name} ({count})</span>
                </button>
              );
            })}

            <button
              onClick={() => setIsFolderManagerOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] hover:text-white border border-[#3A3F4A] transition-all cursor-pointer shadow-sm"
              title="Gerenciar e Criar Pastas de Ambiente"
            >
              <FolderPlus className="w-4 h-4 text-indigo-400" />
              <span>+ Pasta de Ambiente</span>
            </button>
          </div>

          {/* Tracks List */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-[#2D3139] text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] flex items-center justify-between">
              <span>Faixas Encontradas ({filteredTracks.length})</span>
              <span className="text-[11px] text-[#9E9E9E]">Clique para tocar ou enfileirar</span>
            </div>

            <div className="divide-y divide-[#2D3139]/60">
              {filteredTracks.length === 0 ? (
                <div className="p-8 text-center text-[#9E9E9E] text-xs">
                  Nenhum som de ambiente encontrado nesta pasta ou busca.
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isCurrent = currentAmbienceTrack?.id === track.id;
                  const isPlayingThis = isCurrent && isPlaying;

                  return (
                    <div
                      key={track.id}
                      className={`p-3.5 flex items-center justify-between gap-3 hover:bg-[#22262B] transition-colors group ${
                        isCurrent ? 'bg-sky-600/10' : ''
                      }`}
                    >
                      {/* Track Index & Cover */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => playAmbienceTrack(track)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all cursor-pointer ${
                            isCurrent
                              ? 'bg-sky-600 text-white border-sky-500 shadow-sm'
                              : 'bg-[#141619] text-[#E0E0E0] border-[#2D3139] group-hover:bg-sky-600 group-hover:text-white group-hover:border-sky-500'
                          }`}
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current translate-x-0.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-sky-300' : 'text-[#FFFFFF]'}`}>
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-[#9E9E9E] truncate">
                            {track.isLoop !== false ? 'Loop Infinito' : 'Tocar 1x'}
                          </p>
                        </div>
                      </div>

                      {/* Tags & Duration & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {(track.tags || []).slice(0, 2).map((t, i) => (
                          <span key={i} className="hidden sm:inline-block text-[10px] bg-[#141619] text-[#9E9E9E] border border-[#2D3139] px-2 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}

                        {/* Loop Toggle Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextLoop = track.isLoop === false ? true : false;
                            updateAmbienceTrack(track.id, { isLoop: nextLoop });
                          }}
                          className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold flex items-center gap-1 border transition-all cursor-pointer ${
                            track.isLoop !== false
                              ? 'bg-sky-950/60 text-sky-300 border-sky-600/50 hover:bg-sky-900/60'
                              : 'bg-zinc-800/80 text-zinc-400 border-zinc-700 hover:text-white'
                          }`}
                          title={track.isLoop !== false ? 'Loop Infinito ativo. Clique para alternar para tocar apenas 1x.' : 'Tocar 1x ativo. Clique para alternar para Loop Infinito.'}
                        >
                          <Repeat className="w-3 h-3" />
                          {track.isLoop !== false ? 'Loop ∞' : '1x'}
                        </button>

                        {track.duration && track.duration > 0 && (
                          <span className="text-xs font-mono text-[#9E9E9E] w-12 text-right hidden sm:inline-block">
                            {formatTime(track.duration)}
                          </span>
                        )}

                        <button
                          onClick={() => addToAmbienceQueue(track)}
                          className="p-1.5 text-[#9E9E9E] hover:text-sky-300 hover:bg-[#141619] rounded-lg transition-colors cursor-pointer"
                          title="Adicionar à Fila de Ambiente"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteAmbienceTrack(track.id)}
                          className="p-1.5 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#141619] rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Remover Som de Ambiente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Ambience Queue Manager (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 shadow-lg flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Fila de Ambiente
                </h3>
              </div>
              {ambienceQueue.length > 0 && (
                <button
                  onClick={clearAmbienceQueue}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium cursor-pointer"
                >
                  Limpar Fila
                </button>
              )}
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
              {ambienceQueue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[#9E9E9E] text-xs">
                  <CloudRain className="w-8 h-8 mb-2 opacity-30 text-sky-400" />
                  <p>A fila de ambiente está vazia.</p>
                  <p className="text-[11px] text-[#6E7681] mt-1">
                    Clique no ícone de lista (+) em qualquer som ambiente ao lado para enfileirar.
                  </p>
                </div>
              ) : (
                ambienceQueue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#141619] border border-[#2D3139] flex items-center justify-between gap-2 hover:border-[#363B44] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-xs font-mono text-sky-400 font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#E0E0E0] truncate">
                          {item.track.title}
                        </p>
                        <span className="text-[9px] font-mono text-zinc-400">
                          {item.track.isLoop !== false ? 'Loop Infinito' : 'Tocar 1x'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          playAmbienceTrack(item.track, true, 0);
                          removeFromAmbienceQueue(item.id);
                        }}
                        className="p-1 text-[#9E9E9E] hover:text-sky-300 transition-colors cursor-pointer"
                        title="Tocar Agora"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => removeFromAmbienceQueue(item.id)}
                        className="p-1 text-[#9E9E9E] hover:text-rose-400 transition-colors cursor-pointer"
                        title="Remover da Fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Queue Footer Info */}
            <div className="pt-3 border-t border-[#2D3139] flex items-center justify-between text-xs text-[#9E9E9E]">
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Fila Sequencial
              </span>
              <span className="font-mono text-sky-300">
                {ambienceQueue.length} na fila
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Add Ambience Track Modal (Harmonized with MusicPlayerView's Add Modal) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <CloudRain className="w-5 h-5 text-sky-400" />
                <h3 className="text-base font-bold text-[#FFFFFF] font-rpg">
                  Adicionar Som de Ambientação
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9E9E9E] hover:text-[#FFFFFF]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrack} className="space-y-4">
              {/* File Upload Box */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  1. Enviar Arquivo de Áudio Local (Arraste ou Selecione)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingUpload(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingUpload(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsDraggingUpload(false);
                    const file = e.dataTransfer.files?.[0];
                    if (file) uploadAudioFile(file);
                  }}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors ${
                    isDraggingUpload
                      ? 'border-sky-400 bg-sky-950/40'
                      : 'border-[#2D3139] hover:border-sky-500/60 bg-[#141619]'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                  {isUploading ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-sky-400">
                      <span className="w-4 h-4 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
                      Enviando arquivo de áudio...
                    </div>
                  ) : newUrl.startsWith('/media/') ? (
                    <div className="flex items-center justify-center gap-2 text-xs font-bold text-emerald-400">
                      <Check className="w-4 h-4" />
                      Áudio carregado: {newUrl}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-6 h-6 text-[#9E9E9E] mx-auto" />
                      <p className="text-xs text-[#E0E0E0] font-medium">
                        Arraste seu arquivo aqui ou clique para selecionar
                      </p>
                      <p className="text-[10px] text-[#9E9E9E]">
                        MP3, WAV, OGG, FLAC, WEBM
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Title & URL */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Nome do Som / Ambiente *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Tempestade Noturna com Trovões"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-sky-500/70"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  URL do Áudio ou Caminho *
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://... ou /media/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-sky-500/70"
                />
              </div>

              {/* Loop Setting Toggle */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-[#141619] border border-[#2D3139]">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block">
                    Modo de Reprodução
                  </label>
                  <p className="text-[11px] text-[#9E9E9E]">
                    {newIsLoop ? 'Tocar indefinidamente em loop contínuo' : 'Tocar apenas uma vez (one-shot)'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setNewIsLoop(!newIsLoop)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer ${
                    newIsLoop
                      ? 'bg-sky-600 text-white border-sky-500'
                      : 'bg-[#22262B] text-[#9E9E9E] border-[#2D3139] hover:text-white'
                  }`}
                >
                  <Repeat className="w-3.5 h-3.5" />
                  {newIsLoop ? 'Loop Infinito' : 'Tocar 1x'}
                </button>
              </div>

              {/* Folder & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Pasta de Ambientação
                  </label>
                  <select
                    value={newFolderId}
                    onChange={(e) => setNewFolderId(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-sky-500/70"
                  >
                    <option value="">Sem Pasta (Geral)</option>
                    {ambienceFolders.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Tags (separadas por vírgula)
                  </label>
                  <input
                    type="text"
                    placeholder="chuva, vento, caverna"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-sky-500/70"
                  />
                </div>
              </div>

              {/* Cover URL */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  URL da Capa / Imagem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-sky-500/70"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2D3139]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  Salvar Ambiente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Folder Batch Import Modal */}
      <FolderImportModal
        isOpen={isFolderImportOpen}
        onClose={() => setIsFolderImportOpen(false)}
        defaultCategory="ambience"
      />

      {/* Folder Manager Modal */}
      <FolderManagerModal
        isOpen={isFolderManagerOpen}
        onClose={() => setIsFolderManagerOpen(false)}
        initialType="ambience"
      />

      {/* Online Media & Playlist Modal */}
      <OnlineMediaModal
        isOpen={isOnlineMediaOpen}
        onClose={() => setIsOnlineMediaOpen(false)}
        defaultType="ambience"
      />
    </div>
  );
};

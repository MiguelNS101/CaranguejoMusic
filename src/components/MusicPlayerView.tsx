import React, { useState, useRef } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Repeat,
  Shuffle,
  Volume2,
  VolumeX,
  Plus,
  Trash2,
  ListPlus,
  Music,
  FolderOpen,
  Upload,
  Search,
  Tag,
  Check,
  Flame,
  Radio,
  Clock,
  Layers,
  FolderUp,
  Headphones,
  PhoneOff
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { MusicTrack, LoopMode } from '../types';
import { FolderImportModal } from './FolderImportModal';
import { AudioScrubber } from './AudioScrubber';
import { apiFetch, resolveApiUrl } from '../services/api';

export const MusicPlayerView: React.FC = () => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    volume,
    musicVolume,
    setMusicVolume,
    isMusicMuted,
    toggleMusicMute,
    isMuted,
    isLocalAudioEnabled,
    toggleLocalAudio,
    loopMode,
    queue,
    playTrack,
    stopTrack,
    addToQueue,
    removeFromQueue,
    clearQueue,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    setLoopMode,
    skipNext,
    skipPrevious,
    musicTracks,
    folders,
    createMusicTrack,
    deleteMusicTrack,
    botStatus,
    disconnectVoiceChannel
  } = useAudio();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isFolderImportOpen, setIsFolderImportOpen] = useState<boolean>(false);

  // New Track Form State
  const [newTitle, setNewTitle] = useState('');
  const [newArtist, setNewArtist] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newCoverUrl, setNewCoverUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const musicFolders = folders.filter(f => f.type === 'music');

  const filteredTracks = musicTracks.filter(track => {
    const matchesFolder = selectedFolderId === 'all' || track.folderId === selectedFolderId;
    const matchesSearch = searchQuery === '' ||
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.artist && track.artist.toLowerCase().includes(searchQuery.toLowerCase())) ||
      track.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/upload?type=music', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNewUrl(data.url);
        if (!newTitle) {
          setNewTitle(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      console.error('File upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);

    await createMusicTrack({
      title: newTitle.trim(),
      artist: newArtist.trim() || 'Mestre da Mesa',
      url: newUrl.trim(),
      folderId: newFolderId || undefined,
      tags: tagsArray,
      isLocal: newUrl.startsWith('/media/'),
      coverUrl: newCoverUrl.trim() || undefined
    });

    setIsAddModalOpen(false);
    setNewTitle('');
    setNewArtist('');
    setNewUrl('');
    setNewFolderId('');
    setNewTags('');
    setNewCoverUrl('');
  };

  const toggleLoop = () => {
    if (loopMode === 'off') setLoopMode('queue');
    else if (loopMode === 'queue') setLoopMode('track');
    else setLoopMode('off');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Banner Player */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-3xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Cover & Main Details */}
          <div className="flex items-center gap-5 w-full md:w-auto">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-[#141619] shrink-0 border border-[#2D3139] shadow-lg">
              {currentTrack?.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#141619] text-indigo-400">
                  <Flame className="w-8 h-8" />
                </div>
              )}
              {playbackState === 'playing' && (
                <div className="absolute inset-0 bg-indigo-500/10 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="w-3 h-3 rounded-full bg-indigo-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                  {playbackState === 'playing' ? 'Reproduzindo' : playbackState === 'paused' ? 'Pausado' : 'Parado'}
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
                {botStatus.connectedVoiceChannel && (
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
                {currentTrack?.title || 'Selecione uma faixa para iniciar'}
              </h2>
              <p className="text-sm text-[#9E9E9E] truncate">
                {currentTrack?.artist || 'Bardos & Trilha de RPG'}
              </p>

              {currentTrack?.tags && currentTrack.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {currentTrack.tags.map((tag, i) => (
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
                  loopMode !== 'off'
                    ? 'text-indigo-400 bg-indigo-500/15 border border-indigo-500/30'
                    : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
                }`}
                title={`Modo de Repetição: ${loopMode === 'track' ? 'Música Atual' : loopMode === 'queue' ? 'Fila Completa' : 'Desligado'}`}
              >
                <Repeat className="w-4 h-4" />
                {loopMode === 'track' && <span className="text-[8px] absolute font-bold font-mono">1</span>}
              </button>

              <button
                onClick={skipPrevious}
                className="p-2.5 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-xl transition-colors cursor-pointer"
                title="Música Anterior"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                id="music-play-btn"
                onClick={togglePlayPause}
                className="w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={playbackState === 'playing' ? 'Pausar / Parar Música' : 'Tocar Música'}
              >
                {playbackState === 'playing' ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Stop Button */}
              <button
                onClick={stopTrack}
                className="p-2.5 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#22262B] rounded-xl transition-colors cursor-pointer"
                title="Parar Música (Discord e Local)"
              >
                <Square className="w-5 h-5" />
              </button>

              <button
                onClick={skipNext}
                className="p-2.5 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-xl transition-colors cursor-pointer"
                title="Próxima Música"
              >
                <SkipForward className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-1.5 ml-2 bg-[#141619] border border-[#2D3139] rounded-xl px-2.5 py-1">
                <button
                  onClick={toggleMusicMute}
                  className="text-zinc-400 hover:text-white transition-colors"
                  title={isMusicMuted ? 'Desmutar Trilha Sonora' : 'Mutar Trilha Sonora'}
                >
                  {isMusicMuted || musicVolume === 0 ? (
                    <VolumeX className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Volume2 className="w-4 h-4 text-amber-400" />
                  )}
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] text-zinc-400 font-semibold uppercase">Música</span>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMusicMuted ? 0 : musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-16 sm:w-20 h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-amber-500"
                    title={`Volume da Música: ${Math.round((isMusicMuted ? 0 : musicVolume) * 100)}%`}
                  />
                  <span className="text-[10px] font-mono text-amber-300 w-7 text-right">
                    {Math.round((isMusicMuted ? 0 : musicVolume) * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Seek Bar */}
            <div className="w-full">
              <AudioScrubber
                currentTime={currentTime}
                duration={duration}
                fallbackDuration={currentTrack?.duration}
                onSeek={seek}
                formatTime={formatTime}
                size="md"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Track Library & Queue Side-by-Side */}
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
                placeholder="Buscar música, artista, tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500/70 transition-colors"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => setIsFolderImportOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <FolderUp className="w-4 h-4" />
                Importar Pasta
              </button>

              {/* Add Track Button */}
              <button
                id="btn-add-music"
                onClick={() => setIsAddModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Adicionar Música
              </button>
            </div>
          </div>

          {/* Folder Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedFolderId('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                selectedFolderId === 'all'
                  ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                  : 'bg-[#1A1D21] text-[#9E9E9E] border-[#2D3139] hover:border-[#363B44] hover:text-[#FFFFFF]'
              }`}
            >
              Todas as Músicas ({musicTracks.length})
            </button>

            {musicFolders.map(folder => {
              const count = musicTracks.filter(m => m.folderId === folder.id).length;
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  onClick={() => setSelectedFolderId(folder.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                    isSelected
                      ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                      : 'bg-[#1A1D21] text-[#9E9E9E] border-[#2D3139] hover:border-[#363B44] hover:text-[#FFFFFF]'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: folder.color || '#6366f1' }}
                  />
                  {folder.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Tracks List */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl overflow-hidden shadow-lg">
            <div className="p-3.5 border-b border-[#2D3139] text-xs font-semibold uppercase tracking-wider text-[#9E9E9E] flex items-center justify-between">
              <span>Faixas Encontradas ({filteredTracks.length})</span>
              <span className="text-[11px] text-[#9E9E9E]">Clique para tocar ou gerenciar</span>
            </div>

            <div className="divide-y divide-[#2D3139]/60">
              {filteredTracks.length === 0 ? (
                <div className="p-8 text-center text-[#9E9E9E] text-xs">
                  Nenhuma música encontrada nesta pasta ou busca.
                </div>
              ) : (
                filteredTracks.map((track) => {
                  const isCurrent = currentTrack?.id === track.id;
                  const isPlayingThis = isCurrent && playbackState === 'playing';

                  return (
                    <div
                      key={track.id}
                      className={`p-3.5 flex items-center justify-between gap-3 hover:bg-[#22262B] transition-colors group ${
                        isCurrent ? 'bg-indigo-600/10' : ''
                      }`}
                    >
                      {/* Track Index & Cover */}
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => playTrack(track, true)}
                          className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                            isCurrent
                              ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                              : 'bg-[#141619] text-[#E0E0E0] border-[#2D3139] group-hover:bg-indigo-600 group-hover:text-white group-hover:border-indigo-500'
                          }`}
                        >
                          {isPlayingThis ? (
                            <Pause className="w-4 h-4 fill-current" />
                          ) : (
                            <Play className="w-4 h-4 fill-current translate-x-0.5" />
                          )}
                        </button>

                        <div className="min-w-0">
                          <h4 className={`text-xs font-bold truncate ${isCurrent ? 'text-indigo-300' : 'text-[#FFFFFF]'}`}>
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-[#9E9E9E] truncate">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      {/* Tags & Duration & Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {track.tags.slice(0, 2).map((t, i) => (
                          <span key={i} className="hidden sm:inline-block text-[10px] bg-[#141619] text-[#9E9E9E] border border-[#2D3139] px-2 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}

                        <span className="text-xs font-mono text-[#9E9E9E] w-12 text-right">
                          {formatTime(track.duration)}
                        </span>

                        <button
                          onClick={() => addToQueue(track)}
                          className="p-1.5 text-[#9E9E9E] hover:text-indigo-300 hover:bg-[#141619] rounded-lg transition-colors"
                          title="Adicionar à Fila"
                        >
                          <ListPlus className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => deleteMusicTrack(track.id)}
                          className="p-1.5 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#141619] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                          title="Remover Música"
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

        {/* Right Column: Queue Manager (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 shadow-lg flex flex-col h-full min-h-[400px]">
            <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Fila de Reprodução
                </h3>
              </div>
              {queue.length > 0 && (
                <button
                  onClick={clearQueue}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Limpar Fila
                </button>
              )}
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto space-y-2 py-3 pr-1">
              {queue.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-48 text-center text-[#9E9E9E] text-xs">
                  <Music className="w-8 h-8 mb-2 opacity-30" />
                  <p>A fila de músicas está vazia.</p>
                  <p className="text-[11px] text-[#6E7681] mt-1">
                    Clique em "+ Fila" em qualquer música ao lado para enfileirar.
                  </p>
                </div>
              ) : (
                queue.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-2.5 rounded-xl bg-[#141619] border border-[#2D3139] flex items-center justify-between gap-2 hover:border-[#363B44] transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-5 text-center text-xs font-mono text-[#9E9E9E] font-bold">
                        {idx + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#E0E0E0] truncate">
                          {item.track.title}
                        </p>
                        <p className="text-[10px] text-[#9E9E9E] truncate">
                          {item.track.artist}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          playTrack(item.track, true);
                          removeFromQueue(item.id);
                        }}
                        className="p-1 text-[#9E9E9E] hover:text-indigo-400"
                        title="Tocar Agora"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                      </button>
                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1 text-[#9E9E9E] hover:text-rose-400"
                        title="Remover da Fila"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Queue Footer */}
            <div className="pt-3 border-t border-[#2D3139] flex items-center justify-between text-xs text-[#9E9E9E]">
              <span>{queue.length} faixas aguardando</span>
              <span className="font-mono">
                Total: {formatTime(queue.reduce((acc, curr) => acc + curr.track.duration, 0))}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Add Track Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <h3 className="text-base font-bold text-[#FFFFFF] font-rpg">
                Adicionar Nova Música / Áudio
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#9E9E9E] hover:text-[#FFFFFF]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTrack} className="space-y-3.5">
              {/* File Upload Option */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  1. Enviar Arquivo Local (.mp3, .wav, .ogg)
                </label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#2D3139] hover:border-indigo-500/70 rounded-xl p-4 text-center cursor-pointer bg-[#141619] transition-colors"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                  <Upload className="w-6 h-6 text-[#9E9E9E] mx-auto mb-1" />
                  <p className="text-xs text-[#E0E0E0] font-medium">
                    {isUploading ? 'Enviando arquivo...' : 'Clique para selecionar arquivo de áudio do seu computador'}
                  </p>
                  <p className="text-[10px] text-[#9E9E9E] mt-0.5">
                    Salva diretamente na pasta local persistente de músicas
                  </p>
                </div>
              </div>

              {/* Or Direct URL */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  2. Ou digite a URL / Caminho do Áudio
                </label>
                <input
                  type="text"
                  placeholder="https://... ou /media/music/faixa.mp3"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 font-mono"
                  required
                />
              </div>

              {/* Title & Artist */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Título da Faixa *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Tema da Taverna"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Artista / Compositor
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Bardos de Valfenda"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* Folder & Tags */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Pasta de Organização
                  </label>
                  <select
                    value={newFolderId}
                    onChange={(e) => setNewFolderId(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  >
                    <option value="">Sem Pasta (Geral)</option>
                    {musicFolders.map(f => (
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
                    placeholder="Combate, Dragão, Chefe"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* Cover Image URL */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  URL da Capa / Imagem (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={newCoverUrl}
                  onChange={(e) => setNewCoverUrl(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
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
                  disabled={isUploading}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all"
                >
                  Salvar Música
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
        defaultCategory="music"
      />
    </div>
  );
};

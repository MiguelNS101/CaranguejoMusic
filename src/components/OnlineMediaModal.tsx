import React, { useState, useEffect } from 'react';
import {
  Link as LinkIcon,
  Play,
  Music,
  CloudRain,
  Sparkles,
  FolderDown,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ListPlus,
  Compass,
  Radio,
  X,
  Plus
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';
import { OnlineMediaMeta, PlaylistImportResult } from '../types';

interface OnlineMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: 'music' | 'ambience' | 'sfx';
}

export const OnlineMediaModal: React.FC<OnlineMediaModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'music'
}) => {
  const { folders, refreshTracks } = useAudio();

  const [url, setUrl] = useState<string>('');
  const [trackType, setTrackType] = useState<'music' | 'ambience' | 'sfx'>(defaultType);
  const [targetFolderId, setTargetFolderId] = useState<string>('');
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [inspectedMeta, setInspectedMeta] = useState<OnlineMediaMeta | null>(null);
  const [isPlaylist, setIsPlaylist] = useState<boolean>(false);

  // Custom editable fields
  const [customTitle, setCustomTitle] = useState<string>('');
  const [customArtist, setCustomArtist] = useState<string>('');

  // Status feedback
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setTrackType(defaultType);
      setUrl('');
      setInspectedMeta(null);
      setIsPlaylist(false);
      setCustomTitle('');
      setCustomArtist('');
      setFeedback({ status: 'idle' });
    }
  }, [isOpen, defaultType]);

  // Filter folders by type
  const availableFolders = folders.filter(f => f.type === trackType);

  // Auto-detect playlist URL
  useEffect(() => {
    const trimmed = url.trim();
    if (
      trimmed.includes('list=') ||
      trimmed.includes('open.spotify.com/playlist/') ||
      trimmed.includes('open.spotify.com/album/') ||
      trimmed.includes('soundcloud.com/') && trimmed.includes('/sets/')
    ) {
      setIsPlaylist(true);
    } else {
      setIsPlaylist(false);
    }
  }, [url]);

  // Inspect URL to fetch title, artist, cover
  const handleInspectUrl = async () => {
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsInspecting(true);
    setFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean; meta: OnlineMediaMeta }>('/api/media/url-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmed })
      });

      if (res.success && res.data?.meta) {
        setInspectedMeta(res.data.meta);
        setCustomTitle(res.data.meta.title);
        setCustomArtist(res.data.meta.artist);
      } else {
        setFeedback({ status: 'error', msg: 'Não foi possível inspecionar os detalhes desta URL automaticamente.' });
      }
    } catch (e: any) {
      setFeedback({ status: 'error', msg: e?.message || 'Falha ao conectar com o serviço de metadados.' });
    } finally {
      setIsInspecting(false);
    }
  };

  // Import single track or playlist
  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;

    setIsImporting(true);
    setFeedback({ status: 'idle' });

    try {
      if (isPlaylist) {
        // Playlist Import
        const res = await safeFetchJson<PlaylistImportResult>('/api/media/import-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playlistUrl: trimmed,
            targetFolderId: targetFolderId || undefined,
            trackType: trackType === 'sfx' ? 'music' : trackType
          })
        });

        if (res.success && res.data?.importedCount) {
          setFeedback({
            status: 'success',
            msg: `Playlist "${res.data.playlistTitle}" importada com sucesso! (${res.data.importedCount} faixas adicionadas)`
          });
          if (refreshTracks) refreshTracks();
          setTimeout(() => {
            onClose();
          }, 1800);
        } else {
          setFeedback({ status: 'error', msg: res.error || 'Erro ao importar playlist online.' });
        }
      } else {
        // Single Online Track Import
        const endpoint = trackType === 'music' ? '/api/music' : trackType === 'ambience' ? '/api/ambience' : '/api/soundboard';
        const bodyPayload =
          trackType === 'music'
            ? {
                title: customTitle.trim() || inspectedMeta?.title || 'Música Online',
                artist: customArtist.trim() || inspectedMeta?.artist || 'Online',
                duration: inspectedMeta?.duration || 180,
                url: trimmed,
                folderId: targetFolderId || undefined,
                tags: ['online', inspectedMeta?.platform || 'link'],
                isLocal: false,
                coverUrl: inspectedMeta?.coverUrl
              }
            : trackType === 'ambience'
            ? {
                title: customTitle.trim() || inspectedMeta?.title || 'Ambiente Online',
                environment: customArtist.trim() || inspectedMeta?.artist || 'Online',
                duration: inspectedMeta?.duration || 300,
                url: trimmed,
                folderId: targetFolderId || undefined,
                tags: ['online', inspectedMeta?.platform || 'link'],
                isLocal: false,
                coverUrl: inspectedMeta?.coverUrl
              }
            : {
                title: customTitle.trim() || inspectedMeta?.title || 'Efeito Online',
                url: trimmed,
                folderId: targetFolderId || undefined,
                isLocal: false
              };

        const res = await safeFetchJson(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyPayload)
        });

        if (res.success) {
          setFeedback({ status: 'success', msg: 'Áudio online adicionado à sua biblioteca com sucesso!' });
          if (refreshTracks) refreshTracks();
          setTimeout(() => {
            onClose();
          }, 1200);
        } else {
          setFeedback({ status: 'error', msg: res.error || 'Erro ao salvar áudio online.' });
        }
      }
    } catch (err: any) {
      setFeedback({ status: 'error', msg: err?.message || 'Falha de comunicação.' });
    } finally {
      setIsImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#14161C] border border-[#2B2F38] rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282C34] pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vincular Áudio ou Playlist Online</h3>
              <p className="text-[11px] text-zinc-400">YouTube, Spotify, SoundCloud ou Link Direto</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="text-zinc-400 hover:text-white cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Feedback message */}
        {feedback.msg && (
          <div
            className={`flex items-center gap-2 p-2.5 rounded-xl text-xs ${
              feedback.status === 'success'
                ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
            }`}
          >
            {feedback.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{feedback.msg}</span>
          </div>
        )}

        <form onSubmit={handleImport} className="space-y-3.5 text-xs">
          {/* Target Type Selector */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1.5">Tipo de Destino</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTrackType('music')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  trackType === 'music'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-bold'
                    : 'bg-[#101216] border-[#262A32] text-zinc-400 hover:text-white'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>Música</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackType('ambience')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  trackType === 'ambience'
                    ? 'bg-sky-500/20 border-sky-500 text-sky-300 font-bold'
                    : 'bg-[#101216] border-[#262A32] text-zinc-400 hover:text-white'
                }`}
              >
                <CloudRain className="w-3.5 h-3.5" />
                <span>Ambiente</span>
              </button>
              <button
                type="button"
                onClick={() => setTrackType('sfx')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  trackType === 'sfx'
                    ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                    : 'bg-[#101216] border-[#262A32] text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Soundboard</span>
              </button>
            </div>
          </div>

          {/* URL Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-zinc-300">Link Online da Faixa ou Playlist *</label>
              {isPlaylist && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <ListPlus className="w-3 h-3" />
                  Playlist Detectada
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="url"
                required
                placeholder="https://www.youtube.com/watch?v=... ou https://open.spotify.com/track/..."
                value={url}
                onChange={e => setUrl(e.target.value)}
                className="flex-1 bg-[#101216] border border-[#282C34] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleInspectUrl}
                disabled={!url.trim() || isInspecting}
                className="px-3 py-2 rounded-xl bg-[#1C1F26] hover:bg-zinc-700 text-zinc-200 border border-[#2D3139] font-semibold transition-all disabled:opacity-50 cursor-pointer shrink-0"
              >
                {isInspecting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Inspecionar'}
              </button>
            </div>
          </div>

          {/* Inspected Preview Card */}
          {inspectedMeta && (
            <div className="p-3 rounded-xl bg-[#0E1014] border border-indigo-500/30 flex items-center gap-3">
              {inspectedMeta.coverUrl ? (
                <img
                  src={inspectedMeta.coverUrl}
                  alt="Cover"
                  className="w-12 h-12 rounded-lg object-cover border border-white/10 shrink-0"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center text-zinc-400 shrink-0">
                  <Radio className="w-5 h-5" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-white text-xs truncate">{inspectedMeta.title}</p>
                <p className="text-[11px] text-zinc-400 truncate">{inspectedMeta.artist}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    {inspectedMeta.platform}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">
                    {Math.floor(inspectedMeta.duration / 60)}:
                    {(inspectedMeta.duration % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Single track manual name/artist customization (when not importing whole playlist) */}
          {!isPlaylist && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Título da Faixa</label>
                <input
                  type="text"
                  placeholder="Nome customizado..."
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Artista / Canal</label>
                <input
                  type="text"
                  placeholder="Artista ou autor..."
                  value={customArtist}
                  onChange={e => setCustomArtist(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          )}

          {/* Folder Target */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">Pasta de Destino (Opcional)</label>
            <select
              value={targetFolderId}
              onChange={e => setTargetFolderId(e.target.value)}
              className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">(Raiz - Sem Pasta)</option>
              {availableFolders.map(folder => (
                <option key={folder.id} value={folder.id}>
                  📁 {folder.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282C34]">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 rounded-xl text-zinc-400 hover:text-white"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!url.trim() || isImporting}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {isImporting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>{isPlaylist ? 'Importando Playlist...' : 'Importando...'}</span>
                </>
              ) : isPlaylist ? (
                <>
                  <ListPlus className="w-3.5 h-3.5" />
                  <span>Importar Playlist Completa</span>
                </>
              ) : (
                <>
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar à Biblioteca</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

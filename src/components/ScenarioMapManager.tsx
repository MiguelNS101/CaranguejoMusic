import React, { useState, useEffect, useRef } from 'react';
import {
  Map,
  MapPin,
  Plus,
  Send,
  Trash2,
  Edit3,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Upload,
  Link as LinkIcon,
  Compass,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Grid,
  Search,
  Beer,
  Skull,
  Gem,
  User,
  Scroll,
  Layers,
  Star,
  Check,
  X
} from 'lucide-react';
import { ScenarioMap, MapMarker, NPC } from '../types';
import { safeFetchJson } from '../services/api';
import { useAudio } from '../context/AudioContext';

interface ScenarioMapManagerProps {
  className?: string;
  isWidgetMode?: boolean;
}

const CATEGORY_CONFIG: Record<
  string,
  { label: string; icon: any; defaultColor: string; emoji: string }
> = {
  tavern: { label: 'Taverna & Comércio', icon: Beer, defaultColor: '#eab308', emoji: '🍺' },
  danger: { label: 'Perigo & Armadilha', icon: Skull, defaultColor: '#ef4444', emoji: '⚠️' },
  treasure: { label: 'Tesouro & Recompensa', icon: Gem, defaultColor: '#3b82f6', emoji: '💎' },
  npc: { label: 'Personagem & Aliado', icon: User, defaultColor: '#10b981', emoji: '👤' },
  monster: { label: 'Monstro & Covil', icon: Skull, defaultColor: '#f97316', emoji: '👹' },
  quest: { label: 'Missão & Objetivo', icon: Scroll, defaultColor: '#a855f7', emoji: '📜' },
  location: { label: 'Localidade Geográfica', icon: Compass, defaultColor: '#06b6d4', emoji: '📍' },
  poi: { label: 'Ponto de Interesse Geral', icon: MapPin, defaultColor: '#f59e0b', emoji: '🔍' }
};

export const ScenarioMapManager: React.FC<ScenarioMapManagerProps> = ({
  className = '',
  isWidgetMode = false
}) => {
  const { npcs } = useAudio();

  const [maps, setMaps] = useState<ScenarioMap[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string | null>(null);
  const [selectedMapId, setSelectedMapId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Map view controls
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showGrid, setShowGrid] = useState<boolean>(false);

  // Marker creation mode
  const [isPlacingMarker, setIsPlacingMarker] = useState<boolean>(false);
  const [selectedMarker, setSelectedMarker] = useState<MapMarker | null>(null);
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(null);
  const [markerSearchQuery, setMarkerSearchQuery] = useState<string>('');

  // Modals
  const [isCreateMapModalOpen, setIsCreateMapModalOpen] = useState<boolean>(false);
  const [isMarkerModalOpen, setIsMarkerModalOpen] = useState<boolean>(false);
  const [markerPendingCoords, setMarkerPendingCoords] = useState<{ x: number; y: number } | null>(null);

  // Create Map Form State
  const [newMapName, setNewMapName] = useState<string>('');
  const [newMapDescription, setNewMapDescription] = useState<string>('');
  const [newMapImageUrl, setNewMapImageUrl] = useState<string>('');
  const [newMapRegion, setNewMapRegion] = useState<string>('');
  const [newMapClimate, setNewMapClimate] = useState<string>('');
  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);
  const [mapImageMode, setMapImageMode] = useState<'url' | 'upload'>('url');

  // Marker Form State
  const [markerName, setMarkerName] = useState<string>('');
  const [markerDescription, setMarkerDescription] = useState<string>('');
  const [markerCategory, setMarkerCategory] = useState<string>('poi');
  const [markerColor, setMarkerColor] = useState<string>('#f59e0b');
  const [markerLinkedNpcId, setMarkerLinkedNpcId] = useState<string>('');
  const [markerLinkedItem, setMarkerLinkedItem] = useState<string>('');
  const [markerIsSecret, setMarkerIsSecret] = useState<boolean>(false);

  // Feedback notifications
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  const containerRef = useRef<HTMLDivElement>(null);

  // Load Maps
  const loadMaps = async () => {
    setIsLoading(true);
    try {
      const res = await safeFetchJson<{ maps: ScenarioMap[]; currentMapId: string | null }>('/api/maps');
      if (res.success && res.data) {
        setMaps(res.data.maps || []);
        setCurrentMapId(res.data.currentMapId);
        if (!selectedMapId && res.data.maps.length > 0) {
          const active = res.data.maps.find(m => m.id === res.data.currentMapId) || res.data.maps[0];
          setSelectedMapId(active.id);
        }
      }
    } catch (e) {
      console.error('Error loading maps:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMaps();
  }, []);

  const activeMap = maps.find(m => m.id === selectedMapId) || maps[0];

  // Set active map for the table / Discord
  const handleSetActiveMap = async (mapId: string) => {
    try {
      const res = await safeFetchJson<{ success: boolean; currentMapId: string }>(`/api/maps/${mapId}/current`, {
        method: 'POST'
      });
      if (res.success) {
        setCurrentMapId(mapId);
        setFeedback({ status: 'success', msg: 'Mapa definido como o cenário ativo da mesa!' });
        setTimeout(() => setFeedback({ status: 'idle' }), 3000);
      }
    } catch {}
  };

  // Broadcast Map to Discord
  const handleBroadcastMap = async (map: ScenarioMap) => {
    try {
      setFeedback({ status: 'idle' });
      const res = await safeFetchJson<{ success: boolean; error?: string }>(`/api/maps/${map.id}/send-discord`, {
        method: 'POST'
      });
      if (res.success && res.data?.success) {
        setFeedback({ status: 'success', msg: `Mapa "${map.name}" enviado com sucesso ao canal do Discord!` });
      } else {
        setFeedback({
          status: 'error',
          msg: res.data?.error || 'Falha ao enviar ao Discord (verifique se o bot está conectado).'
        });
      }
      setTimeout(() => setFeedback({ status: 'idle' }), 4000);
    } catch (err: any) {
      setFeedback({ status: 'error', msg: err?.message || 'Erro de comunicação.' });
    }
  };

  // Broadcast Marker to Discord
  const handleBroadcastMarker = async (map: ScenarioMap, marker: MapMarker) => {
    try {
      setFeedback({ status: 'idle' });
      const res = await safeFetchJson<{ success: boolean; error?: string }>(
        `/api/maps/${map.id}/markers/${marker.id}/send-discord`,
        { method: 'POST' }
      );
      if (res.success && res.data?.success) {
        setFeedback({ status: 'success', msg: `Marcador "${marker.name}" enviado ao chat do Discord!` });
      } else {
        setFeedback({
          status: 'error',
          msg: res.data?.error || 'Falha ao enviar marcador ao Discord.'
        });
      }
      setTimeout(() => setFeedback({ status: 'idle' }), 4000);
    } catch (err: any) {
      setFeedback({ status: 'error', msg: err?.message || 'Erro de comunicação.' });
    }
  };

  // Upload Map Image
  const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload?type=map', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        setNewMapImageUrl(data.url);
        if (!newMapName) {
          const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');
          setNewMapName(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }
    } catch (err) {
      console.error('Error uploading map image:', err);
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Create New Map
  const handleCreateMap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMapName.trim() || !newMapImageUrl.trim()) return;

    try {
      const res = await safeFetchJson<ScenarioMap>('/api/maps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newMapName.trim(),
          description: newMapDescription.trim(),
          imageUrl: newMapImageUrl.trim(),
          region: newMapRegion.trim(),
          climate: newMapClimate.trim(),
          gridSize: 40,
          isCurrent: maps.length === 0
        })
      });

      if (res.success && res.data) {
        setMaps(prev => [...prev, res.data]);
        setSelectedMapId(res.data.id);
        setIsCreateMapModalOpen(false);
        setNewMapName('');
        setNewMapDescription('');
        setNewMapImageUrl('');
        setNewMapRegion('');
        setNewMapClimate('');
        setFeedback({ status: 'success', msg: `Cenário "${res.data.name}" criado com sucesso!` });
        setTimeout(() => setFeedback({ status: 'idle' }), 3000);
      }
    } catch (err) {
      console.error('Error creating map:', err);
    }
  };

  // Delete Map
  const handleDeleteMap = async (mapId: string) => {
    if (!confirm('Deseja realmente excluir este cenário e todos os seus marcadores?')) return;
    try {
      await safeFetchJson(`/api/maps/${mapId}`, { method: 'DELETE' });
      setMaps(prev => prev.filter(m => m.id !== mapId));
      if (selectedMapId === mapId) {
        const remaining = maps.filter(m => m.id !== mapId);
        setSelectedMapId(remaining[0]?.id || null);
      }
    } catch {}
  };

  // Map Click (for placing marker)
  const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!activeMap || !isPlacingMarker) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = Math.max(0, Math.min(100, (clickX / rect.width) * 100));
    const percentY = Math.max(0, Math.min(100, (clickY / rect.height) * 100));

    setMarkerPendingCoords({ x: percentX, y: percentY });
    setSelectedMarker(null);
    setMarkerName('');
    setMarkerDescription('');
    setMarkerCategory('poi');
    setMarkerColor('#f59e0b');
    setMarkerLinkedNpcId('');
    setMarkerLinkedItem('');
    setMarkerIsSecret(false);
    setIsMarkerModalOpen(true);
    setIsPlacingMarker(false);
  };

  // Save Marker
  const handleSaveMarker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMap || !markerName.trim()) return;

    const linkedNpc = npcs.find(n => n.id === markerLinkedNpcId);

    if (selectedMarker) {
      // Update existing marker
      try {
        const res = await safeFetchJson<MapMarker>(`/api/maps/${activeMap.id}/markers/${selectedMarker.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: markerName.trim(),
            description: markerDescription.trim(),
            category: markerCategory,
            color: markerColor,
            linkedNpcId: markerLinkedNpcId || undefined,
            linkedNpcName: linkedNpc?.name || undefined,
            linkedItem: markerLinkedItem.trim() || undefined,
            isSecret: markerIsSecret
          })
        });

        if (res.success && res.data) {
          setMaps(prev =>
            prev.map(m =>
              m.id === activeMap.id
                ? {
                    ...m,
                    markers: m.markers.map(mk => (mk.id === selectedMarker.id ? res.data : mk))
                  }
                : m
            )
          );
          setIsMarkerModalOpen(false);
          setSelectedMarker(null);
        }
      } catch {}
    } else if (markerPendingCoords) {
      // Create new marker
      try {
        const res = await safeFetchJson<MapMarker>(`/api/maps/${activeMap.id}/markers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: markerName.trim(),
            description: markerDescription.trim(),
            x: markerPendingCoords.x,
            y: markerPendingCoords.y,
            category: markerCategory,
            color: markerColor,
            linkedNpcId: markerLinkedNpcId || undefined,
            linkedNpcName: linkedNpc?.name || undefined,
            linkedItem: markerLinkedItem.trim() || undefined,
            isSecret: markerIsSecret
          })
        });

        if (res.success && res.data) {
          setMaps(prev =>
            prev.map(m =>
              m.id === activeMap.id
                ? { ...m, markers: [...(m.markers || []), res.data] }
                : m
            )
          );
          setIsMarkerModalOpen(false);
          setMarkerPendingCoords(null);
        }
      } catch {}
    }
  };

  // Delete Marker
  const handleDeleteMarker = async (mapId: string, markerId: string) => {
    if (!confirm('Deseja excluir este marcador?')) return;
    try {
      await safeFetchJson(`/api/maps/${mapId}/markers/${markerId}`, { method: 'DELETE' });
      setMaps(prev =>
        prev.map(m =>
          m.id === mapId
            ? { ...m, markers: (m.markers || []).filter(mk => mk.id !== markerId) }
            : m
        )
      );
      if (activeMarkerId === markerId) setActiveMarkerId(null);
      setIsMarkerModalOpen(false);
    } catch {}
  };

  // Open Edit Modal for a marker
  const handleEditMarker = (marker: MapMarker) => {
    setSelectedMarker(marker);
    setMarkerName(marker.name);
    setMarkerDescription(marker.description || '');
    setMarkerCategory(marker.category || 'poi');
    setMarkerColor(marker.color || '#f59e0b');
    setMarkerLinkedNpcId(marker.linkedNpcId || '');
    setMarkerLinkedItem(marker.linkedItem || '');
    setMarkerIsSecret(!!marker.isSecret);
    setIsMarkerModalOpen(true);
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(z => Math.min(3, z + 0.25));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z - 0.25));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Filtered markers
  const filteredMarkers = (activeMap?.markers || []).filter(m =>
    m.name.toLowerCase().includes(markerSearchQuery.toLowerCase()) ||
    m.description?.toLowerCase().includes(markerSearchQuery.toLowerCase()) ||
    m.category.toLowerCase().includes(markerSearchQuery.toLowerCase())
  );

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Top Header: Scenario Selector & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282C34] pb-2.5">
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-thin">
          <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-indigo-400" />
            Cenários:
          </span>

          {maps.map(map => {
            const isSelected = map.id === selectedMapId;
            const isCurrent = map.id === currentMapId;
            return (
              <button
                key={map.id}
                type="button"
                onClick={() => {
                  setSelectedMapId(map.id);
                  setActiveMarkerId(null);
                }}
                className={`shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer border ${
                  isSelected
                    ? 'bg-indigo-600/30 text-white border-indigo-500 shadow-sm'
                    : 'bg-[#15171C] text-zinc-400 border-[#262A32] hover:text-white'
                }`}
              >
                <span>{map.name}</span>
                {isCurrent && (
                  <span
                    className="text-[9px] font-bold px-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    title="Mapa ativo da mesa para comandos !mapa do Discord"
                  >
                    Ativo ⭐
                  </span>
                )}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() => setIsCreateMapModalOpen(true)}
            className="shrink-0 px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#1C1F26] hover:bg-indigo-600/20 text-indigo-300 border border-dashed border-indigo-500/40 hover:border-indigo-400 transition-all flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo Cenário</span>
          </button>
        </div>

        {/* Action Controls for Selected Map */}
        {activeMap && (
          <div className="flex items-center gap-2">
            {activeMap.id !== currentMapId && (
              <button
                type="button"
                onClick={() => handleSetActiveMap(activeMap.id)}
                className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-[#181B20] hover:bg-amber-950/40 text-amber-300 border border-[#2D3139] hover:border-amber-500/50 transition-all flex items-center gap-1 cursor-pointer"
                title="Definir como mapa principal ativo (exibido quando jogadores digitarem !mapa)"
              >
                <Star className="w-3.5 h-3.5 text-amber-400" />
                <span>Tornar Ativo</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => handleBroadcastMap(activeMap)}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
              title="Postar imagem e pontos de interesse deste mapa no Discord"
            >
              <Send className="w-3 h-3" />
              <span>Enviar ao Discord</span>
            </button>
          </div>
        )}
      </div>

      {/* Notification feedback */}
      {feedback.msg && (
        <div
          className={`flex items-center gap-2 p-2 rounded-xl text-xs transition-all ${
            feedback.status === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.status === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Main Map Viewer & Sidebar */}
      {activeMap ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* Canvas Area (9 cols on desktop) */}
          <div className="lg:col-span-8 flex flex-col space-y-2">
            {/* Canvas Toolbar */}
            <div className="flex items-center justify-between bg-[#121418] px-3 py-1.5 rounded-xl border border-[#262A32] text-xs">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlacingMarker(!isPlacingMarker)}
                  className={`px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    isPlacingMarker
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/30 animate-pulse'
                      : 'bg-indigo-600/30 text-indigo-200 border border-indigo-500/40 hover:bg-indigo-600/50'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{isPlacingMarker ? 'Clique no mapa para posicionar...' : '+ Adicionar Marcador'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowGrid(!showGrid)}
                  className={`p-1.5 rounded-lg border transition-all ${
                    showGrid
                      ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                      : 'bg-[#181B20] border-[#2D3139] text-zinc-400 hover:text-white'
                  }`}
                  title="Alternar Grade Tática"
                >
                  <Grid className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Zoom & View Controls */}
              <div className="flex items-center gap-1 bg-[#181B20] p-0.5 rounded-lg border border-[#282C34]">
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Diminuir Zoom"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] font-mono text-zinc-300 px-1">{Math.round(zoom * 100)}%</span>
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1 text-zinc-400 hover:text-white"
                  title="Aumentar Zoom"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleResetView}
                  className="p-1 text-zinc-400 hover:text-white ml-1 border-l border-zinc-700 pl-1.5"
                  title="Resetar Visão"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Interactive Canvas Viewport */}
            <div
              ref={containerRef}
              className={`relative overflow-hidden rounded-2xl bg-[#090A0D] border border-[#282C34] h-[340px] sm:h-[440px] select-none flex items-center justify-center ${
                isPlacingMarker ? 'cursor-crosshair' : 'cursor-grab'
              }`}
            >
              {/* Zoom & Pan Wrapper */}
              <div
                className="relative transition-transform duration-75 origin-center inline-block"
                style={{
                  transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`
                }}
              >
                {/* Map Image with click handler */}
                <div className="relative inline-block" onClick={handleMapClick}>
                  <img
                    src={activeMap.imageUrl}
                    alt={activeMap.name}
                    className="max-h-[380px] sm:max-h-[480px] w-auto object-contain rounded-xl shadow-2xl pointer-events-auto block"
                    onError={e => {
                      (e.currentTarget as HTMLImageElement).style.opacity = '0.3';
                    }}
                  />

                  {/* Optional Tactical Grid Overlay */}
                  {showGrid && (
                    <div
                      className="absolute inset-0 pointer-events-none rounded-xl"
                      style={{
                        backgroundImage: `linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px),
                                          linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)`,
                        backgroundSize: '36px 36px'
                      }}
                    />
                  )}

                  {/* Interactive Pins */}
                  {(activeMap.markers || []).map(marker => {
                    const isSelected = activeMarkerId === marker.id;
                    const cat = CATEGORY_CONFIG[marker.category] || CATEGORY_CONFIG.poi;

                    return (
                      <div
                        key={marker.id}
                        onClick={e => {
                          e.stopPropagation();
                          setActiveMarkerId(marker.id);
                        }}
                        style={{
                          left: `${marker.x}%`,
                          top: `${marker.y}%`,
                          transform: 'translate(-50%, -100%)'
                        }}
                        className="absolute group z-20 cursor-pointer"
                      >
                        {/* Pin Visual */}
                        <div
                          className={`relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-transform hover:scale-125 ${
                            isSelected ? 'ring-4 ring-white scale-125 z-30' : ''
                          }`}
                          style={{
                            backgroundColor: marker.color || cat.defaultColor,
                            color: '#fff'
                          }}
                        >
                          <span className="text-xs">{cat.emoji}</span>

                          {/* Secret Eye Indicator */}
                          {marker.isSecret && (
                            <span
                              className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-rose-600 text-white flex items-center justify-center text-[8px]"
                              title="Marcador secreto (oculto dos jogadores)"
                            >
                              🔒
                            </span>
                          )}
                        </div>

                        {/* Hover Tooltip Preview */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:flex flex-col items-center pointer-events-none z-40">
                          <div className="bg-[#121418]/95 border border-[#303642] px-2.5 py-1.5 rounded-xl shadow-xl whitespace-nowrap text-left">
                            <p className="text-xs font-bold text-white flex items-center gap-1">
                              <span>{cat.emoji}</span>
                              {marker.name}
                              {marker.isSecret && <span className="text-[10px] text-rose-400 font-normal">(Segredo)</span>}
                            </p>
                            {marker.description && (
                              <p className="text-[10px] text-zinc-300 max-w-[200px] truncate mt-0.5">
                                {marker.description}
                              </p>
                            )}
                          </div>
                          <div className="w-2 h-2 bg-[#121418] rotate-45 border-r border-b border-[#303642] -mt-1" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Area: Active Marker Details & POI Catalog (4 cols) */}
          <div className="lg:col-span-4 flex flex-col space-y-2 bg-[#121418] p-3 rounded-2xl border border-[#282C34]">
            {/* Active Marker Inspector Card */}
            {activeMarkerId ? (
              (() => {
                const marker = activeMap.markers.find(m => m.id === activeMarkerId);
                if (!marker) return null;
                const cat = CATEGORY_CONFIG[marker.category] || CATEGORY_CONFIG.poi;

                return (
                  <div className="p-3 rounded-xl bg-[#181B22] border border-indigo-500/40 space-y-2.5 shadow-md">
                    <div className="flex items-start justify-between gap-2 border-b border-white/10 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{cat.emoji}</span>
                        <div>
                          <h4 className="text-xs font-bold text-white leading-tight">{marker.name}</h4>
                          <span className="text-[10px] text-zinc-400">{cat.label}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleEditMarker(marker)}
                          className="p-1 rounded bg-[#222630] text-zinc-300 hover:text-white"
                          title="Editar Marcador"
                        >
                          <Edit3 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMarker(activeMap.id, marker.id)}
                          className="p-1 rounded bg-[#222630] text-rose-400 hover:text-rose-300"
                          title="Excluir Marcador"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setActiveMarkerId(null)}
                          className="p-1 rounded bg-[#222630] text-zinc-400 hover:text-white"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {marker.description && (
                      <p className="text-xs text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {marker.description}
                      </p>
                    )}

                    {/* Linked Details */}
                    <div className="space-y-1 text-xs">
                      {marker.linkedNpcName && (
                        <div className="flex items-center gap-1.5 text-emerald-300">
                          <User className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-[11px]">NPC: <strong>{marker.linkedNpcName}</strong></span>
                        </div>
                      )}
                      {marker.linkedItem && (
                        <div className="flex items-center gap-1.5 text-amber-300">
                          <Gem className="w-3.5 h-3.5 text-amber-400" />
                          <span className="text-[11px]">Loot / Item: <strong>{marker.linkedItem}</strong></span>
                        </div>
                      )}
                      {marker.isSecret && (
                        <div className="flex items-center gap-1.5 text-rose-300 text-[11px]">
                          <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                          <span>Marcador confidencial do Mestre (não é exposto ao chat).</span>
                        </div>
                      )}
                    </div>

                    {/* Discord Broadcast Button */}
                    <button
                      type="button"
                      onClick={() => handleBroadcastMarker(activeMap, marker)}
                      className="w-full py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm shadow-indigo-600/20"
                    >
                      <Send className="w-3 h-3" />
                      <span>Enviar Marcador ao Discord</span>
                    </button>
                  </div>
                );
              })()
            ) : (
              <div className="p-3 rounded-xl bg-[#16181E] border border-dashed border-[#2D3139] text-center">
                <Compass className="w-6 h-6 text-zinc-500 mx-auto mb-1" />
                <p className="text-xs font-semibold text-zinc-300">Nenhum marcador selecionado</p>
                <p className="text-[10px] text-zinc-500">
                  Clique em um marcador no mapa ou na lista abaixo para inspecionar e enviar ao Discord.
                </p>
              </div>
            )}

            {/* Markers Search and List */}
            <div className="flex-1 flex flex-col space-y-1.5 min-h-[160px]">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  Pontos de Interesse ({activeMap.markers.length})
                </span>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Buscar marcador..."
                  value={markerSearchQuery}
                  onChange={e => setMarkerSearchQuery(e.target.value)}
                  className="w-full bg-[#181B20] border border-[#282C34] rounded-xl pl-8 pr-2.5 py-1 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex-1 max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                {filteredMarkers.length === 0 ? (
                  <p className="text-[11px] text-zinc-500 text-center py-4">Nenhum marcador encontrado.</p>
                ) : (
                  filteredMarkers.map(m => {
                    const cat = CATEGORY_CONFIG[m.category] || CATEGORY_CONFIG.poi;
                    const isSelected = activeMarkerId === m.id;
                    return (
                      <div
                        key={m.id}
                        onClick={() => setActiveMarkerId(m.id)}
                        className={`p-2 rounded-xl border text-xs flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/40 border-indigo-500/60 text-white'
                            : 'bg-[#16181E] border-[#242730] text-zinc-300 hover:border-zinc-600'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="text-sm shrink-0">{cat.emoji}</span>
                          <div className="truncate">
                            <p className="font-semibold truncate text-[11px] leading-tight">{m.name}</p>
                            <p className="text-[9px] text-zinc-500 truncate">{cat.label}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          {m.isSecret && (
                            <span className="text-[9px] px-1 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800">
                              🔒
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              handleBroadcastMarker(activeMap, m);
                            }}
                            className="p-1 rounded bg-[#20232A] hover:bg-indigo-600 text-zinc-400 hover:text-white transition-all"
                            title="Enviar ao Discord"
                          >
                            <Send className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl bg-[#121418] border border-dashed border-[#282C34] text-center space-y-3">
          <Compass className="w-10 h-10 text-indigo-400 mx-auto" />
          <h3 className="text-sm font-bold text-white">Nenhum cenário ou mapa criado ainda</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Faça upload de uma imagem ou informe a URL de um mapa para começar a criar marcadores táticos para sua mesa de RPG.
          </p>
          <button
            type="button"
            onClick={() => setIsCreateMapModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all cursor-pointer"
          >
            + Criar Primeiro Cenário
          </button>
        </div>
      )}

      {/* MODAL: Create New Map */}
      {isCreateMapModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15171D] border border-[#2D3139] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#282C34] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Compass className="w-4 h-4 text-indigo-400" />
                Criar Novo Cenário & Mapa
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateMapModalOpen(false)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMap} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Nome do Cenário *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Masmorra do Terror, Arquipélago dos Caranguejos..."
                  value={newMapName}
                  onChange={e => setNewMapName(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Image Input Options */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-zinc-300">Imagem do Mapa *</label>
                  <div className="flex items-center gap-1 bg-[#101216] p-0.5 rounded-lg border border-[#282C34]">
                    <button
                      type="button"
                      onClick={() => setMapImageMode('url')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        mapImageMode === 'url' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                      }`}
                    >
                      URL Online
                    </button>
                    <button
                      type="button"
                      onClick={() => setMapImageMode('upload')}
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        mapImageMode === 'upload' ? 'bg-zinc-700 text-white' : 'text-zinc-400'
                      }`}
                    >
                      Upload Arquivo
                    </button>
                  </div>
                </div>

                {mapImageMode === 'url' ? (
                  <input
                    type="url"
                    required
                    placeholder="https://exemplo.com/mapa.png"
                    value={newMapImageUrl}
                    onChange={e => setNewMapImageUrl(e.target.value)}
                    className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="w-full text-xs text-zinc-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-600/30 file:text-indigo-300 hover:file:bg-indigo-600/50 cursor-pointer"
                    />
                    {isUploadingImage && <span className="text-[10px] text-indigo-400 animate-pulse">Enviando...</span>}
                  </div>
                )}

                {newMapImageUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-[#282C34] max-h-24 bg-black/40">
                    <img src={newMapImageUrl} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">Região / Continente</label>
                  <input
                    type="text"
                    placeholder="Ex: Costa Leste, Subterrâneo"
                    value={newMapRegion}
                    onChange={e => setNewMapRegion(e.target.value)}
                    className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-zinc-300 block mb-1">Clima / Atmosfera</label>
                  <input
                    type="text"
                    placeholder="Ex: Chuvoso, Frio Úmido"
                    value={newMapClimate}
                    onChange={e => setNewMapClimate(e.target.value)}
                    className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Descrição / Sinopse</label>
                <textarea
                  rows={2}
                  placeholder="Detalhes históricos ou pontos-chave deste cenário..."
                  value={newMapDescription}
                  onChange={e => setNewMapDescription(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282C34]">
                <button
                  type="button"
                  onClick={() => setIsCreateMapModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!newMapName.trim() || !newMapImageUrl.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  Salvar Cenário
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Create / Edit Marker */}
      {isMarkerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#15171D] border border-[#2D3139] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#282C34] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-amber-400" />
                {selectedMarker ? 'Editar Marcador' : 'Novo Ponto de Interesse'}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsMarkerModalOpen(false);
                  setSelectedMarker(null);
                  setMarkerPendingCoords(null);
                }}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveMarker} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Nome do Local *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Taverna do Siri, Covil dos Goblins, Torre Abandonada..."
                  value={markerName}
                  onChange={e => setMarkerName(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-2 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Category picker */}
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Categoria do Ponto</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {Object.entries(CATEGORY_CONFIG).map(([key, item]) => {
                    const isSelected = markerCategory === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          setMarkerCategory(key);
                          setMarkerColor(item.defaultColor);
                        }}
                        className={`px-2.5 py-1.5 rounded-xl border text-left flex items-center gap-1.5 transition-all ${
                          isSelected
                            ? 'bg-indigo-600/30 border-indigo-500 text-white font-bold'
                            : 'bg-[#101216] border-[#262A32] text-zinc-400 hover:text-white'
                        }`}
                      >
                        <span>{item.emoji}</span>
                        <span className="truncate text-[11px]">{item.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Descrição Detalhada</label>
                <textarea
                  rows={2}
                  placeholder="O que os heróis encontram aqui? Armadilhas, pistas ou segredos..."
                  value={markerDescription}
                  onChange={e => setMarkerDescription(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Linked NPC selection */}
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">NPC Vinculado (Opcional)</label>
                <select
                  value={markerLinkedNpcId}
                  onChange={e => setMarkerLinkedNpcId(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="">Nenhum NPC vinculado</option>
                  {npcs.map(npc => (
                    <option key={npc.id} value={npc.id}>
                      {npc.name} ({npc.race || 'NPC'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Linked Item / Reward */}
              <div>
                <label className="font-semibold text-zinc-300 block mb-1">Loot / Recompensa Encontrada</label>
                <input
                  type="text"
                  placeholder="Ex: Anel de Invisibilidade, 250 Peças de Ouro, Pergaminho Antigo..."
                  value={markerLinkedItem}
                  onChange={e => setMarkerLinkedItem(e.target.value)}
                  className="w-full bg-[#101216] border border-[#282C34] rounded-xl px-3 py-1.5 text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Secret toggle */}
              <label className="flex items-center gap-2 p-2 rounded-xl bg-[#101216] border border-[#282C34] text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={markerIsSecret}
                  onChange={e => setMarkerIsSecret(e.target.checked)}
                  className="rounded bg-[#16181D] border-[#2D3139] text-rose-600 focus:ring-0 w-4 h-4 cursor-pointer"
                />
                <div className="flex flex-col">
                  <span className="font-bold flex items-center gap-1 text-white">
                    <EyeOff className="w-3.5 h-3.5 text-rose-400" />
                    Segredo Exclusivo do Mestre
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Oculta este marcador quando os jogadores executarem `!mapa` no Discord.
                  </span>
                </div>
              </label>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#282C34]">
                <button
                  type="button"
                  onClick={() => {
                    setIsMarkerModalOpen(false);
                    setSelectedMarker(null);
                    setMarkerPendingCoords(null);
                  }}
                  className="px-3 py-1.5 rounded-xl text-zinc-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!markerName.trim()}
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-all disabled:opacity-50 cursor-pointer"
                >
                  {selectedMarker ? 'Atualizar Marcador' : 'Adicionar ao Mapa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

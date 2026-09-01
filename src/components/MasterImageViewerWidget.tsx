import React, { useState, useRef } from 'react';
import {
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  RotateCcw,
  Send,
  Sparkles,
  Upload,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileImage,
  Layers,
  MapPin
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';

interface ImageItem {
  id: string;
  title: string;
  category: 'map' | 'scene' | 'handout' | 'npc';
  url: string;
  description?: string;
  secretNotes?: string;
}

const DEFAULT_PRESET_IMAGES: ImageItem[] = [];

interface MasterImageViewerWidgetProps {
  storageKey?: string;
  defaultCategory?: 'map' | 'scene' | 'handout' | 'npc';
}

export const MasterImageViewerWidget: React.FC<MasterImageViewerWidgetProps> = ({
  storageKey = 'caranguejo_master_image_gallery',
  defaultCategory
}) => {
  const { npcs } = useAudio();

  // Combine defaults with any NPC portraits
  const npcImages: ImageItem[] = npcs
    .filter(n => n.avatarUrl)
    .map(n => ({
      id: `npc-img-${n.id}`,
      title: `Retrato: ${n.name}`,
      category: 'npc',
      url: n.avatarUrl,
      description: `${n.role || 'Personagem'} - ${n.description || ''}`,
      secretNotes: n.secretNotes
    }));

  const [gallery, setGallery] = useState<ImageItem[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_PRESET_IMAGES;
  });

  const combinedGallery = [...gallery, ...npcImages.filter(ni => !gallery.some(g => g.url === ni.url))];

  const [activeImageId, setActiveImageId] = useState<string>(() => combinedGallery[0]?.id || 'img-map-1');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showSecret, setShowSecret] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [isSendingToDiscord, setIsSendingToDiscord] = useState<boolean>(false);
  const [discordFeedback, setDiscordFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Custom Image URL / Upload Modal
  const [isAddOpen, setIsAddOpen] = useState<boolean>(false);
  const [newTitle, setNewTitle] = useState<string>('');
  const [newUrl, setNewUrl] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'map' | 'scene' | 'handout'>('scene');
  const [newDesc, setNewDesc] = useState<string>('');

  const activeImage = combinedGallery.find(img => img.id === activeImageId) || combinedGallery[0];

  const handleZoom = (delta: number) => {
    setZoomLevel(prev => Math.min(3, Math.max(0.5, +(prev + delta).toFixed(2))));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
  };

  const handleSendToDiscord = async () => {
    if (!activeImage || !activeImage.url) return;
    setIsSendingToDiscord(true);
    setDiscordFeedback({ status: 'idle' });

    try {
      const messageContent = `🖼️ **[CENÁRIO / MAPA DA MESA] ${activeImage.title}**\n${activeImage.description ? `*${activeImage.description}*\n` : ''}${activeImage.url}`;

      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: messageContent,
          type: 'handout'
        })
      });

      if (res.success && res.data?.success !== false) {
        setDiscordFeedback({ status: 'success', msg: 'Imagem e Handout enviados ao Discord!' });
        setTimeout(() => setDiscordFeedback({ status: 'idle' }), 3500);
      } else {
        setDiscordFeedback({ status: 'error', msg: res.data?.error || res.error || 'Falha ao enviar ao Discord.' });
      }
    } catch (err: any) {
      setDiscordFeedback({ status: 'error', msg: err?.message || 'Erro de conexão' });
    } finally {
      setIsSendingToDiscord(false);
    }
  };

  const handleAddCustomImage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrl.trim() || !newTitle.trim()) return;

    const newItem: ImageItem = {
      id: `img-custom-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      url: newUrl.trim(),
      description: newDesc.trim() || undefined
    };

    const updated = [newItem, ...gallery];
    setGallery(updated);
    try {
      localStorage.setItem('caranguejo_master_image_gallery', JSON.stringify(updated));
    } catch {}

    setActiveImageId(newItem.id);
    setIsAddOpen(false);
    setNewTitle('');
    setNewUrl('');
    setNewDesc('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        const newItem: ImageItem = {
          id: `img-upload-${Date.now()}`,
          title: file.name.replace(/\.[^/.]+$/, ''),
          category: 'map',
          url: dataUrl,
          description: `Arquivo local: ${file.name}`
        };

        const updated = [newItem, ...gallery];
        setGallery(updated);
        try {
          localStorage.setItem('caranguejo_master_image_gallery', JSON.stringify(updated));
        } catch {}
        setActiveImageId(newItem.id);
      }
    };
    reader.readAsDataURL(file);
  };

  const nextImage = () => {
    const currIdx = combinedGallery.findIndex(i => i.id === activeImageId);
    const nextIdx = (currIdx + 1) % combinedGallery.length;
    setActiveImageId(combinedGallery[nextIdx].id);
    setZoomLevel(1);
  };

  const prevImage = () => {
    const currIdx = combinedGallery.findIndex(i => i.id === activeImageId);
    const prevIdx = (currIdx - 1 + combinedGallery.length) % combinedGallery.length;
    setActiveImageId(combinedGallery[prevIdx].id);
    setZoomLevel(1);
  };

  return (
    <div className="space-y-3">
      {/* Top Toolbar: Thumbnails & Quick Actions */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
          {combinedGallery.length === 0 ? (
            <span className="text-[11px] text-[#9E9E9E] italic py-1 px-1">
              Galeria de imagens vazia. Envie um mapa ou adicione uma imagem abaixo.
            </span>
          ) : (
            combinedGallery.slice(0, 8).map((img) => {
              const isSelected = img.id === activeImageId;
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => {
                    setActiveImageId(img.id);
                    setZoomLevel(1);
                  }}
                  className={`relative w-9 h-9 rounded-lg overflow-hidden shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/50 scale-105'
                      : 'border-[#2D3139] opacity-70 hover:opacity-100 hover:border-[#4B5263]'
                  }`}
                  title={img.title}
                >
                  <img
                    src={img.url}
                    alt={img.title}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <label className="p-1.5 rounded-lg bg-[#141619] hover:bg-[#22262B] text-[#9E9E9E] hover:text-white border border-[#2D3139] transition-colors cursor-pointer" title="Carregar Imagem do Computador">
            <Upload className="w-3.5 h-3.5" />
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
          </label>

          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#141619] hover:bg-[#22262B] text-xs font-semibold text-[#E0E0E0] border border-[#2D3139] transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-indigo-400" />
            <span>+ Imagem</span>
          </button>
        </div>
      </div>

      {/* Main Image Display Box */}
      <div className="relative w-full h-64 md:h-72 rounded-xl bg-[#0F1113] border border-[#2D3139] overflow-hidden group flex items-center justify-center select-none">
        {activeImage ? (
          <div
            className="w-full h-full flex items-center justify-center transition-transform duration-150 ease-out cursor-grab active:cursor-grabbing"
            style={{ transform: `scale(${zoomLevel})` }}
          >
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-w-full max-h-full object-contain pointer-events-none drop-shadow-md"
              referrerPolicy="no-referrer"
            />
          </div>
        ) : (
          <div className="text-center p-6 text-[#9E9E9E] flex flex-col items-center justify-center gap-2">
            <FileImage className="w-10 h-10 text-[#4B5263]" />
            <p className="text-xs font-medium text-[#E0E0E0]">Nenhuma imagem ou mapa carregado</p>
            <p className="text-[11px] text-[#9E9E9E] max-w-xs">
              Envie arquivos de mapas, cenários ou retratos para exibir no escudo e transmitir ao Discord.
            </p>
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="mt-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md transition-colors cursor-pointer"
            >
              + Adicionar Imagem ou URL
            </button>
          </div>
        )}

        {/* Navigation Arrows */}
        {combinedGallery.length > 1 && (
          <>
            <button
              type="button"
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Imagem Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              title="Próxima Imagem"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </>
        )}

        {/* Floating Zoom & Action Controls */}
        {activeImage && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm p-1 rounded-lg border border-white/15 opacity-85 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={() => handleZoom(-0.2)}
              className="p-1 text-[#E0E0E0] hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Diminuir Zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] font-mono font-bold text-white px-1">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => handleZoom(0.2)}
              className="p-1 text-[#E0E0E0] hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Aumentar Zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetZoom}
              className="p-1 text-[#E0E0E0] hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Resetar Zoom (100%)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setIsFullscreen(true)}
              className="p-1 text-indigo-400 hover:text-white rounded hover:bg-white/10 transition-colors"
              title="Ver em Tela Cheia"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Bottom Title Bar Overlay */}
        {activeImage && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-6 flex items-center justify-between gap-2">
            <div className="min-w-0 flex-1">
              <span className="text-[10px] uppercase font-bold text-indigo-300 bg-indigo-950/70 px-2 py-0.5 rounded border border-indigo-500/30 inline-block mb-0.5">
                {activeImage.category === 'map' ? 'Mapa Tático' : activeImage.category === 'handout' ? 'Handout / Pista' : activeImage.category === 'npc' ? 'Personagem' : 'Cenário'}
              </span>
              <h4 className="text-xs md:text-sm font-bold text-white truncate">
                {activeImage.title}
              </h4>
            </div>

            <button
              type="button"
              onClick={handleSendToDiscord}
              disabled={isSendingToDiscord}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all shrink-0 cursor-pointer"
            >
              <Send className="w-3 h-3" />
              {isSendingToDiscord ? 'Enviando...' : 'Exibir no Discord'}
            </button>
          </div>
        )}
      </div>

      {/* Secret Notes & Discord Feedback */}
      {activeImage && (
        <div className="flex items-start justify-between gap-2 text-xs">
          <div className="min-w-0 flex-1">
            {activeImage.description && (
              <p className="text-[11px] text-[#9E9E9E] line-clamp-1">
                {activeImage.description}
              </p>
            )}

            {activeImage.secretNotes && (
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowSecret(!showSecret)}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                >
                  {showSecret ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showSecret ? 'Ocultar Segredo do Mestre' : 'Ver Segredo do Mestre'}
                </button>
                {showSecret && (
                  <div className="p-2 rounded-lg bg-amber-950/40 border border-amber-500/30 text-amber-200 text-[11px] mt-1 font-mono">
                    🔒 {activeImage.secretNotes}
                  </div>
                )}
              </div>
            )}
          </div>

          {discordFeedback.status === 'success' && (
            <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1 shrink-0 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Enviado ao Discord!
            </span>
          )}
          {discordFeedback.status === 'error' && (
            <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1 shrink-0 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-500/30">
              <AlertCircle className="w-3 h-3" />
              {discordFeedback.msg}
            </span>
          )}
        </div>
      )}

      {/* Add Custom Image Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                Adicionar Nova Imagem / Mapa
              </h3>
              <button
                type="button"
                onClick={() => setIsAddOpen(false)}
                className="text-[#9E9E9E] hover:text-white p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddCustomImage} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold uppercase text-[#9E9E9E] block mb-1">
                  Título / Nome da Cena
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Castelo em Chamas, Mapa da Floresta..."
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#9E9E9E] block mb-1">
                  URL da Imagem ou Caminho Local
                </label>
                <input
                  type="text"
                  required
                  placeholder="https://... ou data:image/..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#9E9E9E] block mb-1">
                  Categoria
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:border-indigo-500 focus:outline-none"
                >
                  <option value="scene">Cenário / Ambiência</option>
                  <option value="map">Mapa Tático / Dungeon</option>
                  <option value="handout">Handout / Documento</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold uppercase text-[#9E9E9E] block mb-1">
                  Descrição Rápida (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Detalhes para os jogadores..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#141619] hover:bg-[#22262B] text-xs font-semibold text-[#9E9E9E]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30"
                >
                  Salvar Imagem
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Fullscreen Modal Lightbox */}
      {isFullscreen && activeImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#2D3139]">
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-indigo-400 bg-indigo-950 px-2 py-0.5 rounded">
                {activeImage.title}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSendToDiscord}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                <Send className="w-3.5 h-3.5" />
                Exibir no Discord
              </button>
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                className="p-2 rounded-xl bg-[#1A1D21] hover:bg-[#22262B] text-white border border-[#2D3139]"
                title="Fechar Tela Cheia"
              >
                <Minimize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 flex items-center justify-center overflow-hidden p-4">
            <img
              src={activeImage.url}
              alt={activeImage.title}
              className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      )}
    </div>
  );
};

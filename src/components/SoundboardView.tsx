import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Trash2,
  Volume2,
  VolumeX,
  Play,
  Square,
  Search,
  Upload,
  FolderOpen,
  Tag,
  Flame,
  Zap,
  Shield,
  PartyPopper,
  LayoutGrid,
  Settings2,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  Edit2,
  Check,
  X,
  FolderUp,
  Sliders,
  Move,
  Layers,
  Radio,
  Headphones
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { SoundboardItem, SoundboardLayout, SoundboardButtonConfig } from '../types';
import { FolderImportModal } from './FolderImportModal';
import { apiFetch } from '../services/api';

export const SoundboardView: React.FC = () => {
  const {
    soundboardItems,
    playSoundboard,
    stopSoundboard,
    activeSfxIds,
    folders,
    createSoundboardItem,
    deleteSoundboardItem,
    soundboardLayouts,
    activeLayoutId,
    setActiveLayoutId,
    createSoundboardLayout,
    updateSoundboardLayout,
    deleteSoundboardLayout,
    updateLayoutButtons,
    botStatus,
    isLocalAudioEnabled,
    toggleLocalAudio,
    volume,
    setVolume,
    isMuted,
    toggleMute
  } = useAudio();

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isFolderImportOpen, setIsFolderImportOpen] = useState<boolean>(false);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState<boolean>(false);
  const [isEditMode, setIsEditMode] = useState<boolean>(false);
  const [isAddButtonModalOpen, setIsAddButtonModalOpen] = useState<boolean>(false);

  // New Layout Form
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newLayoutDesc, setNewLayoutDesc] = useState('');
  const [newLayoutColor, setNewLayoutColor] = useState('#ef4444');
  const [newLayoutIcon, setNewLayoutIcon] = useState('Swords');

  // Add SFX Form State
  const [newName, setNewName] = useState('');
  const [newEmoji, setNewEmoji] = useState('🔊');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newUrl, setNewUrl] = useState('');
  const [newFolderId, setNewFolderId] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newVolume, setNewVolume] = useState(90);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sfxFolders = folders.filter(f => f.type === 'soundboard');

  const currentLayout = soundboardLayouts.find(l => l.id === activeLayoutId) || soundboardLayouts[0] || {
    id: 'default',
    name: 'Geral',
    themeColor: '#6366f1',
    buttons: []
  };

  const filteredLibraryItems = soundboardItems.filter(item => {
    const matchesFolder = selectedFolderId === 'all' || item.folderId === selectedFolderId;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch('/api/upload?type=sfx', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setNewUrl(data.url);
        if (!newName) {
          setNewName(file.name.replace(/\.[^/.]+$/, ''));
        }
      }
    } catch (err) {
      console.error('SFX upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateSfx = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newUrl.trim()) return;

    const tagsArray = newTags.split(',').map(t => t.trim()).filter(Boolean);

    await createSoundboardItem({
      name: newName.trim(),
      emoji: newEmoji.trim() || '🔊',
      color: newColor,
      url: newUrl.trim(),
      folderId: newFolderId || undefined,
      tags: tagsArray,
      volume: newVolume,
      isLocal: newUrl.startsWith('/media/')
    });

    setIsAddModalOpen(false);
    setNewName('');
    setNewEmoji('🔊');
    setNewUrl('');
    setNewFolderId('');
    setNewTags('');
    setNewVolume(90);
  };

  const handleCreateLayout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLayoutName.trim()) return;

    await createSoundboardLayout({
      name: newLayoutName.trim(),
      description: newLayoutDesc.trim(),
      themeColor: newLayoutColor,
      icon: newLayoutIcon,
      buttons: []
    });

    setIsLayoutModalOpen(false);
    setNewLayoutName('');
    setNewLayoutDesc('');
  };

  // Button config actions on current layout
  const handleAddButtonToLayout = async (item: SoundboardItem) => {
    if (!currentLayout) return;
    const newButton: SoundboardButtonConfig = {
      id: `btn-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      itemId: item.id,
      size: 'md',
      order: currentLayout.buttons.length,
      customName: item.name
    };
    const updatedButtons = [...currentLayout.buttons, newButton];
    await updateLayoutButtons(currentLayout.id, updatedButtons);
    setIsAddButtonModalOpen(false);
  };

  const handleRemoveButtonFromLayout = async (buttonId: string) => {
    if (!currentLayout) return;
    const updatedButtons = currentLayout.buttons.filter(b => b.id !== buttonId);
    await updateLayoutButtons(currentLayout.id, updatedButtons);
  };

  const handleResizeButton = async (buttonId: string, newSize: 'sm' | 'md' | 'lg' | 'wide' | 'tile') => {
    if (!currentLayout) return;
    const updatedButtons = currentLayout.buttons.map(b => b.id === buttonId ? { ...b, size: newSize } : b);
    await updateLayoutButtons(currentLayout.id, updatedButtons);
  };

  const handleMoveButton = async (index: number, direction: 'left' | 'right') => {
    if (!currentLayout) return;
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= currentLayout.buttons.length) return;

    const list = [...currentLayout.buttons];
    const temp = list[index];
    list[index] = list[targetIdx];
    list[targetIdx] = temp;
    list.forEach((b, i) => { b.order = i; });

    await updateLayoutButtons(currentLayout.id, list);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-[#FFFFFF] font-rpg">
              Soundboard Dinâmico & Efeitos Sonoros
            </h2>
          </div>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            Crie múltiplos layouts temáticos, redimensione botões e dispare efeitos na mesa e Discord com 1 clique.
          </p>
        </div>

        {/* Audio Mode, Bot Status, and Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Discord Bot Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              botStatus.isOnline
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139]'
            }`}
            title={botStatus.isOnline ? `Bot conectado: ${botStatus.username}` : 'Bot desconectado do Discord'}
          >
            <Radio className={`w-3.5 h-3.5 ${botStatus.isOnline ? 'text-emerald-400 animate-pulse' : 'text-[#6E7681]'}`} />
            <span>{botStatus.isOnline ? 'Discord: Online' : 'Discord: Offline'}</span>
          </div>

          {/* Local Audio Toggle Button */}
          <button
            onClick={toggleLocalAudio}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
              isLocalAudioEnabled
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
                : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white'
            }`}
            title={isLocalAudioEnabled ? 'Áudio tocando no seu navegador e no Discord' : 'Áudio tocando SOMENTE no bot do Discord'}
          >
            <Headphones className="w-3.5 h-3.5" />
            <span>{isLocalAudioEnabled ? 'Ouvindo no Navegador (Preview ON)' : 'Somente no Discord (Local OFF)'}</span>
          </button>

          {/* Import Folder Button */}
          <button
            onClick={() => setIsFolderImportOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
          >
            <FolderUp className="w-4 h-4" />
            Importar Pasta
          </button>

          {/* New Sound Button */}
          <button
            id="btn-add-sfx"
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 whitespace-nowrap transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo Som
          </button>

          {/* Global Stop Button */}
          <button
            onClick={() => stopSoundboard()}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
              activeSfxIds.length > 0
                ? 'bg-rose-600 text-white border-rose-500 shadow-md shadow-rose-600/30 animate-pulse'
                : 'bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border-rose-500/30'
            }`}
            title="Parar todos os efeitos sonoros em execução"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Parar Sons {activeSfxIds.length > 0 ? `(${activeSfxIds.length})` : ''}</span>
          </button>
        </div>
      </div>

      {/* Dynamic Soundboard Layouts Bar */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2D3139] pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider shrink-0 flex items-center gap-1 mr-1">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              Layouts:
            </span>

            {soundboardLayouts.map((layout) => {
              const isActive = layout.id === activeLayoutId;
              return (
                <button
                  key={layout.id}
                  onClick={() => setActiveLayoutId(layout.id)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 border border-indigo-400/40'
                      : 'bg-[#141619] border border-[#2D3139] text-[#9E9E9E] hover:text-white hover:border-[#3D424D]'
                  }`}
                  style={isActive && layout.themeColor ? { backgroundColor: layout.themeColor } : undefined}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                  {layout.name}
                  <span className="text-[10px] opacity-75 ml-0.5">({layout.buttons?.length || 0})</span>
                </button>
              );
            })}

            <button
              onClick={() => setIsLayoutModalOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-indigo-300 border border-dashed border-indigo-500/40 text-xs font-semibold transition-colors shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Novo Layout
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center">
            <button
              onClick={() => setIsEditMode(!isEditMode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isEditMode
                  ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                  : 'bg-[#141619] border-[#2D3139] text-[#9E9E9E] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              {isEditMode ? 'Concluir Edição' : 'Editar Botões & Tamanhos'}
            </button>

            {isEditMode && currentLayout && soundboardLayouts.length > 1 && (
              <button
                onClick={() => {
                  if (window.confirm(`Deseja excluir o layout "${currentLayout.name}"?`)) {
                    deleteSoundboardLayout(currentLayout.id);
                  }
                }}
                className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 text-rose-400 border border-rose-500/30 transition-colors"
                title="Excluir este layout"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Active Layout Grid */}
        <div>
          {currentLayout.description && (
            <p className="text-xs text-[#9E9E9E] mb-3">{currentLayout.description}</p>
          )}

          {currentLayout.buttons.length === 0 ? (
            <div className="p-8 text-center bg-[#141619] border border-dashed border-[#2D3139] rounded-xl">
              <LayoutGrid className="w-8 h-8 text-[#4E5460] mx-auto mb-2" />
              <p className="text-xs font-bold text-white">Este layout ainda não tem botões de áudio.</p>
              <p className="text-[11px] text-[#9E9E9E] mt-1 mb-3">
                Adicione efeitos sonoros da sua biblioteca para montar sua mesa rápida de combate ou exploração.
              </p>
              <button
                onClick={() => setIsAddButtonModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Adicionar Botão ao Layout
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 auto-rows-min">
              {currentLayout.buttons.map((btnConfig, idx) => {
                const item = soundboardItems.find(s => s.id === btnConfig.itemId);
                const isPlaying = activeSfxIds.includes(btnConfig.itemId);
                if (!item) return null;

                // Determine grid span based on button size
                let colSpan = 'col-span-1';
                let minHeight = 'h-24';
                if (btnConfig.size === 'sm') { minHeight = 'h-20'; }
                else if (btnConfig.size === 'lg') { colSpan = 'col-span-2 sm:col-span-2'; minHeight = 'h-28'; }
                else if (btnConfig.size === 'wide') { colSpan = 'col-span-2 sm:col-span-3'; minHeight = 'h-24'; }
                else if (btnConfig.size === 'tile') { colSpan = 'col-span-2'; minHeight = 'h-32'; }

                return (
                  <div
                    key={btnConfig.id}
                    className={`relative rounded-2xl border transition-all flex flex-col justify-between p-3.5 group overflow-hidden ${colSpan} ${minHeight} ${
                      isPlaying
                        ? 'border-indigo-400 bg-indigo-950/40 shadow-lg shadow-indigo-500/20 scale-[0.98]'
                        : 'border-[#2D3139] bg-[#141619] hover:border-[#4A5060] hover:bg-[#1A1D22]'
                    }`}
                  >
                    {/* Background accent glow */}
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none rounded-2xl"
                      style={{ backgroundColor: item.color || '#6366f1' }}
                    />

                    {/* Top row */}
                    <div className="flex items-start justify-between gap-1 z-10">
                      <span className="text-xl shrink-0">{item.emoji || '🔊'}</span>

                      {/* Edit controls if edit mode */}
                      {isEditMode ? (
                        <div className="flex items-center gap-1 bg-[#0F1113] p-1 rounded-lg border border-[#2D3139]">
                          <button
                            onClick={() => handleMoveButton(idx, 'left')}
                            disabled={idx === 0}
                            className="p-1 text-[#9E9E9E] hover:text-white disabled:opacity-30"
                            title="Mover para esquerda"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleMoveButton(idx, 'right')}
                            disabled={idx === currentLayout.buttons.length - 1}
                            className="p-1 text-[#9E9E9E] hover:text-white disabled:opacity-30"
                            title="Mover para direita"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                          {/* Size cycle */}
                          <button
                            onClick={() => {
                              const sizes: Array<'sm' | 'md' | 'lg' | 'wide' | 'tile'> = ['sm', 'md', 'lg', 'wide', 'tile'];
                              const nextSize = sizes[(sizes.indexOf(btnConfig.size || 'md') + 1) % sizes.length];
                              handleResizeButton(btnConfig.id, nextSize);
                            }}
                            className="p-1 text-indigo-400 hover:text-indigo-300"
                            title={`Tamanho atual: ${btnConfig.size || 'md'} (Clique para mudar)`}
                          >
                            <Maximize2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => handleRemoveButtonFromLayout(btnConfig.id)}
                            className="p-1 text-rose-400 hover:text-rose-300"
                            title="Remover do layout"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPlaying) stopSoundboard(item.id);
                            else playSoundboard(item);
                          }}
                          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                            isPlaying ? 'bg-rose-600 text-white animate-pulse shadow-sm shadow-rose-600/30' : 'bg-[#242830] text-[#9E9E9E] group-hover:text-white group-hover:bg-indigo-600'
                          }`}
                          title={isPlaying ? 'Parar este som' : 'Tocar este som'}
                        >
                          {isPlaying ? <Square className="w-3 h-3 fill-current" /> : <Play className="w-3 h-3 fill-current" />}
                        </button>
                      )}
                    </div>

                    {/* Bottom Title & Trigger */}
                    <button
                      onClick={() => {
                        if (!isEditMode) {
                          if (isPlaying) stopSoundboard(item.id);
                          else playSoundboard(item);
                        }
                      }}
                      disabled={isEditMode}
                      className="text-left w-full z-10 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <div className="font-bold text-xs text-white truncate">
                        {btnConfig.customName || item.name}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#9E9E9E] mt-0.5">
                        <span className="truncate">{item.duration}s</span>
                        {item.tags?.[0] && (
                          <span className="px-1.5 py-0.2 rounded bg-[#242830] text-[#8E95A5] text-[9px] truncate">
                            {item.tags[0]}
                          </span>
                        )}
                        {btnConfig.size && isEditMode && (
                          <span className="text-[9px] text-indigo-300 ml-auto font-mono">
                            [{btnConfig.size}]
                          </span>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}

              {/* Quick Add Button Tile */}
              <button
                onClick={() => setIsAddButtonModalOpen(true)}
                className="h-24 rounded-2xl border border-dashed border-[#2D3139] hover:border-indigo-500/70 hover:bg-[#1A1D22] transition-all flex flex-col items-center justify-center gap-1.5 text-[#9E9E9E] hover:text-white cursor-pointer group"
              >
                <Plus className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                <span className="text-[11px] font-bold">Adicionar Som</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Soundboard Master Library (Subfolders Organization) */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#2D3139] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white font-rpg flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-amber-400" />
              Biblioteca Completa de Áudios por Subpastas ({soundboardItems.length})
            </h3>
            <p className="text-xs text-[#9E9E9E]">Organização por categorias dentro de data/sfx/.</p>
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Filtrar biblioteca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141619] border border-[#2D3139] rounded-xl pl-8 pr-3 py-1.5 text-xs text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Subfolder Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedFolderId('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedFolderId === 'all'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Todos ({soundboardItems.length})
          </button>

          {sfxFolders.map((f) => {
            const count = soundboardItems.filter(s => s.folderId === f.id).length;
            const isSelected = selectedFolderId === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setSelectedFolderId(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                  isSelected
                    ? 'bg-[#242830] text-white border border-indigo-500 shadow-sm'
                    : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: f.color }} />
                {f.name}
                <span className="text-[10px] text-[#6E7681]">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Library Table / Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
          {filteredLibraryItems.map((item) => {
            const isPlaying = activeSfxIds.includes(item.id);
            return (
              <div
                key={item.id}
                className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-[#3D424D] transition-all flex items-center justify-between gap-3 group"
              >
                <button
                  onClick={() => (isPlaying ? stopSoundboard(item.id) : playSoundboard(item))}
                  className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                >
                  <span className="text-xl shrink-0">{item.emoji || '🔊'}</span>
                  <div className="min-w-0">
                    <div className={`text-xs font-bold transition-colors truncate ${isPlaying ? 'text-indigo-400 font-extrabold animate-pulse' : 'text-white group-hover:text-indigo-400'}`}>
                      {item.name}
                    </div>
                    <div className="text-[10px] text-[#8E95A5] flex items-center gap-2">
                      <span>{item.duration}s</span>
                      {item.isLocal && <span className="text-emerald-400 font-mono">Local</span>}
                      {isPlaying && <span className="text-rose-400 font-semibold">• Tocando</span>}
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => (isPlaying ? stopSoundboard(item.id) : playSoundboard(item))}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      isPlaying ? 'bg-rose-600 text-white shadow-sm shadow-rose-600/30 animate-pulse' : 'bg-[#242830] text-[#9E9E9E] hover:text-white group-hover:bg-indigo-600'
                    }`}
                    title={isPlaying ? 'Parar som' : 'Tocar som'}
                  >
                    {isPlaying ? <Square className="w-3.5 h-3.5 fill-current" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                  </button>

                  <button
                    onClick={() => handleAddButtonToLayout(item)}
                    className="p-1.5 rounded-lg bg-[#242830] hover:bg-indigo-600 text-[#9E9E9E] hover:text-white transition-colors"
                    title="Adicionar ao layout ativo"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => {
                      if (window.confirm(`Excluir ${item.name}?`)) deleteSoundboardItem(item.id);
                    }}
                    className="p-1.5 rounded-lg bg-[#242830] hover:bg-rose-950/50 text-[#9E9E9E] hover:text-rose-400 transition-colors"
                    title="Excluir som"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* New Layout Modal */}
      {isLayoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#141619] border border-[#2D3139] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <h3 className="text-sm font-bold text-white font-rpg flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-indigo-400" />
                Criar Novo Layout Temático
              </h3>
              <button onClick={() => setIsLayoutModalOpen(false)} className="text-[#9E9E9E] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateLayout} className="space-y-3">
              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">Nome do Layout *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Combate contra o Chefe Final"
                  value={newLayoutName}
                  onChange={(e) => setNewLayoutName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">Descrição / Tema</label>
                <input
                  type="text"
                  placeholder="Ex: Botões rápidos para magias arcanas de fogo e impacto"
                  value={newLayoutDesc}
                  onChange={(e) => setNewLayoutDesc(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">Cor do Tema</label>
                <div className="flex items-center gap-2">
                  {['#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#8b5cf6', '#ec4899'].map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => setNewLayoutColor(c)}
                      className={`w-6 h-6 rounded-full border-2 ${newLayoutColor === c ? 'border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsLayoutModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#242830] text-xs text-[#9E9E9E] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
                >
                  Salvar Layout
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Button to Layout Picker Modal */}
      {isAddButtonModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#141619] border border-[#2D3139] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <h3 className="text-sm font-bold text-white font-rpg">
                Escolher Som para o Layout: {currentLayout?.name}
              </h3>
              <button onClick={() => setIsAddButtonModalOpen(false)} className="text-[#9E9E9E] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {soundboardItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleAddButtonToLayout(item)}
                  className="w-full p-3 rounded-xl bg-[#1A1D21] hover:bg-indigo-950/40 border border-[#2D3139] hover:border-indigo-500/50 transition-all flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{item.emoji || '🔊'}</span>
                    <div>
                      <div className="text-xs font-bold text-white group-hover:text-indigo-400">{item.name}</div>
                      <div className="text-[10px] text-[#9E9E9E]">{item.duration}s • {item.tags.join(', ')}</div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-indigo-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Single SFX Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-[#141619] border border-[#2D3139] rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <h3 className="text-sm font-bold text-white font-rpg flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-indigo-400" />
                Cadastrar Novo Efeito Sonoro
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-[#9E9E9E] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSfx} className="space-y-3">
              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">Nome do Efeito Sonoro *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Impacto Crítico de Espada"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-[#9E9E9E] mb-1">Emoji / Ícone</label>
                  <input
                    type="text"
                    value={newEmoji}
                    onChange={(e) => setNewEmoji(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-[#9E9E9E] mb-1">Subpasta / Categoria</label>
                  <select
                    value={newFolderId}
                    onChange={(e) => setNewFolderId(e.target.value)}
                    className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">(Sem categoria)</option>
                    {sfxFolders.map((f) => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">URL do Áudio ou Upload Local *</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="https://... ou faça upload"
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="flex-1 bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-3 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-xs text-indigo-300 font-semibold flex items-center gap-1 border border-[#2D3139]"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {isUploading ? 'Enviando...' : 'Arquivo'}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="audio/*"
                    className="hidden"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#9E9E9E] mb-1">Tags (separadas por vírgula)</label>
                <input
                  type="text"
                  placeholder="Combate, Espada, Sangue"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-1.5 rounded-xl bg-[#242830] text-xs text-[#9E9E9E] hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-bold text-white shadow-md shadow-indigo-600/30"
                >
                  Cadastrar Som
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
        defaultCategory="sfx"
      />
    </div>
  );
};

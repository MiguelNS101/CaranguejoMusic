import React, { useState, useRef } from 'react';
import {
  Users,
  ImageIcon,
  Plus,
  Trash2,
  Edit2,
  Send,
  Eye,
  EyeOff,
  Search,
  Upload,
  FolderOpen,
  Shield,
  Heart,
  Swords,
  Scale,
  Sparkles,
  Quote,
  FolderUp,
  Maximize2,
  X,
  MapPin,
  Layers,
  FileText
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { NPC } from '../types';
import { FolderImportModal } from './FolderImportModal';
import { apiFetch, resolveApiUrl } from '../services/api';

export const NpcView: React.FC = () => {
  const {
    npcs,
    folders,
    createNpc,
    updateNpc,
    deleteNpc,
    postNpcToDiscord,
    botStatus
  } = useAudio();

  // Top Sub-Tabs: 'npcs' or 'general'
  const [activeSubTab, setActiveSubTab] = useState<'npcs' | 'general'>('npcs');

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFolderImportOpen, setIsFolderImportOpen] = useState<boolean>(false);
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [postingNpcId, setPostingNpcId] = useState<string | null>(null);
  const [fullscreenImage, setFullscreenImage] = useState<{ url: string; title: string } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [secretDmNotes, setSecretDmNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [folderId, setFolderId] = useState('');
  const [tags, setTags] = useState('');
  const [alignment, setAlignment] = useState('Neutro');
  const [race, setRace] = useState('');
  const [classOrType, setClassOrType] = useState('');
  const [hp, setHp] = useState<number>(30);
  const [ac, setAc] = useState<number>(14);
  const [cr, setCr] = useState('');
  const [quote, setQuote] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isBatchUploading, setIsBatchUploading] = useState(false);
  const [autoNameNotice, setAutoNameNotice] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const batchImagesInputRef = useRef<HTMLInputElement>(null);

  const npcFolders = folders.filter(f => f.type === 'npc');

  // Count items by category
  const npcList = npcs.filter(n => !n.isGeneralImage);
  const generalImageList = npcs.filter(n => n.isGeneralImage);

  const cleanFileNameToNpcName = (filename: string): string => {
    let base = filename.replace(/\.[^/.]+$/, '');
    base = base.replace(/^\d+[\s._-]+/, '');
    base = base.replace(/[_-]+/g, ' ').trim();
    if (!base) return 'Novo Item';
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const currentPool = activeSubTab === 'npcs' ? npcList : generalImageList;

  const filteredItems = currentPool.filter(item => {
    const matchesFolder = selectedFolderId === 'all' || item.folderId === selectedFolderId;
    const matchesSearch = searchQuery === '' ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (item.race && item.race.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingNpcId(null);
    setName('');
    setTitle(activeSubTab === 'npcs' ? '' : 'Cenário / Mapa');
    setDescription('');
    setSecretDmNotes('');
    setImageUrl('');
    setFolderId(selectedFolderId !== 'all' ? selectedFolderId : '');
    setTags('');
    setAlignment('Neutro');
    setRace('');
    setClassOrType('');
    setHp(30);
    setAc(14);
    setCr(activeSubTab === 'npcs' ? 'ND 2' : '');
    setQuote('');
    setAutoNameNotice(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: NPC) => {
    setEditingNpcId(item.id);
    setName(item.name);
    setTitle(item.title || '');
    setDescription(item.description);
    setSecretDmNotes(item.secretDmNotes || '');
    setImageUrl(item.imageUrl);
    setFolderId(item.folderId || '');
    setTags(item.tags.join(', '));
    setAlignment(item.alignment || 'Neutro');
    setRace(item.race || '');
    setClassOrType(item.classOrType || '');
    setHp(item.hp || 30);
    setAc(item.ac || 14);
    setCr(item.cr || '');
    setQuote(item.quote || '');
    setAutoNameNotice(null);
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await apiFetch(`/api/upload?type=${activeSubTab === 'npcs' ? 'npc' : 'npc'}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.url);
        const autoExtracted = cleanFileNameToNpcName(file.name);
        if (!name || name === 'Novo Personagem' || name === 'Nova Imagem') {
          setName(autoExtracted);
          setAutoNameNotice(`Nome preenchido automaticamente como "${autoExtracted}"`);
        }
      }
    } catch (err) {
      console.error('Image upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  // 1-Click Fast Batch Images Import
  const handleBatchImagesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsBatchUploading(true);
    const fileList: File[] = Array.from(files);

    try {
      const formData = new FormData();
      fileList.forEach(f => formData.append('files', f, f.name));
      if (selectedFolderId && selectedFolderId !== 'all') {
        formData.append('folderId', selectedFolderId);
      }
      if (activeSubTab === 'general') {
        formData.append('isGeneralImage', 'true');
      }

      const res = await apiFetch(`/api/upload/bulk?type=${activeSubTab === 'general' ? 'image' : 'npc'}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Batch import error:', err);
    } finally {
      setIsBatchUploading(false);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || (activeSubTab === 'npcs' ? 'Personagem Sem Nome' : 'Imagem Sem Título');
    const finalDesc = description.trim() || (activeSubTab === 'npcs' ? 'Ficha de personagem criada pelo Mestre.' : 'Imagem / Cenário da mesa de RPG.');

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload: Partial<NPC> = {
      name: finalName,
      title: title.trim() || undefined,
      description: finalDesc,
      secretDmNotes: secretDmNotes.trim() || undefined,
      imageUrl: imageUrl.trim() || '',
      folderId: folderId || undefined,
      tags: tagsArray,
      isGeneralImage: activeSubTab === 'general',
      alignment: activeSubTab === 'npcs' ? (alignment.trim() || undefined) : undefined,
      race: activeSubTab === 'npcs' ? (race.trim() || undefined) : undefined,
      classOrType: activeSubTab === 'npcs' ? (classOrType.trim() || undefined) : undefined,
      hp: activeSubTab === 'npcs' ? (hp || 20) : undefined,
      maxHp: activeSubTab === 'npcs' ? (hp || 20) : undefined,
      ac: activeSubTab === 'npcs' ? (ac || 12) : undefined,
      cr: activeSubTab === 'npcs' ? (cr.trim() || undefined) : undefined,
      quote: activeSubTab === 'npcs' ? (quote.trim() || undefined) : undefined
    };

    if (editingNpcId) {
      await updateNpc(editingNpcId, payload);
    } else {
      await createNpc(payload);
    }

    setIsModalOpen(false);
  };

  const handlePostItem = async (item: NPC) => {
    setPostingNpcId(item.id);
    await postNpcToDiscord(item.id);
    setPostingNpcId(null);
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Navigation Sub-Tabs: NPCs vs Imagens em Geral */}
      <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setActiveSubTab('npcs');
              setSelectedFolderId('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'npcs'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#1A1D21] text-zinc-400 hover:text-white border border-[#2D3139]'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>NPCs & Criaturas</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/30">
              {npcList.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveSubTab('general');
              setSelectedFolderId('all');
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
              activeSubTab === 'general'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'bg-[#1A1D21] text-zinc-400 hover:text-white border border-[#2D3139]'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Imagens em Geral (Mapas & Cenários)</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full bg-black/30">
              {generalImageList.length}
            </span>
          </button>
        </div>

        {/* Discord Bot Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-400 font-medium">Postagem com 1-Clique no Discord Ativa</span>
        </div>
      </div>

      {/* Action Header & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            {activeSubTab === 'npcs' ? (
              <Users className="w-5 h-5 text-indigo-400" />
            ) : (
              <ImageIcon className="w-5 h-5 text-cyan-400" />
            )}
            <h2 className="text-base font-bold text-[#FFFFFF] font-rpg">
              {activeSubTab === 'npcs'
                ? 'Catálogo de NPCs, Monstros & Fichas do Mestre'
                : 'Galeria de Imagens, Cenários, Mapas & Pistas'}
            </h2>
          </div>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            {activeSubTab === 'npcs'
              ? 'Organize retratos, segredos de enredo e envie as fichas instantaneamente para o chat do Discord.'
              : 'Gerencie ilustrações de lugares, mapas de batalha, pistas e itens para projetar aos jogadores no Discord.'}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={activeSubTab === 'npcs' ? 'Buscar NPC por nome, raça...' : 'Buscar imagem, mapa, tag...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#141619] border border-[#2D3139] rounded-xl pl-9 pr-3 py-2 text-xs text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500/70"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="file"
              ref={batchImagesInputRef}
              onChange={handleBatchImagesSelected}
              accept="image/*"
              multiple
              className="hidden"
            />

            <button
              onClick={() => batchImagesInputRef.current?.click()}
              disabled={isBatchUploading}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-semibold transition-colors cursor-pointer"
              title="Selecione múltiplas imagens de uma vez para importação automática!"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isBatchUploading
                ? 'Importando...'
                : activeSubTab === 'npcs'
                ? '⚡ Importar Retratos Auto'
                : '⚡ Importar Imagens Auto'}
            </button>

            <button
              onClick={() => setIsFolderImportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              Importar Pasta
            </button>

            <button
              id={activeSubTab === 'npcs' ? 'btn-add-npc' : 'btn-add-general-image'}
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {activeSubTab === 'npcs' ? 'Criar NPC' : 'Adicionar Imagem'}
            </button>
          </div>
        </div>
      </div>

      {/* Folders Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedFolderId('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
            selectedFolderId === 'all'
              ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500/40 shadow-sm'
              : 'bg-[#1A1D21] text-[#9E9E9E] border-[#2D3139] hover:border-[#363B44] hover:text-[#FFFFFF]'
          }`}
        >
          {activeSubTab === 'npcs' ? `Todos os NPCs (${npcList.length})` : `Todas as Imagens (${generalImageList.length})`}
        </button>

        {npcFolders.map(folder => {
          const count = currentPool.filter(n => n.folderId === folder.id).length;
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
                style={{ backgroundColor: folder.color || '#10b981' }}
              />
              {folder.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Cards Grid: NPCs or General Images */}
      {activeSubTab === 'npcs' ? (
        /* NPCs Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.length === 0 ? (
            <div className="col-span-full p-12 text-center text-[#9E9E9E] text-xs bg-[#1A1D21]/60 border border-[#2D3139] rounded-2xl">
              Nenhum personagem encontrado nesta categoria ou busca.
            </div>
          ) : (
            filteredItems.map((npc) => {
              const isSecretRevealed = !!revealedSecrets[npc.id];
              const isPosting = postingNpcId === npc.id;

              return (
                <div
                  key={npc.id}
                  className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 flex flex-col justify-between shadow-lg hover:border-[#363B44] transition-all group"
                >
                  <div>
                    {/* Portrait & Core Stats */}
                    <div className="flex items-start gap-3.5 mb-3">
                      <div
                        onClick={() => npc.imageUrl && setFullscreenImage({ url: npc.imageUrl, title: npc.name })}
                        className="relative w-20 h-24 rounded-xl overflow-hidden bg-[#141619] border border-[#2D3139] shrink-0 shadow-md flex items-center justify-center cursor-pointer group/img"
                        title="Clique para visualizar em tela cheia"
                      >
                        {npc.imageUrl ? (
                          <>
                            <img
                              src={npc.imageUrl}
                              alt={npc.name}
                              className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-300"
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-4 h-4 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-indigo-950/40 to-[#141619] text-indigo-400">
                            <Users className="w-7 h-7 opacity-60 mb-1" />
                            <span className="text-[9px] font-bold uppercase tracking-wider text-indigo-300/70">NPC</span>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400">
                            {npc.alignment || 'Neutro'}
                          </span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditModal(npc)}
                              className="p-1 text-[#9E9E9E] hover:text-[#FFFFFF] cursor-pointer"
                              title="Editar NPC"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => deleteNpc(npc.id)}
                              className="p-1 text-[#9E9E9E] hover:text-rose-400 cursor-pointer"
                              title="Excluir NPC"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <h3 className="text-sm font-bold text-[#FFFFFF] font-rpg truncate mt-0.5">
                          {npc.name}
                        </h3>
                        <p className="text-[11px] text-[#9E9E9E] truncate">
                          {npc.title || `${npc.race || 'Criatura'} • ${npc.classOrType || 'Especial'}`}
                        </p>

                        {/* Stat badges */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-2">
                          {npc.ac && (
                            <span className="text-[10px] font-mono bg-[#141619] text-[#E0E0E0] border border-[#2D3139] px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Shield className="w-2.5 h-2.5 text-[#9E9E9E]" />
                              CA {npc.ac}
                            </span>
                          )}
                          {npc.hp && (
                            <span className="text-[10px] font-mono bg-rose-950/40 text-rose-300 border border-rose-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Heart className="w-2.5 h-2.5 text-rose-400" />
                              PV {npc.hp}
                            </span>
                          )}
                          {npc.cr && (
                            <span className="text-[10px] font-mono bg-indigo-950/40 text-indigo-300 border border-indigo-800/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                              <Swords className="w-2.5 h-2.5 text-indigo-400" />
                              {npc.cr}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Lore Description */}
                    <p className="text-xs text-[#E0E0E0] line-clamp-3 leading-relaxed mb-3">
                      {npc.description}
                    </p>

                    {/* Quote */}
                    {npc.quote && (
                      <div className="p-2 bg-[#141619] border border-[#2D3139] rounded-xl text-xs text-[#9E9E9E] italic mb-3 flex items-start gap-1.5">
                        <Quote className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                        <span>"{npc.quote}"</span>
                      </div>
                    )}

                    {/* Secret DM Notes */}
                    {npc.secretDmNotes && (
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => toggleSecret(npc.id)}
                          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                        >
                          {isSecretRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {isSecretRevealed ? 'Ocultar Segredos do Mestre' : 'Ver Segredos do Mestre'}
                        </button>

                        {isSecretRevealed && (
                          <div className="mt-2 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
                            🔒 <strong>Segredos da Trama:</strong> {npc.secretDmNotes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 1-Click Discord Broadcast Button (Image only, no spoilers) */}
                  <div className="pt-2 border-t border-[#2D3139]">
                    <button
                      onClick={() => handlePostItem(npc)}
                      disabled={isPosting}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
                      title="Envia SOMENTE o retrato do NPC ao Discord (sem nome nem texto de ficha, protegido contra spoilers)"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isPosting ? 'Enviando Imagem...' : '1-Clique: Postar Imagem no Discord'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        /* General Images & Scenery Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.length === 0 ? (
            <div className="col-span-full p-12 text-center text-[#9E9E9E] text-xs bg-[#1A1D21]/60 border border-[#2D3139] rounded-2xl">
              Nenhuma imagem ou cenário cadastrado nesta categoria. Clique em "Adicionar Imagem" ou use a importação automática.
            </div>
          ) : (
            filteredItems.map((imgItem) => {
              const isSecretRevealed = !!revealedSecrets[imgItem.id];
              const isPosting = postingNpcId === imgItem.id;

              return (
                <div
                  key={imgItem.id}
                  className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl overflow-hidden flex flex-col justify-between shadow-lg hover:border-[#363B44] transition-all group"
                >
                  <div>
                    {/* Wide Image Preview (Ideal for Maps, Scenes & Handouts) */}
                    <div
                      onClick={() => imgItem.imageUrl && setFullscreenImage({ url: imgItem.imageUrl, title: imgItem.name })}
                      className="relative w-full h-44 bg-[#141619] overflow-hidden cursor-pointer group/preview border-b border-[#2D3139]"
                      title="Clique para expandir em tela cheia"
                    >
                      {imgItem.imageUrl ? (
                        <>
                          <img
                            src={imgItem.imageUrl}
                            alt={imgItem.name}
                            className="w-full h-full object-cover group-hover/preview:scale-105 transition-transform duration-300"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 flex items-center justify-center transition-opacity">
                            <span className="px-3 py-1.5 rounded-xl bg-black/70 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 backdrop-blur-sm">
                              <Maximize2 className="w-3.5 h-3.5" />
                              Visualizar em Tela Cheia
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                          <ImageIcon className="w-8 h-8 opacity-40 mb-1" />
                          <span className="text-xs">Sem imagem vinculada</span>
                        </div>
                      )}

                      {/* Category Badge Floating on Image */}
                      <span className="absolute top-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/75 backdrop-blur-sm text-cyan-300 border border-cyan-500/40 text-[10px] font-bold uppercase tracking-wider">
                        {imgItem.title || 'Cenário / Mapa'}
                      </span>
                    </div>

                    {/* Image Info & Controls */}
                    <div className="p-4 space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-white font-rpg truncate">
                          {imgItem.name}
                        </h3>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditModal(imgItem)}
                            className="p-1 text-[#9E9E9E] hover:text-white cursor-pointer"
                            title="Editar Imagem"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteNpc(imgItem.id)}
                            className="p-1 text-[#9E9E9E] hover:text-rose-400 cursor-pointer"
                            title="Excluir Imagem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {imgItem.description && (
                        <p className="text-xs text-[#E0E0E0] line-clamp-2 leading-relaxed">
                          {imgItem.description}
                        </p>
                      )}

                      {/* Tags */}
                      {imgItem.tags && imgItem.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {imgItem.tags.map((t, idx) => (
                            <span key={idx} className="text-[10px] bg-[#141619] text-[#9E9E9E] border border-[#2D3139] px-2 py-0.5 rounded">
                              #{t}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Secret DM Notes */}
                      {imgItem.secretDmNotes && (
                        <div>
                          <button
                            type="button"
                            onClick={() => toggleSecret(imgItem.id)}
                            className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold cursor-pointer"
                          >
                            {isSecretRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            {isSecretRevealed ? 'Ocultar Pistas Secretas' : 'Ver Pistas Secretas do Mestre'}
                          </button>

                          {isSecretRevealed && (
                            <div className="mt-2 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-xl text-xs text-amber-200 leading-relaxed">
                              🔒 <strong>Pistas / Segredos:</strong> {imgItem.secretDmNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 1-Click Discord Broadcast Button */}
                  <div className="p-3 pt-0">
                    <button
                      onClick={() => handlePostItem(imgItem)}
                      disabled={isPosting}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition-all shadow-sm shadow-cyan-600/30 cursor-pointer disabled:opacity-50"
                      title="Projeta esta imagem / mapa diretamente no Discord dos jogadores"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {isPosting ? 'Transmitindo...' : '1-Clique: Projetar Imagem no Discord'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Add / Edit Modal (Unified for NPCs or General Images) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                {activeSubTab === 'npcs' ? (
                  <Users className="w-5 h-5 text-indigo-400" />
                ) : (
                  <ImageIcon className="w-5 h-5 text-cyan-400" />
                )}
                <h3 className="text-base font-bold text-[#FFFFFF] font-rpg">
                  {editingNpcId
                    ? activeSubTab === 'npcs' ? 'Editar Ficha do NPC' : 'Editar Imagem / Cenário'
                    : activeSubTab === 'npcs' ? 'Criar Novo Personagem / Monstro' : 'Adicionar Nova Imagem / Cenário'}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-[#9E9E9E] hover:text-[#FFFFFF]"
              >
                ✕
              </button>
            </div>

            {autoNameNotice && (
              <div className="bg-indigo-950/60 border border-indigo-500/40 rounded-xl px-3 py-2 text-xs text-indigo-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>{autoNameNotice}</span>
              </div>
            )}

            <form onSubmit={handleSaveItem} className="space-y-4">
              {/* Image Upload or URL */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  1. Imagem / {activeSubTab === 'npcs' ? 'Retrato do Personagem' : 'Arquivo Visual'}
                </label>
                <div className="space-y-2">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-[#2D3139] hover:border-indigo-500/60 rounded-xl p-4 text-center cursor-pointer bg-[#141619] transition-colors"
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleImageUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    {isUploading ? (
                      <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-400">
                        <span className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
                        Carregando imagem...
                      </div>
                    ) : imageUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        <img
                          src={imageUrl}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-[#2D3139]"
                        />
                        <div className="text-left">
                          <p className="text-xs text-emerald-400 font-bold">Imagem Carregada</p>
                          <p className="text-[10px] text-[#9E9E9E] truncate max-w-xs">{imageUrl}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 text-[#9E9E9E] mx-auto" />
                        <p className="text-xs text-[#E0E0E0] font-medium">
                          Clique para selecionar do computador
                        </p>
                        <p className="text-[10px] text-[#9E9E9E]">PNG, JPG, WEBP, GIF</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#9E9E9E] uppercase font-bold">Ou URL externa:</span>
                    <input
                      type="text"
                      placeholder="https://exemplo.com/imagem.png"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="flex-1 bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    />
                  </div>
                </div>
              </div>

              {/* Title & Category */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    {activeSubTab === 'npcs' ? 'Nome do Personagem *' : 'Título da Imagem / Cenário *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={activeSubTab === 'npcs' ? 'Ex: Lorde Cassian' : 'Ex: Mapa das Catacumbas'}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    {activeSubTab === 'npcs' ? 'Título / Ocupação' : 'Categoria / Tipo'}
                  </label>
                  <input
                    type="text"
                    placeholder={activeSubTab === 'npcs' ? 'Ex: Taverneiro & Informante' : 'Ex: Mapa de Batalha, Cenário, Pista, Item'}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* RPG Stats - Only for NPCs */}
              {activeSubTab === 'npcs' && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">Tendência</label>
                      <select
                        value={alignment}
                        onChange={(e) => setAlignment(e.target.value)}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                      >
                        <option value="Leal e Bom">Leal e Bom</option>
                        <option value="Neutro e Bom">Neutro e Bom</option>
                        <option value="Caótico e Bom">Caótico e Bom</option>
                        <option value="Leal e Neutro">Leal e Neutro</option>
                        <option value="Neutro">Neutro</option>
                        <option value="Caótico e Neutro">Caótico e Neutro</option>
                        <option value="Leal e Mau">Leal e Mau</option>
                        <option value="Neutro e Mau">Neutro e Mau</option>
                        <option value="Caótico e Mau">Caótico e Mau</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">Raça / Espécie</label>
                      <input
                        type="text"
                        placeholder="Ex: Humano, Elfo..."
                        value={race}
                        onChange={(e) => setRace(e.target.value)}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">Classe / Tipo</label>
                      <input
                        type="text"
                        placeholder="Ex: Ladino, Mago..."
                        value={classOrType}
                        onChange={(e) => setClassOrType(e.target.value)}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-[#141619]/50 p-3 rounded-xl border border-[#2D3139]">
                    <div>
                      <label className="text-[11px] font-bold text-rose-300 block mb-1">Pontos de Vida (PV)</label>
                      <input
                        type="number"
                        min="1"
                        value={hp}
                        onChange={(e) => setHp(parseInt(e.target.value, 10) || 1)}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-[#E0E0E0] block mb-1">Classe de Armadura (CA)</label>
                      <input
                        type="number"
                        min="1"
                        value={ac}
                        onChange={(e) => setAc(parseInt(e.target.value, 10) || 10)}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-bold text-indigo-300 block mb-1">Nível de Desafio (ND / CR)</label>
                      <input
                        type="text"
                        placeholder="ND 2"
                        value={cr}
                        onChange={(e) => setCr(e.target.value)}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 text-center font-mono"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Description & Lore */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  {activeSubTab === 'npcs' ? 'Descrição & Lore' : 'Descrição / Contexto Narrativo'} <span className="text-[#9E9E9E] font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder={activeSubTab === 'npcs' ? 'Descreva a aparência física, postura e impressões do NPC...' : 'Descreva a atmosfera, iluminação, perigos visíveis ou pistas encontradas neste cenário...'}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-2.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                />
              </div>

              {/* Secret DM Notes */}
              <div>
                <label className="text-xs font-semibold text-amber-400 block mb-1">
                  🔒 Segredos & Fraquezas (Apenas para os olhos do Mestre)
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações que os jogadores NÃO sabem a menos que investiguem..."
                  value={secretDmNotes}
                  onChange={(e) => setSecretDmNotes(e.target.value)}
                  className="w-full bg-[#141619] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Folder & Tags */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Pasta de Organização
                  </label>
                  <select
                    value={folderId}
                    onChange={(e) => setFolderId(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  >
                    <option value="">Sem Pasta (Geral)</option>
                    {npcFolders.map(f => (
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
                    placeholder="mapa, taverna, caverna, chefe"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#2D3139]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 cursor-pointer"
                >
                  {editingNpcId ? 'Salvar Alterações' : activeSubTab === 'npcs' ? 'Criar NPC' : 'Salvar Imagem'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lightbox / Fullscreen Image Zoom Modal */}
      {fullscreenImage && (
        <div
          onClick={() => setFullscreenImage(null)}
          className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4 animate-fade-in"
        >
          <div className="absolute top-4 right-4 flex items-center gap-3">
            <span className="text-xs text-zinc-400 font-medium">{fullscreenImage.title}</span>
            <button
              onClick={() => setFullscreenImage(null)}
              className="p-2 rounded-xl bg-[#1A1D21] border border-[#2D3139] text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={fullscreenImage.url}
            alt={fullscreenImage.title}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-[#2D3139]"
            onClick={(e) => e.stopPropagation()}
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      {/* Folder Batch Import Modal */}
      <FolderImportModal
        isOpen={isFolderImportOpen}
        onClose={() => setIsFolderImportOpen(false)}
        defaultCategory="npc"
      />
    </div>
  );
};

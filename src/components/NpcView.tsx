import React, { useState, useRef } from 'react';
import {
  Users,
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
  FolderUp
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

  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isFolderImportOpen, setIsFolderImportOpen] = useState<boolean>(false);
  const [editingNpcId, setEditingNpcId] = useState<string | null>(null);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [postingNpcId, setPostingNpcId] = useState<string | null>(null);

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

  const cleanFileNameToNpcName = (filename: string): string => {
    let base = filename.replace(/\.[^/.]+$/, '');
    base = base.replace(/^\d+[\s._-]+/, '');
    base = base.replace(/[_-]+/g, ' ').trim();
    if (!base) return 'Novo Personagem';
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const filteredNpcs = npcs.filter(npc => {
    const matchesFolder = selectedFolderId === 'all' || npc.folderId === selectedFolderId;
    const matchesSearch = searchQuery === '' ||
      npc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (npc.title && npc.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (npc.race && npc.race.toLowerCase().includes(searchQuery.toLowerCase())) ||
      npc.tags.some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesFolder && matchesSearch;
  });

  const handleOpenCreateModal = () => {
    setEditingNpcId(null);
    setName('');
    setTitle('');
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
    setCr('ND 2');
    setQuote('');
    setAutoNameNotice(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (npc: NPC) => {
    setEditingNpcId(npc.id);
    setName(npc.name);
    setTitle(npc.title || '');
    setDescription(npc.description);
    setSecretDmNotes(npc.secretDmNotes || '');
    setImageUrl(npc.imageUrl);
    setFolderId(npc.folderId || '');
    setTags(npc.tags.join(', '));
    setAlignment(npc.alignment || 'Neutro');
    setRace(npc.race || '');
    setClassOrType(npc.classOrType || '');
    setHp(npc.hp || 30);
    setAc(npc.ac || 14);
    setCr(npc.cr || '');
    setQuote(npc.quote || '');
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
      const res = await apiFetch('/api/upload?type=npc', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        setImageUrl(data.url);
        const autoExtracted = cleanFileNameToNpcName(file.name);
        if (!name || name === 'Novo Personagem') {
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

  // 1-Click Fast Batch Images to NPCs
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

      const res = await apiFetch('/api/upload/bulk?type=npc', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (data.success) {
        window.location.reload();
      }
    } catch (err) {
      console.error('Batch NPC import error:', err);
    } finally {
      setIsBatchUploading(false);
    }
  };

  const handleSaveNpc = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = name.trim() || 'Personagem Sem Nome';
    const finalDesc = description.trim() || 'Ficha de personagem criada pelo Mestre.';

    const tagsArray = tags.split(',').map(t => t.trim()).filter(Boolean);

    const payload: Partial<NPC> = {
      name: finalName,
      title: title.trim() || undefined,
      description: finalDesc,
      secretDmNotes: secretDmNotes.trim() || undefined,
      imageUrl: imageUrl.trim() || '',
      folderId: folderId || undefined,
      tags: tagsArray,
      alignment: alignment.trim() || undefined,
      race: race.trim() || undefined,
      classOrType: classOrType.trim() || undefined,
      hp: hp || 20,
      maxHp: hp || 20,
      ac: ac || 12,
      cr: cr.trim() || undefined,
      quote: quote.trim() || undefined
    };

    if (editingNpcId) {
      await updateNpc(editingNpcId, payload);
    } else {
      await createNpc(payload);
    }

    setIsModalOpen(false);
  };

  const handlePostNpc = async (npc: NPC) => {
    setPostingNpcId(npc.id);
    const res = await postNpcToDiscord(npc.id);
    setPostingNpcId(null);
    if (res.success) {
      // Posted successfully
    }
  };

  const toggleSecret = (id: string) => {
    setRevealedSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-[#FFFFFF] font-rpg">
              Catálogo de NPCs, Monstros & Fichas do Mestre
            </h2>
          </div>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            Organize retratos, segredos de enredo e envie as fichas instantaneamente para o chat do Discord.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Search */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-[#9E9E9E] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar NPC por nome, raça..."
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
              title="Selecione múltiplos retratos de uma vez. O sistema cria os NPCs e extrai os nomes dos arquivos automaticamente!"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isBatchUploading ? 'Criando NPCs...' : '⚡ Importar Retratos Auto'}
            </button>

            <button
              onClick={() => setIsFolderImportOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-indigo-300 border border-indigo-500/30 text-xs font-semibold transition-colors cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              Importar Pasta
            </button>

            <button
              id="btn-add-npc"
              onClick={handleOpenCreateModal}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 whitespace-nowrap transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Criar NPC
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
          Todos os NPCs ({npcs.length})
        </button>

        {npcFolders.map(folder => {
          const count = npcs.filter(n => n.folderId === folder.id).length;
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

      {/* NPCs Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredNpcs.length === 0 ? (
          <div className="col-span-full p-12 text-center text-[#9E9E9E] text-xs bg-[#1A1D21]/60 border border-[#2D3139] rounded-2xl">
            Nenhum personagem encontrado nesta categoria.
          </div>
        ) : (
          filteredNpcs.map((npc) => {
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
                    <div className="relative w-20 h-24 rounded-xl overflow-hidden bg-[#141619] border border-[#2D3139] shrink-0 shadow-md flex items-center justify-center">
                      {npc.imageUrl ? (
                        <img
                          src={npc.imageUrl}
                          alt={npc.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          referrerPolicy="no-referrer"
                        />
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
                            className="p-1 text-[#9E9E9E] hover:text-[#FFFFFF]"
                            title="Editar NPC"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => deleteNpc(npc.id)}
                            className="p-1 text-[#9E9E9E] hover:text-rose-400"
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
                        className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 font-semibold"
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
                    onClick={() => handlePostNpc(npc)}
                    disabled={isPosting}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
                    title="Envia SOMENTE a imagem/retrato do NPC ao Discord (sem nome nem texto de ficha, protegido contra spoilers)"
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

      {/* Add / Edit NPC Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <h3 className="text-base font-bold text-[#FFFFFF] font-rpg">
                {editingNpcId ? 'Editar Ficha do NPC' : 'Criar Novo Personagem / Monstro'}
              </h3>
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

            <form onSubmit={handleSaveNpc} className="space-y-4">
              {/* Image Upload / URL */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Retrato / Imagem do Personagem
                </label>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-xl bg-[#141619] border border-[#2D3139] overflow-hidden shrink-0 flex items-center justify-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <Users className="w-6 h-6 text-indigo-400/60" />
                    )}
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <input
                      type="text"
                      placeholder="URL da Imagem (ou envie arquivo abaixo)"
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-lg px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center gap-1 text-xs bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] px-2.5 py-1 rounded-lg border border-[#2D3139] cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        {isUploading ? 'Enviando e extraindo nome...' : 'Carregar Imagem (Preenche Nome Auto)'}
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Name & Title */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Nome do NPC / Criatura *
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Lorde Malakor (preenchido auto pela imagem)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 font-semibold"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Título / Papel (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Taverneiro de Valfenda"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              {/* Stats: Race, Class, CA, PV, CR, Alignment */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Raça / Espécie (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Elfo, Anão..."
                    value={race}
                    onChange={(e) => setRace(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Classe / Tipo (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Mago, Guerreiro..."
                    value={classOrType}
                    onChange={(e) => setClassOrType(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Alinhamento (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Leal e Bom..."
                    value={alignment}
                    onChange={(e) => setAlignment(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Pontos de Vida (PV) (opcional)
                  </label>
                  <input
                    type="number"
                    value={hp}
                    onChange={(e) => setHp(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Classe de Armadura (CA) (opcional)
                  </label>
                  <input
                    type="number"
                    value={ac}
                    onChange={(e) => setAc(parseInt(e.target.value) || 0)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 font-mono text-center"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-[#9E9E9E] block mb-1">
                    Nível de Desafio (ND / CR) (opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="ND 5"
                    value={cr}
                    onChange={(e) => setCr(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 text-center font-mono"
                  />
                </div>
              </div>

              {/* Description & Lore */}
              <div>
                <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                  Descrição & Lore <span className="text-[#9E9E9E] font-normal">(opcional)</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Descreva a aparência física, roupas, postura e impressões do NPC (opcional)..."
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
                  placeholder="Segredos que os jogadores NÃO veem a menos que você revele..."
                  value={secretDmNotes}
                  onChange={(e) => setSecretDmNotes(e.target.value)}
                  className="w-full bg-[#141619] border border-amber-500/30 rounded-xl p-2.5 text-xs text-amber-200 focus:outline-none focus:border-amber-500/60"
                />
              </div>

              {/* Quote & Folder */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Fala Marcante / Citação
                  </label>
                  <input
                    type="text"
                    placeholder='"Vocês não deviam ter vindo aqui..."'
                    value={quote}
                    onChange={(e) => setQuote(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
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
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30"
                >
                  Salvar NPC
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
        defaultCategory="npc"
      />
    </div>
  );
};

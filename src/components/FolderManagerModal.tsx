import React, { useState } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
  Music,
  Sparkles,
  Users,
  Check,
  Folder,
  Info,
  X
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({ isOpen, onClose }) => {
  const { folders, createFolder, deleteFolder, updateFolder, musicTracks, soundboardItems, npcs } = useAudio();

  const [activeType, setActiveType] = useState<'music' | 'soundboard' | 'npc'>('music');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#6366f1');

  // Editing state
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingColor, setEditingColor] = useState('#6366f1');

  if (!isOpen) return null;

  const currentFolders = folders.filter(f => f.type === activeType);

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    await createFolder({
      name: newFolderName.trim(),
      type: activeType,
      color: newFolderColor
    });

    setNewFolderName('');
  };

  const handleStartEdit = (folder: any) => {
    setEditingFolderId(folder.id);
    setEditingName(folder.name);
    setEditingColor(folder.color || '#6366f1');
  };

  const handleSaveEdit = async (folderId: string) => {
    if (!editingName.trim()) return;
    if (updateFolder) {
      await updateFolder(folderId, {
        name: editingName.trim(),
        color: editingColor
      });
    }
    setEditingFolderId(null);
  };

  const getItemCount = (folderId: string) => {
    if (activeType === 'music') return musicTracks.filter(m => m.folderId === folderId).length;
    if (activeType === 'soundboard') return soundboardItems.filter(s => s.folderId === folderId).length;
    return npcs.filter(n => n.folderId === folderId).length;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-[#16181D] border border-[#2D3139] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5 text-zinc-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#282C34] pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FolderOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-rpg">
                Gerenciador de Pastas do Sistema
              </h3>
              <p className="text-xs text-zinc-400">
                Organize e categorize trilhas, efeitos e fichas de NPCs.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg hover:bg-[#282C34] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lightweight Storage Notice */}
        <div className="p-3.5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 flex items-start gap-2.5 text-xs text-zinc-300">
          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed text-[11px]">
            <strong className="text-indigo-200">Arquitetura Leve & Desacoplada:</strong> O bot e o servidor operam sem reter arquivos pesados internamente na imagem Docker. As pastas funcionam como coleções virtuais e categorias organizacionais para suas trilhas, efeitos de áudio e NPCs.
          </p>
        </div>

        {/* Type Switcher */}
        <div className="flex items-center gap-2 bg-[#121417] p-1.5 rounded-2xl border border-[#282C34]">
          <button
            type="button"
            onClick={() => {
              setActiveType('music');
              setEditingFolderId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === 'music'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Músicas
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('soundboard');
              setEditingFolderId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === 'soundboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Soundboard
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveType('npc');
              setEditingFolderId(null);
            }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeType === 'npc'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            NPCs
          </button>
        </div>

        {/* Create Folder Form */}
        <form onSubmit={handleCreateFolder} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#121417] border border-[#282C34] rounded-xl px-2 py-1 shrink-0">
            <input
              type="color"
              value={newFolderColor}
              onChange={(e) => setNewFolderColor(e.target.value)}
              className="w-6 h-6 rounded cursor-pointer bg-transparent border-0"
              title="Cor da Pasta"
            />
          </div>

          <input
            type="text"
            placeholder={`Nova categoria de ${activeType === 'music' ? 'Música' : activeType === 'soundboard' ? 'Efeito' : 'NPC'}...`}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 bg-[#121417] border border-[#282C34] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500/70"
            required
          />

          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/30 transition-colors whitespace-nowrap cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" />
            Criar Pasta
          </button>
        </form>

        {/* Folders List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {currentFolders.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-xs bg-[#121417] rounded-xl border border-[#282C34]">
              Nenhuma pasta cadastrada nesta categoria. Crie uma acima para organizar seus itens!
            </div>
          ) : (
            currentFolders.map((folder) => {
              const isEditing = editingFolderId === folder.id;

              if (isEditing) {
                return (
                  <div
                    key={folder.id}
                    className="p-2.5 bg-[#141619] border border-indigo-500/50 rounded-xl flex items-center gap-2"
                  >
                    <input
                      type="color"
                      value={editingColor}
                      onChange={(e) => setEditingColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer bg-transparent border-0 shrink-0"
                    />
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      className="flex-1 bg-[#121417] border border-zinc-700 rounded-lg px-2.5 py-1 text-xs text-white"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(folder.id)}
                      className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs"
                      title="Salvar"
                    >
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingFolderId(null)}
                      className="p-1.5 bg-zinc-700 hover:bg-zinc-600 text-zinc-300 rounded-lg text-xs"
                      title="Cancelar"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              }

              return (
                <div
                  key={folder.id}
                  className="p-3 bg-[#121417] border border-[#282C34] rounded-xl flex items-center justify-between gap-3 hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: folder.color || '#6366f1' }}
                    />
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100">
                        {folder.name}
                      </h4>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {getItemCount(folder.id)} itens associados
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(folder)}
                      className="p-1.5 text-zinc-400 hover:text-indigo-300 hover:bg-[#1A1D21] rounded-lg transition-colors cursor-pointer"
                      title="Editar Nome e Cor"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteFolder(folder.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-[#1A1D21] rounded-lg transition-colors cursor-pointer"
                      title="Excluir Pasta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#282C34]">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-[#22262B] hover:bg-[#2D3139] text-zinc-200 text-xs font-semibold rounded-xl border border-[#2D3139] transition-colors cursor-pointer"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
};

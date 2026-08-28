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
  Folder
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface FolderManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FolderManagerModal: React.FC<FolderManagerModalProps> = ({ isOpen, onClose }) => {
  const { folders, createFolder, deleteFolder, musicTracks, soundboardItems, npcs } = useAudio();

  const [activeType, setActiveType] = useState<'music' | 'soundboard' | 'npc'>('music');
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderColor, setNewFolderColor] = useState('#f59e0b');

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

  const getItemCount = (folderId: string) => {
    if (activeType === 'music') return musicTracks.filter(m => m.folderId === folderId).length;
    if (activeType === 'soundboard') return soundboardItems.filter(s => s.folderId === folderId).length;
    return npcs.filter(n => n.folderId === folderId).length;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-[#FFFFFF] font-rpg">
              Gerenciador de Pastas do Sistema
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#9E9E9E] hover:text-[#FFFFFF] text-sm"
          >
            ✕
          </button>
        </div>

        {/* Type Switcher */}
        <div className="flex items-center gap-2 bg-[#141619] p-1.5 rounded-2xl border border-[#2D3139]">
          <button
            onClick={() => setActiveType('music')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeType === 'music'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            Pastas de Música
          </button>

          <button
            onClick={() => setActiveType('soundboard')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeType === 'soundboard'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Pastas de Soundboard
          </button>

          <button
            onClick={() => setActiveType('npc')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeType === 'npc'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-[#9E9E9E] hover:text-[#FFFFFF]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Pastas de NPCs
          </button>
        </div>

        {/* Create Folder Form */}
        <form onSubmit={handleCreateFolder} className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#141619] border border-[#2D3139] rounded-xl px-2 py-1">
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
            placeholder={`Nova pasta para ${activeType === 'music' ? 'Músicas' : activeType === 'soundboard' ? 'Efeitos' : 'NPCs'}...`}
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            className="flex-1 bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
            required
          />

          <button
            type="submit"
            className="flex items-center gap-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-sm shadow-indigo-600/30 transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            Criar Pasta
          </button>
        </form>

        {/* Folders List */}
        <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
          {currentFolders.length === 0 ? (
            <div className="p-6 text-center text-[#9E9E9E] text-xs">
              Nenhuma pasta cadastrada nesta categoria.
            </div>
          ) : (
            currentFolders.map((folder) => (
              <div
                key={folder.id}
                className="p-3 bg-[#141619] border border-[#2D3139] rounded-xl flex items-center justify-between gap-3 hover:border-[#363B44] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                    style={{ backgroundColor: folder.color || '#6366f1' }}
                  />
                  <div>
                    <h4 className="text-xs font-bold text-[#E0E0E0]">
                      {folder.name}
                    </h4>
                    <span className="text-[10px] text-[#6E7681] font-mono">
                      {getItemCount(folder.id)} itens associados
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => deleteFolder(folder.id)}
                  className="p-1.5 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#22262B] rounded-lg transition-colors"
                  title="Excluir Pasta"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-3 border-t border-[#2D3139]">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-[#22262B] hover:bg-[#2D3139] text-[#E0E0E0] text-xs font-semibold rounded-xl border border-[#2D3139] transition-colors"
          >
            Concluído
          </button>
        </div>

      </div>
    </div>
  );
};

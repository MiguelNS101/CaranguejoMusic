import React, { useState, useRef } from 'react';
import {
  FolderUp,
  Music,
  Volume2,
  Users,
  CheckCircle2,
  AlertCircle,
  X,
  FileAudio,
  Image,
  FolderOpen,
  UploadCloud,
  Check,
  Link,
  HardDrive,
  CloudRain
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface FolderImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: 'music' | 'ambience' | 'sfx' | 'npc';
  defaultFolderId?: string;
}

export const FolderImportModal: React.FC<FolderImportModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'music',
  defaultFolderId
}) => {
  const { folders, importFolderFiles, scanLocalFolderDirectly } = useAudio();

  const [mode, setMode] = useState<'link_path' | 'browser_files'>('link_path');
  const [folderPathInput, setFolderPathInput] = useState('');
  const [category, setCategory] = useState<'music' | 'ambience' | 'sfx' | 'npc'>(defaultCategory);
  const [selectedFolderId, setSelectedFolderId] = useState<string>(defaultFolderId || '');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  const folderInputRef = useRef<HTMLInputElement>(null);
  const multipleFilesInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const relevantFolders = folders.filter(f => {
    if (category === 'music') return f.type === 'music';
    if (category === 'ambience') return f.type === 'ambience' || f.type === 'music';
    if (category === 'sfx') return f.type === 'soundboard';
    if (category === 'npc') return f.type === 'npc';
    return true;
  });

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files: File[] = Array.from(fileList);
    // Filter by category
    const filtered = files.filter((file: File) => {
      const name = file.name.toLowerCase();
      if (category === 'music' || category === 'ambience' || category === 'sfx') {
        return name.endsWith('.mp3') || name.endsWith('.wav') || name.endsWith('.ogg') || name.endsWith('.m4a') || name.endsWith('.flac') || name.endsWith('.opus') || name.endsWith('.aac');
      } else {
        return name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.jpeg') || name.endsWith('.webp') || name.endsWith('.gif') || name.endsWith('.svg');
      }
    });

    setSelectedFiles(filtered);
    setFeedback({ status: 'idle' });
  };

  const formatCleanName = (fileName: string) => {
    let base = fileName.replace(/\.[^/.]+$/, '');
    base = base.replace(/^\d+[\s._-]+/, '');
    base = base.replace(/[_-]+/g, ' ').trim();
    return base.charAt(0).toUpperCase() + base.slice(1);
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsProcessing(true);
    setFeedback({ status: 'idle' });

    try {
      if (mode === 'link_path') {
        if (!folderPathInput.trim()) {
          throw new Error('Por favor, informe o caminho absoluto da pasta no seu PC.');
        }
        const res = await scanLocalFolderDirectly(folderPathInput.trim(), category, selectedFolderId || undefined);
        setFeedback({
          status: 'success',
          message: res.message || `${res.count} arquivos indexados por referência!`
        });
        setFolderPathInput('');
      } else {
        if (selectedFiles.length === 0) {
          throw new Error('Selecione ao menos um arquivo ou pasta.');
        }
        const res = await importFolderFiles(selectedFiles, category, selectedFolderId || undefined);
        setFeedback({
          status: 'success',
          message: `${res.count} arquivos adicionados com sucesso!`
        });
        setSelectedFiles([]);
      }

      setTimeout(() => {
        setFeedback({ status: 'idle' });
        onClose();
      }, 1400);
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Erro durante a importação.' });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-[#141619] border border-[#2D3139] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#1A1D21]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <FolderUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-rpg">
                Apontar / Importar Pasta de Mídia
              </h2>
              <p className="text-xs text-[#9E9E9E]">
                Referencie pastas do seu computador sem duplicar arquivos no disco ou faça upload em lote.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#2D3139] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-[#2D3139] bg-[#141619] px-6 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setMode('link_path')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              mode === 'link_path'
                ? 'border-indigo-500 text-indigo-400 bg-[#1A1D21] rounded-t-lg'
                : 'border-transparent text-[#9E9E9E] hover:text-white'
            }`}
          >
            <Link className="w-3.5 h-3.5" />
            Apontar Pasta Local (Zero Duplicação)
          </button>

          <button
            type="button"
            onClick={() => setMode('browser_files')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
              mode === 'browser_files'
                ? 'border-indigo-500 text-indigo-400 bg-[#1A1D21] rounded-t-lg'
                : 'border-transparent text-[#9E9E9E] hover:text-white'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5" />
            Selecionador de Navegador
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback.status !== 'idle' && (
          <div
            className={`px-6 py-2.5 flex items-center gap-2 text-xs font-semibold ${
              feedback.status === 'success'
                ? 'bg-emerald-950/70 border-b border-emerald-500/30 text-emerald-300'
                : 'bg-rose-950/70 border-b border-rose-500/30 text-rose-300'
            }`}
          >
            {feedback.status === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        <form onSubmit={handleImportSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
              1. Tipo de Mídia
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <button
                type="button"
                onClick={() => { setCategory('music'); setSelectedFiles([]); }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  category === 'music'
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-[#1A1D21] border-[#2D3139] text-[#9E9E9E] hover:text-white hover:border-[#3D424D]'
                }`}
              >
                <Music className="w-5 h-5 text-indigo-400" />
                Músicas & Trilhas
              </button>

              <button
                type="button"
                onClick={() => { setCategory('ambience'); setSelectedFiles([]); }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  category === 'ambience'
                    ? 'bg-teal-600/20 border-teal-500 text-white shadow-md shadow-teal-600/20'
                    : 'bg-[#1A1D21] border-[#2D3139] text-[#9E9E9E] hover:text-white hover:border-[#3D424D]'
                }`}
              >
                <CloudRain className="w-5 h-5 text-teal-400" />
                Ambientação Contínua
              </button>

              <button
                type="button"
                onClick={() => { setCategory('sfx'); setSelectedFiles([]); }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  category === 'sfx'
                    ? 'bg-amber-600/20 border-amber-500 text-white shadow-md shadow-amber-600/20'
                    : 'bg-[#1A1D21] border-[#2D3139] text-[#9E9E9E] hover:text-white hover:border-[#3D424D]'
                }`}
              >
                <Volume2 className="w-5 h-5 text-amber-400" />
                Efeitos Soundboard
              </button>

              <button
                type="button"
                onClick={() => { setCategory('npc'); setSelectedFiles([]); }}
                className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-xs font-semibold ${
                  category === 'npc'
                    ? 'bg-purple-600/20 border-purple-500 text-white shadow-md shadow-purple-600/20'
                    : 'bg-[#1A1D21] border-[#2D3139] text-[#9E9E9E] hover:text-white hover:border-[#3D424D]'
                }`}
              >
                <Users className="w-5 h-5 text-purple-400" />
                Retratos de NPCs
              </button>
            </div>
          </div>

          {/* Folder Target */}
          <div>
            <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
              2. Pasta / Categoria de Destino
            </label>
            <select
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3.5 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500"
            >
              <option value="">(Automático / Criação por subpastas)</option>
              {relevantFolders.map((f) => (
                <option key={f.id} value={f.id}>
                  📁 {f.name}
                </option>
              ))}
            </select>
          </div>

          {/* Mode 1: Direct Path Link */}
          {mode === 'link_path' && (
            <div className="space-y-3 p-4 rounded-xl bg-[#1A1D21] border border-[#2D3139]">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-300">
                <HardDrive className="w-4 h-4" />
                <span>Caminho Absoluto da Pasta no PC</span>
              </div>
              <p className="text-[11px] text-[#9E9E9E] leading-relaxed">
                O programa irá apenas <strong>apontar diretamente para seus arquivos</strong> sem copiá-los, mantendo seu disco limpo e evitando duplicatas.
              </p>
              <input
                type="text"
                placeholder={navigator.userAgent.includes('Windows') ? "Ex: C:\\RPG\\Musicas\\Combate ou D:\\Sons" : "Ex: /home/usuario/Musicas/RPG"}
                value={folderPathInput}
                onChange={(e) => setFolderPathInput(e.target.value)}
                className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-[#6E7681] font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {/* Mode 2: Browser Directory Picker */}
          {mode === 'browser_files' && (
            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-2">
                3. Escolher Pasta ou Arquivos pelo Navegador
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Folder Selector */}
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="p-5 rounded-2xl bg-[#1A1D21] border border-dashed border-[#2D3139] hover:border-indigo-500/70 hover:bg-[#1F2329] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                >
                  <FolderOpen className="w-8 h-8 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Selecionar Pasta Inteira</span>
                  <span className="text-[11px] text-[#9E9E9E]">Lê arquivos e subpastas</span>
                </button>
                <input
                  type="file"
                  ref={folderInputRef}
                  onChange={handleFilesSelected}
                  // @ts-ignore
                  webkitdirectory=""
                  directory=""
                  multiple
                  className="hidden"
                />

                {/* Multiple files selector */}
                <button
                  type="button"
                  onClick={() => multipleFilesInputRef.current?.click()}
                  className="p-5 rounded-2xl bg-[#1A1D21] border border-dashed border-[#2D3139] hover:border-indigo-500/70 hover:bg-[#1F2329] transition-all flex flex-col items-center justify-center gap-2 group cursor-pointer"
                >
                  <UploadCloud className="w-8 h-8 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-white">Selecionar Vários Arquivos</span>
                  <span className="text-[11px] text-[#9E9E9E]">Escolha múltiplos áudios/imagens</span>
                </button>
                <input
                  type="file"
                  ref={multipleFilesInputRef}
                  onChange={handleFilesSelected}
                  multiple
                  accept={category === 'npc' ? 'image/*' : 'audio/*'}
                  className="hidden"
                />
              </div>
            </div>
          )}

          {/* Files Preview for Browser Mode */}
          {mode === 'browser_files' && selectedFiles.length > 0 && (
            <div className="p-4 rounded-xl bg-[#1A1D21] border border-[#2D3139] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  {selectedFiles.length} arquivo(s) prontos para adição:
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedFiles([])}
                  className="text-[11px] text-rose-400 hover:underline"
                >
                  Limpar lista
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {selectedFiles.slice(0, 20).map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-lg bg-[#141619] border border-[#2D3139] text-xs"
                  >
                    <div className="flex items-center gap-2 truncate">
                      {category === 'npc' ? (
                        <Image className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      ) : (
                        <FileAudio className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      )}
                      <span className="text-white font-medium truncate">{formatCleanName(file.name)}</span>
                      <span className="text-[10px] text-[#6E7681] truncate">({file.name})</span>
                    </div>
                    <span className="text-[10px] text-[#9E9E9E] shrink-0">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                ))}
                {selectedFiles.length > 20 && (
                  <p className="text-[11px] text-center text-[#9E9E9E] pt-1">
                    ... e mais {selectedFiles.length - 20} arquivos adicionais
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#9E9E9E] hover:text-white text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isProcessing || (mode === 'link_path' ? !folderPathInput.trim() : selectedFiles.length === 0)}
              className="flex items-center gap-1.5 px-6 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <FolderUp className="w-4 h-4" />
              {isProcessing ? 'Processando...' : mode === 'link_path' ? 'Indexar Pasta por Referência' : `Importar ${selectedFiles.length} Arquivos`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};


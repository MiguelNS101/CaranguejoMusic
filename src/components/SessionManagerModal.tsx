import React, { useState, useRef } from 'react';
import {
  Save,
  FolderDown,
  Trash2,
  Download,
  Upload,
  Clock,
  Music,
  Volume2,
  Users,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  Plus,
  Sparkles,
  HardDrive
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';

interface SessionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SessionManagerModal: React.FC<SessionManagerModalProps> = ({ isOpen, onClose }) => {
  const {
    savedSessions,
    saveCurrentSession,
    loadSavedSession,
    deleteSavedSession,
    importSessionFromFile
  } = useAudio();

  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  const fileImportRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) return;

    setIsSaving(true);
    setFeedback({ status: 'idle' });

    try {
      await saveCurrentSession(sessionName.trim(), sessionDescription.trim());
      setFeedback({ status: 'success', message: 'Sessão salva com sucesso na pasta saves/!' });
      setSessionName('');
      setSessionDescription('');
      setTimeout(() => setFeedback({ status: 'idle' }), 3500);
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Falha ao salvar sessão.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLoad = async (id: string, name: string) => {
    if (!window.confirm(`Deseja carregar o save "${name}"? O estado atual da mesa será substituído.`)) {
      return;
    }

    setLoadingId(id);
    setFeedback({ status: 'idle' });

    try {
      await loadSavedSession(id);
      setFeedback({ status: 'success', message: `Sessão "${name}" carregada com sucesso!` });
      setTimeout(() => {
        setFeedback({ status: 'idle' });
        onClose();
      }, 1000);
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Erro ao carregar sessão.' });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o save "${name}"?`)) return;
    try {
      await deleteSavedSession(id);
      setFeedback({ status: 'success', message: 'Save excluído com sucesso.' });
      setTimeout(() => setFeedback({ status: 'idle' }), 2500);
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Erro ao excluir save.' });
    }
  };

  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await importSessionFromFile(file);
      setFeedback({ status: 'success', message: 'Arquivo de sessão importado com sucesso!' });
      setTimeout(() => setFeedback({ status: 'idle' }), 3000);
      if (fileImportRef.current) fileImportRef.current.value = '';
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Arquivo de save inválido.' });
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-3xl bg-[#141619] border border-[#2D3139] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#2D3139] bg-[#1A1D21]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
              <HardDrive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-rpg flex items-center gap-2">
                Gerenciador de Sessões & Saves
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-normal border border-indigo-500/30">
                  data/saves/
                </span>
              </h2>
              <p className="text-xs text-[#9E9E9E]">
                Salve o estado completo da mesa (músicas, fila, soundboard ativo, NPCs e notas) e recupere quando quiser.
              </p>
            </div>
          </div>

          <button
            id="btn-close-session-modal"
            onClick={onClose}
            className="p-1.5 text-[#9E9E9E] hover:text-white rounded-lg hover:bg-[#2D3139] transition-colors"
          >
            <X className="w-5 h-5" />
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

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Save Card */}
          <div className="p-5 rounded-2xl bg-[#1A1D21] border border-[#2D3139]">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <Save className="w-4 h-4 text-indigo-400" />
              Salvar Estado Atual da Sessão
            </h3>

            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-[#9E9E9E] mb-1">
                    Nome da Sessão / Ponto de Salve *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Campanha Strahd - Sessão 12 (Castelo)"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3.5 py-2 text-xs text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-[#9E9E9E] mb-1">
                    Descrição ou Anotação Rápida (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Antes da batalha contra o dragão no salão"
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3.5 py-2 text-xs text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileImportRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242830] hover:bg-[#2D3139] text-[#9E9E9E] hover:text-white text-xs border border-[#2D3139] transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importar Save .JSON
                  </button>
                  <input
                    type="file"
                    ref={fileImportRef}
                    onChange={handleFileImport}
                    accept=".json,application/json"
                    className="hidden"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSaving || !sessionName.trim()}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Salvando...' : 'Salvar Sessão Agora'}
                </button>
              </div>
            </form>
          </div>

          {/* Saved Sessions List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <FolderDown className="w-4 h-4 text-emerald-400" />
                Sessões Salvas ({savedSessions.length})
              </h3>
              <span className="text-[11px] text-[#9E9E9E]">Armazenado em data/saves/*.json</span>
            </div>

            {savedSessions.length === 0 ? (
              <div className="p-8 text-center bg-[#1A1D21] border border-dashed border-[#2D3139] rounded-2xl">
                <HardDrive className="w-8 h-8 text-[#4E5460] mx-auto mb-2" />
                <p className="text-xs font-semibold text-[#9E9E9E]">Nenhum arquivo de save encontrado.</p>
                <p className="text-[11px] text-[#6E7681] mt-1">
                  Digite um nome acima e salve o estado atual da mesa para continuar mais tarde.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {savedSessions.map((save) => (
                  <div
                    key={save.id}
                    className="p-4 rounded-xl bg-[#1A1D21] border border-[#2D3139] hover:border-[#3D424D] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 group"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-white group-hover:text-indigo-400 transition-colors">
                          {save.name}
                        </span>
                        <span className="text-[10px] text-[#9E9E9E] font-mono px-2 py-0.5 rounded bg-[#141619] border border-[#2D3139]">
                          {save.fileName}
                        </span>
                      </div>

                      {save.description && (
                        <p className="text-xs text-[#A0A6B2]">{save.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-[#808796] pt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(save.updatedAt)}
                        </span>
                        {save.stats && (
                          <>
                            <span className="flex items-center gap-1 text-emerald-400/80">
                              <Music className="w-3 h-3" />
                              {save.stats.musicCount} músicas
                            </span>
                            <span className="flex items-center gap-1 text-amber-400/80">
                              <Volume2 className="w-3 h-3" />
                              {save.stats.soundboardCount} sfx
                            </span>
                            <span className="flex items-center gap-1 text-purple-400/80">
                              <Users className="w-3 h-3" />
                              {save.stats.npcCount} NPCs
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <a
                        href={`/api/sessions/export/${save.id}`}
                        download
                        className="p-2 rounded-lg bg-[#242830] hover:bg-[#2D3139] text-[#9E9E9E] hover:text-white border border-[#2D3139] transition-colors"
                        title="Baixar arquivo JSON de backup"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      <button
                        onClick={() => handleDelete(save.id, save.name)}
                        className="p-2 rounded-lg bg-[#242830] hover:bg-rose-950/50 text-[#9E9E9E] hover:text-rose-400 border border-[#2D3139] hover:border-rose-500/30 transition-colors"
                        title="Excluir save"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleLoad(save.id, save.name)}
                        disabled={loadingId === save.id}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer whitespace-nowrap"
                      >
                        <FolderDown className="w-3.5 h-3.5" />
                        {loadingId === save.id ? 'Carregando...' : 'Carregar Save'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#2D3139] bg-[#1A1D21] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#2D3139] hover:bg-[#3D424D] text-[#E0E0E0] text-xs font-semibold transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

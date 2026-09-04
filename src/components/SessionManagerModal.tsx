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
import { exportAllPresetsJson, importPresetsFromJson } from '../utils/presetStore';

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
    importSessionFromFile,
    exportFullBackup,
    importFullBackup
  } = useAudio();

  const [sessionName, setSessionName] = useState('');
  const [sessionDescription, setSessionDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isImportingBackup, setIsImportingBackup] = useState(false);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });
  const fileImportRef = useRef<HTMLInputElement>(null);
  const fullBackupImportRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleComprehensiveExport = async () => {
    try {
      // 1. Fetch server state
      let serverData: any = {};
      try {
        const res = await fetch('/api/state');
        if (res.ok) serverData = await res.json();
      } catch {}

      // 2. Fetch server saved sessions
      let serverSessions: any[] = [];
      try {
        const res = await fetch('/api/sessions');
        if (res.ok) serverSessions = await res.json();
      } catch {}

      // 3. Collect presets
      let allPresets: any = {};
      try {
        allPresets = JSON.parse(exportAllPresetsJson()).presets;
      } catch {}

      // 4. Collect themes, CSS, folders & client configs
      const themeId = localStorage.getItem('caranguejo_active_theme_id') || 'theme-midnight-indigo';
      const customCss = localStorage.getItem('caranguejo_custom_css_rules') || '';
      const themeOverrides = localStorage.getItem('caranguejo_active_theme_overrides') || '{}';
      const customThemes = localStorage.getItem('caranguejo_custom_themes_list') || '[]';
      const persistentNoteTabs = localStorage.getItem('caranguejo_persistent_note_tabs') || '[]';
      const customTimers = localStorage.getItem('caranguejo_custom_timers') || '[]';
      const scannedFolderPaths = localStorage.getItem('caranguejo_scanned_folder_paths') || '[]';

      const comprehensiveBackup = {
        app: 'CaranguejoRPG',
        version: '3.5',
        exportedAt: new Date().toISOString(),
        timestamp: Date.now(),
        description: 'Backup completo do sistema, configurações, temas, caminhos de pastas e predefinições.',
        serverState: serverData,
        savedSessions: serverSessions,
        presets: allPresets,
        themes: {
          activeThemeId: themeId,
          customCss,
          overrides: JSON.parse(themeOverrides),
          customThemes: JSON.parse(customThemes)
        },
        clientSettings: {
          noteTabs: JSON.parse(persistentNoteTabs),
          customTimers: JSON.parse(customTimers),
          scannedFolderPaths: JSON.parse(scannedFolderPaths)
        }
      };

      const blob = new Blob([JSON.stringify(comprehensiveBackup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `caranguejo-rpg-save-completo-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setFeedback({ status: 'success', message: 'Backup completo (configurações, temas, presets e caminhos) exportado com sucesso!' });
      setTimeout(() => setFeedback({ status: 'idle' }), 3500);
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Falha ao exportar backup completo.' });
    }
  };

  const handleComprehensiveImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm('Deseja restaurar este save completo? Todas as configurações, temas, presets e estado da mesa serão atualizados.')) {
      if (fullBackupImportRef.current) fullBackupImportRef.current.value = '';
      return;
    }

    setIsImportingBackup(true);
    setFeedback({ status: 'idle' });

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // 1. Restore backend server state if present
      const backendPayload = data.serverState || data.state || (data.folders ? data : null);
      if (backendPayload) {
        try {
          await importFullBackup(file);
        } catch (err) {
          console.warn('Backend restore note:', err);
        }
      }

      // 2. Restore all presets (loot, encounters, roulette, timers, notes)
      if (data.presets) {
        importPresetsFromJson(JSON.stringify({ presets: data.presets }));
      }

      // 3. Restore theme & CSS styling
      if (data.themes) {
        if (data.themes.activeThemeId) {
          localStorage.setItem('caranguejo_active_theme_id', data.themes.activeThemeId);
        }
        if (typeof data.themes.customCss === 'string') {
          localStorage.setItem('caranguejo_custom_css_rules', data.themes.customCss);
        }
        if (data.themes.overrides) {
          localStorage.setItem('caranguejo_active_theme_overrides', JSON.stringify(data.themes.overrides));
        }
        if (data.themes.customThemes) {
          localStorage.setItem('caranguejo_custom_themes_list', JSON.stringify(data.themes.customThemes));
        }
      }

      // 4. Restore client settings
      if (data.clientSettings) {
        if (data.clientSettings.noteTabs) {
          localStorage.setItem('caranguejo_persistent_note_tabs', JSON.stringify(data.clientSettings.noteTabs));
        }
        if (data.clientSettings.customTimers) {
          localStorage.setItem('caranguejo_custom_timers', JSON.stringify(data.clientSettings.customTimers));
        }
        if (data.clientSettings.scannedFolderPaths) {
          localStorage.setItem('caranguejo_scanned_folder_paths', JSON.stringify(data.clientSettings.scannedFolderPaths));
        }
      }

      // Dispatch global notification events
      window.dispatchEvent(new CustomEvent('caranguejo_presets_updated'));
      window.dispatchEvent(new CustomEvent('caranguejo_theme_updated'));

      setFeedback({ status: 'success', message: 'Save e configurações completas restaurados com sucesso!' });
      setTimeout(() => {
        setFeedback({ status: 'idle' });
        window.location.reload();
      }, 1400);
    } catch (err: any) {
      setFeedback({ status: 'error', message: err?.message || 'Arquivo de backup inválido.' });
    } finally {
      setIsImportingBackup(false);
      if (fullBackupImportRef.current) fullBackupImportRef.current.value = '';
    }
  };

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
          {/* Full State Portability Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-[#1A1D21] to-purple-950/40 border border-indigo-500/30 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Backup Completo & Portabilidade
                </h3>
              </div>
              <span className="text-[10px] text-indigo-300 font-medium bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20">
                JSON Portável
              </span>
            </div>
            <p className="text-[11px] text-[#A0A6B2] leading-relaxed">
              Exporte todos os dados cadastrados (nomes, notas multiabas, temporizadores, layouts de som, NPCs e caminhos das pastas de música/imagem) em um único arquivo para transferir de PC ou manter backup.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                type="button"
                onClick={handleComprehensiveExport}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 hover:border-indigo-400 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                title="Exporta todas as configurações, temas, caminhos de pastas, presets JSON e estado da mesa"
              >
                <Download className="w-3.5 h-3.5" />
                Exportar Estado Completo (.JSON)
              </button>

              <button
                type="button"
                onClick={() => fullBackupImportRef.current?.click()}
                disabled={isImportingBackup}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#3D424D] text-xs font-semibold transition-all cursor-pointer"
                title="Restaura save completo de qualquer versão com todas as configurações"
              >
                <Upload className="w-3.5 h-3.5 text-purple-400" />
                {isImportingBackup ? 'Restaurando...' : 'Restaurar Backup Completo'}
              </button>
              <input
                type="file"
                ref={fullBackupImportRef}
                onChange={handleComprehensiveImport}
                accept=".json,application/json"
                className="hidden"
              />
            </div>
          </div>

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

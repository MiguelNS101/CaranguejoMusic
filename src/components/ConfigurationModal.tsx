import React, { useState } from 'react';
import {
  Settings,
  Bot,
  SlidersHorizontal,
  Palette,
  HelpCircle,
  Sparkles,
  X,
  Volume2,
  VolumeX,
  Radio,
  ExternalLink,
  Shield,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  FolderOpen,
  HardDrive,
  Plus,
  Trash2,
  Download,
  Upload,
  Folder,
  BookOpen,
  CloudRain,
  Swords
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { useTheme } from '../context/ThemeContext';

interface ConfigurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDiscordSetup: () => void;
  onOpenMixerModal: () => void;
  onOpenThemeModal: () => void;
  onOpenTutorialModal: () => void;
  onOpenPresetModal: (initialTab?: 'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'json') => void;
  onOpenFolderModal?: () => void;
  onOpenSessionModal?: () => void;
  initialTab?: 'discord' | 'mixer' | 'folders' | 'saves' | 'themes' | 'guide' | 'presets';
}

export const ConfigurationModal: React.FC<ConfigurationModalProps> = ({
  isOpen,
  onClose,
  onOpenDiscordSetup,
  onOpenMixerModal,
  onOpenThemeModal,
  onOpenTutorialModal,
  onOpenPresetModal,
  onOpenFolderModal,
  onOpenSessionModal,
  initialTab = 'discord'
}) => {
  const [activeTab, setActiveTab] = useState<'discord' | 'mixer' | 'folders' | 'saves' | 'themes' | 'guide' | 'presets'>(initialTab);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderType, setNewFolderType] = useState<'music' | 'soundboard' | 'npc'>('music');
  const [newSessionName, setNewSessionName] = useState('');
  const [sessionActionMsg, setSessionActionMsg] = useState<string | null>(null);
  const backupFileInputRef = React.useRef<HTMLInputElement>(null);

  const {
    botStatus,
    volume,
    setVolume,
    musicVolume,
    setMusicVolume,
    ambienceVolume,
    setAmbienceVolume,
    sfxVolume,
    setSfxVolume,
    isMuted,
    toggleMute,
    isMusicMuted,
    toggleMusicMute,
    isAmbienceMuted,
    toggleAmbienceMute,
    isSfxMuted,
    toggleSfxMute,
    folders = [],
    createFolder,
    deleteFolder,
    savedSessions = [],
    saveCurrentSession,
    loadSavedSession,
    deleteSavedSession,
    exportFullBackup,
    importFullBackup
  } = useAudio();

  const { currentTheme, themePresets = [], selectPreset } = useTheme();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#16181D] border border-[#2D3139] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#282C34] flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-[#1A1D21] to-[#16181D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <Settings className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                Painel Central de Configurações
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full flex items-center gap-1.5 border ${
                  botStatus.isOnline
                    ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40'
                    : 'bg-zinc-800 text-zinc-400 border-zinc-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-500'}`} />
                  {botStatus.isOnline ? 'Discord Conectado' : 'Discord Offline / Local'}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Gerencie a integração com o Discord Bot, Mixer de áudio, temas visuais, guia e predefinições.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#121417] border-b border-[#282C34] overflow-x-auto no-scrollbar shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('discord')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'discord'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <div className="relative">
              <Bot className="w-4 h-4" />
              <span className={`absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full ${botStatus.isOnline ? 'bg-emerald-400' : 'bg-zinc-500'}`} />
            </div>
            <span>Discord Bot & Docker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('mixer')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'mixer'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4 text-cyan-400" />
            <span>Mixer de Áudio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('folders')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'folders'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <FolderOpen className="w-4 h-4 text-amber-400" />
            <span>Pastas ({folders.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('saves')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'saves'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <HardDrive className="w-4 h-4 text-indigo-400" />
            <span>Saves & Sessões ({savedSessions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('themes')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'themes'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Palette className="w-4 h-4 text-purple-400" />
            <span>Temas & CSS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('presets')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'presets'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Predefinições (JSON)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <HelpCircle className="w-4 h-4 text-emerald-400" />
            <span>Guia & Manual</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5">
          
          {/* TAB: DISCORD BOT & DOCKER */}
          {activeTab === 'discord' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-[#1A1D21] border border-[#2D3139] flex items-center justify-center relative">
                    <Bot className="w-7 h-7 text-indigo-400" />
                    <span className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-[#16181D] ${
                      botStatus.isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'
                    }`} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      {botStatus.isOnline ? (botStatus.username || 'Bot Conectado') : 'Bot Discord Desconectado'}
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold uppercase ${
                        botStatus.isOnline ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                      }`}>
                        {botStatus.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Canal de Voz: <span className="font-semibold text-zinc-200">{botStatus.connectedVoiceChannel?.name || 'Nenhum'}</span> • Ping: <span className="font-mono text-zinc-200">{botStatus.ping ? `${botStatus.ping}ms` : '—'}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDiscordSetup();
                  }}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                >
                  <Settings className="w-4 h-4" />
                  Configurar Bot & Docker
                </button>
              </div>

              {/* Status details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Servidor (Guild)</span>
                  <span className="font-semibold text-zinc-200">{botStatus.guildName || 'Não conectado'}</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Prefix de Comandos</span>
                  <span className="font-mono font-bold text-indigo-400 text-sm">!</span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Modo de Operação</span>
                  <span className="font-semibold text-emerald-400">Stream Local & Docker</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB: MIXER */}
          {activeTab === 'mixer' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Controle independente de volume para trilhas musicais, ambientações contínuas e soundboard.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenMixerModal();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  Abrir Estúdio Completo
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Master Volume */}
                <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-indigo-400" /> Volume Geral (Master)
                    </span>
                    <button
                      onClick={toggleMute}
                      className={`text-xs px-2 py-0.5 rounded font-bold ${isMuted ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 text-zinc-300'}`}
                    >
                      {isMuted ? 'MUDO' : `${Math.round(volume * 100)}%`}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                  />
                </div>

                {/* Music Volume */}
                <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-purple-400" /> Música
                    </span>
                    <button
                      onClick={toggleMusicMute}
                      className={`text-xs px-2 py-0.5 rounded font-bold ${isMusicMuted ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 text-zinc-300'}`}
                    >
                      {isMusicMuted ? 'MUDO' : `${Math.round(musicVolume * 100)}%`}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMusicMuted ? 0 : musicVolume}
                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                </div>

                {/* Ambience Volume */}
                <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-cyan-400" /> Som Ambiente
                    </span>
                    <button
                      onClick={toggleAmbienceMute}
                      className={`text-xs px-2 py-0.5 rounded font-bold ${isAmbienceMuted ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 text-zinc-300'}`}
                    >
                      {isAmbienceMuted ? 'MUDO' : `${Math.round(ambienceVolume * 100)}%`}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isAmbienceMuted ? 0 : ambienceVolume}
                    onChange={(e) => setAmbienceVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                </div>

                {/* SFX Volume */}
                <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-amber-400" /> Efeitos (Soundboard)
                    </span>
                    <button
                      onClick={toggleSfxMute}
                      className={`text-xs px-2 py-0.5 rounded font-bold ${isSfxMuted ? 'bg-rose-950 text-rose-300' : 'bg-zinc-800 text-zinc-300'}`}
                    >
                      {isSfxMuted ? 'MUDO' : `${Math.round(sfxVolume * 100)}%`}
                    </button>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isSfxMuted ? 0 : sfxVolume}
                    onChange={(e) => setSfxVolume(parseFloat(e.target.value))}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB: PASTAS (FOLDERS) */}
          {activeTab === 'folders' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                    <FolderOpen className="w-6 h-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Gerenciador de Pastas do Sistema
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Organize suas trilhas sonoras, soundboard e NPCs em categorias personalizadas.
                    </p>
                  </div>
                </div>

                {onOpenFolderModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFolderModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all shadow-md shadow-amber-600/30 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Abrir Gerenciador de Pastas
                  </button>
                )}
              </div>

              {/* Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Pastas de Músicas</span>
                  <span className="text-lg font-bold text-amber-400 font-mono">
                    {folders.filter(f => f.type === 'music').length}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Pastas de Soundboard</span>
                  <span className="text-lg font-bold text-emerald-400 font-mono">
                    {folders.filter(f => f.type === 'soundboard').length}
                  </span>
                </div>
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139]">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 block mb-1">Pastas de NPCs</span>
                  <span className="text-lg font-bold text-cyan-400 font-mono">
                    {folders.filter(f => f.type === 'npc').length}
                  </span>
                </div>
              </div>

              {/* Quick Create Folder */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newFolderName.trim()) return;
                  await createFolder({
                    name: newFolderName.trim(),
                    type: newFolderType,
                    color: newFolderType === 'music' ? '#f59e0b' : newFolderType === 'soundboard' ? '#10b981' : '#06b6d4'
                  });
                  setNewFolderName('');
                }}
                className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-3"
              >
                <span className="text-xs font-bold text-white block">Criar Nova Pasta</span>
                <div className="flex flex-col sm:flex-row items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome da Pasta (Ex: Batalhas Épicas, Tavernas, Cidades)..."
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    className="flex-1 w-full px-3.5 py-2 rounded-xl bg-[#1A1D21] border border-[#2D3139] text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <select
                    value={newFolderType}
                    onChange={(e) => setNewFolderType(e.target.value as any)}
                    className="px-3 py-2 rounded-xl bg-[#1A1D21] border border-[#2D3139] text-xs text-zinc-200 focus:outline-none focus:border-amber-500 cursor-pointer"
                  >
                    <option value="music">Músicas</option>
                    <option value="soundboard">Soundboard</option>
                    <option value="npc">NPCs</option>
                  </select>
                  <button
                    type="submit"
                    disabled={!newFolderName.trim()}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar
                  </button>
                </div>
              </form>

              {/* Folders List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 block">Pastas Cadastradas ({folders.length})</span>
                {folders.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 bg-[#141619] border border-[#2D3139] rounded-xl">
                    Nenhuma pasta criada ainda. Crie categorias para agrupar suas mídias!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                    {folders.map(f => (
                      <div
                        key={f.id}
                        className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] flex items-center justify-between gap-2"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <Folder
                            className="w-4 h-4 shrink-0"
                            style={{ color: f.color || '#f59e0b' }}
                          />
                          <span className="text-xs font-bold text-white truncate">{f.name}</span>
                          <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 shrink-0">
                            {f.type === 'music' ? 'Música' : f.type === 'soundboard' ? 'SFX' : 'NPC'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => deleteFolder(f.id)}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
                          title="Excluir Pasta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: SAVES & SESSÕES */}
          {activeTab === 'saves' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center shrink-0">
                    <HardDrive className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      Saves & Sessões Salvas da Mesa
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Salve o estado completo da mesa (trilhas tocando, volumes, fichas, notas e combate) para continuar mais tarde.
                    </p>
                  </div>
                </div>

                {onOpenSessionModal && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenSessionModal();
                    }}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/30 flex items-center gap-2 cursor-pointer shrink-0"
                  >
                    <HardDrive className="w-4 h-4" />
                    Abrir Gerenciador de Sessões
                  </button>
                )}
              </div>

              {/* Quick Save Box */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!newSessionName.trim()) return;
                  try {
                    await saveCurrentSession(newSessionName.trim(), 'Salvo via Configurações');
                    setSessionActionMsg(`Sessão "${newSessionName.trim()}" salva com sucesso!`);
                    setNewSessionName('');
                    setTimeout(() => setSessionActionMsg(null), 4000);
                  } catch (err: any) {
                    setSessionActionMsg('Erro ao salvar sessão.');
                  }
                }}
                className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-3"
              >
                <span className="text-xs font-bold text-white block">Salvar Estado Atual da Mesa</span>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nome da Sessão (Ex: Sessão 5 - Taverna do Dragão)..."
                    value={newSessionName}
                    onChange={(e) => setNewSessionName(e.target.value)}
                    className="flex-1 px-3.5 py-2 rounded-xl bg-[#1A1D21] border border-[#2D3139] text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="submit"
                    disabled={!newSessionName.trim()}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Salvar Sessão
                  </button>
                </div>
                {sessionActionMsg && (
                  <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sessionActionMsg}</span>
                  </div>
                )}
              </form>

              {/* Saved Sessions List */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-400 block">Sessões Salvas ({savedSessions.length})</span>
                {savedSessions.length === 0 ? (
                  <div className="p-6 text-center text-xs text-zinc-500 bg-[#141619] border border-[#2D3139] rounded-xl">
                    Nenhuma sessão salva ainda. Salve seu progresso acima para poder restaurar o estado da mesa a qualquer momento!
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {savedSessions.map(session => (
                      <div
                        key={session.id}
                        className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] flex items-center justify-between gap-3"
                      >
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{session.name}</h4>
                          <p className="text-[10px] text-zinc-400 mt-0.5">
                            {new Date(session.timestamp).toLocaleString('pt-BR')} • {session.trackCount || 0} músicas • {session.npcCount || 0} NPCs
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await loadSavedSession(session.id);
                                setSessionActionMsg(`Sessão "${session.name}" carregada na mesa!`);
                                setTimeout(() => setSessionActionMsg(null), 4000);
                              } catch (err: any) {
                                setSessionActionMsg('Erro ao carregar sessão.');
                              }
                            }}
                            className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors cursor-pointer"
                          >
                            Carregar
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSavedSession(session.id)}
                            className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-colors cursor-pointer"
                            title="Excluir Sessão"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Full Backup / Restore */}
              <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] flex flex-col sm:flex-row items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">Backup Completo do Sistema</span>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Exporte ou restaure todas as configurações, temas, pastas e sessões em arquivo JSON.
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={exportFullBackup}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    Exportar Backup
                  </button>

                  <input
                    type="file"
                    ref={backupFileInputRef}
                    accept=".json"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const res = await importFullBackup(file);
                        setSessionActionMsg(res.message);
                        setTimeout(() => setSessionActionMsg(null), 5000);
                      }
                      if (backupFileInputRef.current) backupFileInputRef.current.value = '';
                    }}
                  />

                  <button
                    type="button"
                    onClick={() => backupFileInputRef.current?.click()}
                    className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-emerald-400" />
                    Importar Backup
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-zinc-400">
                  Alterne entre temas criados ou personalize com CSS avançado.
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenThemeModal();
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
                >
                  <Palette className="w-3.5 h-3.5" />
                  Customizador Completo & CSS
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {(themePresets || []).map((t) => {
                  const isSelected = currentTheme?.id === t.id;
                  const accentColor = t.colors?.accentPrimary || '#6366f1';
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectPreset(t.id)}
                      style={isSelected ? {
                        backgroundColor: t.colors.accentMuted,
                        borderColor: t.colors.accentPrimary,
                        boxShadow: `0 0 12px ${t.colors.accentMuted}`
                      } : {}}
                      className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'text-white shadow-md'
                          : 'bg-[#141619] border-[#2D3139] text-zinc-400 hover:text-white hover:border-zinc-600'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm border border-black/30" style={{ backgroundColor: accentColor }} />
                        <span className="text-xs font-bold text-white truncate">{t.name}</span>
                      </div>
                      <span className="text-[10px] text-zinc-400 line-clamp-1">{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Gerenciador de Predefinições da Mesa (JSON-Driven)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Adicione, edite e personalize presets de regras, condições, climas, encontros e tabelas para os widgets do Escudo do Mestre.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('encounters');
                  }}
                  className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/30 transition-all cursor-pointer shrink-0"
                >
                  Abrir Central de Predefinições
                </button>
              </div>

              {/* Guia de Regras & Condições Card */}
              <div className="p-4 rounded-2xl bg-[#141619] border border-amber-500/30 hover:border-amber-500/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 shrink-0">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Guia de Regras & Condições</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        Widget do Mestre
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Configure predefinições de regras rápidas, condições de combate (Cego, Enfeitiçado, Envenenado, Paralisado, etc.), coberturas, salvaguardas e termos de RPG para consulta instantânea durante a sessão.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('rules');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Configurar Regras & Condições
                </button>
              </div>

              {/* Clima & Atmosfera da Sessão Card */}
              <div className="p-4 rounded-2xl bg-[#141619] border border-sky-500/30 hover:border-sky-500/60 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-sky-500/15 border border-sky-500/30 text-sky-400 shrink-0">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">Clima & Atmosfera da Sessão</h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
                        Widget Clima & Horário
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                      Configure climas personalizados (Céu Limpo, Tempestade, Névoa Mística, Chuva Ácida, Nevasca), emojis para broadcast no Discord, modificadores de visibilidade e descrições narrativas de atmosfera.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('weather');
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-black text-xs font-extrabold shadow-md shadow-sky-500/20 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                >
                  Configurar Clima & Atmosfera
                </button>
              </div>

              {/* Quick links to other presets */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('encounters');
                  }}
                  className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-[#4B5263] text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-indigo-400" />
                    Encontros
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">Gerador de combate</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('loot');
                  }}
                  className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-[#4B5263] text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    Tabelas de Loot
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">Tesouro por Tier</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('roulette');
                  }}
                  className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-[#4B5263] text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                    Roletas
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">Sorteios customizados</p>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPresetModal('json');
                  }}
                  className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-[#4B5263] text-left transition-all cursor-pointer"
                >
                  <p className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-rose-400" />
                    Editor JSON
                  </p>
                  <p className="text-[10px] text-zinc-500 mt-1">Importar / Exportar</p>
                </button>
              </div>
            </div>
          )}

          {/* TAB: GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] flex items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-emerald-400" />
                    Manual Completo & Guia do Mestre
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Consulte tutoriais detalhados de cada módulo do Escudo do Mestre, comandos de texto e integração com voz.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenTutorialModal();
                  }}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all cursor-pointer shrink-0"
                >
                  Abrir Manual do Sistema
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2D3139] bg-[#141619] flex items-center justify-between shrink-0 text-xs text-zinc-500">
          <span>Configurações globais salvas instantaneamente.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};

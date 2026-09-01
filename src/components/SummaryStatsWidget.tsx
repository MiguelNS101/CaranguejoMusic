import React, { useState, useEffect } from 'react';
import {
  Activity,
  BookOpen,
  Users,
  HardDrive,
  Music,
  Flame,
  Clock,
  Sparkles,
  ShieldAlert,
  FolderOpen,
  Plus,
  ExternalLink,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { NoteTab } from '../types';

interface SummaryStatsWidgetProps {
  onOpenSessionModal: () => void;
  onOpenNpcTab: () => void;
  onOpenMusicTab: () => void;
}

export const SummaryStatsWidget: React.FC<SummaryStatsWidgetProps> = ({
  onOpenSessionModal,
  onOpenNpcTab,
  onOpenMusicTab
}) => {
  const {
    savedSessions,
    npcs,
    musicTracks,
    soundboardItems,
    sessionSeconds,
    formatDuration,
    isSessionTimerRunning,
    botStatus
  } = useAudio();

  // Read note tabs count from storage
  const [noteCount, setNoteCount] = useState<number>(4);
  const [cluesCount, setCluesCount] = useState<number>(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('caranguejo_persistent_note_tabs');
      if (saved) {
        const parsed: NoteTab[] = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setNoteCount(parsed.length);
          // Count list items or lines
          let totalItems = 0;
          parsed.forEach(t => {
            const matches = (t.content || '').match(/^[-*1-9.]+\s/gm);
            if (matches) totalItems += matches.length;
          });
          setCluesCount(totalItems);
        }
      }
    } catch {}
  }, []);

  // Compute NPC statistics
  const totalNpcs = npcs.length;
  const alliesCount = npcs.filter(n => (n.role || '').toLowerCase().includes('aliado') || (n.description || '').toLowerCase().includes('aliado')).length;
  const bossCount = npcs.filter(n => (n.role || '').toLowerCase().includes('chefe') || (n.role || '').toLowerCase().includes('vilão') || (n.hp && n.hp >= 50)).length;
  const neutralCount = Math.max(0, totalNpcs - alliesCount - bossCount);

  const totalAudioAssets = musicTracks.length + soundboardItems.length;

  return (
    <div className="space-y-4">
      {/* Top Main 3 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Card 1: Sessões Jogadas & Tempo */}
        <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-indigo-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">
              Sessões & Saves
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {savedSessions.length}
              </span>
              <span className="text-xs text-[#9E9E9E]">saves registrados</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-indigo-300">
              <Clock className="w-3 h-3 text-indigo-400" />
              <span>Sessão atual: <strong>{formatDuration(sessionSeconds)}</strong></span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenSessionModal}
            className="flex items-center justify-between w-full pt-2 border-t border-[#2D3139]/60 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer group-hover:translate-x-0.5 transition-transform"
          >
            <span>Gerenciar Saves</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Notas & Registros Criados */}
        <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-amber-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">
              Notas & Pistas
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30">
              <BookOpen className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {noteCount}
              </span>
              <span className="text-xs text-[#9E9E9E]">abas ativas</span>
            </div>
            <div className="flex items-center gap-1.5 mt-1 text-[11px] text-amber-300">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>~{cluesCount > 0 ? cluesCount : 12} tópicos & segredos</span>
            </div>
          </div>

          <div className="flex items-center justify-between w-full pt-2 border-t border-[#2D3139]/60 text-[11px] text-amber-400 font-semibold">
            <span>Sincronizado na Memória</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>

        {/* Card 3: NPCs Ativos no Catálogo */}
        <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-emerald-500/40 transition-all flex flex-col justify-between group">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9E9E9E]">
              NPCs no Catálogo
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              <Users className="w-4 h-4" />
            </div>
          </div>

          <div className="my-2">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white font-mono">
                {totalNpcs}
              </span>
              <span className="text-xs text-[#9E9E9E]">personagens</span>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[10px] text-[#9E9E9E]">
              <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-emerald-300 border border-emerald-500/30">
                {alliesCount} Aliado(s)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-300 border border-rose-500/30">
                {bossCount} Ameaça(s)
              </span>
              <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                {neutralCount} Outros
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenNpcTab}
            className="flex items-center justify-between w-full pt-2 border-t border-[#2D3139]/60 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer group-hover:translate-x-0.5 transition-transform"
          >
            <span>Ver Catálogo Completo</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Secondary Quick Metrics Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
        <div className="p-2.5 rounded-lg bg-[#141619]/60 border border-[#2D3139]/70 flex items-center gap-2.5">
          <Music className="w-4 h-4 text-purple-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-[#9E9E9E] block truncate">Faixas de Música</span>
            <span className="text-xs font-bold text-white font-mono">{musicTracks.length} cadastradas</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#141619]/60 border border-[#2D3139]/70 flex items-center gap-2.5">
          <Flame className="w-4 h-4 text-orange-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-[#9E9E9E] block truncate">Efeitos SFX</span>
            <span className="text-xs font-bold text-white font-mono">{soundboardItems.length} no soundboard</span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#141619]/60 border border-[#2D3139]/70 flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-[#9E9E9E] block truncate">Status do Bot</span>
            <span className={`text-xs font-bold font-mono ${botStatus.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
              {botStatus.isOnline ? 'Online no Discord' : 'Offline'}
            </span>
          </div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#141619]/60 border border-[#2D3139]/70 flex items-center gap-2.5">
          <TrendingUp className="w-4 h-4 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <span className="text-[10px] text-[#9E9E9E] block truncate">Acervo Total</span>
            <span className="text-xs font-bold text-white font-mono">{totalAudioAssets} itens de áudio</span>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Music,
  CloudRain,
  Zap,
  Users,
  MessageSquare,
  Dices,
  Palette,
  Activity,
  ChevronUp,
  ChevronDown,
  Trash2,
  Clock,
  History
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { ActionLogCategory } from '../types';

export const ActionLogFooter: React.FC = () => {
  const { actionLogs = [], clearActionLogs } = useAudio();
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caranguejo_log_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('caranguejo_log_minimized', String(next));
      } catch {}
      return next;
    });
  };

  const getCategoryConfig = (category: ActionLogCategory) => {
    switch (category) {
      case 'music':
        return {
          icon: <Music className="w-3.5 h-3.5 text-indigo-400" />,
          label: 'Música',
          bg: 'bg-indigo-950/60',
          border: 'border-indigo-500/40',
          text: 'text-indigo-300'
        };
      case 'ambience':
        return {
          icon: <CloudRain className="w-3.5 h-3.5 text-emerald-400" />,
          label: 'Ambiente',
          bg: 'bg-emerald-950/60',
          border: 'border-emerald-500/40',
          text: 'text-emerald-300'
        };
      case 'soundboard':
        return {
          icon: <Zap className="w-3.5 h-3.5 text-amber-400" />,
          label: 'SFX',
          bg: 'bg-amber-950/60',
          border: 'border-amber-500/40',
          text: 'text-amber-300'
        };
      case 'npc':
        return {
          icon: <Users className="w-3.5 h-3.5 text-purple-400" />,
          label: 'NPC / Lore',
          bg: 'bg-purple-950/60',
          border: 'border-purple-500/40',
          text: 'text-purple-300'
        };
      case 'chat':
        return {
          icon: <MessageSquare className="w-3.5 h-3.5 text-cyan-400" />,
          label: 'Chat',
          bg: 'bg-cyan-950/60',
          border: 'border-cyan-500/40',
          text: 'text-cyan-300'
        };
      case 'dice':
        return {
          icon: <Dices className="w-3.5 h-3.5 text-rose-400" />,
          label: 'Dados',
          bg: 'bg-rose-950/60',
          border: 'border-rose-500/40',
          text: 'text-rose-300'
        };
      case 'drawing':
        return {
          icon: <Palette className="w-3.5 h-3.5 text-yellow-400" />,
          label: 'Desenho',
          bg: 'bg-yellow-950/60',
          border: 'border-yellow-500/40',
          text: 'text-yellow-300'
        };
      case 'system':
      default:
        return {
          icon: <Activity className="w-3.5 h-3.5 text-zinc-400" />,
          label: 'Sistema',
          bg: 'bg-zinc-900',
          border: 'border-zinc-700',
          text: 'text-zinc-300'
        };
    }
  };

  const formatLogTime = (date: Date) => {
    try {
      const d = date instanceof Date ? date : new Date(date);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '';
    }
  };

  // Recent 3 actions
  const recentThree = actionLogs.slice(0, 3);

  return (
    <footer
      id="caranguejo-action-log-footer"
      className="sticky bottom-0 z-40 w-full bg-[#121417]/95 backdrop-blur-md border-t border-[#2D3139] shadow-2xl transition-all duration-300"
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2">
        {/* Header / Title bar of log */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-indigo-950/50 border border-indigo-500/30 text-indigo-300 text-[11px] font-bold font-rpg tracking-wider uppercase">
              <History className="w-3 h-3 text-indigo-400" />
              <span>Ações Recentes ({recentThree.length}/3)</span>
            </div>

            {/* Quick latest preview when minimized */}
            {isMinimized && recentThree.length > 0 && (
              <span className="hidden sm:inline-block text-xs text-zinc-400 truncate max-w-md">
                Última: <strong className="text-zinc-200">{recentThree[0].text}</strong> ({formatLogTime(recentThree[0].timestamp)})
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
            {recentThree.length > 0 && (
              <button
                id="btn-clear-action-logs"
                type="button"
                onClick={clearActionLogs}
                className="p-1 text-zinc-500 hover:text-rose-400 rounded-lg hover:bg-zinc-800/60 transition-colors text-[11px] flex items-center gap-1 cursor-pointer"
                title="Limpar histórico recente"
              >
                <Trash2 className="w-3 h-3" />
                <span className="hidden md:inline">Limpar</span>
              </button>
            )}

            <button
              id="btn-toggle-action-logs-footer"
              type="button"
              onClick={toggleMinimize}
              className="px-2 py-0.5 rounded-lg bg-[#1A1D21] hover:bg-[#23272F] border border-[#2D3139] text-zinc-300 hover:text-white text-[11px] font-medium flex items-center gap-1 transition-colors cursor-pointer"
              title={isMinimized ? 'Expandir histórico' : 'Minimizar histórico'}
            >
              <span>{isMinimized ? 'Expandir' : 'Minimizar'}</span>
              {isMinimized ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* 3 Last Actions Display */}
        {!isMinimized && (
          <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2">
            {recentThree.length === 0 ? (
              <div className="col-span-3 py-2 text-center text-xs text-zinc-500 bg-[#16181D] rounded-xl border border-[#23272F]">
                Nenhuma ação recente registrada ainda. Toque músicas, dispare efeitos ou envie mensagens para visualizar o histórico.
              </div>
            ) : (
              recentThree.map((action, idx) => {
                const conf = getCategoryConfig(action.category);
                return (
                  <div
                    key={action.id || idx}
                    id={`action-log-card-${idx}`}
                    className={`flex items-center gap-2.5 p-2 rounded-xl bg-[#181A1F] border border-[#2D3139] hover:border-[#3E4450] shadow-sm transition-all duration-200 ${
                      idx === 0 ? 'ring-1 ring-indigo-500/30' : 'opacity-90'
                    }`}
                  >
                    {/* Category Icon Badge */}
                    <div
                      className={`w-7 h-7 rounded-lg ${conf.bg} ${conf.border} border flex items-center justify-center shrink-0 shadow-sm`}
                      title={conf.label}
                    >
                      {conf.icon}
                    </div>

                    {/* Action Text & Timestamp */}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-zinc-200 font-medium truncate leading-tight">
                        {action.text}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 mt-0.5">
                        <span className={`font-semibold ${conf.text}`}>{conf.label}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono text-zinc-400">
                          <Clock className="w-2.5 h-2.5 text-zinc-400" />
                          {formatLogTime(action.timestamp)}
                        </span>
                        {idx === 0 && (
                          <span className="px-1 py-0.2 rounded bg-indigo-950 text-indigo-300 border border-indigo-500/40 text-[9px] uppercase font-bold ml-auto">
                            Recente
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </footer>
  );
};

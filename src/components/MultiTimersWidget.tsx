import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Play,
  Pause,
  RotateCcw,
  Plus,
  Trash2,
  Bell,
  Sparkles,
  Flame,
  Shield,
  Zap,
  Timer as TimerIcon,
  ChevronDown,
  ChevronUp,
  Volume2,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { TimerItem, TimerType } from '../types';
import { useAudio } from '../context/AudioContext';
import { playTimerCompletionChime, playSubtleTick } from '../utils/audioAlert';

interface MultiTimersWidgetProps {
  compact?: boolean;
}

const PRESET_TIMERS: Array<{ title: string; type: TimerType; minutes: number; category: TimerItem['category']; color: string; icon: string }> = [
  { title: 'Tocha / Luz', type: 'countdown', minutes: 60, category: 'torch', color: '#f59e0b', icon: '🔥' },
  { title: 'Magia / Concentração', type: 'countdown', minutes: 1, category: 'buff', color: '#8b5cf6', icon: '✨' },
  { title: 'Descanso Curto (5e)', type: 'countdown', minutes: 60, category: 'rest', color: '#10b981', icon: '⛺' },
  { title: 'Veneno / Turno', type: 'countdown', minutes: 0.5, category: 'combat', color: '#ec4899', icon: '☠️' },
  { title: 'Exploração da Masmorra', type: 'stopwatch', minutes: 0, category: 'session', color: '#3b82f6', icon: '🧭' },
];

export const MultiTimersWidget: React.FC<MultiTimersWidgetProps> = ({ compact = false }) => {
  const {
    sessionSeconds,
    isSessionTimerRunning,
    toggleSessionTimer,
    resetSessionTimer,
    addSessionSeconds,
    formatDuration
  } = useAudio();

  const [timers, setTimers] = useState<TimerItem[]>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_custom_timers');
      if (saved) {
        const parsed: TimerItem[] = JSON.parse(saved);
        const now = Date.now();
        // Update elapsed/remaining for running timers based on last timestamp
        return parsed.map(t => {
          if (!t.isRunning || !t.lastUpdatedTimestamp) return t;
          const diffSeconds = Math.floor((now - t.lastUpdatedTimestamp) / 1000);
          if (diffSeconds <= 0) return { ...t, lastUpdatedTimestamp: now };

          if (t.type === 'countdown') {
            const newRemaining = Math.max(0, t.remainingSeconds - diffSeconds);
            const isCompleted = newRemaining === 0;
            return {
              ...t,
              remainingSeconds: newRemaining,
              isRunning: !isCompleted,
              isCompleted,
              lastUpdatedTimestamp: now
            };
          } else {
            return {
              ...t,
              elapsedSeconds: t.elapsedSeconds + diffSeconds,
              lastUpdatedTimestamp: now
            };
          }
        });
      }
    } catch {}
    return [
      {
        id: 'timer-torch-default',
        title: 'Tocha / Vela',
        type: 'countdown',
        totalDurationSeconds: 3600, // 1h
        remainingSeconds: 3600,
        elapsedSeconds: 0,
        isRunning: false,
        lastUpdatedTimestamp: Date.now(),
        category: 'torch',
        color: '#f59e0b',
        alertOnComplete: true,
        isCompleted: false,
        createdAt: Date.now()
      },
      {
        id: 'timer-buff-default',
        title: 'Bênção / Concentração',
        type: 'countdown',
        totalDurationSeconds: 60, // 1 min
        remainingSeconds: 60,
        elapsedSeconds: 0,
        isRunning: false,
        lastUpdatedTimestamp: Date.now(),
        category: 'buff',
        color: '#8b5cf6',
        alertOnComplete: true,
        isCompleted: false,
        createdAt: Date.now()
      }
    ];
  });

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<TimerType>('countdown');
  const [newMinutes, setNewMinutes] = useState(5);
  const [newSeconds, setNewSeconds] = useState(0);
  const [newCategory, setNewCategory] = useState<TimerItem['category']>('custom');

  // Persistence effect
  useEffect(() => {
    try {
      localStorage.setItem('caranguejo_custom_timers', JSON.stringify(timers));
    } catch {}
  }, [timers]);

  // Main high-precision interval for custom timers
  useEffect(() => {
    const hasRunningTimers = timers.some(t => t.isRunning);
    if (!hasRunningTimers) return;

    const interval = setInterval(() => {
      const now = Date.now();
      setTimers(prevTimers => {
        let changed = false;
        const updated = prevTimers.map(timer => {
          if (!timer.isRunning) return timer;

          const diff = Math.max(1, Math.floor((now - (timer.lastUpdatedTimestamp || now)) / 1000));
          if (diff <= 0) return timer;
          changed = true;

          if (timer.type === 'countdown') {
            const nextRemaining = Math.max(0, timer.remainingSeconds - diff);
            const justFinished = nextRemaining === 0 && timer.remainingSeconds > 0;

            if (justFinished && timer.alertOnComplete) {
              playTimerCompletionChime();
            }

            return {
              ...timer,
              remainingSeconds: nextRemaining,
              isRunning: nextRemaining > 0,
              isCompleted: nextRemaining === 0,
              lastUpdatedTimestamp: now
            };
          } else {
            return {
              ...timer,
              elapsedSeconds: timer.elapsedSeconds + diff,
              lastUpdatedTimestamp: now
            };
          }
        });
        return changed ? updated : prevTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timers]);

  const toggleTimer = (id: string) => {
    playSubtleTick();
    const now = Date.now();
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t;
      const nextRunning = !t.isRunning;
      // If restarting an already completed timer, reset it first
      let remaining = t.remainingSeconds;
      let completed = t.isCompleted;
      if (t.type === 'countdown' && t.remainingSeconds === 0 && nextRunning) {
        remaining = t.totalDurationSeconds;
        completed = false;
      }
      return {
        ...t,
        remainingSeconds: remaining,
        isCompleted: completed,
        isRunning: nextRunning,
        lastUpdatedTimestamp: now
      };
    }));
  };

  const resetTimer = (id: string) => {
    playSubtleTick();
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t;
      return {
        ...t,
        remainingSeconds: t.totalDurationSeconds,
        elapsedSeconds: 0,
        isRunning: false,
        isCompleted: false,
        lastUpdatedTimestamp: Date.now()
      };
    }));
  };

  const deleteTimer = (id: string) => {
    setTimers(prev => prev.filter(t => t.id !== id));
  };

  const addTime = (id: string, secondsToAdd: number) => {
    playSubtleTick();
    setTimers(prev => prev.map(t => {
      if (t.id !== id) return t;
      if (t.type === 'countdown') {
        const nextRem = Math.max(0, t.remainingSeconds + secondsToAdd);
        const nextTot = Math.max(t.totalDurationSeconds, nextRem);
        return {
          ...t,
          remainingSeconds: nextRem,
          totalDurationSeconds: nextTot,
          isCompleted: nextRem === 0,
          lastUpdatedTimestamp: Date.now()
        };
      } else {
        return {
          ...t,
          elapsedSeconds: Math.max(0, t.elapsedSeconds + secondsToAdd),
          lastUpdatedTimestamp: Date.now()
        };
      }
    }));
  };

  const handleCreateTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const totalSecs = Math.max(5, newMinutes * 60 + newSeconds);
    const newTimer: TimerItem = {
      id: `timer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: newTitle.trim(),
      type: newType,
      totalDurationSeconds: totalSecs,
      remainingSeconds: totalSecs,
      elapsedSeconds: 0,
      isRunning: true,
      lastUpdatedTimestamp: Date.now(),
      category: newCategory,
      color: newCategory === 'torch' ? '#f59e0b' : newCategory === 'buff' ? '#8b5cf6' : newCategory === 'combat' ? '#ec4899' : '#6366f1',
      alertOnComplete: true,
      isCompleted: false,
      createdAt: Date.now()
    };

    setTimers(prev => [newTimer, ...prev]);
    setNewTitle('');
    setNewMinutes(5);
    setNewSeconds(0);
    setIsCreateModalOpen(false);
  };

  const addPreset = (preset: typeof PRESET_TIMERS[0]) => {
    playSubtleTick();
    const totalSecs = Math.max(10, Math.round(preset.minutes * 60));
    const newTimer: TimerItem = {
      id: `timer-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: preset.title,
      type: preset.type,
      totalDurationSeconds: totalSecs,
      remainingSeconds: totalSecs,
      elapsedSeconds: 0,
      isRunning: true,
      lastUpdatedTimestamp: Date.now(),
      category: preset.category,
      color: preset.color,
      alertOnComplete: true,
      isCompleted: false,
      createdAt: Date.now()
    };
    setTimers(prev => [newTimer, ...prev]);
  };

  return (
    <div className="w-full h-full min-w-0 max-w-full flex flex-col space-y-3">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3139]/60 pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
            {timers.filter(t => t.isRunning).length} Timer(s) Ativo(s)
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCreateModalOpen(!isCreateModalOpen)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Timer</span>
          </button>
        </div>
      </div>

      {/* Primary Master Session Duration Timer Hero Card */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#141619] via-[#181B20] to-[#141619] border border-indigo-500/30 shadow-inner flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
            isSessionTimerRunning
              ? 'bg-indigo-600/25 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20'
              : 'bg-[#22262B] border-[#2D3139] text-[#9E9E9E]'
          }`}>
            <TimerIcon className={`w-6 h-6 ${isSessionTimerRunning ? 'animate-pulse text-indigo-400' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Duração da Sessão
              </span>
              <span className={`w-2 h-2 rounded-full ${isSessionTimerRunning ? 'bg-emerald-400 animate-ping' : 'bg-zinc-600'}`} />
            </div>
            <div className="text-2xl sm:text-3xl font-mono font-extrabold text-white tracking-wider">
              {formatDuration(sessionSeconds)}
            </div>
            <p className="text-[10px] text-[#9E9E9E]">
              Persiste automaticamente durante toda a sessão e troca de abas
            </p>
          </div>
        </div>

        {/* Master Session Timer Action Buttons */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={toggleSessionTimer}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-md cursor-pointer ${
              isSessionTimerRunning
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/30'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30'
            }`}
            title={isSessionTimerRunning ? 'Pausar tempo da sessão' : 'Iniciar cronômetro da sessão'}
          >
            {isSessionTimerRunning ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pausar
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Iniciar
              </>
            )}
          </button>

          <button
            type="button"
            onClick={resetSessionTimer}
            className="p-2 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#9E9E9E] hover:text-white border border-[#2D3139] transition-colors cursor-pointer"
            title="Zerar Cronômetro da Sessão"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          <div className="hidden md:flex items-center gap-1 border-l border-[#2D3139] pl-2">
            <button
              type="button"
              onClick={() => addSessionSeconds(300)}
              className="px-2 py-1 rounded-lg bg-[#141619] hover:bg-[#22262B] text-[10px] font-mono text-[#D0D4DC] border border-[#2D3139] hover:text-white transition-colors"
              title="Adicionar 5 minutos"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => addSessionSeconds(1800)}
              className="px-2 py-1 rounded-lg bg-[#141619] hover:bg-[#22262B] text-[10px] font-mono text-[#D0D4DC] border border-[#2D3139] hover:text-white transition-colors"
              title="Adicionar 30 minutos"
            >
              +30m
            </button>
          </div>
        </div>
      </div>

      {/* Quick 1-Click Presets */}
      <div>
        <span className="text-[10px] uppercase font-bold text-[#6E7681] block mb-1.5">
          Adicionar Temporizador Rápido de RPG:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {PRESET_TIMERS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => addPreset(p)}
              className="px-2.5 py-1 rounded-xl bg-[#141619] hover:bg-indigo-950/40 text-xs text-[#D0D4DC] hover:text-indigo-200 border border-[#2D3139] hover:border-indigo-500/40 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              title={`Criar temporizador de ${p.title}`}
            >
              <span>{p.icon}</span>
              <span className="font-semibold">{p.title}</span>
              <span className="text-[10px] font-mono text-zinc-400">
                {p.type === 'countdown' ? (p.minutes < 1 ? `${p.minutes * 60}s` : `${p.minutes}m`) : '⏱️'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Create Timer Form Modal / Collapsible */}
      {isCreateModalOpen && (
        <form onSubmit={handleCreateTimer} className="p-4 rounded-xl bg-[#141619] border border-indigo-500/40 space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              Criar Novo Temporizador Customizado
            </h4>
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="text-[11px] text-[#9E9E9E] hover:text-white"
            >
              ✕ Fechar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            <div className="sm:col-span-6">
              <label className="text-[10px] text-[#9E9E9E] block mb-1">Nome / Rótulo</label>
              <input
                type="text"
                placeholder="Ex: Duração do Escudo Arcano, Fogueira..."
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                required
              />
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] text-[#9E9E9E] block mb-1">Tipo</label>
              <select
                value={newType}
                onChange={e => setNewType(e.target.value as TimerType)}
                className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="countdown">Regressivo (Temporizador)</option>
                <option value="stopwatch">Progressivo (Cronômetro)</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="text-[10px] text-[#9E9E9E] block mb-1">Categoria</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as any)}
                className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="buff">✨ Magia / Buff</option>
                <option value="torch">🔥 Tocha / Luz</option>
                <option value="combat">⚔️ Combate / Rodada</option>
                <option value="rest">⛺ Descanso</option>
                <option value="custom">⚙️ Personalizado</option>
              </select>
            </div>
          </div>

          {newType === 'countdown' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[10px] text-[#9E9E9E] block mb-1">Minutos</label>
                <input
                  type="number"
                  min="0"
                  max="720"
                  value={newMinutes}
                  onChange={e => setNewMinutes(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] text-[#9E9E9E] block mb-1">Segundos</label>
                <input
                  type="number"
                  min="0"
                  max="59"
                  value={newSeconds}
                  onChange={e => setNewSeconds(Math.max(0, Math.min(59, parseInt(e.target.value) || 0)))}
                  className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(false)}
              className="px-3 py-1.5 rounded-xl bg-[#22262B] text-zinc-300 text-xs font-semibold hover:bg-[#2D3139]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 cursor-pointer"
            >
              Criar e Iniciar
            </button>
          </div>
        </form>
      )}

      {/* Active Custom Timers List */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {timers.length === 0 ? (
          <div className="p-6 text-center text-[#6E7681] text-xs border border-dashed border-[#2D3139] rounded-xl">
            Nenhum temporizador ativo. Clique em &quot;Novo Temporizador&quot; ou use um dos botões rápidos acima!
          </div>
        ) : (
          timers.map(timer => {
            const isCountdown = timer.type === 'countdown';
            const displayTime = isCountdown ? timer.remainingSeconds : timer.elapsedSeconds;
            const progressPercent = isCountdown
              ? timer.totalDurationSeconds > 0
                ? Math.min(100, Math.max(0, (timer.remainingSeconds / timer.totalDurationSeconds) * 100))
                : 0
              : 100;

            const isExpired = isCountdown && timer.isCompleted;

            return (
              <div
                key={timer.id}
                className={`p-3 rounded-xl border transition-all relative overflow-hidden ${
                  isExpired
                    ? 'bg-rose-950/30 border-rose-500/60 text-rose-200 animate-pulse'
                    : timer.isRunning
                    ? 'bg-[#141619] border-indigo-500/50 shadow-md shadow-indigo-600/10'
                    : 'bg-[#141619] border-[#2D3139] text-[#9E9E9E]'
                }`}
              >
                {/* Progress bar background for countdowns */}
                {isCountdown && (
                  <div
                    className={`absolute bottom-0 left-0 h-1 transition-all duration-1000 ${
                      isExpired
                        ? 'bg-rose-500 w-full'
                        : progressPercent <= 20
                        ? 'bg-rose-500'
                        : progressPercent <= 50
                        ? 'bg-amber-500'
                        : 'bg-indigo-500'
                    }`}
                    style={{ width: isExpired ? '100%' : `${progressPercent}%` }}
                  />
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => toggleTimer(timer.id)}
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                        isExpired
                          ? 'bg-rose-600 text-white shadow-md'
                          : timer.isRunning
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-[#22262B] text-[#D0D4DC] hover:bg-indigo-600 hover:text-white'
                      }`}
                      title={timer.isRunning ? 'Pausar' : 'Iniciar'}
                    >
                      {timer.isRunning ? (
                        <Pause className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Play className="w-3.5 h-3.5 fill-current translate-x-0.5" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white truncate">
                          {timer.title}
                        </span>
                        {isExpired && (
                          <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white animate-bounce">
                            Expirou!
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-[#9E9E9E] font-mono block">
                        {isCountdown ? `Total: ${formatDuration(timer.totalDurationSeconds)}` : 'Cronômetro'}
                      </span>
                    </div>
                  </div>

                  {/* Digits and Action Tools */}
                  <div className="flex items-center gap-2">
                    <span className={`text-base sm:text-lg font-bold font-mono ${
                      isExpired
                        ? 'text-rose-400 font-extrabold'
                        : timer.isRunning
                        ? 'text-indigo-300'
                        : 'text-[#D0D4DC]'
                    }`}>
                      {formatDuration(displayTime)}
                    </span>

                    {/* Quick +1m button */}
                    <button
                      type="button"
                      onClick={() => addTime(timer.id, 60)}
                      className="px-1.5 py-1 rounded bg-[#22262B] hover:bg-[#2D3139] text-[10px] font-mono text-zinc-300 hover:text-white transition-colors"
                      title="Adicionar +1 minuto"
                    >
                      +1m
                    </button>

                    {/* Reset */}
                    <button
                      type="button"
                      onClick={() => resetTimer(timer.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-[#22262B] transition-colors"
                      title="Reiniciar Temporizador"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => deleteTimer(timer.id)}
                      className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-[#22262B] transition-colors"
                      title="Excluir Temporizador"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

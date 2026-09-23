import React, { useState, useEffect } from 'react';
import {
  Dices,
  Send,
  Trash2,
  Plus,
  Minus,
  Sparkles,
  History,
  Bookmark,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Zap,
  Flame,
  Shield,
  Clock,
  HelpCircle
} from 'lucide-react';
import { AdvancedDiceRollResult, DicePreset } from '../types';
import { safeFetchJson } from '../services/api';
import { rollAdvancedDice, parseAdvancedDiceFormula } from '../utils/advancedDice';

interface AdvancedDiceRollerProps {
  onRollComplete?: (roll: AdvancedDiceRollResult) => void;
  className?: string;
}

const COMMON_DICE = [4, 6, 8, 10, 12, 20, 100];

export const AdvancedDiceRoller: React.FC<AdvancedDiceRollerProps> = ({
  onRollComplete,
  className = ''
}) => {
  // Formula builder state
  const [diceCounts, setDiceCounts] = useState<Record<number, number>>({
    4: 0,
    6: 0,
    8: 0,
    10: 0,
    12: 0,
    20: 1,
    100: 0
  });
  const [modifier, setModifier] = useState<number>(0);
  const [advantageMode, setAdvantageMode] = useState<'normal' | 'advantage' | 'disadvantage'>('normal');
  const [customFormula, setCustomFormula] = useState<string>('1d20');
  const [useCustomFormula, setUseCustomFormula] = useState<boolean>(false);
  const [rollLabel, setRollLabel] = useState<string>('');
  const [broadcastToDiscord, setBroadcastToDiscord] = useState<boolean>(true);

  // Status and results
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [latestRoll, setLatestRoll] = useState<AdvancedDiceRollResult | null>(null);
  const [history, setHistory] = useState<AdvancedDiceRollResult[]>([]);
  const [presets, setPresets] = useState<DicePreset[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Load history and presets
  useEffect(() => {
    loadHistory();
    loadPresets();
  }, []);

  const loadHistory = async () => {
    try {
      const res = await safeFetchJson<AdvancedDiceRollResult[]>('/api/dice/history');
      if (res.success && Array.isArray(res.data)) {
        setHistory(res.data);
      }
    } catch {}
  };

  const loadPresets = async () => {
    try {
      const res = await safeFetchJson<DicePreset[]>('/api/dice/presets');
      if (res.success && Array.isArray(res.data)) {
        setPresets(res.data);
      }
    } catch {}
  };

  // Recompute builder formula when dice buttons or modifier change
  useEffect(() => {
    if (useCustomFormula) return;

    const parts: string[] = [];
    Object.entries(diceCounts).forEach(([sidesStr, countVal]) => {
      const sides = parseInt(sidesStr, 10);
      const count = Number(countVal) || 0;
      if (count > 0) {
        if (sides === 20 && advantageMode === 'advantage') {
          parts.push(`${count + 1}d20kh1`);
        } else if (sides === 20 && advantageMode === 'disadvantage') {
          parts.push(`${count + 1}d20kl1`);
        } else {
          parts.push(`${count}d${sides}`);
        }
      }
    });

    if (parts.length === 0) {
      parts.push('1d20');
    }

    let formulaStr = parts.join(' + ');
    if (modifier > 0) {
      formulaStr += ` + ${modifier}`;
    } else if (modifier < 0) {
      formulaStr += ` - ${Math.abs(modifier)}`;
    }

    setCustomFormula(formulaStr);
  }, [diceCounts, modifier, advantageMode, useCustomFormula]);

  const handleDiceIncrement = (sides: number) => {
    setUseCustomFormula(false);
    setDiceCounts(prev => ({
      ...prev,
      [sides]: (prev[sides] || 0) + 1
    }));
  };

  const handleDiceDecrement = (sides: number) => {
    setUseCustomFormula(false);
    setDiceCounts(prev => ({
      ...prev,
      [sides]: Math.max(0, (prev[sides] || 0) - 1)
    }));
  };

  const handleResetBuilder = () => {
    setUseCustomFormula(false);
    setDiceCounts({ 4: 0, 6: 0, 8: 0, 10: 0, 12: 0, 20: 1, 100: 0 });
    setModifier(0);
    setAdvantageMode('normal');
    setCustomFormula('1d20');
    setRollLabel('');
  };

  const executeRoll = async (formulaToRoll?: string, customLabel?: string) => {
    const targetFormula = formulaToRoll || customFormula;
    if (!targetFormula.trim()) return;

    setIsRolling(true);
    setFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{
        success: boolean;
        result: AdvancedDiceRollResult;
        discordSent: boolean;
        discordError?: string;
      }>('/api/dice/advanced-roll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formula: targetFormula,
          rollerName: 'Mestre',
          label: customLabel || rollLabel || undefined,
          broadcastToDiscord
        })
      });

      if (res.success && res.data?.result) {
        const rollRes = res.data.result;
        setLatestRoll(rollRes);
        setHistory(prev => [rollRes, ...prev.slice(0, 49)]);

        if (broadcastToDiscord) {
          if (res.data.discordSent) {
            setFeedback({ status: 'success', msg: 'Resultado enviado ao Discord!' });
          } else {
            setFeedback({
              status: 'error',
              msg: res.data.discordError || 'Rolagem executada localmente (Discord offline ou canal não configurado).'
            });
          }
        }

        if (onRollComplete) {
          onRollComplete(rollRes);
        }
      } else {
        // Fallback local roll if server failed
        const localRes = rollAdvancedDice(targetFormula, 'Mestre', customLabel || rollLabel);
        setLatestRoll(localRes);
        setHistory(prev => [localRes, ...prev]);
        setFeedback({ status: 'success', msg: 'Rolagem local computada com sucesso.' });
      }
    } catch (err: any) {
      const localRes = rollAdvancedDice(targetFormula, 'Mestre', customLabel || rollLabel);
      setLatestRoll(localRes);
      setHistory(prev => [localRes, ...prev]);
    } finally {
      setIsRolling(false);
    }
  };

  const handleSavePreset = async () => {
    if (!customFormula.trim()) return;
    const name = prompt('Nome para esta predefinição de rolagem (Ex: Bola de Fogo, Ataque Furtivo):');
    if (!name) return;

    try {
      const res = await safeFetchJson<DicePreset>('/api/dice/presets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          formula: customFormula,
          description: rollLabel || undefined,
          color: '#6366f1',
          category: 'Ataque'
        })
      });
      if (res.success && res.data) {
        setPresets(prev => [...prev, res.data]);
        setFeedback({ status: 'success', msg: `Predefinição "${name}" salva!` });
      }
    } catch {}
  };

  const handleClearHistory = async () => {
    if (!confirm('Deseja realmente limpar todo o histórico de rolagens?')) return;
    try {
      await safeFetchJson('/api/dice/history', { method: 'DELETE' });
      setHistory([]);
    } catch {}
  };

  return (
    <div className={`flex flex-col space-y-3 ${className}`}>
      {/* Header Controls: Modes & Discord Broadcast */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#282C34] pb-2.5">
        <div className="flex items-center gap-1 bg-[#121418] p-1 rounded-xl border border-[#2D3139]">
          <button
            type="button"
            onClick={() => setAdvantageMode('normal')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              advantageMode === 'normal'
                ? 'bg-zinc-700 text-white shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Normal
          </button>
          <button
            type="button"
            onClick={() => setAdvantageMode('advantage')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              advantageMode === 'advantage'
                ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-emerald-300'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            Vantagem
          </button>
          <button
            type="button"
            onClick={() => setAdvantageMode('disadvantage')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              advantageMode === 'disadvantage'
                ? 'bg-rose-600/30 text-rose-300 border border-rose-500/50 shadow-sm'
                : 'text-zinc-400 hover:text-rose-300'
            }`}
          >
            <Shield className="w-3 h-3 text-rose-400" />
            Desvantagem
          </button>
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={broadcastToDiscord}
              onChange={e => setBroadcastToDiscord(e.target.checked)}
              className="rounded bg-[#16181D] border-[#2D3139] text-indigo-600 focus:ring-0 w-3.5 h-3.5 cursor-pointer"
            />
            <span className="flex items-center gap-1">
              <Send className="w-3 h-3 text-indigo-400" />
              Enviar ao Discord
            </span>
          </label>

          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-all ${
              showHistory
                ? 'bg-indigo-600/30 border-indigo-500 text-indigo-200'
                : 'bg-[#181B20] border-[#2D3139] text-zinc-400 hover:text-white'
            }`}
            title="Ver Histórico de Rolagens"
          >
            <History className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">({history.length})</span>
          </button>
        </div>
      </div>

      {/* Polyhedral Dice Quick Bar (d4, d6, d8, d10, d12, d20, d100) */}
      <div className="grid grid-cols-7 gap-1.5">
        {COMMON_DICE.map(sides => {
          const count = diceCounts[sides] || 0;
          return (
            <div
              key={sides}
              className={`flex flex-col items-center justify-between p-1.5 rounded-xl border transition-all ${
                count > 0
                  ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md shadow-indigo-950/20'
                  : 'bg-[#15171C] border-[#262A32] hover:border-zinc-600'
              }`}
            >
              <div className="flex items-center justify-between w-full text-[10px] text-zinc-400 font-mono px-0.5">
                <span className="font-bold text-white">d{sides}</span>
                {count > 0 && <span className="text-indigo-400 font-bold">{count}x</span>}
              </div>

              {/* Click button adds 1 */}
              <button
                type="button"
                onClick={() => handleDiceIncrement(sides)}
                className="w-full py-1.5 my-1 rounded-lg bg-[#20232A] hover:bg-indigo-600 text-white text-xs font-bold font-mono transition-all flex items-center justify-center cursor-pointer active:scale-95"
              >
                +d{sides}
              </button>

              {/* Minus button to decrement */}
              {count > 0 && (
                <button
                  type="button"
                  onClick={() => handleDiceDecrement(sides)}
                  className="w-full py-0.5 text-[10px] text-zinc-400 hover:text-rose-400 flex items-center justify-center hover:bg-rose-950/30 rounded cursor-pointer"
                >
                  <Minus className="w-2.5 h-2.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Modifiers & Action Label */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
        <div className="sm:col-span-4 flex items-center gap-1.5 bg-[#14161B] p-1.5 rounded-xl border border-[#282C34]">
          <span className="text-xs text-zinc-400 font-medium px-1">Modificador:</span>
          <button
            type="button"
            onClick={() => {
              setUseCustomFormula(false);
              setModifier(m => m - 1);
            }}
            className="w-7 h-7 rounded-lg bg-[#20232A] hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center"
          >
            -
          </button>
          <input
            type="number"
            value={modifier}
            onChange={e => {
              setUseCustomFormula(false);
              setModifier(parseInt(e.target.value) || 0);
            }}
            className="w-12 bg-[#0E1013] border border-[#2D3139] rounded-lg py-1 text-center font-mono text-xs text-white focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={() => {
              setUseCustomFormula(false);
              setModifier(m => m + 1);
            }}
            className="w-7 h-7 rounded-lg bg-[#20232A] hover:bg-zinc-700 text-white text-xs font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>

        <div className="sm:col-span-8 flex items-center gap-2">
          <input
            type="text"
            placeholder="Ação / Motivo (Ex: Golpe com Machado, Percepção)..."
            value={rollLabel}
            onChange={e => setRollLabel(e.target.value)}
            className="flex-1 bg-[#14161B] border border-[#282C34] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="button"
            onClick={handleResetBuilder}
            className="px-2.5 py-1.5 text-xs text-zinc-400 hover:text-white bg-[#181B20] hover:bg-[#20242B] border border-[#282C34] rounded-xl transition-all"
            title="Resetar Fórmula"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Formula Display & Roll Action */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2 bg-[#101216] border border-indigo-500/40 rounded-xl px-3 py-2 shadow-inner">
          <Dices className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            type="text"
            value={customFormula}
            onChange={e => {
              setUseCustomFormula(true);
              setCustomFormula(e.target.value);
            }}
            className="flex-1 bg-transparent text-sm font-mono font-bold text-white focus:outline-none"
            placeholder="Ex: 2d20kh1 + 1d6 + 4"
          />
          <button
            type="button"
            onClick={handleSavePreset}
            className="text-[11px] text-zinc-400 hover:text-amber-400 flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800/60 border border-zinc-700 hover:border-amber-500/50 transition-all"
            title="Salvar fórmula atual como predefinição rápida"
          >
            <Bookmark className="w-3 h-3 text-amber-400" />
            <span>Salvar</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => executeRoll()}
          disabled={isRolling}
          className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>{isRolling ? 'Rolando...' : 'Rolar Dados'}</span>
        </button>
      </div>

      {/* Quick Presets Bar */}
      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider shrink-0 flex items-center gap-1">
            <Bookmark className="w-2.5 h-2.5 text-amber-400" />
            Favoritos:
          </span>
          {presets.slice(0, 8).map(preset => (
            <button
              key={preset.id}
              type="button"
              onClick={() => {
                setCustomFormula(preset.formula);
                setUseCustomFormula(true);
                if (preset.description) setRollLabel(preset.description);
                executeRoll(preset.formula, preset.description);
              }}
              className="shrink-0 px-2 py-1 rounded-lg bg-[#181B20] hover:bg-indigo-950/40 border border-[#2D3139] hover:border-indigo-500/50 text-[11px] text-zinc-300 hover:text-white transition-all flex items-center gap-1"
            >
              <span className="font-semibold">{preset.name}</span>
              <span className="text-[10px] font-mono text-indigo-400">({preset.formula})</span>
            </button>
          ))}
        </div>
      )}

      {/* Feedback banner */}
      {feedback.msg && (
        <div
          className={`flex items-center gap-2 p-2 rounded-xl text-xs ${
            feedback.status === 'success'
              ? 'bg-emerald-950/40 border border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border border-rose-500/40 text-rose-300'
          }`}
        >
          {feedback.status === 'success' ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Latest Roll Display Card */}
      {latestRoll && (
        <div
          className={`p-3.5 rounded-2xl border transition-all ${
            latestRoll.isCriticalSuccess
              ? 'bg-gradient-to-br from-emerald-950/50 via-[#13161C] to-emerald-950/30 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
              : latestRoll.isCriticalFail
              ? 'bg-gradient-to-br from-rose-950/50 via-[#13161C] to-rose-950/30 border-rose-500/60 shadow-lg shadow-rose-500/10'
              : 'bg-[#13151A] border-[#2A2E37]'
          }`}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2 mb-2.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white font-mono">{latestRoll.cleanFormula}</span>
              {latestRoll.label && (
                <span className="text-[11px] text-zinc-400 italic">• {latestRoll.label}</span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {latestRoll.isCriticalSuccess && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/50 flex items-center gap-1 animate-pulse">
                  <Sparkles className="w-3 h-3 text-emerald-300" />
                  NAT 20 CRÍTICO!
                </span>
              )}
              {latestRoll.isCriticalFail && (
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-500/30 text-rose-300 border border-rose-400/50 flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  NAT 1 FALHA!
                </span>
              )}
              <span className="text-[10px] text-zinc-500 font-mono">
                {new Date(latestRoll.timestamp).toLocaleTimeString('pt-BR', { hour12: false })}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {/* Total Highlight */}
            <div className="flex items-baseline gap-3">
              <span className="text-xs text-zinc-400 uppercase font-semibold">Total:</span>
              <span
                className={`text-3xl sm:text-4xl font-black font-mono tracking-tight ${
                  latestRoll.isCriticalSuccess
                    ? 'text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.5)]'
                    : latestRoll.isCriticalFail
                    ? 'text-rose-400 drop-shadow-[0_0_12px_rgba(244,63,94,0.5)]'
                    : 'text-white'
                }`}
              >
                {latestRoll.total}
              </span>
            </div>

            {/* Breakdown per group */}
            <div className="flex flex-wrap items-center gap-2">
              {latestRoll.groups.map((group, idx) => (
                <div
                  key={idx}
                  className="px-2 py-1 rounded-lg bg-[#0E1013] border border-[#242730] text-[11px] text-zinc-300 font-mono"
                >
                  <span className="text-indigo-400 font-bold">{group.notation}:</span>{' '}
                  <span>[{group.keptRolls.join(', ')}]</span>
                  {group.droppedRolls && group.droppedRolls.length > 0 && (
                    <span className="text-zinc-500 line-through ml-1">
                      [{group.droppedRolls.join(', ')}]
                    </span>
                  )}
                  <span className="text-zinc-400 ml-1">={group.subtotal}</span>
                </div>
              ))}
              {latestRoll.modifier !== 0 && (
                <div className="px-2 py-1 rounded-lg bg-[#0E1013] border border-[#242730] text-[11px] text-zinc-300 font-mono">
                  <span className="text-amber-400 font-bold">Mod:</span>{' '}
                  <span>{latestRoll.modifier > 0 ? `+${latestRoll.modifier}` : latestRoll.modifier}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* History Drawer */}
      {showHistory && (
        <div className="p-3 bg-[#111317] border border-[#282C34] rounded-2xl space-y-2">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-indigo-400" />
              Histórico de Rolagens Recentes
            </span>
            {history.length > 0 && (
              <button
                type="button"
                onClick={handleClearHistory}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3 h-3" />
                Limpar
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <p className="text-xs text-zinc-500 text-center py-4">Nenhuma rolagem registrada ainda.</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {history.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#16181E] border border-[#262A32] text-xs hover:border-indigo-500/40 transition-all"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-mono font-bold text-white shrink-0">{item.cleanFormula}</span>
                    {item.label && (
                      <span className="text-zinc-400 text-[11px] truncate max-w-[140px]">
                        • {item.label}
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-500 font-mono truncate hidden sm:inline">
                      {item.breakdown}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`font-black font-mono text-sm px-2 py-0.5 rounded ${
                        item.isCriticalSuccess
                          ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                          : item.isCriticalFail
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-500/40'
                          : 'text-white'
                      }`}
                    >
                      {item.total}
                    </span>
                    <button
                      type="button"
                      onClick={() => executeRoll(item.cleanFormula, item.label)}
                      className="p-1 rounded bg-[#20232A] hover:bg-indigo-600 text-zinc-300 hover:text-white transition-all"
                      title="Re-rolar esta fórmula"
                    >
                      <RotateCcw className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

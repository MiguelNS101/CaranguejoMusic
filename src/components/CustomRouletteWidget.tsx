import React, { useState, useRef, useEffect } from 'react';
import {
  RotateCcw,
  Send,
  Plus,
  Trash2,
  Sparkles,
  Dices,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Palette,
  Percent,
  Sliders,
  Play
} from 'lucide-react';
import { safeFetchJson } from '../services/api';
import { getRoulettePresets, RoulettePreset } from '../utils/presetStore';

export interface RouletteOption {
  id: string;
  label: string;
  weight: number; // percentage or relative weight
  color: string;
}

const PRESET_PALETTES = [
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#6366f1', // Indigo
  '#a855f7', // Purple
  '#ec4899', // Pink
  '#84cc16'  // Lime
];

export const CustomRouletteWidget: React.FC = () => {
  const [presets, setPresets] = useState<RoulettePreset[]>(() => getRoulettePresets());

  useEffect(() => {
    const handleUpdate = () => {
      setPresets(getRoulettePresets());
    };
    window.addEventListener('caranguejo_presets_updated', handleUpdate);
    return () => window.removeEventListener('caranguejo_presets_updated', handleUpdate);
  }, []);

  const [options, setOptions] = useState<RouletteOption[]>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_roulette_current_options');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem('caranguejo_roulette_current_options', JSON.stringify(options));
    } catch {}
  }, [options]);

  const [isSpinning, setIsSpinning] = useState<boolean>(false);
  const [rotation, setRotation] = useState<number>(0);
  const [selectedResult, setSelectedResult] = useState<{ label: string; percentage: number; color: string } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  // Add Option Form State
  const [newLabel, setNewLabel] = useState('');
  const [newWeight, setNewWeight] = useState(25);

  const totalWeight = options.reduce((acc, curr) => acc + curr.weight, 0);

  // Normalize percentages
  const handleNormalize = () => {
    if (totalWeight <= 0 || options.length === 0) return;
    const factor = 100 / totalWeight;
    const normalized = options.map((opt) => ({
      ...opt,
      weight: Math.max(1, Math.round(opt.weight * factor))
    }));
    // adjust remainder to sum strictly 100
    const currentSum = normalized.reduce((acc, o) => acc + o.weight, 0);
    const diff = 100 - currentSum;
    if (diff !== 0 && normalized.length > 0) {
      normalized[0].weight += diff;
    }
    setOptions(normalized);
  };

  const handleAddOption = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabel.trim()) return;

    const nextColor = PRESET_PALETTES[options.length % PRESET_PALETTES.length];
    setOptions([
      ...options,
      {
        id: Date.now().toString(),
        label: newLabel.trim(),
        weight: Math.max(1, newWeight),
        color: nextColor
      }
    ]);
    setNewLabel('');
  };

  const handleRemoveOption = (id: string) => {
    setOptions(options.filter((o) => o.id !== id));
  };

  const handleLoadPreset = (presetIndex: number) => {
    const p = presets[presetIndex];
    if (!p) return;
    setOptions(
      (p.options || []).map((opt, i) => ({
        id: `${Date.now()}-${i}`,
        label: opt.label,
        weight: opt.weight,
        color: opt.color || PRESET_PALETTES[i % PRESET_PALETTES.length]
      }))
    );
    setSelectedResult(null);
  };

  // Spin Algorithm
  const spinRoulette = () => {
    if (isSpinning || options.length < 2 || totalWeight <= 0) return;

    setIsSpinning(true);
    setSelectedResult(null);

    // Pick random number between 0 and totalWeight
    const randomVal = Math.random() * totalWeight;
    let accumulated = 0;
    let winnerIndex = 0;

    for (let i = 0; i < options.length; i++) {
      accumulated += options[i].weight;
      if (randomVal <= accumulated) {
        winnerIndex = i;
        break;
      }
    }

    const winner = options[winnerIndex];
    const winnerPercentage = Math.round((winner.weight / totalWeight) * 100);

    // Calculate angles
    // Each option occupies (weight / totalWeight) * 360 degrees
    let startAngle = 0;
    for (let i = 0; i < winnerIndex; i++) {
      startAngle += (options[i].weight / totalWeight) * 360;
    }
    const sliceAngle = (winner.weight / totalWeight) * 360;
    // Aim pointer at top (270 deg or 90 deg depending on orientation).
    // Let's have pointer at the top (0 degrees or 270 degrees in SVG).
    // Pointer is at the top (12 o'clock = 270 deg in standard math or 0 deg if top).
    // Let's compute target angle so winner's midpoint aligns with the top pointer (0 deg).
    const midAngle = startAngle + sliceAngle / 2;
    // Extra revolutions for dramatic effect (5 to 8 full spins)
    const extraSpins = 360 * (5 + Math.floor(Math.random() * 3));
    const targetRotation = rotation + extraSpins + (360 - (midAngle % 360));

    setRotation(targetRotation);

    setTimeout(() => {
      setSelectedResult({
        label: winner.label,
        percentage: winnerPercentage,
        color: winner.color
      });
      setIsSpinning(false);
    }, 3800);
  };

  const handleSendToDiscord = async () => {
    if (!selectedResult) return;

    setIsSending(true);
    setFeedback({ status: 'idle' });

    try {
      let msg = `🎡 **SORTEIO NA ROLETA DO MESTRE**\n`;
      msg += `🎯 **Resultado Sorteado:** **${selectedResult.label}** (${selectedResult.percentage}% de chance)\n\n`;
      msg += `📋 **Opções & Probabilidades da Roleta:**\n`;
      options.forEach((opt) => {
        const pct = Math.round((opt.weight / totalWeight) * 100);
        msg += `• **${opt.label}**: \`${pct}%\`${opt.label === selectedResult.label ? ' 👈 **[SORTEADO]**' : ''}\n`;
      });

      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/chat/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: msg,
          type: 'narration'
        })
      });

      if (res.success) {
        setFeedback({ status: 'success', message: 'Resultado enviado ao Discord!' });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', message: res.error || 'Erro ao enviar ao Discord.' });
        setTimeout(() => setFeedback({ status: 'idle' }), 4000);
      }
    } catch {
      setFeedback({ status: 'error', message: 'Erro de conexão com o bot.' });
    } finally {
      setIsSending(false);
    }
  };

  const handleCopy = () => {
    if (!selectedResult) return;
    const msg = `🎡 Roleta do Mestre: ${selectedResult.label} (${selectedResult.percentage}% de chance)`;
    navigator.clipboard.writeText(msg);
    setFeedback({ status: 'success', message: 'Copiado para a área de transferência!' });
    setTimeout(() => setFeedback({ status: 'idle' }), 3000);
  };

  // SVG Wheel Slice Generator
  const renderWheelSlices = () => {
    if (options.length === 0 || totalWeight <= 0) {
      return (
        <g>
          <circle cx="100" cy="100" r="90" fill="#1A1D21" stroke="#2D3139" strokeWidth="2" strokeDasharray="4 4" />
          <text
            x="100"
            y="100"
            fill="#71717A"
            fontSize="7"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
          >
            Roleta Vazia
          </text>
        </g>
      );
    }

    let currentAngle = 0;
    return options.map((option, index) => {
      const sliceAngle = (option.weight / totalWeight) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + sliceAngle;
      currentAngle += sliceAngle;

      // Coordinate math
      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = ((endAngle - 90) * Math.PI) / 180;

      const x1 = 100 + 90 * Math.cos(startRad);
      const y1 = 100 + 90 * Math.sin(startRad);
      const x2 = 100 + 90 * Math.cos(endRad);
      const y2 = 100 + 90 * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = `M 100 100 L ${x1} ${y1} A 90 90 0 ${largeArc} 1 ${x2} ${y2} Z`;

      // Label positioning
      const midRad = (((startAngle + endAngle) / 2 - 90) * Math.PI) / 180;
      const textX = 100 + 60 * Math.cos(midRad);
      const textY = 100 + 60 * Math.sin(midRad);
      const textAngle = (startAngle + endAngle) / 2;

      return (
        <g key={option.id}>
          <path d={pathData} fill={option.color} stroke="#141619" strokeWidth="1.5" />
          <text
            x={textX}
            y={textY}
            fill="#ffffff"
            fontSize="7"
            fontWeight="bold"
            textAnchor="middle"
            dominantBaseline="central"
            transform={`rotate(${textAngle}, ${textX}, ${textY})`}
            className="select-none pointer-events-none drop-shadow"
          >
            {option.label.length > 13 ? `${option.label.slice(0, 11)}...` : option.label}
          </text>
        </g>
      );
    });
  };

  return (
    <div className="w-full h-full flex flex-col space-y-3.5 text-zinc-100">
      {/* Presets Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar shrink-0">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 shrink-0 mr-1 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-400" />
          Predefinições:
        </span>
        {presets.map((preset, idx) => (
          <button
            key={preset.id || idx}
            onClick={() => handleLoadPreset(idx)}
            className="px-2.5 py-1 rounded-lg bg-[#141619] border border-[#2D3139] hover:border-zinc-500 hover:text-white text-zinc-300 text-[11px] font-medium transition-colors shrink-0 cursor-pointer"
          >
            {preset.name}
          </button>
        ))}
      </div>

      {/* Main Interactive Stage */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
        {/* Left: Interactive Wheel Visual */}
        <div className="flex flex-col items-center justify-center p-3 bg-[#141619] border border-[#2D3139] rounded-2xl relative shadow-sm">
          {/* Needle Indicator at Top */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center pointer-events-none">
            <div className="w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[16px] border-t-amber-400 drop-shadow-md" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 -mt-1 shadow" />
          </div>

          {/* SVG Wheel */}
          <div className="relative w-52 h-52 sm:w-56 sm:h-56 my-2">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full drop-shadow-xl"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: isSpinning ? 'transform 3.8s cubic-bezier(0.15, 0.9, 0.2, 1)' : 'none'
              }}
            >
              {renderWheelSlices()}
              {/* Central Hub */}
              <circle cx="100" cy="100" r="18" fill="#141619" stroke="#2D3139" strokeWidth="3" />
              <circle cx="100" cy="100" r="9" fill="#eab308" />
            </svg>
          </div>

          {/* Spin Trigger Button */}
          <button
            onClick={spinRoulette}
            disabled={isSpinning || options.length < 2}
            className={`w-full py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer ${
              isSpinning
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 shadow-amber-500/25'
            }`}
          >
            <Play className={`w-4 h-4 fill-current ${isSpinning ? 'animate-spin' : ''}`} />
            <span>{isSpinning ? 'Girando a Roleta...' : 'GIRAR ROLETA'}</span>
          </button>
        </div>

        {/* Right: Winner Result & Quick Actions */}
        <div className="flex flex-col space-y-3">
          {/* Winner Banner */}
          {selectedResult ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-[#1A1D21] to-[#141619] border border-amber-500/40 shadow-lg shadow-amber-500/10 flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Resultado Sorteado
                </span>
                <h3 className="text-lg font-bold text-white mt-1.5 flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full shrink-0"
                    style={{ backgroundColor: selectedResult.color }}
                  />
                  {selectedResult.label}
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Probabilidade calculada do setor: <strong className="text-amber-400">{selectedResult.percentage}%</strong>
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1 border-t border-[#2D3139]">
                <button
                  onClick={handleSendToDiscord}
                  disabled={isSending}
                  className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Enviando...' : 'Mandar no Chat'}</span>
                </button>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-xl bg-[#1A1D21] border border-[#2D3139] text-zinc-300 hover:text-white hover:bg-[#252830] transition-colors"
                  title="Copiar Resultado"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="p-5 rounded-2xl bg-[#141619] border border-dashed border-[#2D3139] text-center text-zinc-500">
              <Dices className="w-6 h-6 text-amber-400/50 mx-auto mb-2" />
              <h4 className="text-xs font-bold text-zinc-300">Pronta para o Giro</h4>
              <p className="text-[11px] text-zinc-500 mt-0.5">
                Clique em Girar Roleta para sortear com as porcentagens configuradas.
              </p>
            </div>
          )}

          {/* Balance & Normalize Button */}
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#141619] border border-[#2D3139] text-xs">
            <span className="text-zinc-400 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-indigo-400" />
              Soma dos Pesos: <strong style={{ marginRight: '10px' }} className={totalWeight === 100 ? 'text-emerald-400 mr-2.5' : 'text-amber-400 mr-2.5'}>{totalWeight}%</strong>
            </span>
            <button
              onClick={handleNormalize}
              className="px-2.5 py-1 rounded-lg bg-[#1A1D21] border border-[#2D3139] hover:border-indigo-500 text-indigo-300 text-[11px] font-bold transition-colors cursor-pointer"
            >
              Normalizar para 100%
            </button>
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.status !== 'idle' && (
        <div
          className={`px-3 py-2 rounded-xl text-xs flex items-center gap-2 font-medium ${
            feedback.status === 'success'
              ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-500/30 text-rose-300'
          }`}
        >
          {feedback.status === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Options List & Customization */}
      <div className="bg-[#141619] border border-[#2D3139] rounded-2xl p-3.5 space-y-3 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#2D3139]/80 pb-2">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            Opções da Roleta ({options.length})
          </h4>
          <span className="text-[10px] text-zinc-500">Defina o nome e a porcentagem (%) de cada fatia</span>
        </div>

        {/* Existing Options Grid */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {options.length === 0 ? (
            <div className="p-4 text-center rounded-xl bg-[#1A1D21] border border-dashed border-[#282C34] text-zinc-400 text-xs">
              Nenhuma fatia configurada. Adicione opções abaixo ou clique em uma das predefinições acima.
            </div>
          ) : (
            options.map((opt, idx) => {
              const pct = Math.round((opt.weight / totalWeight) * 100);
              return (
                <div
                  key={opt.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#1A1D21] border border-[#282C34] text-xs"
                >
                {/* Color Dot & Input */}
                <input
                  type="color"
                  value={opt.color}
                  onChange={(e) => {
                    const newColor = e.target.value;
                    setOptions(options.map((o) => (o.id === opt.id ? { ...o, color: newColor } : o)));
                  }}
                  className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0 shrink-0"
                  title="Mudar Cor"
                />

                {/* Label Edit */}
                <input
                  type="text"
                  value={opt.label}
                  onChange={(e) => {
                    const val = e.target.value;
                    setOptions(options.map((o) => (o.id === opt.id ? { ...o, label: val } : o)));
                  }}
                  className="flex-1 bg-transparent border-0 text-white font-medium text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 rounded px-1.5 py-0.5"
                  placeholder="Nome da Opção"
                />

                {/* Weight / Percentage Input */}
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={opt.weight}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 1;
                      setOptions(options.map((o) => (o.id === opt.id ? { ...o, weight: val } : o)));
                    }}
                    className="w-14 bg-[#141619] border border-[#2D3139] rounded px-2 py-0.5 text-xs text-right font-mono text-amber-300 font-bold focus:outline-none focus:border-amber-500"
                  />
                  <span className="text-[10px] font-mono text-zinc-500 w-9 text-right">{pct}%</span>
                </div>

                {/* Remove */}
                <button
                  onClick={() => handleRemoveOption(opt.id)}
                  disabled={options.length <= 2}
                  className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 disabled:opacity-30 transition-colors"
                  title="Remover Opção"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
        </div>

        {/* Add Option Form */}
        <form onSubmit={handleAddOption} className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Nova opção (ex: Encontro com Dragão, Pista de Ouro)..."
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            className="flex-1 bg-[#1A1D21] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <input
            type="number"
            min="1"
            max="100"
            value={newWeight}
            onChange={(e) => setNewWeight(parseInt(e.target.value, 10) || 10)}
            className="w-16 bg-[#1A1D21] border border-[#2D3139] rounded-xl px-2 py-1.5 text-xs text-center font-mono text-amber-300 font-bold focus:outline-none focus:border-indigo-500"
            title="Porcentagem / Peso"
          />
          <button
            type="submit"
            disabled={!newLabel.trim()}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </button>
        </form>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Dices,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  RotateCcw
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';
import { getLootPresets, LootTablePreset, LootItemDef } from '../utils/presetStore';

export const LootGeneratorWidget: React.FC = () => {
  const [lootTables, setLootTables] = useState<LootTablePreset[]>(() => getLootPresets());

  useEffect(() => {
    const handleUpdate = () => {
      setLootTables(getLootPresets());
    };
    window.addEventListener('caranguejo_presets_updated', handleUpdate);
    return () => window.removeEventListener('caranguejo_presets_updated', handleUpdate);
  }, []);

  const [selectedTierId, setSelectedTierId] = useState<string>(() => {
    const presets = getLootPresets();
    return presets[0]?.id || 'loot-medium';
  });

  const [itemCount, setItemCount] = useState<number>(3);
  const [generatedLoot, setGeneratedLoot] = useState<LootItemDef[]>(() => {
    const presets = getLootPresets();
    const current = presets.find(p => p.id === 'loot-medium') || presets[0];
    return current ? current.items.slice(0, 3) : [];
  });

  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  const activeTable = lootTables.find(t => t.id === selectedTierId) || lootTables[0];

  const handleGenerate = () => {
    if (!activeTable || !activeTable.items || activeTable.items.length === 0) {
      setGeneratedLoot([]);
      return;
    }
    const shuffled = [...activeTable.items].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(itemCount, activeTable.items.length));
    setGeneratedLoot(selected);
  };

  const getLootText = () => {
    const tierTitle = activeTable ? activeTable.tierName : 'Tesouro';
    let txt = `💰 **Tesouro Gerado [${tierTitle}]**\n\n`;
    generatedLoot.forEach((item) => {
      txt += `${item.icon || '🎁'} **${item.name}** (${item.type || 'Item'} • *${item.value || 'Normal'}*)\n↳ ${item.description}\n\n`;
    });
    return txt.trim();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getLootText());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendToDiscord = async () => {
    setIsSending(true);
    setFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: getLootText(),
          type: 'narration'
        })
      });

      if (res.success) {
        setFeedback({ status: 'success', msg: 'Loot enviado ao Discord com sucesso!' });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', msg: res.error || 'Falha ao postar no Discord.' });
        setTimeout(() => setFeedback({ status: 'idle' }), 4000);
      }
    } catch {
      setFeedback({ status: 'error', msg: 'Erro de conexão com o servidor.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full min-w-0 max-w-full flex flex-col space-y-3">
      {/* Tier Selector & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3139]/60 pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {lootTables.map((table) => {
            const isSelected = table.id === selectedTierId;
            return (
              <button
                key={table.id}
                type="button"
                onClick={() => setSelectedTierId(table.id)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
                }`}
                title={table.tierName}
              >
                {table.tierName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={itemCount}
            onChange={(e) => setItemCount(Number(e.target.value))}
            className="bg-[#141619] border border-[#2D3139] rounded-xl px-2 py-1 text-xs text-white focus:outline-none"
          >
            <option value={1}>1 Item</option>
            <option value={2}>2 Itens</option>
            <option value={3}>3 Itens</option>
            <option value={4}>4 Itens</option>
          </select>

          <button
            type="button"
            onClick={handleGenerate}
            className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 cursor-pointer transition-all active:scale-95"
          >
            <Dices className="w-3.5 h-3.5" />
            Rolar Loot
          </button>
        </div>
      </div>

      {/* Generated Loot Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
        {generatedLoot.map((item, idx) => (
          <div
            key={idx}
            className="bg-[#141619] border border-[#2D3139] rounded-xl p-3 flex flex-col justify-between hover:border-amber-500/40 transition-colors shadow-sm"
          >
            <div>
              <div className="flex items-start gap-2 mb-1.5">
                <span className="text-xl shrink-0">{item.icon}</span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[9px] px-1 py-0.2 rounded bg-[#22262B] text-[#CCCCCC] font-mono">
                      {item.type}
                    </span>
                    <span className="text-[9px] px-1 py-0.2 rounded bg-amber-950/40 text-amber-300 font-bold border border-amber-800/40">
                      {item.value}
                    </span>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-[#9E9E9E] line-clamp-2 italic leading-tight">
                {item.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2D3139]/60">
        {feedback.status === 'success' ? (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {feedback.msg}
          </span>
        ) : feedback.status === 'error' ? (
          <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {feedback.msg}
          </span>
        ) : (
          <span className="text-[11px] text-[#9E9E9E]">
            Role tesouros rápidos para baús, monstros derrotados e cofres.
          </span>
        )}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2B3037] text-xs text-white flex items-center gap-1 border border-[#2D3139] cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>

          <button
            type="button"
            onClick={handleSendToDiscord}
            disabled={isSending || generatedLoot.length === 0}
            className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            {isSending ? 'Enviando...' : 'Postar no Discord'}
          </button>
        </div>
      </div>
    </div>
  );
};

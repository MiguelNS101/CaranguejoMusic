import React, { useState } from 'react';
import {
  Sparkles,
  Dices,
  Send,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  Gem,
  Coins,
  ShieldAlert,
  Scroll,
  RotateCcw
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';

type LootTier = 'low' | 'medium' | 'high' | 'boss' | 'wod';

interface LootItem {
  name: string;
  type: string;
  value: string;
  description: string;
  icon: string;
}

const LOOT_TABLES: Record<LootTier, LootItem[]> = {
  low: [
    { name: 'Bolsa de Moedas de Prata', type: 'Moedas', value: '35 PP / 12 PO', description: 'Moedas gastas com inscrições do antigo reino.', icon: '💰' },
    { name: 'Poção de Cura Simples', type: 'Consumível', value: '50 PO', description: 'Líquido vermelho brilhante que cura 2d4 + 2 pontos de vida.', icon: '🧪' },
    { name: 'Adaga de Aço Élfico', type: 'Arma', value: '25 PO', description: 'Lâmina leve com empunhadura entalhada em madeira nobre.', icon: '🗡️' },
    { name: 'Gema de Quartzo Fumê', type: 'Gema', value: '15 PO', description: 'Pedra translúcida que reluz levemente no escuro.', icon: '💎' },
    { name: 'Pedaço de Pergaminho Misterioso', type: 'Pista', value: 'Inestimável', description: 'Fragmento contendo coordenadas cifradas de um túmulo esquecido.', icon: '📜' },
    { name: 'Tocha de Fogo Perpétuo (Gasta)', type: 'Utilitário', value: '30 PO', description: 'Queima sem calor por mais 4 horas antes de se extinguir.', icon: '🔥' }
  ],
  medium: [
    { name: 'Saco de Moedas de Ouro e Platina', type: 'Moedas', value: '250 PO + 15 PP', description: 'Moedas nobres seladas com cera real.', icon: '🪙' },
    { name: 'Poção de Invisibilidade', type: 'Consumível', value: '180 PO', description: 'Líquido etéreo que concede invisibilidade por 1 hora.', icon: '🧪' },
    { name: 'Anel de Proteção +1', type: 'Item Mágico', value: '400 PO', description: 'Concede +1 em CA e salvaguardas enquanto sintonizado.', icon: '💍' },
    { name: 'Gema de Rubi Estelar', type: 'Gema', value: '200 PO', description: 'Rubi lapidado que brilha como uma brasa viva.', icon: '💎' },
    { name: 'Capa da Sombra Sussurrante', type: 'Armadura/Veste', value: '350 PO', description: 'Vantagem em testes de Furtividade em escuridão ou penumbra.', icon: '🧥' },
    { name: 'Varinha de Mísseis Mágicos', type: 'Varinha', value: '300 PO', description: 'Possui 7 cargas para disparar dardos de energia sem errar.', icon: '🪄' }
  ],
  high: [
    { name: 'Baú de Riquezas da Guilda', type: 'Tesouro', value: '1.200 PO + 80 PP', description: 'Pilhas de lingotes de prata e moedas cunhadas.', icon: '👑' },
    { name: 'Espada Longa Flamejante (+2)', type: 'Arma Mágica', value: '1.800 PO', description: 'Causa +2d6 de dano de fogo adicional a cada golpe.', icon: '⚔️' },
    { name: 'Amuleto de Saúde (Constituição 19)', type: 'Item Mágico', value: '2.500 PO', description: 'Fixa o atributo Constituição do portador em 19.', icon: '📿' },
    { name: 'Diamante Astral Lapidado', type: 'Gema Nobre', value: '1.000 PO', description: 'Reagente perfeito para rituais de ressurreição.', icon: '💎' },
    { name: 'Pergaminho de Teletransporte', type: 'Pergaminho 7º Nível', value: '1.500 PO', description: 'Permite transportar o grupo instantaneamente a um círculo familiar.', icon: '📜' }
  ],
  boss: [
    { name: 'Tesouro Imperial do Soberano Caído', type: 'Loot Lendário', value: '5.000 PO + 350 PP', description: 'Ouro maciço, coroas e cálices de platina com safiras.', icon: '🏰' },
    { name: 'Lâmina Devoradora de Almas', type: 'Artefato Lendário', value: 'Inestimável', description: 'Lâmina que absorve a essência dos inimigos derrotados e regenera o portador.', icon: '🖤' },
    { name: 'Orbe das Tempestades Elementais', type: 'Artefato', value: '4.500 PO', description: 'Controla o clima regional e invoca tempestades de relâmpagos.', icon: '🔮' },
    { name: 'Tomo do Arcano Proibido', type: 'Livro Mágico', value: '3.000 PO', description: 'Aumenta permanentemente a Inteligência em +2 após 48 horas de estudo.', icon: '📖' }
  ],
  wod: [
    { name: 'Frasco de Sangue de Ancião (Vitae)', type: 'Relíquia WoD', value: '3 Pontos de Sangue Especial', description: 'Sangue concentrado da 6ª geração que fortalece temporariamente Disciplinas.', icon: '🩸' },
    { name: 'Ficha Policial Confidencial & Dossiê', type: 'Pista / Chantagem', value: '3 Pontos de Influência', description: 'Segredos comprometedores sobre o chefe de polícia e o prefeito.', icon: '📁' },
    { name: 'Adaga de Prata Abençoada por Caçadores', type: 'Arma Ritual', value: 'Dano Agravado em Licantropos', description: 'Lâmina forjada com prata pura e runas da Inquisição.', icon: '🗡️' },
    { name: 'Chave do Cofre Bancário Suíço', type: 'Recursos', value: 'Recursos Nível 4', description: 'Dá acesso a 100.000 dólares não rastreáveis e passaportes falsos.', icon: '🔑' },
    { name: 'Fita K7 com Gravação da Camarilla', type: 'Pista WoD', value: 'Quebra de Máscara Potencial', description: 'Áudio vazado de um príncipe negociando com Anarquistas.', icon: '📼' }
  ]
};

export const LootGeneratorWidget: React.FC = () => {
  const [tier, setTier] = useState<LootTier>('medium');
  const [itemCount, setItemCount] = useState<number>(3);
  const [generatedLoot, setGeneratedLoot] = useState<LootItem[]>(() => {
    return [
      LOOT_TABLES.medium[0],
      LOOT_TABLES.medium[1],
      LOOT_TABLES.medium[3]
    ];
  });
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  const handleGenerate = () => {
    const table = LOOT_TABLES[tier];
    const shuffled = [...table].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(itemCount, table.length));
    setGeneratedLoot(selected);
  };

  const getLootText = () => {
    const tierName =
      tier === 'low'
        ? 'Nível Baixo (Nv 1-4)'
        : tier === 'medium'
        ? 'Nível Médio (Nv 5-10)'
        : tier === 'high'
        ? 'Nível Alto (Nv 11-16)'
        : tier === 'boss'
        ? 'Tesouro de Chefe / Épico'
        : 'Recompensa WoD / Vampiro';

    let txt = `💰 **Tesouro Gerado [${tierName}]**\n\n`;
    generatedLoot.forEach((item, i) => {
      txt += `${item.icon} **${item.name}** (${item.type} • *${item.value}*)\n↳ ${item.description}\n\n`;
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
          <button
            type="button"
            onClick={() => setTier('low')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              tier === 'low' ? 'bg-amber-600 text-white' : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Nv 1-4
          </button>
          <button
            type="button"
            onClick={() => setTier('medium')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              tier === 'medium' ? 'bg-indigo-600 text-white' : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Nv 5-10
          </button>
          <button
            type="button"
            onClick={() => setTier('high')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              tier === 'high' ? 'bg-purple-600 text-white' : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Nv 11-16
          </button>
          <button
            type="button"
            onClick={() => setTier('boss')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              tier === 'boss' ? 'bg-rose-600 text-white' : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            👑 Chefe
          </button>
          <button
            type="button"
            onClick={() => setTier('wod')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              tier === 'wod' ? 'bg-red-800 text-white' : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            🩸 WoD
          </button>
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

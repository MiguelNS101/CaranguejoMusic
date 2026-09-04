import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Send,
  Sparkles,
  Shield,
  Zap,
  Flame,
  AlertTriangle,
  Skull,
  Eye,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  Compass
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';
import { getConditionRulePresets, ConditionRulePreset } from '../utils/presetStore';

interface ConditionRule {
  id: string;
  name: string;
  category: 'status' | 'difficulty' | 'action' | 'wod';
  icon: string;
  summary: string;
  description: string;
  discordFormat: string;
}

const RULES_CATALOG: ConditionRule[] = [
  // Condições D&D / Fantasia Geral
  {
    id: 'cond-blinded',
    name: 'Cego (Blinded)',
    category: 'status',
    icon: '🙈',
    summary: 'Falha automática em testes de visão. Ataques contra têm vantagem, seus ataques têm desvantagem.',
    description: '• Uma criatura cega não enxerga e falha automaticamente em qualquer teste de atributo que dependa da visão.\n• Jogadas de ataque contra a criatura têm vantagem, e as jogadas de ataque da criatura têm desvantagem.',
    discordFormat: '🙈 **Condição: Cego (Blinded)**\n• Falha automática em testes de visão.\n• Ataques contra a criatura têm **Vantagem**.\n• Ataques da criatura têm **Desvantagem**.'
  },
  {
    id: 'cond-charmed',
    name: 'Enfeitiçado (Charmed)',
    category: 'status',
    icon: '💖',
    summary: 'Não pode atacar o conjurador. Conjurador tem vantagem em testes sociais contra ela.',
    description: '• Uma criatura enfeitiçada não pode atacar o encantador ou tê-lo como alvo de habilidades nocivas ou efeitos mágicos.\n• O encantador tem vantagem em qualquer teste de atributo para interagir socialmente com a criatura.',
    discordFormat: '💖 **Condição: Enfeitiçado (Charmed)**\n• Não pode atacar o encantador.\n• Encantador tem **Vantagem** em interações sociais com o alvo.'
  },
  {
    id: 'cond-frightened',
    name: 'Amedrontado (Frightened)',
    category: 'status',
    icon: '😱',
    summary: 'Desvantagem em testes e ataques enquanto a fonte estiver visível. Não pode se aproximar.',
    description: '• Uma criatura amedrontada tem desvantagem em testes de atributo e jogadas de ataque enquanto a fonte de seu medo estiver em sua linha de visão.\n• A criatura não pode se mover voluntariamente para uma posição mais próxima da fonte do seu medo.',
    discordFormat: '😱 **Condição: Amedrontado (Frightened)**\n• **Desvantagem** em testes e ataques enquanto avistar a fonte do medo.\n• Não pode se aproximar voluntariamente da fonte.'
  },
  {
    id: 'cond-poisoned',
    name: 'Envenenado (Poisoned)',
    category: 'status',
    icon: '🧪',
    summary: 'Desvantagem em jogadas de ataque e testes de atributo.',
    description: '• Uma criatura envenenada tem desvantagem em jogadas de ataque e testes de atributo devido a dores, náuseas ou toxinas no sangue.',
    discordFormat: '🧪 **Condição: Envenenado (Poisoned)**\n• Sofre **Desvantagem** em jogadas de ataque e testes de atributo.'
  },
  {
    id: 'cond-prone',
    name: 'Caído (Prone)',
    category: 'status',
    icon: '🛌',
    summary: 'Gasta metade do deslocamento para levantar. Desvantagem em ataques. Ataques corpo a corpo a 1,5m têm vantagem.',
    description: '• A única opção de movimento é rastejar (custa o dobro) ou gastar metade do deslocamento total para se levantar.\n• A criatura tem desvantagem em jogadas de ataque.\n• Ataques contra a criatura têm vantagem se o atacante estiver a 1,5m; caso contrário, têm desvantagem.',
    discordFormat: '🛌 **Condição: Caído (Prone)**\n• Gastar metade do movimento para levantar.\n• Ataques próprios têm **Desvantagem**.\n• Ataques corpo a corpo contra o alvo têm **Vantagem** (à distância têm desvantagem).'
  },
  {
    id: 'cond-paralyzed',
    name: 'Paralisado / Incapacitado',
    category: 'status',
    icon: '⚡',
    summary: 'Incapacitado, não pode falar nem mover. Falha em For/Des. Ataques têm vantagem e são críticos se a 1,5m.',
    description: '• Não pode se mover ou falar. Falha automaticamente em salvaguardas de Força e Destreza.\n• Jogadas de ataque contra têm vantagem. Qualquer ataque que acerte a criatura é um acerto crítico se o atacante estiver a até 1,5 metro.',
    discordFormat: '⚡ **Condição: Paralisado (Paralyzed)**\n• Incapacitado total (não age nem move).\n• Falha automática em testes de FOR/DES.\n• Ataques a 1,5m que acertarem são **Acertos Críticos automáticos**!'
  },

  // WoD (World of Darkness / Vampiro)
  {
    id: 'wod-frenzy',
    name: 'Frenesi & Rötshreck (WoD)',
    category: 'wod',
    icon: '🩸',
    summary: 'A Besta assume o controle. Teste de Autocontrole/Instinto (Dif 6-8). Imune a medo e penalidades de dano.',
    description: '• O Vampiro sucumbe à Besta interior por fúria, fome extrema ou terror ao fogo/luz solar (Rötshreck).\n• Enquanto em Frenesi, ignora todas as penalidades de ferimentos e é imune a poderes mentais de Dominação/Presença.\n• Não pode usar Disciplinas sutis (Taumaturgia, Auspícios). Foco total em atacar ou fugir.',
    discordFormat: '🩸 **Regra WoD: Frenesi da Besta**\n• A Besta assume o controle! Ignora penalidades de ferimento.\n• Imune a controles mentais menores.\n• Dificuldade típica de autocontrole: 6 a 8 (mínimo 3 a 5 sucessos).'
  },
  {
    id: 'wod-damage-types',
    name: 'Dano Contundente vs Letal vs Agravado (WoD)',
    category: 'wod',
    icon: '⚔️',
    summary: 'Contundente: soco/porrete (divide por 2). Letal: lâminas/balas. Agravado: fogo/sol/garras sobrenaturais.',
    description: '• Contundente (Bashing): Vampiros dividem por 2 após absorção com Vigor.\n• Letal (Lethal): Vampiros absorvem normalmente com Vigor.\n• Agravado (Aggravated): Fogo, luz solar, dentes/garras de lobisomem/vampiro. Apenas absorvível com Fortitude!',
    discordFormat: '⚔️ **Regra WoD: Tipos de Dano & Absorção**\n• **Contundente:** Absorvido com Vigor e dividido por 2.\n• **Letal:** Absorvido com Vigor.\n• **Agravado:** Fogo, Sol, Garras/Presas Sobrenaturais (Apenas absorvido com **Fortitude**).'
  },

  // Dificuldades e CDs Rápidas
  {
    id: 'diff-dcs',
    name: 'Escala de Classes de Dificuldade (CD / DC)',
    category: 'difficulty',
    icon: '🎯',
    summary: 'CD 5 Muito Fácil | CD 10 Fácil | CD 15 Médio | CD 20 Difícil | CD 25 Muito Difícil | CD 30 Quase Impossível',
    description: '• CD 5: Muito Fácil (notar algo óbvio)\n• CD 10: Fácil (subir corda com nós)\n• CD 15: Médio (lembrar lenda local, arrombar fechadura comum)\n• CD 20: Difícil (nadar em tempestade, desarmar armadilha complexa)\n• CD 25: Muito Difícil (rastrear criatura na pedra)\n• CD 30: Quase Impossível (escalar parede de gelo liso sem ferramentas)',
    discordFormat: '🎯 **Referência: Tabela de Dificuldades (DC / CD)**\n• `CD 10` - Fácil\n• `CD 15` - Médio / Desafiador\n• `CD 20` - Difícil\n• `CD 25` - Muito Difícil\n• `CD 30` - Quase Impossível / Lendário'
  },
  {
    id: 'diff-cover',
    name: 'Regras de Cobertura (+2 / +5 CA)',
    category: 'difficulty',
    icon: '🛡️',
    summary: 'Meia Cobertura: +2 CA e Destreza. 3/4 Cobertura: +5 CA e Destreza. Cobertura Total: Não pode ser alvejado diretamente.',
    description: '• Meia Cobertura (50% do corpo protegido): +2 na CA e em salvaguardas de Destreza.\n• Três Quartos (75% protegido): +5 na CA e em salvaguardas de Destreza.\n• Cobertura Total (100% oculto): Não pode ser alvo direto de ataques ou magias que exijam linha de visão.',
    discordFormat: '🛡️ **Referência: Regras de Cobertura**\n• **Meia Cobertura (1/2):** +2 na CA e Salvaguardas de Destreza.\n• **Três Quartos (3/4):** +5 na CA e Salvaguardas de Destreza.\n• **Cobertura Total:** Imune a ataques diretos e magias que exijam linha de visão.'
  }
];

export const QuickRulesWidget: React.FC = () => {
  const { botStatus } = useAudio();
  const [rulesList, setRulesList] = useState<ConditionRulePreset[]>(() => getConditionRulePresets());
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'status' | 'wod' | 'difficulty' | 'action' | 'custom'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRuleId, setActiveRuleId] = useState<string>(() => rulesList[0]?.id || RULES_CATALOG[0].id);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  useEffect(() => {
    const handleUpdate = () => {
      const updated = getConditionRulePresets();
      setRulesList(updated);
    };
    window.addEventListener('caranguejo_presets_updated', handleUpdate);
    return () => window.removeEventListener('caranguejo_presets_updated', handleUpdate);
  }, []);

  const combinedRules = rulesList && rulesList.length > 0 ? rulesList : RULES_CATALOG;

  const filteredRules = combinedRules.filter(r => {
    const matchesCat = selectedCategory === 'all' || r.category === selectedCategory;
    const matchesSearch =
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const activeRule = combinedRules.find(r => r.id === activeRuleId) || filteredRules[0] || combinedRules[0];

  const handleSendToDiscord = async () => {
    if (!activeRule) return;
    setIsSending(true);
    setFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: activeRule.discordFormat,
          type: 'narration'
        })
      });

      if (res.success) {
        setFeedback({ status: 'success', msg: `Regra "${activeRule.name}" enviada ao Discord!` });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', msg: res.error || 'Falha ao enviar ao Discord.' });
        setTimeout(() => setFeedback({ status: 'idle' }), 4000);
      }
    } catch {
      setFeedback({ status: 'error', msg: 'Erro de conexão.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full min-w-0 max-w-full flex flex-col space-y-3">
      {/* Category Pills & Search */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3139]/60 pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Todas ({combinedRules.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('status')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategory === 'status'
                ? 'bg-amber-600 text-white'
                : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Condições & Status
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('wod')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategory === 'wod'
                ? 'bg-rose-600 text-white'
                : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            WoD / Vampiro
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('difficulty')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategory === 'difficulty'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            CDs & Cobertura
          </button>
          <button
            type="button"
            onClick={() => setSelectedCategory('custom')}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
              selectedCategory === 'custom'
                ? 'bg-purple-600 text-white'
                : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
            }`}
          >
            Personalizadas
          </button>
        </div>

        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar regra ou condição..."
          className="bg-[#141619] border border-[#2D3139] rounded-xl px-2.5 py-1 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none w-full sm:w-44"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
        {/* Left: Quick Rules List */}
        <div className="md:col-span-5 space-y-1.5 max-h-56 overflow-y-auto pr-1">
          {filteredRules.map((rule) => {
            const isSelected = rule.id === activeRule.id;
            return (
              <button
                key={rule.id}
                type="button"
                onClick={() => setActiveRuleId(rule.id)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/20 border-indigo-500 text-white ring-1 ring-indigo-500/40 shadow-sm'
                    : 'bg-[#141619] border-[#2D3139] text-[#CCCCCC] hover:bg-[#22262B] hover:border-indigo-500/30'
                }`}
              >
                <span className="text-base shrink-0">{rule.icon}</span>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold truncate">{rule.name}</div>
                  <div className="text-[10px] text-[#9E9E9E] line-clamp-1">{rule.summary}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right: Detailed Rule View with 1-Click Discord Share */}
        <div className="md:col-span-7 bg-[#141619] border border-[#2D3139] rounded-xl p-3.5 flex flex-col justify-between space-y-3">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xl">{activeRule.icon}</span>
              <div>
                <h4 className="text-xs font-bold text-white font-rpg">{activeRule.name}</h4>
                <span className="text-[9px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-[#22262B] text-indigo-300 font-mono">
                  {activeRule.category === 'status' ? 'Condição de Combate' : activeRule.category === 'wod' ? 'Regra WoD' : 'Referência de Teste'}
                </span>
              </div>
            </div>

            <p className="text-xs text-[#E0E0E0] whitespace-pre-line leading-relaxed bg-[#1A1D21] p-3 rounded-lg border border-[#2D3139]">
              {activeRule.description}
            </p>
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#2D3139]/60">
            {feedback.status === 'success' ? (
              <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {feedback.msg}
              </span>
            ) : feedback.status === 'error' ? (
              <span className="text-[11px] text-rose-400 font-bold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                {feedback.msg}
              </span>
            ) : (
              <span className="text-[10px] text-[#9E9E9E]">
                Envie o resumo formatado da regra no chat para os jogadores.
              </span>
            )}

            <button
              type="button"
              onClick={handleSendToDiscord}
              disabled={isSending}
              className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer shrink-0 transition-all"
            >
              <Send className="w-3 h-3" />
              {isSending ? 'Enviando...' : 'Explicar no Discord'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Swords,
  Coins,
  CircleDot,
  Clock,
  FileText,
  BookOpen,
  CloudRain,
  Sun,
  Plus,
  Trash2,
  Edit2,
  Save,
  RotateCcw,
  Download,
  Upload,
  CheckCircle2,
  AlertCircle,
  Code,
  X,
  Copy,
  ChevronRight
} from 'lucide-react';
import {
  getLootPresets,
  saveLootPresets,
  getEncounterPresets,
  saveEncounterPresets,
  getRoulettePresets,
  saveRoulettePresets,
  getTimerPresets,
  saveTimerPresets,
  getNoteTabTemplates,
  saveNoteTabTemplates,
  getConditionRulePresets,
  saveConditionRulePresets,
  getWeatherPresets,
  saveWeatherPresets,
  exportAllPresetsJson,
  importPresetsFromJson,
  DEFAULT_LOOT_TABLES,
  DEFAULT_ENCOUNTER_PRESETS,
  DEFAULT_ROULETTE_PRESETS,
  DEFAULT_TIMER_PRESETS,
  DEFAULT_NOTE_TEMPLATES,
  DEFAULT_CONDITION_RULES,
  DEFAULT_WEATHER_PRESETS,
  LootTablePreset,
  EncounterPreset,
  RoulettePreset,
  TimerPreset,
  NoteTabTemplate,
  ConditionRulePreset,
  WeatherAtmospherePreset
} from '../utils/presetStore';

interface PresetManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'json';
}

export const PresetManagerModal: React.FC<PresetManagerModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'encounters'
}) => {
  const [activeTab, setActiveTab] = useState<'encounters' | 'loot' | 'roulette' | 'timers' | 'notes' | 'rules' | 'weather' | 'json'>(initialTab);

  // States
  const [encounters, setEncounters] = useState<EncounterPreset[]>([]);
  const [lootTables, setLootTables] = useState<LootTablePreset[]>([]);
  const [roulettes, setRoulettes] = useState<RoulettePreset[]>([]);
  const [timers, setTimers] = useState<TimerPreset[]>([]);
  const [noteTemplates, setNoteTemplates] = useState<NoteTabTemplate[]>([]);
  const [rules, setRules] = useState<ConditionRulePreset[]>([]);
  const [weathers, setWeathers] = useState<WeatherAtmospherePreset[]>([]);

  // Raw JSON state
  const [jsonText, setJsonText] = useState<string>('');
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message: string }>({ status: 'idle', message: '' });

  // Load all
  const reloadData = () => {
    setEncounters(getEncounterPresets());
    setLootTables(getLootPresets());
    setRoulettes(getRoulettePresets());
    setTimers(getTimerPresets());
    setNoteTemplates(getNoteTabTemplates());
    setRules(getConditionRulePresets());
    setWeathers(getWeatherPresets());
    setJsonText(exportAllPresetsJson());
  };

  useEffect(() => {
    if (isOpen) {
      if (initialTab) {
        setActiveTab(initialTab);
      }
      reloadData();
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const showFeedback = (status: 'success' | 'error', message: string) => {
    setFeedback({ status, message });
    setTimeout(() => setFeedback({ status: 'idle', message: '' }), 3500);
  };

  // ENCOUNTERS ACTIONS
  const handleAddEncounter = () => {
    const newEnc: EncounterPreset = {
      id: `enc-${Date.now()}`,
      name: 'Novo Encontro Customizado',
      environment: 'masmorra',
      difficulty: 'medio',
      enemies: [
        { name: 'Monstro Líder', role: 'Chefe', count: 1, cr: '3', hp: '55', ac: '15', keyFeature: 'Ataque pesado com recuo' }
      ],
      tacticalObjective: 'Conquistar a sala ou sobreviver por 3 rodadas.',
      environmentalHazard: 'Terreno instável.',
      quickReward: 'Bolsa com 50 PO e poção simples.'
    };
    const updated = [...encounters, newEnc];
    setEncounters(updated);
    saveEncounterPresets(updated);
    showFeedback('success', 'Novo encontro adicionado!');
  };

  const handleDeleteEncounter = (id: string) => {
    const updated = encounters.filter(e => e.id !== id);
    setEncounters(updated);
    saveEncounterPresets(updated);
    showFeedback('success', 'Encontro excluído.');
  };

  // LOOT ACTIONS
  const handleAddLootItem = (tableId: string) => {
    const updated = lootTables.map(t => {
      if (t.id === tableId) {
        return {
          ...t,
          items: [
            ...t.items,
            { name: 'Novo Tesouro', type: 'Item', value: '50 PO', description: 'Item valioso encontrado na aventura.', icon: '✨' }
          ]
        };
      }
      return t;
    });
    setLootTables(updated);
    saveLootPresets(updated);
    showFeedback('success', 'Novo item de loot adicionado à tabela!');
  };

  const handleDeleteLootItem = (tableId: string, itemIdx: number) => {
    const updated = lootTables.map(t => {
      if (t.id === tableId) {
        const nextItems = [...t.items];
        nextItems.splice(itemIdx, 1);
        return { ...t, items: nextItems };
      }
      return t;
    });
    setLootTables(updated);
    saveLootPresets(updated);
  };

  // ROULETTE ACTIONS
  const handleAddRoulette = () => {
    const newR: RoulettePreset = {
      id: `roulette-${Date.now()}`,
      name: '🎯 Nova Roleta',
      options: [
        { label: 'Opção 1', weight: 50, color: '#10b981' },
        { label: 'Opção 2', weight: 50, color: '#ef4444' }
      ]
    };
    const updated = [...roulettes, newR];
    setRoulettes(updated);
    saveRoulettePresets(updated);
    showFeedback('success', 'Nova predefinição de roleta criada!');
  };

  const handleDeleteRoulette = (id: string) => {
    const updated = roulettes.filter(r => r.id !== id);
    setRoulettes(updated);
    saveRoulettePresets(updated);
  };

  // TIMERS ACTIONS
  const handleAddTimer = () => {
    const newT: TimerPreset = {
      id: `timer-${Date.now()}`,
      title: 'Novo Temporizador',
      type: 'countdown',
      minutes: 10,
      category: 'session',
      color: '#6366f1',
      icon: '⏱️'
    };
    const updated = [...timers, newT];
    setTimers(updated);
    saveTimerPresets(updated);
    showFeedback('success', 'Novo temporizador pré-definido adicionado!');
  };

  const handleDeleteTimer = (id: string) => {
    const updated = timers.filter(t => t.id !== id);
    setTimers(updated);
    saveTimerPresets(updated);
  };

  // NOTES ACTIONS
  const handleAddNoteTab = () => {
    const newTab: NoteTabTemplate = {
      id: `note-${Date.now()}`,
      title: 'Nova Aba',
      emoji: '📝',
      defaultContent: '',
      category: 'Custom'
    };
    const updated = [...noteTemplates, newTab];
    setNoteTemplates(updated);
    saveNoteTabTemplates(updated);
    showFeedback('success', 'Novo modelo de aba de notas adicionado!');
  };

  const handleDeleteNoteTab = (id: string) => {
    const updated = noteTemplates.filter(t => t.id !== id);
    setNoteTemplates(updated);
    saveNoteTabTemplates(updated);
  };

  // RULES & CONDITIONS ACTIONS
  const handleAddRule = () => {
    const newRule: ConditionRulePreset = {
      id: `rule-${Date.now()}`,
      name: 'Nova Condição / Regra',
      category: 'custom',
      icon: '✨',
      summary: 'Resumo rápido do efeito ou penalidade.',
      description: 'Descrição detalhada com regras e salvaguardas aplicáveis.',
      discordFormat: '✨ **Nova Condição**\n• Efeito mecânico no alvo.'
    };
    const updated = [...rules, newRule];
    setRules(updated);
    saveConditionRulePresets(updated);
    showFeedback('success', 'Nova condição / regra adicionada!');
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter(r => r.id !== id);
    setRules(updated);
    saveConditionRulePresets(updated);
    showFeedback('success', 'Regra excluída.');
  };

  // WEATHER & ATMOSPHERE ACTIONS
  const handleAddWeather = () => {
    const newW: WeatherAtmospherePreset = {
      id: `weather-${Date.now()}`,
      name: 'Novo Clima / Atmosfera',
      icon: '🌦️',
      effect: 'Efeito mecânico da atmosfera na sessão.',
      discordEmoji: '🌦️',
      timeOfDay: 'afternoon',
      lightLevel: 'Luz Plena',
      description: 'Descrição do ambiente e atmosfera para narrar aos jogadores.'
    };
    const updated = [...weathers, newW];
    setWeathers(updated);
    saveWeatherPresets(updated);
    showFeedback('success', 'Novo clima / atmosfera adicionado!');
  };

  const handleDeleteWeather = (id: string) => {
    const updated = weathers.filter(w => w.id !== id);
    setWeathers(updated);
    saveWeatherPresets(updated);
    showFeedback('success', 'Clima excluído.');
  };

  // JSON SAVE
  const handleSaveJson = () => {
    const result = importPresetsFromJson(jsonText);
    if (result.success) {
      reloadData();
      showFeedback('success', 'Todas as predefinições foram atualizadas com sucesso a partir do JSON!');
    } else {
      showFeedback('error', result.message);
    }
  };

  // RESET DEFAULTS
  const handleResetDefaults = () => {
    if (window.confirm('Tem certeza de que deseja restaurar as predefinições originais de fábrica?')) {
      saveLootPresets(DEFAULT_LOOT_TABLES);
      saveEncounterPresets(DEFAULT_ENCOUNTER_PRESETS);
      saveRoulettePresets(DEFAULT_ROULETTE_PRESETS);
      saveTimerPresets(DEFAULT_TIMER_PRESETS);
      saveNoteTabTemplates(DEFAULT_NOTE_TEMPLATES);
      saveConditionRulePresets(DEFAULT_CONDITION_RULES);
      saveWeatherPresets(DEFAULT_WEATHER_PRESETS);
      reloadData();
      showFeedback('success', 'Predefinições de fábrica restauradas!');
    }
  };

  // EXPORT DOWNLOAD
  const handleDownloadJson = () => {
    const blob = new Blob([exportAllPresetsJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caranguejo-predefinicoes-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // IMPORT FILE
  const handleUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      const res = importPresetsFromJson(content);
      if (res.success) {
        reloadData();
        showFeedback('success', 'Arquivo JSON de predefinições carregado!');
      } else {
        showFeedback('error', res.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-5xl max-h-[92vh] bg-[#1A1D21] border border-[#2D3139] rounded-2xl flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#2D3139] flex items-center justify-between bg-[#141619]/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Gerenciador Central de Predefinições
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                  JSON-Driven
                </span>
              </h2>
              <p className="text-xs text-[#9E9E9E]">
                Edite, adicione ou exclua presets de encontros, loots, roleta, timers e bloco de notas.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetDefaults}
              className="px-2.5 py-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-xs text-zinc-300 hover:text-white border border-[#2D3139] flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Restaurar predefinições originais"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
              Restaurar Padrão
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-[#22262B] hover:bg-[#2D3139] text-[#9E9E9E] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-[#2D3139] bg-[#141619] shrink-0 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('encounters')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'encounters'
                ? 'bg-[#1A1D21] text-indigo-400 border-t-2 border-indigo-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <Swords className="w-3.5 h-3.5" />
            Encontros ({encounters.length})
          </button>
          <button
            onClick={() => setActiveTab('loot')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'loot'
                ? 'bg-[#1A1D21] text-amber-400 border-t-2 border-amber-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            Loot & Tesouros ({lootTables.length} Tiers)
          </button>
          <button
            onClick={() => setActiveTab('roulette')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'roulette'
                ? 'bg-[#1A1D21] text-cyan-400 border-t-2 border-cyan-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <CircleDot className="w-3.5 h-3.5" />
            Roleta ({roulettes.length})
          </button>
          <button
            onClick={() => setActiveTab('timers')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'timers'
                ? 'bg-[#1A1D21] text-emerald-400 border-t-2 border-emerald-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Temporizadores ({timers.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'notes'
                ? 'bg-[#1A1D21] text-purple-400 border-t-2 border-purple-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Bloco de Notas ({noteTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'rules'
                ? 'bg-[#1A1D21] text-amber-400 border-t-2 border-amber-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            Guia de Regras & Condições ({rules.length})
          </button>
          <button
            onClick={() => setActiveTab('weather')}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'weather'
                ? 'bg-[#1A1D21] text-sky-400 border-t-2 border-sky-500'
                : 'text-[#9E9E9E] hover:text-white'
            }`}
          >
            <CloudRain className="w-3.5 h-3.5" />
            Clima & Atmosfera ({weathers.length})
          </button>
          <button
            onClick={() => {
              setJsonText(exportAllPresetsJson());
              setActiveTab('json');
            }}
            className={`px-3.5 py-2 rounded-t-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ml-auto ${
              activeTab === 'json'
                ? 'bg-[#1A1D21] text-rose-400 border-t-2 border-rose-500'
                : 'text-[#9E9E9E] hover:text-rose-300'
            }`}
          >
            <Code className="w-3.5 h-3.5" />
            Editor JSON Livre
          </button>
        </div>

        {/* Feedback Banner */}
        {feedback.status !== 'idle' && (
          <div className={`px-5 py-2 text-xs flex items-center gap-2 shrink-0 ${
            feedback.status === 'success' ? 'bg-emerald-950/70 text-emerald-300 border-b border-emerald-800/40' : 'bg-rose-950/70 text-rose-300 border-b border-rose-800/40'
          }`}>
            {feedback.status === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Body Content */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          
          {/* TAB: ENCOUNTERS */}
          {activeTab === 'encounters' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Predefinições de combates que alimentam o Gerador de Encontros.
                </span>
                <button
                  onClick={handleAddEncounter}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Novo Encontro
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {encounters.map((enc) => (
                  <div key={enc.id} className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <input
                        type="text"
                        value={enc.name}
                        onChange={(e) => {
                          const updated = encounters.map(x => x.id === enc.id ? { ...x, name: e.target.value } : x);
                          setEncounters(updated);
                          saveEncounterPresets(updated);
                        }}
                        className="bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2.5 py-1 text-xs font-bold text-white w-full focus:outline-none focus:border-indigo-500"
                      />
                      <button
                        onClick={() => handleDeleteEncounter(enc.id)}
                        className="p-1.5 rounded-lg bg-[#22262B] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border border-[#2D3139] transition-colors cursor-pointer shrink-0"
                        title="Excluir encontro"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">Ambiente</label>
                        <select
                          value={enc.environment}
                          onChange={(e) => {
                            const updated = encounters.map(x => x.id === enc.id ? { ...x, environment: e.target.value as any } : x);
                            setEncounters(updated);
                            saveEncounterPresets(updated);
                          }}
                          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-zinc-200"
                        >
                          <option value="floresta">Floresta</option>
                          <option value="masmorra">Masmorra</option>
                          <option value="cidade">Cidade</option>
                          <option value="caverna">Caverna</option>
                          <option value="montanha">Montanha</option>
                          <option value="pantano">Pântano</option>
                          <option value="deserto">Deserto</option>
                          <option value="costa">Costa</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">Dificuldade</label>
                        <select
                          value={enc.difficulty}
                          onChange={(e) => {
                            const updated = encounters.map(x => x.id === enc.id ? { ...x, difficulty: e.target.value as any } : x);
                            setEncounters(updated);
                            saveEncounterPresets(updated);
                          }}
                          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-zinc-200"
                        >
                          <option value="facil">Fácil</option>
                          <option value="medio">Médio</option>
                          <option value="dificil">Difícil</option>
                          <option value="mortal">Mortal</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">Objetivo Tático</label>
                      <input
                        type="text"
                        value={enc.tacticalObjective}
                        onChange={(e) => {
                          const updated = encounters.map(x => x.id === enc.id ? { ...x, tacticalObjective: e.target.value } : x);
                          setEncounters(updated);
                          saveEncounterPresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-zinc-300"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9E9E9E] uppercase font-bold">Recompensa</label>
                      <input
                        type="text"
                        value={enc.quickReward}
                        onChange={(e) => {
                          const updated = encounters.map(x => x.id === enc.id ? { ...x, quickReward: e.target.value } : x);
                          setEncounters(updated);
                          saveEncounterPresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-zinc-300"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: LOOT */}
          {activeTab === 'loot' && (
            <div className="space-y-4">
              <span className="text-xs text-[#9E9E9E] block">
                Tabelas de loot por tier. Você pode adicionar ou remover itens de cada nível de tesouro.
              </span>

              {lootTables.map((table) => (
                <div key={table.id} className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-3">
                  <div className="flex items-center justify-between border-b border-[#2D3139] pb-2">
                    <h3 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                      <Coins className="w-4 h-4" />
                      {table.tierName} ({table.items.length} itens)
                    </h3>
                    <button
                      onClick={() => handleAddLootItem(table.id)}
                      className="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-bold flex items-center gap-1 shadow cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Adicionar Item
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {(table.items || []).map((item, idx) => (
                      <div key={idx} className="p-2 rounded-lg bg-[#1A1D21] border border-[#282C34] flex items-center gap-2 text-xs">
                        <input
                          type="text"
                          value={item.icon}
                          onChange={(e) => {
                            const updated = lootTables.map(t => {
                              if (t.id === table.id) {
                                const newItems = [...t.items];
                                newItems[idx] = { ...newItems[idx], icon: e.target.value };
                                return { ...t, items: newItems };
                              }
                              return t;
                            });
                            setLootTables(updated);
                            saveLootPresets(updated);
                          }}
                          className="w-8 text-center bg-[#141619] border border-[#2D3139] rounded px-1 py-0.5 text-sm"
                          title="Emoji / Ícone"
                        />
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = lootTables.map(t => {
                              if (t.id === table.id) {
                                const newItems = [...t.items];
                                newItems[idx] = { ...newItems[idx], name: e.target.value };
                                return { ...t, items: newItems };
                              }
                              return t;
                            });
                            setLootTables(updated);
                            saveLootPresets(updated);
                          }}
                          className="flex-1 bg-[#141619] border border-[#2D3139] rounded px-2 py-0.5 font-bold text-white"
                          placeholder="Nome do item"
                        />
                        <input
                          type="text"
                          value={item.value}
                          onChange={(e) => {
                            const updated = lootTables.map(t => {
                              if (t.id === table.id) {
                                const newItems = [...t.items];
                                newItems[idx] = { ...newItems[idx], value: e.target.value };
                                return { ...t, items: newItems };
                              }
                              return t;
                            });
                            setLootTables(updated);
                            saveLootPresets(updated);
                          }}
                          className="w-28 bg-[#141619] border border-[#2D3139] rounded px-2 py-0.5 text-zinc-300 text-[11px]"
                          placeholder="Valor"
                        />
                        <button
                          onClick={() => handleDeleteLootItem(table.id, idx)}
                          className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                          title="Remover item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TAB: ROULETTE */}
          {activeTab === 'roulette' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Predefinições de roletas temáticas com fatias, pesos e cores.
                </span>
                <button
                  onClick={handleAddRoulette}
                  className="px-3 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nova Roleta
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {roulettes.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => {
                          const updated = roulettes.map(x => x.id === r.id ? { ...x, name: e.target.value } : x);
                          setRoulettes(updated);
                          saveRoulettePresets(updated);
                        }}
                        className="bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2.5 py-1 text-xs font-bold text-white w-full focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        onClick={() => handleDeleteRoulette(r.id)}
                        className="p-1.5 rounded-lg bg-[#22262B] hover:bg-rose-950/60 text-zinc-400 hover:text-rose-400 border border-[#2D3139] transition-colors cursor-pointer shrink-0"
                        title="Excluir roleta"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                      {(r.options || []).map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-2 p-1.5 rounded bg-[#1A1D21] border border-[#282C34] text-xs">
                          <input
                            type="color"
                            value={opt.color}
                            onChange={(e) => {
                              const updated = roulettes.map(x => {
                                if (x.id === r.id) {
                                  const opts = [...x.options];
                                  opts[oIdx] = { ...opts[oIdx], color: e.target.value };
                                  return { ...x, options: opts };
                                }
                                return x;
                              });
                              setRoulettes(updated);
                              saveRoulettePresets(updated);
                            }}
                            className="w-5 h-5 rounded cursor-pointer border-0 bg-transparent p-0"
                          />
                          <input
                            type="text"
                            value={opt.label}
                            onChange={(e) => {
                              const updated = roulettes.map(x => {
                                if (x.id === r.id) {
                                  const opts = [...x.options];
                                  opts[oIdx] = { ...opts[oIdx], label: e.target.value };
                                  return { ...x, options: opts };
                                }
                                return x;
                              });
                              setRoulettes(updated);
                              saveRoulettePresets(updated);
                            }}
                            className="flex-1 bg-[#141619] border border-[#2D3139] rounded px-1.5 py-0.5 text-zinc-200"
                          />
                          <span className="text-[10px] font-mono text-zinc-400">{opt.weight}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: TIMERS */}
          {activeTab === 'timers' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Predefinições de 1 clique para o widget de cronômetros e contagens regressivas de RPG.
                </span>
                <button
                  onClick={handleAddTimer}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Novo Temporizador
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {timers.map((t) => (
                  <div key={t.id} className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-1.5">
                      <input
                        type="text"
                        value={t.icon}
                        onChange={(e) => {
                          const updated = timers.map(x => x.id === t.id ? { ...x, icon: e.target.value } : x);
                          setTimers(updated);
                          saveTimerPresets(updated);
                        }}
                        className="w-8 text-center bg-[#1A1D21] border border-[#2D3139] rounded px-1 py-0.5 text-base"
                      />
                      <input
                        type="text"
                        value={t.title}
                        onChange={(e) => {
                          const updated = timers.map(x => x.id === t.id ? { ...x, title: e.target.value } : x);
                          setTimers(updated);
                          saveTimerPresets(updated);
                        }}
                        className="flex-1 bg-[#1A1D21] border border-[#2D3139] rounded px-2 py-1 font-bold text-white"
                      />
                      <button
                        onClick={() => handleDeleteTimer(t.id)}
                        className="p-1 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] text-[#9E9E9E] block">Minutos</label>
                        <input
                          type="number"
                          value={t.minutes}
                          onChange={(e) => {
                            const updated = timers.map(x => x.id === t.id ? { ...x, minutes: parseFloat(e.target.value) || 0 } : x);
                            setTimers(updated);
                            saveTimerPresets(updated);
                          }}
                          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded px-2 py-0.5 font-mono text-zinc-200"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] text-[#9E9E9E] block">Tipo</label>
                        <select
                          value={t.type}
                          onChange={(e) => {
                            const updated = timers.map(x => x.id === t.id ? { ...x, type: e.target.value as any } : x);
                            setTimers(updated);
                            saveTimerPresets(updated);
                          }}
                          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded px-1.5 py-0.5 text-zinc-200 text-xs"
                        >
                          <option value="countdown">Regressivo</option>
                          <option value="stopwatch">Cronômetro</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Modelos de abas padrão para o Bloco de Notas Multiabas do Mestre.
                </span>
                <button
                  onClick={handleAddNoteTab}
                  className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Novo Modelo de Aba
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {noteTemplates.map((nt) => (
                  <div key={nt.id} className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={nt.emoji}
                        onChange={(e) => {
                          const updated = noteTemplates.map(x => x.id === nt.id ? { ...x, emoji: e.target.value } : x);
                          setNoteTemplates(updated);
                          saveNoteTabTemplates(updated);
                        }}
                        className="w-8 text-center bg-[#1A1D21] border border-[#2D3139] rounded px-1 py-0.5 text-base"
                      />
                      <input
                        type="text"
                        value={nt.title}
                        onChange={(e) => {
                          const updated = noteTemplates.map(x => x.id === nt.id ? { ...x, title: e.target.value } : x);
                          setNoteTemplates(updated);
                          saveNoteTabTemplates(updated);
                        }}
                        className="flex-1 bg-[#1A1D21] border border-[#2D3139] rounded px-2 py-1 font-bold text-white"
                        placeholder="Título da aba"
                      />
                      <button
                        onClick={() => handleDeleteNoteTab(nt.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9E9E9E] block mb-0.5">Conteúdo Padrão (Opcional / Markdown)</label>
                      <textarea
                        rows={3}
                        value={nt.defaultContent}
                        onChange={(e) => {
                          const updated = noteTemplates.map(x => x.id === nt.id ? { ...x, defaultContent: e.target.value } : x);
                          setNoteTemplates(updated);
                          saveNoteTabTemplates(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded p-2 text-zinc-200 text-xs font-mono"
                        placeholder="Deixe vazio ou adicione um esqueleto inicial..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: RULES & CONDITIONS */}
          {activeTab === 'rules' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Predefinições de regras, condições, salvaguardas e termos de RPG rápidos para o Guia de Regras & Condições.
                </span>
                <button
                  onClick={handleAddRule}
                  className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Nova Regra / Condição
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {rules.map((r) => (
                  <div key={r.id} className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={r.icon}
                        onChange={(e) => {
                          const updated = rules.map(x => x.id === r.id ? { ...x, icon: e.target.value } : x);
                          setRules(updated);
                          saveConditionRulePresets(updated);
                        }}
                        className="w-9 text-center bg-[#1A1D21] border border-[#2D3139] rounded px-1 py-1 text-base"
                        title="Ícone / Emoji"
                      />
                      <input
                        type="text"
                        value={r.name}
                        onChange={(e) => {
                          const updated = rules.map(x => x.id === r.id ? { ...x, name: e.target.value } : x);
                          setRules(updated);
                          saveConditionRulePresets(updated);
                        }}
                        className="flex-1 bg-[#1A1D21] border border-[#2D3139] rounded px-2.5 py-1 font-bold text-white"
                        placeholder="Nome da Condição ou Regra"
                      />
                      <select
                        value={r.category}
                        onChange={(e) => {
                          const updated = rules.map(x => x.id === r.id ? { ...x, category: e.target.value as any } : x);
                          setRules(updated);
                          saveConditionRulePresets(updated);
                        }}
                        className="bg-[#1A1D21] border border-[#2D3139] rounded px-2 py-1 text-xs text-amber-400 font-semibold"
                      >
                        <option value="status">Status / Condição</option>
                        <option value="difficulty">Dificuldade / CD</option>
                        <option value="action">Ação / Combate</option>
                        <option value="wod">WoD / Vampiro</option>
                        <option value="custom">Customizado</option>
                      </select>
                      <button
                        onClick={() => handleDeleteRule(r.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir regra"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9E9E9E] block mb-0.5">Resumo Rápido (Exibido no card)</label>
                      <input
                        type="text"
                        value={r.summary}
                        onChange={(e) => {
                          const updated = rules.map(x => x.id === r.id ? { ...x, summary: e.target.value } : x);
                          setRules(updated);
                          saveConditionRulePresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded px-2.5 py-1 text-zinc-300 text-xs"
                        placeholder="Resumo em 1 linha das penalidades ou bônus"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9E9E9E] block mb-0.5">Descrição Completa</label>
                      <textarea
                        rows={2}
                        value={r.description}
                        onChange={(e) => {
                          const updated = rules.map(x => x.id === r.id ? { ...x, description: e.target.value } : x);
                          setRules(updated);
                          saveConditionRulePresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded p-2 text-zinc-300 text-xs"
                        placeholder="Detalhes completos da regra..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-indigo-400 font-medium block mb-0.5 flex items-center justify-between">
                        <span>Formato do Envio ao Discord (com Markdown)</span>
                        <span className="text-[9px] text-[#9E9E9E] font-normal">Enviado com o botão 'Enviar no Discord'</span>
                      </label>
                      <textarea
                        rows={2}
                        value={r.discordFormat}
                        onChange={(e) => {
                          const updated = rules.map(x => x.id === r.id ? { ...x, discordFormat: e.target.value } : x);
                          setRules(updated);
                          saveConditionRulePresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-indigo-950/70 rounded p-2 text-indigo-200 font-mono text-[11px]"
                        placeholder="Texto formatado para envio no Discord..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: WEATHER & ATMOSPHERE */}
          {activeTab === 'weather' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Predefinições de Clima, Horário, Iluminação e Atmosferas Narrativas para o Widget de Clima & Atmosfera da Sessão.
                </span>
                <button
                  onClick={handleAddWeather}
                  className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Novo Clima / Atmosfera
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {weathers.map((w) => (
                  <div key={w.id} className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <input
                        type="text"
                        value={w.icon}
                        onChange={(e) => {
                          const updated = weathers.map(x => x.id === w.id ? { ...x, icon: e.target.value } : x);
                          setWeathers(updated);
                          saveWeatherPresets(updated);
                        }}
                        className="w-9 text-center bg-[#1A1D21] border border-[#2D3139] rounded px-1 py-1 text-base"
                        title="Ícone / Emoji"
                      />
                      <input
                        type="text"
                        value={w.name}
                        onChange={(e) => {
                          const updated = weathers.map(x => x.id === w.id ? { ...x, name: e.target.value } : x);
                          setWeathers(updated);
                          saveWeatherPresets(updated);
                        }}
                        className="flex-1 bg-[#1A1D21] border border-[#2D3139] rounded px-2.5 py-1 font-bold text-white"
                        placeholder="Nome do Clima / Atmosfera"
                      />
                      <input
                        type="text"
                        value={w.discordEmoji || ''}
                        onChange={(e) => {
                          const updated = weathers.map(x => x.id === w.id ? { ...x, discordEmoji: e.target.value } : x);
                          setWeathers(updated);
                          saveWeatherPresets(updated);
                        }}
                        className="w-9 text-center bg-[#1A1D21] border border-sky-800/60 rounded px-1 py-1 text-base"
                        title="Emoji Discord"
                        placeholder="Discord"
                      />
                      <button
                        onClick={() => handleDeleteWeather(w.id)}
                        className="p-1.5 rounded text-zinc-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Excluir clima"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-[#9E9E9E] block mb-0.5">Horário Sugerido</label>
                        <select
                          value={w.timeOfDay || 'noon'}
                          onChange={(e) => {
                            const updated = weathers.map(x => x.id === w.id ? { ...x, timeOfDay: e.target.value as any } : x);
                            setWeathers(updated);
                            saveWeatherPresets(updated);
                          }}
                          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded px-2 py-1 text-xs text-zinc-200"
                        >
                          <option value="dawn">Alvorada / Madrugada (06:00)</option>
                          <option value="noon">Meio-Dia Solar (12:00)</option>
                          <option value="afternoon">Tarde (15:00)</option>
                          <option value="dusk">Crepúsculo / Entardecer (18:00)</option>
                          <option value="midnight">Meia-Noite (00:00)</option>
                          <option value="deep_night">Madrugada Profunda (03:00)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-[#9E9E9E] block mb-0.5">Nível de Luz</label>
                        <input
                          type="text"
                          value={w.lightLevel || ''}
                          onChange={(e) => {
                            const updated = weathers.map(x => x.id === w.id ? { ...x, lightLevel: e.target.value } : x);
                            setWeathers(updated);
                            saveWeatherPresets(updated);
                          }}
                          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded px-2 py-1 text-zinc-200 text-xs"
                          placeholder="Ex: Penumbra, Luz Plena..."
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] text-amber-400 block mb-0.5">Efeito Mecânico / Regra da Atmosfera</label>
                      <input
                        type="text"
                        value={w.effect}
                        onChange={(e) => {
                          const updated = weathers.map(x => x.id === w.id ? { ...x, effect: e.target.value } : x);
                          setWeathers(updated);
                          saveWeatherPresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded px-2.5 py-1 text-zinc-200 text-xs"
                        placeholder="Ex: Visibilidade reduzida a 9m, testes de Percepção com desvantagem..."
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-[#9E9E9E] block mb-0.5">Descrição Narrativa (Para ler aos jogadores)</label>
                      <textarea
                        rows={2}
                        value={w.description || ''}
                        onChange={(e) => {
                          const updated = weathers.map(x => x.id === w.id ? { ...x, description: e.target.value } : x);
                          setWeathers(updated);
                          saveWeatherPresets(updated);
                        }}
                        className="w-full bg-[#1A1D21] border border-[#2D3139] rounded p-2 text-zinc-300 text-xs"
                        placeholder="Descreva o arrepio do vento, os sons e a ambientação..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB: FREE RAW JSON EDITOR */}
          {activeTab === 'json' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#9E9E9E]">
                  Edite todas as predefinições diretamente em JSON. Ao salvar, todos os widgets do app recarregam instantaneamente.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadJson}
                    className="px-2.5 py-1.5 rounded-lg bg-[#22262B] hover:bg-[#2D3139] text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                    title="Baixar backup das predefinições em JSON"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Exportar JSON
                  </button>
                  <label className="px-2.5 py-1.5 rounded-lg bg-[#22262B] hover:bg-[#2D3139] text-zinc-300 hover:text-white text-xs flex items-center gap-1.5 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    Importar JSON
                    <input type="file" accept=".json" onChange={handleUploadFile} className="hidden" />
                  </label>
                  <button
                    onClick={handleSaveJson}
                    className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 shadow cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    Aplicar Alterações JSON
                  </button>
                </div>
              </div>

              <textarea
                rows={16}
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-3.5 font-mono text-xs text-zinc-200 focus:outline-none focus:border-rose-500 leading-relaxed"
                placeholder="{ ... }"
              />
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#2D3139] bg-[#141619] flex items-center justify-between shrink-0 text-xs text-[#9E9E9E]">
          <span>Todas as alterações são salvas localmente e sincronizadas em tempo real.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold cursor-pointer"
          >
            Concluir
          </button>
        </div>

      </div>
    </div>
  );
};

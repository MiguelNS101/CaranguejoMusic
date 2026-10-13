import React, { useState } from 'react';
import {
  Sparkles,
  Dice5,
  Copy,
  Check,
  UserPlus,
  RefreshCw,
  X,
  Compass,
  Sliders,
  Filter
} from 'lucide-react';
import {
  generateNpcName,
  generateNpcNameBatch,
  GeneratedNpcName,
  NpcTheme,
  NpcGender,
  NPC_THEMES
} from '../utils/npcNameGenerator';

interface NpcNameGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectNameForNpc?: (name: string, title?: string) => void;
}

export const NpcNameGeneratorModal: React.FC<NpcNameGeneratorModalProps> = ({
  isOpen,
  onClose,
  onSelectNameForNpc
}) => {
  const [theme, setTheme] = useState<NpcTheme>('fantasy');
  const [gender, setGender] = useState<NpcGender>('any');
  const [includeTitles, setIncludeTitles] = useState<boolean>(true);
  const [generatedList, setGeneratedList] = useState<GeneratedNpcName[]>(() =>
    generateNpcNameBatch('fantasy', 10, 'any', true)
  );
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleRerollAll = () => {
    setGeneratedList(generateNpcNameBatch(theme, 10, gender, includeTitles));
  };

  const handleThemeChange = (newTheme: NpcTheme) => {
    setTheme(newTheme);
    setGeneratedList(generateNpcNameBatch(newTheme, 10, gender, includeTitles));
  };

  const handleGenderChange = (newGender: NpcGender) => {
    setGender(newGender);
    setGeneratedList(generateNpcNameBatch(theme, 10, newGender, includeTitles));
  };

  const handleCopy = (item: GeneratedNpcName) => {
    const textToCopy = item.title ? `${item.fullName} (${item.title})` : item.fullName;
    navigator.clipboard.writeText(textToCopy);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleUseName = (item: GeneratedNpcName) => {
    if (onSelectNameForNpc) {
      onSelectNameForNpc(item.fullName, item.title);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#2D3139] pb-3 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-rpg flex items-center gap-2">
                Gerador Aleatório de Nomes de NPCs
              </h3>
              <p className="text-xs text-[#9E9E9E]">
                Gere nomes temáticos com 1 clique e aplique diretamente à ficha do NPC
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9E9E9E] hover:text-white transition-colors cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Theme Selector */}
        <div className="space-y-3 shrink-0">
          {/* Themes Pills */}
          <div>
            <label className="text-[11px] font-bold text-[#9E9E9E] uppercase tracking-wider block mb-1.5">
              Tema / Cenário
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {NPC_THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-600/30'
                        : 'bg-[#141619] border-[#2D3139] text-[#9E9E9E] hover:text-zinc-200 hover:border-[#3D434E]'
                    }`}
                  >
                    <span className="text-sm">{t.icon}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gender & Title controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[#141619] p-3 rounded-xl border border-[#2D3139]">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#9E9E9E] font-medium">Gênero:</span>
              <div className="flex rounded-lg bg-[#1A1D21] p-0.5 border border-[#2D3139]">
                {(['any', 'male', 'female', 'neutral'] as NpcGender[]).map((g) => (
                  <button
                    key={g}
                    onClick={() => handleGenderChange(g)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold cursor-pointer transition-all ${
                      gender === g
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'text-[#9E9E9E] hover:text-white'
                    }`}
                  >
                    {g === 'any' ? 'Todos' : g === 'male' ? 'Masc' : g === 'female' ? 'Fem' : 'Neutro'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={includeTitles}
                  onChange={(e) => {
                    setIncludeTitles(e.target.checked);
                    setGeneratedList(generateNpcNameBatch(theme, 10, gender, e.target.checked));
                  }}
                  className="rounded border-[#2D3139] text-indigo-600 focus:ring-0 bg-[#1A1D21]"
                />
                Incluir Títulos / Ocupações
              </label>

              <button
                onClick={handleRerollAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#242830] hover:bg-[#2D3139] text-white text-xs font-bold transition-all border border-[#3D434E] cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
                Rolar Novos (10)
              </button>
            </div>
          </div>
        </div>

        {/* Names List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[260px]">
          {generatedList.map((item) => {
            const isCopied = copiedId === item.id;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-xl bg-[#141619] border border-[#2D3139] hover:border-indigo-500/40 transition-all group"
              >
                <div className="min-w-0 pr-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-white text-sm font-rpg tracking-wide">
                      {item.fullName}
                    </span>
                    {item.title && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-500/40 text-[11px] font-medium text-indigo-300 truncate">
                        {item.title}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-[#9E9E9E]">
                    {item.themeLabel} • {item.gender === 'male' ? 'Masculino' : item.gender === 'female' ? 'Feminino' : 'Neutro'}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleCopy(item)}
                    className="p-1.5 rounded-lg bg-[#1A1D21] hover:bg-[#252830] text-[#9E9E9E] hover:text-white border border-[#2D3139] transition-colors cursor-pointer"
                    title="Copiar nome"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>

                  {onSelectNameForNpc && (
                    <button
                      onClick={() => handleUseName(item)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
                      title="Usar e atribuir este nome a um novo NPC"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Usar no NPC
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#2D3139] flex items-center justify-between text-xs text-[#9E9E9E] shrink-0">
          <span>Dica: você também pode gerar nomes diretamente dentro da janela de criação de NPC com 1 clique.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-white font-semibold transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

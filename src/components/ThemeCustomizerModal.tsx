import React, { useState } from 'react';
import {
  Palette,
  X,
  Sparkles,
  Sliders,
  Code2,
  RotateCcw,
  Check,
  Layout,
  Type,
  Copy,
  CheckCheck
} from 'lucide-react';
import { useTheme, THEME_PRESETS } from '../context/ThemeContext';

interface ThemeCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const CSS_SNIPPETS = [
  {
    title: 'Largura 100% (Tela Inteira)',
    desc: 'Remove os limites laterais e aproveita 100% da tela do seu monitor.',
    code: `/* Aproveitamento total de tela */
.max-w-7xl, main {
  max-width: 100% !important;
  width: 100% !important;
}`
  },
  {
    title: 'Bordas Retas & Grimdark',
    desc: 'Visual afiado e tático sem cantos arredondados.',
    code: `/* Estilo Grimdark Afiado */
* {
  border-radius: 0px !important;
}`
  },
  {
    title: 'Glow Místico nos Acentos',
    desc: 'Adiciona um brilho sutil aos botões e elementos ativos.',
    code: `/* Glow nos botões de destaque */
button[class*="bg-indigo-600"], button[class*="bg-amber-500"] {
  box-shadow: 0 0 16px rgba(99, 102, 241, 0.45) !important;
}`
  },
  {
    title: 'Scrollbars Invisíveis',
    desc: 'Oculta as barras de rolagem enquanto mantém o scroll ativo.',
    code: `/* Ocultar barras de rolagem */
::-webkit-scrollbar {
  width: 0px !important;
  height: 0px !important;
}`
  },
  {
    title: 'Títulos em Dourado Antigo',
    desc: 'Aplica tom dourado arcano em todos os cabeçalhos de widgets.',
    code: `/* Títulos dourados medievais */
h1, h2, h3, h4, .font-rpg {
  color: #FBBF24 !important;
  text-shadow: 0 2px 8px rgba(245, 158, 11, 0.25) !important;
}`
  }
];

export const ThemeCustomizerModal: React.FC<ThemeCustomizerModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    currentTheme,
    selectPreset,
    updateColors,
    updateLayout,
    updateCustomCss,
    resetTheme,
    applyCssSnippet
  } = useTheme();

  const [activeTab, setActiveTab] = useState<'presets' | 'colors' | 'layout' | 'css'>('presets');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyJson = () => {
    navigator.clipboard.writeText(JSON.stringify(currentTheme, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#141619] border border-[#2D3139] rounded-3xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="p-5 border-b border-[#2D3139] flex items-center justify-between shrink-0 bg-[#171A1F]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/60 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Personalização de Temas & CSS
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Estilo Livre
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Alterne entre paletas RPG prontas, modifique larguras e espaçamentos ou injete regras CSS em tempo real.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-xl hover:bg-[#20242B] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 border-b border-[#2D3139] flex items-center gap-2 bg-[#121417] shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('presets')}
            className={`flex items-center gap-2 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'presets'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Predefinições ({THEME_PRESETS.length})
          </button>

          <button
            onClick={() => setActiveTab('colors')}
            className={`flex items-center gap-2 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'colors'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Cores & Paleta
          </button>

          <button
            onClick={() => setActiveTab('layout')}
            className={`flex items-center gap-2 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'layout'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Layout className="w-4 h-4" />
            Largura & Layout
          </button>

          <button
            onClick={() => setActiveTab('css')}
            className={`flex items-center gap-2 px-3 py-3 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
              activeTab === 'css'
                ? 'text-indigo-400 border-indigo-500'
                : 'text-zinc-400 border-transparent hover:text-zinc-200'
            }`}
          >
            <Code2 className="w-4 h-4" />
            Editor de CSS Livre
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-[#101215]">
          {/* TAB 1: PRESETS */}
          {activeTab === 'presets' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {THEME_PRESETS.map((preset) => {
                  const isSelected = currentTheme.id === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => selectPreset(preset.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 text-left relative overflow-hidden group ${
                        isSelected
                          ? 'bg-[#1C2026] border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg'
                          : 'bg-[#15171C] border-[#282C34] hover:border-zinc-500/40 hover:bg-[#1A1D23]'
                      }`}
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-white text-sm flex items-center gap-2">
                            {preset.name}
                          </h4>
                          {isSelected && (
                            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-xs">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">
                          {preset.description}
                        </p>
                      </div>

                      {/* Color Palette preview swatches */}
                      <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80">
                        <div
                          className="w-5 h-5 rounded-lg border border-black/40 shadow-sm"
                          style={{ backgroundColor: preset.colors.bgPrimary }}
                          title={`Fundo: ${preset.colors.bgPrimary}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/40 shadow-sm"
                          style={{ backgroundColor: preset.colors.bgCard }}
                          title={`Cartão: ${preset.colors.bgCard}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/40 shadow-sm"
                          style={{ backgroundColor: preset.colors.border }}
                          title={`Borda: ${preset.colors.border}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/40 shadow-sm"
                          style={{ backgroundColor: preset.colors.accentPrimary }}
                          title={`Acento Primário: ${preset.colors.accentPrimary}`}
                        />
                        <div
                          className="w-5 h-5 rounded-lg border border-black/40 shadow-sm"
                          style={{ backgroundColor: preset.colors.accentSecondary }}
                          title={`Acento Secundário: ${preset.colors.accentSecondary}`}
                        />
                        <span className="text-[10px] text-zinc-500 font-mono ml-auto">
                          {preset.layout.radius}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: CORES */}
          {activeTab === 'colors' && (
            <div className="space-y-5">
              <p className="text-xs text-zinc-400">
                Ajuste os valores hexadecimais das variáveis do tema ativo. As mudanças têm aplicação imediata.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Background Primary */}
                <div className="p-3.5 rounded-2xl bg-[#16181D] border border-[#2D3139] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Fundo Principal</label>
                    <span className="text-[11px] text-zinc-400">Páginas e fundo da mesa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTheme.colors.bgPrimary}
                      onChange={(e) => updateColors({ bgPrimary: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.bgPrimary}
                      onChange={(e) => updateColors({ bgPrimary: e.target.value })}
                      className="w-20 px-2 py-1 rounded bg-[#101215] border border-zinc-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>

                {/* Card Background */}
                <div className="p-3.5 rounded-2xl bg-[#16181D] border border-[#2D3139] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Fundo dos Cartões</label>
                    <span className="text-[11px] text-zinc-400">Widgets, blocos e módulos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTheme.colors.bgCard}
                      onChange={(e) => updateColors({ bgCard: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.bgCard}
                      onChange={(e) => updateColors({ bgCard: e.target.value })}
                      className="w-20 px-2 py-1 rounded bg-[#101215] border border-zinc-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>

                {/* Border Color */}
                <div className="p-3.5 rounded-2xl bg-[#16181D] border border-[#2D3139] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Cor das Bordas</label>
                    <span className="text-[11px] text-zinc-400">Linhas divisórias e contornos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTheme.colors.border}
                      onChange={(e) => updateColors({ border: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.border}
                      onChange={(e) => updateColors({ border: e.target.value })}
                      className="w-20 px-2 py-1 rounded bg-[#101215] border border-zinc-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>

                {/* Accent Primary */}
                <div className="p-3.5 rounded-2xl bg-[#16181D] border border-[#2D3139] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Acento Primário</label>
                    <span className="text-[11px] text-zinc-400">Botões ativos e destaques</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTheme.colors.accentPrimary}
                      onChange={(e) => updateColors({ accentPrimary: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.accentPrimary}
                      onChange={(e) => updateColors({ accentPrimary: e.target.value })}
                      className="w-20 px-2 py-1 rounded bg-[#101215] border border-zinc-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>

                {/* Accent Secondary */}
                <div className="p-3.5 rounded-2xl bg-[#16181D] border border-[#2D3139] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Acento Secundário</label>
                    <span className="text-[11px] text-zinc-400">Badges de alerta, ouro e avisos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTheme.colors.accentSecondary}
                      onChange={(e) => updateColors({ accentSecondary: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.accentSecondary}
                      onChange={(e) => updateColors({ accentSecondary: e.target.value })}
                      className="w-20 px-2 py-1 rounded bg-[#101215] border border-zinc-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>

                {/* Text Primary */}
                <div className="p-3.5 rounded-2xl bg-[#16181D] border border-[#2D3139] flex items-center justify-between">
                  <div>
                    <label className="text-xs font-bold text-white block">Texto Principal</label>
                    <span className="text-[11px] text-zinc-400">Títulos e texto de alta ênfase</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={currentTheme.colors.textPrimary}
                      onChange={(e) => updateColors({ textPrimary: e.target.value })}
                      className="w-8 h-8 rounded-lg bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentTheme.colors.textPrimary}
                      onChange={(e) => updateColors({ textPrimary: e.target.value })}
                      className="w-20 px-2 py-1 rounded bg-[#101215] border border-zinc-700 text-xs font-mono text-white text-center"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LAYOUT & ESPAÇAMENTO */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              {/* Container Max Width */}
              <div className="p-4 rounded-2xl bg-[#16181D] border border-[#2D3139] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Largura Máxima do Container (Width)</h4>
                    <p className="text-[11px] text-zinc-400">Defina o limite de largura horizontal do escudo e das abas.</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30">
                    {currentTheme.layout.containerMaxWidth}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Padrão (72rem)', val: '72rem' },
                    { label: 'Largo (80rem)', val: '80rem' },
                    { label: 'Ultra (90rem)', val: '90rem' },
                    { label: '100% (Tela Total)', val: '100%' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => updateLayout({ containerMaxWidth: item.val })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        currentTheme.layout.containerMaxWidth === item.val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-[#1A1D23] border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#20242B]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Corner Radius */}
              <div className="p-4 rounded-2xl bg-[#16181D] border border-[#2D3139] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Arredondamento dos Cantos (Border Radius)</h4>
                    <p className="text-[11px] text-zinc-400">Estilo das bordas dos cartões, botões e widgets.</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30">
                    {currentTheme.layout.radius}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { label: 'Reto (0px - Grimdark)', val: '0px' },
                    { label: 'Sutil (0.5rem)', val: '0.5rem' },
                    { label: 'Suave (1rem)', val: '1rem' },
                    { label: 'Arredondado (1.5rem)', val: '1.5rem' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => updateLayout({ radius: item.val })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        currentTheme.layout.radius === item.val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-[#1A1D23] border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#20242B]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Card Padding */}
              <div className="p-4 rounded-2xl bg-[#16181D] border border-[#2D3139] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white">Espaçamento Interno (Padding)</h4>
                    <p className="text-[11px] text-zinc-400">Espaço interno dos cartões e caixas de ferramentas.</p>
                  </div>
                  <span className="text-xs font-mono text-indigo-400 bg-indigo-950/40 px-2 py-0.5 rounded border border-indigo-500/30">
                    {currentTheme.layout.cardPadding}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { label: 'Compacto (0.85rem)', val: '0.85rem' },
                    { label: 'Padrão (1.25rem)', val: '1.25rem' },
                    { label: 'Arejado (1.75rem)', val: '1.75rem' }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => updateLayout({ cardPadding: item.val })}
                      className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                        currentTheme.layout.cardPadding === item.val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-[#1A1D23] border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#20242B]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Family */}
              <div className="p-4 rounded-2xl bg-[#16181D] border border-[#2D3139] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-indigo-400" />
                      Tipografia Base
                    </h4>
                    <p className="text-[11px] text-zinc-400">Fonte geral aplicada a textos e interfaces.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { label: 'Moderna (Jakarta Sans)', val: "'Plus Jakarta Sans', system-ui, sans-serif" },
                    { label: 'Medieval / RPG (Cinzel)', val: "'Cinzel', 'Plus Jakarta Sans', serif" },
                    { label: 'Tática / Código (Fira Code)', val: "'Fira Code', monospace" }
                  ].map((item) => (
                    <button
                      key={item.val}
                      onClick={() => updateLayout({ fontFamily: item.val })}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                        currentTheme.layout.fontFamily === item.val
                          ? 'bg-indigo-600 text-white border-indigo-500'
                          : 'bg-[#1A1D23] border-zinc-800 text-zinc-300 hover:text-white hover:bg-[#20242B]'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: CUSTOM CSS */}
          {activeTab === 'css' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-2">
                  <Code2 className="w-4 h-4 text-indigo-400" />
                  Injeção de CSS Customizado
                </h3>
                <p className="text-xs text-zinc-400">
                  Escreva qualquer seletor ou regra CSS padrão. As alterações são aplicadas e salvas em tempo real no app.
                </p>
              </div>

              {/* Code Snippets Accordion / Quick Buttons */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider block">
                  Snippets Prontos (Clique para Inserir):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CSS_SNIPPETS.map((snippet, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyCssSnippet(snippet.code)}
                      className="p-2.5 rounded-xl bg-[#16181D] hover:bg-[#1F232B] border border-[#2D3139] hover:border-indigo-500/50 text-left transition-all group"
                    >
                      <strong className="text-xs text-indigo-300 group-hover:text-indigo-200 block">
                        + {snippet.title}
                      </strong>
                      <span className="text-[10px] text-zinc-400 block leading-tight mt-0.5">
                        {snippet.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* CSS Editor Textarea */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Editor de CSS (Salvo automaticamente):</span>
                  <span className="font-mono text-[10px] text-zinc-500">
                    {currentTheme.customCss ? `${currentTheme.customCss.length} caracteres` : 'Vazio'}
                  </span>
                </div>
                <textarea
                  value={currentTheme.customCss || ''}
                  onChange={(e) => updateCustomCss(e.target.value)}
                  placeholder="/* Digite seu CSS customizado aqui... */&#10;.master-screen { max-width: 100% !important; }"
                  rows={9}
                  className="w-full p-3.5 rounded-xl bg-[#0B0C0E] border border-[#2D3139] text-xs font-mono text-emerald-400 focus:outline-none focus:border-indigo-500 transition-colors resize-y leading-relaxed"
                  spellCheck={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-[#2D3139] bg-[#141619] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={resetTheme}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1D21] hover:bg-[#22262B] text-xs font-semibold text-zinc-300 hover:text-white border border-[#2D3139] transition-all"
              title="Restaurar o tema padrão original"
            >
              <RotateCcw className="w-3.5 h-3.5 text-zinc-400" />
              <span>Restaurar Padrão</span>
            </button>

            <button
              onClick={handleCopyJson}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1A1D21] hover:bg-[#22262B] text-xs font-semibold text-zinc-300 hover:text-white border border-[#2D3139] transition-all"
              title="Copiar configuração do tema em formato JSON"
            >
              {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
              <span>{copied ? 'Copiado!' : 'Copiar Tema'}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
};

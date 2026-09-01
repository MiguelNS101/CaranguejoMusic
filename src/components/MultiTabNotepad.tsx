import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Edit2,
  Check,
  Copy,
  Send,
  Sparkles,
  Save,
  Clock,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  FileDown,
  RefreshCw
} from 'lucide-react';
import { NoteTab } from '../types';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';

const DEFAULT_TABS: NoteTab[] = [
  {
    id: 'tab-general',
    title: 'Geral & Resumo',
    emoji: '📜',
    content: '## Resumo da Sessão\n\n- [ ] Investigar os desaparecimentos na vila\n- [ ] Encontrar a entrada oculta para as Catacumbas\n- [ ] Proteger o bardo dos assassinos encapuzados\n\n*Notas do Mestre:* O clérigo da ordem solar sabe mais do que revelou...',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tab-clues',
    title: 'Pistas & Segredos',
    emoji: '🗝️',
    content: '## Pistas & Segredos Reveláveis\n\n1. 🗝️ O anel de prata encontrado no bosque possui o sinete da casa nobre caída.\n2. 📜 A profecia menciona uma lua escarlate dentro de três noites.\n3. 🔒 O taverneiro é secretamente um informante do culto.',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tab-loot',
    title: 'Tesouro & Loot',
    emoji: '💰',
    content: '## Tesouros da Aventura\n\n- 💰 180 Moedas de Ouro (PO)\n- 💎 2x Gemas de Turquesa (50 PO cada)\n- 🧪 3x Poções de Cura Maior (4d4 + 4)\n- ⚔️ Adaga Sussurrante (+1, emite leve luz azul perto de mortos-vivos)',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  },
  {
    id: 'tab-npcs',
    title: 'NPCs & Contatos',
    emoji: '👤',
    content: '## Contatos Rápidos\n\n- **Garrick (Ferreiro):** Leal, odeia o lorde corrupto. Cobra metade pelo conserto se trouxerem minério.\n- **Irmã Valéria:** Sacerdotisa, pode curar maldições em troca de favores sagrados.\n- **Vulto Mascarado:** Espião neutro, vende informações no beco à meia-noite.',
    isDefault: true,
    createdAt: Date.now(),
    updatedAt: Date.now()
  }
];

interface MultiTabNotepadProps {
  storageKey?: string;
  defaultTabs?: NoteTab[];
}

export const MultiTabNotepad: React.FC<MultiTabNotepadProps> = ({
  storageKey = 'caranguejo_persistent_note_tabs',
  defaultTabs = DEFAULT_TABS
}) => {
  const { sessionNotes, saveNotes, botStatus } = useAudio();

  const [tabs, setTabs] = useState<NoteTab[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {}

    // Fallback: If sessionNotes from backend has legacy text, put it in the first tab
    if (sessionNotes && sessionNotes.trim() && storageKey === 'caranguejo_persistent_note_tabs') {
      const cloned = [...defaultTabs];
      cloned[0].content = sessionNotes;
      return cloned;
    }
    return defaultTabs;
  });

  const [activeTabId, setActiveTabId] = useState<string>(() => tabs[0]?.id || 'tab-general');
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  const [copiedFeedback, setCopiedFeedback] = useState(false);
  const [isSendingToDiscord, setIsSendingToDiscord] = useState(false);
  const [discordFeedback, setDiscordFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving'>('saved');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync to localStorage
  const persistTabs = (newTabs: NoteTab[]) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(newTabs));
    } catch {}
  };

  // Handle content change in active tab with debounce auto-save to backend
  const handleContentChange = (newContent: string) => {
    setSaveStatus('saving');
    const updatedTabs = tabs.map(t => {
      if (t.id === activeTab.id) {
        return { ...t, content: newContent, updatedAt: Date.now() };
      }
      return t;
    });

    setTabs(updatedTabs);
    persistTabs(updatedTabs);

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      // Consolidate or save current active notes to server
      saveNotes(newContent);
      setSaveStatus('saved');
    }, 1200);
  };

  const handleAddNewTab = () => {
    const newId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTabNumber = tabs.length + 1;
    const newTab: NoteTab = {
      id: newId,
      title: `Aba ${newTabNumber}`,
      emoji: '📝',
      content: '',
      isDefault: false,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    const nextTabs = [...tabs, newTab];
    setTabs(nextTabs);
    persistTabs(nextTabs);
    setActiveTabId(newId);
    setEditingTabId(newId);
    setEditingTitle(newTab.title);
  };

  const handleStartRename = (tab: NoteTab, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingTabId(tab.id);
    setEditingTitle(tab.title);
  };

  const handleSaveRename = (tabId: string) => {
    if (!editingTitle.trim()) {
      setEditingTabId(null);
      return;
    }
    const nextTabs = tabs.map(t => {
      if (t.id === tabId) {
        return { ...t, title: editingTitle.trim(), updatedAt: Date.now() };
      }
      return t;
    });
    setTabs(nextTabs);
    persistTabs(nextTabs);
    setEditingTabId(null);
  };

  const handleDeleteTab = (tabId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length <= 1) {
      alert('Você precisa manter pelo menos uma aba no bloco de notas.');
      return;
    }
    if (confirm('Tem certeza que deseja excluir esta aba e suas anotações?')) {
      const nextTabs = tabs.filter(t => t.id !== tabId);
      setTabs(nextTabs);
      persistTabs(nextTabs);
      if (activeTabId === tabId) {
        setActiveTabId(nextTabs[0]?.id || '');
      }
    }
  };

  // Quick Template Inserter
  const insertTemplate = (templateType: 'clue' | 'loot' | 'combat' | 'npc') => {
    let templateText = '';
    if (templateType === 'clue') {
      templateText = '\n\n- [ ] 🗝️ **Nova Pista:** Descreva a pista aqui...\n  - *Local:* Onde foi encontrada\n  - *Segredo revelado:* O que ela significa';
    } else if (templateType === 'loot') {
      templateText = '\n\n- 💰 **Novo Tesouro Encontrado:**\n  - Moedas: 50 PO\n  - Item Especial: ...\n  - Valor Estimado: ...';
    } else if (templateType === 'combat') {
      templateText = '\n\n⚔️ **Encontro de Combate:**\n- Inimigos: 4x Goblins, 1x Xamã Goblin\n- Ambiente: Caverna úmida com estalactites caindo\n- Tática: Emboscada pelas sombras';
    } else if (templateType === 'npc') {
      templateText = '\n\n👤 **NPC:** [Nome do Personagem]\n- Papel: Taverneiro / Nobre / Mercenário\n- Motivação Secreta: O que ele realmente quer\n- Conexão com os Jogadores: ...';
    }

    const currentContent = activeTab?.content || '';
    handleContentChange(currentContent + templateText);
  };

  // Copy Note Content to Clipboard
  const handleCopyNote = () => {
    if (!activeTab?.content) return;
    navigator.clipboard.writeText(activeTab.content);
    setCopiedFeedback(true);
    setTimeout(() => setCopiedFeedback(false), 2500);
  };

  // Send Note Content to Discord
  const handleSendToDiscord = async () => {
    if (!activeTab?.content.trim()) return;
    setIsSendingToDiscord(true);
    setDiscordFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `📜 **[Anotações do Mestre - ${activeTab.title}]**\n\n${activeTab.content.trim()}`,
          type: 'narrative'
        })
      });

      if (res.success && res.data?.success !== false) {
        setDiscordFeedback({ status: 'success', msg: 'Anotações enviadas para o Discord!' });
        setTimeout(() => setDiscordFeedback({ status: 'idle' }), 3000);
      } else {
        setDiscordFeedback({ status: 'error', msg: res.data?.error || res.error || 'Falha ao enviar ao Discord' });
      }
    } catch (e: any) {
      setDiscordFeedback({ status: 'error', msg: e?.message || 'Erro de conexão' });
    } finally {
      setIsSendingToDiscord(false);
    }
  };

  // Metrics
  const charCount = activeTab?.content?.length || 0;
  const wordCount = activeTab?.content ? activeTab.content.trim().split(/\s+/).filter(Boolean).length : 0;

  return (
    <div className="w-full h-full min-w-0 max-w-full flex flex-col space-y-3">
      {/* Tabs Navigation Bar & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3139]/60 pb-2.5 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-1 min-w-0">
          {tabs.map(tab => {
            const isActive = tab.id === activeTabId;
            const isEditing = editingTabId === tab.id;

            return (
              <div
                key={tab.id}
                onClick={() => {
                  if (!isEditing) setActiveTabId(tab.id);
                }}
                className={`shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border cursor-pointer select-none ${
                  isActive
                    ? 'bg-indigo-600/30 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-[#141619] border-[#2D3139] text-[#9E9E9E] hover:text-white hover:bg-[#22262B]'
                }`}
              >
                <span>{tab.emoji || '📝'}</span>
                {isEditing ? (
                  <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={e => setEditingTitle(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Enter') handleSaveRename(tab.id);
                        if (e.key === 'Escape') setEditingTabId(null);
                      }}
                      autoFocus
                      className="bg-[#1A1D21] border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-white w-24 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => handleSaveRename(tab.id)}
                      className="p-0.5 text-emerald-400 hover:text-emerald-300"
                    >
                      <Check className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <span className="truncate max-w-[120px]">{tab.title}</span>
                )}

                {isActive && !isEditing && (
                  <div className="flex items-center gap-0.5 ml-1 border-l border-zinc-700/60 pl-1">
                    <button
                      type="button"
                      onClick={e => handleStartRename(tab, e)}
                      className="text-zinc-400 hover:text-white p-0.5 rounded transition-colors"
                      title="Renomear aba"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {tabs.length > 1 && (
                      <button
                        type="button"
                        onClick={e => handleDeleteTab(tab.id, e)}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                        title="Excluir aba"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-zinc-400 flex items-center gap-1 hidden sm:flex">
            {saveStatus === 'saved' ? (
              <>
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                <span>Salvo</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3 h-3 text-amber-400 animate-spin" />
                <span>Salvando...</span>
              </>
            )}
          </span>

          <button
            type="button"
            onClick={handleAddNewTab}
            className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
            title="Criar nova aba de anotações"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Aba</span>
          </button>
        </div>
      </div>

      {/* Quick Template Inserters & Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-[#141619] p-2.5 rounded-xl border border-[#2D3139]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] uppercase font-bold text-[#6E7681] mr-1">
            Modelos Rápidos:
          </span>
          <button
            type="button"
            onClick={() => insertTemplate('clue')}
            className="px-2 py-1 rounded-lg bg-[#1A1D21] hover:bg-indigo-950/40 text-[11px] text-[#D0D4DC] hover:text-indigo-200 border border-[#2D3139] hover:border-indigo-500/40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>🗝️</span> Pista
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('loot')}
            className="px-2 py-1 rounded-lg bg-[#1A1D21] hover:bg-amber-950/40 text-[11px] text-[#D0D4DC] hover:text-amber-200 border border-[#2D3139] hover:border-amber-500/40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>💰</span> Tesouro
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('combat')}
            className="px-2 py-1 rounded-lg bg-[#1A1D21] hover:bg-rose-950/40 text-[11px] text-[#D0D4DC] hover:text-rose-200 border border-[#2D3139] hover:border-rose-500/40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>⚔️</span> Combate
          </button>
          <button
            type="button"
            onClick={() => insertTemplate('npc')}
            className="px-2 py-1 rounded-lg bg-[#1A1D21] hover:bg-cyan-950/40 text-[11px] text-[#D0D4DC] hover:text-cyan-200 border border-[#2D3139] hover:border-cyan-500/40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <span>👤</span> NPC
          </button>
        </div>

        {/* Copy & Discord Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyNote}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1A1D21] hover:bg-[#22262B] text-zinc-300 hover:text-white border border-[#2D3139] text-xs font-medium transition-colors cursor-pointer"
            title="Copiar texto desta aba"
          >
            {copiedFeedback ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFeedback ? 'Copiado!' : 'Copiar'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendToDiscord}
            disabled={isSendingToDiscord || !activeTab?.content.trim()}
            className="flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-sm"
            title="Postar esta aba diretamente no canal de texto do Discord"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSendingToDiscord ? 'Enviando...' : 'Postar no Discord'}</span>
          </button>
        </div>
      </div>

      {/* Discord Feedback */}
      {discordFeedback.status === 'success' && (
        <div className="p-2 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>{discordFeedback.msg}</span>
        </div>
      )}
      {discordFeedback.status === 'error' && (
        <div className="p-2 rounded-xl bg-rose-950/40 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
          <span>{discordFeedback.msg}</span>
        </div>
      )}

      {/* Main Textarea Note Editor */}
      <div className="space-y-1.5">
        <textarea
          value={activeTab?.content || ''}
          onChange={e => handleContentChange(e.target.value)}
          placeholder={`Escreva as anotações para "${activeTab?.title || 'esta aba'}"... Suporta texto livre, Markdown, listas e lembretes.`}
          rows={9}
          className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-indigo-500/80 font-mono leading-relaxed resize-y transition-colors"
        />

        <div className="flex items-center justify-between text-[10px] text-zinc-500 px-1">
          <span>{activeTab?.title} • Editado automaticamente</span>
          <span>{wordCount} palavras • {charCount} caracteres</span>
        </div>
      </div>
    </div>
  );
};

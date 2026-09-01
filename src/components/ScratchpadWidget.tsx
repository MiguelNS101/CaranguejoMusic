import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Trash2,
  Send,
  Sparkles,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { safeFetchJson } from '../services/api';

interface ScratchpadWidgetProps {
  storageKey?: string;
  defaultText?: string;
  placeholder?: string;
}

export const ScratchpadWidget: React.FC<ScratchpadWidgetProps> = ({
  storageKey = 'caranguejo_scratchpad_notes',
  defaultText = '## Rascunho Rápido da Rodada\n- HP do Guarda: 18/25\n- Senha do cofre: "SANGUE_E_CINZAS"\n- Pista entregue pelo taverneiro.',
  placeholder = 'Escreva notas temporárias, HP de monstros, lembretes ou senhas...'
}) => {
  const [content, setContent] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) return saved;
    } catch {}
    return defaultText;
  });

  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, content);
    } catch {}
  }, [content, storageKey]);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    if (window.confirm('Deseja limpar todo o rascunho?')) {
      setContent('');
    }
  };

  const handleSendToDiscord = async () => {
    if (!content.trim()) return;
    setIsSending(true);
    setFeedback({ status: 'idle' });

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `📝 **Anotação Rápida do Mestre:**\n\n${content}`,
          type: 'narration'
        })
      });

      if (res.success) {
        setFeedback({ status: 'success', msg: 'Rascunho enviado ao Discord!' });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', msg: res.error || 'Falha ao enviar.' });
        setTimeout(() => setFeedback({ status: 'idle' }), 4000);
      }
    } catch {
      setFeedback({ status: 'error', msg: 'Erro de conexão.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full min-w-0 max-w-full flex flex-col justify-between space-y-3">
      <div className="flex-1 min-h-0 min-w-0">
        <textarea
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          className="w-full h-full min-h-[120px] bg-[#141619] border border-[#2D3139] rounded-xl p-3 text-xs text-white placeholder:text-[#6E7681] focus:border-amber-500/80 focus:outline-none resize-y font-mono leading-relaxed custom-scrollbar"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#2D3139]/60 shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleClear}
            className="p-1.5 rounded-lg bg-[#22262B] hover:bg-rose-950/40 text-[#9E9E9E] hover:text-rose-400 border border-[#2D3139] text-xs cursor-pointer transition-colors"
            title="Limpar Rascunho"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1.5 rounded-lg bg-[#22262B] hover:bg-[#2B3037] text-white border border-[#2D3139] text-xs flex items-center gap-1 cursor-pointer"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            {copied ? 'Copiado!' : 'Copiar'}
          </button>
        </div>

        {feedback.status === 'success' && (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {feedback.msg}
          </span>
        )}

        <button
          type="button"
          onClick={handleSendToDiscord}
          disabled={isSending || !content.trim()}
          className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20 disabled:opacity-40 cursor-pointer transition-all"
        >
          <Send className="w-3.5 h-3.5" />
          {isSending ? 'Enviando...' : 'Postar no Discord'}
        </button>
      </div>
    </div>
  );
};

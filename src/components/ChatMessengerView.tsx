import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Image,
  Scroll,
  Dices,
  Bot
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAudio } from '../context/AudioContext';
import { DiscordChannel, DiscordGuild } from '../types';

export const ChatMessengerView: React.FC = () => {
  const { botStatus } = useAudio();

  const [messageType, setMessageType] = useState<'narrative' | 'embed' | 'plain'>('narrative');
  const [channels, setChannels] = useState<DiscordChannel[]>([]);
  const [selectedChannelId, setSelectedChannelId] = useState<string>('');

  // Plain / Narrative
  const [textContent, setTextContent] = useState<string>('');

  // Rich Embed State
  const [embedTitle, setEmbedTitle] = useState<string>('📜 Mensagem do Mestre da Mesa');
  const [embedDescription, setEmbedDescription] = useState<string>('');
  const [embedColor, setEmbedColor] = useState<string>('#f59e0b');
  const [embedAuthor, setEmbedAuthor] = useState<string>('Escudo do Mestre');
  const [embedImageUrl, setEmbedImageUrl] = useState<string>('');
  const [embedThumbnailUrl, setEmbedThumbnailUrl] = useState<string>('');
  const [embedFooter, setEmbedFooter] = useState<string>('Sessão de RPG • Mensagem Oficial');
  const [embedFields, setEmbedFields] = useState<Array<{ name: string; value: string; inline: boolean }>>([
    { name: '⚔️ Clima / Ameaça', value: 'Perigo Iminente', inline: true },
    { name: '🗺️ Localização', value: 'Floresta dos Sussurros', inline: true }
  ]);

  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Fetch available channels from connected bot
  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await fetch('/api/bot/guilds');
        if (res.ok) {
          const guilds: DiscordGuild[] = await res.json();
          const textChannels: DiscordChannel[] = [];
          guilds.forEach(g => {
            g.channels.forEach(c => {
              if (c.type === 'text') textChannels.push(c);
            });
          });
          setChannels(textChannels);
          if (textChannels.length > 0 && !selectedChannelId) {
            setSelectedChannelId(textChannels[0].id);
          }
        }
      } catch (err) {
        console.error('Error loading channels:', err);
      }
    };

    if (botStatus.isOnline) {
      fetchChannels();
    }
  }, [botStatus.isOnline]);

  const handleAddField = () => {
    setEmbedFields(prev => [...prev, { name: 'Novo Campo', value: 'Detalhes...', inline: true }]);
  };

  const handleRemoveField = (index: number) => {
    setEmbedFields(prev => prev.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: 'name' | 'value' | 'inline', val: any) => {
    setEmbedFields(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [key]: val };
      return copy;
    });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    setFeedback({ status: 'idle' });

    let payload: any = {
      channelId: selectedChannelId || undefined,
      type: messageType
    };

    if (messageType === 'narrative') {
      if (!textContent.trim()) {
        setIsSending(false);
        return;
      }
      payload.content = textContent.trim();
    } else if (messageType === 'plain') {
      if (!textContent.trim()) {
        setIsSending(false);
        return;
      }
      payload.content = textContent.trim();
    } else if (messageType === 'embed') {
      payload.embed = {
        title: embedTitle.trim() || undefined,
        description: embedDescription.trim() || undefined,
        color: embedColor,
        authorName: embedAuthor.trim() || undefined,
        imageUrl: embedImageUrl.trim() || undefined,
        thumbnailUrl: embedThumbnailUrl.trim() || undefined,
        footerText: embedFooter.trim() || undefined,
        fields: embedFields.filter(f => f.name.trim() && f.value.trim())
      };
    }

    try {
      const res = await fetch('/api/bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        setFeedback({ status: 'success', msg: 'Mensagem enviada com sucesso para o Discord!' });
        if (messageType === 'narrative' || messageType === 'plain') {
          setTextContent('');
        }
        confetti({ particleCount: 25, spread: 50, origin: { y: 0.7 } });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', msg: data.error || 'Falha ao enviar mensagem.' });
      }
    } catch (err: any) {
      setFeedback({ status: 'error', msg: err?.message || 'Erro de conexão' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-[#FFFFFF] font-rpg">
              Central de Mensagens & Narração no Discord
            </h2>
          </div>
          <p className="text-xs text-[#9E9E9E] mt-0.5">
            Envie narrações épicas, anúncios estilizados e cartões ricos diretamente ao chat dos jogadores.
          </p>
        </div>

        {/* Target Channel Selector */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-[#9E9E9E] font-medium whitespace-nowrap">Canal de Envio:</span>
          <select
            value={selectedChannelId}
            onChange={(e) => setSelectedChannelId(e.target.value)}
            className="bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
          >
            {channels.length > 0 ? (
              channels.map(c => (
                <option key={c.id} value={c.id}>#{c.name}</option>
              ))
            ) : (
              <option value="">Canal Padrão Configurado</option>
            )}
          </select>
        </div>
      </div>

      {/* Main Composer Layout: Form on Left, Live Preview on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Message Type Tabs & Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Format Tabs */}
          <div className="flex items-center gap-2 bg-[#1A1D21] p-1.5 border border-[#2D3139] rounded-2xl">
            <button
              onClick={() => setMessageType('narrative')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                messageType === 'narrative'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B]'
              }`}
            >
              <Scroll className="w-4 h-4" />
              Narração de Cena (Pergaminho)
            </button>

            <button
              onClick={() => setMessageType('embed')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                messageType === 'embed'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B]'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Embed Customizado
            </button>

            <button
              onClick={() => setMessageType('plain')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all ${
                messageType === 'plain'
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                  : 'text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B]'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              Texto Simples
            </button>
          </div>

          {/* Composer Box */}
          <form onSubmit={handleSendMessage} className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg space-y-4">
            
            {messageType === 'narrative' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#E0E0E0] block">
                  Texto da Narração / Descrição de Ambiente
                </label>
                <textarea
                  rows={6}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Escreva a narração da cena... O bot formatará em um pergaminho com destaque dourado no Discord."
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-3 text-sm text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500/70 leading-relaxed resize-none"
                  required
                />
              </div>
            )}

            {messageType === 'plain' && (
              <div className="space-y-3">
                <label className="text-xs font-semibold text-[#E0E0E0] block">
                  Mensagem Direta de Texto
                </label>
                <textarea
                  rows={5}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Digite sua mensagem para o canal..."
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-3 text-sm text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500/70 resize-none"
                  required
                />
              </div>
            )}

            {messageType === 'embed' && (
              <div className="space-y-3.5">
                {/* Title & Author */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                      Título do Card
                    </label>
                    <input
                      type="text"
                      value={embedTitle}
                      onChange={(e) => setEmbedTitle(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                      placeholder="Ex: Tesouro Encontrado!"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                      Nome do Autor
                    </label>
                    <input
                      type="text"
                      value={embedAuthor}
                      onChange={(e) => setEmbedAuthor(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                      placeholder="Escudo do Mestre"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Descrição Principal
                  </label>
                  <textarea
                    rows={3}
                    value={embedDescription}
                    onChange={(e) => setEmbedDescription(e.target.value)}
                    placeholder="Detalhes, acontecimentos ou regras do evento..."
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl p-2.5 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70 resize-none"
                  />
                </div>

                {/* Color & Images */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                      Cor da Borda
                    </label>
                    <div className="flex items-center gap-2 bg-[#141619] border border-[#2D3139] rounded-xl px-2 py-1">
                      <input
                        type="color"
                        value={embedColor}
                        onChange={(e) => setEmbedColor(e.target.value)}
                        className="w-7 h-7 rounded cursor-pointer bg-transparent border-0"
                      />
                      <span className="text-xs font-mono text-[#9E9E9E]">{embedColor}</span>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                      URL da Imagem Grande
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={embedImageUrl}
                      onChange={(e) => setEmbedImageUrl(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                      URL Miniatura (Ícone)
                    </label>
                    <input
                      type="text"
                      placeholder="https://..."
                      value={embedThumbnailUrl}
                      onChange={(e) => setEmbedThumbnailUrl(e.target.value)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                    />
                  </div>
                </div>

                {/* Custom Fields */}
                <div className="space-y-2 pt-2 border-t border-[#2D3139]">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-[#E0E0E0]">
                      Campos Estruturados (Fields)
                    </label>
                    <button
                      type="button"
                      onClick={handleAddField}
                      className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar Campo
                    </button>
                  </div>

                  {embedFields.map((field, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Nome do Campo"
                        value={field.name}
                        onChange={(e) => handleFieldChange(idx, 'name', e.target.value)}
                        className="w-1/3 bg-[#141619] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0]"
                      />
                      <input
                        type="text"
                        placeholder="Valor do Campo"
                        value={field.value}
                        onChange={(e) => handleFieldChange(idx, 'value', e.target.value)}
                        className="flex-1 bg-[#141619] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveField(idx)}
                        className="p-1.5 text-[#9E9E9E] hover:text-rose-400"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Footer */}
                <div>
                  <label className="text-xs font-semibold text-[#E0E0E0] block mb-1">
                    Rodapé do Card
                  </label>
                  <input
                    type="text"
                    value={embedFooter}
                    onChange={(e) => setEmbedFooter(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-[#E0E0E0] focus:outline-none focus:border-indigo-500/70"
                  />
                </div>
              </div>
            )}

            {/* Form Footer & Submit */}
            <div className="pt-3 border-t border-[#2D3139] flex items-center justify-between">
              <div>
                {feedback.status === 'success' && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-4 h-4" />
                    {feedback.msg}
                  </span>
                )}
                {feedback.status === 'error' && (
                  <span className="flex items-center gap-1.5 text-xs text-rose-400 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    {feedback.msg}
                  </span>
                )}
              </div>

              <button
                type="submit"
                disabled={isSending}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all"
              >
                <Send className="w-4 h-4" />
                {isSending ? 'Transmitindo ao Discord...' : 'Enviar Mensagem ao Discord'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Live Discord Message Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#9E9E9E] flex items-center gap-1.5">
              <Bot className="w-4 h-4 text-indigo-400" />
              Prévia Visual do Discord
            </span>
            <span className="text-[10px] text-[#6E7681]">Renderização em tempo real</span>
          </div>

          <div className="bg-[#313338] rounded-2xl p-4 shadow-xl border border-[#2D3139] min-h-[300px]">
            {/* Discord Header Sim */}
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-[#1E232F] border border-orange-500/30 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                <img
                  src="/icon.png"
                  alt="CaranguejoRPG Bot"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-100">
                    {botStatus.username || 'CaranguejoRPG Bot'}
                  </span>
                  <span className="bg-[#5865f2] text-white text-[9px] font-bold px-1 py-0.5 rounded">
                    BOT
                  </span>
                  <span className="text-[10px] text-zinc-400 ml-1">Hoje às 20:00</span>
                </div>

                {/* Simulated Content */}
                <div className="mt-2 text-xs text-zinc-200 leading-relaxed">
                  {messageType === 'plain' && (
                    <p className="whitespace-pre-wrap">{textContent || 'Sua mensagem aparecerá aqui...'}</p>
                  )}

                  {messageType === 'narrative' && (
                    <div className="bg-[#2b2d31] border-l-4 border-amber-500 rounded-r-lg p-3 my-1">
                      <div className="text-[10px] font-bold text-amber-400 uppercase tracking-wider mb-1">
                        📜 Narração do Mestre
                      </div>
                      <p className="italic text-zinc-200 leading-relaxed whitespace-pre-wrap">
                        {textContent || 'A névoa espessa cobre os paralelepípedos enquanto passos pesados ecoam na ruela...'}
                      </p>
                    </div>
                  )}

                  {messageType === 'embed' && (
                    <div
                      className="bg-[#2b2d31] rounded-lg p-3 my-1 border-l-4 space-y-2"
                      style={{ borderColor: embedColor }}
                    >
                      {embedAuthor && (
                        <div className="text-[11px] font-semibold text-zinc-400">
                          {embedAuthor}
                        </div>
                      )}
                      <h4 className="text-sm font-bold text-zinc-100">
                        {embedTitle}
                      </h4>
                      {embedDescription && (
                        <p className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {embedDescription}
                        </p>
                      )}

                      {embedFields.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-zinc-700/50">
                          {embedFields.map((f, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-bold text-zinc-300 block">{f.name}</span>
                              <span className="text-zinc-400">{f.value}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {embedImageUrl && (
                        <div className="rounded-lg overflow-hidden mt-2 max-h-48">
                          <img
                            src={embedImageUrl}
                            alt="Embed"
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      )}

                      {embedFooter && (
                        <div className="text-[10px] text-zinc-400 pt-2 border-t border-zinc-700/40">
                          {embedFooter}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

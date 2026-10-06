import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  AlertCircle,
  X,
  Users,
  MessageSquare,
  Swords,
  Scroll,
  Sparkles,
  Lock,
  Eye,
  Clock,
  Compass,
  Music,
  CloudRain,
  Shield,
  Layers,
  RefreshCw
} from 'lucide-react';
import { useAudio } from '../context/AudioContext';
import { safeFetchJson } from '../services/api';
import { Button } from './Button';
import { downloadMasterSessionPdf, MasterSessionArchiveData } from '../utils/pdfExport';
import { NoteTab } from '../types';

interface MasterSessionPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MasterSessionPdfExportModal: React.FC<MasterSessionPdfExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const {
    npcs,
    sessionNotes,
    initiativeList,
    currentTrack,
    currentAmbienceTrack,
    sessionSeconds,
    formatDuration,
    botConfig,
    botStatus,
    actionLogs
  } = useAudio();

  // Form states
  const [sessionTitle, setSessionTitle] = useState(() => {
    return `Sessão ${new Date().toLocaleDateString('pt-BR')} - Arquivo Oficial`;
  });
  const [campaignName, setCampaignName] = useState('Crônicas da Mesa');
  const [dmName, setDmName] = useState('Mestre');
  const [includeNpcSecrets, setIncludeNpcSecrets] = useState(true);

  // Section Toggles
  const [includeNotes, setIncludeNotes] = useState(true);
  const [includeNpcs, setIncludeNpcs] = useState(true);
  const [includeCombat, setIncludeCombat] = useState(true);
  const [includeChat, setIncludeChat] = useState(true);
  const [includeActionLogs, setIncludeActionLogs] = useState(true);

  // Note tabs loaded from localStorage
  const [noteTabs, setNoteTabs] = useState<NoteTab[]>([]);

  // Messages loaded
  const [chatMessages, setChatMessages] = useState<Array<{
    authorName: string;
    isBot?: boolean;
    content: string;
    timestamp: string;
  }>>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string>(() => {
    return botConfig.textChannelId || '';
  });

  // Weather / Atmosphere if stored
  const [currentWeather, setCurrentWeather] = useState<string>('Clima Estável');

  // Generation status
  const [isExporting, setIsExporting] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; message?: string }>({ status: 'idle' });

  // Load notepad tabs & weather
  useEffect(() => {
    if (!isOpen) return;

    try {
      const savedTabs = localStorage.getItem('caranguejo_persistent_note_tabs');
      if (savedTabs) {
        const parsed = JSON.parse(savedTabs);
        if (Array.isArray(parsed)) setNoteTabs(parsed);
      }
    } catch {}

    try {
      const weatherState = localStorage.getItem('caranguejo_weather_clock_state');
      if (weatherState) {
        const parsed = JSON.parse(weatherState);
        if (parsed.currentWeather?.name) {
          setCurrentWeather(parsed.currentWeather.name);
        }
      }
    } catch {}

    // Load initial messages from active channel if bot configured
    loadChannelMessages(botConfig.textChannelId || '');
  }, [isOpen, botConfig.textChannelId]);

  const loadChannelMessages = async (channelId: string) => {
    if (!channelId || !botStatus.isOnline) {
      // Fallback: use recent action logs as message history if offline or channel not selected
      const fallbackMsgs = (actionLogs || []).slice(0, 30).map(log => ({
        authorName: 'Registro da Mesa',
        isBot: true,
        content: log.text,
        timestamp: new Date(log.timestamp).toLocaleTimeString('pt-BR')
      }));
      setChatMessages(fallbackMsgs);
      return;
    }

    setIsLoadingMessages(true);
    try {
      const res = await safeFetchJson<{ success: boolean; messages: any[] }>(
        `/api/bot/channel-messages?channelId=${channelId}&limit=60`
      );
      if (res.success && Array.isArray(res.data?.messages)) {
        const mapped = res.data.messages.map(m => ({
          authorName: m.author?.username || 'Desconhecido',
          isBot: !!m.author?.bot,
          content: m.cleanContent || m.content || '',
          timestamp: new Date(m.createdAt).toLocaleTimeString('pt-BR')
        })).reverse();
        setChatMessages(mapped);
      }
    } catch {
      // Keep existing
    } finally {
      setIsLoadingMessages(false);
    }
  };

  if (!isOpen) return null;

  const handleExportPdf = async () => {
    setIsExporting(true);
    setFeedback({ status: 'idle' });

    try {
      const archiveData: MasterSessionArchiveData = {
        sessionTitle: sessionTitle.trim() || 'Sessão do Mestre',
        campaignName: campaignName.trim() || 'Mesa Principal',
        dmName: dmName.trim() || 'Mestre',
        sessionDate: new Date().toLocaleDateString('pt-BR'),
        sessionDuration: formatDuration(sessionSeconds) || '0:00',
        weatherAtmosphere: currentWeather,
        activeMusic: currentTrack ? currentTrack.title : undefined,
        activeAmbience: currentAmbienceTrack ? currentAmbienceTrack.title : undefined,
        sessionNotes,
        noteTabs,
        npcs,
        includeNpcSecrets,
        initiativeList: initiativeList.map(i => ({
          name: i.name,
          init: i.init,
          hp: i.hp,
          maxHp: i.maxHp,
          isNpc: i.isNpc
        })),
        chatMessages,
        actionLogs: (actionLogs || []).map(a => ({
          text: a.text,
          category: a.category,
          timestamp: new Date(a.timestamp).toLocaleTimeString('pt-BR')
        })),
        options: {
          includeNotes,
          includeNpcs,
          includeCombat,
          includeChat,
          includeActionLogs
        }
      };

      downloadMasterSessionPdf(archiveData);

      setFeedback({
        status: 'success',
        message: 'Arquivo PDF gerado e baixado com sucesso!'
      });
      setTimeout(() => setFeedback({ status: 'idle' }), 4000);
    } catch (err: any) {
      setFeedback({
        status: 'error',
        message: err?.message || 'Falha ao processar o arquivo PDF.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#16181D] border border-[#2D3139] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#282C34] flex items-center justify-between bg-gradient-to-r from-amber-950/40 via-[#1A1D21] to-[#16181D] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center shadow-md shadow-amber-500/10">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                Exportar Arquivo da Sessão para PDF
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-950/70 text-amber-300 border border-amber-500/40">
                  Arquivamento do Mestre
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Gere um documento formatado com histórico de mensagens, fichas de NPCs, notas e progresso completo da mesa.
              </p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            icon={<X className="w-5 h-5 text-zinc-400 hover:text-white" />}
            title="Fechar"
          />
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 flex-1 overflow-y-auto space-y-5">
          
          {/* Metadata Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1 sm:col-span-1">
              <label className="text-xs font-bold text-zinc-300">Título da Sessão</label>
              <input
                type="text"
                value={sessionTitle}
                onChange={(e) => setSessionTitle(e.target.value)}
                placeholder="Ex: Sessão 14 - O Despertar do Titã"
                className="w-full px-3 py-2 rounded-xl bg-[#141619] border border-[#2D3139] text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Nome da Campanha / Mesa</label>
              <input
                type="text"
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Ex: Crônicas de Valfenda"
                className="w-full px-3 py-2 rounded-xl bg-[#141619] border border-[#2D3139] text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-zinc-300">Narrador / Mestre</label>
              <input
                type="text"
                value={dmName}
                onChange={(e) => setDmName(e.target.value)}
                placeholder="Ex: Mestre Daniel"
                className="w-full px-3 py-2 rounded-xl bg-[#141619] border border-[#2D3139] text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#282C34] grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-2 rounded-xl bg-[#1A1D21] border border-[#2D3139]">
              <span className="text-[10px] text-zinc-400 block">Tempo Decorrido</span>
              <span className="text-sm font-extrabold text-amber-400 font-mono">
                {formatDuration(sessionSeconds) || '0:00'}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#1A1D21] border border-[#2D3139]">
              <span className="text-[10px] text-zinc-400 block">NPCs no Dossier</span>
              <span className="text-sm font-extrabold text-purple-400 font-mono">
                {npcs.length}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#1A1D21] border border-[#2D3139]">
              <span className="text-[10px] text-zinc-400 block">Mensagens no Chat</span>
              <span className="text-sm font-extrabold text-sky-400 font-mono">
                {chatMessages.length}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-[#1A1D21] border border-[#2D3139]">
              <span className="text-[10px] text-zinc-400 block">Combate / Iniciativa</span>
              <span className="text-sm font-extrabold text-rose-400 font-mono">
                {initiativeList.length} combatentes
              </span>
            </div>
          </div>

          {/* Sections to Include Checkboxes */}
          <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-3">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-400" />
              Selecione o Conteúdo do Documento PDF:
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Messages History */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A1D21] border border-[#2D3139] hover:border-amber-500/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeChat}
                  onChange={(e) => setIncludeChat(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Histórico de Mensagens do Discord</span>
                  <span className="text-[10px] text-zinc-400 block">Inclui timeline de diálogos, rolagens de dados e narrativas.</span>
                </div>
              </label>

              {/* Active NPCs */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A1D21] border border-[#2D3139] hover:border-amber-500/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeNpcs}
                  onChange={(e) => setIncludeNpcs(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Dossier de NPCs & Criaturas Ativas</span>
                  <span className="text-[10px] text-zinc-400 block">Estatísticas, CA, HP, descrições e alinhamento dos personagens.</span>
                </div>
              </label>

              {/* Session Progress & Notes */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A1D21] border border-[#2D3139] hover:border-amber-500/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeNotes}
                  onChange={(e) => setIncludeNotes(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Anotações do Mestre & Abas do Bloco</span>
                  <span className="text-[10px] text-zinc-400 block">Pistas reveladas, resumo da sessão e abas temáticas.</span>
                </div>
              </label>

              {/* Combat Tracker */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A1D21] border border-[#2D3139] hover:border-amber-500/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeCombat}
                  onChange={(e) => setIncludeCombat(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Rastreador de Iniciativa & Combate</span>
                  <span className="text-[10px] text-zinc-400 block">Ordem dos turnos, combatentes e status de HP atual.</span>
                </div>
              </label>

              {/* Action Log */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#1A1D21] border border-[#2D3139] hover:border-amber-500/40 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeActionLogs}
                  onChange={(e) => setIncludeActionLogs(e.target.checked)}
                  className="rounded text-amber-500 focus:ring-amber-500"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-white block">Log Cronológico de Ações Recentes</span>
                  <span className="text-[10px] text-zinc-400 block">Auditoria de efeitos disparados e comandos do Mestre.</span>
                </div>
              </label>

              {/* Confidential DM Secrets Toggle */}
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-950/20 border border-rose-500/30 hover:border-rose-500/60 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={includeNpcSecrets}
                  onChange={(e) => setIncludeNpcSecrets(e.target.checked)}
                  className="rounded text-rose-500 focus:ring-rose-500"
                />
                <div className="min-w-0">
                  <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-rose-400" />
                    Incluir Notas Secretas dos NPCs no PDF
                  </span>
                  <span className="text-[10px] text-zinc-400 block">Marca notas confidenciais com borda avermelhada para arquivo privado.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Feedback messages */}
          {feedback.message && (
            <div className={`p-3 rounded-xl text-xs flex items-center gap-2 border ${
              feedback.status === 'success'
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border-rose-500/40 text-rose-300'
            }`}>
              {feedback.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-[#282C34] bg-[#121417] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="text-xs text-zinc-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Formato A4 formatado • Pronto para arquivamento digital ou impressão</span>
          </div>

          <div className="flex items-center gap-2.5 w-full sm:w-auto">
            <Button
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="flex-1 sm:flex-initial"
            >
              Cancelar
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={handleExportPdf}
              disabled={isExporting}
              icon={isExporting ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Download className="w-4 h-4 text-black" />}
              className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-400 text-black font-extrabold shadow-lg shadow-amber-500/20"
            >
              {isExporting ? 'Gerando PDF...' : 'Baixar Arquivo PDF (.pdf)'}
            </Button>
          </div>
        </div>

      </div>
    </div>
  );
};

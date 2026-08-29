import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Download,
  Info,
  Radio,
  RefreshCw,
  Server,
  Trash2,
  Volume2,
  Zap,
  Check,
  Copy,
  Terminal,
  ShieldCheck,
  Play,
  RotateCcw,
  Monitor
} from 'lucide-react';
import { VoiceDiagnostics, DiagnosticLog } from '../types';
import { safeFetchJson } from '../services/api';
import {
  getDesktopLogs,
  clearDesktopLogs,
  checkBackendHealth,
  forceRestartBackend,
  getDesktopStatusInfo,
  DesktopLogEntry
} from '../services/desktopBackend';

interface DiscordDiagnosticsPanelProps {
  currentVoiceChannelId?: string;
  onRefreshBot?: () => void;
}

export const DiscordDiagnosticsPanel: React.FC<DiscordDiagnosticsPanelProps> = ({
  currentVoiceChannelId,
  onRefreshBot
}) => {
  const [diagnostics, setDiagnostics] = useState<VoiceDiagnostics | null>(null);
  const [desktopLogsList, setDesktopLogsList] = useState<DesktopLogEntry[]>([]);
  const [desktopStatus, setDesktopStatus] = useState(getDesktopStatusInfo());
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isRestartingBackend, setIsRestartingBackend] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'desktop' | 'voice' | 'bot' | 'audio'>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    try {
      setDesktopStatus(getDesktopStatusInfo());
      setDesktopLogsList(getDesktopLogs());

      const res = await safeFetchJson<{ success: boolean; diagnostics: VoiceDiagnostics }>('/api/bot/diagnostics');
      if (res.data?.diagnostics) {
        setDiagnostics(res.data.diagnostics);
      }
    } catch (err) {
      console.error('Failed to fetch bot diagnostics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();

    const handleDesktopLog = () => {
      setDesktopLogsList(getDesktopLogs());
      setDesktopStatus(getDesktopStatusInfo());
    };

    window.addEventListener('desktop-log', handleDesktopLog);
    window.addEventListener('desktop-backend-ready', handleDesktopLog);

    if (!isAutoRefresh) {
      return () => {
        window.removeEventListener('desktop-log', handleDesktopLog);
        window.removeEventListener('desktop-backend-ready', handleDesktopLog);
      };
    }

    const interval = setInterval(fetchDiagnostics, 3000);
    return () => {
      window.removeEventListener('desktop-log', handleDesktopLog);
      window.removeEventListener('desktop-backend-ready', handleDesktopLog);
      clearInterval(interval);
    };
  }, [isAutoRefresh]);

  const handleRunVoiceTest = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await safeFetchJson<{ success: boolean; diagnostics: VoiceDiagnostics; error?: string }>(
        '/api/bot/diagnostics/test',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voiceChannelId: currentVoiceChannelId })
        }
      );

      if (res.data?.diagnostics) {
        setDiagnostics(res.data.diagnostics);
      }

      if (res.data?.success) {
        setTestResult({
          success: true,
          msg: 'Pipeline de voz e motor de áudio testados com sucesso! O bot consegue codificar e transmitir pacotes Opus.'
        });
      } else {
        setTestResult({
          success: false,
          msg: res.data?.error || 'Falha no teste de voz. Verifique se o bot está conectado a um servidor e canal.'
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: err?.message || 'Erro de comunicação ao executar teste de diagnóstico.'
      });
    } finally {
      setIsTesting(false);
      if (onRefreshBot) onRefreshBot();
    }
  };

  const handlePingBackend = async () => {
    setIsLoading(true);
    const healthy = await checkBackendHealth();
    setDesktopStatus(getDesktopStatusInfo());
    setDesktopLogsList(getDesktopLogs());
    await fetchDiagnostics();
    setIsLoading(false);
    if (healthy) {
      setTestResult({
        success: true,
        msg: `Servidor local respondendo normalmente na porta 3000 (${desktopStatus.lastPingLatency}ms).`
      });
    } else {
      setTestResult({
        success: false,
        msg: 'Servidor local na porta 3000 não está respondendo. Clique em "Forçar Reinício do Motor" ou execute "Iniciar-CaranguejoRPG.bat".'
      });
    }
  };

  const handleForceRestartBackend = async () => {
    setIsRestartingBackend(true);
    try {
      const ok = await forceRestartBackend();
      setDesktopStatus(getDesktopStatusInfo());
      setDesktopLogsList(getDesktopLogs());
      await fetchDiagnostics();
      if (ok) {
        setTestResult({
          success: true,
          msg: 'Motor local reiniciado com sucesso! Porta 3000 ativa e pronta.'
        });
      } else {
        setTestResult({
          success: false,
          msg: 'Não foi possível subir o servidor local automaticamente pelo executável. Por favor, execute "Iniciar-CaranguejoRPG.bat" na pasta do aplicativo.'
        });
      }
    } finally {
      setIsRestartingBackend(false);
    }
  };

  const handleClearAllLogs = async () => {
    clearDesktopLogs();
    setDesktopLogsList([]);
    try {
      await safeFetchJson('/api/bot/diagnostics/clear-logs', { method: 'POST' });
      fetchDiagnostics();
    } catch (err) {
      console.error('Error clearing diagnostic logs:', err);
    }
  };

  // Merge server diagnostic logs with frontend/desktop logs
  const backendLogs: DiagnosticLog[] = diagnostics?.logs || [];
  const convertedDesktopLogs: DiagnosticLog[] = desktopLogsList.map(dl => ({
    id: dl.id,
    timestamp: dl.timestamp,
    source: 'desktop' as any,
    level: dl.level,
    message: dl.message,
    details: dl.details
  }));

  // Combine and sort by ID or maintain sequence
  const combinedLogs: DiagnosticLog[] = [...convertedDesktopLogs, ...backendLogs];

  const filteredLogs = combinedLogs.filter(log => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'error') return log.level === 'error' || log.level === 'warn';
    if (filterLevel === 'desktop') return (log.source as any) === 'desktop';
    if (filterLevel === 'voice') return log.source === 'voice';
    if (filterLevel === 'bot') return log.source === 'bot';
    if (filterLevel === 'audio') return log.source === 'audio';
    return true;
  });

  const errorCount = combinedLogs.filter(l => l.level === 'error').length;
  const activeEngine = diagnostics?.modules?.activeOpusEngine || (isLoading ? 'Carregando diagnóstico...' : 'Verificando motor de áudio...');
  const hasWorkingDecoder = Boolean(
    diagnostics?.modules?.opusscript?.available ||
    diagnostics?.modules?.opusDiscord?.available ||
    diagnostics?.modules?.nodeOpus?.available
  );

  const handleCopyAllLogs = () => {
    const text = combinedLogs
      .map(log => `[${log.timestamp}] [${(log.source || '').toUpperCase()}] [${(log.level || '').toUpperCase()}] ${log.message}${log.details ? '\n  ' + log.details : ''}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setIsAllCopied(true);
    setTimeout(() => setIsAllCopied(false), 2000);
  };

  const handleCopyLogItem = (log: DiagnosticLog) => {
    const text = `[${log.timestamp}] [${(log.source || '').toUpperCase()}] [${(log.level || '').toUpperCase()}] ${log.message}${log.details ? '\n' + log.details : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const handleDownloadReport = () => {
    const reportData = {
      timestamp: new Date().toISOString(),
      report: 'CaranguejoRPG - Diagnóstico Completo (Desktop + Discord Bot + Voz)',
      desktopStatus,
      diagnostics,
      desktopLogs: desktopLogsList,
      combinedLogs
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `caranguejorpg-diagnostico-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 text-xs text-[#E0E0E0]">
      {/* Header & Quick Controls */}
      <div className="p-4 bg-[#141619] rounded-2xl border border-[#2D3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[#FFFFFF] text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Diagnóstico do Executável, Servidor Local & Bot Discord
          </h4>
          <p className="text-[#9E9E9E] text-[11px] mt-0.5">
            Inspeção em tempo real da conexão na porta 3000, decodificadores Opus, FFmpeg e logs do sistema.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handlePingBackend}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#2D3139] font-medium transition-colors cursor-pointer"
            title="Testar ping no servidor local"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Testar Porta 3000</span>
          </button>

          <button
            type="button"
            onClick={handleForceRestartBackend}
            disabled={isRestartingBackend}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 font-semibold transition-colors cursor-pointer"
            title="Forçar execução do Node/Bot em segundo plano"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isRestartingBackend ? 'animate-spin' : ''}`} />
            <span>{isRestartingBackend ? 'Iniciando...' : 'Forçar Motor Local'}</span>
          </button>

          <button
            type="button"
            onClick={handleRunVoiceTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
            <span>{isTesting ? 'Testando...' : 'Testar Voz'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#2D3139] font-medium transition-colors cursor-pointer"
            title="Baixar relatório completo em JSON"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>

      {/* Test Result Toast */}
      {testResult && (
        <div
          className={`p-3 rounded-2xl border flex items-start gap-2.5 ${
            testResult.success
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-bold text-xs">{testResult.success ? 'Diagnóstico Positivo' : 'Alerta de Diagnóstico'}</p>
            <p className="text-[11px] opacity-90 mt-0.5">{testResult.msg}</p>
          </div>
          <button
            onClick={() => setTestResult(null)}
            className="text-xs opacity-60 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: 4 Diagnostic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 0: Local Server / EXE Status */}
        <div className="p-3.5 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5 text-xs">
                <Server className="w-3.5 h-3.5 text-indigo-400" />
                Servidor Local (3000)
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  desktopStatus.isHealthy
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {desktopStatus.isHealthy ? 'Online' : 'Offline'}
              </span>
            </div>

            <div className="mt-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Ambiente:</span>
                <span className="font-medium text-white truncate">
                  {desktopStatus.isDesktop ? 'Executável (.exe)' : 'Navegador Web'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Latência Ping:</span>
                <span className="font-mono text-emerald-400">
                  {desktopStatus.lastPingLatency ? `${desktopStatus.lastPingLatency}ms` : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9E9E9E]">Neutralino Native:</span>
                <span className="font-mono text-indigo-300">
                  {desktopStatus.nlPort ? `Porta ${desktopStatus.nlPort}` : (desktopStatus.neutralinoAvailable ? 'Pronto' : 'Web')}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#22262B]">
            <p className="text-[10px] text-[#9E9E9E] truncate" title={desktopStatus.nlPath || 'Executando no navegador'}>
              📁 <strong>Pasta:</strong> {desktopStatus.nlPath || 'Navegador'}
            </p>
          </div>
        </div>

        {/* Card 1: Opus Audio Decoders */}
        <div className="p-3.5 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5 text-xs">
                <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
                Decodificadores Opus
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  hasWorkingDecoder
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {hasWorkingDecoder ? 'Operacional' : 'Indisponível'}
              </span>
            </div>

            <div className="mt-2.5 space-y-1.5">
              {/* opusscript */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#0D0F12] border border-[#22262B]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${diagnostics?.modules?.opusscript?.available ? 'bg-emerald-400' : 'bg-[#6E7681]'}`} />
                  <span className="font-mono text-[11px] text-white">opusscript</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-medium">
                  {diagnostics?.modules?.opusscript?.available ? 'Portátil (Ativo)' : 'OK'}
                </span>
              </div>

              {/* @discordjs/opus */}
              <div className="flex items-center justify-between p-1.5 rounded-xl bg-[#0D0F12] border border-[#22262B]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${diagnostics?.modules?.opusDiscord?.available ? 'bg-emerald-400' : 'bg-amber-400/70'}`} />
                  <span className="font-mono text-[11px] text-white">@discordjs/opus</span>
                </div>
                <span className="text-[10px] text-[#9E9E9E]">
                  {diagnostics?.modules?.opusDiscord?.available ? 'Nativo C++' : 'Opcional'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#22262B]">
            <p className="text-[10px] text-indigo-300 leading-tight truncate">
              ⚡ <strong>Motor:</strong> {activeEngine}
            </p>
          </div>
        </div>

        {/* Card 2: Voice & Encryption */}
        <div className="p-3.5 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                Voz & Player Discord
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  diagnostics?.connection?.voiceState === 'ready'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-[#22262B] text-[#9E9E9E] border-[#2D3139]'
                }`}
              >
                {diagnostics?.connection?.voiceState || 'Desconectado'}
              </span>
            </div>

            <div className="mt-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Canal de Voz:</span>
                <span className="font-medium text-white truncate max-w-[120px]">
                  {diagnostics?.connection?.voiceChannelName || 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Servidor:</span>
                <span className="font-medium text-white truncate max-w-[120px]">
                  {diagnostics?.connection?.guildName || 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9E9E9E]">Latência Gateway:</span>
                <span className="font-mono text-emerald-400">
                  {typeof diagnostics?.connection?.botPing === 'number' ? `${diagnostics.connection.botPing}ms` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#22262B] flex items-center justify-between text-[10px] text-[#9E9E9E]">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              TweetNaCl
            </span>
            <span className="text-emerald-400 font-bold">Ativa</span>
          </div>
        </div>

        {/* Card 3: FFmpeg & Host */}
        <div className="p-3.5 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                FFmpeg & Host
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  diagnostics?.modules?.ffmpeg?.available
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}
              >
                {diagnostics?.modules?.ffmpeg?.available ? 'FFmpeg Pronto' : 'FFmpeg Integrado'}
              </span>
            </div>

            <div className="mt-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Node.js:</span>
                <span className="font-mono text-white">{diagnostics?.environment?.nodeVersion || 'v20+'}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Plataforma:</span>
                <span className="font-mono text-white">
                  {diagnostics?.environment?.platform || 'desktop'} ({diagnostics?.environment?.arch || 'x64'})
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9E9E9E]">Memória:</span>
                <span className="font-mono text-indigo-300">
                  {diagnostics?.environment?.memoryUsageMB ? `${diagnostics.environment.memoryUsageMB} MB` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#22262B]">
            <p className="text-[10px] text-[#9E9E9E] truncate" title={diagnostics?.modules?.ffmpeg?.path || 'Automático'}>
              📁 <strong>FFmpeg:</strong> {diagnostics?.modules?.ffmpeg?.path || 'Integrado'}
            </p>
          </div>
        </div>
      </div>

      {/* Helpful Audio Tip Banner */}
      <div className="p-3 bg-indigo-950/20 rounded-2xl border border-indigo-500/30 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-indigo-200/90 leading-relaxed">
          <strong>Diagnóstico Unificado:</strong> Este console monitora todas as etapas: inicialização do processo local (porta 3000), autenticação do token do Discord Gateway, carregamento dos codecs de áudio (<strong className="text-emerald-300">opusscript/tweetnacl</strong>) e conexões de voz.
        </div>
      </div>

      {/* Real-time Diagnostics Terminal & Logs */}
      <div className="p-4 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h5 className="font-bold text-[#FFFFFF] text-xs flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-400" />
              Terminal de Eventos & Logs ({filteredLogs.length})
            </h5>
            {errorCount > 0 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                {errorCount} {errorCount === 1 ? 'erro' : 'erros'}
              </span>
            )}
          </div>

          {/* Filter Chips & Actions */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex items-center bg-[#0D0F12] p-0.5 rounded-xl border border-[#2D3139]">
              {(['all', 'error', 'desktop', 'bot', 'voice', 'audio'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterLevel(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                    filterLevel === f
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#9E9E9E] hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todos' : f === 'error' ? 'Erros' : f === 'desktop' ? 'Porta 3000' : f === 'voice' ? 'Voz' : f === 'audio' ? 'Áudio' : 'Bot'}
                </button>
              ))}
            </div>

            <button
              onClick={handleCopyAllLogs}
              className="flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#2D3139] text-[10px] font-medium transition-colors cursor-pointer"
              title="Copiar todos os logs"
            >
              {isAllCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{isAllCopied ? 'Copiado!' : 'Copiar Tudo'}</span>
            </button>

            <button
              onClick={handleClearAllLogs}
              className="p-1.5 rounded-xl bg-[#242830] hover:bg-rose-950/40 hover:text-rose-300 text-[#9E9E9E] border border-[#2D3139] transition-colors cursor-pointer"
              title="Limpar todos os logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Viewer Window */}
        <div className="bg-[#0A0C0E] border border-[#22262B] rounded-xl p-3 font-mono text-[11px] max-h-[360px] overflow-y-auto space-y-1.5">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-[#6E7681]">
              <p>Nenhum log registrado para o filtro selecionado.</p>
              <p className="text-[10px] mt-1">Conecte o bot ou clique em "Testar Porta 3000" para registrar novos eventos.</p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const isExpanded = expandedLogId === log.id;
              return (
                <div
                  key={log.id}
                  className={`p-2 rounded-lg border transition-all ${
                    log.level === 'error'
                      ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                      : log.level === 'warn'
                      ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                      : log.level === 'success'
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-[#121519] border-[#22262B] text-[#D0D7DE]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <span className="text-[#6E7681] text-[10px] select-none shrink-0 pt-0.5">
                        {log.timestamp}
                      </span>

                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-bold uppercase shrink-0 border ${
                          log.level === 'error'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : log.level === 'warn'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : log.level === 'success'
                            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                            : (log.source as any) === 'desktop'
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                        }`}
                      >
                        {log.source}
                      </span>

                      <span className="text-[11px] font-sans break-words">{log.message}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {log.details && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-[#1C2026] text-indigo-300 hover:bg-[#252A33] cursor-pointer"
                        >
                          {isExpanded ? 'Ocultar' : 'Detalhes'}
                        </button>
                      )}
                      <button
                        onClick={() => handleCopyLogItem(log)}
                        className="text-[#6E7681] hover:text-white p-0.5 cursor-pointer"
                        title="Copiar linha"
                      >
                        {copiedLogId === log.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  {log.details && isExpanded && (
                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#A0AEC0] whitespace-pre-wrap break-all bg-[#08090A] p-2 rounded font-mono">
                      {log.details}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

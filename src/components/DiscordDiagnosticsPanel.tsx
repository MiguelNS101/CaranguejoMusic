import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Cpu,
  Download,
  Info,
  Layers,
  Radio,
  RefreshCw,
  Server,
  Trash2,
  Volume2,
  Wifi,
  Zap,
  Check,
  Copy,
  Terminal,
  ShieldCheck
} from 'lucide-react';
import { VoiceDiagnostics, DiagnosticLog } from '../types';
import { safeFetchJson } from '../services/api';

interface DiscordDiagnosticsPanelProps {
  currentVoiceChannelId?: string;
  onRefreshBot?: () => void;
}

export const DiscordDiagnosticsPanel: React.FC<DiscordDiagnosticsPanelProps> = ({
  currentVoiceChannelId,
  onRefreshBot
}) => {
  const [diagnostics, setDiagnostics] = useState<VoiceDiagnostics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [filterLevel, setFilterLevel] = useState<'all' | 'error' | 'voice' | 'bot' | 'audio'>('all');
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const fetchDiagnostics = async () => {
    try {
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
    if (!isAutoRefresh) return;
    const interval = setInterval(fetchDiagnostics, 3000);
    return () => clearInterval(interval);
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

  const handleClearLogs = async () => {
    try {
      await safeFetchJson('/api/bot/diagnostics/clear-logs', { method: 'POST' });
      fetchDiagnostics();
    } catch (err) {
      console.error('Error clearing diagnostic logs:', err);
    }
  };

  const handleDownloadReport = () => {
    if (!diagnostics) return;
    const reportData = {
      timestamp: new Date().toISOString(),
      report: 'CaranguejoRPG - Diagnóstico de Voz e Bot Discord',
      diagnostics
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

  const handleCopyLogItem = (log: DiagnosticLog) => {
    const text = `[${log.timestamp}] [${log.source.toUpperCase()}] [${log.level.toUpperCase()}] ${log.message}${log.details ? '\n' + log.details : ''}`;
    navigator.clipboard.writeText(text);
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const logs = diagnostics?.logs || [];
  const filteredLogs = logs.filter(log => {
    if (filterLevel === 'all') return true;
    if (filterLevel === 'error') return log.level === 'error' || log.level === 'warn';
    if (filterLevel === 'voice') return log.source === 'voice';
    if (filterLevel === 'bot') return log.source === 'bot';
    if (filterLevel === 'audio') return log.source === 'audio';
    return true;
  });

  const errorCount = logs.filter(l => l.level === 'error').length;
  const activeEngine = diagnostics?.modules?.activeOpusEngine || (isLoading ? 'Carregando diagnóstico...' : 'Verificando motor de áudio...');
  const hasWorkingDecoder = Boolean(
    diagnostics?.modules?.opusscript?.available ||
    diagnostics?.modules?.opusDiscord?.available ||
    diagnostics?.modules?.nodeOpus?.available
  );

  return (
    <div className="space-y-4 text-xs text-[#E0E0E0]">
      {/* Header & Quick Controls */}
      <div className="p-4 bg-[#141619] rounded-2xl border border-[#2D3139] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h4 className="font-bold text-[#FFFFFF] text-sm flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            Diagnóstico do Motor de Áudio & Logs Discord
          </h4>
          <p className="text-[#9E9E9E] text-[11px] mt-0.5">
            Inspeção em tempo real dos decodificadores Opus, FFmpeg e estado da conexão de voz.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={fetchDiagnostics}
            disabled={isLoading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#242830] hover:bg-[#2D3139] text-[#E0E0E0] border border-[#2D3139] font-medium transition-colors cursor-pointer"
            title="Atualizar dados"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            <span>Atualizar</span>
          </button>

          <button
            type="button"
            onClick={handleRunVoiceTest}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold transition-colors cursor-pointer shadow-sm"
          >
            <Zap className={`w-3.5 h-3.5 ${isTesting ? 'animate-bounce' : ''}`} />
            <span>{isTesting ? 'Testando Pipeline...' : 'Testar Voz'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadReport}
            disabled={!diagnostics}
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
            <p className="font-bold text-xs">{testResult.success ? 'Teste de Áudio Aprovado' : 'Problema Detectado'}</p>
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

      {/* Grid: Decoders & Environment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D0F12] border border-[#22262B]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${diagnostics?.modules?.opusscript?.available ? 'bg-emerald-400' : 'bg-[#6E7681]'}`} />
                  <span className="font-mono text-[11px] text-white">opusscript</span>
                </div>
                <span className="text-[10px] text-emerald-300 font-medium">
                  {diagnostics?.modules?.opusscript?.available ? 'Portátil (Ativo)' : 'Não instalado'}
                </span>
              </div>

              {/* @discordjs/opus */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D0F12] border border-[#22262B]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${diagnostics?.modules?.opusDiscord?.available ? 'bg-emerald-400' : 'bg-amber-400/70'}`} />
                  <span className="font-mono text-[11px] text-white">@discordjs/opus</span>
                </div>
                <span className="text-[10px] text-[#9E9E9E]">
                  {diagnostics?.modules?.opusDiscord?.available ? 'Nativo C++' : 'Opcional'}
                </span>
              </div>

              {/* node-opus */}
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#0D0F12] border border-[#22262B]">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${diagnostics?.modules?.nodeOpus?.available ? 'bg-emerald-400' : 'bg-neutral-600'}`} />
                  <span className="font-mono text-[11px] text-white">node-opus</span>
                </div>
                <span className="text-[10px] text-[#9E9E9E]">
                  {diagnostics?.modules?.nodeOpus?.available ? 'Nativo C++' : 'Opcional'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#22262B]">
            <p className="text-[10px] text-indigo-300 leading-tight">
              ⚡ <strong>Motor Ativo:</strong> {activeEngine}
            </p>
          </div>
        </div>

        {/* Card 2: Voice & Encryption */}
        <div className="p-3.5 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5 text-xs">
                <Radio className="w-3.5 h-3.5 text-indigo-400" />
                Conexão de Voz & Player
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
                <span className="font-medium text-white truncate max-w-[140px]">
                  {diagnostics?.connection?.voiceChannelName || 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Servidor:</span>
                <span className="font-medium text-white truncate max-w-[140px]">
                  {diagnostics?.connection?.guildName || 'Nenhum'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Status do Player:</span>
                <span className="font-medium text-indigo-300">
                  {diagnostics?.connection?.playerState || 'Ocioso'}
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
              TweetNaCl / Libsodium
            </span>
            <span className="text-emerald-400 font-bold">Ativa</span>
          </div>
        </div>

        {/* Card 3: FFmpeg & System Host */}
        <div className="p-3.5 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-2.5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-[#FFFFFF] flex items-center gap-1.5 text-xs">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                FFmpeg & Ambiente
              </span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                  diagnostics?.modules?.ffmpeg?.available
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                }`}
              >
                {diagnostics?.modules?.ffmpeg?.available ? 'FFmpeg Pronto' : 'FFmpeg Verificado'}
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
              <div className="flex justify-between py-1 border-b border-[#22262B]">
                <span className="text-[#9E9E9E]">Memória RSS:</span>
                <span className="font-mono text-indigo-300">
                  {diagnostics?.environment?.memoryUsageMB ? `${diagnostics.environment.memoryUsageMB} MB` : '--'}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-[#9E9E9E]">Uptime:</span>
                <span className="font-mono text-white">
                  {diagnostics?.environment?.uptime !== undefined ? `${Math.floor(diagnostics.environment.uptime / 60)} min` : '--'}
                </span>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-[#22262B]">
            <p className="text-[10px] text-[#9E9E9E] truncate" title={diagnostics?.modules?.ffmpeg?.path || 'Nativo / Sistema'}>
              📁 <strong>FFmpeg:</strong> {diagnostics?.modules?.ffmpeg?.path || 'Automático (fluent-ffmpeg)'}
            </p>
          </div>
        </div>
      </div>

      {/* Helpful Audio Tip Banner */}
      <div className="p-3 bg-indigo-950/20 rounded-2xl border border-indigo-500/30 flex items-start gap-2.5">
        <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
        <div className="text-[11px] text-indigo-200/90 leading-relaxed">
          <strong>Sobre o aviso de decodificador Opus:</strong> O Discord requer uma biblioteca para codificar voz. Caso o módulo C++ nativo (<code className="text-white">@discordjs/opus</code>) não seja encontrado devido à falta de compilador no Windows, o CaranguejoRPG utiliza o <strong className="text-emerald-300">opusscript (WebAssembly/JS)</strong> de forma 100% autônoma e portátil. Suas músicas e soundboards continuarão tocando normalmente na sala de voz.
        </div>
      </div>

      {/* Real-time Diagnostics Terminal & Logs */}
      <div className="p-4 bg-[#141619] rounded-2xl border border-[#2D3139] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
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
              {(['all', 'error', 'voice', 'audio', 'bot'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilterLevel(f)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all cursor-pointer ${
                    filterLevel === f
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#9E9E9E] hover:text-white'
                  }`}
                >
                  {f === 'all' ? 'Todos' : f === 'error' ? 'Erros' : f === 'voice' ? 'Voz' : f === 'audio' ? 'Áudio' : 'Bot'}
                </button>
              ))}
            </div>

            <button
              onClick={handleClearLogs}
              className="p-1.5 rounded-xl bg-[#242830] hover:bg-rose-950/40 hover:text-rose-300 text-[#9E9E9E] border border-[#2D3139] transition-colors cursor-pointer"
              title="Limpar logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Viewer Window */}
        <div className="bg-[#0A0C0E] border border-[#22262B] rounded-xl p-3 font-mono text-[11px] max-h-[320px] overflow-y-auto space-y-1.5">
          {filteredLogs.length === 0 ? (
            <div className="py-8 text-center text-[#6E7681]">
              <p>Nenhum log registrado para este filtro.</p>
              <p className="text-[10px] mt-1">Conecte o bot ou reproduza um áudio para gerar novos eventos.</p>
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
                    <div className="mt-2 pt-2 border-t border-white/10 text-[10px] text-[#A0AEC0] whitespace-pre-wrap break-all bg-[#08090A] p-2 rounded">
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

import React, { useState } from 'react';
import {
  Play,
  Pause,
  Square,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Dices,
  Shield,
  Skull,
  UserCheck,
  Eye,
  EyeOff,
  Flame,
  Plus,
  Trash2,
  RefreshCw,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  ListMusic,
  HardDrive,
  FolderDown,
  LayoutGrid,
  Zap,
  Swords,
  ChevronRight,
  FlameKindling,
  Headphones,
  Radio,
  Megaphone
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { useAudio } from '../context/AudioContext';
import { NPC, SoundboardItem, DiceRollResult, WodDiceRollResult } from '../types';

interface MasterScreenProps {
  onOpenMusicTab: () => void;
  onOpenSoundboardTab: () => void;
  onOpenNpcTab: () => void;
  onOpenChatTab: () => void;
  onOpenSessionModal: () => void;
}

export const MasterScreen: React.FC<MasterScreenProps> = ({
  onOpenMusicTab,
  onOpenSoundboardTab,
  onOpenNpcTab,
  onOpenChatTab,
  onOpenSessionModal
}) => {
  const {
    currentTrack,
    playbackState,
    currentTime,
    duration,
    togglePlayPause,
    stopTrack,
    isLocalAudioEnabled,
    toggleLocalAudio,
    skipNext,
    skipPrevious,
    seek,
    queue,
    soundboardItems,
    playSoundboard,
    activeSfxIds,
    npcs,
    postNpcToDiscord,
    botStatus,
    sessionNotes,
    saveNotes,
    soundboardLayouts,
    activeLayoutId,
    setActiveLayoutId,
    savedSessions,
    wodRolls,
    rollWodDiceAction,
    announceInitiativeTurn
  } = useAudio();

  // Narrative message state
  const [narrativeText, setNarrativeText] = useState('');
  const [isSendingNarrative, setIsSendingNarrative] = useState(false);
  const [narrativeFeedback, setNarrativeFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Dice System Tab: 'standard' | 'wod'
  const [diceSystem, setDiceSystem] = useState<'standard' | 'wod'>('wod');

  // Standard Dice Roller State
  const [diceSides, setDiceSides] = useState<number>(20);
  const [diceCount, setDiceCount] = useState<number>(1);
  const [diceModifier, setDiceModifier] = useState<number>(0);
  const [diceLabel, setDiceLabel] = useState<string>('');
  const [broadcastDice, setBroadcastDice] = useState<boolean>(true);
  const [lastRoll, setLastRoll] = useState<DiceRollResult | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [rollHistory, setRollHistory] = useState<DiceRollResult[]>([]);

  // World of Darkness (WoD) Roller State
  const [wodDiceCount, setWodDiceCount] = useState<number>(6);
  const [wodIsKeen, setWodIsKeen] = useState<boolean>(false);
  const [wodLabel, setWodLabel] = useState<string>('');
  const [lastWodRoll, setLastWodRoll] = useState<WodDiceRollResult | null>(null);
  const [isWodRolling, setIsWodRolling] = useState<boolean>(false);

  // NPC Secret Notes Toggle
  const [revealedNpcSecrets, setRevealedNpcSecrets] = useState<Record<string, boolean>>({});
  const [postingNpcId, setPostingNpcId] = useState<string | null>(null);

  // Initiative Tracker State
  const [initiativeList, setInitiativeList] = useState<Array<{ id: string; name: string; init: number; hp: number; maxHp: number; isNpc: boolean }>>([
    { id: 'init-1', name: 'Guerreiro (Thoran)', init: 19, hp: 45, maxHp: 45, isNpc: false },
    { id: 'init-2', name: 'Lorde Malakor', init: 16, hp: 145, maxHp: 145, isNpc: true },
    { id: 'init-3', name: 'Maga (Lyra)', init: 14, hp: 28, maxHp: 28, isNpc: false },
    { id: 'init-4', name: 'Goblin Espião', init: 11, hp: 12, maxHp: 12, isNpc: true },
  ]);
  const [activeTurnIdx, setActiveTurnIdx] = useState<number>(0);
  const [newCombatantName, setNewCombatantName] = useState('');
  const [newCombatantInit, setNewCombatantInit] = useState('');
  const [autoAnnounceTurn, setAutoAnnounceTurn] = useState<boolean>(false);
  const [isAnnouncingTurn, setIsAnnouncingTurn] = useState<boolean>(false);
  const [turnAnnouncementFeedback, setTurnAnnouncementFeedback] = useState<string | null>(null);
  const [combatRound, setCombatRound] = useState<number>(1);

  // Active Soundboard Layout
  const activeLayout = soundboardLayouts.find(l => l.id === activeLayoutId) || soundboardLayouts[0];

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Quick Send Narrative
  const handleSendNarrative = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narrativeText.trim()) return;

    setIsSendingNarrative(true);
    setNarrativeFeedback({ status: 'idle' });

    try {
      const res = await fetch('/api/bot/send-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: narrativeText.trim(),
          type: 'narrative'
        })
      });
      const data = await res.json();
      if (data.success) {
        setNarrativeFeedback({ status: 'success', msg: 'Narração enviada ao Discord!' });
        setNarrativeText('');
        setTimeout(() => setNarrativeFeedback({ status: 'idle' }), 3000);
      } else {
        setNarrativeFeedback({ status: 'error', msg: data.error || 'Falha ao enviar ao Discord.' });
      }
    } catch (err: any) {
      setNarrativeFeedback({ status: 'error', msg: err?.message || 'Erro de conexão' });
    } finally {
      setIsSendingNarrative(false);
    }
  };

  // Roll Standard RPG Dice Action
  const handleRollDice = async (customSides?: number, customCount?: number) => {
    const sides = customSides !== undefined ? customSides : diceSides;
    const count = customCount !== undefined ? customCount : diceCount;
    setIsRolling(true);

    const notation = `${count}d${sides}${diceModifier > 0 ? `+${diceModifier}` : diceModifier < 0 ? `${diceModifier}` : ''}`;

    try {
      const res = await fetch('/api/bot/roll-dice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          notation,
          label: diceLabel || undefined,
          broadcastToDiscord: broadcastDice
        })
      });

      const data = await res.json();
      if (data.roll) {
        setLastRoll(data.roll);
        setRollHistory(prev => [data.roll, ...prev.slice(0, 7)]);

        if (data.roll.isCriticalSuccess) {
          confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error('Error rolling dice:', err);
    } finally {
      setIsRolling(false);
    }
  };

  // Roll World of Darkness (WoD) Storyteller Action
  const handleRollWod = async () => {
    setIsWodRolling(true);
    try {
      const result = await rollWodDiceAction(
        wodDiceCount,
        wodIsKeen,
        'Mestre',
        wodLabel.trim() || undefined,
        broadcastDice
      );

      if (result) {
        setLastWodRoll(result);
        if (result.totalSuccesses >= 5 || result.totalCriticalHits >= 2) {
          confetti({ particleCount: 80, spread: 75, origin: { y: 0.6 } });
        }
      }
    } catch (err) {
      console.error('Error rolling WoD dice:', err);
    } finally {
      setIsWodRolling(false);
    }
  };

  // Post NPC to Discord
  const handlePostNpc = async (npc: NPC) => {
    setPostingNpcId(npc.id);
    const res = await postNpcToDiscord(npc.id);
    setPostingNpcId(null);
    if (res.success) {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.8 } });
    }
  };

  const toggleNpcSecret = (id: string) => {
    setRevealedNpcSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Initiative Actions
  const handleAnnounceTurn = async (combatantToAnnounce?: { name: string; init: number; isNpc: boolean }, targetRound?: number) => {
    const currentCombatant = combatantToAnnounce || initiativeList[activeTurnIdx];
    if (!currentCombatant) return;

    setIsAnnouncingTurn(true);
    setTurnAnnouncementFeedback(null);

    const round = targetRound ?? combatRound;
    const res = await announceInitiativeTurn(currentCombatant.name, currentCombatant.init, currentCombatant.isNpc, round);
    setIsAnnouncingTurn(false);

    if (res.success) {
      setTurnAnnouncementFeedback(`⚔️ Turno de "${currentCombatant.name}" anunciado no Discord!`);
      confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
      setTimeout(() => setTurnAnnouncementFeedback(null), 3500);
    } else {
      setTurnAnnouncementFeedback(`❌ Falha ao anunciar: ${res.error || 'Verifique o bot'}`);
      setTimeout(() => setTurnAnnouncementFeedback(null), 4000);
    }
  };

  const handleAddCombatant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCombatantName.trim()) return;

    // Check if matching an existing NPC to grab default HP / isNpc
    const matchedNpc = npcs.find(n => n.name.toLowerCase() === newCombatantName.trim().toLowerCase());
    const parsedInit = parseInt(newCombatantInit, 10) || Math.floor(Math.random() * 20) + 1;
    
    const item = {
      id: `init-${Date.now()}`,
      name: newCombatantName.trim(),
      init: parsedInit,
      hp: matchedNpc ? (matchedNpc.hp || 25) : 25,
      maxHp: matchedNpc ? (matchedNpc.maxHp || matchedNpc.hp || 25) : 25,
      isNpc: !!matchedNpc || true
    };

    const newList = [...initiativeList, item].sort((a, b) => b.init - a.init);
    setInitiativeList(newList);
    setNewCombatantName('');
    setNewCombatantInit('');
  };

  const handleNextTurn = () => {
    if (initiativeList.length === 0) return;
    const nextIdx = (activeTurnIdx + 1) % initiativeList.length;
    let nextRound = combatRound;
    if (nextIdx === 0) {
      nextRound = combatRound + 1;
      setCombatRound(nextRound);
    }
    setActiveTurnIdx(nextIdx);

    if (autoAnnounceTurn) {
      handleAnnounceTurn(initiativeList[nextIdx], nextRound);
    }
  };

  const handleRemoveCombatant = (id: string) => {
    setInitiativeList(prev => prev.filter(i => i.id !== id));
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Session Quick Bar */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl px-5 py-3 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-2 rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
            <HardDrive className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Sessão da Mesa & Backup Local</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 font-mono border border-emerald-500/30">
                {savedSessions.length} Save(s) Armazenados
              </span>
            </div>
            <p className="text-[11px] text-[#9E9E9E]">
              O estado da mesa (fila, layout de som, NPCs e notas) é salvo na pasta <code className="text-indigo-300 font-mono">data/saves/</code>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={onOpenSessionModal}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <FolderDown className="w-3.5 h-3.5" />
            Gerenciar Saves da Mesa
          </button>
        </div>
      </div>

      {/* Top Banner: Quick Now-Playing Bar */}
      <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-4 md:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center gap-3.5 w-full lg:w-auto">
            <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-[#141619] shrink-0 border border-[#2D3139]">
              {currentTrack?.coverUrl ? (
                <img
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#141619] text-indigo-400">
                  <Flame className="w-6 h-6" />
                </div>
              )}
              {playbackState === 'playing' && (
                <div className="absolute inset-0 bg-indigo-500/20 backdrop-blur-[1px] flex items-center justify-center">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400 animate-ping" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/15 px-2 py-0.5 rounded border border-indigo-500/30">
                  {playbackState === 'playing' ? 'Tocando Agora' : 'Pausado / Parado'}
                </span>
                {botStatus.isOnline ? (
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-400" />
                    Transmitindo no Discord Bot
                  </span>
                ) : (
                  <span className="text-[10px] text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/20">
                    Discord Offline (Configure Bot)
                  </span>
                )}

                {/* Local Audio Indicator / Toggle */}
                <button
                  type="button"
                  onClick={toggleLocalAudio}
                  className={`text-[10px] px-2 py-0.5 rounded border flex items-center gap-1 transition-all cursor-pointer ${
                    isLocalAudioEnabled
                      ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 hover:bg-purple-900/60'
                      : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white hover:border-[#4B5263]'
                  }`}
                  title={isLocalAudioEnabled ? 'Clique para silenciar áudio local do navegador (som continuará no Discord)' : 'Clique para ouvir preview do áudio também neste navegador'}
                >
                  <Headphones className="w-3 h-3" />
                  {isLocalAudioEnabled ? 'Ouvindo no Navegador (ON)' : 'Somente no Discord (Local OFF)'}
                </button>
              </div>

              <h3 className="text-sm md:text-base font-bold text-[#FFFFFF] truncate mt-1">
                {currentTrack?.title || 'Nenhuma música selecionada'}
              </h3>
              <p className="text-xs text-[#9E9E9E] truncate">
                {currentTrack?.artist || 'Bardos & Trilha de RPG'}
              </p>
            </div>
          </div>

          {/* Quick Playback Controls */}
          <div className="flex flex-col items-center gap-2 w-full lg:w-96">
            <div className="flex items-center gap-2.5">
              <button
                onClick={skipPrevious}
                className="p-2 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                title="Música Anterior"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              {/* Play / Pause Toggle Button */}
              <button
                id="master-play-pause-btn"
                onClick={togglePlayPause}
                className="w-11 h-11 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                title={playbackState === 'playing' ? 'Pausar / Parar Música' : 'Tocar Música'}
              >
                {playbackState === 'playing' ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current translate-x-0.5" />
                )}
              </button>

              {/* Stop Button */}
              <button
                onClick={stopTrack}
                className="p-2 text-[#9E9E9E] hover:text-rose-400 hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                title="Parar Música Completamente"
              >
                <Square className="w-4 h-4" />
              </button>

              <button
                onClick={skipNext}
                className="p-2 text-[#9E9E9E] hover:text-[#FFFFFF] hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                title="Próxima Música"
              >
                <SkipForward className="w-4 h-4" />
              </button>

              <button
                onClick={onOpenMusicTab}
                className="ml-2 text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
              >
                Player →
              </button>
            </div>

            {/* Time scrubber */}
            <div className="w-full flex items-center gap-2 text-[11px] font-mono text-[#9E9E9E]">
              <span>{formatTime(currentTime)}</span>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-[#2D3139] rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Fila & Link */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
            <button
              onClick={onOpenMusicTab}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#141619] hover:bg-[#22262B] text-xs font-semibold text-[#E0E0E0] border border-[#2D3139] transition-colors shadow-sm cursor-pointer"
            >
              <ListMusic className="w-4 h-4 text-indigo-400" />
              Fila ({queue.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Escudo do Mestre Tools */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Quick Soundboard + Quick Narrative Sender (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Quick Soundboard Layout Display */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Soundboard do Mestre: {activeLayout?.name || 'Geral'}
                </h2>
              </div>

              <div className="flex items-center gap-2">
                {/* Layout Selector Pill Buttons */}
                <div className="hidden sm:flex items-center gap-1">
                  {soundboardLayouts.slice(0, 3).map((l) => (
                    <button
                      key={l.id}
                      onClick={() => setActiveLayoutId(l.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                        l.id === activeLayoutId
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-[#141619] text-[#9E9E9E] hover:text-white border border-[#2D3139]'
                      }`}
                    >
                      {l.name}
                    </button>
                  ))}
                </div>

                <button
                  onClick={onOpenSoundboardTab}
                  className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
                >
                  Personalizar Layouts →
                </button>
              </div>
            </div>

            {/* Active Layout Buttons or Fallback */}
            {activeLayout && activeLayout.buttons && activeLayout.buttons.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {activeLayout.buttons.slice(0, 8).map((btn) => {
                  const sfx = soundboardItems.find(s => s.id === btn.itemId);
                  if (!sfx) return null;
                  const isActive = activeSfxIds.includes(sfx.id);

                  return (
                    <button
                      key={btn.id}
                      onClick={() => playSoundboard(sfx)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all relative overflow-hidden group cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/30 border-indigo-500 shadow-md shadow-indigo-500/20 scale-[0.98]'
                          : 'bg-[#141619] border-[#2D3139] hover:border-[#4A5060] hover:bg-[#1E2228]'
                      }`}
                    >
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                        {sfx.emoji || '🔊'}
                      </span>
                      <span className="text-xs font-semibold text-[#E0E0E0] truncate w-full">
                        {btn.customName || sfx.name}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {soundboardItems.slice(0, 8).map((sfx) => {
                  const isActive = activeSfxIds.includes(sfx.id);
                  return (
                    <button
                      key={sfx.id}
                      onClick={() => playSoundboard(sfx)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all relative overflow-hidden group cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600/30 border-indigo-500 shadow-md shadow-indigo-500/20 scale-[0.98]'
                          : 'bg-[#141619] border-[#2D3139] hover:border-[#4A5060] hover:bg-[#1E2228]'
                      }`}
                    >
                      <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                        {sfx.emoji || '🔊'}
                      </span>
                      <span className="text-xs font-semibold text-[#E0E0E0] truncate w-full">
                        {sfx.name}
                      </span>
                      {isActive && (
                        <span className="absolute bottom-1 right-1 w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Narrative Dispatcher to Discord */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Narração Direta para o Chat do Discord
                </h2>
              </div>
              <span className="text-[11px] text-[#9E9E9E]">
                {botStatus.isOnline ? 'Envia com formatação de pergaminho' : 'Modo local (conecte o bot)'}
              </span>
            </div>

            <form onSubmit={handleSendNarrative} className="space-y-3">
              <textarea
                value={narrativeText}
                onChange={(e) => setNarrativeText(e.target.value)}
                placeholder="Escreva a cena... Ex: 'O chão da masmorra treme sob seus pés quando a pesada porta de ferro range se abrindo sozinha...'"
                rows={3}
                className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3.5 py-2.5 text-sm text-[#E0E0E0] placeholder:text-[#6E7681] focus:outline-none focus:border-indigo-500/70 resize-none transition-colors"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {narrativeFeedback.status === 'success' && (
                    <span className="flex items-center gap-1 text-xs text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {narrativeFeedback.msg}
                    </span>
                  )}
                  {narrativeFeedback.status === 'error' && (
                    <span className="flex items-center gap-1 text-xs text-rose-400">
                      <AlertCircle className="w-3.5 h-3.5" />
                      {narrativeFeedback.msg}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onOpenChatTab}
                    className="text-xs text-[#9E9E9E] hover:text-[#FFFFFF] px-3 py-2 rounded-xl hover:bg-[#22262B] transition-colors font-medium"
                  >
                    Construtor Completo
                  </button>
                  <button
                    type="submit"
                    disabled={isSendingNarrative || !narrativeText.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-sm shadow-indigo-600/30 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSendingNarrative ? 'Enviando...' : 'Narrar no Discord'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Quick NPC Spotlight & 1-Click Discord Share */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  NPCs em Destaque & Envio 1-Clique
                </h2>
              </div>
              <button
                onClick={onOpenNpcTab}
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-semibold"
              >
                Catálogo Completo ({npcs.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {npcs.slice(0, 2).map((npc) => {
                const isRevealed = !!revealedNpcSecrets[npc.id];
                const isPosting = postingNpcId === npc.id;

                return (
                  <div
                    key={npc.id}
                    className="bg-[#141619] border border-[#2D3139] rounded-xl p-3.5 flex flex-col justify-between hover:border-[#363B44] transition-colors group shadow-sm"
                  >
                    <div>
                      <div className="flex items-start gap-3 mb-2.5">
                        <img
                          src={npc.imageUrl}
                          alt={npc.name}
                          className="w-14 h-14 rounded-lg object-cover border border-[#2D3139] shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#FFFFFF] truncate group-hover:text-indigo-300 transition-colors">
                            {npc.name}
                          </h4>
                          <p className="text-[11px] text-[#9E9E9E] truncate">
                            {npc.title || `${npc.race || 'Criatura'} • ${npc.classOrType || 'Especial'}`}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {npc.ac && (
                              <span className="text-[10px] bg-[#22262B] text-[#E0E0E0] px-1.5 py-0.5 rounded font-mono border border-[#2D3139]">
                                CA {npc.ac}
                              </span>
                            )}
                            {npc.hp && (
                              <span className="text-[10px] bg-rose-950/50 text-rose-300 border border-rose-800/40 px-1.5 py-0.5 rounded font-mono">
                                PV {npc.hp}
                              </span>
                            )}
                            {npc.cr && (
                              <span className="text-[10px] bg-indigo-950/50 text-indigo-300 border border-indigo-800/40 px-1.5 py-0.5 rounded font-mono">
                                {npc.cr}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-xs text-[#9E9E9E] line-clamp-2 italic mb-2">
                        "{npc.quote || npc.description}"
                      </p>

                      {/* DM Secret Notes */}
                      {npc.secretDmNotes && (
                        <div className="mb-2">
                          <button
                            type="button"
                            onClick={() => toggleNpcSecret(npc.id)}
                            className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                          >
                            {isRevealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isRevealed ? 'Ocultar Segredos do Mestre' : 'Ver Segredos do Mestre'}
                          </button>
                          {isRevealed && (
                            <div className="mt-1.5 p-2 bg-indigo-950/30 border border-indigo-500/30 rounded-lg text-[11px] text-indigo-200">
                              🔒 <strong>Nota Secreta:</strong> {npc.secretDmNotes}
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 1-Click Discord Share Button */}
                    <button
                      onClick={() => handlePostNpc(npc)}
                      disabled={isPosting}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs transition-colors shadow-sm shadow-indigo-600/20 cursor-pointer"
                      title="Posta o retrato, lore e status deste NPC no chat do Discord"
                    >
                      <Send className="w-3 h-3" />
                      {isPosting ? 'Enviando ao Discord...' : '1-Clique: Postar NPC no Discord'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column: Dice Roller (WoD + D&D) & Initiative Tracker (5 cols) */}
        <div className="lg:col-span-5 space-y-6">

          {/* RPG Dice Roller with WoD (Mundo das Trevas) Engine */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg space-y-4">
            {/* Header & System Switcher */}
            <div className="flex items-center justify-between border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <Dices className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Rolador de Dados
                </h2>
              </div>

              {/* System selector */}
              <div className="flex items-center gap-1 bg-[#141619] p-1 rounded-xl border border-[#2D3139]">
                <button
                  onClick={() => setDiceSystem('wod')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    diceSystem === 'wod'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#9E9E9E] hover:text-white'
                  }`}
                >
                  Mundo das Trevas (WoD)
                </button>
                <button
                  onClick={() => setDiceSystem('standard')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    diceSystem === 'standard'
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[#9E9E9E] hover:text-white'
                  }`}
                >
                  D&D / Standard
                </button>
              </div>
            </div>

            {/* Broadcast Checkbox */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#9E9E9E]">
                {diceSystem === 'wod' ? 'Comandos Discord: \\r Nd10 ou \\kr Nd10' : 'Notação padrão: NdX+Mod'}
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-[#9E9E9E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={broadcastDice}
                  onChange={(e) => setBroadcastDice(e.target.checked)}
                  className="rounded bg-[#141619] border-[#2D3139] text-indigo-600 focus:ring-0"
                />
                Enviar ao Discord
              </label>
            </div>

            {/* WoD System Panel */}
            {diceSystem === 'wod' && (
              <div className="space-y-3">
                {/* WoD Config Controls */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-[#9E9E9E] uppercase block mb-1">
                      Parada de Dados (d10)
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={wodDiceCount}
                        onChange={(e) => setWodDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white font-mono text-center focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-[#9E9E9E] uppercase block mb-1">
                      Regra de Críticos
                    </label>
                    <button
                      type="button"
                      onClick={() => setWodIsKeen(!wodIsKeen)}
                      className={`w-full py-1.5 px-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                        wodIsKeen
                          ? 'bg-amber-600/30 text-amber-300 border-amber-500 shadow-sm'
                          : 'bg-[#141619] text-[#9E9E9E] border-[#2D3139] hover:text-white'
                      }`}
                    >
                      {wodIsKeen ? '9 e 10 (\\kr)' : 'Apenas 10 (\\r)'}
                    </button>
                  </div>
                </div>

                {/* Keen Roll Info Banner */}
                <div className="flex items-center justify-between bg-[#141619] p-2.5 rounded-xl border border-[#2D3139]">
                  <div className="text-xs text-white flex items-center gap-1.5">
                    <FlameKindling className="w-3.5 h-3.5 text-amber-400" />
                    <span>{wodIsKeen ? 'Modo Crítico no 9 e 10 (\\kr)' : 'Modo Padrão Mundo das Trevas (\\r)'}</span>
                  </div>
                  <span className="text-[10px] text-indigo-300 font-mono">10s explodem • 1 anula</span>
                </div>

                {/* Roll Label */}
                <div>
                  <input
                    type="text"
                    placeholder="Ação / Teste (Ex: Destreza + Furtividade)..."
                    value={wodLabel}
                    onChange={(e) => setWodLabel(e.target.value)}
                    className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-1.5 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Roll Button */}
                <button
                  type="button"
                  onClick={handleRollWod}
                  disabled={isWodRolling}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Dices className="w-4 h-4" />
                  {isWodRolling ? 'Rolando Parada de Dados...' : `Rolar ${wodDiceCount}d10 (${wodIsKeen ? '\\kr' : '\\r'})`}
                </button>

                {/* WoD Roll Result Card */}
                {lastWodRoll && (
                  <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5 animate-fadeIn">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        {lastWodRoll.command}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        lastWodRoll.totalCriticalFails > 0 && lastWodRoll.totalSuccesses === 0
                          ? 'bg-rose-950/80 text-rose-400 border border-rose-600/40'
                          : lastWodRoll.totalSuccesses >= 5
                          ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                          : lastWodRoll.totalSuccesses > 0
                          ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                          : 'bg-[#242830] text-[#9E9E9E]'
                      }`}>
                        {lastWodRoll.totalCriticalFails > 0 && lastWodRoll.totalSuccesses === 0
                          ? 'Falha Crítica (Botch)'
                          : lastWodRoll.totalSuccesses >= 5
                          ? 'Sucesso Excepcional'
                          : lastWodRoll.totalSuccesses > 0
                          ? `${lastWodRoll.totalSuccesses} Sucesso(s)`
                          : 'Falha'}
                      </span>
                    </div>

                    {/* Big Metric Display */}
                    <div className="flex items-center justify-around py-2 bg-[#0F1113] rounded-lg border border-[#2D3139]">
                      <div className="text-center">
                        <span className="text-[10px] text-[#9E9E9E] block">Sucessos Finais</span>
                        <span className="text-xl font-bold font-mono text-emerald-400">{lastWodRoll.totalSuccesses}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-[#9E9E9E] block">Críticos ({lastWodRoll.critThreshold}+)</span>
                        <span className="text-xl font-bold font-mono text-amber-400">{lastWodRoll.totalCriticalHits}</span>
                      </div>
                      <div className="text-center">
                        <span className="text-[10px] text-[#9E9E9E] block">Erros (1s)</span>
                        <span className="text-xl font-bold font-mono text-rose-400">{lastWodRoll.totalCriticalFails}</span>
                      </div>
                    </div>

                    {/* Rolled Dice Breakdown */}
                    <div className="text-[11px] text-[#A0A6B2] space-y-1.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[#6E7681]">Rolagem Base:</span>
                        {lastWodRoll.baseRolls.map((val, i) => (
                          <span
                            key={i}
                            className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                              val >= lastWodRoll.critThreshold
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : val >= lastWodRoll.successThreshold
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                : val === 1
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                : 'bg-[#242830] text-[#9E9E9E]'
                            }`}
                          >
                            {val}
                          </span>
                        ))}
                      </div>

                      {lastWodRoll.bonusWaves && lastWodRoll.bonusWaves.length > 0 && lastWodRoll.bonusWaves.map((wave) => (
                        <div key={wave.waveIndex} className="flex items-center gap-1.5 flex-wrap pt-0.5">
                          <span className="text-amber-400 flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Onda {wave.waveIndex + 1} (10s):
                          </span>
                          {wave.rolls.map((val, i) => (
                            <span
                              key={i}
                              className={`w-6 h-6 rounded flex items-center justify-center font-mono font-bold text-xs ${
                                val >= lastWodRoll.critThreshold
                                  ? 'bg-amber-500/30 text-amber-300 border border-amber-400'
                                  : val >= lastWodRoll.successThreshold
                                  ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-400'
                                  : val === 1
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                                  : 'bg-[#242830] text-[#9E9E9E]'
                              }`}
                            >
                              {val}
                            </span>
                          ))}
                        </div>
                      ))}

                      {/* Cancelled notes */}
                      {(lastWodRoll.cancelledSuccesses > 0 || lastWodRoll.cancelledCritsCount > 0) && (
                        <p className="text-[10px] text-rose-300 pt-1 border-t border-[#2D3139]">
                          ℹ️ {lastWodRoll.cancelledCritsCount > 0 ? `${lastWodRoll.cancelledCritsCount} crítico(s) anulado(s) por 1s.` : ''}
                          {lastWodRoll.cancelledSuccesses > 0 ? ` ${lastWodRoll.cancelledSuccesses} sucesso(s) anulado(s) por 1s.` : ''}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Standard System Panel */}
            {diceSystem === 'standard' && (
              <div className="space-y-3">
                {/* Quick Dice Selection */}
                <div className="grid grid-cols-7 gap-1.5">
                  {[4, 6, 8, 10, 12, 20, 100].map((d) => (
                    <button
                      key={d}
                      onClick={() => {
                        setDiceSides(d);
                        handleRollDice(d, diceCount);
                      }}
                      className={`py-2 rounded-lg text-xs font-bold font-mono transition-all border cursor-pointer ${
                        diceSides === d
                          ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/20 scale-105'
                          : 'bg-[#141619] text-[#E0E0E0] border-[#2D3139] hover:border-[#363B44] hover:bg-[#22262B]'
                      }`}
                    >
                      d{d}
                    </button>
                  ))}
                </div>

                {/* Modifiers */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-[#9E9E9E] block mb-1">Quantidade de Dados</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={diceCount}
                      onChange={(e) => setDiceCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] text-center font-mono focus:border-indigo-500/70 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#9E9E9E] block mb-1">Modificador (+/-)</label>
                    <input
                      type="number"
                      value={diceModifier}
                      onChange={(e) => setDiceModifier(parseInt(e.target.value) || 0)}
                      className="w-full bg-[#141619] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-[#E0E0E0] text-center font-mono focus:border-indigo-500/70 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Standard Roll Button */}
                <button
                  type="button"
                  onClick={() => handleRollDice()}
                  disabled={isRolling}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Dices className="w-4 h-4" />
                  {isRolling ? 'Rolando...' : `Rolar ${diceCount}d${diceSides}${diceModifier ? (diceModifier > 0 ? `+${diceModifier}` : diceModifier) : ''}`}
                </button>

                {/* Standard Last Roll */}
                {lastRoll && (
                  <div className="p-3 rounded-xl bg-[#141619] border border-[#2D3139] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-[#9E9E9E] block">{lastRoll.notation}</span>
                      <span className="text-sm font-bold text-white">
                        Resultado: [{lastRoll.rolls.join(', ')}] {lastRoll.modifier ? `+ ${lastRoll.modifier}` : ''}
                      </span>
                    </div>
                    <span className={`text-2xl font-bold font-mono ${
                      lastRoll.isCriticalSuccess ? 'text-amber-400' : lastRoll.isCriticalFailure ? 'text-rose-400' : 'text-indigo-300'
                    }`}>
                      {lastRoll.total}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Initiative & Combat Tracker */}
          <div className="bg-[#1A1D21] border border-[#2D3139] rounded-2xl p-5 shadow-lg space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#2D3139] pb-3">
              <div className="flex items-center gap-2">
                <Swords className="w-4 h-4 text-indigo-400" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-[#FFFFFF] font-rpg">
                  Rastreador de Iniciativa
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-indigo-950/60 text-indigo-300 border border-indigo-500/30">
                  Rodada {combatRound}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {/* Send Turn Announcement Button */}
                <button
                  type="button"
                  onClick={() => handleAnnounceTurn()}
                  disabled={isAnnouncingTurn || initiativeList.length === 0}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                  title="Envia o anúncio de turno de quem está ativo para o canal do Discord"
                >
                  <Megaphone className="w-3.5 h-3.5" />
                  {isAnnouncingTurn ? 'Enviando...' : 'Avisar Turno'}
                </button>

                {/* Next Turn Button */}
                <button
                  type="button"
                  onClick={handleNextTurn}
                  disabled={initiativeList.length === 0}
                  className="flex items-center gap-1 px-3 py-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  Próximo Turno <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Auto Announce Checkbox & Feedback */}
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-1.5 text-[11px] text-[#9E9E9E] cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoAnnounceTurn}
                  onChange={(e) => setAutoAnnounceTurn(e.target.checked)}
                  className="rounded bg-[#141619] border-[#2D3139] text-indigo-600 focus:ring-0"
                />
                Auto-enviar anúncio no Discord ao mudar de turno
              </label>

              <span className="text-[10px] text-[#6E7681]">
                {initiativeList.length} Combatente(s)
              </span>
            </div>

            {turnAnnouncementFeedback && (
              <div className="p-2 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200 text-xs flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>{turnAnnouncementFeedback}</span>
              </div>
            )}

            {/* Combatants list */}
            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {initiativeList.length === 0 ? (
                <div className="p-6 text-center text-[#6E7681] text-xs">
                  Nenhum combatente na lista. Adicione abaixo manualmente ou escolha um NPC.
                </div>
              ) : (
                initiativeList.map((c, idx) => {
                  const isCurrentTurn = idx === activeTurnIdx;
                  return (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all ${
                        isCurrentTurn
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md shadow-indigo-600/10 scale-[1.01]'
                          : 'bg-[#141619] border-[#2D3139] text-[#9E9E9E]'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className={`w-6 h-6 rounded-lg text-xs font-mono font-bold flex items-center justify-center shrink-0 ${
                          isCurrentTurn ? 'bg-indigo-600 text-white' : 'bg-[#242830] text-[#D0D4DC]'
                        }`}>
                          {c.init}
                        </span>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xs font-bold truncate ${isCurrentTurn ? 'text-white' : 'text-[#D0D4DC]'}`}>
                              {c.name}
                            </span>
                            {c.isNpc && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-rose-950/60 text-rose-300 border border-rose-800/40 font-mono">
                                NPC
                              </span>
                            )}
                            {isCurrentTurn && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold animate-pulse">
                                VEZ ATIVA
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* 1-Click Announce this specific character */}
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTurnIdx(idx);
                            handleAnnounceTurn(c);
                          }}
                          className="p-1.5 text-[#9E9E9E] hover:text-amber-300 hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                          title={`Definir vez e anunciar ${c.name} no Discord`}
                        >
                          <Send className="w-3 h-3" />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleRemoveCombatant(c.id)}
                          className="p-1.5 text-[#6E7681] hover:text-rose-400 hover:bg-[#22262B] rounded-lg transition-colors cursor-pointer"
                          title="Remover do Combate"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick NPC Pickers */}
            {npcs.length > 0 && (
              <div>
                <span className="text-[10px] uppercase font-bold text-[#6E7681] block mb-1">
                  Adicionar Rapidamente da Lista de NPCs:
                </span>
                <div className="flex flex-wrap gap-1.5 max-h-16 overflow-y-auto">
                  {npcs.slice(0, 8).map(npc => (
                    <button
                      key={npc.id}
                      type="button"
                      onClick={() => {
                        const roll = Math.floor(Math.random() * 20) + 1;
                        const item = {
                          id: `init-${Date.now()}-${Math.random()}`,
                          name: npc.name,
                          init: roll,
                          hp: npc.hp || 20,
                          maxHp: npc.maxHp || npc.hp || 20,
                          isNpc: true
                        };
                        setInitiativeList(prev => [...prev, item].sort((a, b) => b.init - a.init));
                      }}
                      className="px-2 py-0.5 rounded-lg bg-[#141619] hover:bg-indigo-950/40 text-[11px] text-[#D0D4DC] hover:text-indigo-300 border border-[#2D3139] hover:border-indigo-500/40 transition-colors flex items-center gap-1 cursor-pointer"
                      title={`Adicionar ${npc.name} (Rola 1d20 automático)`}
                    >
                      <Plus className="w-2.5 h-2.5 text-indigo-400" />
                      {npc.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add Combatant Form with Auto-complete */}
            <form onSubmit={handleAddCombatant} className="flex gap-2 pt-1">
              <div className="flex-1 relative">
                <input
                  type="text"
                  list="npc-combatant-options"
                  placeholder="Nome do Personagem ou Monstro..."
                  value={newCombatantName}
                  onChange={(e) => setNewCombatantName(e.target.value)}
                  className="w-full bg-[#141619] border border-[#2D3139] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
                <datalist id="npc-combatant-options">
                  {npcs.map(npc => (
                    <option key={npc.id} value={npc.name}>
                      {npc.title || npc.race || 'NPC'} (CA {npc.ac || 10}, PV {npc.hp || 20})
                    </option>
                  ))}
                </datalist>
              </div>

              <input
                type="number"
                placeholder="Init"
                value={newCombatantInit}
                onChange={(e) => setNewCombatantInit(e.target.value)}
                className="w-16 bg-[#141619] border border-[#2D3139] rounded-xl px-2 py-2 text-xs text-white text-center focus:outline-none focus:border-indigo-500 font-mono"
                title="Deixe vazio para rolar 1d20 automático"
              />

              <button
                type="submit"
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-sm cursor-pointer flex items-center gap-1"
                title="Adicionar ao Combate"
              >
                <Plus className="w-4 h-4" />
                Adicionar
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
};

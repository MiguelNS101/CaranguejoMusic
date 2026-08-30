import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  MusicTrack,
  QueueItem,
  SoundboardItem,
  PlaybackState,
  LoopMode,
  BotStatus,
  Folder,
  NPC,
  BotConfig,
  SoundboardLayout,
  SoundboardButtonConfig,
  SessionSaveMeta,
  WodDiceRollResult,
  DiscordGuild
} from '../types';
import { safeFetchJson, apiFetch, resolveApiUrl } from '../services/api';
import { ensureDesktopBackend } from '../services/desktopBackend';

interface AudioContextType {
  // Playback & Mixing
  currentTrack: MusicTrack | null;
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  volume: number; // Master Volume: 0 to 1
  musicVolume: number; // Music Stream Volume: 0 to 1
  sfxVolume: number; // SFX / Soundboard Volume: 0 to 1
  isMuted: boolean; // Master Mute
  isMusicMuted: boolean;
  isSfxMuted: boolean;
  effectiveMusicVolume: number;
  isLocalAudioEnabled: boolean; // Control whether browser tab plays sound or only Discord bot
  loopMode: LoopMode;
  queue: QueueItem[];
  
  // Playback & Mixing Actions
  playTrack: (track: MusicTrack, immediate?: boolean, startOffset?: number) => void;
  stopTrack: () => void;
  addToQueue: (track: MusicTrack) => void;
  removeFromQueue: (queueItemId: string) => void;
  clearQueue: () => void;
  togglePlayPause: () => void;
  seek: (seconds: number) => void;
  setVolume: (vol: number) => void;
  setMusicVolume: (vol: number) => void;
  setSfxVolume: (vol: number) => void;
  toggleMute: () => void;
  toggleMusicMute: () => void;
  toggleSfxMute: () => void;
  setAudioMix: (master: number, music: number, sfx: number) => void;
  toggleLocalAudio: () => void;
  setIsLocalAudioEnabled: React.Dispatch<React.SetStateAction<boolean>>;
  setLoopMode: (mode: LoopMode) => void;
  skipNext: () => void;
  skipPrevious: () => void;
  
  // Voice Channel Connection & Actions
  disconnectVoiceChannel: () => Promise<{ success: boolean; error?: string }>;
  connectVoiceChannel: (channelId?: string) => Promise<{ success: boolean; error?: string }>;

  // Soundboard
  playSoundboard: (item: SoundboardItem) => void;
  stopSoundboard: (itemId?: string) => void;
  activeSfxIds: string[];
  soundboardLayouts: SoundboardLayout[];
  activeLayoutId: string;
  setActiveLayoutId: (id: string) => Promise<void>;
  createSoundboardLayout: (layout: Partial<SoundboardLayout>) => Promise<SoundboardLayout>;
  updateSoundboardLayout: (id: string, updates: Partial<SoundboardLayout>) => Promise<SoundboardLayout>;
  deleteSoundboardLayout: (id: string) => Promise<void>;
  updateLayoutButtons: (layoutId: string, buttons: SoundboardButtonConfig[]) => Promise<void>;
  
  // App State & Data
  folders: Folder[];
  musicTracks: MusicTrack[];
  soundboardItems: SoundboardItem[];
  npcs: NPC[];
  botConfig: BotConfig;
  botStatus: BotStatus;
  discordGuilds: DiscordGuild[];
  sessionNotes: string;
  setSessionNotes: (notes: string) => void;
  initiativeList: Array<{ id: string; name: string; initiative: number; hp?: number; maxHp?: number; isNpc: boolean }>;
  setInitiativeList: React.Dispatch<React.SetStateAction<Array<{ id: string; name: string; initiative: number; hp?: number; maxHp?: number; isNpc: boolean }>>>;
  announceInitiativeTurn: (combatantName: string, initiative: number, isNpc: boolean, round?: number, customChannelId?: string) => Promise<{ success: boolean; error?: string }>;
  
  // Session Saves
  savedSessions: SessionSaveMeta[];
  saveCurrentSession: (name: string, description?: string) => Promise<void>;
  loadSavedSession: (id: string) => Promise<void>;
  deleteSavedSession: (id: string) => Promise<void>;
  importSessionFromFile: (file: File) => Promise<void>;
  
  // Folder / Bulk Import
  importFolderFiles: (files: FileList | File[], category: 'music' | 'sfx' | 'npc', folderId?: string) => Promise<{ count: number }>;
  
  // World of Darkness (WoD) Dice
  wodRolls: WodDiceRollResult[];
  rollWodDiceAction: (count: number, isKeen: boolean, rollerName?: string, label?: string, broadcastToDiscord?: boolean) => Promise<WodDiceRollResult>;
  
  // Refresh & Mutators
  refreshState: () => Promise<void>;
  refreshBotStatus: () => Promise<void>;
  refreshGuilds: () => Promise<void>;
  saveNotes: (notes: string) => Promise<void>;
  
  // Folders
  createFolder: (folder: Omit<Folder, 'id' | 'createdAt'>) => Promise<Folder>;
  deleteFolder: (id: string) => Promise<void>;
  
  // Music
  createMusicTrack: (track: Partial<MusicTrack>) => Promise<MusicTrack>;
  deleteMusicTrack: (id: string) => Promise<void>;
  
  // Soundboard Item CRUD
  createSoundboardItem: (item: Partial<SoundboardItem>) => Promise<SoundboardItem>;
  deleteSoundboardItem: (id: string) => Promise<void>;
  
  // NPCs
  createNpc: (npc: Partial<NPC>) => Promise<NPC>;
  updateNpc: (id: string, updates: Partial<NPC>) => Promise<NPC>;
  deleteNpc: (id: string) => Promise<void>;
  postNpcToDiscord: (npcId: string, customChannelId?: string) => Promise<{ success: boolean; error?: string }>;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Audio Player & Mixing State
  const [currentTrack, setCurrentTrack] = useState<MusicTrack | null>(null);
  const [playbackState, setPlaybackState] = useState<PlaybackState>('idle');
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  // Master Volume (0-1)
  const [volume, setVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_master_vol');
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return Math.max(0, Math.min(1, val));
      }
    } catch {}
    return 0.8;
  });

  // Music Stream Volume (0-1)
  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_music_vol');
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return Math.max(0, Math.min(1, val));
      }
    } catch {}
    return 0.8;
  });

  // SFX / Soundboard Volume (0-1)
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('caranguejo_sfx_vol');
      if (saved !== null) {
        const val = parseFloat(saved);
        if (!isNaN(val)) return Math.max(0, Math.min(1, val));
      }
    } catch {}
    return 0.9;
  });

  const [isMuted, setIsMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caranguejo_master_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [isMusicMuted, setIsMusicMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caranguejo_music_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [isSfxMuted, setIsSfxMuted] = useState<boolean>(() => {
    try {
      return localStorage.getItem('caranguejo_sfx_muted') === 'true';
    } catch {
      return false;
    }
  });

  const [isLocalAudioEnabled, setIsLocalAudioEnabled] = useState<boolean>(false);
  const [loopMode, setLoopMode] = useState<LoopMode>('queue');
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeSfxIds, setActiveSfxIds] = useState<string[]>([]);

  // Calculated Effective Music Volume
  const effectiveMusicVolume = (isMuted || isMusicMuted) ? 0 : Math.max(0, Math.min(1, volume * musicVolume));

  // Helper for Calculated Effective SFX Volume
  const getEffectiveSfxVolume = (itemVolumePercent: number = 90) => {
    if (isMuted || isSfxMuted) return 0;
    const baseSfx = (itemVolumePercent / 100);
    return Math.max(0, Math.min(1, volume * sfxVolume * baseSfx));
  };

  // Server Synced State
  const [folders, setFolders] = useState<Folder[]>([]);
  const [musicTracks, setMusicTracks] = useState<MusicTrack[]>([]);
  const [soundboardItems, setSoundboardItems] = useState<SoundboardItem[]>([]);
  const [soundboardLayouts, setSoundboardLayouts] = useState<SoundboardLayout[]>([]);
  const [activeLayoutId, setActiveLayoutIdState] = useState<string>('layout-combat');
  const [savedSessions, setSavedSessions] = useState<SessionSaveMeta[]>([]);
  const [wodRolls, setWodRolls] = useState<WodDiceRollResult[]>([]);
  const [npcs, setNpcs] = useState<NPC[]>([]);
  const [initiativeList, setInitiativeList] = useState<Array<{ id: string; name: string; initiative: number; hp?: number; maxHp?: number; isNpc: boolean }>>([]);
  const [botConfig, setBotConfig] = useState<BotConfig>({
    token: '',
    autoConnectVoice: true,
    prefix: '!'
  });
  const [botStatus, setBotStatus] = useState<BotStatus>({
    isConfigured: false,
    isOnline: false,
    guildsCount: 0,
    mode: 'local_only'
  });
  const [discordGuilds, setDiscordGuilds] = useState<DiscordGuild[]>([]);
  const [sessionNotes, setSessionNotes] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sfxAudioMap = useRef<Map<string, HTMLAudioElement>>(new Map());
  const lastSeekTimestampRef = useRef<number>(0);
  const isSeekingRef = useRef<boolean>(false);

  // Initialize HTML5 Audio Element for web player
  useEffect(() => {
    const audio = new Audio();
    audio.preload = 'auto';
    audioRef.current = audio;

    const handleTimeUpdate = () => {
      // Do not process time updates if audio element is actively seeking or within seek grace window
      if (audio.seeking) return;
      if (isSeekingRef.current) return;
      if (Date.now() - lastSeekTimestampRef.current < 1000) {
        return;
      }
      if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleSeeked = () => {
      isSeekingRef.current = false;
      if (!isNaN(audio.currentTime) && isFinite(audio.currentTime)) {
        setCurrentTime(audio.currentTime);
      }
    };

    const handleDurationChange = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleEnded = () => {
      handleTrackEnded();
    };

    const handlePlay = () => setPlaybackState('playing');
    const handlePause = () => setPlaybackState('paused');
    const handleWaiting = () => setPlaybackState('buffering');
    const handleLoadedMetadata = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };
    const handleCanPlay = () => {
      if (!isNaN(audio.duration) && isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('seeked', handleSeeked);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('waiting', handleWaiting);

    return () => {
      audio.pause();
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('seeked', handleSeeked);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('waiting', handleWaiting);
    };
  }, []);

  // Sync volume with HTML5 audio element and manage local mute
  useEffect(() => {
    if (audioRef.current) {
      // Local browser playback is strictly enabled only when isLocalAudioEnabled is turned on
      audioRef.current.muted = !isLocalAudioEnabled || isMuted || isMusicMuted;
      audioRef.current.volume = effectiveMusicVolume;
    }
  }, [effectiveMusicVolume, isLocalAudioEnabled, isMuted, isMusicMuted]);

  const toggleLocalAudio = () => {
    setIsLocalAudioEnabled(prev => !prev);
  };

  // Voice Channel Connection & Disconnection Actions
  const disconnectVoiceChannel = async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeFetchJson('/api/bot/voice/disconnect', { method: 'POST' });
      await refreshBotStatus();
      if (res.data?.botStatus) {
        setBotStatus(res.data.botStatus);
      }
      return { success: res.success, error: res.error };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Falha ao desconectar voz' };
    }
  };

  const connectVoiceChannel = async (channelId?: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeFetchJson('/api/bot/voice/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voiceChannelId: channelId })
      });
      await refreshBotStatus();
      if (res.data?.botStatus) {
        setBotStatus(res.data.botStatus);
      }
      return { success: res.success, error: res.error };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Falha ao conectar voz' };
    }
  };

  // Initial Data Fetch
  const refreshState = async () => {
    try {
      const res = await safeFetchJson<any>('/api/state');
      if (res.success && res.data) {
        const data = res.data;
        setFolders(data.folders || []);
        setMusicTracks(data.musicTracks || []);
        setSoundboardItems(data.soundboardItems || []);
        setSoundboardLayouts(data.soundboardLayouts || []);
        if (data.activeSoundboardLayoutId) setActiveLayoutIdState(data.activeSoundboardLayoutId);
        setSavedSessions(data.savedSessions || []);
        setWodRolls(data.wodHistory || []);
        setNpcs(data.npcs || []);
        setInitiativeList(data.initiativeList || []);
        setBotConfig(data.botConfig || {});
        setBotStatus(data.botStatus || { isConfigured: false, isOnline: false, guildsCount: 0, mode: 'local_only' });
        setSessionNotes(data.sessionNotes || '');

        if (!currentTrack && data.musicTracks?.length > 0) {
          const first = data.musicTracks[0];
          setCurrentTrack(first);
          setDuration(first.duration || 180);
          if (audioRef.current && !audioRef.current.src) {
            audioRef.current.src = first.url;
          }
        }
      }
    } catch (err) {
      console.error('Error fetching state:', err);
    }
  };

  const refreshBotStatus = async () => {
    try {
      const res = await safeFetchJson<BotStatus>('/api/bot/status');
      if (res.success && res.data) {
        setBotStatus(res.data);
      }
    } catch (err) {
      console.error('Error fetching bot status:', err);
    }
  };

  const refreshGuilds = async () => {
    try {
      const res = await safeFetchJson<DiscordGuild[]>('/api/bot/guilds');
      if (res.success && res.data) {
        setDiscordGuilds(res.data || []);
      }
    } catch (err) {
      console.error('Error fetching guilds:', err);
    }
  };

  useEffect(() => {
    ensureDesktopBackend().then(() => {
      refreshState();
      refreshGuilds();
      refreshBotStatus();
    });

    const onBackendReady = () => {
      refreshState();
      refreshGuilds();
      refreshBotStatus();
    };

    window.addEventListener('desktop-backend-ready', onBackendReady);

    const interval = setInterval(() => {
      refreshBotStatus();
    }, 6000);

    return () => {
      window.removeEventListener('desktop-backend-ready', onBackendReady);
      clearInterval(interval);
    };
  }, []);

  const playTrack = (track: MusicTrack, immediate: boolean = true, startOffset: number = 0) => {
    // If clicking on the track that is ALREADY playing and no seek offset requested, toggle pause!
    if (currentTrack?.id === track.id && playbackState === 'playing' && startOffset === 0) {
      togglePlayPause();
      return;
    }

    setCurrentTrack(track);
    if (track.duration && !isNaN(track.duration) && track.duration > 0) {
      setDuration(track.duration);
    }
    setCurrentTime(startOffset);

    if (audioRef.current) {
      const resolvedUrl = resolveApiUrl(track.url);
      const isSameSrc = audioRef.current.src && (audioRef.current.src === resolvedUrl || audioRef.current.src.endsWith(track.url));
      if (!isSameSrc) {
        audioRef.current.src = resolvedUrl;
      }
      audioRef.current.muted = !isLocalAudioEnabled || isMuted || isMusicMuted;
      audioRef.current.volume = effectiveMusicVolume;

      if (startOffset > 0) {
        isSeekingRef.current = true;
        lastSeekTimestampRef.current = Date.now();
        const applySeek = () => {
          try {
            if (audioRef.current) audioRef.current.currentTime = startOffset;
          } catch (e) {
            console.warn('Seek offset apply error:', e);
          } finally {
            setTimeout(() => { isSeekingRef.current = false; }, 800);
          }
        };
        if (audioRef.current.readyState >= 1) {
          applySeek();
        } else {
          audioRef.current.addEventListener('loadedmetadata', applySeek, { once: true });
        }
      } else if (!isSameSrc) {
        audioRef.current.currentTime = 0;
      }

      if (immediate) {
        audioRef.current.play().catch(e => console.warn('Browser autoplay handled:', e));
      }
    }

    // Stream directly into Discord Voice Channel
    safeFetchJson('/api/bot/voice/play', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        trackUrl: track.url,
        volume: effectiveMusicVolume,
        seekSeconds: startOffset > 0 ? startOffset : undefined
      })
    }).catch(e => console.warn('Discord voice play error:', e));

    if (immediate) {
      setPlaybackState('playing');
    }
  };

  const stopTrack = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    safeFetchJson('/api/bot/voice/stop', { method: 'POST' }).catch(() => {});
    setPlaybackState('idle');
    setCurrentTime(0);
  };

  const addToQueue = (track: MusicTrack) => {
    const item: QueueItem = {
      id: `q-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      track,
      addedAt: Date.now()
    };
    setQueue(prev => [...prev, item]);
  };

  const removeFromQueue = (queueItemId: string) => {
    setQueue(prev => prev.filter(q => q.id !== queueItemId));
  };

  const clearQueue = () => {
    setQueue([]);
  };

  const togglePlayPause = () => {
    if (playbackState === 'playing') {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      safeFetchJson('/api/bot/voice/pause', { method: 'POST' }).catch(() => {});
      setPlaybackState('paused');
    } else {
      const trackToPlay = currentTrack || (musicTracks.length > 0 ? musicTracks[0] : null);
      if (!trackToPlay) return;

      const resolvedUrl = resolveApiUrl(trackToPlay.url);
      const isCurrentLoaded = audioRef.current?.src && (audioRef.current.src === resolvedUrl || audioRef.current.src.endsWith(trackToPlay.url));

      if (playbackState === 'paused' && isCurrentLoaded) {
        if (audioRef.current) {
          audioRef.current.muted = !isLocalAudioEnabled || isMuted || isMusicMuted;
          audioRef.current.volume = effectiveMusicVolume;
          audioRef.current.play().catch(e => {
            console.warn('Resume error, replaying track:', e);
            playTrack(trackToPlay, true, currentTime > 0 ? currentTime : 0);
          });
        }
        if (currentTime > 0) {
          safeFetchJson('/api/bot/voice/seek', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              seconds: currentTime,
              trackUrl: trackToPlay.url,
              volume: effectiveMusicVolume
            })
          }).catch(() => {});
        } else {
          safeFetchJson('/api/bot/voice/resume', { method: 'POST' }).catch(() => {});
        }
        setPlaybackState('playing');
      } else {
        // Start or replay track reliably with current offset
        playTrack(trackToPlay, true, currentTime > 0 ? currentTime : 0);
      }
    }
  };

  const seek = (seconds: number) => {
    const rawDuration = duration > 0 ? duration : (audioRef.current?.duration || (currentTrack?.duration || 0));
    const target = rawDuration > 0 ? Math.max(0, Math.min(rawDuration, seconds)) : Math.max(0, seconds);

    isSeekingRef.current = true;
    lastSeekTimestampRef.current = Date.now();
    setCurrentTime(target);

    if (audioRef.current && currentTrack) {
      const resolvedUrl = resolveApiUrl(currentTrack.url);
      const isLoaded = audioRef.current.src && (audioRef.current.src === resolvedUrl || audioRef.current.src.endsWith(currentTrack.url));
      if (!isLoaded) {
        audioRef.current.src = resolvedUrl;
      }
      try {
        if (audioRef.current.readyState >= 1) {
          audioRef.current.currentTime = target;
        } else {
          const onMeta = () => {
            if (audioRef.current) {
              try {
                audioRef.current.currentTime = target;
              } catch {}
            }
          };
          audioRef.current.addEventListener('loadedmetadata', onMeta, { once: true });
        }
      } catch (e) {
        console.warn('Audio seek warning:', e);
      }
    }

    // Sync Discord Bot voice stream offset
    if (currentTrack) {
      safeFetchJson('/api/bot/voice/seek', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          seconds: target,
          trackUrl: currentTrack.url,
          volume: effectiveMusicVolume
        })
      }).catch(() => {});
    }

    // Timeout safety fallback to release seeking flag
    setTimeout(() => {
      isSeekingRef.current = false;
    }, 1500);
  };

  // Master Volume Setter
  const setVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setVolumeState(clamped);
    try {
      localStorage.setItem('caranguejo_master_vol', clamped.toString());
    } catch {}

    if (clamped > 0 && isMuted) {
      setIsMuted(false);
      try {
        localStorage.setItem('caranguejo_master_muted', 'false');
      } catch {}
    }

    const nextEffective = (isMuted || isMusicMuted) ? 0 : clamped * musicVolume;
    safeFetchJson('/api/bot/voice/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: nextEffective })
    }).catch(() => {});
  };

  // Music Volume Setter
  const setMusicVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setMusicVolumeState(clamped);
    try {
      localStorage.setItem('caranguejo_music_vol', clamped.toString());
    } catch {}

    if (clamped > 0 && isMusicMuted) {
      setIsMusicMuted(false);
      try {
        localStorage.setItem('caranguejo_music_muted', 'false');
      } catch {}
    }

    const nextEffective = (isMuted || isMusicMuted) ? 0 : volume * clamped;
    safeFetchJson('/api/bot/voice/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: nextEffective })
    }).catch(() => {});
  };

  // SFX Volume Setter
  const setSfxVolume = (vol: number) => {
    const clamped = Math.max(0, Math.min(1, vol));
    setSfxVolumeState(clamped);
    try {
      localStorage.setItem('caranguejo_sfx_vol', clamped.toString());
    } catch {}

    if (clamped > 0 && isSfxMuted) {
      setIsSfxMuted(false);
      try {
        localStorage.setItem('caranguejo_sfx_muted', 'false');
      } catch {}
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('caranguejo_master_muted', next.toString());
      } catch {}
      const nextEffective = (next || isMusicMuted) ? 0 : volume * musicVolume;
      safeFetchJson('/api/bot/voice/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: nextEffective })
      }).catch(() => {});
      return next;
    });
  };

  const toggleMusicMute = () => {
    setIsMusicMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('caranguejo_music_muted', next.toString());
      } catch {}
      const nextEffective = (isMuted || next) ? 0 : volume * musicVolume;
      safeFetchJson('/api/bot/voice/volume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ volume: nextEffective })
      }).catch(() => {});
      return next;
    });
  };

  const toggleSfxMute = () => {
    setIsSfxMuted(prev => {
      const next = !prev;
      try {
        localStorage.setItem('caranguejo_sfx_muted', next.toString());
      } catch {}
      return next;
    });
  };

  // Convenience batch mix preset setter
  const setAudioMix = (masterVal: number, musicVal: number, sfxVal: number) => {
    const m = Math.max(0, Math.min(1, masterVal));
    const mus = Math.max(0, Math.min(1, musicVal));
    const sfx = Math.max(0, Math.min(1, sfxVal));
    setVolumeState(m);
    setMusicVolumeState(mus);
    setSfxVolumeState(sfx);
    try {
      localStorage.setItem('caranguejo_master_vol', m.toString());
      localStorage.setItem('caranguejo_music_vol', mus.toString());
      localStorage.setItem('caranguejo_sfx_vol', sfx.toString());
    } catch {}

    const nextEffective = (isMuted || isMusicMuted) ? 0 : m * mus;
    safeFetchJson('/api/bot/voice/volume', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ volume: nextEffective })
    }).catch(() => {});
  };

  const handleTrackEnded = () => {
    if (loopMode === 'track') {
      if (currentTrack) {
        playTrack(currentTrack, true);
      }
      return;
    }

    if (queue.length > 0) {
      const nextItem = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(nextItem.track, true);
    } else if (loopMode === 'queue' && musicTracks.length > 0) {
      const currentIdx = musicTracks.findIndex(t => t.id === currentTrack?.id);
      const nextTrack = musicTracks[(currentIdx + 1) % musicTracks.length];
      playTrack(nextTrack, true);
    } else {
      stopTrack();
    }
  };

  const skipNext = () => {
    if (queue.length > 0) {
      const nextItem = queue[0];
      setQueue(prev => prev.slice(1));
      playTrack(nextItem.track, true);
    } else if (musicTracks.length > 0) {
      const currentIdx = musicTracks.findIndex(t => t.id === currentTrack?.id);
      const nextTrack = musicTracks[(currentIdx + 1) % musicTracks.length];
      playTrack(nextTrack, true);
    }
  };

  const skipPrevious = () => {
    if (currentTime > 4) {
      seek(0);
      return;
    }
    if (musicTracks.length > 0) {
      const currentIdx = musicTracks.findIndex(t => t.id === currentTrack?.id);
      const prevTrack = musicTracks[(currentIdx - 1 + musicTracks.length) % musicTracks.length];
      playTrack(prevTrack, true);
    }
  };

  // Soundboard Audio Player with dedicated SFX volume mix
  const playSoundboard = (item: SoundboardItem) => {
    const calcVol = getEffectiveSfxVolume(item.volume);

    // If local web preview is activated, play in browser
    if (isLocalAudioEnabled) {
      try {
        const resolvedUrl = resolveApiUrl(item.url);
        const sfxAudio = new Audio(resolvedUrl);
        sfxAudio.volume = calcVol;

        setActiveSfxIds(prev => [...prev, item.id]);

        sfxAudio.onended = () => {
          setActiveSfxIds(prev => prev.filter(id => id !== item.id));
          sfxAudioMap.current.delete(item.id);
        };

        sfxAudio.onerror = (e) => {
          console.warn('SFX playback error:', e);
          setActiveSfxIds(prev => prev.filter(id => id !== item.id));
        };

        sfxAudioMap.current.set(item.id, sfxAudio);
        sfxAudio.play().catch(e => {
          console.warn('Failed to play SFX:', e);
          setActiveSfxIds(prev => prev.filter(id => id !== item.id));
        });
      } catch (e) {
        console.warn('Soundboard error:', e);
      }
    } else {
      // Visual active feedback
      setActiveSfxIds(prev => [...prev, item.id]);
      setTimeout(() => {
        setActiveSfxIds(prev => prev.filter(id => id !== item.id));
      }, (item.duration || 3) * 1000);
    }

    // Stream SFX directly to Discord Voice Channel with SFX volume mix
    safeFetchJson('/api/bot/voice/sfx', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sfxUrl: item.url,
        volume: calcVol
      })
    }).catch(err => console.warn('SFX voice dispatch error:', err));
  };

  const stopSoundboard = (itemId?: string) => {
    if (itemId) {
      const audio = sfxAudioMap.current.get(itemId);
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
        sfxAudioMap.current.delete(itemId);
      }
      setActiveSfxIds(prev => prev.filter(id => id !== itemId));
    } else {
      sfxAudioMap.current.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
      });
      sfxAudioMap.current.clear();
      setActiveSfxIds([]);
    }
  };

  // ==========================================
  // SOUNDBOARD LAYOUTS
  // ==========================================

  const setActiveLayoutId = async (id: string) => {
    setActiveLayoutIdState(id);
    try {
      await safeFetchJson('/api/soundboard-layouts/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ layoutId: id })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const createSoundboardLayout = async (layout: Partial<SoundboardLayout>): Promise<SoundboardLayout> => {
    const res = await safeFetchJson<SoundboardLayout>('/api/soundboard-layouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(layout)
    });
    const created = res.data || (layout as SoundboardLayout);
    setSoundboardLayouts(prev => [...prev, created]);
    setActiveLayoutIdState(created.id);
    return created;
  };

  const updateSoundboardLayout = async (id: string, updates: Partial<SoundboardLayout>): Promise<SoundboardLayout> => {
    const res = await safeFetchJson<SoundboardLayout>(`/api/soundboard-layouts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updated = res.data || (updates as SoundboardLayout);
    setSoundboardLayouts(prev => prev.map(l => l.id === id ? { ...l, ...updated } : l));
    return updated;
  };

  const deleteSoundboardLayout = async (id: string) => {
    const res = await safeFetchJson<{ activeLayoutId?: string }>(`/api/soundboard-layouts/${id}`, { method: 'DELETE' });
    setSoundboardLayouts(prev => prev.filter(l => l.id !== id));
    if (res.data?.activeLayoutId) setActiveLayoutIdState(res.data.activeLayoutId);
  };

  const updateLayoutButtons = async (layoutId: string, buttons: SoundboardButtonConfig[]) => {
    setSoundboardLayouts(prev => prev.map(l => l.id === layoutId ? { ...l, buttons, updatedAt: Date.now() } : l));
    try {
      await safeFetchJson(`/api/soundboard-layouts/${layoutId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buttons })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ==========================================
  // SESSIONS MANAGEMENT
  // ==========================================

  const saveCurrentSession = async (name: string, description?: string) => {
    const clientSnapshot = {
      folders,
      musicTracks,
      soundboardItems,
      soundboardLayouts,
      activeSoundboardLayoutId: activeLayoutId,
      npcs,
      sessionNotes,
      initiativeList,
      currentTrack,
      queue,
      volume,
      loopMode
    };

    const res = await safeFetchJson<{ allSessions: SessionSaveMeta[] }>('/api/sessions/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, clientSnapshot })
    });

    if (res.success && res.data) {
      setSavedSessions(res.data.allSessions || []);
    } else {
      throw new Error(res.error || 'Falha ao salvar a sessão atual.');
    }
  };

  const loadSavedSession = async (id: string) => {
    const res = await safeFetchJson<{ state?: any }>(`/api/sessions/load/${id}`, { method: 'POST' });
    if (res.success && res.data?.state) {
      const data = res.data;
      setFolders(data.state.folders || []);
      setMusicTracks(data.state.musicTracks || []);
      setSoundboardItems(data.state.soundboardItems || []);
      setSoundboardLayouts(data.state.soundboardLayouts || []);
      if (data.state.activeSoundboardLayoutId) setActiveLayoutIdState(data.state.activeSoundboardLayoutId);
      setNpcs(data.state.npcs || []);
      setSessionNotes(data.state.sessionNotes || '');
      setInitiativeList(data.state.initiativeList || []);
      if (data.state.currentTrack) playTrack(data.state.currentTrack, false);
    } else {
      throw new Error(res.error || 'Falha ao carregar arquivo de save.');
    }
  };

  const deleteSavedSession = async (id: string) => {
    const res = await safeFetchJson<{ allSessions: SessionSaveMeta[] }>(`/api/sessions/${id}`, { method: 'DELETE' });
    if (res.success && res.data) {
      setSavedSessions(res.data.allSessions || []);
    }
  };

  const importSessionFromFile = async (file: File) => {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const res = await safeFetchJson<{ allSessions: SessionSaveMeta[] }>('/api/sessions/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(parsed)
    });
    if (res.success && res.data) {
      setSavedSessions(res.data.allSessions || []);
    } else {
      throw new Error(res.error || 'Formato de arquivo de sessão inválido.');
    }
  };

  // ==========================================
  // WHOLE FOLDER / BULK IMPORT
  // ==========================================

  const importFolderFiles = async (
    files: FileList | File[],
    category: 'music' | 'sfx' | 'npc',
    folderId?: string
  ): Promise<{ count: number }> => {
    const formData = new FormData();
    const fileArray = Array.from(files);
    fileArray.forEach(f => formData.append('files', f));
    
    // Extract relative paths if imported via webkitdirectory or custom drop
    const paths = fileArray.map(f => (f as any).webkitRelativePath || f.name);
    formData.append('paths', JSON.stringify(paths));

    if (folderId) formData.append('folderId', folderId);

    const res = await apiFetch(`/api/upload/bulk?type=${category}`, {
      method: 'POST',
      body: formData
    });

    if (!res.ok) {
      throw new Error('Falha ao importar pasta.');
    }

    const data = await res.json();
    await refreshState();
    return { count: data.totalFiles || fileArray.length };
  };

  // ==========================================
  // WORLD OF DARKNESS (WoD) ROLLER
  // ==========================================

  const rollWodDiceAction = async (
    count: number,
    isKeen: boolean = false,
    rollerName: string = 'Mestre',
    label?: string,
    broadcastToDiscord: boolean = true
  ): Promise<WodDiceRollResult> => {
    const res = await safeFetchJson<{ roll: WodDiceRollResult }>('/api/dice/wod', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        count,
        isKeen,
        rollerName,
        label,
        broadcastToDiscord,
        channelId: botConfig.textChannelId
      })
    });

    if (res.success && res.data?.roll) {
      setWodRolls(prev => [res.data!.roll, ...prev.slice(0, 49)]);
      return res.data.roll;
    }
    throw new Error(res.error || 'Erro ao processar rolagem WoD.');
  };

  // CRUD Helpers
  const saveNotes = async (notes: string) => {
    setSessionNotes(notes);
    try {
      await safeFetchJson('/api/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const createFolder = async (folder: Omit<Folder, 'id' | 'createdAt'>): Promise<Folder> => {
    const res = await safeFetchJson<Folder>('/api/folders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(folder)
    });
    const created = res.data || { ...folder, id: `f-${Date.now()}`, createdAt: Date.now() };
    setFolders(prev => [...prev, created]);
    return created;
  };

  const deleteFolder = async (id: string) => {
    await safeFetchJson(`/api/folders/${id}`, { method: 'DELETE' });
    setFolders(prev => prev.filter(f => f.id !== id));
  };

  const createMusicTrack = async (track: Partial<MusicTrack>): Promise<MusicTrack> => {
    const res = await safeFetchJson<MusicTrack>('/api/music', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track)
    });
    const created = res.data || (track as MusicTrack);
    setMusicTracks(prev => [created, ...prev]);
    return created;
  };

  const deleteMusicTrack = async (id: string) => {
    await safeFetchJson(`/api/music/${id}`, { method: 'DELETE' });
    setMusicTracks(prev => prev.filter(t => t.id !== id));
  };

  const createSoundboardItem = async (item: Partial<SoundboardItem>): Promise<SoundboardItem> => {
    const res = await safeFetchJson<SoundboardItem>('/api/soundboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const created = res.data || (item as SoundboardItem);
    setSoundboardItems(prev => [...prev, created]);
    return created;
  };

  const deleteSoundboardItem = async (id: string) => {
    await safeFetchJson(`/api/soundboard/${id}`, { method: 'DELETE' });
    setSoundboardItems(prev => prev.filter(s => s.id !== id));
  };

  const createNpc = async (npc: Partial<NPC>): Promise<NPC> => {
    const res = await safeFetchJson<NPC>('/api/npcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(npc)
    });
    const created = res.data || (npc as NPC);
    setNpcs(prev => [created, ...prev]);
    return created;
  };

  const updateNpc = async (id: string, updates: Partial<NPC>): Promise<NPC> => {
    const res = await safeFetchJson<NPC>(`/api/npcs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updated = res.data || (updates as NPC);
    setNpcs(prev => prev.map(n => n.id === id ? { ...n, ...updated } : n));
    return updated;
  };

  const deleteNpc = async (id: string) => {
    await safeFetchJson(`/api/npcs/${id}`, { method: 'DELETE' });
    setNpcs(prev => prev.filter(n => n.id !== id));
  };

  const postNpcToDiscord = async (npcId: string, customChannelId?: string) => {
    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/post-npc', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ npcId, customChannelId })
      });
      return { success: res.success && (res.data?.success !== false), error: res.data?.error || res.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  const announceInitiativeTurn = async (
    combatantName: string,
    initiative: number,
    isNpc: boolean,
    round?: number,
    customChannelId?: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/announce-turn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: combatantName,
          initiative,
          isNpc,
          round,
          customChannelId
        })
      });
      return { success: res.success && (res.data?.success !== false), error: res.data?.error || res.error };
    } catch (e: any) {
      return { success: false, error: e.message };
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentTrack,
        playbackState,
        currentTime,
        duration,
        volume,
        musicVolume,
        sfxVolume,
        isMuted,
        isMusicMuted,
        isSfxMuted,
        effectiveMusicVolume,
        isLocalAudioEnabled,
        loopMode,
        queue,
        playTrack,
        stopTrack,
        addToQueue,
        removeFromQueue,
        clearQueue,
        togglePlayPause,
        seek,
        setVolume,
        setMusicVolume,
        setSfxVolume,
        toggleMute,
        toggleMusicMute,
        toggleSfxMute,
        setAudioMix,
        toggleLocalAudio,
        setIsLocalAudioEnabled,
        setLoopMode,
        skipNext,
        skipPrevious,
        disconnectVoiceChannel,
        connectVoiceChannel,
        playSoundboard,
        stopSoundboard,
        activeSfxIds,
        soundboardLayouts,
        activeLayoutId,
        setActiveLayoutId,
        createSoundboardLayout,
        updateSoundboardLayout,
        deleteSoundboardLayout,
        updateLayoutButtons,
        folders,
        musicTracks,
        soundboardItems,
        npcs,
        botConfig,
        botStatus,
        discordGuilds,
        sessionNotes,
        setSessionNotes,
        initiativeList,
        setInitiativeList,
        announceInitiativeTurn,
        savedSessions,
        saveCurrentSession,
        loadSavedSession,
        deleteSavedSession,
        importSessionFromFile,
        importFolderFiles,
        wodRolls,
        rollWodDiceAction,
        refreshState,
        refreshBotStatus,
        refreshGuilds,
        saveNotes,
        createFolder,
        deleteFolder,
        createMusicTrack,
        deleteMusicTrack,
        createSoundboardItem,
        deleteSoundboardItem,
        createNpc,
        updateNpc,
        deleteNpc,
        postNpcToDiscord
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (!context) throw new Error('useAudio must be used within AudioProvider');
  return context;
};

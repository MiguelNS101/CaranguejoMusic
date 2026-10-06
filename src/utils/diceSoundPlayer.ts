/**
 * Dice Sound Effects Player for CaranguejoRPG
 * 
 * Supports:
 * - High-fidelity Web Audio API procedural sound synthesizers (zero external assets required)
 * - Custom audio URLs (e.g. mp3/wav links)
 * - Direct Soundboard item integration
 * - Customizable themes (Fantasy, Metallic, 8-Bit, Wooden, Gothic)
 */

import {
  DiceSoundSettingsPreset,
  DiceSoundEffectItem,
  DiceSoundTheme,
  getDiceSoundSettings,
  DEFAULT_DICE_SOUND_SETTINGS
} from './presetStore';

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return null;

  if (!sharedAudioContext || sharedAudioContext.state === 'closed') {
    sharedAudioContext = new AudioCtx();
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

/**
 * Procedural Web Audio Sound Synthesizers
 */

/**
 * 1. Tumbling Dice Roll Sound
 */
function synthesizeDiceRoll(ctx: AudioContext, destination: AudioNode, theme: DiceSoundTheme) {
  const now = ctx.currentTime;
  const rollDuration = theme === 'metallic' ? 0.75 : 0.6;
  const clickCount = theme === 'retro8bit' ? 6 : 9;

  // Polyhedral clicks tumbling
  for (let i = 0; i < clickCount; i++) {
    const clickTime = now + (i * (rollDuration / clickCount)) + (Math.random() * 0.03);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    if (theme === 'metallic') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800 + Math.random() * 1400, clickTime);
      osc.frequency.exponentialRampToValueAtTime(300, clickTime + 0.03);
    } else if (theme === 'retro8bit') {
      osc.type = 'square';
      osc.frequency.setValueAtTime(200 + (i * 120), clickTime);
    } else if (theme === 'gothic') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140 + Math.random() * 200, clickTime);
      osc.frequency.exponentialRampToValueAtTime(70, clickTime + 0.05);
    } else {
      // Wooden / Fantasy
      osc.type = 'sine';
      osc.frequency.setValueAtTime(250 + Math.random() * 350, clickTime);
      osc.frequency.exponentialRampToValueAtTime(100, clickTime + 0.025);
    }

    gain.gain.setValueAtTime(0, clickTime);
    gain.gain.linearRampToValueAtTime(0.35 + Math.random() * 0.25, clickTime + 0.003);
    gain.gain.exponentialRampToValueAtTime(0.001, clickTime + (theme === 'metallic' ? 0.06 : 0.035));

    osc.connect(gain);
    gain.connect(destination);

    osc.start(clickTime);
    osc.stop(clickTime + 0.07);
  }

  // Filtered noise swoosh of tray
  const bufferSize = ctx.sampleRate * 0.25;
  const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const output = noiseBuffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1;
  }

  const whiteNoise = ctx.createBufferSource();
  whiteNoise.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = theme === 'metallic' ? 'bandpass' : 'lowpass';
  filter.frequency.setValueAtTime(theme === 'metallic' ? 2200 : 800, now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.18, now);
  noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  whiteNoise.connect(filter);
  filter.connect(noiseGain);
  noiseGain.connect(destination);

  whiteNoise.start(now);
  whiteNoise.stop(now + 0.26);
}

/**
 * 2. Critical Success (Nat 20 / Epic Win)
 */
function synthesizeCritSuccess(ctx: AudioContext, destination: AudioNode, theme: DiceSoundTheme) {
  const now = ctx.currentTime;

  if (theme === 'retro8bit') {
    // 8-Bit triumphant fanfare
    const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
    notes.forEach((freq, idx) => {
      const startTime = now + (idx * 0.07);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.18);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + 0.2);
    });
    return;
  }

  if (theme === 'metallic') {
    // Resonant grand silver bells & shimmer
    const bellFrequencies = [523.25, 659.25, 783.99, 1046.50, 1567.98];
    bellFrequencies.forEach((freq, idx) => {
      const startTime = now + (idx * 0.06);
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.35, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 1.2);

      osc.connect(gain);
      gain.connect(destination);
      osc.start(startTime);
      osc.stop(startTime + 1.3);
    });
    return;
  }

  if (theme === 'gothic') {
    // Cathedral solemn pipe / ethereal choir harmony
    const chords = [261.63, 392.00, 523.25, 659.25];
    chords.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.linearRampToValueAtTime(1800, now + 0.3);

      gain.gain.setValueAtTime(0.01, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 1.6);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(destination);

      osc.start(now);
      osc.stop(now + 1.7);
    });
    return;
  }

  // Fantasy Heroic: Radiant arpeggio with golden trumpet chords (C5 -> E5 -> G5 -> C6)
  const notes = [
    { freq: 523.25, time: 0.0, dur: 0.8 }, // C5
    { freq: 659.25, time: 0.08, dur: 0.8 }, // E5
    { freq: 783.99, time: 0.16, dur: 0.9 }, // G5
    { freq: 1046.50, time: 0.24, dur: 1.4 }, // C6
    { freq: 1318.51, time: 0.30, dur: 1.2 }  // E6 high sparkle
  ];

  notes.forEach(({ freq, time, dur }) => {
    const startTime = now + time;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + dur);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + dur + 0.05);
  });
}

/**
 * 3. Critical Failure (Nat 1 / Disaster)
 */
function synthesizeCritFail(ctx: AudioContext, destination: AudioNode, theme: DiceSoundTheme) {
  const now = ctx.currentTime;

  if (theme === 'retro8bit') {
    // 8-Bit descending crash and buzz
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(45, now + 0.5);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);

    osc.connect(gain);
    gain.connect(destination);
    osc.start(now);
    osc.stop(now + 0.6);
    return;
  }

  // Deep doom chord with descending pitch and dark sub-bass
  const baseFreqs = theme === 'metallic' ? [185.0, 196.0, 110.0] : [110.0, 116.54, 73.42];

  baseFreqs.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = theme === 'metallic' ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, now + 0.8);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(theme === 'metallic' ? 1400 : 500, now);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.45, now + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.1 + (idx * 0.2));

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(destination);

    osc.start(now);
    osc.stop(now + 1.4);
  });

  // Low ominous thud
  const subOsc = ctx.createOscillator();
  const subGain = ctx.createGain();
  subOsc.type = 'sine';
  subOsc.frequency.setValueAtTime(90, now);
  subOsc.frequency.exponentialRampToValueAtTime(30, now + 0.6);

  subGain.gain.setValueAtTime(0.6, now);
  subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7);

  subOsc.connect(subGain);
  subGain.connect(destination);

  subOsc.start(now);
  subOsc.stop(now + 0.75);
}

/**
 * 4. Normal Success (Pleasant Chime)
 */
function synthesizeNormalSuccess(ctx: AudioContext, destination: AudioNode, theme: DiceSoundTheme) {
  const now = ctx.currentTime;
  const notes = theme === 'retro8bit' ? [523.25, 659.25] : [587.33, 880.00];

  notes.forEach((freq, idx) => {
    const startTime = now + (idx * 0.08);
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = theme === 'retro8bit' ? 'square' : 'triangle';
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.28, startTime + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.45);

    osc.connect(gain);
    gain.connect(destination);

    osc.start(startTime);
    osc.stop(startTime + 0.5);
  });
}

/**
 * 5. Normal Fail (Gentle Low Clack)
 */
function synthesizeNormalFail(ctx: AudioContext, destination: AudioNode, theme: DiceSoundTheme) {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = theme === 'retro8bit' ? 'square' : 'triangle';
  osc.frequency.setValueAtTime(220, now);
  osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

  gain.gain.setValueAtTime(0.3, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

  osc.connect(gain);
  gain.connect(destination);

  osc.start(now);
  osc.stop(now + 0.25);
}

export type DiceSoundEventType = 'roll' | 'critSuccess' | 'critFail' | 'normalSuccess' | 'normalFail';

/**
 * Master Sound Player Entry Point
 */
export async function playDiceSound(
  event: DiceSoundEventType,
  customSettings?: DiceSoundSettingsPreset,
  soundboardCallback?: (itemId: string) => void
): Promise<void> {
  const settings = customSettings || getDiceSoundSettings();
  if (!settings.enabled) return;

  const itemConfig: DiceSoundEffectItem =
    event === 'roll'
      ? settings.rollSound
      : event === 'critSuccess'
      ? settings.critSuccessSound
      : event === 'critFail'
      ? settings.critFailSound
      : event === 'normalSuccess'
      ? settings.normalSuccessSound
      : settings.normalFailSound;

  if (!itemConfig.enabled) return;

  const effectiveVolume = ((settings.masterVolume / 100) * ((itemConfig.volume ?? 80) / 100));
  if (effectiveVolume <= 0) return;

  // 1. Soundboard Link
  if (itemConfig.type === 'soundboard' && itemConfig.soundboardItemId && soundboardCallback) {
    soundboardCallback(itemConfig.soundboardItemId);
    return;
  }

  // 2. Custom Audio URL
  if (itemConfig.type === 'custom_url' && itemConfig.customUrl?.trim()) {
    try {
      const audio = new Audio(itemConfig.customUrl.trim());
      audio.volume = Math.max(0, Math.min(1, effectiveVolume));
      await audio.play();
      return;
    } catch (e) {
      console.warn('Failed to play custom dice sound URL, falling back to synth:', e);
    }
  }

  // 3. Web Audio Synthesizer
  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, effectiveVolume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  const theme = itemConfig.synthTheme || settings.soundTheme || 'fantasy';

  switch (event) {
    case 'roll':
      synthesizeDiceRoll(ctx, masterGain, theme);
      break;
    case 'critSuccess':
      synthesizeCritSuccess(ctx, masterGain, theme);
      break;
    case 'critFail':
      synthesizeCritFail(ctx, masterGain, theme);
      break;
    case 'normalSuccess':
      synthesizeNormalSuccess(ctx, masterGain, theme);
      break;
    case 'normalFail':
      synthesizeNormalFail(ctx, masterGain, theme);
      break;
  }
}

/**
 * Test a specific sound configuration in the presets dialog
 */
export async function testDiceSound(
  event: DiceSoundEventType,
  itemConfig: DiceSoundEffectItem,
  masterVolume: number = 80,
  soundboardCallback?: (itemId: string) => void
): Promise<void> {
  const effectiveVolume = ((masterVolume / 100) * ((itemConfig.volume ?? 80) / 100));

  if (itemConfig.type === 'soundboard' && itemConfig.soundboardItemId && soundboardCallback) {
    soundboardCallback(itemConfig.soundboardItemId);
    return;
  }

  if (itemConfig.type === 'custom_url' && itemConfig.customUrl?.trim()) {
    try {
      const audio = new Audio(itemConfig.customUrl.trim());
      audio.volume = Math.max(0, Math.min(1, effectiveVolume));
      await audio.play();
      return;
    } catch (e) {
      console.warn('Failed to test custom dice sound URL, falling back to synth:', e);
    }
  }

  const ctx = getAudioContext();
  if (!ctx) return;

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, effectiveVolume)), ctx.currentTime);
  masterGain.connect(ctx.destination);

  const theme = itemConfig.synthTheme || 'fantasy';

  switch (event) {
    case 'roll':
      synthesizeDiceRoll(ctx, masterGain, theme);
      break;
    case 'critSuccess':
      synthesizeCritSuccess(ctx, masterGain, theme);
      break;
    case 'critFail':
      synthesizeCritFail(ctx, masterGain, theme);
      break;
    case 'normalSuccess':
      synthesizeNormalSuccess(ctx, masterGain, theme);
      break;
    case 'normalFail':
      synthesizeNormalFail(ctx, masterGain, theme);
      break;
  }
}

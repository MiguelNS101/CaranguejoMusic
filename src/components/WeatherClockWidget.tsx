import React, { useState, useEffect } from 'react';
import {
  Sun,
  CloudRain,
  CloudFog,
  CloudLightning,
  Snowflake,
  Moon,
  Clock,
  Calendar,
  Send,
  Sparkles,
  Compass,
  CheckCircle2,
  AlertCircle,
  Plus,
  Minus
} from 'lucide-react';
import { safeFetchJson } from '../services/api';
import { getWeatherPresets, WeatherAtmospherePreset } from '../utils/presetStore';

type WeatherType = 'clear' | 'fog' | 'rain' | 'storm' | 'snow' | 'blood_moon' | 'heatwave';
type TimeOfDay = 'dawn' | 'noon' | 'afternoon' | 'dusk' | 'midnight' | 'deep_night';

interface WeatherConfig {
  icon: string;
  name: string;
  effect: string;
  discordEmoji: string;
}

const WEATHER_PRESETS: Record<WeatherType, WeatherConfig> = {
  clear: { icon: '☀️', name: 'Céu Limpo & Ensolarado', effect: 'Visibilidade perfeita. Nenhum impedimento.', discordEmoji: '☀️' },
  fog: { icon: '🌫️', name: 'Névoa Espessa & Sombria', effect: 'Visibilidade reduzida a 9 metros. Desvantagem em Percepção visual.', discordEmoji: '🌫️' },
  rain: { icon: '🌧️', name: 'Chuva Fria & Lama', effect: 'Fogo exposto apaga. Desvantagem em Percepção auditiva e rastreamento.', discordEmoji: '🌧️' },
  storm: { icon: '⛈️', name: 'Tempestade de Raios', effect: 'Terreno difícil aberto. Ataques à distância com desvantagem. Barulho ensurdecedor.', discordEmoji: '⛈️' },
  snow: { icon: '❄️', name: 'Nevasca & Frio Extremo', effect: 'Testes de Constituição CD 10 contra Exaustão se não houver agasalhos.', discordEmoji: '❄️' },
  blood_moon: { icon: '🌕', name: 'Noite de Lua Sangrenta', effect: 'Criaturas da noite e Vampiros recebem +1 dado de bônus em testes sobrenaturais.', discordEmoji: '🩸' },
  heatwave: { icon: '🔥', name: 'Calor Escaldante do Deserto', effect: 'Consumo de água triplicado. Armaduras pesadas causam desvantagem.', discordEmoji: '🔥' }
};

const TIME_NAMES: Record<TimeOfDay, { name: string; icon: string; light: string }> = {
  dawn: { name: 'Alvorecer (06:00)', icon: '🌅', light: 'Luz Plena' },
  noon: { name: 'Meio-Dia (12:00)', icon: '☀️', light: 'Luz Plena Direta' },
  afternoon: { name: 'Tarde (16:00)', icon: '🌤️', light: 'Luz Plena' },
  dusk: { name: 'Crepúsculo (19:00)', icon: '🌇', light: 'Penumbra (Dim Light)' },
  midnight: { name: 'Meia-Noite (00:00)', icon: '🌙', light: 'Escuridão Total' },
  deep_night: { name: 'Madrugada (03:00)', icon: '🌌', light: 'Escuridão Profunda' }
};

interface WeatherClockWidgetProps {
  storageKey?: string;
}

export const WeatherClockWidget: React.FC<WeatherClockWidgetProps> = ({
  storageKey = 'caranguejo_weather_clock_state'
}) => {
  const [customPresets, setCustomPresets] = useState<WeatherAtmospherePreset[]>(() => getWeatherPresets());

  useEffect(() => {
    const handleUpdate = () => {
      setCustomPresets(getWeatherPresets());
    };
    window.addEventListener('caranguejo_presets_updated', handleUpdate);
    return () => window.removeEventListener('caranguejo_presets_updated', handleUpdate);
  }, []);

  const [activeWeatherId, setActiveWeatherId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.activeWeatherId) return parsed.activeWeatherId;
        if (parsed.weather) return parsed.weather;
      }
    } catch {}
    return customPresets[0]?.id || 'weather-clear-sun';
  });

  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.timeOfDay) return parsed.timeOfDay;
      }
    } catch {}
    return 'dusk';
  });

  const [campaignDay, setCampaignDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed.campaignDay === 'number') return parsed.campaignDay;
      }
    } catch {}
    return 14;
  });

  const [customNote, setCustomNote] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.customNote) return parsed.customNote;
      }
    } catch {}
    return 'Lua Cheia prevista para amanhã à noite.';
  });

  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState<{ status: 'idle' | 'success' | 'error'; msg?: string }>({ status: 'idle' });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({ activeWeatherId, timeOfDay, campaignDay, customNote })
      );
    } catch {}
  }, [activeWeatherId, timeOfDay, campaignDay, customNote, storageKey]);

  const activeWeather = customPresets.find(p => p.id === activeWeatherId) ||
    customPresets[0] || {
      id: 'default',
      name: 'Céu Limpo',
      icon: '☀️',
      effect: 'Visibilidade perfeita.',
      discordEmoji: '☀️'
    };

  const currentW = {
    icon: activeWeather.icon,
    name: activeWeather.name,
    effect: activeWeather.effect,
    discordEmoji: activeWeather.discordEmoji || activeWeather.icon
  };

  const currentT = TIME_NAMES[timeOfDay];

  const handleSendToDiscord = async () => {
    setIsSending(true);
    setFeedback({ status: 'idle' });

    const message = `⏳ **Atualização de Tempo & Atmosfera (Dia ${campaignDay})**\n` +
      `🕒 **Horário:** ${currentT.icon} ${currentT.name} • *${currentT.light}*\n` +
      `🌦️ **Clima:** ${currentW.discordEmoji} **${currentW.name}**\n` +
      `⚠️ **Efeito Ambiental:** ${currentW.effect}\n` +
      (customNote.trim() ? `📌 **Nota de Ambiência:** *${customNote.trim()}*` : '');

    try {
      const res = await safeFetchJson<{ success: boolean; error?: string }>('/api/discord/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message,
          type: 'narration'
        })
      });

      if (res.success) {
        setFeedback({ status: 'success', msg: 'Atmosfera anunciada no Discord!' });
        setTimeout(() => setFeedback({ status: 'idle' }), 3500);
      } else {
        setFeedback({ status: 'error', msg: res.error || 'Falha ao anunciar no Discord.' });
        setTimeout(() => setFeedback({ status: 'idle' }), 4000);
      }
    } catch {
      setFeedback({ status: 'error', msg: 'Erro de rede.' });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="w-full h-full min-w-0 max-w-full flex flex-col space-y-3">
      {/* Day & Time Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2.5 border-b border-[#2D3139]/60 shrink-0">
        {/* Campaign Day Counter */}
        <div className="bg-[#141619] border border-[#2D3139] rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-400" />
            <div>
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block">Dia da Campanha</span>
              <span className="text-sm font-black text-white font-mono">Dia {campaignDay}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCampaignDay(prev => Math.max(1, prev - 1))}
              className="p-1.5 rounded-lg bg-[#22262B] hover:bg-[#2B3037] text-white border border-[#2D3139] cursor-pointer"
              title="Dia anterior"
            >
              <Minus className="w-3 h-3" />
            </button>
            <button
              type="button"
              onClick={() => setCampaignDay(prev => prev + 1)}
              className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-sm"
              title="Avançar dia"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Time of Day Selector */}
        <div className="bg-[#141619] border border-[#2D3139] rounded-xl p-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{currentT.icon}</span>
            <div>
              <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block">Horário & Iluminação</span>
              <span className="text-xs font-bold text-white truncate">{currentT.name}</span>
            </div>
          </div>
          <select
            value={timeOfDay}
            onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
            className="bg-[#22262B] border border-[#2D3139] rounded-lg px-2 py-1 text-xs text-indigo-300 font-bold focus:outline-none cursor-pointer"
          >
            {Object.entries(TIME_NAMES).map(([key, t]) => (
              <option key={key} value={key}>{t.icon} {t.name.split(' ')[0]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Weather Selector Chips */}
      <div>
        <span className="text-[10px] uppercase text-[#9E9E9E] font-bold block mb-2">Clima & Condição Atmosférica ({customPresets.length})</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
          {customPresets.map((item) => {
            const isSelected = activeWeatherId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveWeatherId(item.id);
                  if (item.timeOfDay) setTimeOfDay(item.timeOfDay);
                }}
                className={`p-2 rounded-xl border flex items-center gap-2 text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600/30 border-indigo-500 text-white ring-1 ring-indigo-500 shadow-sm'
                    : 'bg-[#141619] border-[#2D3139] text-[#CCCCCC] hover:bg-[#22262B]'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span className="text-xs font-bold truncate">{item.name.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Atmospheric Effect Card & Custom Note */}
      <div className="bg-[#141619] border border-[#2D3139] rounded-xl p-3 space-y-2">
        <div className="flex items-start gap-2">
          <span className="text-xl">{currentW.icon}</span>
          <div>
            <h4 className="text-xs font-bold text-white">{currentW.name}</h4>
            <p className="text-[11px] text-[#9E9E9E] italic">{currentW.effect}</p>
          </div>
        </div>

        <input
          type="text"
          value={customNote}
          onChange={(e) => setCustomNote(e.target.value)}
          placeholder="Nota de ambiência (ex: vento uivando pelas frestas, névoa vermelha)..."
          className="w-full bg-[#1A1D21] border border-[#2D3139] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder:text-[#6E7681] focus:border-indigo-500 focus:outline-none"
        />
      </div>

      {/* Footer / Send to Discord */}
      <div className="flex items-center justify-between gap-2 pt-1">
        {feedback.status === 'success' ? (
          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            {feedback.msg}
          </span>
        ) : feedback.status === 'error' ? (
          <span className="text-xs text-rose-400 font-bold flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {feedback.msg}
          </span>
        ) : (
          <span className="text-[11px] text-[#9E9E9E]">
            Iluminação: <strong className="text-amber-300">{currentT.light}</strong>
          </span>
        )}

        <button
          type="button"
          onClick={handleSendToDiscord}
          disabled={isSending}
          className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-600/30 disabled:opacity-50 cursor-pointer transition-all shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          {isSending ? 'Anunciando...' : 'Anunciar no Discord'}
        </button>
      </div>
    </div>
  );
};

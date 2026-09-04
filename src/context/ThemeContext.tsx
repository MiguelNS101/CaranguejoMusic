import React, { createContext, useContext, useState, useEffect } from 'react';

export interface ThemeColors {
  bgPrimary: string;
  bgSurface: string;
  bgCard: string;
  bgCardHover: string;
  border: string;
  borderHover: string;
  accentPrimary: string;
  accentHover: string;
  accentMuted: string;
  accentSecondary: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
}

export interface ThemeLayout {
  fontFamily: string;
  radius: string; // e.g., '1rem', '0.5rem', '1.5rem', '0.25rem'
  containerMaxWidth: string; // e.g., '80rem', '90rem', '100%'
  cardPadding: string; // e.g., '1.25rem', '1rem', '1.5rem'
}

export interface RPGTheme {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  layout: ThemeLayout;
  customCss: string;
}

export const THEME_PRESETS: RPGTheme[] = [
  {
    id: 'obsidian-indigo',
    name: 'Obsidian Indigo (Padrão)',
    description: 'Estilo padrão refinado com tons obsidiana, acentos índigo místicos e toques dourados.',
    colors: {
      bgPrimary: '#0F1115',
      bgSurface: '#141619',
      bgCard: '#1A1D21',
      bgCardHover: '#20242B',
      border: '#2D3139',
      borderHover: '#404652',
      accentPrimary: '#6366F1',
      accentHover: '#4F46E5',
      accentMuted: 'rgba(99, 102, 241, 0.18)',
      accentSecondary: '#F59E0B',
      textPrimary: '#F4F4F5',
      textSecondary: '#A1A1AA',
      textMuted: '#71717A'
    },
    layout: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      radius: '1rem',
      containerMaxWidth: '80rem',
      cardPadding: '1.25rem'
    },
    customCss: `/* Tema Padrão Obsidian Indigo */
:root {
  --rpg-theme-active: 'obsidian-indigo';
}`
  },
  {
    id: 'blood-shadow',
    name: 'Sangue & Sombras (Vampiro / WoD)',
    description: 'Ambiente gótico e soturno com preto carmesim profundo, detalhes em rubi e auras sombrias.',
    colors: {
      bgPrimary: '#0F090B',
      bgSurface: '#160C10',
      bgCard: '#1D1016',
      bgCardHover: '#27151E',
      border: '#3D1C28',
      borderHover: '#5C2438',
      accentPrimary: '#E11D48',
      accentHover: '#BE123C',
      accentMuted: 'rgba(225, 29, 72, 0.20)',
      accentSecondary: '#FB7185',
      textPrimary: '#FFF1F2',
      textSecondary: '#FDA4AF',
      textMuted: '#9F1239'
    },
    layout: {
      fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif",
      radius: '0.75rem',
      containerMaxWidth: '80rem',
      cardPadding: '1.25rem'
    },
    customCss: `/* Estilo Vampiro / World of Darkness */
.widget-card, [class*="rounded-2xl"], [class*="rounded-3xl"] {
  box-shadow: 0 4px 20px -2px rgba(225, 29, 72, 0.12);
}
::-webkit-scrollbar-thumb {
  background: #5C2438 !important;
}
::-webkit-scrollbar-thumb:hover {
  background: #E11D48 !important;
}`
  },
  {
    id: 'ancient-gold',
    name: 'Pergaminho & Ouro (D&D Clássico)',
    description: 'Atmosfera de taverna medieval e biblioteca arcana, com tons de bronze, carvalho escuro e ouro velho.',
    colors: {
      bgPrimary: '#12100C',
      bgSurface: '#181510',
      bgCard: '#211C15',
      bgCardHover: '#2B241C',
      border: '#3F3526',
      borderHover: '#5E4E37',
      accentPrimary: '#D97706',
      accentHover: '#B45309',
      accentMuted: 'rgba(217, 119, 6, 0.20)',
      accentSecondary: '#FBBF24',
      textPrimary: '#FEF3C7',
      textSecondary: '#D1C2A5',
      textMuted: '#928065'
    },
    layout: {
      fontFamily: "'Cinzel', 'Plus Jakarta Sans', serif",
      radius: '1.25rem',
      containerMaxWidth: '80rem',
      cardPadding: '1.35rem'
    },
    customCss: `/* Estilo D&D Fantasia Medieval */
.widget-card, [class*="rounded-2xl"] {
  border-color: #3F3526 !important;
  box-shadow: 0 6px 18px -3px rgba(217, 119, 6, 0.08);
}
h1, h2, h3, .font-rpg {
  color: #FBBF24;
}`
  },
  {
    id: 'emerald-grove',
    name: 'Bosque Esmeralda (Ermos / Druídico)',
    description: 'Floresta ancestral, musgo profundo, runas botânicas e acentos verde esmeralda luminosos.',
    colors: {
      bgPrimary: '#0A120E',
      bgSurface: '#0F1A14',
      bgCard: '#15241C',
      bgCardHover: '#1D3026',
      border: '#244534',
      borderHover: '#33634B',
      accentPrimary: '#10B981',
      accentHover: '#059669',
      accentMuted: 'rgba(16, 185, 129, 0.18)',
      accentSecondary: '#34D399',
      textPrimary: '#ECFDF5',
      textSecondary: '#A7F3D0',
      textMuted: '#4B7B63'
    },
    layout: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      radius: '1.25rem',
      containerMaxWidth: '80rem',
      cardPadding: '1.25rem'
    },
    customCss: `/* Estilo Druídico / Ermos */
.widget-card:hover {
  border-color: #33634B !important;
}`
  },
  {
    id: 'abyssal-trench',
    name: 'Costa & Abismo (Costa do Caranguejo)',
    description: 'Profundezas oceânicas, azul marinho abissal e bioluminescência ciano das criaturas das fossas.',
    colors: {
      bgPrimary: '#081017',
      bgSurface: '#0E1822',
      bgCard: '#142230',
      bgCardHover: '#1B2D40',
      border: '#203A50',
      borderHover: '#2E5170',
      accentPrimary: '#06B6D4',
      accentHover: '#0891B2',
      accentMuted: 'rgba(6, 182, 212, 0.18)',
      accentSecondary: '#38BDF8',
      textPrimary: '#ECFEFF',
      textSecondary: '#A5F3FC',
      textMuted: '#51859E'
    },
    layout: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      radius: '1rem',
      containerMaxWidth: '80rem',
      cardPadding: '1.25rem'
    },
    customCss: `/* Estilo Abismo Oceânico */
.widget-card {
  box-shadow: 0 4px 20px -2px rgba(6, 182, 212, 0.08);
}`
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon (Shadowrun / Sci-Fi)',
    description: 'Escuridão futurista de alta densidade, roxo neon elétrico, rosa choque e cantos geométricos afiados.',
    colors: {
      bgPrimary: '#0A0812',
      bgSurface: '#120E20',
      bgCard: '#1A142E',
      bgCardHover: '#231B3D',
      border: '#322557',
      borderHover: '#4C3782',
      accentPrimary: '#A855F7',
      accentHover: '#9333EA',
      accentMuted: 'rgba(168, 85, 247, 0.22)',
      accentSecondary: '#EC4899',
      textPrimary: '#FAF5FF',
      textSecondary: '#E9D5FF',
      textMuted: '#9372B7'
    },
    layout: {
      fontFamily: "'Fira Code', monospace",
      radius: '0.4rem',
      containerMaxWidth: '84rem',
      cardPadding: '1.15rem'
    },
    customCss: `/* Estilo Cyberpunk Neon */
.widget-card {
  border-width: 1.5px !important;
}
button {
  text-transform: uppercase;
  letter-spacing: 0.05em;
}`
  },
  {
    id: 'monochrome-tactical',
    name: 'Monocromático Tático (Clean)',
    description: 'Preto puro e cinzas neutros de alta legibilidade tática sem distrações visuais.',
    colors: {
      bgPrimary: '#101113',
      bgSurface: '#16171A',
      bgCard: '#1D1E22',
      bgCardHover: '#25272C',
      border: '#303238',
      borderHover: '#454850',
      accentPrimary: '#E4E4E7',
      accentHover: '#FFFFFF',
      accentMuted: 'rgba(255, 255, 255, 0.12)',
      accentSecondary: '#A1A1AA',
      textPrimary: '#FAFAFA',
      textSecondary: '#D4D4D8',
      textMuted: '#71717A'
    },
    layout: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      radius: '0.75rem',
      containerMaxWidth: '80rem',
      cardPadding: '1.25rem'
    },
    customCss: `/* Estilo Monocromático Tático */
.widget-card {
  border-color: #303238 !important;
}`
  }
];

interface ThemeContextType {
  currentTheme: RPGTheme;
  themePresets: RPGTheme[];
  availableThemes?: RPGTheme[];
  selectPreset: (themeId: string) => void;
  setTheme?: (themeId: string) => void;
  updateColors: (colors: Partial<ThemeColors>) => void;
  updateLayout: (layout: Partial<ThemeLayout>) => void;
  updateCustomCss: (css: string) => void;
  resetTheme: () => void;
  applyCssSnippet: (snippet: string) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const STORAGE_KEY = 'caranguejorpg_active_theme_config';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<RPGTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.colors && parsed.layout) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved theme:', e);
    }
    return THEME_PRESETS[0];
  });

  // Apply theme variables and custom CSS to the DOM
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(theme));
    } catch (e) {
      console.error('Failed to save theme to localStorage:', e);
    }

    const root = document.documentElement;
    // Set CSS Custom Properties
    root.style.setProperty('--rpg-bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--rpg-bg-surface', theme.colors.bgSurface);
    root.style.setProperty('--rpg-bg-card', theme.colors.bgCard);
    root.style.setProperty('--rpg-bg-card-hover', theme.colors.bgCardHover);
    root.style.setProperty('--rpg-border', theme.colors.border);
    root.style.setProperty('--rpg-border-hover', theme.colors.borderHover);
    root.style.setProperty('--rpg-accent-primary', theme.colors.accentPrimary);
    root.style.setProperty('--rpg-accent-hover', theme.colors.accentHover);
    root.style.setProperty('--rpg-accent-muted', theme.colors.accentMuted);
    root.style.setProperty('--rpg-accent-secondary', theme.colors.accentSecondary);
    root.style.setProperty('--rpg-text-primary', theme.colors.textPrimary);
    root.style.setProperty('--rpg-text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--rpg-text-muted', theme.colors.textMuted);

    root.style.setProperty('--rpg-radius', theme.layout.radius);
    root.style.setProperty('--rpg-container-max-width', theme.layout.containerMaxWidth);
    root.style.setProperty('--rpg-card-padding', theme.layout.cardPadding);
    root.style.setProperty('--rpg-font-family', theme.layout.fontFamily);

    // Apply or update dedicated <style id="rpg-custom-theme-style"> tag
    let styleTag = document.getElementById('rpg-custom-theme-style') as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = 'rpg-custom-theme-style';
      document.head.appendChild(styleTag);
    }

    styleTag.textContent = `
      :root {
        --rpg-bg-primary: ${theme.colors.bgPrimary};
        --rpg-bg-surface: ${theme.colors.bgSurface};
        --rpg-bg-card: ${theme.colors.bgCard};
        --rpg-bg-card-hover: ${theme.colors.bgCardHover};
        --rpg-border: ${theme.colors.border};
        --rpg-border-hover: ${theme.colors.borderHover};
        --rpg-accent-primary: ${theme.colors.accentPrimary};
        --rpg-accent-hover: ${theme.colors.accentHover};
        --rpg-accent-muted: ${theme.colors.accentMuted};
        --rpg-accent-secondary: ${theme.colors.accentSecondary};
        --rpg-text-primary: ${theme.colors.textPrimary};
        --rpg-text-secondary: ${theme.colors.textSecondary};
        --rpg-text-muted: ${theme.colors.textMuted};
        --rpg-radius: ${theme.layout.radius};
        --rpg-container-max-width: ${theme.layout.containerMaxWidth};
        --rpg-card-padding: ${theme.layout.cardPadding};
        --rpg-font-family: ${theme.layout.fontFamily};
      }

      /* 1. Base App & Background */
      html, body, #root, .app-root, .min-h-screen,
      [class*="bg-[#08090A]"], [class*="bg-[#0A0C0E]"], [class*="bg-[#0B0C0E]"],
      [class*="bg-[#0D0F12]"], [class*="bg-[#0F1113]"], [class*="bg-[#0F1115]"],
      [class*="bg-[#101113]"], [class*="bg-[#101215]"] {
        background-color: var(--rpg-bg-primary) !important;
        color: var(--rpg-text-primary) !important;
        font-family: var(--rpg-font-family) !important;
      }

      /* 2. Surfaces (Header, Navigation Bars, Modals Base, Menus, Drawers) */
      header,
      [class*="bg-[#121417]"], [class*="bg-[#121519]"], [class*="bg-[#141619]"],
      [class*="bg-[#15171C]"], [class*="bg-[#16181D]"], [class*="bg-[#171A1F]"],
      [class*="bg-[#181B20]"], .theme-surface {
        background-color: var(--rpg-bg-surface) !important;
        border-color: var(--rpg-border) !important;
      }

      /* 3. Widget Cards, Panels, Inner Containers */
      .widget-card,
      [class*="bg-[#1A1D21]"], [class*="bg-[#1A1D22]"], [class*="bg-[#1A1D23]"],
      [class*="bg-[#1C2026]"], [class*="bg-[#1E232F]"], [class*="bg-[#1F2329]"],
      [class*="bg-[#1F232B]"], .theme-card {
        background-color: var(--rpg-bg-card) !important;
        border-color: var(--rpg-border) !important;
      }

      /* 4. Hovered card rows, secondary surfaces, tags & chips */
      [class*="bg-[#20242B]"], [class*="bg-[#22262B]"], [class*="bg-[#242830]"],
      [class*="bg-[#252830]"], [class*="bg-[#252A33]"], [class*="bg-[#282C34]"],
      [class*="bg-[#282D34]"], [class*="bg-[#2B3037]"], [class*="bg-[#2D3139]"] {
        background-color: var(--rpg-bg-card-hover) !important;
        border-color: var(--rpg-border) !important;
      }

      /* 5. Universal Borders */
      [class*="border-[#16181D]"], [class*="border-[#22262B]"], [class*="border-[#282C34]"],
      [class*="border-[#2D3139]"], [class*="border-[#363B44]"], [class*="border-[#3A3F4A]"],
      [class*="border-[#3D424D]"], [class*="border-[#3D424E]"], [class*="border-[#4A5060]"],
      [class*="border-[#4B5263]"], [class*="border-zinc-800"], [class*="border-zinc-700"] {
        border-color: var(--rpg-border) !important;
      }

      /* 6. Primary Action Buttons */
      [class*="bg-indigo-600"], [class*="bg-indigo-500"], [class*="bg-indigo-700"],
      button.theme-btn-primary, .theme-btn-primary {
        background-color: var(--rpg-accent-primary) !important;
        border-color: var(--rpg-accent-primary) !important;
        color: #FFFFFF !important;
      }

      [class*="hover:bg-indigo-500"]:hover,
      [class*="hover:bg-indigo-600"]:hover {
        background-color: var(--rpg-accent-hover) !important;
        border-color: var(--rpg-accent-hover) !important;
      }

      /* 7. Active Navigation Tabs, Pills, and Badges */
      [class*="bg-indigo-600/35"], [class*="bg-indigo-600/25"], [class*="bg-indigo-600/20"],
      [class*="bg-indigo-600/15"], [class*="bg-indigo-600/10"], [class*="bg-indigo-950/40"],
      [class*="bg-indigo-950/50"], [class*="bg-indigo-950/60"], [class*="bg-indigo-950/70"],
      [class*="bg-indigo-950/30"], [class*="bg-indigo-950/20"], [class*="bg-indigo-500/20"],
      [class*="bg-indigo-500/15"], [class*="bg-indigo-500/10"], [class*="bg-indigo-500/30"],
      .theme-nav-active {
        background-color: var(--rpg-accent-muted) !important;
        border-color: var(--rpg-accent-primary) !important;
        color: var(--rpg-text-primary) !important;
      }

      /* 8. Accent Icons, Labels, Text and Highlights */
      [class*="text-indigo-400"], [class*="text-indigo-300"], [class*="text-indigo-200"],
      [class*="text-indigo-100"], [class*="text-indigo-500"], [class*="text-indigo-600"],
      .theme-text-accent {
        color: var(--rpg-accent-primary) !important;
      }

      [class*="hover:text-indigo-300"]:hover,
      [class*="hover:text-indigo-200"]:hover {
        color: var(--rpg-accent-hover) !important;
      }

      /* 9. Accent Borders and Focus Rings */
      [class*="border-indigo-400"], [class*="border-indigo-500"], [class*="border-indigo-600"],
      [class*="focus:border-indigo-500"]:focus, [class*="focus:ring-indigo-500"]:focus,
      [class*="ring-indigo-500"] {
        border-color: var(--rpg-accent-primary) !important;
      }

      /* 10. Form Inputs, Textareas, Selects & Sliders */
      input[type="text"],
      input[type="number"],
      input[type="search"],
      input[type="password"],
      input[type="url"],
      textarea,
      select {
        background-color: var(--rpg-bg-surface) !important;
        color: var(--rpg-text-primary) !important;
        border-color: var(--rpg-border) !important;
        border-radius: var(--rpg-radius) !important;
      }

      input::placeholder,
      textarea::placeholder {
        color: var(--rpg-text-muted) !important;
      }

      input:focus,
      textarea:focus,
      select:focus {
        border-color: var(--rpg-accent-primary) !important;
        outline: none !important;
        box-shadow: 0 0 0 2px var(--rpg-accent-muted) !important;
      }

      input[type="range"] {
        accent-color: var(--rpg-accent-primary) !important;
      }

      input[type="checkbox"],
      input[type="radio"] {
        accent-color: var(--rpg-accent-primary) !important;
      }

      /* 11. Text Hierarchy */
      [class*="text-[#FFFFFF]"], [class*="text-white"], [class*="text-zinc-100"],
      [class*="text-[#E0E0E0]"] {
        color: var(--rpg-text-primary) !important;
      }

      [class*="text-[#D0D4DC]"], [class*="text-[#D0D7DE]"], [class*="text-[#C9D1D9]"],
      [class*="text-[#CCCCCC]"], [class*="text-[#B0B8C4]"], [class*="text-[#A0A6B2]"],
      [class*="text-[#A0AEC0]"], [class*="text-[#9E9E9E]"], [class*="text-zinc-300"],
      [class*="text-zinc-400"] {
        color: var(--rpg-text-secondary) !important;
      }

      [class*="text-[#8E95A5]"], [class*="text-[#808796]"], [class*="text-[#6E7681]"],
      [class*="text-[#4E5460]"], [class*="text-[#4B5263]"], [class*="text-zinc-500"] {
        color: var(--rpg-text-muted) !important;
      }

      /* 12. Font Family Hierarchy */
      h1, h2, h3, .font-rpg {
        font-family: var(--rpg-font-family) !important;
        letter-spacing: 0.02em;
      }

      /* 13. Container Max-Width */
      .max-w-7xl, .max-w-\[1600px\] {
        max-width: var(--rpg-container-max-width) !important;
      }

      /* 14. Card Border Radius */
      .widget-card,
      [class*="rounded-2xl"],
      [class*="rounded-3xl"] {
        border-radius: var(--rpg-radius) !important;
      }

      /* 15. Custom Scrollbars */
      ::-webkit-scrollbar-track {
        background: var(--rpg-bg-surface) !important;
      }

      ::-webkit-scrollbar-thumb {
        background: var(--rpg-border) !important;
      }

      ::-webkit-scrollbar-thumb:hover {
        background: var(--rpg-accent-primary) !important;
      }

      /* 16. Selection */
      ::selection {
        background-color: var(--rpg-accent-muted) !important;
        color: var(--rpg-text-primary) !important;
      }

      /* 17. User Custom Injected CSS */
      ${theme.customCss || ''}
    `;
  }, [theme]);

  const selectPreset = (themeId: string) => {
    const found = THEME_PRESETS.find(t => t.id === themeId);
    if (found) {
      setTheme(found);
    }
  };

  const updateColors = (colors: Partial<ThemeColors>) => {
    setTheme(prev => ({
      ...prev,
      colors: {
        ...prev.colors,
        ...colors
      }
    }));
  };

  const updateLayout = (layout: Partial<ThemeLayout>) => {
    setTheme(prev => ({
      ...prev,
      layout: {
        ...prev.layout,
        ...layout
      }
    }));
  };

  const updateCustomCss = (css: string) => {
    setTheme(prev => ({
      ...prev,
      customCss: css
    }));
  };

  const resetTheme = () => {
    setTheme(THEME_PRESETS[0]);
  };

  const applyCssSnippet = (snippet: string) => {
    setTheme(prev => ({
      ...prev,
      customCss: (prev.customCss ? `${prev.customCss}\n\n` : '') + snippet
    }));
  };

  return (
    <ThemeContext.Provider
      value={{
        currentTheme: theme,
        themePresets: THEME_PRESETS,
        availableThemes: THEME_PRESETS,
        selectPreset,
        setTheme: selectPreset,
        updateColors,
        updateLayout,
        updateCustomCss,
        resetTheme,
        applyCssSnippet
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};

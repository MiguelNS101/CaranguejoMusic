import React, { useState } from 'react';
import {
  HelpCircle,
  X,
  Compass,
  Music,
  CloudRain,
  Volume2,
  Swords,
  Dices,
  Bot,
  Terminal,
  Shield,
  Layers,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  FolderOpen,
  Timer,
  BookOpen,
  Coins,
  Sun,
  FileText,
  Image,
  Maximize2,
  Grid,
  Users,
  MessageSquare,
  Paintbrush,
  Columns,
  TestTube,
  Palette,
  Scissors,
  Lock,
  Send,
  Eye,
  Sliders,
  Copy
} from 'lucide-react';

interface AppTutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDiscordConfig?: () => void;
  onOpenFolderImport?: () => void;
}

export const AppTutorialModal: React.FC<AppTutorialModalProps> = ({
  isOpen,
  onClose,
  onOpenDiscordConfig,
  onOpenFolderImport
}) => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'audio' | 'widgets' | 'paint' | 'chat_reader' | 'discord' | 'commands' | 'tests'
  >('overview');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#16181D] border border-[#2D3139] rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden text-zinc-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#282C34] flex items-center justify-between bg-gradient-to-r from-indigo-950/40 via-[#1A1D21] to-[#16181D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-md">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white font-rpg tracking-wide flex items-center gap-2">
                Manual Completo & Guia da Mesa RPG
              </h2>
              <p className="text-xs text-zinc-400">
                Aprenda a operar o estúdio de pintura, leitor do Discord, áudio, escudo 2D, roletas e testes automatizados.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition-colors cursor-pointer"
            title="Fechar Manual"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1.5 px-4 sm:px-5 py-2.5 bg-[#121417] border-b border-[#282C34] overflow-x-auto no-scrollbar shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>1. Visão Geral</span>
          </button>

          <button
            onClick={() => setActiveTab('audio')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audio'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Music className="w-3.5 h-3.5" />
            <span>2. Áudio & Mixer</span>
          </button>

          <button
            onClick={() => setActiveTab('widgets')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'widgets'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>3. Escudo & Módulos</span>
          </button>

          <button
            onClick={() => setActiveTab('paint')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'paint'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Paintbrush className="w-3.5 h-3.5 text-indigo-400" />
            <span className="flex items-center gap-1">
              4. Desenho & Paint
              <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-[9px] text-indigo-300 font-bold uppercase">Novo</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('chat_reader')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'chat_reader'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="flex items-center gap-1">
              5. Chat & Multi-Abas
              <span className="px-1 py-0.2 rounded bg-indigo-500/30 text-[9px] text-indigo-300 font-bold uppercase">Novo</span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('discord')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'discord'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>6. Conexão Discord</span>
          </button>

          <button
            onClick={() => setActiveTab('commands')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'commands'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>7. Comandos</span>
          </button>

          <button
            onClick={() => setActiveTab('tests')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'tests'
                ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800/60'
            }`}
          >
            <TestTube className="w-3.5 h-3.5 text-emerald-400" />
            <span className="flex items-center gap-1">
              8. Testes do App
              <span className="px-1 py-0.2 rounded bg-emerald-500/30 text-[9px] text-emerald-300 font-bold uppercase">v2.0</span>
            </span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-zinc-300 leading-relaxed">
          {/* TAB 1: VISÃO GERAL */}
          {activeTab === 'overview' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Bem-vindo ao CaranguejoRPG
                </h3>
                <p className="text-xs text-zinc-300">
                  O CaranguejoRPG é uma estação completa para o Mestre de RPG de Mesa. Ele une trilhas sonoras orquestradas, loops de som ambiente (chuva, taverna, caverna), efeitos instantâneos (SFX), rolador de dados (D&D e WoD), gerador de encontros aleatórios e uma roleta de probabilidades — tudo integrado nativamente ao canal de voz e texto do Discord.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5 text-indigo-400" />
                    Dois Canais de Áudio
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Toque música e som ambiente simultaneamente. Cada um possui volume independente no Mixer.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Swords className="w-3.5 h-3.5 text-red-400" />
                    Escudo Modular 2D
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Organize widgets livremente na grade de 12 colunas, oculte o que não usar e redimensione blocos.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                  <h4 className="font-bold text-white text-xs flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5 text-emerald-400" />
                    Bot do Discord Nativo
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Sem necessidade de bots públicos instáveis. Transmita o áudio da mesa diretamente para o canal de voz.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider">Como Começar Rapidamente:</h4>
                <ol className="list-decimal list-inside space-y-1.5 text-xs text-zinc-300">
                  <li><strong>Importar Músicas e Ambientes:</strong> Use o botão <em>"Pastas Locais"</em> ou arraste seus arquivos <code>.mp3</code> ou <code>.wav</code> direto na tela.</li>
                  <li><strong>Conectar ao Discord:</strong> Clique no botão do Discord no topo, informe seu Bot Token e IDs de canais para começar a transmitir áudio.</li>
                  <li><strong>Usar o Escudo do Mestre:</strong> Acesse a aba principal para rolar dados, criar encontros e girar a roleta durante o jogo.</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: MÚSICAS & AMBIENTAÇÃO */}
          {activeTab === 'audio' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <CloudRain className="w-4 h-4 text-emerald-400" />
                  Separação entre Músicas e Ambientação
                </h3>
                <p className="text-xs text-zinc-300">
                  O CaranguejoRPG possui dois motores independentes de reprodução que podem tocar ao mesmo tempo:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-[#282C34] space-y-1">
                    <span className="font-bold text-indigo-400 text-xs flex items-center gap-1.5">
                      <Music className="w-3.5 h-3.5" /> 1. Trilha Sonora (Aba Músicas)
                    </span>
                    <p className="text-xs text-zinc-400">
                      Músicas orquestradas, temas de batalha, suspense e exploração. Permite fila de reprodução, crossfade e troca rápida de faixas.
                    </p>
                  </div>
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-[#282C34] space-y-1">
                    <span className="font-bold text-emerald-400 text-xs flex items-center gap-1.5">
                      <CloudRain className="w-3.5 h-3.5" /> 2. Som Ambiente (Aba Ambientação)
                    </span>
                    <p className="text-xs text-zinc-400">
                      Loops contínuos de chuva, vento na montanha, murmúrio de taverna, fogo estalando e criptas assombradas.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-2">
                <h4 className="font-bold text-white text-xs uppercase tracking-wider flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-amber-400" />
                  O Mixer de Áudio
                </h4>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Clique no botão <strong>"Mixer"</strong> no cabeçalho a qualquer momento para balancear os volumes:
                </p>
                <ul className="space-y-1 text-xs text-zinc-400 list-disc list-inside">
                  <li><strong>Volume Geral (Master):</strong> Ajusta o volume total enviado ao canal de voz e aos alto-falantes.</li>
                  <li><strong>Faixa Musical:</strong> Permite deixar a música de combate mais alta ou mais baixa.</li>
                  <li><strong>Faixa de Ambientação:</strong> Deixe o barulho de chuva suave no fundo enquanto a conversa acontece.</li>
                  <li><strong>Faixa de SFX:</strong> Volume dedicado para explosões, golpes e magias do Soundboard.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: WIDGETS & FERRAMENTAS */}
          {activeTab === 'widgets' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/20 border border-indigo-500/30 space-y-1.5">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Guia Detalhado dos Módulos do Escudo do Mestre
                </h3>
                <p className="text-xs text-zinc-300">
                  O Escudo do Mestre é uma central de comando modular 2D construída em uma grade de 12 colunas. Cada módulo foi projetado para rodar com zero latência durante a sessão. Abaixo está o funcionamento completo de cada ferramenta disponível:
                </p>
              </div>

              {/* Seção 1: Combate & Dinâmica */}
              <div className="space-y-2.5">
                <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Swords className="w-3.5 h-3.5" /> 1. Combate & Dinâmica de Ação
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Iniciativa */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-rose-300">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        Rastreador de Combate & Iniciativa
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 a 12 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Gerencie turnos de jogadores e monstros. Permite cadastrar participantes, valores de <strong>Iniciativa</strong>, <strong>PV Atual / Máximo</strong> com barra de vida em tempo real e <strong>Classe de Armadura (CA)</strong>.
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li><strong>Ordenação Automática:</strong> Um clique organiza todos da maior para a menor iniciativa.</li>
                      <li><strong>Contador de Rodadas:</strong> O botão de avançar turno contabiliza o número de rodadas decorridas.</li>
                      <li><strong>Status e Condições:</strong> Marque personagens caídos, inconscientes ou com desvantagens.</li>
                    </ul>
                  </div>

                  {/* Rolador Híbrido */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-indigo-300">
                        <Dices className="w-3.5 h-3.5 text-indigo-400" />
                        Rolador Híbrido (WoD D10 + D&D Poliédrico)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 a 12 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Suporte nativo duplo com física de números aleatórios de alta precisão:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li><strong>Mundo das Trevas (WoD):</strong> Rola até 30d10, calcula sucessos contra Dificuldade Alvo (padrão 7), explode os 10s e subtrai os 1s (falhas críticas).</li>
                      <li><strong>Keen Roll:</strong> Modo especial onde 9s e 10s ativam sucessos críticos dobrados.</li>
                      <li><strong>Poliédricos Tradicionais:</strong> Rola d4, d6, d8, d10, d12, d20 e d100 com modificador (+/-) e soma instantânea.</li>
                      <li><strong>Publicação no Discord:</strong> Envia o resultado detalhado diretamente no canal de texto.</li>
                    </ul>
                  </div>

                  {/* Cronômetros Múltiplos */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-amber-300">
                        <Timer className="w-3.5 h-3.5 text-amber-400" />
                        Cronômetros de Tochas & Concentração
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">4 a 6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Dispare múltiplos timers simultâneos para manter a tensão temporal na mesa:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li>Predefinições prontas para <strong>Tocha (60 min)</strong>, <strong>Magia de 10 min</strong> e <strong>Concentração (1 min / 10 turnos)</strong>.</li>
                      <li>Alertas sonoros e visuais quando o tempo se esgota.</li>
                      <li>Pausa, reinício e adição de minutos sob demanda.</li>
                    </ul>
                  </div>

                  {/* Narração Atmosférica */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-emerald-300">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        Narração Atmosférica no Discord
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Envie descrições imersivas formatadas como pergaminho ou caixa de fala no Discord:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li><strong>Moldura Solene:</strong> Texto em itálico de alto impacto visual no chat de texto.</li>
                      <li><strong>Caixa de Aviso:</strong> Destaques de pistas, mensagens cifradas e avisos urgentes aos jogadores.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seção 2: Geradores & Sorteio */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 2. Geradores Paramétricos & Sorteios
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Gerador de Encontros */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-rose-300">
                        <Swords className="w-3.5 h-3.5 text-rose-400" />
                        Gerador de Encontros Aleatórios
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 a 12 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Crie encontros instantâneos e balanceados com estatísticas completas:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li><strong>Parâmetros:</strong> Nível do grupo (1 a 20), bioma (floresta, masmorra, cidade, caverna, montanha, pântano, deserto, aquático, esgoto, planar), densidade (chefe solo, patrulha ou horda) e dificuldade.</li>
                      <li><strong>Estatísticas Prontas:</strong> PV, CA, ND e habilidades táticas de cada criatura.</li>
                      <li><strong>Perigos de Terreno:</strong> Armadilhas naturais, desmoronamentos, fumaça e lama.</li>
                      <li><strong>Botão "Mandar no Chat":</strong> Publica o encontro em embed estilizado no Discord.</li>
                    </ul>
                  </div>

                  {/* Roleta Customizável */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-amber-300">
                        <Dices className="w-3.5 h-3.5 text-amber-400" />
                        Roleta Customizável de Porcentagens
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 a 12 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Sorteador visual interativo com proporções geométricas exatas:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li><strong>Porcentagens Flexíveis:</strong> Adicione fatias com nomes, pesos e cores personalizadas. Inclui botão de normalização automática para 100%.</li>
                      <li><strong>Predefinições Rápidas:</strong> Destino do Herói (Sorte vs Desastre), Alvo do Ataque (Tanque, Conjurador, Suporte), Clima de Viagem e Tensão & Sanidade.</li>
                      <li><strong>Envio ao Discord:</strong> Publica o resultado sorteado e a probabilidade exata da fatia.</li>
                    </ul>
                  </div>

                  {/* Gerador de Tesouros */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-yellow-300">
                        <Coins className="w-3.5 h-3.5 text-yellow-400" />
                        Gerador de Tesouros & Espólios (Loot)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Gere recompensas imediatas de acordo com a escala de poder dos personagens:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li>Distribui moedas em <strong>Peças de Ouro (PO)</strong>, <strong>Prata (PP)</strong> e <strong>Cobre (PC)</strong>.</li>
                      <li>Sorteia gemas preciosas lapidadas, artefatos mundanos e itens mágicos menores.</li>
                      <li>Filtro por patamar de nível (Tier 1 a Tier 4).</li>
                    </ul>
                  </div>

                  {/* Relógio de Viagem e Clima */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-cyan-300">
                        <Sun className="w-3.5 h-3.5 text-cyan-400" />
                        Relógio de Campanha, Clima & Viagem
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Mantenha a contagem de tempo e as intempéries naturais da aventura:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li>Período do dia (Alvorecer, Meio-dia, Entardecer, Noite e Madrugada).</li>
                      <li>Clima dinâmico (Céu Limpo, Vento Forte, Tempestade, Névoa Espessa ou Neve).</li>
                      <li>Impactos mecânicos sugeridos para visibilidade e deslocamento terrestre.</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Seção 3: Consulta & Referência */}
              <div className="space-y-2.5 pt-2">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> 3. Referência Rápida & Gestão de NPCs
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Dicionário de Regras */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-indigo-300">
                        <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
                        Regras Rápidas & Condições de Combate
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Guia rápido de consulta das regras mais esquecidas de D&D e RPGs d20:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li>Condições completas: Cego, Encantado, Ensurdecido, Amedrontado, Agarrado, Incapacitado, Invisível, Paralisado, Petrificado, Envenenado, Caído, Contido, Atordoado e Inconsciente.</li>
                      <li>Ações especiais de combate: Desengajar, Ajudar, Esconder, Esquivar e Preparar Ação.</li>
                      <li>Regras para testes de morte e estabilização de aliados.</li>
                    </ul>
                  </div>

                  {/* Galeria de NPCs */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-purple-300">
                        <Users className="w-3.5 h-3.5 text-purple-400" />
                        Fichas Rápidas de NPCs
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Lista compacta com retratos e estatísticas dos personagens do mestre:
                    </p>
                    <ul className="text-[11px] text-zinc-400 space-y-1 list-disc list-inside">
                      <li>Visualização rápida de PV, CA, alinhamento e notas de voz e personalidade.</li>
                      <li><strong>Falar como NPC:</strong> Publica a fala no chat do Discord com o nome e o avatar do personagem.</li>
                    </ul>
                  </div>

                  {/* Bloco de Notas */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-zinc-200">
                        <FileText className="w-3.5 h-3.5 text-zinc-400" />
                        Bloco de Notas Rápidas (Scratchpad)
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">4 a 6 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Espaço de rascunho com salvamento contínuo no navegador para anotar nomes improvisados, pistas misteriosas, segredos revelados e iniciativa improvisada.
                    </p>
                  </div>

                  {/* Visualizador de Mapas */}
                  <div className="p-3.5 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white text-xs flex items-center gap-1.5 text-sky-300">
                        <Image className="w-3.5 h-3.5 text-sky-400" />
                        Visualizador de Mapas & Handouts
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono">6 a 12 cols</span>
                    </div>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Exiba mapas de masmorras, cartas misteriosas ou retratos de monstros fixos na tela do mestre, com suporte a zoom e rotação de imagens.
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 4: Controles de Áudio & Grade 2D */}
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-2.5 pt-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Grid className="w-3.5 h-3.5 text-indigo-400" /> 4. Operação da Grade 2D & Personalização
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-zinc-300">
                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <strong className="text-white block flex items-center gap-1">
                      <Maximize2 className="w-3 h-3 text-indigo-400" /> Modo Foco (Tela Cheia)
                    </strong>
                    <span className="text-[11px] text-zinc-400">
                      Clique no ícone de expansão no cabeçalho de qualquer widget para abri-lo em um modal maximizado sem distrações.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <strong className="text-white block flex items-center gap-1">
                      <Grid className="w-3 h-3 text-emerald-400" /> Largura e Altura Dinâmica
                    </strong>
                    <span className="text-[11px] text-zinc-400">
                      Use o menu de opções dos widgets para alternar entre 1/4, 1/3, 1/2 ou largura total (12 colunas), ou arraste a borda inferior para regular a altura.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <strong className="text-white block flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" /> Grade Automática & Presets
                    </strong>
                    <span className="text-[11px] text-zinc-400">
                      O botão "Grade Automática" empilha e alinha os blocos em colunas perfeitas caso você faça muitas alterações manuais.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ESTÚDIO DE DESENHO & PAINT MULTI-CAMADAS */}
          {activeTab === 'paint' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/30 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Paintbrush className="w-4 h-4 text-indigo-400" />
                  Estúdio de Desenho Tático & Paint Multi-Camadas
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  O <strong>Desenhar & Paint</strong> transforma o escudo em uma mesa tática digital completa. Crie mapas de combate, esboce armadilhas, posicione tokens de criaturas e envie a arte diretamente para o Discord dos jogadores.
                </p>
              </div>

              {/* Seção 1: Sistema de Camadas Z-Index */}
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-3">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-400" /> 1. Sistema Profissional de Camadas (Layers Z-Index)
                  </h4>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-900/40 text-indigo-300 font-semibold border border-indigo-500/30">
                    Pilha Independente
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-zinc-800/80 space-y-1.5">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-indigo-400" />
                      + Nova Camada & Empilhamento
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Cada camada funciona como uma folha de acetato transparente independente. Você pode desenhar o mapa na camada de baixo, um grid tático no meio e anotações ou monstros na camada superior.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-zinc-800/80 space-y-1.5">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />
                      Trazer para Frente / Trazer para Trás
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Use os botões de reordenação para mover a camada ativa 1 nível para cima ou para baixo, ou use os atalhos de salto rápido para enviá-la diretamente para o Topo Máximo ou Fundo Máximo.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-zinc-800/80 space-y-1.5">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      Opacidade Individual (0% a 100%)
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      Cada camada possui seu próprio slider de opacidade. Ideal para simular névoa de guerra translúcida, raios de luar, auras de magia ou demarcação semitransparente de áreas de efeito.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-zinc-800/80 space-y-1.5">
                    <span className="font-bold text-indigo-300 text-xs flex items-center gap-1.5">
                      <Lock className="w-3.5 h-3.5 text-amber-400" />
                      Bloquear (Cadeado) & Ocultar (Olho)
                    </span>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      <strong>Cadeado:</strong> Bloqueia a camada para evitar riscos acidentais após terminar o mapa de fundo. <strong>Olho:</strong> Oculte elementos ou armadilhas secretas e torne-os visíveis apenas na hora da revelação!
                    </p>
                  </div>
                </div>
              </div>

              {/* Seção 2: Ferramentas de Traçado & Seleção */}
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Paintbrush className="w-3.5 h-3.5 text-amber-400" /> 2. Ferramentas de Desenho, Formas & Seleção
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs text-zinc-300">
                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">Pincel & Borracha</span>
                    <span className="text-[11px] text-zinc-400">
                      Espessura de 1 a 64 pixels, suavização anti-aliasing e seletor rápido de paleta de cores ou código HEX personalizado.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">Linhas & Setas Táticas</span>
                    <span className="text-[11px] text-zinc-400">
                      Trace retas exatas ou setas táticas para ilustrar vetores de movimento, rajadas de flechas ou direção do vento.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">Retângulos & Círculos</span>
                    <span className="text-[11px] text-zinc-400">
                      Geometrias precisas com opção de contorno oco ou preenchimento total. Essencial para áreas de explosão (Bola de Fogo).
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block flex items-center gap-1">
                      <Scissors className="w-3 h-3 text-indigo-400" /> Cortar & Seleção (Marquee)
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Delimite uma área retangular na tela para: <strong>Mover</strong> (recorta e flutua), <strong>Duplicar</strong> (clona a região) ou <strong>Apagar</strong>.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">Texto na Tela</span>
                    <span className="text-[11px] text-zinc-400">
                      Clique no canvas para escrever rótulos elegantes, numerações de salas ("Sala 14 - Cripta") e avisos aos jogadores.
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1">
                    <span className="font-bold text-white block">Grade & Grid Tático</span>
                    <span className="text-[11px] text-zinc-400">
                      Sobreponha um quadriculado de combate com tamanho configurável (20 a 100px) e opacidade regulável para alinhamento tático.
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção 3: Manipulação de Imagens & Postagem no Discord */}
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-emerald-400" /> 3. Importação de Tokens & Postagem no Discord
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-zinc-300">
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1.5">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <Image className="w-3.5 h-3.5" /> Manipulação Livre de Imagens
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      Clique em <strong>+ Imagem</strong> para carregar PNGs ou JPGs de tokens, monstros ou mapas. Use o painel flutuante para redimensionar (com travamento de proporção opcional), girar em graus, espelhar horizontalmente/verticalmente e aplicar filtros visuais (Brilho, Contraste, Saturação, Sépia ou Inversão).
                    </p>
                    <span className="text-[10px] text-zinc-500 block">
                      Dica: Clique em "Fixar na Camada Atual" ou "Criar Nova Camada" quando posicionar o token!
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-zinc-800 space-y-1.5">
                    <span className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <Send className="w-3.5 h-3.5" /> Enviar ao Discord em Tempo Real
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      O botão <strong>Enviar ao Discord</strong> compõe automaticamente todas as camadas visíveis em um PNG de altíssima fidelidade e transmite o arquivo diretamente para o canal de texto de sua escolha no servidor do Discord, com uma legenda ou aviso de narrativa acoplado.
                    </p>
                    <span className="text-[10px] text-zinc-500 block">
                      Os jogadores visualizam instantaneamente o mapa ou pistas no chat do Discord sem precisar de plataformas pesadas externas.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: LEITOR DO DISCORD COM MULTI-ABAS & SPLIT-VIEW */}
          {activeTab === 'chat_reader' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/25 border border-indigo-500/30 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  Leitor de Chat do Discord com Multi-Abas & Dividir Tela
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Monitore a conversa dos jogadores, rolagens de dados de bots e sussurros secretos sem precisar sair do painel do mestre.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                  <span className="font-bold text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Columns className="w-3.5 h-3.5" /> Sistema de Multi-Abas de Canais
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Você não precisa ficar alternando canais manualmente:
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li>Clique em <strong>+ Aba</strong> para abrir novos canais simultaneamente no topo do leitor (ex: <code>#chat-geral</code>, <code>#rolagens</code>, <code>#sussurros</code>).</li>
                    <li>Cada aba mantém seu próprio histórico de mensagens e estado de leitura.</li>
                    <li>Feche abas desnecessárias com um clique no botão <strong>X</strong>.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                  <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Columns className="w-3.5 h-3.5" /> Dividir Tela (Split-View)
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Ative o botão <strong>Dividir Tela</strong> para exibir dois canais do Discord lado a lado na mesma tela!
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Painel Esquerdo:</strong> Acompanhe o canal público de interpretação dos jogadores.</li>
                    <li><strong>Painel Direito:</strong> Monitore o canal secreto de rolagens de dados, comandos do mestre ou sussurros.</li>
                    <li>Controle de canal independente em cada lado da divisão.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                  <span className="font-bold text-amber-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5" /> Cores Personalizadas por Jogador
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Facilite a leitura rápida durante combates e diálogos caóticos atribuindo cores customizadas aos participantes:
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li>Clique no avatar ou nome do jogador no chat para abrir o seletor de cor.</li>
                    <li>Escolha uma cor temática (ex: Dourado para Paladino, Verde para Ladino, Vermelho para o Mestre).</li>
                    <li>As cores são salvas na memória persistente do seu navegador.</li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                  <span className="font-bold text-sky-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" /> Sincronização & Busca em Tempo Real
                  </span>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Recursos automáticos de produtividade:
                  </p>
                  <ul className="text-xs text-zinc-400 space-y-1.5 list-disc list-inside">
                    <li><strong>Rolagem Automática (Auto-Scroll):</strong> Rola suavemente para baixo quando chegam novas mensagens.</li>
                    <li><strong>Barra de Busca:</strong> Localize mensagens antigas, pistas digitadas ou rolagens passadas por texto ou nome do jogador.</li>
                    <li><strong>Renderização de Embeds:</strong> Visualização nativa de rolagens formatadas e avisos do CaranguejoBot.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: CONFIGURAÇÃO DO DISCORD */}
          {activeTab === 'discord' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/40 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Bot className="w-4 h-4 text-indigo-400" />
                  Instalação de Guilda & Permissões do Bot
                </h3>
                <p className="text-xs text-zinc-300">
                  Os usuários podem adicionar seu app a uma guilda, dando a ele permissões para realizar ações nessa guilda. Siga atentamente as configurações no <strong>Discord Developer Portal</strong>:
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                  <h4 className="font-bold text-indigo-400 text-xs uppercase tracking-wider">
                    Escopos Obrigatórios (Scopes)
                  </h4>
                  <ul className="space-y-1.5 text-xs">
                    <li className="p-2 rounded bg-zinc-900 border border-zinc-800 text-white font-mono">
                      <strong className="text-emerald-400">✓ applications.commands</strong> — Permite comandos de barra e interações
                    </li>
                    <li className="p-2 rounded bg-zinc-900 border border-zinc-800 text-white font-mono">
                      <strong className="text-emerald-400">✓ bot</strong> — Adiciona o bot como membro no servidor
                    </li>
                  </ul>
                </div>

                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2">
                  <h4 className="font-bold text-amber-400 text-xs uppercase tracking-wider">
                    Permissões Necessárias (Bot Permissions)
                  </h4>
                  <ul className="space-y-1 text-xs text-zinc-300">
                    <li className="flex items-center gap-1.5">✓ <strong>Conectar</strong> (Connect ao canal de voz)</li>
                    <li className="flex items-center gap-1.5">✓ <strong>Enviar mensagens</strong> (Send Messages no chat)</li>
                    <li className="flex items-center gap-1.5">✓ <strong>Usar comandos de barra</strong> (Use Slash Commands)</li>
                    <li className="flex items-center gap-1.5">✓ <strong>Ver canais</strong> (View Channels)</li>
                    <li className="flex items-center gap-1.5">✓ <strong>Ver histórico de mensagens</strong> (Read History)</li>
                  </ul>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/30 text-amber-200 text-xs space-y-1">
                <strong>⚠️ Ative as Privileged Gateway Intents:</strong>
                <p className="text-zinc-300 text-[11px]">
                  No Discord Developer Portal, na aba <strong>Bot</strong>, role até <strong>Privileged Gateway Intents</strong> e ative <strong>Message Content Intent</strong>. Sem isso, o bot não conseguirá ler rolagens de dados ou o comando <code>\caranguejo</code>.
                </p>
              </div>

              {onOpenDiscordConfig && (
                <button
                  onClick={() => {
                    onClose();
                    onOpenDiscordConfig();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Bot className="w-4 h-4" />
                  Abrir Configurações do Discord Agora
                </button>
              )}
            </div>
          )}

          {/* TAB 5: COMANDOS DO DISCORD */}
          {activeTab === 'commands' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-[#141619] border border-[#2D3139] space-y-3">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-orange-400" />
                  Comandos de Chat no Discord
                </h3>
                <p className="text-xs text-zinc-400">
                  Os jogadores e o Mestre podem digitar estes comandos diretamente em qualquer canal de texto que o bot tenha acesso:
                </p>

                <div className="space-y-2 text-xs">
                  {/* Crab Command */}
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-orange-500/30 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-orange-400 text-sm">🦀 \caranguejo</span>
                      <span className="text-[10px] text-zinc-400">ou !caranguejo, /caranguejo</span>
                    </div>
                    <p className="text-zinc-300">
                      Sorteia e posta uma curiosidade científica fascinante sobre caranguejos, com categoria biológica e um <strong>Gancho de Campanha para o RPG</strong> (RPG Hook)!
                    </p>
                    <span className="text-[11px] text-zinc-500 block">
                      Dica: você também pode digitar <code>\caranguejo 3</code> para ver uma curiosidade específica.
                    </span>
                  </div>

                  {/* Help Command */}
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-[#2D3139] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-indigo-400 text-sm">📖 \help (ou \ajuda)</span>
                      <span className="text-[10px] text-zinc-400">Manual completo no Discord</span>
                    </div>
                    <p className="text-zinc-300">
                      Exibe no chat a lista de comandos, sintetizador de dados e recursos do bot.
                    </p>
                  </div>

                  {/* Dice Rolls */}
                  <div className="p-3 rounded-xl bg-[#1A1D21] border border-[#2D3139] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-emerald-400 text-sm">🎲 \r [dados] (ou \kr [dados])</span>
                      <span className="text-[10px] text-zinc-400">Storyteller / Vampiro</span>
                    </div>
                    <p className="text-zinc-300">
                      Rola dados D10 do Mundo das Trevas com cálculo automático de sucessos (7+), 10s explodindo e cancelamento no 1.
                    </p>
                    <span className="text-[11px] text-zinc-500 block">
                      Exemplo: <code>\r 7d10 Ataque com Garras</code> ou <code>\kr 8d10 Tiro Certeiro</code>.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: SISTEMA DE TESTES AUTOMATIZADOS */}
          {activeTab === 'tests' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <TestTube className="w-4 h-4 text-emerald-400" />
                  Sistema de Testes Automatizados & Verificação Contínua
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  O CaranguejoRPG agora conta com uma suíte completa de testes automatizados alimentada por <strong>Vitest</strong> e <strong>TypeScript</strong>. Ela valida as regras de negócio críticas do app para garantir que nada quebre durante o desenvolvimento, customização ou build de produção.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* Comandos de Terminal */}
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                  <span className="font-bold text-emerald-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" /> Comandos de Execução
                  </span>
                  <div className="space-y-2 text-xs">
                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 font-mono">
                      <div className="text-emerald-400 font-bold">npm test</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Executa todos os testes unitários e de integração em modo rápido (CI/build).</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 font-mono">
                      <div className="text-sky-400 font-bold">npm run test:watch</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Modo observador: re-executa testes automaticamente ao salvar arquivos modificados.</div>
                    </div>
                    <div className="p-2 rounded-lg bg-black/40 border border-zinc-800/80 font-mono">
                      <div className="text-amber-400 font-bold">npm run lint</div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">Verificação estrita de tipagem TypeScript sem emitir arquivos (<code>tsc --noEmit</code>).</div>
                    </div>
                  </div>
                </div>

                {/* Status da Cobertura */}
                <div className="p-3.5 rounded-xl bg-[#141619] border border-[#2D3139] space-y-2.5">
                  <span className="font-bold text-indigo-400 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Módulos Críticos Cobertos
                  </span>
                  <ul className="text-xs text-zinc-300 space-y-1.5 list-none">
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Motor WoD D10 (Storyteller):</strong>
                        <span className="text-zinc-400 block text-[11px]">Testa limites de 1 a 100 dados, regra de acerto no 7, Keen Roll (9 e 10), explosão de sucessos e cancelamento de sucessos por falhas críticas (1s).</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Parser & Rolador D&D (d20, d6, d100):</strong>
                        <span className="text-zinc-400 block text-[11px]">Validação de expressões como <code>1d20+5</code>, <code>2d6-2</code>, detecção de 20 Natural e 1 Natural.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Gerenciador de Camadas Z-Index:</strong>
                        <span className="text-zinc-400 block text-[11px]">Reordenação, saltos ao topo/fundo, clamp seguro de opacidade e proteção contra deleção da última camada.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Roleta de Probabilidades & Slices:</strong>
                        <span className="text-zinc-400 block text-[11px]">Normalização estrita para exatamente 100% e cálculo de ângulo do ponteiro.</span>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-emerald-400 mt-0.5 font-bold">✓</span>
                      <div>
                        <strong className="text-white">Cores dos Jogadores & Curiosidades:</strong>
                        <span className="text-zinc-400 block text-[11px]">Cores determinísticas e validação estrutural do banco de dados de curiosidades de caranguejos.</span>
                      </div>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-[#282C34] bg-[#121417] flex items-center justify-between">
          <span className="text-xs text-zinc-400 flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-indigo-400" />
            CaranguejoRPG • O Escudo do Mestre
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-[#1A1D21] hover:bg-[#252830] text-white text-xs font-semibold border border-[#2D3139] transition-colors cursor-pointer"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};

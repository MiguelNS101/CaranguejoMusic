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
  MessageSquare
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
  const [activeTab, setActiveTab] = useState<'overview' | 'audio' | 'widgets' | 'discord' | 'commands'>('overview');

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
                Aprenda a operar o som ambiente, escudo do mestre, roletas, encontros e o bot do Discord.
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
            <span>2. Músicas & Ambientação</span>
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
            <span>3. Escudo & Ferramentas</span>
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
            <span>4. Configuração do Discord</span>
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
            <span>5. Comandos & Curiosidades</span>
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

          {/* TAB 4: CONFIGURAÇÃO DO DISCORD */}
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

# 🦀 CaranguejoRPG — Escudo do Mestre & Bot de Áudio para Discord

<div align="center">

![CaranguejoRPG Banner](public/icon.png)

**O painel tudo-em-um definitivo para Mestres de RPG de Mesa (D&D 5e, Tormenta20, Ordem Paranormal, Vampiro/WoD e Call of Cthulhu).**

[![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Discord.js](https://img.shields.io/badge/Discord.js-v14-5865F2?style=for-the-badge&logo=discord&logoColor=white)](https://discord.js.org/)
[![Neutralino.js](https://img.shields.io/badge/Neutralino.js-Portable_EXE-FF6B6B?style=for-the-badge&logo=javascript&logoColor=white)](https://neutralino.js.org/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

[⚠️ Disclaimer](#-disclaimer-de-vibe-coding) •
[✨ Todas as Funções](#-todas-as-funcionalidades) •
[🛠️ Tecnologias](#-tecnologias-utilizadas) •
[⚙️ Métodos & Funcionamento](#-métodos-e-funcionamento-técnico) •
[🚀 Tutorial de Instalação](#-tutorial-de-instalação) •
[🎮 Guia Básico de Uso](#-básico-de-uso) •
[🎲 Comandos do Discord](#-comandos-do-bot-no-discord-prefixo-)

</div>

---

## ⚠️ DISCLAIMER DE VIBE CODING

> **LEIA COM ATENÇÃO:**  
> Este software foi **100% VIBECODADO** (desenvolvido em ritmo frenético através de prompts, experimentação rápida e assistência de IA generativa).  
> 
> **NÃO É RECOMENDADO PARA USO SÉRIO, MISSÃO CRÍTICA OU AMBIENTES CORPORATIVOS.**  
> - Não espere arquitetura corporativa engomada, microsserviços enterprise ou certificação ISO.  
> - O código é vivo, apaixonado, focado em resolver os perrengues reais do Mestre de RPG num sábado à noite e recheado de vibes caóticas do caranguejo.  
> - Pode conter gambiarras poéticas, códigos audaciosos e efeitos colaterais divertidos.  
> 
> Feito para quem ama RPG, quer soltar trilha sonora no Discord sem pagar mensalidade de bot, criar NPCs em 1 clique e rolar dados com barulho de vitória! Use, abuse, divirta-se e altere o código à vontade sob a licença MIT.

---

## 📖 Visão Geral do App

O **CaranguejoRPG** nasceu para acabar com o pesadelo do Mestre moderno: 15 abas abertas no navegador, bots de música que caem a cada 10 minutos, planilhas desorganizadas e janelas pesadas consumindo memória.

Ele unifica em uma única interface ultrarrápida:
1. **Transmissão de Áudio no Canal de Voz do Discord:** Músicas locais, links da web, faixas de ambiente simultâneas e soundboard em tempo real.
2. **Escudo do Mestre Modular 2D:** Painel customizável com arrastar e soltar (drag-and-drop), redimensionamento livre de widgets e predefinições de layout (Combate, Narrativa, Áudio).
3. **Gestão de Campanhas e Cenas:** Crie crônicas completas e alterne entre cenas (ex.: Taverna, Masmorra, Batalha) carregando instantaneamente trilha sonora, clima sonoro, soundboard e NPCs vinculados em 1 clique.
4. **Gerenciador de NPCs & Gerador de Nomes Temático:** Crie fichas completas, use 1-clique para rolar nomes aleatórios por gênero/tema e envie retratos ao Discord sem dar spoilers da ficha.
5. **Exportação Oficial em PDF:** Arquive o progresso da sessão, anotações do mestre, NPCs ativos e histórico de mensagens em um documento diagramado para impressão ou backup.
6. **Estúdio Tático de Desenho (Paint Studio):** Crie mapas de combate com camadas Z-Index, recorte, filtros RPG e envio direto para o canal de texto do Discord.
7. **Bot Discord com Prefixo Estrito `\`:** Rolador completo para World of Darkness (`\r`, `\k`) e Multi-Dados (`\d`).

---

## ✨ Todas as Funcionalidades

### 🎬 1. Sistema de Gerenciamento de Campanhas & Cenas
* **Hierarquia de Campanhas:** Crie campanhas distintas com nome, sinopse, gênero (Fantasia, Sci-Fi, Moderno, Gótico/WoD, Cyberpunk) e sistema de regras.
* **Cenas Atmosféricas:** Cada campanha suporta infinitas cenas (ex: *Taverna do Javali*, *Emboscada na Floresta*, *Salão do Trono*, *Cripta Ancestral*).
* **Associações por Cena:**
  * 🎵 Faixa de música ou pasta de playlist específica.
  * 🌿 Faixa de ambiente contínuo (chuva, tochas, vento, taverna).
  * 🎚️ Volumes pré-calibrados individuais para música e ambiente.
  * ⚡ Coleção/layout de soundboard recomendada.
  * 👥 Lista de NPCs ativos e presentes na cena.
  * 📝 Notas secretas de narração e ganchos de enredo.
* **Troca Rápida de Cena (1-Clique):** Alterne entre cenas diretamente pelo cabeçalho superior ou pelo Escudo do Mestre. Ao mudar de cena, o áudio toca automaticamente, o clima troca suavemente e a lista de NPCs é carregada.

---

### 🧙 2. Catálogo de NPCs & Gerador de Nomes Aleatórios
* **Fichas Completas:** Nome, título, raça, classe, PV (Pontos de Vida), CA (Classe de Armadura), Nível de Desafio (ND/CR), citações famosas e notas secretas do Mestre.
* **Segredos Ocultos:** Notas do Mestre protegidas por botão de revelação (Eye toggle).
* **Envio 1-Clique ao Discord:** Transmite apenas a arte/retrato do NPC ao chat, sem texto de ficha nem spoilers de enredo.
* **Gerador de Nomes Temático Integrado:**
  * **Temas Suportados:**
    * ⚔️ **Fantasia Medieval:** Humanos nórdicos, Elfos ancestrais, Anões da forja, Halflings e Orcs.
    * 🚀 **Ficção Científica (Sci-Fi):** Pilotos espaciais, andróides, ciborgues e designações estelares.
    * 🕵️ **Moderno / Investigativo:** Detetives, agentes federais e nomes urbanos contemporâneos.
    * 🩸 **Gótico / Mundo das Trevas (WoD):** Vampiros aristocratas, lobisomens de matilha e investigadores ocultistas.
    * ⚡ **Cyberpunk:** Hackers, mercenários de megacorporações e gírias de rua.
    * 🍺 **Taverna & Plebeus:** Taberneiros acolhedores, estalajadeiros e camponeses.
  * **1-Clique no Formulário:** Botão `1-Clique: Rolar Nome` preenche instantaneamente nome e título honorífico.
  * **Modal de Navegação e Lote:** Gere listas de 5 a 20 nomes de uma vez, copie para a área de transferência ou transforme em novo NPC com 1 clique.

---

### 📄 3. Exportação em PDF para Arquivamento do Mestre
* **Documento Diagramado Oficial:** Gera relatórios em PDF formatados profissionalmente com design escuro/pergaminho através do `jsPDF`.
* **Conteúdo Exportado:**
  * Cabeçalho de crônica com data, horário e duração da sessão.
  * Metadados da mesa (Campanha ativa, Cena atual, Mestre, Sistema e Trilha Sonora).
  * Lista completa de NPCs ativos com status de combate (PV, CA, ND) e notas do mestre.
  * Histórico de mensagens do chat e rolagens recentes.
  * Anotações de enredo, tesouros conquistados e ganchos para a próxima sessão.
* **Opções de Customização:** Ative ou desative seções específicas antes de gerar o download instantâneo.

---

### 🔊 4. Central de Áudio Triplo & Mixer Virtual
* **Três Canais Simultâneos e Independentes:**
  1. 🎵 **Trilha Musical:** Fila de reprodução, loop, shuffle, scrubbing por segundo e busca.
  2. 🌿 **Áudio de Ambiência:** Loops contínuos que não interrompem a música (vento, tempestade, taverna, cripta).
  3. ⚡ **Soundboard Multicanal:** Disparo de múltiplos efeitos simultâneos (espadas, trovão, magias, grito de monstro).
* **Mixer de Áudio:** Painel com faders individuais para Volume Mestre, Volume da Música, Volume do Ambiente e Volume do Soundboard, com botões de Mute dedicados.
* **Importador de Mídia Online:** Aceita links de YouTube, Spotify, SoundCloud, listas M3U e arquivos diretos de áudio (.mp3, .ogg, .wav).

---

### 🎲 5. Roladores de Dados Avançados & Sons Customizáveis
* **Rolador Multi-Dados (Sistemas D&D, Tormenta20, CoC):**
  * Suporta dados de d4 a d100, múltiplos agrupamentos (ex: `2d20kh1 + 2d6 + 5`).
  * Vantagem (`kh1`), desvantagem (`kl1`), operadores matemáticos e motivos de rolagem.
* **Rolador Storyteller / Mundo das Trevas (WoD):**
  * Rolagem especializada de d10 com limiar de sucesso 7+, explosão contínua nos 10s (ou 9s em rolagens Keen) e cancelamento por pares de 1.
* **Efeitos Sonoros de Rolagem Totalmente Customizáveis:**
  * Configure sons para **Acerto Crítico**, **Falha Crítica**, **Sucesso Regular** e **Falha**.
  * **Sintetizador Web Audio:** Toca acordes triunfantes, fanfarras e sons sinistros sem precisar carregar nenhum arquivo de áudio externo.
  * **Áudio Personalizado:** Insira URLs de áudio customizadas para cada evento de rolagem diretamente na aba de predefinições da mesa.

---

### 🎨 6. Estúdio de Desenho & Tática (Paint Studio)
* **Preservação Contínua de Estado:** O desenho e suas camadas nunca se perdem ao trocar de aba.
* **Sistema de Camadas (Layers):**
  * Criação, duplicação e exclusão de camadas.
  * Reordenação Z-Index (*Trazer para Frente* / *Enviar para Trás*).
  * Bloqueio com cadeado (trave o mapa de fundo para desenhar tokens por cima).
  * Opacidade ajustável e controle de visibilidade (oculte armadilhas antes de mostrar aos jogadores).
* **Ferramentas de Traço:** Pincel livre, borracha, retas, setas táticas, retângulos, círculos e texto.
* **Manipulação de Imagens:** Mover, esticar/redimensionar, rotacionar livremente, espelhar horizontal/vertical, recortar (crop) e filtros RPG (*Pergaminho Antigo*, *Grimdark*, *Névoa*).
* **Transmissão Direta ao Discord:** Envie o mapa tático com legenda para o canal de texto dos jogadores.

---

### 💬 7. Leitor Multi-Abas e Chat do Discord
* **Navegação em Abas:** Abra canais como `#geral`, `#rolagens`, `#diario` e alterne rapidamente.
* **Modo Split-View:** Visualize dois canais lado a lado simultaneamente.
* **Identificação por Cores:** Cores personalizadas por jogador salvas localmente para leitura visual imediata.
* **Envio com Modos:** Alterne entre fala comum (💬) e narração épica destacada com borda dourada (📜).
* **Avisos Rápidos de Combate:** Botões de 1-clique para solicitar iniciativa, percepção ou descanso.

---

### 🗺️ 8. Cenários, Mapas & Pontos de Interesse (POIs)
* Upload e catálogo de mapas em alta resolução.
* Adicione marcadores interativos com título, descrição secreta e ícones temáticos.
* Transmita o mapa focalizado diretamente para o canal do Discord.

---

### ⚔️ 9. Ferramentas Adicionais do Mestre
* **Gerador de Encontros:** Balanceamento por nível do grupo (1 a 20) e biomas com envio formatado ao Discord.
* **Gerador de Tesouros & Loot:** Rolagem de moedas, gemas preciosas e itens mágicos por nível de desafio (CR).
* **Roleta de Decisões:** Sorteios aleatórios customizáveis com porcentagens e física de giro.
* **Multi-Timers:** Cronômetros para duração de magias de concentração, tochas e rodadas de combate.
* **Bloco de Notas Multi-Abas & Scratchpad:** Anotações persistidas em tempo real.
* **Customizador de Temas Visuais:** Alterne entre temas de RPG e injete CSS customizado na interface.

---

## 🎲 Comandos do Bot no Discord (Prefixo `\`)

O bot utiliza **exclusivamente o prefixo `\`** para comandos de rolagem de dados no Discord, evitando conflitos com outros bots:

| Comando | Função | Exemplo |
| :--- | :--- | :--- |
| **`\r [dados] [motivo]`** | **Mundo das Trevas (WoD Storyteller):** Rola d10s com limiar 7+, explosão no 10 e cancelamento nos 1s. | `\r 8`, `\r 8d10`, `\r 7 Furtividade` |
| **`\k [dados] [motivo]`** | **WoD Keen Roll:** Rola Storyteller d10 com **crítico e explosão no 9 e 10**. | `\k 6`, `\k 6d10 Ataque Brutal` |
| **`\d [fórmula] [motivo]`** | **Multi-Dados (D&D / Sistemas Gerais):** Rola dados com modificadores, vantagens e motivos. | `\d 1d20+5`, `\d 2d20kh1 + 4 Vantagem`, `\d 8d6 Bola de Fogo` |
| **`\d20`, `\d100`** | **Atalhos Rápidos:** Rola diretamente um d20 ou d100. | `\d20`, `\d100` |
| **`\help`** | Exibe o menu completo de ajuda e comandos no Discord. | `\help` |
| **`\status`** | Exibe o status da conexão, canal de voz e uptime do bot. | `\status` |

*(Outros prefixos como `!` e `/` são intencionalmente ignorados para garantir foco absoluto).*

---

## 🛠️ Tecnologias Utilizadas

### Frontend
* **[React 19](https://react.dev/):** Renderização reativa de alto desempenho, componentes funcionais e hooks customizados.
* **[TypeScript 5.8](https://www.typescriptlang.org/):** Tipagem estática rigorosa ponta a ponta para entidades de RPG, áudio e eventos.
* **[Vite](https://vitejs.dev/):** Build tool ultrarrápida com compilação otimizada.
* **[Tailwind CSS](https://tailwindcss.com/):** Estilização utilitária com variáveis de tema dinâmicas para o Mestre.
* **[Lucide React](https://lucide.dev/):** Ícones vetoriais modernos para toda a interface.
* **[jsPDF](https://github.com/parallax/jsPDF):** Motor client-side para renderização e paginação vetorial de relatórios em PDF.
* **Web Audio API:** Sintetizador procedural de ondas senoidais, ruído branco e harmônicos para efeitos sonoros de dados e alertas sem dependência de rede.
* **HTML5 Canvas API:** Motor de pintura em camadas com matrizes 2D de transformação e exportação de imagens.

### Backend & Discord Engine
* **[Node.js 20+](https://nodejs.org/):** Runtime JavaScript assíncrono.
* **[Express](https://expressjs.com/):** Servidor HTTP REST para rotas de upload, gerenciamento de dados e streaming.
* **[Discord.js v14](https://discord.js.org/):** Integração com Gateway do Discord, gerenciamento de canais e leitura de chat.
* **[@discordjs/voice](https://github.com/discordjs/voice):** Conexão VoIP com canais de voz do Discord e criptografia de áudio.
* **[Prism-Media](https://github.com/amishshah/prism-media) & Opus:** Transcodificação de áudio de alta fidelidade e baixa latência.
* **FFmpeg Static:** Decodificação e normalização de áudio para streaming de voz.

### Empacotamento Desktop & Deploy
* **[Neutralino.js](https://neutralino.js.org/):** Criação de executáveis portáteis nativos ultraleves (~5MB) para Windows e Linux sem a sobrecarga do Electron.
* **[Docker](https://www.docker.com/) & Docker Compose:** Containerização completa para hospedar o bot 24/7 na nuvem ou em um Raspberry Pi/servidor caseiro.
* **[Vitest](https://vitest.dev/):** Suíte automatizada de testes unitários para validadores de dados, camadas do canvas e geradores aleatórios.

---

## ⚙️ Métodos e Funcionamento Técnico

1. **Arquitetura Cliente-Servidor Desacoplada:**
   * O backend (`server/`) e o frontend (`src/`) operam integrados via `server.ts`. Em modo de desenvolvimento, o Vite middleware é montado diretamente na instância do Express.
   * O cliente comunica-se com a API via endpoints `/api/*` com tratamento resiliente de erros em `src/services/api.ts`.
2. **Pipeline de Áudio no Discord Voice:**
   * O `server/soundManager.ts` mantém um singleton do `AudioPlayer` do Discord Voice.
   * Quando uma faixa toca, o servidor inicializa um stream via FFmpeg, aplica ganho de volume em tempo real e encadeia um decodificador Opus diretamente no canal de voz selecionado.
3. **Persistência Baseada em Arquivos JSON:**
   * Todos os dados da mesa (pastas, campanhas, cenas, NPCs, layouts de soundboard e notas) são salvos de forma legível e editável na pasta `data/`.
   * Permite que o Mestre copie a pasta `data/` para um pen drive e leve sua mesa completa para qualquer computador.
4. **Sintetizador Procedural de Sons de Dados:**
   * A biblioteca `src/utils/diceSoundPlayer.ts` inicializa um `AudioContext` do navegador para sintetizar acertos críticos (arpejos ascendentes em tríade maior), falhas críticas (modulação de frequência descendente com oscilador dente-de-serra) ou sucessos regulares, tudo gerado por código sem consumir largura de banda.
5. **Gerador Determinístico de Nomes:**
   * O utilitário `src/utils/npcNameGenerator.ts` utiliza bancos de dados estruturados com regras fonéticas, prefixos, sufixos, títulos dinâmicos e pesos temáticos para produzir milhares de combinações autênticas para cada gênero de jogo.

---

## 🚀 Tutorial de Instalação

### Pré-requisitos
* **Node.js** v20.x ou superior instalado ([Download oficial](https://nodejs.org/)).
* **Git** instalado.

---

### Passo 1: Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/CaranguejoRPG.git
cd CaranguejoRPG
```

---

### Passo 2: Instalar as Dependências
```bash
npm install
```

---

### Passo 3: Configurar Variáveis de Ambiente (Opcional para Discord)
Copie o arquivo de exemplo:
```bash
cp .env.example .env
```
Abra o `.env` e insira o token do seu bot caso deseje conexão automática na inicialização:
```env
PORT=3000
DISCORD_BOT_TOKEN=seu_token_do_discord_aqui
```
*(Nota: Você também pode configurar e trocar o Token diretamente pela interface gráfica do app a qualquer momento).*

---

### Passo 4: Executar a Aplicação
```bash
npm run dev
```
Abra o navegador em: **`http://localhost:3000`**

---

### 🐳 Alternativa: Executar via Docker
Para rodar como serviço contínuo em servidor:
```bash
docker compose up -d --build
```
O app estará acessível na porta `3000`.

---

### 📦 Alternativa: Gerar o Executável Portátil (.EXE)
Para criar uma versão de desktop portátil sem instalador:
* No Windows, execute:
  ```cmd
  gerar-executavel.bat
  ```
* No Linux / macOS:
  ```bash
  chmod +x gerar-executavel.sh
  ./gerar-executavel.sh
  ```
A pasta `dist-portable/` conterá o executável standalone pronto para uso.

---

## 🎮 Básico de Uso

1. **Conectando o Bot do Discord:**
   * Clique no botão **Conectar Bot** no topo direito.
   * Insira o Token da sua aplicação criada no Discord Developer Portal com as *Intents de Mensagem* ativadas.
   * Selecione seu Servidor, o Canal de Voz onde o bot tocará áudio e o Canal de Texto padrão.
2. **Criando sua Primeira Campanha & Cena:**
   * Clique em **Cenas** no cabeçalho (ícone da claquete).
   * Crie uma Campanha (ex.: *A Maldição de Ravenloft*).
   * Crie uma Cena (ex.: *Taverna do Sangue da Vinha*) e vincule a ela uma música relaxante e o som ambiente de lareira.
   * Alterne de cena durante o jogo para disparar a ambientação em 1 segundo.
3. **Cadastrando e Gerando NPCs:**
   * Acesse a aba **NPCs**.
   * Clique em **Criar NPC** ou no **🎲 Gerador de Nomes**.
   * Escolha o tema do seu mundo e clique em **1-Clique: Rolar Nome**.
   * Preencha a imagem e use o botão **1-Clique: Postar Imagem no Discord** para revelar o monstro aos jogadores sem spoilers!
4. **Rolando Dados pelo Discord ou pela Mesa:**
   * Seus jogadores podem digitar no Discord: `\d 1d20+5 Ataque com Espada` ou `\r 7d10 Furtividade`.
   * Você pode rolar dados direto pelo widget de dados do Escudo do Mestre e ouvir os efeitos sonoros de crítico!
5. **Finalizando a Sessão e Exportando o PDF:**
   * No final da aventura, clique em **Exportar PDF** na barra de sessão.
   * Selecione as seções desejadas e clique em **Gerar e Baixar PDF do Mestre** para arquivar tudo o que aconteceu na crônica.

---

## 📂 Estrutura de Pastas do Projeto

```text
CaranguejoRPG/
├── 📁 data/                  # Armazenamento local persistente
│   ├── 📁 music/             # Trilhas sonoras (.mp3, .ogg)
│   ├── 📁 ambience/          # Áudios de ambiente contínuos
│   ├── 📁 sfx/               # Efeitos sonoros do soundboard
│   ├── 📁 npcs/              # Retratos e avatares de NPCs
│   ├── 📁 saves/             # Saves de sessões em JSON
│   └── 📄 db.json            # Banco de dados local da aplicação
├── 📁 server/                # Backend Express + Discord Voice Engine
│   ├── 📄 discordBot.ts      # Cliente Discord.js v14 e comandos com prefixo \
│   ├── 📄 soundManager.ts    # Reprodutor de áudio e stream Opus
│   ├── 📄 wodDice.ts         # Motor de rolagens de Mundo das Trevas
│   ├── 📄 routes.ts          # Rotas REST da API
│   └── 📄 db.ts              # Gerenciador de persistência local
├── 📁 src/                   # Interface React 19 + TypeScript
│   ├── 📁 components/        # Modais e Telas: MasterScreen, NpcView, DrawingPaintStudio, etc.
│   ├── 📁 context/           # AudioContext e ThemeContext
│   ├── 📁 utils/             # Gerador de nomes, exportador de PDF, sintetizador de som
│   ├── 📁 services/          # Cliente de API HTTP
│   └── 📄 types.ts           # Definições completas de tipos TypeScript
├── 📁 tests/                 # Testes automatizados com Vitest
├── 📄 neutralino.config.json # Configuração do executável nativo
├── 📄 docker-compose.yml     # Orquestrador de contêineres Docker
└── 📄 package.json           # Dependências e scripts do projeto
```

---

## 🤝 Licença

Distribuído sob a licença **MIT**. Você é totalmente livre para usar nas suas mesas, criar forks, adicionar novas mecânicas de RPG e compartilhar com a comunidade!

<div align="center">

**Que seus d20s rolem sempre em 20 natural e que seus d10s explodam em sucessos! 🦀🎲⚔️**

</div>

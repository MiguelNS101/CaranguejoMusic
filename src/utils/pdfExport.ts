/**
 * Master Session PDF Exporter for CaranguejoRPG
 * 
 * Formats:
 * - Session Overview & Metadata (Date, Duration, Campaign, DM, Soundtrack, Weather)
 * - Session Notes & Multi-Tab Notepad Content
 * - Combat & Initiative Status
 * - Active NPCs Dossier (Stats, Descriptions, Alignment, Confidential DM Secrets)
 * - Message History & Action Logs with clean formatting
 */

import { jsPDF } from 'jspdf';
import { NPC, DiscordChatMessage, NoteTab } from '../types';

export interface MasterSessionArchiveData {
  sessionTitle: string;
  campaignName: string;
  dmName: string;
  sessionDate: string;
  sessionDuration: string;
  weatherAtmosphere?: string;
  activeMusic?: string;
  activeAmbience?: string;
  sessionNotes?: string;
  noteTabs: Array<{ id?: string; title: string; content: string; emoji?: string }>;
  npcs: NPC[];
  includeNpcSecrets: boolean;
  initiativeList: Array<{ name: string; init: number; hp?: number; maxHp?: number; isNpc: boolean }>;
  combatRound?: number;
  chatMessages: Array<{
    authorName: string;
    isBot?: boolean;
    content: string;
    timestamp: string;
  }>;
  actionLogs: Array<{
    text: string;
    category?: string;
    timestamp: string;
  }>;
  options: {
    includeNotes: boolean;
    includeNpcs: boolean;
    includeCombat: boolean;
    includeChat: boolean;
    includeActionLogs: boolean;
  };
}

export function generateMasterSessionPdf(data: MasterSessionArchiveData): jsPDF {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const margin = 14;
  const contentWidth = pageWidth - (margin * 2);
  let yPos = 16;

  function checkPageBreak(requiredSpace: number) {
    if (yPos + requiredSpace > pageHeight - 18) {
      doc.addPage();
      yPos = 18;
      drawHeaderBannerMini();
    }
  }

  function drawHeaderBannerMini() {
    doc.setFillColor(24, 27, 34);
    doc.rect(margin, 8, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(217, 119, 6); // Amber
    doc.text('CARANGUEJORPG • ARQUIVO CONFIDENCIAL DO MESTRE', margin + 3, 12.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(161, 161, 170);
    doc.text(`${data.campaignName} — ${data.sessionTitle}`, pageWidth - margin - 3, 12.5, { align: 'right' });
  }

  function drawSectionTitle(title: string, iconStr: string = '') {
    checkPageBreak(16);
    yPos += 4;
    doc.setFillColor(30, 34, 45);
    doc.roundedRect(margin, yPos, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setDrawColor(217, 119, 6);
    doc.setLineWidth(0.6);
    doc.line(margin, yPos, margin, yPos + 8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(245, 158, 11);
    doc.text(`${iconStr ? iconStr + ' ' : ''}${title.toUpperCase()}`, margin + 4, yPos + 5.5);
    yPos += 12;
  }

  // ==========================================
  // COVER / TOP HERO HEADER
  // ==========================================
  doc.setFillColor(20, 23, 30);
  doc.roundedRect(margin, yPos, contentWidth, 34, 2, 2, 'F');
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.roundedRect(margin, yPos, contentWidth, 34, 2, 2, 'D');

  // Title & Subtitle
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.text(data.sessionTitle || 'Relatório de Sessão do Mestre', margin + 6, yPos + 8);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(217, 119, 6);
  doc.text(`Campanha: ${data.campaignName || 'Mesa Principal'} • Narrador: ${data.dmName || 'Mestre'}`, margin + 6, yPos + 14.5);

  // Metadata Pill Grid
  doc.setFontSize(7.5);
  doc.setTextColor(212, 212, 216);

  const metaCols = [
    `Data: ${data.sessionDate}`,
    `Duração: ${data.sessionDuration}`,
    `NPCs Ativos: ${data.npcs.length}`,
    `Clima: ${data.weatherAtmosphere || 'Padrão'}`
  ];

  metaCols.forEach((text, idx) => {
    const colX = margin + 6 + (idx * (contentWidth / 4));
    doc.setFillColor(32, 36, 46);
    doc.roundedRect(colX, yPos + 18, (contentWidth / 4) - 4, 10, 1, 1, 'F');
    doc.text(text, colX + 3, yPos + 24);
  });

  yPos += 38;

  // Track & Environment strip if active
  if (data.activeMusic || data.activeAmbience) {
    checkPageBreak(12);
    doc.setFillColor(24, 28, 36);
    doc.roundedRect(margin, yPos, contentWidth, 8, 1, 1, 'F');
    doc.setFontSize(7.5);
    doc.setTextColor(161, 161, 170);
    const audioText = [
      data.activeMusic ? `Trilha Ativa: ${data.activeMusic}` : '',
      data.activeAmbience ? `Ambiência: ${data.activeAmbience}` : ''
    ].filter(Boolean).join('  |  ');
    doc.text(audioText, margin + 4, yPos + 5.5);
    yPos += 11;
  }

  // ==========================================
  // SECTION: COMBAT & INITIATIVE
  // ==========================================
  if (data.options.includeCombat && data.initiativeList && data.initiativeList.length > 0) {
    drawSectionTitle('Combate & Rastreador de Iniciativa', '⚔️');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);

    // Table header
    checkPageBreak(8);
    doc.setFillColor(38, 42, 54);
    doc.rect(margin, yPos, contentWidth, 6, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(228, 228, 231);
    doc.text('Combatente', margin + 3, yPos + 4.2);
    doc.text('Iniciativa', margin + 80, yPos + 4.2);
    doc.text('Pontos de Vida (HP)', margin + 115, yPos + 4.2);
    doc.text('Tipo', margin + 155, yPos + 4.2);
    yPos += 7;

    data.initiativeList.forEach((c, idx) => {
      checkPageBreak(7);
      const isAlt = idx % 2 === 1;
      if (isAlt) {
        doc.setFillColor(245, 245, 247);
      } else {
        doc.setFillColor(255, 255, 255);
      }
      doc.rect(margin, yPos, contentWidth, 6, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setTextColor(24, 24, 27);
      doc.text(c.name, margin + 3, yPos + 4.2);

      doc.setFont('helvetica', 'normal');
      doc.text(`${c.init}`, margin + 85, yPos + 4.2);
      doc.text(c.hp !== undefined ? `${c.hp} / ${c.maxHp || c.hp} HP` : '—', margin + 115, yPos + 4.2);
      
      if (c.isNpc) {
        doc.setTextColor(180, 83, 9);
      } else {
        doc.setTextColor(30, 130, 230);
      }
      doc.text(c.isNpc ? 'Monstro / NPC' : 'Personagem', margin + 155, yPos + 4.2);

      yPos += 6.5;
    });

    yPos += 5;
  }

  // ==========================================
  // SECTION: SESSION NOTES & TABS
  // ==========================================
  if (data.options.includeNotes && ((data.noteTabs && data.noteTabs.length > 0) || data.sessionNotes)) {
    drawSectionTitle('Anotações do Mestre & Progresso da Mesa', '📜');

    if (data.sessionNotes && data.sessionNotes.trim()) {
      checkPageBreak(20);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(17, 24, 39);
      doc.text('Resumo Rápido da Sessão:', margin, yPos);
      yPos += 4.5;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(55, 65, 81);
      const lines = doc.splitTextToSize(data.sessionNotes.trim(), contentWidth);
      lines.forEach((line: string) => {
        checkPageBreak(5);
        doc.text(line, margin, yPos);
        yPos += 4.2;
      });
      yPos += 4;
    }

    if (data.noteTabs && data.noteTabs.length > 0) {
      data.noteTabs.forEach((tab) => {
        if (!tab.content || !tab.content.trim()) return;

        checkPageBreak(16);
        doc.setFillColor(243, 244, 246);
        doc.roundedRect(margin, yPos, contentWidth, 6.5, 1, 1, 'F');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(31, 41, 55);
        doc.text(`${tab.title || 'Anotações'}`, margin + 3, yPos + 4.5);
        yPos += 9;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(55, 65, 81);
        const tabLines = doc.splitTextToSize(tab.content.trim(), contentWidth - 4);
        tabLines.forEach((l: string) => {
          checkPageBreak(5);
          doc.text(l, margin + 2, yPos);
          yPos += 4;
        });
        yPos += 4;
      });
    }

    yPos += 3;
  }

  // ==========================================
  // SECTION: ACTIVE NPCS DOSSIER
  // ==========================================
  if (data.options.includeNpcs && data.npcs && data.npcs.length > 0) {
    drawSectionTitle(`Dossier de NPCs & Criaturas Ativas (${data.npcs.length})`, '👥');

    data.npcs.forEach((npc) => {
      // Calculate estimated space for this NPC card
      const descLines = npc.description ? doc.splitTextToSize(npc.description, contentWidth - 8) : [];
      const secretLines = (data.includeNpcSecrets && npc.secretDmNotes)
        ? doc.splitTextToSize(`SEGREDO DO MESTRE: ${npc.secretDmNotes}`, contentWidth - 12)
        : [];
      
      const estimatedHeight = 18 + (descLines.length * 4) + (secretLines.length * 4) + 6;
      checkPageBreak(estimatedHeight);

      // Card container
      doc.setFillColor(250, 250, 252);
      doc.roundedRect(margin, yPos, contentWidth, estimatedHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(228, 228, 231);
      doc.setLineWidth(0.3);
      doc.roundedRect(margin, yPos, contentWidth, estimatedHeight, 1.5, 1.5, 'D');

      // Header strip inside card
      doc.setFillColor(238, 242, 255);
      doc.rect(margin, yPos, contentWidth, 7, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
      doc.text(npc.name, margin + 3, yPos + 4.8);

      if (npc.title) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(`— ${npc.title}`, margin + 6 + (npc.name.length * 2.5), yPos + 4.8);
      }

      // Combat badges on top right
      const statsBadges = [
        npc.hp ? `HP: ${npc.hp}/${npc.maxHp || npc.hp}` : null,
        npc.ac ? `CA: ${npc.ac}` : null,
        npc.cr ? `ND: ${npc.cr}` : null,
        npc.alignment || null
      ].filter(Boolean).join('  •  ');

      if (statsBadges) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(71, 85, 105);
        doc.text(statsBadges, pageWidth - margin - 3, yPos + 4.8, { align: 'right' });
      }

      let cardInnerY = yPos + 11;

      // Description
      if (descLines.length > 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.8);
        doc.setTextColor(51, 65, 85);
        descLines.forEach((line: string) => {
          doc.text(line, margin + 4, cardInnerY);
          cardInnerY += 3.8;
        });
      }

      // Secret DM Notes (Confidential box)
      if (secretLines.length > 0) {
        cardInnerY += 2;
        const boxHeight = (secretLines.length * 3.8) + 4;
        doc.setFillColor(254, 242, 242);
        doc.roundedRect(margin + 3, cardInnerY, contentWidth - 6, boxHeight, 1, 1, 'F');
        doc.setDrawColor(239, 68, 68);
        doc.setLineWidth(0.4);
        doc.roundedRect(margin + 3, cardInnerY, contentWidth - 6, boxHeight, 1, 1, 'D');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.2);
        doc.setTextColor(185, 28, 28); // Crimson
        doc.text('🔒 [CONFIDENCIAL / APENAS MESTRE]', margin + 5, cardInnerY + 3.8);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(127, 29, 29);
        let secretY = cardInnerY + 3.8;
        secretLines.forEach((sLine: string, sIdx: number) => {
          if (sIdx > 0) {
            secretY += 3.8;
            doc.text(sLine, margin + 5, secretY);
          }
        });
        cardInnerY += boxHeight;
      }

      yPos += estimatedHeight + 4;
    });

    yPos += 2;
  }

  // ==========================================
  // SECTION: MESSAGE HISTORY & DISCORD CHAT
  // ==========================================
  if (data.options.includeChat && data.chatMessages && data.chatMessages.length > 0) {
    drawSectionTitle(`Histórico de Mensagens & Interações (${data.chatMessages.length})`, '💬');

    data.chatMessages.forEach((msg) => {
      const msgLines = doc.splitTextToSize(msg.content, contentWidth - 10);
      const neededHeight = (msgLines.length * 3.8) + 9;
      checkPageBreak(neededHeight);

      doc.setFillColor(248, 250, 252);
      doc.roundedRect(margin, yPos, contentWidth, neededHeight, 1, 1, 'F');

      // Author & Time
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      if (msg.isBot) {
        doc.setTextColor(99, 102, 241);
      } else {
        doc.setTextColor(30, 41, 59);
      }
      doc.text(`${msg.authorName}${msg.isBot ? ' [BOT]' : ''}`, margin + 3, yPos + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.8);
      doc.setTextColor(148, 163, 184);
      doc.text(msg.timestamp, pageWidth - margin - 3, yPos + 4.5, { align: 'right' });

      // Body text
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(51, 65, 85);
      let lineY = yPos + 8.5;
      msgLines.forEach((l: string) => {
        doc.text(l, margin + 4, lineY);
        lineY += 3.8;
      });

      yPos += neededHeight + 3;
    });

    yPos += 3;
  }

  // ==========================================
  // SECTION: IMMEDIATE ACTION LOGS
  // ==========================================
  if (data.options.includeActionLogs && data.actionLogs && data.actionLogs.length > 0) {
    drawSectionTitle(`Registro de Ações da Mesa (${data.actionLogs.length})`, '⚡');

    data.actionLogs.forEach((log) => {
      checkPageBreak(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(100, 116, 139);
      doc.text(`[${log.timestamp}]`, margin + 2, yPos + 3.8);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(log.text, margin + 24, yPos + 3.8);

      yPos += 5.5;
    });
  }

  // ==========================================
  // FOOTER ON ALL PAGES
  // ==========================================
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(156, 163, 175);
    doc.setDrawColor(228, 228, 231);
    doc.setLineWidth(0.2);
    doc.line(margin, pageHeight - 11, pageWidth - margin, pageHeight - 11);
    doc.text(
      `CaranguejoRPG • Arquivo da Mesa do Mestre • Página ${i} de ${totalPages} • Gerado em ${new Date().toLocaleString('pt-BR')}`,
      pageWidth / 2,
      pageHeight - 7,
      { align: 'center' }
    );
  }

  return doc;
}

export function downloadMasterSessionPdf(data: MasterSessionArchiveData, fileName?: string): void {
  const doc = generateMasterSessionPdf(data);
  const cleanName = (fileName || `Arquivo-Mestre-${data.sessionTitle || 'Sessao'}-${new Date().toISOString().slice(0, 10)}.pdf`)
    .replace(/[^a-zA-Z0-9._-]/g, '_');
  doc.save(cleanName);
}

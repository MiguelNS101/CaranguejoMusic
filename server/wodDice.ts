import { WodDiceRollResult, WodDiceWave } from '../src/types.js';

export function rollWodDice(
  diceCount: number,
  isKeen: boolean = false,
  rollerName: string = 'Mestre',
  label?: string
): WodDiceRollResult {
  const count = Math.max(1, Math.min(100, Math.floor(diceCount || 1)));
  const critThreshold = isKeen ? 9 : 10;
  const successThreshold = 7;

  // Base wave
  const baseRolls: number[] = [];
  for (let i = 0; i < count; i++) {
    baseRolls.push(Math.floor(Math.random() * 10) + 1);
  }

  const bonusWaves: WodDiceWave[] = [];
  let currentWaveToExplode = [...baseRolls];
  let waveIndex = 1;
  const MAX_WAVES = 10; // Prevent runaway explosions

  while (waveIndex <= MAX_WAVES) {
    const explosions = currentWaveToExplode.filter(r => r >= critThreshold).length;
    if (explosions === 0) break;

    const nextWaveRolls: number[] = [];
    for (let i = 0; i < explosions; i++) {
      nextWaveRolls.push(Math.floor(Math.random() * 10) + 1);
    }

    bonusWaves.push({
      waveIndex,
      rolls: nextWaveRolls,
      note: `Explosão (${waveIndex}ª rodada - ${explosions} dado${explosions > 1 ? 's' : ''})`
    });

    currentWaveToExplode = nextWaveRolls;
    waveIndex++;
  }

  // Aggregate all rolls
  const allRolls = [...baseRolls, ...bonusWaves.flatMap(w => w.rolls)];

  let totalRawCrits = 0;
  let totalRawNormalSuccesses = 0;
  let totalCriticalFails = 0; // 1s

  for (const r of allRolls) {
    if (r >= critThreshold) {
      totalRawCrits++;
    } else if (r >= successThreshold) {
      totalRawNormalSuccesses++;
    } else if (r === 1) {
      totalCriticalFails++;
    }
  }

  const totalRawSuccesses = totalRawCrits + totalRawNormalSuccesses;

  // Cancellation rule: "1s cancel successes (priority to crits)"
  let remainingCrits = totalRawCrits;
  let remainingNormalSuccesses = totalRawNormalSuccesses;
  let onesRemaining = totalCriticalFails;

  let cancelledCritsCount = 0;
  let cancelledNormalCount = 0;

  // 1s cancel crits first
  while (onesRemaining > 0 && remainingCrits > 0) {
    remainingCrits--;
    onesRemaining--;
    cancelledCritsCount++;
  }

  // Then cancel normal successes
  while (onesRemaining > 0 && remainingNormalSuccesses > 0) {
    remainingNormalSuccesses--;
    onesRemaining--;
    cancelledNormalCount++;
  }

  const cancelledSuccesses = cancelledCritsCount + cancelledNormalCount;
  const netSuccesses = remainingCrits + remainingNormalSuccesses;

  // Generate formatted text output for Discord / UI
  const lines: string[] = [];
  const modeTitle = isKeen
    ? `🩸 **Rolagem Mundo das Trevas (Keen Roll - Crítico no 9 e 10)**`
    : `🎲 **Rolagem Mundo das Trevas (D10 WoD)**`;

  lines.push(modeTitle);
  if (label) lines.push(`*Ação / Motivo: ${label}*`);
  lines.push(`**Jogador / Autor:** ${rollerName}`);
  lines.push(`🎲 **Roll base (${count}d10):** \`[ ${baseRolls.join(', ')} ]\``);

  bonusWaves.forEach(w => {
    lines.push(`⚡ **Bônus (${w.waveIndex}ª rodada):** \`[ ${w.rolls.join(', ')} ]\``);
  });

  lines.push('─────────────────────────────');
  lines.push(`✨ **Total acertos:** **${netSuccesses}** ${netSuccesses === 0 && totalCriticalFails > 0 && totalRawSuccesses === 0 ? '*(FALHA CRÍTICA/BOTCH)*' : ''}`);
  lines.push(`🌟 **Acertos críticos:** **${remainingCrits}** (de ${totalRawCrits} gerados)`);
  lines.push(`💀 **Erros críticos (1s):** **${totalCriticalFails}** (cancelaram ${cancelledSuccesses} sucesso${cancelledSuccesses !== 1 ? 's' : ''})`);

  const formattedOutput = lines.join('\n');

  return {
    id: `wod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    command: `${isKeen ? '\\kr' : '\\r'} ${count}d10${label ? ` ${label}` : ''}`,
    diceCount: count,
    isKeenRoll: isKeen,
    critThreshold,
    successThreshold,
    baseRolls,
    bonusWaves,
    totalSuccesses: netSuccesses,
    totalCriticalHits: remainingCrits,
    totalCriticalFails,
    cancelledSuccesses,
    cancelledCritsCount,
    formattedOutput,
    rollerName,
    timestamp: Date.now()
  };
}

export function parseWodCommand(content: string): { count: number; isKeen: boolean; label?: string } | null {
  const trimmed = content.trim();
  // Matches \r, \kr, /r, /kr, !r, !kr
  const match = trimmed.match(/^([\\/!](?:kr|r))\s+(\d+)(?:d10)?(?:\s+(.*))?$/i);
  if (!match) return null;

  const cmdPrefix = match[1].toLowerCase();
  const isKeen = cmdPrefix.includes('kr');
  const count = parseInt(match[2], 10);
  const label = match[3]?.trim();

  if (isNaN(count) || count <= 0) return null;

  return {
    count,
    isKeen,
    label
  };
}

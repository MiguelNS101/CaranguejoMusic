import { AdvancedDiceGroupResult, AdvancedDiceRollResult, DicePreset } from '../types.js';

export interface DiceGroupSpec {
  count: number;
  sides: number;
  keepMode?: 'kh' | 'kl';
  keepCount?: number;
  operator: '+' | '-';
}

/**
 * Parses an advanced multi-dice formula such as:
 * "2d20kh1 + 1d6 + 1d4 + 5"
 * "1d20 + 2d8 - 2"
 * "4d6kh3"
 * "1d100 + 10"
 */
export function parseAdvancedDiceFormula(formula: string): {
  groups: DiceGroupSpec[];
  modifier: number;
  cleanFormula: string;
} | null {
  if (!formula || typeof formula !== 'string') return null;

  let clean = formula.trim().toLowerCase().replace(/\s+/g, '');
  if (!clean) return null;

  // Pattern matching dice tokens like: (+|-)?(\d*)d(\d+)(kh\d+|kl\d+)?
  // Or standalone constant numbers (+|-)?\d+
  const tokenRegex = /([+-]?)(?:(\d*)d(\d+)(kh\d+|kl\d+)?|(\d+))/g;

  const groups: DiceGroupSpec[] = [];
  let modifier = 0;
  let match: RegExpExecArray | null;
  let parsedLength = 0;

  while ((match = tokenRegex.exec(clean)) !== null) {
    if (match.index !== parsedLength) {
      // There are unrecognized characters between tokens
      return null;
    }
    parsedLength += match[0].length;

    const opSign = match[1] === '-' ? '-' : '+';

    if (match[3] !== undefined) {
      // It's a dice group: match[2] is count, match[3] is sides, match[4] is keep spec
      const count = match[2] ? parseInt(match[2], 10) : 1;
      const sides = parseInt(match[3], 10);

      if (count <= 0 || sides <= 0 || count > 100 || sides > 1000) {
        return null;
      }

      let keepMode: 'kh' | 'kl' | undefined = undefined;
      let keepCount: number | undefined = undefined;

      if (match[4]) {
        const keepStr = match[4];
        keepMode = keepStr.startsWith('kh') ? 'kh' : 'kl';
        keepCount = parseInt(keepStr.slice(2), 10);
        if (isNaN(keepCount) || keepCount <= 0 || keepCount > count) {
          keepCount = 1;
        }
      }

      groups.push({
        count,
        sides,
        keepMode,
        keepCount,
        operator: opSign
      });
    } else if (match[5] !== undefined) {
      // Constant number modifier
      const num = parseInt(match[5], 10);
      if (opSign === '-') {
        modifier -= num;
      } else {
        modifier += num;
      }
    }
  }

  if (parsedLength !== clean.length || (groups.length === 0 && modifier === 0)) {
    return null;
  }

  // Format clean formula representation
  const parts: string[] = [];
  groups.forEach((g, idx) => {
    let part = `${g.count}d${g.sides}`;
    if (g.keepMode && g.keepCount) {
      part += `${g.keepMode}${g.keepCount}`;
    }
    if (idx === 0) {
      if (g.operator === '-') part = `-${part}`;
    } else {
      part = `${g.operator} ${part}`;
    }
    parts.push(part);
  });

  if (modifier !== 0) {
    const modStr = modifier > 0 ? `+ ${modifier}` : `- ${Math.abs(modifier)}`;
    if (parts.length > 0) {
      parts.push(modStr);
    } else {
      parts.push(String(modifier));
    }
  }

  return {
    groups,
    modifier,
    cleanFormula: parts.join(' ')
  };
}

/**
 * Rolls multi-dice based on parsed specifications
 */
export function rollAdvancedDice(
  formula: string,
  rollerName: string = 'Mestre',
  label?: string,
  randomFn: () => number = Math.random
): AdvancedDiceRollResult {
  const parsed = parseAdvancedDiceFormula(formula);

  if (!parsed || parsed.groups.length === 0) {
    // Fallback to simple 1d20
    const val = Math.floor(randomFn() * 20) + 1;
    return {
      id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      formula: '1d20',
      cleanFormula: '1d20',
      rollerName,
      label: label?.trim() || undefined,
      groups: [
        {
          notation: '1d20',
          count: 1,
          sides: 20,
          allRolls: [val],
          keptRolls: [val],
          droppedRolls: [],
          subtotal: val,
          isCriticalSuccess: val === 20,
          isCriticalFail: val === 1
        }
      ],
      modifier: 0,
      total: val,
      breakdown: `[${val}] = ${val}`,
      isCriticalSuccess: val === 20,
      isCriticalFail: val === 1,
      timestamp: Date.now(),
      source: 'web'
    };
  }

  const groupResults: AdvancedDiceGroupResult[] = [];
  let runningTotal = 0;
  let hasCriticalSuccess = false;
  let hasCriticalFail = false;
  const breakdownParts: string[] = [];

  for (const group of parsed.groups) {
    const allRolls: number[] = [];
    for (let i = 0; i < group.count; i++) {
      allRolls.push(Math.floor(randomFn() * group.sides) + 1);
    }

    let keptRolls = [...allRolls];
    let droppedRolls: number[] = [];

    if (group.keepMode && group.keepCount && group.keepCount < group.count) {
      // Sort copies with indices to identify dropped vs kept
      const indexed = allRolls.map((val, idx) => ({ val, idx }));
      if (group.keepMode === 'kh') {
        indexed.sort((a, b) => b.val - a.val); // descending
      } else {
        indexed.sort((a, b) => a.val - b.val); // ascending
      }

      const keptIndices = new Set(indexed.slice(0, group.keepCount).map(i => i.idx));
      keptRolls = [];
      droppedRolls = [];

      allRolls.forEach((val, idx) => {
        if (keptIndices.has(idx)) {
          keptRolls.push(val);
        } else {
          droppedRolls.push(val);
        }
      });
    }

    const rawSubtotal = keptRolls.reduce((a, b) => a + b, 0);
    const signedSubtotal = group.operator === '-' ? -rawSubtotal : rawSubtotal;
    runningTotal += signedSubtotal;

    // Check criticals on d20
    let isCriticalSuccess = false;
    let isCriticalFail = false;
    if (group.sides === 20) {
      if (keptRolls.includes(20)) {
        isCriticalSuccess = true;
        hasCriticalSuccess = true;
      }
      if (keptRolls.includes(1) && !keptRolls.includes(20)) {
        isCriticalFail = true;
        if (!hasCriticalSuccess) hasCriticalFail = true;
      }
    }

    let notation = `${group.count}d${group.sides}`;
    if (group.keepMode && group.keepCount) {
      notation += `${group.keepMode}${group.keepCount}`;
    }

    groupResults.push({
      notation,
      count: group.count,
      sides: group.sides,
      keepMode: group.keepMode,
      keepCount: group.keepCount,
      allRolls,
      keptRolls,
      droppedRolls,
      subtotal: signedSubtotal,
      isCriticalSuccess,
      isCriticalFail
    });

    let rollsStr = keptRolls.join(', ');
    if (droppedRolls.length > 0) {
      rollsStr += ` (desc: ${droppedRolls.join(', ')})`;
    }
    const signPrefix = group.operator === '-' ? '- ' : breakdownParts.length > 0 ? '+ ' : '';
    breakdownParts.push(`${signPrefix}d${group.sides}[${rollsStr}]`);
  }

  runningTotal += parsed.modifier;
  if (parsed.modifier !== 0) {
    breakdownParts.push(parsed.modifier > 0 ? `+ ${parsed.modifier}` : `- ${Math.abs(parsed.modifier)}`);
  }

  const breakdown = `${breakdownParts.join(' ')} = ${runningTotal}`;

  return {
    id: `roll-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    formula: formula.trim(),
    cleanFormula: parsed.cleanFormula,
    rollerName,
    label: label?.trim() || undefined,
    groups: groupResults,
    modifier: parsed.modifier,
    total: runningTotal,
    breakdown,
    isCriticalSuccess: hasCriticalSuccess,
    isCriticalFail: hasCriticalFail && !hasCriticalSuccess,
    timestamp: Date.now(),
    source: 'web'
  };
}

/**
 * Builds formula string from quantities of standard dice
 */
export function buildFormulaFromQuantities(
  counts: { [key: string]: number },
  modifier: number = 0,
  advantageMode: 'normal' | 'advantage' | 'disadvantage' = 'normal'
): string {
  const parts: string[] = [];

  // d20 handling with advantage / disadvantage
  const d20Count = counts['d20'] || 0;
  if (d20Count > 0) {
    if (advantageMode === 'advantage') {
      parts.push('2d20kh1');
    } else if (advantageMode === 'disadvantage') {
      parts.push('2d20kl1');
    } else {
      parts.push(`${d20Count}d20`);
    }
  }

  // Other standard dice in order: d4, d6, d8, d10, d12, d100
  const order = ['d4', 'd6', 'd8', 'd10', 'd12', 'd100'];
  for (const die of order) {
    const qty = counts[die] || 0;
    if (qty > 0) {
      parts.push(`${qty}${die}`);
    }
  }

  if (parts.length === 0) {
    parts.push(advantageMode === 'advantage' ? '2d20kh1' : advantageMode === 'disadvantage' ? '2d20kl1' : '1d20');
  }

  let result = parts.join(' + ');
  if (modifier > 0) {
    result += ` + ${modifier}`;
  } else if (modifier < 0) {
    result += ` - ${Math.abs(modifier)}`;
  }

  return result;
}

/**
 * Standard default dice presets
 */
export const DEFAULT_DICE_PRESETS: DicePreset[] = [
  {
    id: 'preset-d20-normal',
    name: 'D20 Padrão',
    formula: '1d20',
    description: 'Teste comum de atributo ou perícia',
    color: '#6366f1',
    category: 'check'
  },
  {
    id: 'preset-d20-adv',
    name: 'D20 com Vantagem',
    formula: '2d20kh1',
    description: 'Rola 2 dados de 20 faces e mantém o maior resultado',
    color: '#10b981',
    category: 'attack'
  },
  {
    id: 'preset-d20-dis',
    name: 'D20 com Desvantagem',
    formula: '2d20kl1',
    description: 'Rola 2 dados de 20 faces e mantém o menor resultado',
    color: '#ef4444',
    category: 'check'
  },
  {
    id: 'preset-sword',
    name: 'Espada Longa',
    formula: '1d20+5 + 1d8+3',
    description: 'Ataque de 1d20+5 e Dano de 1d8+3 cortante',
    color: '#f59e0b',
    category: 'attack'
  },
  {
    id: 'preset-fireball',
    name: 'Bola de Fogo',
    formula: '8d6',
    description: '8d6 de dano de fogo em área',
    color: '#dc2626',
    category: 'damage'
  },
  {
    id: 'preset-cure',
    name: 'Curar Ferimentos',
    formula: '1d8+4',
    description: 'Restaura 1d8 + 4 pontos de vida',
    color: '#06b6d4',
    category: 'custom'
  },
  {
    id: 'preset-d100',
    name: 'D100 Percentual',
    formula: '1d100',
    description: 'Tabelas aleatórias e testes percentuais',
    color: '#8b5cf6',
    category: 'check'
  },
  {
    id: 'preset-stat',
    name: 'Atributo 4d6 (Maior 3)',
    formula: '4d6kh3',
    description: 'Criação de atributos clássicos (descarta o menor dado)',
    color: '#ec4899',
    category: 'check'
  }
];

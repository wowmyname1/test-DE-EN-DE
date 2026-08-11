export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

export function rollExpression(input = '') {
  const expr = String(input ?? '')
    .trim()
    .replace(/\s+/g, '');

  if (!expr) {
    return {
      total: 0,
      details: ['Пустая формула'],
    };
  }

  if (/^\d+(\.\d+)?$/.test(expr)) {
    return {
      total: Number(expr),
      details: [expr],
    };
  }

  const termRegex = /([+-]?)(?:(\d*)d(\d+)(?:(kh|kl)(\d+))?|(\d+))/gi;

  let total = 0;
  const details = [];
  let lastIndex = 0;
  let match;
  let hasTerm = false;

  while ((match = termRegex.exec(expr)) !== null) {
    if (match.index !== lastIndex) {
      throw new Error('Некорректная формула броска');
    }

    lastIndex = termRegex.lastIndex;
    hasTerm = true;

    const sign = match[1] === '-' ? -1 : 1;
    const signText = sign === -1 ? '-' : '';

    if (match[6] !== undefined) {
      const value = Number(match[6]);
      total += sign * value;
      details.push(`${signText}${value}`);
      continue;
    }

    const count = match[2] === '' ? 1 : Number(match[2]);
    const sides = Number(match[3]);
    const keepType = match[4] ? match[4].toLowerCase() : null;
    const keepCount = match[5] !== undefined ? Number(match[5]) : count;

    if (!Number.isInteger(count) || count <= 0) {
      throw new Error('Некорректное количество кубиков');
    }

    if (!Number.isInteger(sides) || sides <= 0) {
      throw new Error('Некорректный размер кубика');
    }

    if (keepType && (!Number.isInteger(keepCount) || keepCount <= 0 || keepCount > count)) {
      throw new Error('Некорректное количество keep');
    }

    const rolls = Array.from({ length: count }, () => rollDie(sides));

    let kept = [...rolls];

    if (keepType === 'kh') {
      kept.sort((a, b) => b - a);
    }

    if (keepType === 'kl') {
      kept.sort((a, b) => a - b);
    }

    kept = kept.slice(0, Math.min(keepCount, rolls.length));

    const sum = kept.reduce((acc, value) => acc + value, 0);
    total += sign * sum;

    const keepLabel = keepType ? `${keepType}${keepCount}` : '';
    details.push(`${signText}${count}d${sides}${keepLabel} [${rolls.join(', ')}] → ${sum}`);
  }

  if (!hasTerm || lastIndex !== expr.length) {
    throw new Error('Некорректная формула броска');
  }

  return {
    total,
    details,
  };
}

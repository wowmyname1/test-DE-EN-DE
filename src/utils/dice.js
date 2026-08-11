export function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function toNumber(value, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function rollExpression(input = '') {
  const expr = String(input).split(' ').join('');

  if (!expr) {
    throw new Error('Пустая формула');
  }

  if (/^\d+$/.test(expr)) {
    return {
      total: Number(expr),
      details: [expr],
    };
  }

  const termRegex = /([+-]?)(?:(\d*)d(\d+)(?:(kh|kl)(\d+))?|(\d+))/g;

  let match;
  let total = 0;
  let lastIndex = 0;
  let hasTerm = false;
  const details = [];

  while ((match = termRegex.exec(expr)) !== null) {
    if (match.index > lastIndex) {
      throw new Error('Некорректная формула');
    }

    lastIndex = termRegex.lastIndex;
    hasTerm = true;

    const sign = match[1] === '-' ? -1 : 1;
    const plainNumber = match[6];

    if (plainNumber !== undefined) {
      const value = toNumber(plainNumber);
      total += sign * value;
      details.push(`${sign < 0 ? '-' : ''}${value}`);
      continue;
    }

    const count = match[2] === '' ? 1 : toNumber(match[2], 1);
    const sides = toNumber(match[3]);
    const keepType = match[4];
    const keepCount = match[5] !== undefined ? toNumber(match[5]) : count;

    if (!Number.isInteger(count) || count <= 0) {
      throw new Error('Некорректное количество кубиков');
    }

    if (!Number.isInteger(sides) || sides <= 0) {
      throw new Error('Некорректная сторона кубика');
    }

    if (!Number.isInteger(keepCount) || keepCount < 0 || keepCount > count) {
      throw new Error('Некорректное значение keep');
    }

    const rolls = Array.from({ length: count }, () => rollDie(sides));
    let kept = [...rolls].sort((a, b) => b - a);

    if (keepType === 'kl') {
      kept = kept.reverse();
    }

    kept = kept.slice(0, keepCount);
    const sum = kept.reduce((acc, value) => acc + value, 0);

    total += sign * sum;
    details.push(
      `${sign < 0 ? '-' : ''}${count}d${sides}${
        keepType ? `${keepType}${keepCount}` : ''
      } [${rolls.join(', ')}] => ${sum}`
    );
  }

  if (!hasTerm || lastIndex !== expr.length) {
    throw new Error('Некорректная формула');
  }

  return {
    total,
    details,
  };
}

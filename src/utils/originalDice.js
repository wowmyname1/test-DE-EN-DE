export function validateExpression(expr) {
  if (!expr || !expr.trim()) {
    return { valid: false, error: null };
  }

  expr = expr.trim().toLowerCase();

  if (/[^0-9dkhl+\-\s]/.test(expr)) {
    return { valid: false, error: 'Недопустимые символы' };
  }

  if (!/^[\d+\-]/.test(expr)) {
    return { valid: false, error: 'Должно начинаться с числа или +/-' };
  }

  const tokens = [];
  let current = '';
  let sign = '+';

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];

    if ((ch === '+' || ch === '-') && i > 0) {
      const prev3 = expr.substring(Math.max(0, i - 2), i);

      if (prev3.endsWith('kh') || prev3.endsWith('kl')) {
        current += ch;
        continue;
      }

      if (current) {
        tokens.push({ raw: current, sign });
      }

      current = '';
      sign = ch;
    } else {
      current += ch;
    }
  }

  if (current) {
    tokens.push({ raw: current, sign });
  }

  if (tokens.length === 0) {
    return { valid: false, error: 'Пустое выражение' };
  }

  for (const t of tokens) {
    const raw = t.raw.trim();

    if (!raw) {
      return { valid: false, error: 'Пустой токен' };
    }

    if (/^\d+$/.test(raw)) {
      continue;
    }

    const diceMatch = raw.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/);

    if (!diceMatch) {
      return { valid: false, error: `Неверный формат: "${raw}"` };
    }

    const num = diceMatch[1] ? parseInt(diceMatch[1], 10) : 1;
    const sides = parseInt(diceMatch[2], 10);
    const keepType = diceMatch[3];
    const keepCount = diceMatch[4] ? parseInt(diceMatch[4], 10) : num;

    if (num < 1 || num > 100) {
      return { valid: false, error: 'Количество: 1–100' };
    }

    if (sides < 2 || sides > 1000) {
      return { valid: false, error: 'Грани: 2–1000' };
    }

    if (keepType && keepCount > num) {
      return { valid: false, error: `Нельзя оставить ${keepCount} из ${num}` };
    }
  }

  return { valid: true, error: null };
}

export function parseDiceExpression(expr) {
  expr = expr.replace(/\s+/g, '').toLowerCase();

  const tokens = [];
  let current = '';
  let sign = '+';

  for (let i = 0; i < expr.length; i++) {
    const ch = expr[i];

    if ((ch === '+' || ch === '-') && i > 0) {
      const prev3 = expr.substring(Math.max(0, i - 2), i);

      if (prev3.endsWith('kh') || prev3.endsWith('kl')) {
        current += ch;
        continue;
      }

      if (current) {
        tokens.push({ expr: current, sign });
      }

      current = '';
      sign = ch;
    } else {
      current += ch;
    }
  }

  if (current) {
    tokens.push({ expr: current, sign });
  }

  const results = [];
  let total = 0;
  const allDice = [];
  let modifier = 0;

  tokens.forEach((token) => {
    const match = token.expr.match(/^(\d*)d(\d+)(kh|kl)?(\d*)$/);

    if (match) {
      const num = parseInt(match[1], 10) || 1;
      const sides = parseInt(match[2], 10);
      const keepType = match[3];
      const keepCount =
        match[4] !== undefined && match[4] !== ''
          ? parseInt(match[4], 10)
          : num;

      const rolls = [];

      for (let i = 0; i < num; i++) {
        const val = Math.floor(Math.random() * sides) + 1;
        rolls.push({ value: val, sides });
      }

      let keptIndices = rolls.map((_, i) => i);

      if (keepType) {
        const indexed = rolls.map((r, i) => ({ ...r, i }));

        if (keepType === 'kh') {
          indexed.sort((a, b) => b.value - a.value);
        } else {
          indexed.sort((a, b) => a.value - b.value);
        }

        keptIndices = indexed.slice(0, keepCount).map((x) => x.i);
      }

      const keptSet = new Set(keptIndices);

      rolls.forEach((r, i) => {
        allDice.push({
          id: allDice.length,
          value: r.value,
          sides: r.sides,
          selected: keptSet.has(i),
          spent: false,
          dropped: Boolean(keepType && !keptSet.has(i)),
          sign: token.sign,
        });
      });

      const sum = rolls
        .filter((_, i) => keptSet.has(i))
        .reduce((a, b) => a + b.value, 0);

      total += token.sign === '+' ? sum : -sum;

      results.push({
        type: 'dice',
        rolls,
        kept: rolls.filter((_, i) => keptSet.has(i)),
        keepType,
        sides,
        sign: token.sign,
        sum,
      });
    } else {
      const num = parseInt(token.expr, 10);

      if (!isNaN(num)) {
        modifier += token.sign === '+' ? num : -num;
        total += token.sign === '+' ? num : -num;

        results.push({
          type: 'modifier',
          value: num,
          sign: token.sign,
        });
      }
    }
  });

  return {
    total,
    results,
    expression: expr,
    allDice,
    modifier,
  };
}

export function getSelectedSum(activeRoll) {
  if (!activeRoll) {
    return 0;
  }

  let posSum = 0;
  let negSum = 0;

  activeRoll.dice
    .filter((d) => d.selected && !d.spent)
    .forEach((d) => {
      if (d.sign === '+') {
        posSum += d.value;
      } else {
        negSum += d.value;
      }
    });

  return posSum - negSum + activeRoll.modifier;
}

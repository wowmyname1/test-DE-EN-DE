import { useAppStore } from '../store/useAppStore.js';
import { rollExpression } from './dice.js';

export const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const applyAmountToCharacter = (character, type, amount) => {
  if (type === 'damage') {
    let remaining = amount;
    let tempHp = toNumber(character.tempHp);

    if (tempHp > 0) {
      const absorbed = Math.min(tempHp, remaining);
      tempHp -= absorbed;
      remaining -= absorbed;
    }

    const hpCurrent = Math.max(0, toNumber(character.hpCurrent) - remaining);

    return {
      ...character,
      tempHp,
      hpCurrent,
    };
  }

  if (type === 'healing') {
    const hpMax = toNumber(character.hpMax);
    const hpCurrent = toNumber(character.hpCurrent);

    const nextHp =
      hpMax > 0 ? Math.min(hpMax, hpCurrent + amount) : hpCurrent + amount;

    return {
      ...character,
      hpCurrent: nextHp,
    };
  }

  if (type === 'temp') {
    return {
      ...character,
      tempHp: toNumber(character.tempHp) + amount,
    };
  }

  return character;
};

export const rollQuick = (formulaRaw) => {
  const formula = String(formulaRaw || '').trim();

  if (!formula) {
    return;
  }

  try {
    const result = rollExpression(formula);
    const total = Math.max(0, toNumber(result.total));

    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total,
        details: result.details,
        error: null,
      },
    });

    useAppStore.getState().addLog(`Быстрый бросок ${formula} = ${total}`);
  } catch (error) {
    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total: 0,
        details: [],
        error: error.message,
      },
    });
  }
};

export const rollAndApplyToCharacter = (character, diceToken, type) => {
  if (!character) {
    return;
  }

  const formula = `1${diceToken}`;

  try {
    const result = rollExpression(formula);
    const amount = Math.max(0, toNumber(result.total));

    if (amount <= 0) {
      return;
    }

    useAppStore.setState((prev) => {
      const apply = (list) =>
        list.map((item) => {
          if (item.id !== character.id) {
            return item;
          }

          return applyAmountToCharacter(item, type, amount);
        });

      return {
        players: apply(prev.players),
        npcs: apply(prev.npcs),
      };
    });

    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total: amount,
        details: result.details,
        error: null,
      },
    });

    const label =
      type === 'damage'
        ? 'урон'
        : type === 'healing'
          ? 'лечение'
          : 'временные HP';

    useAppStore
      .getState()
      .addLog(`${character.name}: быстрый ${label} ${amount} (${formula})`);
  } catch (error) {
    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total: 0,
        details: [],
        error: error.message,
      },
    });
  }
};

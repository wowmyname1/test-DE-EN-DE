import { useAppStore } from '../store/useAppStore.js';
import { useDiceTrayStore } from '../store/diceTrayStore.js';
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

export const applyAmountToCharacterStore = (characterId, type, amount) => {
  useAppStore.setState((prev) => {
    const apply = (list) =>
      list.map((item) => {
        if (item.id !== characterId) {
          return item;
        }

        return applyAmountToCharacter(item, type, amount);
      });

    return {
      players: apply(prev.players),
      npcs: apply(prev.npcs),
    };
  });
};

export const effectTypeLabel = (type) => {
  if (type === 'damage') {
    return 'урон';
  }

  if (type === 'healing') {
    return 'лечение';
  }

  if (type === 'temp') {
    return 'временные HP';
  }

  if (type === 'attack') {
    return 'атака';
  }

  return 'бросок';
};

export const inferEffectType = (label = '') => {
  const text = String(label || '').toLowerCase();

  if (text.includes('урон') || text.includes('damage')) {
    return 'damage';
  }

  if (text.includes('леч') || text.includes('heal')) {
    return 'healing';
  }

  if (text.includes('времен') || text.includes('temp')) {
    return 'temp';
  }

  if (text.includes('атак') || text.includes('attack')) {
    return 'attack';
  }

  return 'generic';
};

export const rollToTray = ({
  formula,
  label = '',
  source = '',
  effectType = null,
  character = null,
  apply = false,
}) => {
  const trimmedFormula = String(formula || '').trim();

  if (!trimmedFormula) {
    return null;
  }

  try {
    const result = rollExpression(trimmedFormula);
    const total = Math.max(0, toNumber(result.total));
    const resolvedEffectType = effectType || inferEffectType(label);

    const rollId = useDiceTrayStore.getState().addRoll({
      formula: trimmedFormula,
      label: label || trimmedFormula,
      source,
      effectType: resolvedEffectType,
      total,
      details: result.details,
    });

    useAppStore.getState().setDice({
      lastResult: {
        formula: trimmedFormula,
        total,
        details: result.details,
        error: null,
      },
    });

    useAppStore
      .getState()
      .addLog(
        `${source ? `${source}: ` : ''}${label || trimmedFormula} = ${total}`
      );

    if (
      apply &&
      character?.id &&
      ['damage', 'healing', 'temp'].includes(resolvedEffectType)
    ) {
      applyAmountToCharacterStore(character.id, resolvedEffectType, total);
      useDiceTrayStore.getState().markApplied(rollId);

      useAppStore
        .getState()
        .addLog(
          `${character.name}: применено «${effectTypeLabel(resolvedEffectType)}» ${total}`
        );
    }

    return {
      id: rollId,
      formula: trimmedFormula,
      total,
      effectType: resolvedEffectType,
    };
  } catch (error) {
    useAppStore.getState().setDice({
      lastResult: {
        formula: trimmedFormula,
        total: 0,
        details: [],
        error: error.message,
      },
    });

    useAppStore.getState().addLog(`Ошибка броска: ${error.message}`);

    return null;
  }
};

export const rollManual = (formula) => {
  return rollToTray({
    formula,
    label: formula,
    source: 'Панель кубиков',
    effectType: null,
    character: null,
    apply: false,
  });
};

export const rollQuick = (quickRollOrFormula, character = null) => {
  const isObject =
    typeof quickRollOrFormula === 'object' && quickRollOrFormula !== null;

  const formula = isObject ? quickRollOrFormula.formula : quickRollOrFormula;
  const label = isObject ? quickRollOrFormula.name : '';

  const effectType = inferEffectType(label);

  const state = useAppStore.getState();
  const allCharacters = [...state.players, ...state.npcs];

  const targetId =
    state.selectedCharacterId || state.initiativeOrder[state.turnIndex ?? -1];

  const target =
    character || allCharacters.find((item) => item.id === targetId) || null;

  const shouldApply = Boolean(
    target && ['damage', 'healing', 'temp'].includes(effectType)
  );

  return rollToTray({
    formula,
    label,
    source: 'Быстрый бросок',
    effectType,
    character: target,
    apply: shouldApply,
  });
};

export const rollAndApplyToCharacter = (character, diceToken, type) => {
  if (!character) {
    return null;
  }

  const formula = `1${diceToken}`;

  const label =
    type === 'damage'
      ? 'Быстрый урон'
      : type === 'healing'
        ? 'Быстрое лечение'
        : 'Быстрые временные HP';

  return rollToTray({
    formula,
    label,
    source: character.name,
    effectType: type,
    character,
    apply: true,
  });
};

import { useAppStore } from '../store/useAppStore.js';
import { rollExpression } from './dice.js';
import {
  applyAmountToCharacterStore,
  effectTypeLabel,
  toNumber,
} from './diceActions.js';

const getTargetsByMode = (mode, explicitTargetId = null) => {
  const state = useAppStore.getState();

  const allCharacters = [...state.players, ...state.npcs];

  const targetId =
    explicitTargetId ||
    state.selectedCharacterId ||
    state.initiativeOrder[state.turnIndex ?? -1];

  const selectedCharacter =
    allCharacters.find((character) => character.id === targetId) || null;

  if (mode === 'single') {
    return selectedCharacter ? [selectedCharacter] : [];
  }

  if (mode === 'aoe' || mode === 'spread') {
    if (selectedCharacter) {
      return allCharacters.filter(
        (character) => character.side === selectedCharacter.side
      );
    }

    return allCharacters;
  }

  return selectedCharacter ? [selectedCharacter] : allCharacters;
};

export const applyAmountByMode = ({
  formula = '',
  total = null,
  type,
  source = '',
  explicitTargetId = null,
}) => {
  const state = useAppStore.getState();
  const mode = state.dice.mode || 'single';

  const targets = getTargetsByMode(mode, explicitTargetId);

  if (!targets.length) {
    state.addLog('Нет цели для применения броска.');
    return false;
  }

  if (mode === 'spread') {
    let appliedCount = 0;

    targets.forEach((target) => {
      try {
        const result = rollExpression(formula);
        const amount = Math.max(0, toNumber(result.total));

        if (amount <= 0) {
          return;
        }

        applyAmountToCharacterStore(target.id, type, amount);
        appliedCount += 1;

        state.addLog(
          `${target.name}: ${effectTypeLabel(type)} ${amount} (${formula}, разброс)`
        );
      } catch (error) {
        // Неверная формула для конкретного броска пропускается.
      }
    });

    return appliedCount > 0;
  }

  let amount = total;

  if (amount === null || amount === undefined) {
    try {
      const result = rollExpression(formula);
      amount = Math.max(0, toNumber(result.total));
    } catch (error) {
      state.addLog(`Ошибка броска: ${error.message}`);
      return false;
    }
  }

  if (amount <= 0) {
    return false;
  }

  targets.forEach((target) => {
    applyAmountToCharacterStore(target.id, type, amount);

    state.addLog(
      `${target.name}: ${effectTypeLabel(type)} ${amount} (${
        mode === 'aoe' ? 'AoE' : 'одиночный режим'
      })`
    );
  });

  return true;
};

export const applyLastDiceByMode = (type) => {
  const state = useAppStore.getState();
  const lastResult = state.dice.lastResult;

  if (!lastResult || lastResult.error) {
    return false;
  }

  return applyAmountByMode({
    formula: lastResult.formula || '',
    total: lastResult.total,
    type,
    source: 'Последний бросок',
  });
};

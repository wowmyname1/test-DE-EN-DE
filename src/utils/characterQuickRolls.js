import { useAppStore } from '../store/useAppStore.js';
import { uid } from './id.js';
import { validateExpression } from './originalDice.js';
import { showToast } from '../store/toastStore.js';

const updateCharacterById = (characterId, updater) => {
  useAppStore.setState((prev) => {
    const updateList = (list) =>
      list.map((item) => {
        if (item.id !== characterId) {
          return item;
        }

        return updater(item);
      });

    return {
      players: updateList(prev.players),
      npcs: updateList(prev.npcs),
    };
  });
};

export const addQuickRollToCharacter = (characterId, name, formula) => {
  const trimmedName = String(name || '').trim();
  const trimmedFormula = String(formula || '').trim();

  if (!trimmedName || !trimmedFormula) {
    showToast('Заполните название и формулу');
    return false;
  }

  const validation = validateExpression(trimmedFormula);

  if (!validation.valid) {
    showToast(`❌ ${validation.error || 'Неверная формула'}`);
    return false;
  }

  updateCharacterById(characterId, (character) => ({
    ...character,
    quickRolls: [
      ...(character.quickRolls || []),
      {
        id: uid(),
        name: trimmedName,
        formula: trimmedFormula,
      },
    ],
  }));

  showToast(`🎲 Добавлен: ${trimmedName}`);

  return true;
};

export const deleteQuickRollFromCharacter = (characterId, rollId) => {
  updateCharacterById(characterId, (character) => ({
    ...character,
    quickRolls: (character.quickRolls || []).filter(
      (quickRoll) => quickRoll.id !== rollId
    ),
  }));

  showToast('Быстрый бросок удалён');
};

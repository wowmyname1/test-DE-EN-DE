import { useActiveRollStore } from '../store/activeRollStore.js';
import { useAppStore } from '../store/useAppStore.js';
import { getSelectedSum } from './originalDice.js';
import { applyOriginalDamage } from './hpEffects.js';
import { showToast } from '../store/toastStore.js';

export const applyAoE = () => {
  const store = useActiveRollStore.getState();
  const activeRoll = store.activeRoll;

  if (!activeRoll || activeRoll.mode !== 'aoe') {
    return;
  }

  if (!activeRoll.aoeTargets.length) {
    return;
  }

  const amount = getSelectedSum(activeRoll);

  if (amount <= 0) {
    return;
  }

  activeRoll.aoeTargets.forEach((characterId) => {
    applyOriginalDamage(characterId, amount);
  });

  store.clearSelection();
  store.clearAoeTargets();

  useAppStore
    .getState()
    .addLog(`AoE: ${amount} урона по ${activeRoll.aoeTargets.length} целям`);

  showToast(`💥 AoE: ${amount} урона по ${activeRoll.aoeTargets.length} целям`);
};

export const applySpreadToCharacter = (characterId) => {
  const store = useActiveRollStore.getState();
  const activeRoll = store.activeRoll;

  if (!activeRoll || activeRoll.mode !== 'spread') {
    return false;
  }

  const selectedDice = activeRoll.dice.filter(
    (die) => die.selected && !die.spent
  );

  if (!selectedDice.length) {
    showToast('Выберите кубик для разброса');
    return false;
  }

  const die = selectedDice[0];

  applyOriginalDamage(characterId, die.value);
  store.spendDie(die.id);

  const updatedRoll = useActiveRollStore.getState().activeRoll;

  if (!updatedRoll) {
    return true;
  }

  const remainingAll = updatedRoll.dice.filter((d) => !d.spent);

  if (!remainingAll.length) {
    store.clearActiveRoll();
    return true;
  }

  const remainingSelected = updatedRoll.dice.filter(
    (d) => d.selected && !d.spent
  ).length;

  useAppStore
    .getState()
    .addLog(`Разброс: осталось выбранных кубиков: ${remainingSelected}`);

  showToast(`Осталось кубиков: ${remainingSelected}`);

  return true;
};

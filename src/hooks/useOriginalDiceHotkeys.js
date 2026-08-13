import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { useActiveRollStore } from '../store/activeRollStore.js';
import { getSelectedSum } from '../utils/originalDice.js';
import { applyAmountToCharacterStore } from '../utils/diceActions.js';

export function useOriginalDiceHotkeys() {
  useEffect(() => {
    const handler = (event) => {
      const appStore = useAppStore.getState();

      if (event.code === 'Escape' && appStore.activeModal) {
        appStore.closeModal();
        return;
      }

      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (
        isEditable ||
        appStore.activeModal ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      const rollStore = useActiveRollStore.getState();
      const activeRoll = rollStore.activeRoll;

      if (!activeRoll) {
        if (event.code === 'Escape') {
          rollStore.clearActiveRoll();
        }

        return;
      }

      if (event.code === 'Digit1' || event.code === 'Numpad1') {
        rollStore.setRollMode('single');
        return;
      }

      if (event.code === 'Digit2' || event.code === 'Numpad2') {
        rollStore.setRollMode('aoe');
        return;
      }

      if (event.code === 'Digit3' || event.code === 'Numpad3') {
        rollStore.setRollMode('spread');
        return;
      }

      if (event.code === 'Escape') {
        rollStore.clearActiveRoll();
        return;
      }

      if (activeRoll.mode === 'single') {
        const targetId =
          appStore.selectedCharacterId ||
          appStore.initiativeOrder[appStore.turnIndex ?? -1];

        if (!targetId) {
          return;
        }

        const amount = getSelectedSum(activeRoll);

        if (amount <= 0) {
          return;
        }

        if (event.code === 'KeyD') {
          applyAmountToCharacterStore(targetId, 'damage', amount);
          rollStore.clearSelection();
          appStore.addLog(`Оригинальный бросок: урон ${amount}`);
        }

        if (event.code === 'KeyH') {
          applyAmountToCharacterStore(targetId, 'healing', amount);
          rollStore.clearSelection();
          appStore.addLog(`Оригинальный бросок: лечение ${amount}`);
        }

        if (event.code === 'KeyT') {
          applyAmountToCharacterStore(targetId, 'temp', amount);
          rollStore.clearSelection();
          appStore.addLog(`Оригинальный бросок: временные HP ${amount}`);
        }
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);
}

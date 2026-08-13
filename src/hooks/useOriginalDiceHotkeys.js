import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { useActiveRollStore } from '../store/activeRollStore.js';
import { useTargetingStore } from '../store/targetingStore.js';
import { getSelectedSum } from '../utils/originalDice.js';
import { applyOriginalHpEffect } from '../utils/hpEffects.js';
import { applyAoE } from '../utils/rollApplication.js';

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
      const targetingStore = useTargetingStore.getState();
      const activeRoll = rollStore.activeRoll;

      if (event.code === 'Escape') {
        targetingStore.closeHpPopup();
        rollStore.clearActiveRoll();
        return;
      }

      if (!activeRoll) {
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

      if (event.code === 'Enter' && activeRoll.mode === 'aoe') {
        applyAoE();
        return;
      }

      if (activeRoll.mode === 'single') {
        const lastTargetId = targetingStore.lastTargetId;

        if (!lastTargetId) {
          return;
        }

        const amount = getSelectedSum(activeRoll);

        if (amount <= 0) {
          return;
        }

        if (event.code === 'KeyD') {
          applyOriginalHpEffect(lastTargetId, 'damage', amount);
          rollStore.clearSelection();
        }

        if (event.code === 'KeyH') {
          applyOriginalHpEffect(lastTargetId, 'heal', amount);
          rollStore.clearSelection();
        }

        if (event.code === 'KeyT') {
          applyOriginalHpEffect(lastTargetId, 'temp', amount);
          rollStore.clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);
}

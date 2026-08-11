import { useEffect } from 'react';
import { useAppStore } from '../store/useAppStore.js';

export function useCombatHotkeys() {
  useEffect(() => {
    const handler = (event) => {
      const store = useAppStore.getState();

      if (event.code === 'Escape' && store.activeModal) {
        store.closeModal();
        return;
      }

      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (
        isEditable ||
        store.activeModal ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      if (event.code === 'Digit1' || event.code === 'Numpad1') {
        store.setDice({ mode: 'single' });
      }

      if (event.code === 'Digit2' || event.code === 'Numpad2') {
        store.setDice({ mode: 'aoe' });
      }

      if (event.code === 'Digit3' || event.code === 'Numpad3') {
        store.setDice({ mode: 'spread' });
      }

      if (event.code === 'KeyD') {
        store.applyLastRollToCharacter('damage');
      }

      if (event.code === 'KeyH') {
        store.applyLastRollToCharacter('healing');
      }

      if (event.code === 'KeyT') {
        store.applyLastRollToCharacter('temp');
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);
}

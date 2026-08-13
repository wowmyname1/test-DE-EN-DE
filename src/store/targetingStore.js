import { create } from 'zustand';

export const useTargetingStore = create((set) => ({
  lastTargetId: null,
  hpPopup: {
    open: false,
    characterId: null,
    x: 0,
    y: 0,
  },

  setLastTarget: (characterId) => {
    set({ lastTargetId: characterId });
  },

  openHpPopup: (characterId, x, y) => {
    set({
      lastTargetId: characterId,
      hpPopup: {
        open: true,
        characterId,
        x,
        y,
      },
    });
  },

  closeHpPopup: () => {
    set((state) => ({
      hpPopup: {
        ...state.hpPopup,
        open: false,
        characterId: null,
      },
    }));
  },
}));

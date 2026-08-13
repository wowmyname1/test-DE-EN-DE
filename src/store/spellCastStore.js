import { create } from 'zustand';

export const useSpellCastStore = create((set, get) => ({
  activeSpell: null,
  targets: [],
  selecting: false,
  castLog: null,

  startSpellCast: (spell) => {
    set({
      activeSpell: spell,
      targets: [],
      selecting: true,
      castLog: null,
    });
  },

  toggleTarget: (characterId) => {
    set((state) => {
      const targets = state.targets.includes(characterId)
        ? state.targets.filter((id) => id !== characterId)
        : [...state.targets, characterId];
      return { targets };
    });
  },

  setSingleTarget: (characterId) => {
    set({ targets: [characterId], selecting: false });
  },

  cancelSpellCast: () => {
    set({ activeSpell: null, targets: [], selecting: false, castLog: null });
  },

  clearCastLog: () => {
    set({ castLog: null });
  },
}));

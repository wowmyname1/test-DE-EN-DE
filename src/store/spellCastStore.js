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

  executeSpell: (characters) => {
    const state = get();
    const spell = state.activeSpell;
    if (!spell || state.targets.length === 0) return null;

    const dc = calculateSpellDC(spell);
    const log = { spell, dc, results: [] };

    state.targets.forEach((charId) => {
      const character = characters.find((c) => c.id === charId);
      if (!character) return;

      let success = null;
      let details = 'Без спасброска';

      if (spell.logic && spell.logic.save) {
        const saveRoll = Math.floor(Math.random() * 20) + 1;
        success = saveRoll >= dc;
        details = `d20=${saveRoll} (DC ${dc})`;
      } else {
        success = true;
      }

      log.results.push({ characterId: charId, name: character.name, success, details });
    });

    set({ castLog: log, selecting: false });
    return log;
  },

  clearCastLog: () => {
    set({ castLog: null });
  },
}));

export function calculateSpellDC(spell) {
  if (!spell.logic || !spell.logic.save) return 10;
  return 13;
}

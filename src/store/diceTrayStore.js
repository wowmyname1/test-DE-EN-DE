import { create } from 'zustand';
import { uid } from '../utils/id.js';

export const useDiceTrayStore = create((set) => ({
  rolls: [],
  selectedRollId: null,

  addRoll: (roll) => {
    const entry = {
      id: uid(),
      applied: false,
      createdAt: Date.now(),
      ...roll,
    };

    set((state) => ({
      rolls: [entry, ...state.rolls].slice(0, 20),
      selectedRollId: entry.id,
    }));

    return entry.id;
  },

  selectRoll: (id) =>
    set((state) => ({
      selectedRollId: state.selectedRollId === id ? null : id,
    })),

  removeRoll: (id) =>
    set((state) => ({
      rolls: state.rolls.filter((roll) => roll.id !== id),
      selectedRollId: state.selectedRollId === id ? null : state.selectedRollId,
    })),

  clearRolls: () =>
    set({
      rolls: [],
      selectedRollId: null,
    }),

  markApplied: (id) =>
    set((state) => ({
      rolls: state.rolls.map((roll) => {
        if (roll.id !== id) {
          return roll;
        }

        return {
          ...roll,
          applied: true,
        };
      }),
    })),
}));

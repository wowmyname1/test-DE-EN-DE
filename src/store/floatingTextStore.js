import { create } from 'zustand';
import { uid } from '../utils/id.js';

export const useFloatingTextStore = create((set) => ({
  texts: [],

  addFloatingText: (payload) => {
    const id = uid();

    set((state) => ({
      texts: [
        ...state.texts,
        {
          id,
          ...payload,
        },
      ],
    }));

    setTimeout(() => {
      set((state) => ({
        texts: state.texts.filter((text) => text.id !== id),
      }));
    }, 1500);
  },
}));

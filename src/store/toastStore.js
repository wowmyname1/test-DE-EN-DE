import { create } from 'zustand';
import { uid } from '../utils/id.js';

export const useToastStore = create((set) => ({
  toasts: [],

  showToast: (text) => {
    const id = uid();

    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          id,
          text,
        },
      ],
    }));

    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      }));
    }, 3000);
  },
}));

export const showToast = (text) => {
  useToastStore.getState().showToast(text);
};

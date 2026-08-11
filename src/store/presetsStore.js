import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '../utils/id.js';

const normalizeCategory = (category) => {
  if (['player', 'npc', 'spell', 'status'].includes(category)) {
    return category;
  }

  return 'player';
};

const createDefaultPresets = () => {
  return {
    player: [
      {
        id: uid(),
        name: 'Воин',
        data: {
          name: 'Воин',
          type: 'Воин',
          level: '1',
          hpMax: 12,
          hpCurrent: 12,
          ac: 16,
          initiative: 2,
          color: '#22c55e',
        },
      },
    ],

    npc: [
      {
        id: uid(),
        name: 'Гоблин',
        data: {
          name: 'Гоблин',
          type: 'Гуманоид',
          level: '1/4',
          hpMax: 7,
          hpCurrent: 7,
          ac: 15,
          initiative: 3,
          color: '#ef4444',
        },
      },
    ],

    spell: [
      {
        id: uid(),
        name: 'Огненный снаряд',
        data: {
          name: 'Огненный снаряд',
          level: 0,
          icon: '🔥',
          school: 'Проявление',
          castTime: '1 действие',
          range: '60 футов',
          duration: 'Мгновенно',
          description: 'Дальний огненный снаряд, наносящий урон огнём.',
          logic: {
            targetMode: 'single',
            effectType: 'damage',
            formula: '1d10',
            statusTemplateId: '',
            statusDuration: '',
          },
        },
      },
    ],

    status: [
      {
        id: uid(),
        name: 'Горение',
        data: {
          name: 'Горение',
          icon: '🔥',
          color: '#f97316',
          description: 'Персонаж горит и получает урон в конце хода.',
          duration: null,
          logic: {
            nodes: [
              {
                id: uid(),
                type: 'action',
                parentId: '',
                trigger: 'end',
                effectType: 'damage',
                formula: '1d6',
                conditionType: '',
                conditionValue: '',
                text: 'Урон огнём',
              },
            ],
          },
        },
      },
    ],
  };
};

export const usePresetsStore = create(
  persist(
    (set) => ({
      presets: createDefaultPresets(),

      upsertPreset: (category, preset) =>
        set((state) => {
          const cat = normalizeCategory(category);
          const list = state.presets?.[cat] || [];

          const existingById = preset.id
            ? list.find((item) => item.id === preset.id)
            : null;

          const existingByName =
            !existingById && preset.name
              ? list.find((item) => item.name === preset.name)
              : null;

          const existing = existingById || existingByName;

          if (existing) {
            return {
              presets: {
                ...state.presets,
                [cat]: list.map((item) => {
                  if (item.id !== existing.id) {
                    return item;
                  }

                  return {
                    ...existing,
                    ...preset,
                    id: existing.id,
                  };
                }),
              },
            };
          }

          return {
            presets: {
              ...state.presets,
              [cat]: [
                ...list,
                {
                  id: uid(),
                  ...preset,
                },
              ],
            },
          };
        }),

      removePreset: (category, id) =>
        set((state) => {
          const cat = normalizeCategory(category);

          return {
            presets: {
              ...state.presets,
              [cat]: (state.presets?.[cat] || []).filter(
                (item) => item.id !== id
              ),
            },
          };
        }),
    }),
    {
      name: 'dnd-presets',
      version: 1,
      partialize: (state) => ({
        presets: state.presets,
      }),
    }
  )
);

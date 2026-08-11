import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '../utils/id.js';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const useMapStore = create(
  persist(
    (set) => ({
      tokens: [],
      showGrid: true,

      syncCharacters: (players, npcs) =>
        set((state) => {
          const allCharacters = [
            ...players.map((character) => ({
              ...character,
              side: 'player',
            })),
            ...npcs.map((character) => ({
              ...character,
              side: 'npc',
            })),
          ];

          const characterIds = new Set(allCharacters.map((character) => character.id));

          let tokens = state.tokens.filter(
            (token) => token.kind === 'object' || characterIds.has(token.characterId)
          );

          let playerIndex = 0;
          let npcIndex = 0;

          allCharacters.forEach((character) => {
            const exists = tokens.some((token) => token.characterId === character.id);

            if (!exists) {
              if (character.side === 'player') {
                const x = 12 + (playerIndex % 3) * 10;
                const y = 18 + Math.floor(playerIndex / 3) * 14;

                tokens = [
                  ...tokens,
                  {
                    id: character.id,
                    kind: 'player',
                    characterId: character.id,
                    x,
                    y,
                  },
                ];
              } else {
                const x = 70 + (npcIndex % 3) * 10;
                const y = 18 + Math.floor(npcIndex / 3) * 14;

                tokens = [
                  ...tokens,
                  {
                    id: character.id,
                    kind: 'npc',
                    characterId: character.id,
                    x,
                    y,
                  },
                ];
              }
            }

            if (character.side === 'player') {
              playerIndex += 1;
            } else {
              npcIndex += 1;
            }
          });

          return {
            tokens,
          };
        }),

      moveToken: (id, x, y) =>
        set((state) => ({
          tokens: state.tokens.map((token) => {
            if (token.id !== id) {
              return token;
            }

            return {
              ...token,
              x: clamp(x, 2, 98),
              y: clamp(y, 4, 96),
            };
          }),
        })),

      addObject: (name, icon) =>
        set((state) => ({
          tokens: [
            ...state.tokens,
            {
              id: uid(),
              kind: 'object',
              name,
              icon,
              x: 50,
              y: 50,
            },
          ],
        })),

      removeObject: (id) =>
        set((state) => ({
          tokens: state.tokens.filter(
            (token) => !(token.id === id && token.kind === 'object')
          ),
        })),

      toggleGrid: () =>
        set((state) => ({
          showGrid: !state.showGrid,
        })),

      resetPositions: () =>
        set((state) => {
          let playerIndex = 0;
          let npcIndex = 0;
          let objectIndex = 0;

          return {
            tokens: state.tokens.map((token) => {
              if (token.kind === 'player') {
                const x = 12 + (playerIndex % 3) * 10;
                const y = 18 + Math.floor(playerIndex / 3) * 14;

                playerIndex += 1;

                return {
                  ...token,
                  x,
                  y,
                };
              }

              if (token.kind === 'npc') {
                const x = 70 + (npcIndex % 3) * 10;
                const y = 18 + Math.floor(npcIndex / 3) * 14;

                npcIndex += 1;

                return {
                  ...token,
                  x,
                  y,
                };
              }

              const x = 30 + (objectIndex % 4) * 12;
              const y = 30 + Math.floor(objectIndex / 4) * 14;

              objectIndex += 1;

              return {
                ...token,
                x,
                y,
              };
            }),
          };
        }),
    }),
    {
      name: 'dnd-map',
      version: 1,
      partialize: (state) => ({
        tokens: state.tokens,
        showGrid: state.showGrid,
      }),
    }
  )
);

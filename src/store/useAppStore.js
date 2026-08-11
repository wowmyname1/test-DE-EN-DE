import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rollExpression } from '../utils/dice.js';
import { uid } from '../utils/id.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeCharacter = (side, data) => {
  const hpMax = toNumber(data.hpMax);
  const hpCurrent =
    data.hpCurrent === '' || data.hpCurrent === undefined
      ? hpMax
      : toNumber(data.hpCurrent);

  return {
    id: uid(),
    side,
    name: String(data.name || '').trim() || (side === 'player' ? 'Игрок' : 'NPC'),
    type: String(data.type || '').trim(),
    level: String(data.level || '').trim(),
    hpMax,
    hpCurrent,
    ac: toNumber(data.ac),
    initiative: toNumber(data.initiative),
    color: data.color || (side === 'player' ? '#22c55e' : '#ef4444'),
    tempHp: 0,
    statuses: [],
  };
};

const decrementStatuses = (characters) =>
  characters.map((character) => ({
    ...character,
    statuses: (character.statuses || [])
      .map((status) => {
        if (status.duration === null || status.duration === undefined) {
          return status;
        }

        return {
          ...status,
          duration: toNumber(status.duration) - 1,
        };
      })
      .filter(
        (status) =>
          status.duration === null ||
          status.duration === undefined ||
          status.duration > 0
      ),
  }));

export const useAppStore = create(
  persist(
    (set, get) => ({
      round: 1,
      turnIndex: null,
      combatStarted: false,
      initiativeOrder: [],
      selectedCharacterId: null,
      players: [],
      npcs: [],
      statusTemplates: [],
      spells: [],
      quickRolls: [],
      logs: [],
      dice: {
        formula: '1d20',
        mode: 'single',
        lastResult: null,
      },
      activeModal: null,
      modalPayload: {},

      openModal: (modal, payload = {}) =>
        set({
          activeModal: modal,
          modalPayload: payload,
        }),

      closeModal: () =>
        set({
          activeModal: null,
          modalPayload: {},
        }),

      addLog: (text) =>
        set((state) => ({
          logs: [
            {
              id: uid(),
              time: new Date().toLocaleTimeString(),
              text,
            },
            ...state.logs,
          ].slice(0, 100),
        })),

      addCharacter: (side, data) =>
        set((state) => {
          const character = normalizeCharacter(side, data);

          if (side === 'npc') {
            return {
              npcs: [...state.npcs, character],
            };
          }

          return {
            players: [...state.players, character],
          };
        }),

      removeCharacter: (side, id) =>
        set((state) => {
          const players =
            side === 'player'
              ? state.players.filter((item) => item.id !== id)
              : state.players;

          const npcs =
            side === 'npc'
              ? state.npcs.filter((item) => item.id !== id)
              : state.npcs;

          const currentId = state.initiativeOrder[state.turnIndex ?? -1];
          const initiativeOrder = state.initiativeOrder.filter(
            (itemId) => itemId !== id
          );

          let turnIndex = state.turnIndex;

          if (initiativeOrder.length === 0) {
            turnIndex = null;
          } else if (turnIndex !== null) {
            if (currentId === id) {
              turnIndex = Math.min(turnIndex, initiativeOrder.length - 1);
            } else if (turnIndex >= initiativeOrder.length) {
              turnIndex = initiativeOrder.length - 1;
            }
          }

          return {
            players,
            npcs,
            initiativeOrder,
            turnIndex,
            selectedCharacterId:
              state.selectedCharacterId === id ? null : state.selectedCharacterId,
          };
        }),

      selectCharacter: (id) =>
        set((state) => ({
          selectedCharacterId: state.selectedCharacterId === id ? null : id,
        })),

      addStatusToCharacter: (characterId, status) =>
        set((state) => {
          const addStatus = (character) => {
            if (character.id !== characterId) {
              return character;
            }

            return {
              ...character,
              statuses: [
                ...(character.statuses || []),
                {
                  id: uid(),
                  icon: '✨',
                  color: '#a855f7',
                  duration: null,
                  ...status,
                },
              ],
            };
          };

          return {
            players: state.players.map(addStatus),
            npcs: state.npcs.map(addStatus),
          };
        }),

      removeStatusFromCharacter: (characterId, statusId) =>
        set((state) => {
          const removeStatus = (character) => {
            if (character.id !== characterId) {
              return character;
            }

            return {
              ...character,
              statuses: (character.statuses || []).filter(
                (status) => status.id !== statusId
              ),
            };
          };

          return {
            players: state.players.map(removeStatus),
            npcs: state.npcs.map(removeStatus),
          };
        }),

      addStatusTemplate: (template) =>
        set((state) => ({
          statusTemplates: [
            ...state.statusTemplates,
            {
              id: uid(),
              icon: '✨',
              color: '#a855f7',
              description: '',
              duration: null,
              ...template,
            },
          ],
        })),

      addSpell: (spell) =>
        set((state) => ({
          spells: [
            ...state.spells,
            {
              id: uid(),
              level: 0,
              icon: '✨',
              school: 'Воплощение',
              castTime: '',
              range: '',
              duration: '',
              description: '',
              ...spell,
            },
          ],
        })),

      addQuickRoll: (quickRoll) =>
        set((state) => ({
          quickRolls: [
            ...state.quickRolls,
            {
              id: uid(),
              ...quickRoll,
            },
          ],
        })),

      removeQuickRoll: (id) =>
        set((state) => ({
          quickRolls: state.quickRolls.filter((item) => item.id !== id),
        })),

      startCombat: () =>
        set((state) => {
          const allCharacters = [...state.players, ...state.npcs];
          const initiativeOrder = [...allCharacters]
            .sort((a, b) => toNumber(b.initiative) - toNumber(a.initiative))
            .map((character) => character.id);

          return {
            initiativeOrder,
            turnIndex: initiativeOrder.length ? 0 : null,
            combatStarted: initiativeOrder.length > 0,
            round: 1,
            selectedCharacterId: initiativeOrder[0] ?? null,
          };
        }),

      nextTurn: () =>
        set((state) => {
          if (!state.initiativeOrder.length) {
            return {};
          }

          const currentIndex =
            state.turnIndex === null ? -1 : toNumber(state.turnIndex, 0);
          const nextIndex = currentIndex + 1;

          if (nextIndex >= state.initiativeOrder.length) {
            return {
              players: decrementStatuses(state.players),
              npcs: decrementStatuses(state.npcs),
              turnIndex: 0,
              round: toNumber(state.round, 1) + 1,
              selectedCharacterId: state.initiativeOrder[0],
            };
          }

          return {
            turnIndex: nextIndex,
            selectedCharacterId: state.initiativeOrder[nextIndex],
          };
        }),

      resetCombat: () =>
        set({
          round: 1,
          turnIndex: null,
          combatStarted: false,
          initiativeOrder: [],
          selectedCharacterId: null,
        }),

      setDice: (patch) =>
        set((state) => ({
          dice: {
            ...state.dice,
            ...patch,
          },
        })),

      appendFormula: (token) =>
        set((state) => {
          const formula = String(state.dice.formula || '');
          const trimmed = formula.trim();

          if (token === '+' || token === '-') {
            if (!trimmed) {
              return {
                dice: {
                  ...state.dice,
                  formula: token === '-' ? '-' : '',
                },
              };
            }

            if (/[+\-]$/.test(trimmed)) {
              return {
                dice: {
                  ...state.dice,
                  formula: `${trimmed.slice(0, -1)}${token}`,
                },
              };
            }

            return {
              dice: {
                ...state.dice,
                formula: `${trimmed}${token}`,
              },
            };
          }

          const term = token.startsWith('d') ? `1${token}` : token;

          if (!trimmed) {
            return {
              dice: {
                ...state.dice,
                formula: term,
              },
            };
          }

          if (/[+\-]$/.test(trimmed)) {
            return {
              dice: {
                ...state.dice,
                formula: `${trimmed}${term}`,
              },
            };
          }

          return {
            dice: {
              ...state.dice,
              formula: `${trimmed}+${term}`,
            },
          };
        }),

      rollFormula: (formulaOverride) => {
        const state = get();
        const formula = String(formulaOverride ?? state.dice.formula ?? '').trim();

        try {
          const result = rollExpression(formula);

          set({
            dice: {
              ...state.dice,
              formula,
              lastResult: {
                formula,
                total: result.total,
                details: result.details,
                error: null,
              },
            },
          });

          get().addLog(`Бросок ${formula} = ${result.total}`);
        } catch (error) {
          set({
            dice: {
              ...state.dice,
              formula,
              lastResult: {
                formula,
                total: 0,
                details: [],
                error: error.message,
              },
            },
          });
        }
      },

      applyLastRollToCharacter: (type) => {
        const state = get();
        const targetId =
          state.selectedCharacterId ||
          state.initiativeOrder[state.turnIndex ?? -1];
        const total = toNumber(state.dice.lastResult?.total);

        if (!targetId || total <= 0) {
          return;
        }

        const allCharacters = [...state.players, ...state.npcs];
        const target = allCharacters.find(
          (character) => character.id === targetId
        );

        if (!target) {
          return;
        }

        const apply = (character) => {
          if (character.id !== targetId) {
            return character;
          }

          if (type === 'damage') {
            let remaining = total;
            let tempHp = toNumber(character.tempHp);

            if (tempHp > 0) {
              const absorbed = Math.min(tempHp, remaining);
              tempHp -= absorbed;
              remaining -= absorbed;
            }

            const hpCurrent = Math.max(
              0,
              toNumber(character.hpCurrent) - remaining
            );

            return {
              ...character,
              tempHp,
              hpCurrent,
            };
          }

          if (type === 'healing') {
            const hpMax = toNumber(character.hpMax);
            const hpCurrent = toNumber(character.hpCurrent);
            const nextHp =
              hpMax > 0 ? Math.min(hpMax, hpCurrent + total) : hpCurrent + total;

            return {
              ...character,
              hpCurrent: nextHp,
            };
          }

          if (type === 'temp') {
            return {
              ...character,
              tempHp: toNumber(character.tempHp) + total,
            };
          }

          return character;
        };

        set({
          players: state.players.map(apply),
          npcs: state.npcs.map(apply),
        });

        if (type === 'damage') {
          get().addLog(`${target.name}: урон ${total}`);
        }

        if (type === 'healing') {
          get().addLog(`${target.name}: лечение ${total}`);
        }

        if (type === 'temp') {
          get().addLog(`${target.name}: временные HP +${total}`);
        }
      },
    }),
    {
      name: 'dnd-encounter-builder-storage',
      version: 1,
      partialize: (state) => ({
        round: state.round,
        turnIndex: state.turnIndex,
        combatStarted: state.combatStarted,
        initiativeOrder: state.initiativeOrder,
        selectedCharacterId: state.selectedCharacterId,
        players: state.players,
        npcs: state.npcs,
        statusTemplates: state.statusTemplates,
        spells: state.spells,
        quickRolls: state.quickRolls,
        logs: state.logs,
        dice: state.dice,
      }),
    }
  )
);

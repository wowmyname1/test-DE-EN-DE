import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { uid } from '../utils/id.js';
import { rollExpression } from '../utils/dice.js';

const toNumber = (value, fallback = 0) => {
  if (value === '' || value === null || value === undefined) {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultCharacter = (side, data = {}) => {
  const hpMax = toNumber(data.hpMax, 0);

  const hpCurrent =
    data.hpCurrent === '' || data.hpCurrent === null || data.hpCurrent === undefined
      ? hpMax
      : toNumber(data.hpCurrent, hpMax);

  return {
    id: uid(),
    side,
    name: String(data.name || '').trim() || (side === 'player' ? 'Игрок' : 'NPC'),
    type: String(data.type || '').trim(),
    level: String(data.level || '').trim(),
    hpMax,
    hpCurrent,
    ac: toNumber(data.ac, 0),
    initiative: toNumber(data.initiative, 0),
    color: String(data.color || '').trim() || '#64748b',
    tempHp: 0,
    statuses: [],
  };
};

export const useAppStore = create(
  persist(
    (set, get) => ({
      round: 1,
      turnIndex: null,
      combatStarted: false,
      initiativeOrder: [],
      players: [],
      npcs: [],
      selectedCharacterId: null,

      dice: {
        formula: '1d20',
        mode: 'single',
        lastResult: null,
      },

      quickRolls: [
        { id: 'quick-attack', name: 'Атака', formula: '1d20+5' },
        { id: 'quick-damage', name: 'Урон', formula: '1d8+3' },
      ],

      statusTemplates: [
        {
          id: 'status-bless',
          name: 'Благословение',
          icon: '✨',
          color: '#22c55e',
          duration: 10,
          description: 'Дополнительный бонус к броскам.',
        },
        {
          id: 'status-haste',
          name: 'Ускорение',
          icon: '💨',
          color: '#38bdf8',
          duration: 10,
          description: 'Дополнительное действие или бонус к скорости.',
        },
      ],

      spells: [],
      logs: [],

      activeModal: null,
      modalPayload: {},

      openModal: (modal, payload = {}) => {
        set({ activeModal: modal, modalPayload: payload });
      },

      closeModal: () => {
        set({ activeModal: null, modalPayload: {} });
      },

      selectCharacter: (id) => {
        set({ selectedCharacterId: id });
      },

      addCharacter: (side, data) => {
        set((state) => {
          const character = defaultCharacter(side, data);

          return side === 'npc'
            ? { npcs: [...state.npcs, character] }
            : { players: [...state.players, character] };
        });
      },

      removeCharacter: (side, id) => {
        set((state) => {
          const filterList = (list) => list.filter((item) => item.id !== id);

          return {
            players: filterList(state.players),
            npcs: filterList(state.npcs),
            selectedCharacterId: state.selectedCharacterId === id ? null : state.selectedCharacterId,
            initiativeOrder: state.initiativeOrder.filter((characterId) => characterId !== id),
          };
        });
      },

      updateCharacter: (side, id, patch) => {
        set((state) => {
          const updateList = (list) =>
            list.map((item) => (item.id === id ? { ...item, ...patch } : item));

          return {
            players: updateList(state.players),
            npcs: updateList(state.npcs),
          };
        });
      },

      addStatusToCharacter: (characterId, status) => {
        set((state) => {
          const updateList = (list) =>
            list.map((character) => {
              if (character.id !== characterId) {
                return character;
              }

              return {
                ...character,
                statuses: [
                  ...(character.statuses || []),
                  {
                    id: uid(),
                    ...status,
                  },
                ],
              };
            });

          return {
            players: updateList(state.players),
            npcs: updateList(state.npcs),
          };
        });
      },

      removeStatusFromCharacter: (characterId, statusId) => {
        set((state) => {
          const updateList = (list) =>
            list.map((character) => {
              if (character.id !== characterId) {
                return character;
              }

              return {
                ...character,
                statuses: (character.statuses || []).filter((status) => status.id !== statusId),
              };
            });

          return {
            players: updateList(state.players),
            npcs: updateList(state.npcs),
          };
        });
      },

      startCombat: () => {
        const state = get();
        const allCharacters = [...state.players, ...state.npcs];

        if (!allCharacters.length) {
          get().addLog('Нельзя начать бой без персонажей', 'error');
          return;
        }

        const order = [...allCharacters]
          .sort((a, b) => Number(b.initiative || 0) - Number(a.initiative || 0))
          .map((character) => character.id);

        set({
          combatStarted: true,
          initiativeOrder: order,
          turnIndex: 0,
          round: 1,
        });

        get().addLog('⚔️ Бой начат', 'combat');
      },

      nextTurn: () => {
        set((state) => {
          if (!state.combatStarted || !state.initiativeOrder.length) {
            return {};
          }

          const nextIndex = (state.turnIndex ?? -1) + 1;

          if (nextIndex >= state.initiativeOrder.length) {
            return {
              turnIndex: 0,
              round: state.round + 1,
            };
          }

          return {
            turnIndex: nextIndex,
          };
        });
      },

      resetCombat: () => {
        set({
          round: 1,
          turnIndex: null,
          combatStarted: false,
          initiativeOrder: [],
        });

        get().addLog('🔄 Бой сброшен', 'combat');
      },

      setDice: (patch) => {
        set((state) => ({
          dice: {
            ...state.dice,
            ...patch,
          },
        }));
      },

      appendFormula: (token) => {
        set((state) => {
          let formula = state.dice.formula || '';

          if (token === '+' || token === '-') {
            if (!formula) {
              formula = token === '-' ? '-' : '';
            } else if (/[+\-]$/.test(formula)) {
              formula = formula.slice(0, -1) + token;
            } else {
              formula += token;
            }
          } else {
            const diceToken = token.startsWith('d') ? `1${token}` : token;

            if (!formula || /[+\-]$/.test(formula)) {
              formula += diceToken;
            } else {
              formula += `+${diceToken}`;
            }
          }

          return {
            dice: {
              ...state.dice,
              formula,
            },
          };
        });
      },

      addLog: (text, type = 'info') => {
        set((state) => ({
          logs: [
            {
              id: uid(),
              time: new Date().toLocaleTimeString(),
              text,
              type,
            },
            ...state.logs,
          ].slice(0, 80),
        }));
      },

      rollFormula: (formulaOverride = null) => {
        const state = get();
        const formula = formulaOverride ?? state.dice.formula;

        try {
          const result = rollExpression(formula);

          set((prev) => ({
            dice: {
              ...prev.dice,
              lastResult: {
                formula,
                total: result.total,
                details: result.details,
                error: null,
                at: Date.now(),
              },
            },
          }));

          get().addLog(`🎲 ${formula} = ${result.total}`, 'roll');

          return result;
        } catch (error) {
          set((prev) => ({
            dice: {
              ...prev.dice,
              lastResult: {
                formula,
                total: null,
                details: [],
                error: error.message,
                at: Date.now(),
              },
            },
          }));

          get().addLog(`❌ ${formula}: ${error.message}`, 'error');

          return null;
        }
      },

      addQuickRoll: (item) => {
        set((state) => ({
          quickRolls: [
            ...state.quickRolls,
            {
              id: uid(),
              ...item,
            },
          ],
        }));
      },

      removeQuickRoll: (id) => {
        set((state) => ({
          quickRolls: state.quickRolls.filter((item) => item.id !== id),
        }));
      },

      addStatusTemplate: (item) => {
        set((state) => ({
          statusTemplates: [
            ...state.statusTemplates,
            {
              id: uid(),
              ...item,
            },
          ],
        }));
      },

      addSpell: (item) => {
        set((state) => ({
          spells: [
            ...state.spells,
            {
              id: uid(),
              ...item,
            },
          ],
        }));
      },

      applyLastRollToCharacter: (kind) => {
        const state = get();
        const amount = state.dice.lastResult?.total;

        if (!Number.isFinite(amount) || amount <= 0) {
          get().addLog('Нет положительного результата для применения', 'error');
          return;
        }

        const targetId =
          state.selectedCharacterId || state.initiativeOrder[state.turnIndex ?? -1] || null;

        if (!targetId) {
          get().addLog('Выберите персонажа или начните бой', 'error');
          return;
        }

        set((prev) => {
          const updateList = (list) =>
            list.map((character) => {
              if (character.id !== targetId) {
                return character;
              }

              if (kind === 'damage') {
                let remaining = amount;
                let tempHp = Number(character.tempHp || 0);
                let hpCurrent = Number(character.hpCurrent || 0);

                if (tempHp > 0) {
                  const absorbed = Math.min(tempHp, remaining);
                  tempHp -= absorbed;
                  remaining -= absorbed;
                }

                hpCurrent = Math.max(0, hpCurrent - remaining);

                return {
                  ...character,
                  tempHp,
                  hpCurrent,
                };
              }

              if (kind === 'healing') {
                const hpMax = Number(character.hpMax || 0);
                const hpCurrent = Number(character.hpCurrent || 0);

                return {
                  ...character,
                  hpCurrent: hpMax > 0 ? Math.min(hpMax, hpCurrent + amount) : hpCurrent + amount,
                };
              }

              if (kind === 'temp') {
                return {
                  ...character,
                  tempHp: Number(character.tempHp || 0) + amount,
                };
              }

              return character;
            });

          return {
            players: updateList(prev.players),
            npcs: updateList(prev.npcs),
          };
        });

        if (kind === 'damage') {
          get().addLog(`⚔️ Урон ${amount} применён`, 'action');
        }

        if (kind === 'healing') {
          get().addLog(`💚 Лечение ${amount} применено`, 'action');
        }

        if (kind === 'temp') {
          get().addLog(`🛡️ Временные HP ${amount} применены`, 'action');
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
        players: state.players,
        npcs: state.npcs,
        selectedCharacterId: state.selectedCharacterId,
        dice: state.dice,
        quickRolls: state.quickRolls,
        statusTemplates: state.statusTemplates,
        spells: state.spells,
        logs: state.logs,
      }),
    }
  )
);

import { create } from 'zustand';
import {
  parseDiceExpression,
  validateExpression,
  getSelectedSum,
} from '../utils/originalDice.js';
import { useAppStore } from './useAppStore.js';

let savedRollId = 1;

export const useActiveRollStore = create((set, get) => ({
  activeRoll: null,
  diceHistory: [],
  savedRolls: [],

  setActiveRollFromParse: (parseResult) => {
    set({
      activeRoll: {
        expression: parseResult.expression,
        dice: parseResult.allDice,
        modifier: parseResult.modifier,
        mode: 'single',
        aoeTargets: [],
        animating: true,
      },
    });

    setTimeout(() => {
      set((state) => {
        if (!state.activeRoll) {
          return {};
        }

        return {
          activeRoll: {
            ...state.activeRoll,
            animating: false,
          },
        };
      });
    }, 600);
  },

  clearActiveRoll: () => {
    set({ activeRoll: null });
  },

  clearSelection: () => {
    set((state) => {
      if (!state.activeRoll) {
        return {};
      }

      return {
        activeRoll: {
          ...state.activeRoll,
          dice: state.activeRoll.dice.map((die) => ({
            ...die,
            selected: false,
          })),
        },
      };
    });
  },

  toggleDie: (dieId) => {
    set((state) => {
      if (!state.activeRoll || state.activeRoll.animating) {
        return {};
      }

      return {
        activeRoll: {
          ...state.activeRoll,
          dice: state.activeRoll.dice.map((die) => {
            if (die.id !== dieId || die.spent) {
              return die;
            }

            return {
              ...die,
              selected: !die.selected,
            };
          }),
        },
      };
    });
  },

  spendDie: (dieId) => {
    set((state) => {
      if (!state.activeRoll) {
        return {};
      }

      return {
        activeRoll: {
          ...state.activeRoll,
          dice: state.activeRoll.dice.map((die) => {
            if (die.id !== dieId) {
              return die;
            }

            return {
              ...die,
              spent: true,
              selected: false,
            };
          }),
        },
      };
    });
  },

  setRollMode: (mode) => {
    set((state) => {
      if (!state.activeRoll) {
        return {};
      }

      return {
        activeRoll: {
          ...state.activeRoll,
          mode,
          aoeTargets: [],
        },
      };
    });
  },

  toggleAoeTarget: (characterId) => {
    set((state) => {
      if (!state.activeRoll) {
        return {};
      }

      const already = state.activeRoll.aoeTargets.includes(characterId);

      return {
        activeRoll: {
          ...state.activeRoll,
          aoeTargets: already
            ? state.activeRoll.aoeTargets.filter((id) => id !== characterId)
            : [...state.activeRoll.aoeTargets, characterId],
        },
      };
    });
  },

  clearAoeTargets: () => {
    set((state) => {
      if (!state.activeRoll) {
        return {};
      }

      return {
        activeRoll: {
          ...state.activeRoll,
          aoeTargets: [],
        },
      };
    });
  },

  addHistory: (text) => {
    set((state) => ({
      diceHistory: [String(text), ...state.diceHistory].slice(0, 10),
    }));
  },

  rollParsed: (parseResult) => {
    get().addHistory(parseResult.total);
    get().setActiveRollFromParse(parseResult);

    const details = parseResult.allDice
      .map((die) => `d${die.sides}:${die.value}${die.sign === '-' ? '(-)' : ''}`)
      .join(' | ');

    useAppStore.getState().setDice({
      lastResult: {
        formula: parseResult.expression,
        total: parseResult.total,
        details: [details],
        error: null,
      },
    });
  },

  rollDice: (sides, modifierValue = 0) => {
    const mod = parseInt(modifierValue, 10) || 0;
    const expr = `1d${sides}${mod !== 0 ? (mod > 0 ? '+' + mod : mod) : ''}`;
    const result = parseDiceExpression(expr);
    get().rollParsed(result);
  },

  rollInput: (formula) => {
    const validation = validateExpression(formula);

    if (!validation.valid) {
      return validation;
    }

    const result = parseDiceExpression(formula);
    get().rollParsed(result);

    return { valid: true, error: null };
  },

  rollQuickFormula: (formula) => {
    const validation = validateExpression(formula);

    if (!validation.valid) {
      return validation;
    }

    const result = parseDiceExpression(formula);
    get().rollParsed(result);

    return { valid: true, error: null };
  },

  saveCurrentExpression: (formula) => {
    const validation = validateExpression(formula);

    if (!validation.valid) {
      return validation;
    }

    set((state) => ({
      savedRolls: [
        ...state.savedRolls,
        {
          id: savedRollId++,
          formula,
        },
      ],
    }));

    return { valid: true, error: null };
  },

  deleteSavedRoll: (id) => {
    set((state) => ({
      savedRolls: state.savedRolls.filter((roll) => roll.id !== id),
    }));
  },
}));

export const selectSelectedSum = (state) => getSelectedSum(state.activeRoll);

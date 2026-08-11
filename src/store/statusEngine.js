import { useAppStore } from './useAppStore.js';
import { rollExpression } from '../utils/dice.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const normalizeTrigger = (value) => {
  const text = String(value || '').toLowerCase();

  if (
    text.includes('start') ||
    text.includes('начал') ||
    text.includes('begin') ||
    text.includes('startturn')
  ) {
    return 'start';
  }

  if (
    text.includes('end') ||
    text.includes('кон') ||
    text.includes('заверш') ||
    text.includes('finish') ||
    text.includes('endturn')
  ) {
    return 'end';
  }

  return '';
};

const normalizeEffect = (value) => {
  const text = String(value || '').toLowerCase();

  if (text.includes('damage') || text.includes('урон')) {
    return 'damage';
  }

  if (text.includes('heal') || text.includes('леч')) {
    return 'healing';
  }

  if (
    text.includes('temp') ||
    text.includes('времен') ||
    text.includes('shield')
  ) {
    return 'temp';
  }

  return '';
};

const extractFormula = (value) => {
  const text = String(value || '').trim();

  if (!text) {
    return '';
  }

  const match = text.match(
    /[+-]?(?:\d*d\d+(?:kh\d+|kl\d+)?|\d+)(?:[+\-](?:\d*d\d+(?:kh\d+|kl\d+)?|\d+))*/i
  );

  return match ? match[0] : '';
};

const parseStatusNode = (node) => {
  if (!node) {
    return null;
  }

  if (node.trigger && node.effectType && node.formula) {
    const trigger = normalizeTrigger(node.trigger);
    const effectType = normalizeEffect(node.effectType);
    const formula = String(node.formula || '').trim();

    if (trigger && effectType && formula) {
      return {
        trigger,
        effectType,
        formula,
      };
    }
  }

  const raw = String(node.text || '').trim();

  if (!raw) {
    return null;
  }

  const parts = raw.split(':');

  if (parts.length >= 3) {
    const trigger = normalizeTrigger(parts[0]);
    const effectType = normalizeEffect(parts[1]);
    const formula = parts.slice(2).join(':').trim();

    if (trigger && effectType && formula) {
      return {
        trigger,
        effectType,
        formula,
      };
    }
  }

  const trigger = normalizeTrigger(raw);
  const effectType = normalizeEffect(raw);
  const formula = extractFormula(raw);

  if (trigger && effectType && formula) {
    return {
      trigger,
      effectType,
      formula,
    };
  }

  return null;
};

const applyEffectToCharacter = (character, effectType, amount) => {
  if (effectType === 'damage') {
    let remaining = amount;
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

  if (effectType === 'healing') {
    const hpMax = toNumber(character.hpMax);
    const hpCurrent = toNumber(character.hpCurrent);

    const nextHp =
      hpMax > 0
        ? Math.min(hpMax, hpCurrent + amount)
        : hpCurrent + amount;

    return {
      ...character,
      hpCurrent: nextHp,
    };
  }

  if (effectType === 'temp') {
    return {
      ...character,
      tempHp: toNumber(character.tempHp) + amount,
    };
  }

  return character;
};

const processCharacterStatuses = (characterId, phase) => {
  const state = useAppStore.getState();

  const allCharacters = [...state.players, ...state.npcs];
  const character = allCharacters.find((item) => item.id === characterId);

  if (!character) {
    return;
  }

  const statuses = character.statuses || [];

  statuses.forEach((status) => {
    const nodes = status.logic?.nodes || [];

    nodes.forEach((node) => {
      const parsed = parseStatusNode(node);

      if (!parsed) {
        return;
      }

      if (parsed.trigger !== phase) {
        return;
      }

      try {
        const result = rollExpression(parsed.formula);
        const amount = Math.max(0, toNumber(result.total));

        if (amount <= 0) {
          return;
        }

        useAppStore.setState((prev) => {
          const apply = (list) =>
            list.map((item) => {
              if (item.id !== characterId) {
                return item;
              }

              return applyEffectToCharacter(item, parsed.effectType, amount);
            });

          return {
            players: apply(prev.players),
            npcs: apply(prev.npcs),
          };
        });

        const effectText =
          parsed.effectType === 'damage'
            ? 'урон'
            : parsed.effectType === 'healing'
              ? 'лечение'
              : 'временные HP';

        const phaseText =
          phase === 'start' ? 'начало хода' : 'конец хода';

        useAppStore
          .getState()
          .addLog(
            `${character.name}: статус ${status.name} — ${effectText} ${amount} (${phaseText})`
          );
      } catch (error) {
        // Неверная формула в узле статуса пропускаем, чтобы не ломать бой.
      }
    });
  });
};

const applyStatusEngine = () => {
  if (useAppStore.getState().__statusEngineApplied) {
    return;
  }

  const originalNextTurn = useAppStore.getState().nextTurn;
  const originalStartCombat = useAppStore.getState().startCombat;
  const originalAddStatusToCharacter =
    useAppStore.getState().addStatusToCharacter;

  useAppStore.setState({
    __statusEngineApplied: true,

    startCombat: (...args) => {
      originalStartCombat(...args);

      const after = useAppStore.getState();
      const currentId = after.initiativeOrder[after.turnIndex ?? -1];

      if (currentId) {
        processCharacterStatuses(currentId, 'start');
      }
    },

    nextTurn: (...args) => {
      const before = useAppStore.getState();
      const currentId = before.initiativeOrder[before.turnIndex ?? -1];

      if (currentId) {
        processCharacterStatuses(currentId, 'end');
      }

      originalNextTurn(...args);

      const after = useAppStore.getState();
      const nextId = after.initiativeOrder[after.turnIndex ?? -1];

      if (nextId) {
        processCharacterStatuses(nextId, 'start');
      }
    },

    addStatusToCharacter: (characterId, status) => {
      const state = useAppStore.getState();

      const template = state.statusTemplates.find(
        (item) => item.name === status.name
      );

      const logic = status.logic ?? template?.logic;

      originalAddStatusToCharacter(characterId, {
        ...status,
        logic,
      });
    },
  });
};

applyStatusEngine();

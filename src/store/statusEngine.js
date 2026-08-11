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

const normalizeConditionType = (value) => {
  const text = String(value || '').toLowerCase();

  if (
    text.includes('hpbelow') ||
    text.includes('hp below') ||
    text.includes('ниже')
  ) {
    return 'hpBelow';
  }

  if (
    text.includes('hpabove') ||
    text.includes('hp above') ||
    text.includes('выше')
  ) {
    return 'hpAbove';
  }

  if (
    text.includes('hasstatus') ||
    text.includes('has status') ||
    text.includes('есть статус') ||
    text.includes('статус')
  ) {
    return 'hasStatus';
  }

  if (
    text.includes('random') ||
    text.includes('шанс') ||
    text.includes('случай')
  ) {
    return 'random';
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

const parseThreshold = (value) => {
  const text = String(value || '').trim().toLowerCase();
  const percent = text.includes('%');
  const numeric = toNumber(text.replace('%', ''), 0);

  return {
    percent,
    value: numeric,
  };
};

const parseConditionText = (text) => {
  const raw = String(text || '').trim().replace(/:/g, ' ');

  if (!raw) {
    return null;
  }

  const conditionType = normalizeConditionType(raw);

  if (!conditionType) {
    return null;
  }

  let value = raw;

  if (conditionType === 'hpBelow') {
    value = raw.replace(/^(hp\s*below|ниже)\s*/i, '').trim();
  }

  if (conditionType === 'hpAbove') {
    value = raw.replace(/^(hp\s*above|выше)\s*/i, '').trim();
  }

  if (conditionType === 'hasStatus') {
    value = raw
      .replace(/^(has\s*status|есть\s*статус|статус)\s*/i, '')
      .trim();
  }

  if (conditionType === 'random') {
    value = raw.replace(/^(random|шанс|случай)\s*/i, '').trim();
  }

  return {
    type: conditionType,
    value,
  };
};

const parseConditionFromNode = (node) => {
  if (!node) {
    return null;
  }

  if (node.conditionType) {
    return {
      type: normalizeConditionType(node.conditionType),
      value: node.conditionValue || '',
    };
  }

  return parseConditionText(node.text || '');
};

const parseStatusNode = (node) => {
  if (!node) {
    return null;
  }

  if (node.trigger && node.effectType && node.formula) {
    const trigger = normalizeTrigger(node.trigger);
    const effectType = normalizeEffect(node.effectType);
    const formula = String(node.formula || '').trim();

    const condition = node.conditionType
      ? {
          type: normalizeConditionType(node.conditionType),
          value: node.conditionValue || '',
        }
      : parseConditionText(node.text || '');

    if (trigger && effectType && formula) {
      return {
        trigger,
        effectType,
        formula,
        condition,
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

    const formulaRaw = parts.slice(2).join(':').trim();
    const conditionChunks = formulaRaw.split(/\s+(?:if|если)\s+/i);

    const formula = conditionChunks[0].trim();
    const conditionText = conditionChunks.slice(1).join(' ').trim();

    const condition = conditionText
      ? parseConditionText(conditionText)
      : parseConditionFromNode(node);

    if (trigger && effectType && formula) {
      return {
        trigger,
        effectType,
        formula,
        condition,
      };
    }
  }

  const conditionChunks = raw.split(/\s+(?:if|если)\s+/i);
  const baseText = conditionChunks[0].trim();
  const conditionText = conditionChunks.slice(1).join(' ').trim();

  const trigger = normalizeTrigger(baseText);
  const effectType = normalizeEffect(baseText);
  const formula = extractFormula(baseText);

  const condition = conditionText
    ? parseConditionText(conditionText)
    : parseConditionFromNode(node);

  if (trigger && effectType && formula) {
    return {
      trigger,
      effectType,
      formula,
      condition,
    };
  }

  return null;
};

const evaluateCondition = (character, condition) => {
  if (!condition || !condition.type) {
    return true;
  }

  const value = String(condition.value ?? '').trim();

  if (condition.type === 'hpBelow') {
    const threshold = parseThreshold(value);
    const hpCurrent = toNumber(character.hpCurrent);
    const hpMax = toNumber(character.hpMax);

    const limit =
      threshold.percent && hpMax > 0
        ? (hpMax * threshold.value) / 100
        : threshold.value;

    return hpCurrent <= limit;
  }

  if (condition.type === 'hpAbove') {
    const threshold = parseThreshold(value);
    const hpCurrent = toNumber(character.hpCurrent);
    const hpMax = toNumber(character.hpMax);

    const limit =
      threshold.percent && hpMax > 0
        ? (hpMax * threshold.value) / 100
        : threshold.value;

    return hpCurrent >= limit;
  }

  if (condition.type === 'hasStatus') {
    const needle = value.toLowerCase();

    if (!needle) {
      return false;
    }

    return (character.statuses || []).some((status) =>
      String(status.name || '').toLowerCase().includes(needle)
    );
  }

  if (condition.type === 'random') {
    const chance = toNumber(value, 0);
    return Math.random() * 100 < chance;
  }

  return true;
};

const evaluateNodeGate = (node, nodesById, character, phase, visited = new Set()) => {
  if (!node) {
    return true;
  }

  if (visited.has(node.id)) {
    return false;
  }

  visited.add(node.id);

  if (node.type === 'trigger') {
    const trigger = normalizeTrigger(node.trigger || node.text || '');

    if (trigger && trigger !== phase) {
      return false;
    }
  }

  const condition = parseConditionFromNode(node);

  if (condition && !evaluateCondition(character, condition)) {
    return false;
  }

  if (node.parentId && nodesById[node.parentId]) {
    return evaluateNodeGate(
      nodesById[node.parentId],
      nodesById,
      character,
      phase,
      visited
    );
  }

  return true;
};

const getCharacterById = (characterId) => {
  const state = useAppStore.getState();
  const allCharacters = [...state.players, ...state.npcs];

  return allCharacters.find((character) => character.id === characterId);
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
  const rootCharacter = getCharacterById(characterId);

  if (!rootCharacter) {
    return;
  }

  const statuses = rootCharacter.statuses || [];

  statuses.forEach((status) => {
    const nodes = status.logic?.nodes || [];

    const nodesById = nodes.reduce((acc, node) => {
      if (node.id) {
        acc[node.id] = node;
      }

      return acc;
    }, {});

    nodes.forEach((node) => {
      if (node.type === 'condition') {
        return;
      }

      const parsed = parseStatusNode(node);

      if (!parsed) {
        return;
      }

      if (parsed.trigger !== phase) {
        return;
      }

      const character = getCharacterById(characterId) || rootCharacter;

      if (parsed.condition && !evaluateCondition(character, parsed.condition)) {
        return;
      }

      if (
        node.parentId &&
        nodesById[node.parentId] &&
        !evaluateNodeGate(nodesById[node.parentId], nodesById, character, phase)
      ) {
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
  if (useAppStore.getState().__statusEngineV2Applied) {
    return;
  }

  const originalNextTurn = useAppStore.getState().nextTurn;
  const originalStartCombat = useAppStore.getState().startCombat;
  const originalAddStatusToCharacter =
    useAppStore.getState().addStatusToCharacter;

  useAppStore.setState({
    __statusEngineV2Applied: true,

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

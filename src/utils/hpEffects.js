import { useAppStore } from '../store/useAppStore.js';
import { useFloatingTextStore } from '../store/floatingTextStore.js';

const updateCharacterById = (characterId, patch) => {
  useAppStore.setState((prev) => {
    const updateList = (list) =>
      list.map((item) => {
        if (item.id !== characterId) {
          return item;
        }

        return {
          ...item,
          ...patch,
        };
      });

    return {
      players: updateList(prev.players),
      npcs: updateList(prev.npcs),
    };
  });
};

const findCharacterById = (characterId) => {
  const state = useAppStore.getState();
  return [...state.players, ...state.npcs].find(
    (character) => character.id === characterId
  );
};

export const showFloatingTextForCharacter = (characterId, text, color) => {
  const el = document.querySelector(`[data-char-card="${characterId}"]`);

  if (!el) {
    return;
  }

  const rect = el.getBoundingClientRect();

  useFloatingTextStore.getState().addFloatingText({
    text,
    color,
    x: rect.left + rect.width / 2,
    y: rect.top + 20,
  });
};

export const applyOriginalDamage = (characterId, amount) => {
  amount = Math.max(0, Number(amount) || 0);

  if (amount <= 0) {
    return;
  }

  const character = findCharacterById(characterId);

  if (!character) {
    return;
  }

  let remaining = amount;
  let absorbed = 0;
  let tempHp = Number(character.tempHp || 0);

  if (tempHp > 0) {
    absorbed = Math.min(tempHp, remaining);
    tempHp -= absorbed;
    remaining -= absorbed;
  }

  const hpCurrent = Math.max(0, Number(character.hpCurrent || 0) - remaining);

  updateCharacterById(characterId, {
    tempHp,
    hpCurrent,
  });

  let text = `-${amount}`;

  if (absorbed > 0) {
    text += ` (🛡️${absorbed})`;
  }

  showFloatingTextForCharacter(characterId, text, '#e94560');

  useAppStore
    .getState()
    .addLog(
      `${character.name}: урон ${amount}${absorbed > 0 ? ` (щит ${absorbed})` : ''}`
    );
};

export const applyOriginalHeal = (characterId, amount) => {
  amount = Math.max(0, Number(amount) || 0);

  if (amount <= 0) {
    return;
  }

  const character = findCharacterById(characterId);

  if (!character) {
    return;
  }

  const before = Number(character.hpCurrent || 0);
  const hpMax = Number(character.hpMax || 0);

  const hpCurrent =
    hpMax > 0 ? Math.min(hpMax, before + amount) : before + amount;

  const actual = hpCurrent - before;

  updateCharacterById(characterId, {
    hpCurrent,
  });

  if (actual > 0) {
    showFloatingTextForCharacter(characterId, `+${actual}`, '#4ecca3');
  }

  useAppStore.getState().addLog(`${character.name}: лечение ${actual}`);
};

export const applyOriginalTempHp = (characterId, amount) => {
  amount = Math.max(0, Number(amount) || 0);

  if (amount <= 0) {
    return;
  }

  const character = findCharacterById(characterId);

  if (!character) {
    return;
  }

  const tempHp = Number(character.tempHp || 0) + amount;

  updateCharacterById(characterId, {
    tempHp,
  });

  showFloatingTextForCharacter(characterId, `🛡️+${amount}`, '#48dbfb');

  useAppStore
    .getState()
    .addLog(`${character.name}: временные HP +${amount}`);
};

export const setHpDirect = (characterId, value) => {
  const character = findCharacterById(characterId);

  if (!character) {
    return;
  }

  const oldHp = Number(character.hpCurrent || 0);
  const hpMax = Number(character.hpMax || 0);

  const hpCurrent =
    hpMax > 0
      ? Math.max(0, Math.min(hpMax, Number(value) || 0))
      : Math.max(0, Number(value) || 0);

  updateCharacterById(characterId, {
    hpCurrent,
  });

  const diff = hpCurrent - oldHp;

  if (diff !== 0) {
    showFloatingTextForCharacter(
      characterId,
      `${diff > 0 ? '+' : ''}${diff}`,
      diff > 0 ? '#4ecca3' : '#e94560'
    );
  }

  useAppStore.getState().addLog(`${character.name}: HP установлено в ${hpCurrent}`);
};

export const applyHpInputString = (characterId, rawValue) => {
  const value = String(rawValue || '').trim().toLowerCase();

  if (!value) {
    return;
  }

  if (/^t\d+$/.test(value)) {
    applyOriginalTempHp(characterId, parseInt(value.slice(1), 10));
    return;
  }

  if (/^\+\d+$/.test(value)) {
    applyOriginalHeal(characterId, parseInt(value.slice(1), 10));
    return;
  }

  if (/^-\d+$/.test(value)) {
    applyOriginalDamage(characterId, parseInt(value.slice(1), 10));
    return;
  }

  if (/^\d+$/.test(value)) {
    setHpDirect(characterId, parseInt(value, 10));
    return;
  }

  useAppStore
    .getState()
    .addLog('Неверный формат HP. Используй: +5, -3, t10 или 25');
};

export const applyOriginalHpEffect = (characterId, type, amount) => {
  if (type === 'damage') {
    applyOriginalDamage(characterId, amount);
    return;
  }

  if (type === 'heal' || type === 'healing') {
    applyOriginalHeal(characterId, amount);
    return;
  }

  if (type === 'temp') {
    applyOriginalTempHp(characterId, amount);
  }
};

import { useAppStore } from './useAppStore.js';
import { uid } from '../utils/id.js';
import {
  defaultAbilities,
  ensureCharacterExtras,
  toNumber,
} from '../utils/character.js';

const normalizeRichCharacter = (side, data) => {
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
    tempHp: toNumber(data.tempHp),
    ac: toNumber(data.ac),
    initiative: toNumber(data.initiative),
    color: data.color || (side === 'player' ? '#22c55e' : '#ef4444'),
    description: String(data.description || '').trim(),
    abilities: {
      ...defaultAbilities,
      ...(data.abilities || {}),
    },
    quickRolls: Array.isArray(data.quickRolls) ? data.quickRolls : [],
    statuses: [],
  };
};

const syncCharacterToInitiative = (characterId) => {
  const state = useAppStore.getState();

  if (!state.combatStarted) {
    return;
  }

  const allCharacters = [...state.players, ...state.npcs];
  const allIds = new Set(allCharacters.map((character) => character.id));

  const validOrder = state.initiativeOrder.filter((id) => allIds.has(id));

  if (validOrder.includes(characterId)) {
    return;
  }

  const currentId = validOrder[state.turnIndex ?? -1];
  const initiativeOrder = [...validOrder, characterId];

  let turnIndex = state.turnIndex;

  if (turnIndex === null) {
    turnIndex = 0;
  } else if (currentId && initiativeOrder.includes(currentId)) {
    turnIndex = initiativeOrder.indexOf(currentId);
  }

  useAppStore.setState({
    initiativeOrder,
    turnIndex,
  });
};

const applyCharacterExtensions = () => {
  if (useAppStore.getState().__characterExtensionsApplied) {
    return;
  }

  const migrateCharacters = () => {
    useAppStore.setState((state) => ({
      players: state.players.map(ensureCharacterExtras),
      npcs: state.npcs.map(ensureCharacterExtras),
    }));
  };

  migrateCharacters();

  if (useAppStore.persist?.onFinishHydration) {
    useAppStore.persist.onFinishHydration(migrateCharacters);
  }

  useAppStore.setState({
    __characterExtensionsApplied: true,

    addCharacter: (side, data) => {
      const character = normalizeRichCharacter(side, data);

      useAppStore.setState((state) => {
        if (side === 'npc') {
          return {
            npcs: [...state.npcs, character],
          };
        }

        return {
          players: [...state.players, character],
        };
      });

      useAppStore.getState().addLog(`Добавлен персонаж: ${character.name}`);
      syncCharacterToInitiative(character.id);
    },
  });
};

applyCharacterExtensions();

import { useAppStore } from './useAppStore.js';

const sortByInitiative = (a, b) => {
  return Number(b.initiative || 0) - Number(a.initiative || 0);
};

const applyExtensions = () => {
  if (useAppStore.getState().__extensionsApplied) {
    return;
  }

  const originalAddCharacter = useAppStore.getState().addCharacter;

  useAppStore.setState({
    __extensionsApplied: true,

    addCharacter: (side, data) => {
      originalAddCharacter(side, data);

      const state = useAppStore.getState();

      if (!state.combatStarted) {
        return;
      }

      const allCharacters = [...state.players, ...state.npcs];
      const allIds = new Set(allCharacters.map((character) => character.id));

      const currentId = state.initiativeOrder[state.turnIndex ?? -1];

      const validOrder = state.initiativeOrder.filter((id) => allIds.has(id));
      const existingIds = new Set(validOrder);

      const missingCharacters = allCharacters
        .filter((character) => !existingIds.has(character.id))
        .sort(sortByInitiative);

      const missingIds = missingCharacters.map((character) => character.id);

      if (
        missingIds.length === 0 &&
        validOrder.length === state.initiativeOrder.length
      ) {
        return;
      }

      const initiativeOrder = [...validOrder, ...missingIds];

      let turnIndex;

      if (currentId && initiativeOrder.includes(currentId)) {
        turnIndex = initiativeOrder.indexOf(currentId);
      } else if (initiativeOrder.length > 0) {
        turnIndex = Math.min(
          Math.max(0, state.turnIndex ?? 0),
          initiativeOrder.length - 1
        );
      } else {
        turnIndex = null;
      }

      const selectedCharacterId =
        state.selectedCharacterId &&
        initiativeOrder.includes(state.selectedCharacterId)
          ? state.selectedCharacterId
          : initiativeOrder[turnIndex] ?? null;

      useAppStore.setState({
        initiativeOrder,
        turnIndex,
        selectedCharacterId,
      });
    },

    refreshInitiative: () => {
      const state = useAppStore.getState();

      const allCharacters = [...state.players, ...state.npcs];
      const sortedIds = [...allCharacters]
        .sort(sortByInitiative)
        .map((character) => character.id);

      if (!state.combatStarted) {
        useAppStore.setState({
          initiativeOrder: sortedIds,
          turnIndex: null,
        });

        return;
      }

      const currentId =
        state.initiativeOrder[state.turnIndex ?? -1] ??
        state.selectedCharacterId;

      let turnIndex = currentId ? sortedIds.indexOf(currentId) : 0;

      if (turnIndex < 0) {
        turnIndex = sortedIds.length > 0 ? 0 : null;
      }

      const selectedCharacterId =
        turnIndex !== null ? sortedIds[turnIndex] : null;

      useAppStore.setState({
        initiativeOrder: sortedIds,
        turnIndex,
        selectedCharacterId,
        combatStarted: sortedIds.length > 0,
      });
    },

    updateCharacter: (characterId, patch) => {
      useAppStore.setState((state) => {
        const updateList = (list) =>
          list.map((character) => {
            if (character.id !== characterId) {
              return character;
            }

            return {
              ...character,
              ...patch,
            };
          });

        return {
          players: updateList(state.players),
          npcs: updateList(state.npcs),
        };
      });
    },
  });
};

applyExtensions();

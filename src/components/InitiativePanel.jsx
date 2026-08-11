import { useAppStore } from '../store/useAppStore.js';

export default function InitiativePanel() {
  const round = useAppStore((state) => state.round);
  const turnIndex = useAppStore((state) => state.turnIndex);
  const initiativeOrder = useAppStore((state) => state.initiativeOrder);
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const startCombat = useAppStore((state) => state.startCombat);
  const nextTurn = useAppStore((state) => state.nextTurn);
  const resetCombat = useAppStore((state) => state.resetCombat);
  const refreshInitiative = useAppStore((state) => state.refreshInitiative);

  const allCharacters = [...players, ...npcs];
  const byId = new Map(allCharacters.map((character) => [character.id, character]));

  const currentId = initiativeOrder[turnIndex ?? -1];
  const currentCharacter = allCharacters.find((character) => character.id === currentId);

  const activeOrder = initiativeOrder.filter((id) => byId.has(id));

  const previewOrder = [...allCharacters]
    .sort((a, b) => Number(b.initiative || 0) - Number(a.initiative || 0))
    .map((character) => character.id);

  const visibleOrder = activeOrder.length
    ? [
        ...activeOrder,
        ...allCharacters
          .filter((character) => !activeOrder.includes(character.id))
          .map((character) => character.id),
      ]
    : previewOrder;

  return (
    <section className="card space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Инициатива</h2>

          <p className="mt-1 text-sm text-slate-300">
            Ход: {currentCharacter ? currentCharacter.name : '—'} • Раунд {round}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="btn btn-primary" onClick={startCombat}>
            ⚔️ Начать бой
          </button>

          <button className="btn" onClick={nextTurn}>
            ▶ Следующий ход
          </button>

          <button className="btn" onClick={resetCombat}>
            🔄 Сброс
          </button>

          <button
            className="btn"
            title="Пересчитать порядок инициативы"
            onClick={() => refreshInitiative?.()}
          >
            🔁 Пересчитать
          </button>
        </div>
      </div>

      {visibleOrder.length === 0 ? (
        <p className="text-sm text-slate-400">
          Добавьте игроков или NPC, чтобы увидеть инициативу.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {visibleOrder.map((id, index) => {
            const character = byId.get(id);

            if (!character) {
              return null;
            }

            const isCurrent =
              activeOrder.length > 0 &&
              index < activeOrder.length &&
              turnIndex === index;

            const isSelected = selectedCharacterId === id;

            return (
              <button
                key={id}
                type="button"
                onClick={() => selectCharacter(id)}
                className={`btn flex min-w-[9rem] flex-col items-start gap-0 px-3 py-2 text-left ${
                  isCurrent ? 'btn-primary' : ''
                } ${isSelected && !isCurrent ? 'border-indigo-400' : ''}`}
              >
                <span className="text-xs text-slate-400">
                  {index + 1}. Инициатива: {character.initiative || 0}
                </span>

                <span className="font-medium" style={{ color: character.color }}>
                  {character.name}
                </span>

                <span className="text-xs text-slate-400">
                  HP {character.hpCurrent}/{character.hpMax}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}

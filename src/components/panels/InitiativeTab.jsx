import { useAppStore } from '../../store/useAppStore.js';

export default function InitiativeTab() {
  const state = useAppStore();

  const allCharacters = [...state.players, ...state.npcs];
  const byId = new Map(allCharacters.map((character) => [character.id, character]));

  const activeOrder = state.initiativeOrder.filter((id) => byId.has(id));

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
    <div className="card flex h-full flex-col gap-2 overflow-hidden">
      <div className="flex flex-wrap gap-1">
        <button
          className="btn btn-primary px-2 py-1 text-xs"
          onClick={state.startCombat}
        >
          ⚔️ Начать
        </button>

        <button className="btn px-2 py-1 text-xs" onClick={state.nextTurn}>
          ▶ Ход
        </button>

        <button className="btn px-2 py-1 text-xs" onClick={state.resetCombat}>
          🔄 Сброс
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Пересчитать инициативу"
          onClick={() => state.refreshInitiative?.()}
        >
          🔁
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {visibleOrder.map((id, index) => {
          const character = byId.get(id);

          if (!character) {
            return null;
          }

          const isCurrent =
            activeOrder.length > 0 &&
            index < activeOrder.length &&
            state.turnIndex === index;

          return (
            <button
              key={id}
              onClick={() => state.selectCharacter(id)}
              className={`w-full rounded-lg border px-2 py-1 text-left text-xs ${
                isCurrent
                  ? 'border-amber-400 bg-amber-950/20'
                  : state.selectedCharacterId === id
                    ? 'border-indigo-400 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-900'
              }`}
            >
              <span className="text-slate-500">{index + 1}.</span> {character.name}{' '}
              <span className="text-slate-500">
                • {character.initiative || 0} • HP {character.hpCurrent}/
                {character.hpMax}
              </span>
            </button>
          );
        })}

        {visibleOrder.length === 0 && (
          <p className="text-xs text-slate-500">Добавьте персонажей.</p>
        )}
      </div>
    </div>
  );
}

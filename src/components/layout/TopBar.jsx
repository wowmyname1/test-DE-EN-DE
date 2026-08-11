import { useAppStore } from '../../store/useAppStore.js';

export default function TopBar() {
  const state = useAppStore();

  const allCharacters = [...state.players, ...state.npcs];
  const byId = new Map(allCharacters.map((character) => [character.id, character]));

  const currentId = state.initiativeOrder[state.turnIndex ?? -1];
  const currentCharacter = allCharacters.find((character) => character.id === currentId);

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
    <header className="space-y-1 border-b border-slate-800 bg-slate-950 px-2 pt-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="hidden text-[10px] uppercase tracking-wide text-slate-500 xl:inline">
            D&D Encounter Builder
          </span>

          <span className="text-sm font-bold">⚔️ D&D Encounter</span>

          <span className="truncate text-xs text-slate-400">
            Ход: {currentCharacter ? currentCharacter.name : '—'} • Раунд {state.round}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            className="btn px-2 py-1 text-xs"
            title="Каталог статусов"
            onClick={() => state.openModal('statusCatalog')}
          >
            ✨
          </button>

          <button
            className="btn px-2 py-1 text-xs"
            title="Каталог заклинаний"
            onClick={() => state.openModal('spellCatalog')}
          >
            🔮
          </button>

          <button
            className="btn px-2 py-1 text-xs"
            title="Пресеты"
            onClick={() => state.openModal('presets')}
          >
            📦
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pb-2">
        <div className="flex items-center gap-1">
          <button
            className="btn btn-primary px-2 py-1 text-xs"
            title="Начать бой"
            onClick={state.startCombat}
          >
            ⚔️ Начать бой
          </button>

          <button
            className="btn px-2 py-1 text-xs"
            title="Следующий ход"
            onClick={state.nextTurn}
          >
            ▶ Следующий ход
          </button>

          <button
            className="btn px-2 py-1 text-xs"
            title="Сброс боя"
            onClick={state.resetCombat}
          >
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

        <span className="shrink-0 text-xs font-semibold text-slate-400">
          Инициатива
        </span>

        <div className="min-w-0 flex-1 overflow-x-auto">
          <div className="flex gap-1">
            {visibleOrder.map((id, index) => {
              const character = byId.get(id);

              if (!character) {
                return null;
              }

              const isCurrent =
                activeOrder.length > 0 &&
                index < activeOrder.length &&
                state.turnIndex === index;

              const isSelected = state.selectedCharacterId === id;

              return (
                <button
                  key={id}
                  onClick={() => state.selectCharacter(id)}
                  className={`shrink-0 rounded border px-2 py-0.5 text-[10px] ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-950/20'
                      : isSelected
                        ? 'border-indigo-400 bg-indigo-950/20'
                        : 'border-slate-700 bg-slate-900'
                  }`}
                >
                  {index + 1}. {character.name} • {character.initiative || 0} • HP{' '}
                  {character.hpCurrent}/{character.hpMax}
                </button>
              );
            })}

            {visibleOrder.length === 0 && (
              <span className="text-xs text-slate-500">Инициатива пуста</span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

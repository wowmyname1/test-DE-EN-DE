import { useAppStore } from '../../store/useAppStore.js';

export default function TopBar() {
  const state = useAppStore();

  const currentId = state.initiativeOrder[state.turnIndex ?? -1];
  const allCharacters = [...state.players, ...state.npcs];
  const currentCharacter = allCharacters.find((character) => character.id === currentId);

  return (
    <header className="flex h-12 items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-2">
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
          title="Начать бой"
          onClick={state.startCombat}
        >
          ⚔️
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Следующий ход"
          onClick={state.nextTurn}
        >
          ▶
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Сброс боя"
          onClick={state.resetCombat}
        >
          🔄
        </button>

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
    </header>
  );
}

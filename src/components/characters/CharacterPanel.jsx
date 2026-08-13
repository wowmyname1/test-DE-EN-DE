import { useAppStore } from '../../store/useAppStore.js';
import CharacterCardOriginal from './CharacterCardOriginal.jsx';

export default function CharacterPanel({ side }) {
  const characters = useAppStore((state) =>
    side === 'player' ? state.players : state.npcs
  );

  const openModal = useAppStore((state) => state.openModal);

  const title = side === 'player' ? '🛡️ Игроки' : '👹 NPC / Монстры';
  const addLabel = side === 'player' ? '+ Добавить игрока' : '+ Добавить NPC';

  return (
    <aside className="flex w-56 min-h-0 flex-col gap-2 md:w-72">
      <div className="flex items-center justify-between gap-1">
        <h2 className="text-sm font-semibold">
          {title} {characters.length}
        </h2>
      </div>

      <button
        className="btn btn-primary px-2 py-1 text-xs"
        onClick={() => openModal('addCharacter', { side })}
      >
        {addLabel}
      </button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {characters.map((character) => (
          <CharacterCardOriginal key={character.id} character={character} />
        ))}

        {characters.length === 0 && (
          <p className="text-xs text-slate-500">Пока пусто.</p>
        )}
      </div>
    </aside>
  );
}

import { useAppStore } from '../../store/useAppStore.js';

export default function CharacterCompact({ character }) {
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const removeCharacter = useAppStore((state) => state.removeCharacter);
  const openModal = useAppStore((state) => state.openModal);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );

  const isCurrent = currentId === character.id;
  const isSelected = selectedCharacterId === character.id;

  return (
    <article
      onClick={() => selectCharacter(character.id)}
      onDoubleClick={() => openModal('editCharacter', { characterId: character.id })}
      className={`card cursor-pointer border-2 p-2 ${
        isCurrent
          ? 'border-amber-400 bg-amber-950/20'
          : isSelected
            ? 'border-indigo-400 bg-indigo-950/20'
            : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="truncate text-sm font-medium" style={{ color: character.color }}>
          {character.name}
        </div>

        <div className="text-[10px] text-slate-500">
          Иниц. {character.initiative || 0}
        </div>
      </div>

      <div className="mt-1 text-xs text-slate-400">
        HP {character.hpCurrent}/{character.hpMax} • AC {character.ac}
        {(character.statuses || []).length > 0
          ? ` • ✨${character.statuses.length}`
          : ''}
      </div>

      <div className="mt-1 flex gap-1" onClick={(event) => event.stopPropagation()}>
        <button
          className="btn px-2 py-0.5 text-[10px]"
          title="Редактировать персонажа"
          onClick={() => openModal('editCharacter', { characterId: character.id })}
        >
          ✏️
        </button>

        <button
          className="btn px-2 py-0.5 text-[10px]"
          title="Добавить статус"
          onClick={() => openModal('addStatus', { targetId: character.id })}
        >
          ✨
        </button>

        <button
          className="btn btn-danger px-2 py-0.5 text-[10px]"
          title="Удалить персонажа"
          onClick={() => removeCharacter(character.side, character.id)}
        >
          ✕
        </button>
      </div>
    </article>
  );
}

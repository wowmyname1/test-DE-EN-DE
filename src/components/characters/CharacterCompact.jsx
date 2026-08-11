import { useAppStore } from '../../store/useAppStore.js';

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const hpBarColor = (percent) => {
  if (percent <= 0) {
    return 'bg-red-800';
  }

  if (percent < 25) {
    return 'bg-red-500';
  }

  if (percent < 60) {
    return 'bg-amber-500';
  }

  return 'bg-emerald-500';
};

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

  const hpMax = toNumber(character.hpMax);
  const hpCurrent = toNumber(character.hpCurrent);
  const tempHp = toNumber(character.tempHp);

  const hpPercent =
    hpMax > 0
      ? Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100))
      : hpCurrent > 0
        ? 100
        : 0;

  const tempPercent =
    hpMax > 0 && tempHp > 0
      ? Math.max(0, Math.min(100 - hpPercent, (tempHp / hpMax) * 100))
      : 0;

  const statusCount = (character.statuses || []).length;

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

        <div className="shrink-0 text-[10px] text-slate-500">
          Иниц. {character.initiative || 0}
        </div>
      </div>

      <div
        className="mt-1 h-2 w-full overflow-hidden rounded bg-slate-800"
        title={`HP ${hpCurrent}/${hpMax}${tempHp > 0 ? ` +${tempHp} временных HP` : ''}`}
      >
        <div className="flex h-full">
          <div
            className={`h-full ${hpBarColor(hpPercent)}`}
            style={{
              width: `${hpPercent}%`,
            }}
          />

          {tempHp > 0 && (
            <div
              className="h-full bg-sky-400/80"
              style={{
                width: `${tempPercent}%`,
              }}
            />
          )}
        </div>
      </div>

      <div className="mt-1 flex items-center justify-between gap-1 text-xs text-slate-400">
        <span className="flex min-w-0 items-center gap-1">
          <span className="truncate">
            HP {hpCurrent}/{hpMax}
          </span>

          {hpCurrent <= 0 && <span title="Без сознания">💀</span>}
        </span>

        <span className="flex shrink-0 items-center gap-1">
          {tempHp > 0 && (
            <span className="font-medium text-sky-300" title="Временные HP">
              🛡️ {tempHp}
            </span>
          )}

          <span>AC {character.ac}</span>

          {statusCount > 0 && <span title="Статусы">✨{statusCount}</span>}
        </span>
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

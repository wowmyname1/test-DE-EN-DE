import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { useMapStore } from '../store/mapStore.js';

const gridStyle = {
  backgroundImage:
    'linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)',
  backgroundSize: '32px 32px',
};

const hpPercent = (character) => {
  const max = Number(character.hpMax || 0);
  const current = Number(character.hpCurrent || 0);

  if (max <= 0) {
    return 0;
  }

  return Math.max(0, Math.min(100, (current / max) * 100));
};

export default function MapBoard() {
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );

  const tokens = useMapStore((state) => state.tokens);
  const showGrid = useMapStore((state) => state.showGrid);
  const syncCharacters = useMapStore((state) => state.syncCharacters);
  const moveToken = useMapStore((state) => state.moveToken);
  const addObject = useMapStore((state) => state.addObject);
  const removeObject = useMapStore((state) => state.removeObject);
  const toggleGrid = useMapStore((state) => state.toggleGrid);
  const resetPositions = useMapStore((state) => state.resetPositions);

  const boardRef = useRef(null);
  const offsetRef = useRef({});

  const [dragId, setDragId] = useState(null);
  const [objectModalOpen, setObjectModalOpen] = useState(false);
  const [objectName, setObjectName] = useState('');
  const [objectIcon, setObjectIcon] = useState('📦');

  useEffect(() => {
    syncCharacters(players, npcs);
  }, [players, npcs, syncCharacters]);

  useEffect(() => {
    if (!dragId) {
      return;
    }

    const handleMove = (event) => {
      const board = boardRef.current;

      if (!board) {
        return;
      }

      const rect = board.getBoundingClientRect();
      const offset = offsetRef.current[dragId] || { dx: 0, dy: 0 };

      const x = ((event.clientX - rect.left - offset.dx) / rect.width) * 100;
      const y = ((event.clientY - rect.top - offset.dy) / rect.height) * 100;

      moveToken(dragId, x, y);
    };

    const handleUp = () => {
      setDragId(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);

    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [dragId, moveToken]);

  const startDrag = (event, token) => {
    if (event.button !== 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();

    offsetRef.current[token.id] = {
      dx: event.clientX - rect.left,
      dy: event.clientY - rect.top,
    };

    setDragId(token.id);

    if (token.characterId) {
      selectCharacter(token.characterId);
    }
  };

  const submitObject = (event) => {
    event.preventDefault();

    addObject(objectName.trim() || 'Объект', objectIcon.trim() || '📦');

    setObjectName('');
    setObjectIcon('📦');
    setObjectModalOpen(false);
  };

  const allCharacters = [...players, ...npcs];
  const characterById = new Map(allCharacters.map((character) => [character.id, character]));

  return (
    <section className="relative min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
      <div className="absolute right-2 top-2 z-20 flex flex-wrap justify-end gap-1">
        <button
          className="btn px-2 py-1 text-xs"
          onClick={() => setObjectModalOpen(true)}
        >
          📦 Объект
        </button>

        <button className="btn px-2 py-1 text-xs" onClick={toggleGrid}>
          {showGrid ? '🧲 Сетка: вкл' : '⬜ Сетка: выкл'}
        </button>

        <button className="btn px-2 py-1 text-xs" onClick={resetPositions}>
          ♻️ Расстановка
        </button>
      </div>

      <div
        ref={boardRef}
        className="relative h-full w-full touch-none select-none overflow-hidden"
        style={showGrid ? gridStyle : undefined}
      >
        {tokens.map((token) => {
          const character = token.characterId
            ? characterById.get(token.characterId)
            : null;

          const isSelected = Boolean(character && selectedCharacterId === character.id);
          const isCurrent = Boolean(character && currentId === character.id);

          return (
            <div
              key={token.id}
              className="absolute z-10 -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing"
              style={{
                left: `${token.x}%`,
                top: `${token.y}%`,
              }}
              onPointerDown={(event) => startDrag(event, token)}
            >
              {character ? (
                <div className="flex flex-col items-center">
                  <div
                    className={`relative flex h-9 w-9 items-center justify-center rounded-full border-2 text-xs font-bold ${
                      isSelected ? 'ring-2 ring-indigo-300' : ''
                    }`}
                    style={{
                      borderColor: character.color,
                      backgroundColor: `${character.color}22`,
                    }}
                    title={character.name}
                  >
                    {character.name.charAt(0).toUpperCase()}

                    {isCurrent && (
                      <span className="absolute -right-2 -top-2 text-xs">⚔️</span>
                    )}
                  </div>

                  <div className="mt-0.5 max-w-[4rem] truncate text-center text-[9px] text-slate-300">
                    {character.name}
                  </div>

                  <div className="h-1 w-9 overflow-hidden rounded bg-slate-800">
                    <div
                      className="h-full bg-red-500"
                      style={{
                        width: `${hpPercent(character)}%`,
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="group relative flex flex-col items-center">
                  <div
                    className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-600 bg-slate-800 text-lg"
                    title={token.name}
                  >
                    {token.icon || '📦'}

                    <button
                      className="absolute -right-2 -top-2 hidden rounded bg-red-700 px-1 text-[9px] group-hover:block"
                      title="Удалить объект"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={() => removeObject(token.id)}
                    >
                      ✕
                    </button>
                  </div>

                  <div className="mt-0.5 max-w-[4rem] truncate text-center text-[9px] text-slate-400">
                    {token.name}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {objectModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setObjectModalOpen(false)}
        >
          <div
            className="card w-full max-w-sm space-y-3"
            onClick={(event) => event.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Добавить объект на карту</h3>

            <form onSubmit={submitObject} className="space-y-3">
              <label className="block text-sm">
                <span className="label">Название</span>
                <input
                  className="input"
                  value={objectName}
                  onChange={(event) => setObjectName(event.target.value)}
                  placeholder="Например: Сундук"
                />
              </label>

              <label className="block text-sm">
                <span className="label">Иконка</span>
                <input
                  className="input"
                  value={objectIcon}
                  onChange={(event) => setObjectIcon(event.target.value)}
                  placeholder="Например: 📦"
                />
              </label>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setObjectModalOpen(false)}
                >
                  Отмена
                </button>

                <button type="submit" className="btn btn-primary">
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}

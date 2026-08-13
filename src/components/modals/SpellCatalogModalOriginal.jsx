import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { useSpellCastStore } from '../../store/spellCastStore.js';
import { SPELL_CATALOG } from '../../data/spellCatalog.js';

const LEVEL_LABELS = {
  0: 'Заговор',
  1: 'Уровень 1',
  2: 'Уровень 2',
  3: 'Уровень 3',
  4: 'Уровень 4',
  5: 'Уровень 5',
};

function SpellCatalogModalOriginalInner() {
  const closeModal = useAppStore((state) => state.closeModal);
  const spells = useAppStore((state) => state.spells || []);
  const startSpellCast = useSpellCastStore((state) => state.startSpellCast);
  const addLog = useAppStore((state) => state.addLog);

  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState('');

  const allSpells = [...SPELL_CATALOG, ...spells];

  const filteredSpells = allSpells.filter((spell) => {
    const matchesSearch = !search || spell.name.toLowerCase().includes(search.toLowerCase());
    const matchesLevel = levelFilter === '' || spell.level === parseInt(levelFilter, 10);
    return matchesSearch && matchesLevel;
  });

  const handleCast = (spell) => {
    startSpellCast(spell);
    closeModal();
    addLog(`🔮 Творим: ${spell.name}. Выберите цель.`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeModal}
    >
      <div
        className="card w-full max-w-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">🔮 Каталог заклинаний</h3>
          <button className="btn px-2 py-1" onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-2">
          <input
            className="input flex-1"
            placeholder="Поиск заклинаний..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="input w-32"
            value={levelFilter}
            onChange={(event) => setLevelFilter(event.target.value)}
          >
            <option value="">Все уровни</option>
            <option value="0">Заговоры</option>
            <option value="1">Уровень 1</option>
            <option value="2">Уровень 2</option>
            <option value="3">Уровень 3</option>
            <option value="4">Уровень 4</option>
            <option value="5">Уровень 5</option>
          </select>
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {filteredSpells.length === 0 && (
            <p className="text-center text-xs text-slate-400">Заклинания не найдены</p>
          )}

          {filteredSpells.map((spell) => (
            <div
              key={spell.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 transition hover:border-amber-500"
            >
              <div className="mb-1 flex items-center justify-between">
                <span className="text-sm font-semibold">
                  {spell.icon} {spell.name}
                </span>
                <span className="rounded bg-amber-500 px-2 py-0.5 text-xs font-bold text-black">
                  {LEVEL_LABELS[spell.level] || `Ур. ${spell.level}`}
                </span>
              </div>

              <div className="mb-1 flex flex-wrap gap-2 text-xs text-slate-400">
                <span>📚 {spell.school}</span>
                <span>⏱️ {spell.castingTime}</span>
                <span>🎯 {spell.range}</span>
                <span>⏳ {spell.duration}</span>
              </div>

              {spell.description && (
                <p className="mb-1 text-xs text-slate-400">{spell.description}</p>
              )}

              {spell.classes && spell.classes.length > 0 && (
                <p className="text-xs text-slate-500">👥 {spell.classes.join(', ')}</p>
              )}

              <div className="mt-2 flex gap-2">
                <button className="btn flex-1 px-2 py-1 text-xs">✏️ Редакт.</button>
                <button
                  className="btn flex-1 px-2 py-1 text-xs hover:border-amber-500 hover:text-amber-400"
                  onClick={() => handleCast(spell)}
                >
                  🎯 Сотворить
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-3 flex justify-end">
          <button className="btn" onClick={closeModal}>
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SpellCatalogModalOriginal() {
  const activeModal = useAppStore((state) => state.activeModal);
  if (activeModal !== 'spellCatalog') return null;
  return <SpellCatalogModalOriginalInner />;
}

import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { STATUS_CATALOG } from '../../data/statusCatalog.js';

function StatusCatalogModalOriginalInner() {
  const closeModal = useAppStore((state) => state.closeModal);
  const statusTemplates = useAppStore((state) => state.statusTemplates || []);

  const [search, setSearch] = useState('');

  const allStatuses = [...STATUS_CATALOG, ...statusTemplates];

  const filteredStatuses = allStatuses.filter((status) => {
    return !search || status.name.toLowerCase().includes(search.toLowerCase());
  });

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
          <h3 className="text-lg font-semibold">✨ Каталог статусов</h3>
          <button className="btn px-2 py-1" onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className="mb-3">
          <input
            className="input"
            placeholder="Поиск статусов..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>

        <div className="max-h-96 space-y-2 overflow-y-auto pr-1">
          {filteredStatuses.length === 0 && (
            <p className="text-center text-xs text-slate-400">Нет статусов в каталоге</p>
          )}

          {filteredStatuses.map((status) => (
            <div
              key={status.id}
              className="rounded-lg border border-slate-700 bg-slate-800 p-3 transition hover:border-amber-500"
            >
              <div className="mb-1 text-sm font-semibold">
                {status.icon} {status.name}
              </div>

              {status.description && (
                <p className="mb-2 text-xs text-slate-400">{status.description}</p>
              )}

              <div className="flex gap-2">
                <button className="btn flex-1 px-2 py-1 text-xs">✏️ Редакт.</button>
                <button className="btn flex-1 px-2 py-1 text-xs">➕ Применить</button>
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

export default function StatusCatalogModalOriginal() {
  const activeModal = useAppStore((state) => state.activeModal);
  if (activeModal !== 'statusCatalog') return null;
  return <StatusCatalogModalOriginalInner />;
}

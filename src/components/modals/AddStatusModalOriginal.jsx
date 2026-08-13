import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { STATUS_DEFS } from '../../data/statusDefs.js';

function AddStatusModalOriginalInner() {
  const characterId = useAppStore((state) => state.modalPayload.targetId);
  const closeModal = useAppStore((state) => state.closeModal);
  const addStatusToCharacter = useAppStore((state) => state.addStatusToCharacter);

  const [tab, setTab] = useState('permanent');
  const [selectedDef, setSelectedDef] = useState(null);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('');
  const [duration, setDuration] = useState(3);

  const defs = STATUS_DEFS[tab] || [];

  const handleSelectDef = (def) => {
    setSelectedDef(def);
    setCustomName('');
    setCustomIcon('');
  };

  const handleCustomNameChange = (value) => {
    setCustomName(value);
    if (value.trim()) {
      setSelectedDef(null);
    }
  };

  const handleSave = () => {
    if (!characterId) return;

    let status;

    if (selectedDef) {
      status = {
        name: selectedDef.name,
        icon: selectedDef.icon,
        color: selectedDef.color,
        description: '',
        duration: tab === 'timed' ? duration : null,
      };
    } else if (customName.trim()) {
      status = {
        name: customName.trim(),
        icon: customIcon.trim() || '✨',
        color: '#a855f7',
        description: '',
        duration: tab === 'timed' ? duration : null,
      };
    } else {
      return;
    }

    addStatusToCharacter(characterId, status);
    closeModal();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={closeModal}
    >
      <div
        className="card w-full max-w-md"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">Добавить статус</h3>
          <button className="btn px-2 py-1" onClick={closeModal}>
            ✕
          </button>
        </div>

        <div className="mb-3 flex gap-1 rounded-lg bg-slate-900 p-1">
          <button
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === 'permanent'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => {
              setTab('permanent');
              setSelectedDef(null);
            }}
          >
            ⏳ Бессрочные
          </button>

          <button
            className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
              tab === 'timed'
                ? 'bg-slate-700 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
            onClick={() => {
              setTab('timed');
              setSelectedDef(null);
            }}
          >
            🔢 Временные
          </button>
        </div>

        <div className="mb-3">
          <div className="mb-2 text-xs text-slate-400">Выберите статус</div>

          <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1">
            {defs.map((def) => {
              const isSelected = selectedDef && selectedDef.id === def.id;
              return (
                <button
                  key={def.id}
                  className={`flex items-center gap-2 rounded-md border px-2 py-1.5 text-left text-xs transition ${
                    isSelected
                      ? 'border-amber-500 bg-amber-500/10 text-amber-300'
                      : 'border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-500'
                  }`}
                  onClick={() => handleSelectDef(def)}
                >
                  <span className="text-sm">{def.icon}</span>
                  <span className="flex-1 truncate">{def.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3 border-t border-slate-700 pt-3">
          <div className="mb-2 text-xs text-slate-400">Или свой статус</div>

          <div className="mb-2">
            <input
              className="input"
              placeholder="Название..."
              value={customName}
              onChange={(event) => handleCustomNameChange(event.target.value)}
            />
          </div>

          <div className="flex gap-2">
            <input
              className="input w-20"
              placeholder="✨"
              maxLength={2}
              value={customIcon}
              onChange={(event) => {
                setCustomIcon(event.target.value);
                if (event.target.value.trim()) {
                  setSelectedDef(null);
                }
              }}
            />

            {tab === 'timed' && (
              <div className="flex flex-1 items-center gap-2">
                <span className="text-xs text-slate-400">Длительность</span>
                <input
                  className="input w-20"
                  type="number"
                  min={1}
                  value={duration}
                  onChange={(event) => setDuration(parseInt(event.target.value, 10) || 1)}
                />
                <span className="text-xs text-slate-400">раундов</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button className="btn" onClick={closeModal}>
            Отмена
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!selectedDef && !customName.trim()}
          >
            Добавить
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AddStatusModalOriginal() {
  const activeModal = useAppStore((state) => state.activeModal);
  if (activeModal !== 'addStatus') return null;
  return <AddStatusModalOriginalInner />;
}

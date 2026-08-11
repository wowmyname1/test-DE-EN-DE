import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`card max-h-[90vh] w-full overflow-auto ${
          wide ? 'max-w-3xl' : 'max-w-xl'
        }`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-lg font-semibold">{title}</h3>

          <button className="btn px-2 py-1" onClick={onClose}>
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export default function EditCharacterModal() {
  const activeModal = useAppStore((state) => state.activeModal);
  const characterId = useAppStore((state) => state.modalPayload.characterId || null);
  const closeModal = useAppStore((state) => state.closeModal);
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);

  const character = [...players, ...npcs].find((item) => item.id === characterId);

  const [form, setForm] = useState(null);

  useEffect(() => {
    if (activeModal === 'editCharacter' && character) {
      setForm({
        name: character.name || '',
        type: character.type || '',
        level: character.level || '',
        hpMax: String(character.hpMax ?? ''),
        hpCurrent: String(character.hpCurrent ?? ''),
        ac: String(character.ac ?? ''),
        initiative: String(character.initiative ?? ''),
        color: character.color || '#22c55e',
      });
    }
  }, [activeModal, characterId]);

  if (activeModal !== 'editCharacter' || !character || !form) {
    return null;
  }

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    const hpMax = toNumber(form.hpMax);
    const rawHpCurrent = toNumber(form.hpCurrent);
    const hpCurrent =
      hpMax > 0 ? Math.max(0, Math.min(rawHpCurrent, hpMax)) : Math.max(0, rawHpCurrent);

    const patch = {
      name: form.name.trim() || character.name,
      type: form.type.trim(),
      level: form.level.trim(),
      hpMax,
      hpCurrent,
      ac: toNumber(form.ac),
      initiative: toNumber(form.initiative),
      color: form.color,
    };

    useAppStore.setState((state) => {
      const updateList = (list) =>
        list.map((item) => {
          if (item.id !== characterId) {
            return item;
          }

          return {
            ...item,
            ...patch,
          };
        });

      return {
        players: updateList(state.players),
        npcs: updateList(state.npcs),
      };
    });

    useAppStore.getState().addLog(`Изменён персонаж: ${patch.name}`);
    closeModal();
  };

  return (
    <Modal title="Редактировать персонажа" onClose={closeModal} wide>
      <form onSubmit={submit} className="space-y-3">
        <div className="grid gap-2 md:grid-cols-4">
          <label className="text-sm">
            <span className="label">Имя</span>
            <input className="input" value={form.name} onChange={setField('name')} required />
          </label>

          <label className="text-sm">
            <span className="label">Класс / Тип</span>
            <input className="input" value={form.type} onChange={setField('type')} />
          </label>

          <label className="text-sm">
            <span className="label">Уровень / CR</span>
            <input className="input" value={form.level} onChange={setField('level')} />
          </label>

          <label className="text-sm">
            <span className="label">HP Макс</span>
            <input className="input" type="number" value={form.hpMax} onChange={setField('hpMax')} />
          </label>

          <label className="text-sm">
            <span className="label">HP Текущие</span>
            <input
              className="input"
              type="number"
              value={form.hpCurrent}
              onChange={setField('hpCurrent')}
            />
          </label>

          <label className="text-sm">
            <span className="label">AC</span>
            <input className="input" type="number" value={form.ac} onChange={setField('ac')} />
          </label>

          <label className="text-sm">
            <span className="label">Инициатива</span>
            <input
              className="input"
              type="number"
              value={form.initiative}
              onChange={setField('initiative')}
            />
          </label>

          <label className="text-sm">
            <span className="label">Цвет</span>
            <input
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 p-1"
              type="color"
              value={form.color}
              onChange={setField('color')}
            />
          </label>
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={closeModal}>
            Отмена
          </button>

          <button type="submit" className="btn btn-primary">
            Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
}

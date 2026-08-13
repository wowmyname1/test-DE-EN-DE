import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import {
  addQuickRollToCharacter,
  deleteQuickRollFromCharacter,
} from '../../utils/characterQuickRolls.js';

function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-md"
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

function CharacterQuickRollModalInner() {
  const characterId = useAppStore((state) => state.modalPayload.characterId);
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const closeModal = useAppStore((state) => state.closeModal);

  const character = [...players, ...npcs].find((item) => item.id === characterId);

  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');

  if (!character) {
    return null;
  }

  const quickRolls = character.quickRolls || [];

  const submit = (event) => {
    event.preventDefault();

    const success = addQuickRollToCharacter(character.id, name, formula);

    if (success) {
      setName('');
      setFormula('');
      closeModal();
    }
  };

  return (
    <Modal title={`Быстрый бросок: ${character.name}`} onClose={closeModal}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="label">Название</span>

          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Атака, Урон, Проверка..."
            autoFocus
          />
        </label>

        <label className="block text-sm">
          <span className="label">Формула</span>

          <input
            className="input"
            value={formula}
            onChange={(event) => setFormula(event.target.value)}
            placeholder="2d6+3, 1d8+5, 4d6kh3..."
          />
        </label>

        {quickRolls.length > 0 && (
          <div className="space-y-1">
            <div className="text-xs text-slate-500">Уже есть:</div>

            {quickRolls.map((quickRoll) => (
              <div
                key={quickRoll.id}
                className="flex items-center justify-between gap-2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs"
              >
                <span>
                  {quickRoll.name}: {quickRoll.formula}
                </span>

                <button
                  type="button"
                  className="text-slate-500 hover:text-red-400"
                  onClick={() =>
                    deleteQuickRollFromCharacter(character.id, quickRoll.id)
                  }
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={closeModal}>
            Отмена
          </button>

          <button type="submit" className="btn btn-primary">
            Добавить
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CharacterQuickRollModal() {
  const activeModal = useAppStore((state) => state.activeModal);

  if (activeModal !== 'quickRollCharacter') {
    return null;
  }

  return <CharacterQuickRollModalInner />;
}

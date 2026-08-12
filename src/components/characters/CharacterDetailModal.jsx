import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import {
  abilityModifier,
  defaultAbilities,
  formatModifier,
  toNumber,
} from '../../utils/character.js';

function Modal({ title, onClose, children, wide = false }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className={`card max-h-[90vh] w-full overflow-auto ${
          wide ? 'max-w-4xl' : 'max-w-xl'
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

const abilityFields = [
  { key: 'strength', label: 'Сила' },
  { key: 'dexterity', label: 'Ловкость' },
  { key: 'intelligence', label: 'Интеллект' },
  { key: 'wisdom', label: 'Мудрость' },
  { key: 'constitution', label: 'Выносливость' },
  { key: 'charisma', label: 'Харизма' },
];

function CharacterDetailModalInner() {
  const characterId = useAppStore((state) => state.modalPayload.characterId);
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const closeModal = useAppStore((state) => state.closeModal);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const removeCharacter = useAppStore((state) => state.removeCharacter);

  const character = [...players, ...npcs].find((item) => item.id === characterId);

  const [form, setForm] = useState(() => {
    if (!character) {
      return {};
    }

    return {
      name: character.name || '',
      type: character.type || '',
      level: character.level || '',
      hpMax: String(character.hpMax ?? ''),
      hpCurrent: String(character.hpCurrent ?? ''),
      tempHp: String(character.tempHp ?? ''),
      ac: String(character.ac ?? ''),
      initiative: String(character.initiative ?? ''),
      color: character.color || '#22c55e',
      description: character.description || '',
      abilities: {
        strength: String(character.abilities?.strength ?? 10),
        dexterity: String(character.abilities?.dexterity ?? 10),
        intelligence: String(character.abilities?.intelligence ?? 10),
        wisdom: String(character.abilities?.wisdom ?? 10),
        constitution: String(character.abilities?.constitution ?? 10),
        charisma: String(character.abilities?.charisma ?? 10),
      },
    };
  });

  if (!character) {
    return null;
  }

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const setAbility = (key) => (event) => {
    setForm((prev) => ({
      ...prev,
      abilities: {
        ...prev.abilities,
        [key]: event.target.value,
      },
    }));
  };

  const save = (event) => {
    event.preventDefault();

    const hpMax = toNumber(form.hpMax);
    const rawHpCurrent = toNumber(form.hpCurrent);
    const hpCurrent =
      hpMax > 0
        ? Math.max(0, Math.min(rawHpCurrent, hpMax))
        : Math.max(0, rawHpCurrent);

    const patch = {
      name: form.name.trim() || character.name,
      type: form.type.trim(),
      level: form.level.trim(),
      hpMax,
      hpCurrent,
      tempHp: toNumber(form.tempHp),
      ac: toNumber(form.ac),
      initiative: toNumber(form.initiative),
      color: form.color,
      description: form.description.trim(),
      abilities: {
        strength: toNumber(form.abilities.strength, 10),
        dexterity: toNumber(form.abilities.dexterity, 10),
        intelligence: toNumber(form.abilities.intelligence, 10),
        wisdom: toNumber(form.abilities.wisdom, 10),
        constitution: toNumber(form.abilities.constitution, 10),
        charisma: toNumber(form.abilities.charisma, 10),
      },
    };

    useAppStore.setState((state) => {
      const updateList = (list) =>
        list.map((item) => {
          if (item.id !== character.id) {
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
    <Modal title={`Персонаж: ${character.name}`} onClose={closeModal} wide>
      <form onSubmit={save} className="space-y-3">
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
            <span className="label">Цвет</span>
            <input
              className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 p-1"
              type="color"
              value={form.color}
              onChange={setField('color')}
            />
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
            <span className="label">Временные HP</span>
            <input
              className="input"
              type="number"
              value={form.tempHp}
              onChange={setField('tempHp')}
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
        </div>

        <label className="block text-sm">
          <span className="label">Описание</span>
          <textarea
            className="input"
            rows={3}
            value={form.description}
            onChange={setField('description')}
            placeholder="Заметки, особенности, тактика, описание персонажа..."
          />
        </label>

        <div className="grid gap-2 md:grid-cols-3">
          {abilityFields.map((ability) => {
            const modifier = abilityModifier(form.abilities[ability.key]);

            return (
              <label key={ability.key} className="text-sm">
                <span className="label">
                  {ability.label} ({formatModifier(modifier)})
                </span>

                <input
                  className="input"
                  type="number"
                  value={form.abilities[ability.key]}
                  onChange={setAbility(ability.key)}
                />
              </label>
            );
          })}
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              if (window.confirm(`Удалить персонажа «${character.name}»?`)) {
                removeCharacter(character.side, character.id);
                closeModal();
              }
            }}
          >
            Удалить
          </button>

          <button
            type="button"
            className="btn"
            onClick={() => {
              selectCharacter(character.id);
              closeModal();
            }}
          >
            🎯 Выбрать целью
          </button>

          <button type="button" className="btn" onClick={closeModal}>
            Отмена
          </button>

          <button type="submit" className="btn btn-primary">
            💾 Сохранить
          </button>
        </div>
      </form>
    </Modal>
  );
}

export default function CharacterDetailModal() {
  const activeModal = useAppStore((state) => state.activeModal);

  if (activeModal !== 'characterDetail') {
    return null;
  }

  return <CharacterDetailModalInner />;
}

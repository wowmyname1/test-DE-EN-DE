import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { usePresetsStore } from '../store/presetsStore.js';

const categories = [
  { value: 'player', label: '🛡️ Игроки' },
  { value: 'npc', label: '👹 NPC' },
  { value: 'spell', label: '🔮 Заклинания' },
  { value: 'status', label: '✨ Статусы' },
];

const schools = [
  'Воплощение',
  'Проявление',
  'Очарование',
  'Ограждение',
  'Преобразование',
  'Прорицание',
  'Некромантия',
  'Вызов',
];

const spellLevels = [
  { value: '0', label: 'Заговор' },
  { value: '1', label: 'Уровень 1' },
  { value: '2', label: 'Уровень 2' },
  { value: '3', label: 'Уровень 3' },
  { value: '4', label: 'Уровень 4' },
  { value: '5', label: 'Уровень 5' },
];

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

function CharacterPresetForm({ category, preset, onSave, onCancel }) {
  const data = preset?.data || {};

  const [form, setForm] = useState({
    name: data.name || '',
    type: data.type || '',
    level: data.level || '',
    hpMax: String(data.hpMax ?? ''),
    hpCurrent: String(data.hpCurrent ?? ''),
    ac: String(data.ac ?? ''),
    initiative: String(data.initiative ?? ''),
    color: data.color || (category === 'player' ? '#22c55e' : '#ef4444'),
  });

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    const name = form.name.trim() || 'Без имени';

    onSave({
      name,
      data: {
        name,
        type: form.type.trim(),
        level: form.level.trim(),
        hpMax: Number(form.hpMax || 0),
        hpCurrent: Number(form.hpCurrent || 0),
        ac: Number(form.ac || 0),
        initiative: Number(form.initiative || 0),
        color: form.color,
      },
    });
  };

  return (
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
          <input className="input" type="number" value={form.hpCurrent} onChange={setField('hpCurrent')} />
        </label>

        <label className="text-sm">
          <span className="label">AC</span>
          <input className="input" type="number" value={form.ac} onChange={setField('ac')} />
        </label>

        <label className="text-sm">
          <span className="label">Инициатива</span>
          <input className="input" type="number" value={form.initiative} onChange={setField('initiative')} />
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
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>

        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
      </div>
    </form>
  );
}

function SpellPresetForm({ preset, onSave, onCancel }) {
  const statusTemplates = useAppStore((state) => state.statusTemplates);
  const data = preset?.data || {};
  const logic = data.logic || {};

  const [form, setForm] = useState({
    name: data.name || '',
    level: String(data.level ?? '0'),
    icon: data.icon || '✨',
    school: data.school || schools[0],
    castTime: data.castTime || '',
    range: data.range || '',
    duration: data.duration || '',
    description: data.description || '',
    effectType: logic.effectType || 'damage',
    formula: logic.formula || '',
    statusTemplateId: logic.statusTemplateId || '',
    statusDuration: String(logic.statusDuration ?? ''),
    targetMode: logic.targetMode || 'single',
  });

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    const name = form.name.trim() || 'Заклинание';

    onSave({
      name,
      data: {
        name,
        level: Number(form.level),
        icon: form.icon.trim() || '✨',
        school: form.school,
        castTime: form.castTime.trim(),
        range: form.range.trim(),
        duration: form.duration.trim(),
        description: form.description.trim(),
        logic: {
          targetMode: form.targetMode,
          effectType: form.effectType,
          formula: form.formula.trim(),
          statusTemplateId: form.statusTemplateId,
          statusDuration: form.statusDuration,
        },
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-2 md:grid-cols-2">
        <label className="text-sm">
          <span className="label">Название</span>
          <input className="input" value={form.name} onChange={setField('name')} required />
        </label>

        <label className="text-sm">
          <span className="label">Уровень</span>

          <select className="input" value={form.level} onChange={setField('level')}>
            {spellLevels.map((level) => (
              <option key={level.value} value={level.value}>
                {level.label}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="label">Иконка</span>
          <input className="input" value={form.icon} onChange={setField('icon')} />
        </label>

        <label className="text-sm">
          <span className="label">Школа</span>

          <select className="input" value={form.school} onChange={setField('school')}>
            {schools.map((school) => (
              <option key={school} value={school}>
                {school}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="label">Время накладывания</span>
          <input className="input" value={form.castTime} onChange={setField('castTime')} />
        </label>

        <label className="text-sm">
          <span className="label">Дистанция</span>
          <input className="input" value={form.range} onChange={setField('range')} />
        </label>

        <label className="text-sm">
          <span className="label">Длительность</span>
          <input className="input" value={form.duration} onChange={setField('duration')} />
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="label">Описание</span>
          <textarea className="input" rows={3} value={form.description} onChange={setField('description')} />
        </label>

        <label className="text-sm">
          <span className="label">Тип эффекта</span>

          <select className="input" value={form.effectType} onChange={setField('effectType')}>
            <option value="damage">Урон</option>
            <option value="healing">Лечение</option>
            <option value="temp">Временные HP</option>
            <option value="status">Наложить статус</option>
          </select>
        </label>

        {form.effectType !== 'status' && (
          <label className="text-sm">
            <span className="label">Формула</span>
            <input
              className="input"
              value={form.formula}
              onChange={setField('formula')}
              placeholder="Например: 1d10"
            />
          </label>
        )}

        {form.effectType === 'status' && (
          <>
            <label className="text-sm">
              <span className="label">Статус</span>

              <select
                className="input"
                value={form.statusTemplateId}
                onChange={setField('statusTemplateId')}
              >
                <option value="">Без шаблона, именем заклинания</option>

                {statusTemplates.map((template) => (
                  <option key={template.id} value={template.id}>
                    {template.icon} {template.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm">
              <span className="label">Длительность статуса</span>
              <input
                className="input"
                value={form.statusDuration}
                onChange={setField('statusDuration')}
                placeholder="Пусто = бессрочно"
              />
            </label>
          </>
        )}

        <label className="text-sm">
          <span className="label">Режим цели</span>

          <select className="input" value={form.targetMode} onChange={setField('targetMode')}>
            <option value="single">🎯 Одиночная</option>
            <option value="aoe">💥 AoE</option>
            <option value="spread">🎲 Разброс</option>
          </select>
        </label>
      </div>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>

        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
      </div>
    </form>
  );
}

function StatusPresetForm({ preset, onSave, onCancel }) {
  const data = preset?.data || {};

  const [form, setForm] = useState({
    name: data.name || '',
    icon: data.icon || '✨',
    color: data.color || '#a855f7',
    description: data.description || '',
    logicText: JSON.stringify(data.logic || { nodes: [] }, null, 2),
  });

  const [error, setError] = useState('');

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();

    let logic;

    try {
      logic = form.logicText.trim() ? JSON.parse(form.logicText) : { nodes: [] };
    } catch (parseError) {
      setError('JSON логики некорректный.');
      return;
    }

    if (!logic || typeof logic !== 'object') {
      logic = { nodes: [] };
    }

    if (!Array.isArray(logic.nodes)) {
      logic.nodes = [];
    }

    const name = form.name.trim() || 'Статус';

    onSave({
      name,
      data: {
        name,
        icon: form.icon.trim() || '✨',
        color: form.color,
        description: form.description.trim(),
        duration: data.duration ?? null,
        logic,
      },
    });
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid gap-2 md:grid-cols-3">
        <label className="text-sm">
          <span className="label">Название</span>
          <input className="input" value={form.name} onChange={setField('name')} required />
        </label>

        <label className="text-sm">
          <span className="label">Иконка</span>
          <input className="input" value={form.icon} onChange={setField('icon')} />
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

      <label className="block text-sm">
        <span className="label">Описание</span>
        <textarea className="input" rows={3} value={form.description} onChange={setField('description')} />
      </label>

      <label className="block text-sm">
        <span className="label">Логика (JSON)</span>

        <textarea
          className="input font-mono text-xs"
          rows={10}
          value={form.logicText}
          onChange={setField('logicText')}
        />
      </label>

      {error && <p className="text-red-400">{error}</p>}

      <p className="text-xs text-slate-500">
        Подсказка: логику можно создать в «✨ Конструкторе статуса», затем сохранить статус в пресеты.
      </p>

      <div className="flex justify-end gap-2">
        <button type="button" className="btn" onClick={onCancel}>
          Отмена
        </button>

        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>
      </div>
    </form>
  );
}

const presetSummary = (category, preset) => {
  const data = preset.data || {};

  if (category === 'player' || category === 'npc') {
    return `HP ${data.hpCurrent ?? data.hpMax ?? 0}/${data.hpMax ?? 0} • AC ${
      data.ac ?? 0
    } • Инициатива ${data.initiative ?? 0}`;
  }

  if (category === 'spell') {
    return `${data.level === 0 ? 'Заговор' : `Уровень ${data.level ?? 0}`} • ${
      data.school || '—'
    }`;
  }

  if (category === 'status') {
    return (
      data.description ||
      (data.logic?.nodes?.length ? `Узлов: ${data.logic.nodes.length}` : 'Без логики')
    );
  }

  return '';
};

export default function PresetsModal() {
  const activeModal = useAppStore((state) => state.activeModal);
  const closeModal = useAppStore((state) => state.closeModal);

  const presets = usePresetsStore((state) => state.presets);
  const upsertPreset = usePresetsStore((state) => state.upsertPreset);
  const removePreset = usePresetsStore((state) => state.removePreset);

  const [category, setCategory] = useState('player');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    if (activeModal === 'presets') {
      setCategory('player');
      setEditing(null);
    }
  }, [activeModal]);

  if (activeModal !== 'presets') {
    return null;
  }

  const items = presets?.[category] || [];

  const applyPreset = (preset) => {
    const main = useAppStore.getState();

    if (category === 'player') {
      main.addCharacter('player', preset.data || {});
    }

    if (category === 'npc') {
      main.addCharacter('npc', preset.data || {});
    }

    if (category === 'spell') {
      main.addSpell(preset.data || {});
    }

    if (category === 'status') {
      main.addStatusTemplate(preset.data || {});
    }

    main.addLog(`Пресет применён: ${preset.name}`);
  };

  const saveCurrent = () => {
    const main = useAppStore.getState();

    if (category === 'player') {
      if (!main.players.length) {
        return;
      }

      main.players.forEach((character) => {
        upsertPreset('player', {
          name: character.name,
          data: {
            name: character.name,
            type: character.type,
            level: character.level,
            hpMax: character.hpMax,
            hpCurrent: character.hpCurrent,
            ac: character.ac,
            initiative: character.initiative,
            color: character.color,
          },
        });
      });

      main.addLog(`Сохранено игроков в пресеты: ${main.players.length}`);
    }

    if (category === 'npc') {
      if (!main.npcs.length) {
        return;
      }

      main.npcs.forEach((character) => {
        upsertPreset('npc', {
          name: character.name,
          data: {
            name: character.name,
            type: character.type,
            level: character.level,
            hpMax: character.hpMax,
            hpCurrent: character.hpCurrent,
            ac: character.ac,
            initiative: character.initiative,
            color: character.color,
          },
        });
      });

      main.addLog(`Сохранено NPC в пресеты: ${main.npcs.length}`);
    }

    if (category === 'spell') {
      if (!main.spells.length) {
        return;
      }

      main.spells.forEach((spell) => {
        upsertPreset('spell', {
          name: spell.name,
          data: {
            name: spell.name,
            level: spell.level,
            icon: spell.icon,
            school: spell.school,
            castTime: spell.castTime,
            range: spell.range,
            duration: spell.duration,
            description: spell.description,
            logic: spell.logic,
          },
        });
      });

      main.addLog(`Сохранено заклинаний в пресеты: ${main.spells.length}`);
    }

    if (category === 'status') {
      if (!main.statusTemplates.length) {
        return;
      }

      main.statusTemplates.forEach((template) => {
        upsertPreset('status', {
          name: template.name,
          data: {
            name: template.name,
            icon: template.icon,
            color: template.color,
            description: template.description,
            duration: template.duration ?? null,
            logic: template.logic,
          },
        });
      });

      main.addLog(`Сохранено статусов в пресеты: ${main.statusTemplates.length}`);
    }
  };

  const handleEditorSave = (value) => {
    upsertPreset(category, {
      ...value,
      id: editing?.id,
    });

    setEditing(null);
  };

  const title = editing
    ? editing.id
      ? 'Редактировать пресет'
      : 'Новый пресет'
    : '📦 Пресеты';

  return (
    <Modal title={title} onClose={closeModal} wide>
      {editing !== null ? (
        <>
          {(category === 'player' || category === 'npc') && (
            <CharacterPresetForm
              category={category}
              preset={editing}
              onSave={handleEditorSave}
              onCancel={() => setEditing(null)}
            />
          )}

          {category === 'spell' && (
            <SpellPresetForm
              preset={editing}
              onSave={handleEditorSave}
              onCancel={() => setEditing(null)}
            />
          )}

          {category === 'status' && (
            <StatusPresetForm
              preset={editing}
              onSave={handleEditorSave}
              onCancel={() => setEditing(null)}
            />
          )}
        </>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`btn ${category === item.value ? 'btn-primary' : ''}`}
                onClick={() => setCategory(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={saveCurrent}>
              💾 Сохранить текущие в пресеты
            </button>

            <button type="button" className="btn" onClick={() => setEditing({})}>
              ➕ Создать пресет
            </button>
          </div>

          <div className="space-y-2">
            {items.length === 0 && (
              <p className="text-sm text-slate-500">Пресетов пока нет.</p>
            )}

            {items.map((preset) => (
              <div
                key={preset.id}
                className="card flex flex-wrap items-center justify-between gap-2"
              >
                <div>
                  <div className="font-medium">{preset.name}</div>

                  <div className="text-xs text-slate-400">
                    {presetSummary(category, preset)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1">
                  <button
                    className="btn btn-primary"
                    onClick={() => applyPreset(preset)}
                  >
                    Применить
                  </button>

                  <button
                    className="btn"
                    title="Редактировать пресет"
                    onClick={() => setEditing(preset)}
                  >
                    ✏️
                  </button>

                  <button
                    className="btn btn-danger"
                    title="Удалить пресет"
                    onClick={() => {
                      if (window.confirm(`Удалить пресет «${preset.name}»?`)) {
                        removePreset(category, preset.id);
                      }
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  );
}

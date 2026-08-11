import { useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { uid } from '../utils/id.js';

const effectLabel = (value) => {
  const map = {
    damage: 'Урон',
    healing: 'Лечение',
    temp: 'Временные HP',
    status: 'Статус',
  };

  return map[value] || value;
};

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

function AddCharacterModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const addCharacter = useAppStore((state) => state.addCharacter);
  const side = useAppStore((state) => state.modalPayload.side || 'player');

  const [form, setForm] = useState({
    name: '',
    type: '',
    level: '',
    hpMax: '',
    hpCurrent: '',
    ac: '',
    initiative: '',
    color: side === 'player' ? '#22c55e' : '#ef4444',
  });

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    addCharacter(side, form);
    closeModal();
  };

  return (
    <Modal title="Добавить персонажа" onClose={closeModal} wide>
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

function AddStatusModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const statusTemplates = useAppStore((state) => state.statusTemplates);
  const addStatusToCharacter = useAppStore((state) => state.addStatusToCharacter);

  const payloadTargetId = useAppStore((state) => state.modalPayload.targetId || null);
  const initialTemplateId = useAppStore((state) => state.modalPayload.templateId || '');

  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const currentId = useAppStore((state) => state.initiativeOrder[state.turnIndex ?? -1]);

  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);

  const targetId = payloadTargetId || selectedCharacterId || currentId || null;
  const allCharacters = [...players, ...npcs];
  const targetCharacter = allCharacters.find((character) => character.id === targetId);

  const [tab, setTab] = useState('indefinite');
  const [templateId, setTemplateId] = useState(initialTemplateId);
  const [customName, setCustomName] = useState('');
  const [customIcon, setCustomIcon] = useState('✨');
  const [duration, setDuration] = useState(1);

  const useCustom = customName.trim().length > 0;
  const canAdd = Boolean(targetId && (useCustom || templateId));

  const submit = (event) => {
    event.preventDefault();

    if (!canAdd) {
      return;
    }

    const durationValue = tab === 'temporary' ? Number(duration || 1) : null;

    if (useCustom) {
      addStatusToCharacter(targetId, {
        name: customName.trim(),
        icon: customIcon.trim() || '✨',
        color: '#a855f7',
        description: '',
        duration: durationValue,
      });

      closeModal();
      return;
    }

    const template = statusTemplates.find((item) => item.id === templateId);

    if (!template) {
      return;
    }

    addStatusToCharacter(targetId, {
      name: template.name,
      icon: template.icon || '✨',
      color: template.color || '#a855f7',
      description: template.description || '',
      duration: durationValue,
      logic: template.logic,
    });

    closeModal();
  };

  return (
    <Modal title="Добавить статус" onClose={closeModal}>
      <form onSubmit={submit} className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`btn ${tab === 'indefinite' ? 'btn-primary' : ''}`}
            onClick={() => setTab('indefinite')}
          >
            ⏳ Бессрочные
          </button>

          <button
            type="button"
            className={`btn ${tab === 'temporary' ? 'btn-primary' : ''}`}
            onClick={() => setTab('temporary')}
          >
            🔢 Временные
          </button>
        </div>

        <p className="text-sm text-slate-300">
          Цель: {targetCharacter ? targetCharacter.name : 'не выбрана'}
        </p>

        <label className="block text-sm">
          <span className="label">Выберите статус</span>

          <select className="input" value={templateId} onChange={(event) => setTemplateId(event.target.value)}>
            <option value="">Выберите статус</option>

            {statusTemplates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.icon} {template.name}
              </option>
            ))}
          </select>
        </label>

        <div className="text-sm font-medium text-slate-300">Или свой статус</div>

        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-sm">
            <span className="label">Название</span>
            <input
              className="input"
              value={customName}
              onChange={(event) => setCustomName(event.target.value)}
              placeholder="Например: Благословение"
            />
          </label>

          <label className="text-sm">
            <span className="label">Иконка (эмодзи)</span>
            <input
              className="input"
              value={customIcon}
              onChange={(event) => setCustomIcon(event.target.value)}
              placeholder="✨"
            />
          </label>

          {tab === 'temporary' && (
            <label className="text-sm">
              <span className="label">Длительность (раунды)</span>
              <input
                className="input"
                type="number"
                min="1"
                value={duration}
                onChange={(event) => setDuration(event.target.value)}
              />
            </label>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={closeModal}>
            Отмена
          </button>

          <button type="submit" className="btn btn-primary disabled:opacity-50" disabled={!canAdd}>
            Добавить
          </button>
        </div>
      </form>
    </Modal>
  );
}

function AddQuickRollModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const addQuickRoll = useAppStore((state) => state.addQuickRoll);

  const [name, setName] = useState('');
  const [formula, setFormula] = useState('');

  const canAdd = Boolean(name.trim() && formula.trim());

  const submit = (event) => {
    event.preventDefault();

    if (!canAdd) {
      return;
    }

    addQuickRoll({
      name: name.trim(),
      formula: formula.trim(),
    });

    closeModal();
  };

  return (
    <Modal title="Добавить быстрый бросок" onClose={closeModal}>
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          <span className="label">Название</span>
          <input
            className="input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Например: Атака"
          />
        </label>

        <label className="block text-sm">
          <span className="label">Формула</span>
          <input
            className="input"
            value={formula}
            onChange={(event) => setFormula(event.target.value)}
            placeholder="Например: 1d20+5"
          />
        </label>

        <div className="flex justify-end gap-2">
          <button type="button" className="btn" onClick={closeModal}>
            Отмена
          </button>

          <button type="submit" className="btn btn-primary disabled:opacity-50" disabled={!canAdd}>
            Добавить
          </button>
        </div>
      </form>
    </Modal>
  );
}

function StatusCatalogModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const openModal = useAppStore((state) => state.openModal);
  const statusTemplates = useAppStore((state) => state.statusTemplates);

  return (
    <Modal title="✨ Каталог статусов" onClose={closeModal} wide>
      <div className="space-y-2">
        {statusTemplates.length === 0 && <p className="text-slate-400">Статусов пока нет.</p>}

        {statusTemplates.map((template) => (
          <div key={template.id} className="card flex items-center justify-between gap-2">
            <div>
              <div className="font-medium">
                {template.icon} {template.name}
              </div>

              <div className="text-xs text-slate-400">
                {template.description || 'Без описания'}
              </div>

              {template.duration ? (
                <div className="text-xs text-slate-500">Длительность: {template.duration}</div>
              ) : null}
            </div>

            <button
              className="btn"
              onClick={() => openModal('addStatus', { templateId: template.id })}
            >
              Добавить
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="btn btn-primary" onClick={() => openModal('statusConstructor')}>
          ➕ Создать
        </button>

        <button className="btn" onClick={closeModal}>
          Закрыть
        </button>
      </div>
    </Modal>
  );
}

function SpellCatalogModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const openModal = useAppStore((state) => state.openModal);
  const spells = useAppStore((state) => state.spells);

  const [filter, setFilter] = useState('all');

  const levels = [
    { value: 'all', label: 'Все уровни' },
    { value: '0', label: 'Заговоры' },
    { value: '1', label: 'Уровень 1' },
    { value: '2', label: 'Уровень 2' },
    { value: '3', label: 'Уровень 3' },
    { value: '4', label: 'Уровень 4' },
    { value: '5', label: 'Уровень 5' },
  ];

  const filteredSpells = spells.filter((spell) => {
    if (filter === 'all') {
      return true;
    }

    return String(spell.level) === filter;
  });

  return (
    <Modal title="🔮 Каталог заклинаний" onClose={closeModal} wide>
      <div className="mb-3 flex flex-wrap gap-2">
        {levels.map((level) => (
          <button
            key={level.value}
            type="button"
            className={`btn ${filter === level.value ? 'btn-primary' : ''}`}
            onClick={() => setFilter(level.value)}
          >
            {level.label}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filteredSpells.length === 0 && <p className="text-slate-400">Заклинаний пока нет.</p>}

        {filteredSpells.map((spell) => (
          <div key={spell.id} className="card flex items-start justify-between gap-2">
            <div>
              <div className="font-medium">
                {spell.icon} {spell.name}
              </div>

              <div className="text-xs text-slate-400">
                {spell.level === 0 ? 'Заговор' : `Уровень ${spell.level}`} • {spell.school}
              </div>

              {spell.description && (
                <div className="mt-1 text-sm text-slate-300">{spell.description}</div>
              )}

              {spell.logic?.effectType && (
                <div className="mt-1 text-xs text-slate-500">
                  Эффект: {effectLabel(spell.logic.effectType)}
                  {spell.logic.formula ? ` • ${spell.logic.formula}` : ''}
                </div>
              )}
            </div>

            <button
              className="btn btn-primary"
              onClick={() => openModal('castSpell', { spellId: spell.id })}
            >
              Применить
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="btn btn-primary" onClick={() => openModal('spellConstructor')}>
          ➕ Создать
        </button>

        <button className="btn" onClick={closeModal}>
          Закрыть
        </button>
      </div>
    </Modal>
  );
}

function StatusConstructorModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const openModal = useAppStore((state) => state.openModal);
  const addStatusTemplate = useAppStore((state) => state.addStatusTemplate);

  const [tab, setTab] = useState('basic');

  const [form, setForm] = useState({
    name: '',
    icon: '✨',
    color: '#a855f7',
    description: '',
  });

  const [nodes, setNodes] = useState([]);

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const nodeTypeLabel = (type) => {
    if (type === 'trigger') {
      return '⚡ Триггер';
    }

    if (type === 'condition') {
      return '✅ Условие';
    }

    if (type === 'action') {
      return '🎯 Действие';
    }

    return 'Узел';
  };

  const conditionValuePlaceholder = (type) => {
    if (type === 'hpBelow' || type === 'hpAbove') {
      return 'Например: 50% или 10';
    }

    if (type === 'hasStatus') {
      return 'Например: Горение';
    }

    if (type === 'random') {
      return 'Например: 30';
    }

    return '';
  };

  const nodeLabel = (node, index) => {
    const parts = [`${index + 1}. ${nodeTypeLabel(node.type)}`];

    if (node.text) {
      parts.push(node.text);
    }

    if (node.formula) {
      parts.push(node.formula);
    }

    return parts.join(' • ');
  };

  const addNode = (type) => {
    setNodes((prev) => [
      ...prev,
      {
        id: uid(),
        type,
        parentId: '',
        trigger: type === 'action' ? 'start' : '',
        effectType: type === 'action' ? 'damage' : '',
        formula: type === 'action' ? '1d6' : '',
        conditionType: type === 'condition' ? 'hpBelow' : '',
        conditionValue: type === 'condition' ? '50%' : '',
        text: '',
      },
    ]);
  };

  const addExampleTree = () => {
    const triggerId = uid();
    const conditionId = uid();
    const actionId = uid();

    setNodes([
      {
        id: triggerId,
        type: 'trigger',
        parentId: '',
        trigger: 'end',
        effectType: '',
        formula: '',
        conditionType: '',
        conditionValue: '',
        text: 'Конец хода',
      },
      {
        id: conditionId,
        type: 'condition',
        parentId: triggerId,
        trigger: '',
        effectType: '',
        formula: '',
        conditionType: 'hpBelow',
        conditionValue: '50%',
        text: 'HP ниже 50%',
      },
      {
        id: actionId,
        type: 'action',
        parentId: conditionId,
        trigger: 'end',
        effectType: 'damage',
        formula: '1d6',
        conditionType: '',
        conditionValue: '',
        text: 'Урон огнём',
      },
    ]);
  };

  const updateNode = (id, patch) => {
    setNodes((prev) =>
      prev.map((node) => {
        if (node.id !== id) {
          return node;
        }

        return {
          ...node,
          ...patch,
        };
      })
    );
  };

  const removeNode = (id) => {
    setNodes((prev) =>
      prev
        .filter((node) => node.id !== id)
        .map((node) => {
          if (node.parentId === id) {
            return {
              ...node,
              parentId: '',
            };
          }

          return node;
        })
    );
  };

  const save = () => {
    if (!form.name.trim()) {
      return;
    }

    addStatusTemplate({
      name: form.name.trim(),
      icon: form.icon.trim() || '✨',
      color: form.color,
      description: form.description.trim(),
      duration: null,
      logic: {
        nodes,
      },
    });

    openModal('statusCatalog');
  };

  return (
    <Modal title="✨ Конструктор статуса" onClose={closeModal} wide>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn ${tab === 'basic' ? 'btn-primary' : ''}`}
          onClick={() => setTab('basic')}
        >
          📋 Основное
        </button>

        <button
          type="button"
          className={`btn ${tab === 'logic' ? 'btn-primary' : ''}`}
          onClick={() => setTab('logic')}
        >
          ⚙️ Логика (узлы)
        </button>
      </div>

      {tab === 'basic' && (
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-sm">
            <span className="label">Название</span>
            <input className="input" value={form.name} onChange={setField('name')} />
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

          <label className="block text-sm md:col-span-2">
            <span className="label">Описание</span>
            <textarea className="input" rows={3} value={form.description} onChange={setField('description')} />
          </label>
        </div>
      )}

      {tab === 'logic' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Создайте триггеры (когда срабатывает), условия (проверки) и действия. Узлы образуют
            дерево — каждый дочерний срабатывает только если родитель прошёл.
          </p>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn" onClick={() => addNode('trigger')}>
              ⚡ + Триггер
            </button>

            <button type="button" className="btn" onClick={() => addNode('condition')}>
              ✅ + Условие
            </button>

            <button type="button" className="btn" onClick={() => addNode('action')}>
              🎯 + Действие
            </button>

            <button type="button" className="btn" onClick={addExampleTree}>
              🧪 Пример дерева
            </button>
          </div>

          <div className="space-y-2">
            {nodes.length === 0 && (
              <p className="text-sm text-slate-500">Узлов пока нет.</p>
            )}

            {nodes.map((node, index) => (
              <div key={node.id} className="card space-y-2 bg-slate-950">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-sm font-medium">
                    {nodeTypeLabel(node.type)}
                  </div>

                  <button
                    type="button"
                    className="btn btn-danger px-3"
                    onClick={() => removeNode(node.id)}
                  >
                    ✕
                  </button>
                </div>

                <div className="grid gap-2 md:grid-cols-2">
                  <label className="text-sm">
                    <span className="label">Тип узла</span>

                    <select
                      className="input"
                      value={node.type}
                      onChange={(event) => {
                        const type = event.target.value;

                        updateNode(node.id, {
                          type,
                          trigger:
                            type === 'action'
                              ? node.trigger || 'start'
                              : type === 'trigger'
                                ? node.trigger || ''
                                : '',
                          effectType:
                            type === 'action'
                              ? node.effectType || 'damage'
                              : '',
                          formula:
                            type === 'action'
                              ? node.formula || '1d6'
                              : '',
                          conditionType:
                            type === 'condition'
                              ? node.conditionType || 'hpBelow'
                              : node.conditionType || '',
                          conditionValue:
                            type === 'condition'
                              ? node.conditionValue || '50%'
                              : node.conditionValue || '',
                        });
                      }}
                    >
                      <option value="trigger">⚡ Триггер</option>
                      <option value="condition">✅ Условие</option>
                      <option value="action">🎯 Действие</option>
                    </select>
                  </label>

                  <label className="text-sm">
                    <span className="label">Родитель</span>

                    <select
                      className="input"
                      value={node.parentId || ''}
                      onChange={(event) =>
                        updateNode(node.id, { parentId: event.target.value })
                      }
                    >
                      <option value="">Нет</option>

                      {nodes.map((other, otherIndex) => {
                        if (other.id === node.id) {
                          return null;
                        }

                        return (
                          <option key={other.id} value={other.id}>
                            {nodeLabel(other, otherIndex)}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                </div>

                {(node.type === 'action' || node.type === 'trigger') && (
                  <label className="block text-sm">
                    <span className="label">Когда</span>

                    <select
                      className="input"
                      value={node.trigger || ''}
                      onChange={(event) =>
                        updateNode(node.id, { trigger: event.target.value })
                      }
                    >
                      {node.type === 'trigger' && <option value="">Любое</option>}
                      <option value="start">Начало хода</option>
                      <option value="end">Конец хода</option>
                    </select>
                  </label>
                )}

                {node.type === 'action' && (
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="label">Эффект</span>

                      <select
                        className="input"
                        value={node.effectType || 'damage'}
                        onChange={(event) =>
                          updateNode(node.id, { effectType: event.target.value })
                        }
                      >
                        <option value="damage">Урон</option>
                        <option value="healing">Лечение</option>
                        <option value="temp">Временные HP</option>
                      </select>
                    </label>

                    <label className="text-sm">
                      <span className="label">Формула</span>
                      <input
                        className="input"
                        value={node.formula || ''}
                        onChange={(event) =>
                          updateNode(node.id, { formula: event.target.value })
                        }
                        placeholder="Например: 1d6"
                      />
                    </label>
                  </div>
                )}

                {(node.type === 'condition' || node.type === 'action') && (
                  <div className="grid gap-2 md:grid-cols-2">
                    <label className="text-sm">
                      <span className="label">Тип условия</span>

                      <select
                        className="input"
                        value={node.conditionType || ''}
                        onChange={(event) =>
                          updateNode(node.id, { conditionType: event.target.value })
                        }
                      >
                        <option value="">Нет</option>
                        <option value="hpBelow">HP ниже</option>
                        <option value="hpAbove">HP выше</option>
                        <option value="hasStatus">Есть статус</option>
                        <option value="random">Случайный шанс</option>
                      </select>
                    </label>

                    {node.conditionType ? (
                      <label className="text-sm">
                        <span className="label">Значение условия</span>
                        <input
                          className="input"
                          value={node.conditionValue || ''}
                          onChange={(event) =>
                            updateNode(node.id, { conditionValue: event.target.value })
                          }
                          placeholder={conditionValuePlaceholder(node.conditionType)}
                        />
                      </label>
                    ) : null}
                  </div>
                )}

                <label className="block text-sm">
                  <span className="label">
                    {node.type === 'action' ? 'Комментарий' : 'Описание'}
                  </span>

                  <input
                    className="input"
                    value={node.text || ''}
                    onChange={(event) =>
                      updateNode(node.id, { text: event.target.value })
                    }
                    placeholder={
                      node.type === 'action'
                        ? 'Например: огонь наносит урон при активации'
                        : 'Описание логики узла'
                    }
                  />
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn" onClick={closeModal}>
          Отмена
        </button>

        <button
          type="button"
          className="btn btn-primary disabled:opacity-50"
          disabled={!form.name.trim()}
          onClick={save}
        >
          💾 Сохранить
        </button>
      </div>
    </Modal>
  );
}

function SpellConstructorModal() {
  const closeModal = useAppStore((state) => state.closeModal);
  const openModal = useAppStore((state) => state.openModal);
  const addSpell = useAppStore((state) => state.addSpell);
  const statusTemplates = useAppStore((state) => state.statusTemplates);

  const [tab, setTab] = useState('basic');
  const [targetMode, setTargetMode] = useState('single');
  const [effectType, setEffectType] = useState('damage');
  const [formula, setFormula] = useState('');
  const [statusTemplateId, setStatusTemplateId] = useState('');
  const [statusDuration, setStatusDuration] = useState('');

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

  const levels = [
    { value: '0', label: 'Заговор' },
    { value: '1', label: 'Уровень 1' },
    { value: '2', label: 'Уровень 2' },
    { value: '3', label: 'Уровень 3' },
    { value: '4', label: 'Уровень 4' },
    { value: '5', label: 'Уровень 5' },
  ];

  const targetModes = [
    { value: 'single', label: '🎯 Одиночная' },
    { value: 'aoe', label: '💥 AoE' },
    { value: 'spread', label: '🎲 Разброс' },
  ];

  const [form, setForm] = useState({
    name: '',
    level: '0',
    icon: '✨',
    school: schools[0],
    castTime: '',
    range: '',
    duration: '',
    description: '',
  });

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const save = () => {
    if (!form.name.trim()) {
      return;
    }

    addSpell({
      name: form.name.trim(),
      level: Number(form.level),
      icon: form.icon.trim() || '✨',
      school: form.school,
      castTime: form.castTime.trim(),
      range: form.range.trim(),
      duration: form.duration.trim(),
      description: form.description.trim(),
      logic: {
        targetMode,
        effectType,
        formula,
        statusTemplateId,
        statusDuration,
      },
    });

    openModal('spellCatalog');
  };

  return (
    <Modal title="🔮 Конструктор заклинания" onClose={closeModal} wide>
      <div className="mb-3 flex flex-wrap gap-2">
        <button
          type="button"
          className={`btn ${tab === 'basic' ? 'btn-primary' : ''}`}
          onClick={() => setTab('basic')}
        >
          📋 Основное
        </button>

        <button
          type="button"
          className={`btn ${tab === 'logic' ? 'btn-primary' : ''}`}
          onClick={() => setTab('logic')}
        >
          🎯 Логика
        </button>
      </div>

      {tab === 'basic' && (
        <div className="grid gap-2 md:grid-cols-2">
          <label className="text-sm">
            <span className="label">Название</span>
            <input className="input" value={form.name} onChange={setField('name')} />
          </label>

          <label className="text-sm">
            <span className="label">Уровень</span>

            <select className="input" value={form.level} onChange={setField('level')}>
              {levels.map((level) => (
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

            <select
              className="input"
              value={effectType}
              onChange={(event) => setEffectType(event.target.value)}
            >
              <option value="damage">Урон</option>
              <option value="healing">Лечение</option>
              <option value="temp">Временные HP</option>
              <option value="status">Наложить статус</option>
            </select>
          </label>

          {effectType !== 'status' && (
            <label className="text-sm">
              <span className="label">Формула</span>
              <input
                className="input"
                value={formula}
                onChange={(event) => setFormula(event.target.value)}
                placeholder="Например: 2d6"
              />
            </label>
          )}

          {effectType === 'status' && (
            <>
              <label className="text-sm">
                <span className="label">Статус</span>

                <select
                  className="input"
                  value={statusTemplateId}
                  onChange={(event) => setStatusTemplateId(event.target.value)}
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
                <span className="label">Длительность статуса (раунды, пусто = бессрочно)</span>
                <input
                  className="input"
                  value={statusDuration}
                  onChange={(event) => setStatusDuration(event.target.value)}
                  placeholder="Например: 3"
                />
              </label>
            </>
          )}
        </div>
      )}

      {tab === 'logic' && (
        <div className="space-y-3">
          <div className="text-sm font-medium text-slate-300">Режим цели</div>

          <div className="flex flex-wrap gap-2">
            {targetModes.map((mode) => (
              <button
                key={mode.value}
                type="button"
                className={`btn ${targetMode === mode.value ? 'btn-primary' : ''}`}
                onClick={() => setTargetMode(mode.value)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex justify-end gap-2">
        <button type="button" className="btn" onClick={closeModal}>
          Отмена
        </button>

        <button
          type="button"
          className="btn btn-primary disabled:opacity-50"
          disabled={!form.name.trim()}
          onClick={save}
        >
          💾 Сохранить
        </button>
      </div>
    </Modal>
  );
}

export default function GlobalModals() {
  const activeModal = useAppStore((state) => state.activeModal);

  if (!activeModal) {
    return null;
  }

  return (
    <>
      {activeModal === 'addCharacter' && <AddCharacterModal />}
      {activeModal === 'addStatus' && <AddStatusModal />}
      {activeModal === 'addQuickRoll' && <AddQuickRollModal />}
      {activeModal === 'statusCatalog' && <StatusCatalogModal />}
      {activeModal === 'spellCatalog' && <SpellCatalogModal />}
      {activeModal === 'statusConstructor' && <StatusConstructorModal />}
      {activeModal === 'spellConstructor' && <SpellConstructorModal />}
    </>
  );
}

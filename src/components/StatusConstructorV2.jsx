import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { uid } from '../utils/id.js';

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

const nodeTitle = (node) => {
  const parts = [nodeTypeLabel(node.type)];

  if (node.text) {
    parts.push(node.text);
  }

  if (node.type === 'action' && node.formula) {
    parts.push(node.formula);
  }

  if (node.type === 'condition' && node.conditionType) {
    parts.push(node.conditionType);
  }

  return parts.join(' • ');
};

const createDefaultForm = () => ({
  name: '',
  icon: '✨',
  color: '#a855f7',
  description: '',
});

export default function StatusConstructorV2() {
  const activeModal = useAppStore((state) => state.activeModal);
  const closeModal = useAppStore((state) => state.closeModal);
  const openModal = useAppStore((state) => state.openModal);
  const addStatusTemplate = useAppStore((state) => state.addStatusTemplate);

  const [tab, setTab] = useState('basic');
  const [form, setForm] = useState(createDefaultForm());
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (activeModal === 'statusConstructor') {
      setTab('basic');
      setForm(createDefaultForm());
      setNodes([]);
    }
  }, [activeModal]);

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
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
    setNodes((prev) => {
      const target = prev.find((node) => node.id === id);

      if (!target) {
        return prev;
      }

      const fallbackParentId = target.parentId || '';

      return prev
        .filter((node) => node.id !== id)
        .map((node) => {
          if (node.parentId === id) {
            return {
              ...node,
              parentId: fallbackParentId,
            };
          }

          return node;
        });
    });
  };

  const getDescendantIds = (nodeId) => {
    const result = new Set();

    const walk = (id) => {
      nodes.forEach((node) => {
        if ((node.parentId || '') === id && !result.has(node.id)) {
          result.add(node.id);
          walk(node.id);
        }
      });
    };

    walk(nodeId);

    return result;
  };

  const findNearestTrigger = (nodeId) => {
    let current = nodes.find((node) => node.id === nodeId);
    let guard = 0;

    while (current && guard < 50) {
      if (current.type === 'trigger' && current.trigger) {
        return current.trigger;
      }

      if (current.type === 'action' && current.trigger) {
        return current.trigger;
      }

      current = nodes.find((node) => node.id === current.parentId);
      guard += 1;
    }

    return '';
  };

  const addNode = (type, parentId = '') => {
    const inheritedTrigger = findNearestTrigger(parentId);

    setNodes((prev) => [
      ...prev,
      {
        id: uid(),
        type,
        parentId,
        trigger:
          type === 'action'
            ? inheritedTrigger || 'start'
            : type === 'trigger'
              ? inheritedTrigger || ''
              : '',
        effectType: type === 'action' ? 'damage' : '',
        formula: type === 'action' ? '1d6' : '',
        conditionType: type === 'condition' ? 'hpBelow' : '',
        conditionValue: type === 'condition' ? '50%' : '',
        text: '',
      },
    ]);
  };

  const changeNodeType = (node, type) => {
    const inheritedTrigger =
      node.trigger || findNearestTrigger(node.parentId || '');

    updateNode(node.id, {
      type,
      trigger:
        type === 'action'
          ? node.trigger || inheritedTrigger || 'start'
          : type === 'trigger'
            ? node.trigger || inheritedTrigger || ''
            : '',
      effectType: type === 'action' ? node.effectType || 'damage' : '',
      formula: type === 'action' ? node.formula || '1d6' : '',
      conditionType:
        type === 'condition' ? node.conditionType || 'hpBelow' : node.conditionType || '',
      conditionValue:
        type === 'condition' ? node.conditionValue || '50%' : node.conditionValue || '',
    });
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

  if (activeModal !== 'statusConstructor') {
    return null;
  }

  const renderNode = (node, level = 0) => {
    const children = nodes.filter((item) => (item.parentId || '') === node.id);
    const parent = nodes.find((item) => item.id === node.parentId);
    const descendantIds = getDescendantIds(node.id);
    const forbiddenParentIds = new Set([node.id, ...descendantIds]);

    return (
      <div key={node.id} className="space-y-2">
        <div className="card space-y-2 bg-slate-950">
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-medium">
              {level > 0 ? '↳ ' : ''}
              {nodeTypeLabel(node.type)}
            </div>

            <button
              type="button"
              className="btn btn-danger px-2 py-1"
              title="Удалить узел"
              onClick={() => removeNode(node.id)}
            >
              ✕
            </button>
          </div>

          {parent && (
            <div className="text-xs text-slate-500">
              Выполняется после: {nodeTitle(parent)}
            </div>
          )}

          <div className="grid gap-2 md:grid-cols-2">
            <label className="text-sm">
              <span className="label">Тип узла</span>

              <select
                className="input"
                value={node.type}
                onChange={(event) => changeNodeType(node, event.target.value)}
              >
                <option value="trigger">⚡ Триггер</option>
                <option value="condition">✅ Условие</option>
                <option value="action">🎯 Действие</option>
              </select>
            </label>

            {(node.type === 'action' || node.type === 'trigger') && (
              <label className="text-sm">
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
          </div>

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

          <details>
            <summary className="cursor-pointer text-xs text-slate-500">
              Связь узла (родитель)
            </summary>

            <label className="mt-2 block text-sm">
              <span className="label">Родительский узел</span>

              <select
                className="input"
                value={node.parentId || ''}
                onChange={(event) =>
                  updateNode(node.id, { parentId: event.target.value })
                }
              >
                <option value="">Нет (корневой узел)</option>

                {nodes
                  .filter((other) => !forbiddenParentIds.has(other.id))
                  .map((other) => (
                    <option key={other.id} value={other.id}>
                      {nodeTitle(other)}
                    </option>
                  ))}
              </select>
            </label>

            <p className="mt-1 text-xs text-slate-500">
              Дочерний узел срабатывает только если родитель прошёл.
            </p>
          </details>

          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-slate-500">Добавить дочерний узел:</span>

            <button
              type="button"
              className="btn px-2 py-1 text-xs"
              onClick={() => addNode('trigger', node.id)}
            >
              ⚡ Триггер
            </button>

            <button
              type="button"
              className="btn px-2 py-1 text-xs"
              onClick={() => addNode('condition', node.id)}
            >
              ✅ Условие
            </button>

            <button
              type="button"
              className="btn px-2 py-1 text-xs"
              onClick={() => addNode('action', node.id)}
            >
              🎯 Действие
            </button>
          </div>
        </div>

        {children.length > 0 && (
          <div className="ml-4 space-y-2 border-l border-slate-800 pl-3">
            {children.map((child) => renderNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = nodes.filter(
    (node) => !node.parentId || !nodes.some((item) => item.id === node.parentId)
  );

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
            <textarea
              className="input"
              rows={3}
              value={form.description}
              onChange={setField('description')}
            />
          </label>
        </div>
      )}

      {tab === 'logic' && (
        <div className="space-y-3">
          <p className="text-sm text-slate-400">
            Создайте триггеры (когда срабатывает), условия (проверки) и действия.
            Узлы образуют дерево — каждый дочерний срабатывает только если родитель прошёл.
          </p>

          <div className="card space-y-1 bg-slate-950 text-sm text-slate-400">
            <p>Как работает дерево:</p>

            <ul className="list-disc space-y-1 pl-5">
              <li>⚡ Триггер задаёт момент: начало или конец хода.</li>
              <li>✅ Условие проверяет HP, наличие статуса или случайный шанс.</li>
              <li>🎯 Действие наносит урон, лечит или даёт временные HP.</li>
              <li>Действие выполняется только если его родительские узлы прошли.</li>
              <li>Условия должны быть выше действия, а не внутри него.</li>
            </ul>
          </div>

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

          <div className="space-y-3">
            {rootNodes.length === 0 && (
              <p className="text-sm text-slate-500">
                Узлов пока нет. Добавь триггер, условие или действие.
              </p>
            )}

            {rootNodes.map((node) => renderNode(node, 0))}
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

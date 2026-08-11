import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';
import { rollExpression } from '../utils/dice.js';
import { uid } from '../utils/id.js';

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

function CastSpellModal() {
  const activeModal = useAppStore((state) => state.activeModal);
  const closeModal = useAppStore((state) => state.closeModal);
  const spells = useAppStore((state) => state.spells);
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const statusTemplates = useAppStore((state) => state.statusTemplates);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );
  const payloadSpellId = useAppStore((state) => state.modalPayload.spellId || '');

  const allCharacters = [...players, ...npcs];

  const [spellId, setSpellId] = useState(payloadSpellId || spells[0]?.id || '');
  const [effectType, setEffectType] = useState('damage');
  const [formula, setFormula] = useState('');
  const [statusTemplateId, setStatusTemplateId] = useState('');
  const [duration, setDuration] = useState('');
  const [targetMode, setTargetMode] = useState('single');
  const [singleTargetId, setSingleTargetId] = useState(
    selectedCharacterId || currentId || allCharacters[0]?.id || ''
  );
  const [groupTarget, setGroupTarget] = useState('all');
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeModal === 'castSpell') {
      setSpellId(payloadSpellId || spells[0]?.id || '');
      setSingleTargetId(
        selectedCharacterId || currentId || allCharacters[0]?.id || ''
      );
      setError('');
    }
  }, [activeModal, payloadSpellId]);

  const spell = spells.find((item) => item.id === spellId);

  useEffect(() => {
    if (!spell) {
      return;
    }

    const logic = spell.logic || {};

    setEffectType(logic.effectType || 'damage');
    setFormula(logic.formula || '');
    setStatusTemplateId(logic.statusTemplateId || '');
    setDuration(logic.statusDuration ?? '');
    setTargetMode(logic.targetMode || 'single');
  }, [spellId]);

  if (activeModal !== 'castSpell') {
    return null;
  }

  const getTargets = () => {
    if (!spell) {
      return [];
    }

    if (targetMode === 'single') {
      return allCharacters.filter((character) => character.id === singleTargetId);
    }

    if (groupTarget === 'players') {
      return players;
    }

    if (groupTarget === 'npcs') {
      return npcs;
    }

    return allCharacters;
  };

  const targets = getTargets();

  const canCast = Boolean(
    spell &&
      targets.length > 0 &&
      (effectType === 'status' ? true : formula.trim())
  );

  const applyNumeric = (character, amount) => {
    if (effectType === 'damage') {
      let remaining = amount;
      let tempHp = toNumber(character.tempHp);

      if (tempHp > 0) {
        const absorbed = Math.min(tempHp, remaining);
        tempHp -= absorbed;
        remaining -= absorbed;
      }

      const hpCurrent = Math.max(
        0,
        toNumber(character.hpCurrent) - remaining
      );

      return {
        ...character,
        tempHp,
        hpCurrent,
      };
    }

    if (effectType === 'healing') {
      const hpMax = toNumber(character.hpMax);
      const hpCurrent = toNumber(character.hpCurrent);
      const nextHp =
        hpMax > 0
          ? Math.min(hpMax, hpCurrent + amount)
          : hpCurrent + amount;

      return {
        ...character,
        hpCurrent: nextHp,
      };
    }

    if (effectType === 'temp') {
      return {
        ...character,
        tempHp: toNumber(character.tempHp) + amount,
      };
    }

    return character;
  };

  const saveEffect = () => {
    if (!spell) {
      return;
    }

    useAppStore.setState((state) => ({
      spells: state.spells.map((item) => {
        if (item.id !== spell.id) {
          return item;
        }

        return {
          ...item,
          logic: {
            ...(item.logic || {}),
            effectType,
            formula,
            statusTemplateId,
            statusDuration: duration,
            targetMode,
          },
        };
      }),
    }));

    useAppStore
      .getState()
      .addLog(`Сохранён эффект заклинания: ${spell.name}`);
  };

  const cast = () => {
    if (!canCast) {
      return;
    }

    setError('');

    const targetIds = new Set(targets.map((character) => character.id));

    if (effectType === 'status') {
      const parsedDuration =
        String(duration).trim() === '' ? null : Number(duration);

      if (
        parsedDuration !== null &&
        (!Number.isFinite(parsedDuration) || parsedDuration <= 0)
      ) {
        setError('Длительность должна быть положительным числом.');
        return;
      }

      const template = statusTemplates.find(
        (item) => item.id === statusTemplateId
      );

      const statusBase = template
        ? {
            name: template.name,
            icon: template.icon || '✨',
            color: template.color || '#a855f7',
            description: template.description || '',
          }
        : {
            name: spell.name,
            icon: spell.icon || '✨',
            color: '#a855f7',
            description: spell.description || '',
          };

      useAppStore.setState((state) => {
        const addStatus = (list) =>
          list.map((character) => {
            if (!targetIds.has(character.id)) {
              return character;
            }

            return {
              ...character,
              statuses: [
                ...(character.statuses || []),
                {
                  id: uid(),
                  ...statusBase,
                  duration: parsedDuration,
                },
              ],
            };
          });

        return {
          players: addStatus(state.players),
          npcs: addStatus(state.npcs),
        };
      });

      useAppStore
        .getState()
        .addLog(
          `Заклинание ${spell.name}: статус наложен на целей: ${targets.length}`
        );

      closeModal();
      return;
    }

    try {
      if (targetMode === 'spread') {
        const results = targets.map((target) => {
          const result = rollExpression(formula);

          return {
            target,
            amount: Math.max(0, toNumber(result.total)),
            result,
          };
        });

        useAppStore.setState((state) => {
          const apply = (list) =>
            list.map((character) => {
              const found = results.find(
                (item) => item.target.id === character.id
              );

              if (!found) {
                return character;
              }

              return applyNumeric(character, found.amount);
            });

          return {
            players: apply(state.players),
            npcs: apply(state.npcs),
          };
        });

        if (results.length > 0) {
          useAppStore.getState().setDice({
            formula,
            lastResult: {
              formula,
              total: results[0].amount,
              details: results.map(
                (item) => `${item.target.name}: ${item.amount}`
              ),
              error: null,
            },
          });
        }

        useAppStore
          .getState()
          .addLog(
            `Заклинание ${spell.name}: разброс, целей: ${targets.length}`
          );
      } else {
        const result = rollExpression(formula);
        const amount = Math.max(0, toNumber(result.total));

        useAppStore.setState((state) => {
          const apply = (list) =>
            list.map((character) => {
              if (!targetIds.has(character.id)) {
                return character;
              }

              return applyNumeric(character, amount);
            });

          return {
            players: apply(state.players),
            npcs: apply(state.npcs),
          };
        });

        useAppStore.getState().setDice({
          formula,
          lastResult: {
            formula,
            total: amount,
            details: result.details,
            error: null,
          },
        });

        useAppStore
          .getState()
          .addLog(
            `Заклинание ${spell.name}: ${amount} на целей: ${targets.length}`
          );
      }

      closeModal();
    } catch (castError) {
      setError(castError.message);
    }
  };

  return (
    <Modal title="🔮 Применить заклинание" onClose={closeModal} wide>
      {spells.length === 0 ? (
        <div className="space-y-3">
          <p className="text-slate-300">
            Заклинаний пока нет. Создайте заклинание через «🔮 Каталог заклинаний».
          </p>

          <div className="flex justify-end">
            <button className="btn" onClick={closeModal}>
              Закрыть
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <label className="block text-sm">
            <span className="label">Заклинание</span>

            <select
              className="input"
              value={spellId}
              onChange={(event) => setSpellId(event.target.value)}
            >
              {spells.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.icon} {item.name}
                </option>
              ))}
            </select>
          </label>

          {spell && (
            <p className="text-sm text-slate-400">
              {spell.level === 0 ? 'Заговор' : `Уровень ${spell.level}`} •{' '}
              {spell.school}
              {spell.range ? ` • Дистанция: ${spell.range}` : ''}
              {spell.castTime ? ` • Время: ${spell.castTime}` : ''}
            </p>
          )}

          <div className="grid gap-2 md:grid-cols-2">
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
                    onChange={(event) =>
                      setStatusTemplateId(event.target.value)
                    }
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
                  <span className="label">
                    Длительность (раунды, пусто = бессрочно)
                  </span>
                  <input
                    className="input"
                    value={duration}
                    onChange={(event) => setDuration(event.target.value)}
                    placeholder="Например: 3"
                  />
                </label>
              </>
            )}
          </div>

          <div className="text-sm font-medium text-slate-300">Режим цели</div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={`btn ${targetMode === 'single' ? 'btn-primary' : ''}`}
              onClick={() => setTargetMode('single')}
            >
              🎯 Одиночная
            </button>

            <button
              type="button"
              className={`btn ${targetMode === 'aoe' ? 'btn-primary' : ''}`}
              onClick={() => setTargetMode('aoe')}
            >
              💥 AoE
            </button>

            <button
              type="button"
              className={`btn ${targetMode === 'spread' ? 'btn-primary' : ''}`}
              onClick={() => setTargetMode('spread')}
            >
              🎲 Разброс
            </button>
          </div>

          {targetMode === 'single' ? (
            <label className="block text-sm">
              <span className="label">Цель</span>

              <select
                className="input"
                value={singleTargetId}
                onChange={(event) => setSingleTargetId(event.target.value)}
              >
                <option value="">Выберите цель</option>

                {allCharacters.map((character) => (
                  <option key={character.id} value={character.id}>
                    {character.name}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block text-sm">
              <span className="label">Группа</span>

              <select
                className="input"
                value={groupTarget}
                onChange={(event) => setGroupTarget(event.target.value)}
              >
                <option value="all">Все персонажи</option>
                <option value="players">Только игроки</option>
                <option value="npcs">Только NPC / Монстры</option>
              </select>
            </label>
          )}

          <p className="text-sm text-slate-400">Целей: {targets.length}</p>

          {error && <p className="text-red-400">Ошибка: {error}</p>}

          <div className="flex flex-wrap justify-end gap-2">
            <button type="button" className="btn" onClick={saveEffect}>
              💾 Сохранить эффект
            </button>

            <button type="button" className="btn" onClick={closeModal}>
              Отмена
            </button>

            <button
              type="button"
              className="btn btn-primary disabled:opacity-50"
              disabled={!canCast}
              onClick={cast}
            >
              🔮 Применить
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

export default function SpellCaster() {
  const openModal = useAppStore((state) => state.openModal);
  const activeModal = useAppStore((state) => state.activeModal);

  return (
    <>
      <button
        className="fixed bottom-4 right-4 z-40 btn btn-primary shadow-lg"
        onClick={() => openModal('castSpell', {})}
      >
        🔮 Заклинание
      </button>

      {activeModal === 'castSpell' && <CastSpellModal />}
    </>
  );
}

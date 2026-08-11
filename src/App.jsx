import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore.js';
import { rollExpression } from './utils/dice.js';
import GlobalModals from './components/Modals.jsx';
import InitiativePanel from './components/InitiativePanel.jsx';
import EditCharacterModal from './components/EditCharacterModal.jsx';

const diceButtons = [
  { label: '🔺 d4', token: 'd4' },
  { label: '🎲 d6', token: 'd6' },
  { label: '💎 d8', token: 'd8' },
  { label: '🔷 d10', token: 'd10' },
  { label: '⬡ d12', token: 'd12' },
  { label: '⚔️ d20', token: 'd20' },
  { label: '💯 d100', token: 'd100' },
];

const modes = [
  { label: '⚔️ Одиночный 1', value: 'single' },
  { label: '💥 AoE 2', value: 'aoe' },
  { label: '🎯 Разброс 3', value: 'spread' },
];

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const applyAmountToCharacter = (character, type, amount) => {
  if (type === 'damage') {
    let remaining = amount;
    let tempHp = toNumber(character.tempHp);

    if (tempHp > 0) {
      const absorbed = Math.min(tempHp, remaining);
      tempHp -= absorbed;
      remaining -= absorbed;
    }

    const hpCurrent = Math.max(0, toNumber(character.hpCurrent) - remaining);

    return {
      ...character,
      tempHp,
      hpCurrent,
    };
  }

  if (type === 'healing') {
    const hpMax = toNumber(character.hpMax);
    const hpCurrent = toNumber(character.hpCurrent);

    const nextHp =
      hpMax > 0 ? Math.min(hpMax, hpCurrent + amount) : hpCurrent + amount;

    return {
      ...character,
      hpCurrent: nextHp,
    };
  }

  if (type === 'temp') {
    return {
      ...character,
      tempHp: toNumber(character.tempHp) + amount,
    };
  }

  return character;
};

const rollQuick = (formulaRaw) => {
  const formula = String(formulaRaw || '').trim();

  if (!formula) {
    return;
  }

  try {
    const result = rollExpression(formula);
    const total = Math.max(0, toNumber(result.total));

    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total,
        details: result.details,
        error: null,
      },
    });

    useAppStore.getState().addLog(`Быстрый бросок ${formula} = ${total}`);
  } catch (error) {
    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total: 0,
        details: [],
        error: error.message,
      },
    });
  }
};

const rollAndApplyToCharacter = (character, diceToken, type) => {
  const formula = `1${diceToken}`;

  try {
    const result = rollExpression(formula);
    const amount = Math.max(0, toNumber(result.total));

    if (amount <= 0) {
      return;
    }

    useAppStore.setState((prev) => {
      const apply = (list) =>
        list.map((item) => {
          if (item.id !== character.id) {
            return item;
          }

          return applyAmountToCharacter(item, type, amount);
        });

      return {
        players: apply(prev.players),
        npcs: apply(prev.npcs),
      };
    });

    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total: amount,
        details: result.details,
        error: null,
      },
    });

    const label =
      type === 'damage'
        ? 'урон'
        : type === 'healing'
          ? 'лечение'
          : 'временные HP';

    useAppStore
      .getState()
      .addLog(`${character.name}: быстрый ${label} ${amount} (${formula})`);
  } catch (error) {
    useAppStore.getState().setDice({
      lastResult: {
        formula,
        total: 0,
        details: [],
        error: error.message,
      },
    });
  }
};

function CharacterCard({ character }) {
  const [quickDie, setQuickDie] = useState('d6');

  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const removeCharacter = useAppStore((state) => state.removeCharacter);
  const removeStatusFromCharacter = useAppStore(
    (state) => state.removeStatusFromCharacter
  );
  const openModal = useAppStore((state) => state.openModal);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );

  const isCurrent = currentId === character.id;
  const isSelected = selectedCharacterId === character.id;

  return (
    <article
      id={character.id}
      onClick={() => selectCharacter(character.id)}
      onDoubleClick={() =>
        openModal('editCharacter', { characterId: character.id })
      }
      className={`card cursor-pointer border-2 transition ${
        isCurrent
          ? 'border-amber-400 bg-amber-950/20'
          : isSelected
            ? 'border-indigo-400 bg-indigo-950/20'
            : 'border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-semibold" style={{ color: character.color }}>
            {character.name}
          </div>

          <div className="text-xs text-slate-400">
            {character.type || '—'}
            {character.level ? ` • Ур. ${character.level}` : ''}
          </div>
        </div>

        <div className="flex gap-1">
          <button
            className="btn px-2 py-1"
            title="Редактировать персонажа"
            onClick={(event) => {
              event.stopPropagation();
              openModal('editCharacter', { characterId: character.id });
            }}
          >
            ✏️
          </button>

          <button
            className="btn px-2 py-1"
            title="Добавить статус"
            onClick={(event) => {
              event.stopPropagation();
              openModal('addStatus', { targetId: character.id });
            }}
          >
            + Статус
          </button>

          <button
            className="btn btn-danger px-2 py-1"
            title="Удалить персонажа"
            onClick={(event) => {
              event.stopPropagation();
              removeCharacter(character.side, character.id);
            }}
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-300 md:grid-cols-4">
        <div>HP: {character.hpCurrent}/{character.hpMax}</div>
        <div>AC: {character.ac}</div>
        <div>Инициатива: {character.initiative}</div>
        <div>Врем. HP: {character.tempHp || 0}</div>
      </div>

      <div
        className="mt-2 flex flex-wrap items-center gap-1"
        onClick={(event) => event.stopPropagation()}
      >
        <span className="text-xs text-slate-500">Быстрый кубик:</span>

        <select
          className="input h-8 w-auto px-2 py-1 text-xs"
          value={quickDie}
          onChange={(event) => setQuickDie(event.target.value)}
        >
          {diceButtons.map((button) => (
            <option key={button.token} value={button.token}>
              {button.label}
            </option>
          ))}
        </select>

        <button
          className="btn px-2 py-1 text-xs"
          title="Бросить кубик и нанести урон"
          onClick={() => rollAndApplyToCharacter(character, quickDie, 'damage')}
        >
          ⚔️ Урон
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Бросить кубик и вылечить"
          onClick={() => rollAndApplyToCharacter(character, quickDie, 'healing')}
        >
          💚 Лечение
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Бросить кубик и дать временные HP"
          onClick={() => rollAndApplyToCharacter(character, quickDie, 'temp')}
        >
          🛡️ Врем. HP
        </button>
      </div>

      {(character.statuses || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(character.statuses || []).map((status) => (
            <span
              key={status.id}
              className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-1 text-xs"
            >
              {status.icon} {status.name}
              {status.duration ? ` • ${status.duration}` : ''}

              <button
                title="Удалить статус"
                onClick={(event) => {
                  event.stopPropagation();
                  removeStatusFromCharacter(character.id, status.id);
                }}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export default function App() {
  const state = useAppStore();

  const currentId = state.initiativeOrder[state.turnIndex ?? -1];
  const allCharacters = [...state.players, ...state.npcs];
  const targetId = state.selectedCharacterId || currentId;
  const targetCharacter = allCharacters.find((item) => item.id === targetId);

  const canApply = Boolean(targetCharacter && state.dice.lastResult?.total > 0);

  useEffect(() => {
    const handler = (event) => {
      const store = useAppStore.getState();

      if (event.code === 'Escape' && store.activeModal) {
        store.closeModal();
        return;
      }

      const target = event.target;
      const isEditable =
        target instanceof HTMLElement &&
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);

      if (
        isEditable ||
        store.activeModal ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      if (event.code === 'Digit1' || event.code === 'Numpad1') {
        store.setDice({ mode: 'single' });
      }

      if (event.code === 'Digit2' || event.code === 'Numpad2') {
        store.setDice({ mode: 'aoe' });
      }

      if (event.code === 'Digit3' || event.code === 'Numpad3') {
        store.setDice({ mode: 'spread' });
      }

      if (event.code === 'KeyD') {
        store.applyLastRollToCharacter('damage');
      }

      if (event.code === 'KeyH') {
        store.applyLastRollToCharacter('healing');
      }

      if (event.code === 'KeyT') {
        store.applyLastRollToCharacter('temp');
      }
    };

    window.addEventListener('keydown', handler);

    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="card">
          <p className="text-xs uppercase tracking-wide text-slate-400">
            D&D Encounter Builder
          </p>

          <h1 className="text-2xl font-bold">⚔️ D&D Encounter</h1>

          <p className="mt-1 text-sm text-slate-400">
            Управление боем находится в панели «Инициатива». Выберите персонажа,
            бросайте кубики и применяйте эффекты.
          </p>
        </header>

        <InitiativePanel />

        <section className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">🛡️ Игроки {state.players.length}</h2>

            <button
              className="btn btn-primary"
              onClick={() => state.openModal('addCharacter', { side: 'player' })}
            >
              + Добавить игрока
            </button>
          </div>

          <div className="space-y-2">
            {state.players.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}

            {state.players.length === 0 && (
              <p className="text-sm text-slate-500">Пока нет игроков.</p>
            )}
          </div>
        </section>

        <section className="card space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">👹 NPC / Монстры {state.npcs.length}</h2>

            <button
              className="btn btn-primary"
              onClick={() => state.openModal('addCharacter', { side: 'npc' })}
            >
              + Добавить NPC
            </button>
          </div>

          <div className="space-y-2">
            {state.npcs.map((character) => (
              <CharacterCard key={character.id} character={character} />
            ))}

            {state.npcs.length === 0 && (
              <p className="text-sm text-slate-500">Пока нет NPC.</p>
            )}
          </div>
        </section>

        <section className="card space-y-3">
          <h2 className="text-lg font-semibold">🎲 Кубики</h2>

          <div className="flex flex-wrap gap-2">
            {diceButtons.map((button) => (
              <button
                key={button.token}
                className="btn"
                onClick={() => state.appendFormula(button.token)}
              >
                {button.label}
              </button>
            ))}

            <button className="btn" onClick={() => state.appendFormula('+')}>
              +
            </button>

            <button className="btn" onClick={() => state.appendFormula('-')}>
              —
            </button>
          </div>

          <p className="text-sm text-slate-400">Бросьте кубик</p>

          <div className="flex flex-wrap items-center gap-2">
            {modes.map((mode) => (
              <button
                key={mode.value}
                className={`btn ${
                  state.dice.mode === mode.value ? 'btn-primary' : ''
                }`}
                title={`Горячая клавиша: ${
                  mode.value === 'single' ? '1' : mode.value === 'aoe' ? '2' : '3'
                }`}
                onClick={() => state.setDice({ mode: mode.value })}
              >
                {mode.label}
              </button>
            ))}

            <button
              className="btn btn-danger"
              onClick={() =>
                state.setDice({ formula: '', lastResult: null, mode: 'single' })
              }
            >
              ✕ Сбросить ?
            </button>
          </div>

          <details className="card bg-slate-950">
            <summary className="cursor-pointer font-medium">📜 Синтаксис бросков</summary>

            <div className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <div>
                <code>2d6</code> — 2 кубика d6
              </div>

              <div>
                <code>1d20+5</code> — d20 с модификатором
              </div>

              <div>
                <code>4d6kh3</code> — бросить 4d6, лучшие 3
              </div>

              <div>
                <code>2d20kl1</code> — бросить 2d20, худший
              </div>

              <div>
                <code>2d6+1d4+3</code> — смесь костей
              </div>

              <div>
                <code>8</code> — просто число
              </div>
            </div>

            <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-3">
              <div>
                Операторы: <code>+</code> сложение, <code>-</code> вычитание
              </div>

              <div>
                Keep: <code>kh</code> — лучшие, <code>kl</code> — худшие
              </div>

              <div>
                Порядок: <code>NdM[kh|kl]K</code>
              </div>
            </div>
          </details>

          <div className="grid gap-2 md:grid-cols-[2fr_auto]">
            <input
              className="input"
              value={state.dice.formula}
              onChange={(event) =>
                state.setDice({ formula: event.target.value })
              }
              placeholder="Например: 2d6+1d4+3"
            />

            <button
              className="btn btn-primary"
              onClick={() => state.rollFormula()}
            >
              🎲 Бросить
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">
              💾Персонаж{targetCharacter ? targetCharacter.name : '0'}
            </span>

            <button
              className="btn disabled:opacity-50"
              disabled={!canApply}
              title="Горячая клавиша: D"
              onClick={() => state.applyLastRollToCharacter('damage')}
            >
              ⚔️ УронD
            </button>

            <button
              className="btn disabled:opacity-50"
              disabled={!canApply}
              title="Горячая клавиша: H"
              onClick={() => state.applyLastRollToCharacter('healing')}
            >
              💚 ЛечениеH
            </button>

            <button
              className="btn disabled:opacity-50"
              disabled={!canApply}
              title="Горячая клавиша: T"
              onClick={() => state.applyLastRollToCharacter('temp')}
            >
              🛡️ Временные HPT
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">Быстрые броски:</span>

            {state.quickRolls.length === 0 && (
              <span className="text-sm text-slate-500">нет</span>
            )}

            {state.quickRolls.map((quickRoll) => (
              <div
                key={quickRoll.id}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-sm"
              >
                <button onClick={() => rollQuick(quickRoll.formula)}>
                  {quickRoll.name}: {quickRoll.formula}
                </button>

                <button
                  className="text-slate-400 hover:text-red-400"
                  title="Удалить быстрый бросок"
                  onClick={() => state.removeQuickRoll(quickRoll.id)}
                >
                  ✕
                </button>
              </div>
            ))}

            <button
              className="btn"
              onClick={() => state.openModal('addQuickRoll')}
            >
              Добавить быстрый бросок
            </button>
          </div>

          {state.dice.lastResult && (
            <div className="card bg-slate-950">
              {state.dice.lastResult.error ? (
                <p className="text-red-400">
                  Ошибка: {state.dice.lastResult.error}
                </p>
              ) : (
                <>
                  <p className="text-lg font-bold">
                    {state.dice.lastResult.formula} ={' '}
                    {state.dice.lastResult.total}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {state.dice.lastResult.details.join(' | ')}
                  </p>
                </>
              )}
            </div>
          )}
        </section>

        <section className="card flex flex-wrap gap-2">
          <button className="btn" onClick={() => state.openModal('addStatus')}>
            Добавить статус
          </button>

          <button className="btn" onClick={() => state.openModal('statusCatalog')}>
            ✨ Каталог статусов
          </button>

          <button className="btn" onClick={() => state.openModal('spellCatalog')}>
            🔮 Каталог заклинаний
          </button>
        </section>

        <section className="card space-y-2">
          <h2 className="text-lg font-semibold">Логи</h2>

          <div className="max-h-48 space-y-1 overflow-auto text-sm">
            {state.logs.length === 0 && (
              <p className="text-slate-500">Пока пусто.</p>
            )}

            {state.logs.map((log) => (
              <div key={log.id} className="text-slate-300">
                <span className="mr-2 text-slate-500">{log.time}</span>
                {log.text}
              </div>
            ))}
          </div>
        </section>

        <GlobalModals />
        <EditCharacterModal />
      </div>
    </main>
  );
}

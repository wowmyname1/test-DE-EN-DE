import { useEffect, useState } from 'react';
import { useAppStore } from './store/useAppStore.js';
import { rollExpression } from './utils/dice.js';
import GlobalModals from './components/Modals.jsx';
import EditCharacterModal from './components/EditCharacterModal.jsx';
import PresetsModal from './components/PresetsModal.jsx';
import MapBoard from './components/MapBoard.jsx';

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
  if (!character) {
    return;
  }

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

function TopBar() {
  const state = useAppStore();

  const currentId = state.initiativeOrder[state.turnIndex ?? -1];
  const allCharacters = [...state.players, ...state.npcs];
  const currentCharacter = allCharacters.find((character) => character.id === currentId);

  return (
    <header className="flex h-12 items-center justify-between gap-2 border-b border-slate-800 bg-slate-950 px-2">
      <div className="flex min-w-0 items-center gap-2">
        <span className="hidden text-[10px] uppercase tracking-wide text-slate-500 xl:inline">
          D&D Encounter Builder
        </span>

        <span className="text-sm font-bold">⚔️ D&D Encounter</span>

        <span className="truncate text-xs text-slate-400">
          Ход: {currentCharacter ? currentCharacter.name : '—'} • Раунд {state.round}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          className="btn px-2 py-1 text-xs"
          title="Начать бой"
          onClick={state.startCombat}
        >
          ⚔️
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Следующий ход"
          onClick={state.nextTurn}
        >
          ▶
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Сброс боя"
          onClick={state.resetCombat}
        >
          🔄
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Каталог статусов"
          onClick={() => state.openModal('statusCatalog')}
        >
          ✨
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Каталог заклинаний"
          onClick={() => state.openModal('spellCatalog')}
        >
          🔮
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Пресеты"
          onClick={() => state.openModal('presets')}
        >
          📦
        </button>
      </div>
    </header>
  );
}

function CharacterCompact({ character }) {
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const removeCharacter = useAppStore((state) => state.removeCharacter);
  const openModal = useAppStore((state) => state.openModal);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );

  const isCurrent = currentId === character.id;
  const isSelected = selectedCharacterId === character.id;

  return (
    <article
      onClick={() => selectCharacter(character.id)}
      onDoubleClick={() => openModal('editCharacter', { characterId: character.id })}
      className={`card cursor-pointer border-2 p-2 ${
        isCurrent
          ? 'border-amber-400 bg-amber-950/20'
          : isSelected
            ? 'border-indigo-400 bg-indigo-950/20'
            : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between gap-1">
        <div className="truncate text-sm font-medium" style={{ color: character.color }}>
          {character.name}
        </div>

        <div className="text-[10px] text-slate-500">
          Иниц. {character.initiative || 0}
        </div>
      </div>

      <div className="mt-1 text-xs text-slate-400">
        HP {character.hpCurrent}/{character.hpMax} • AC {character.ac}
        {(character.statuses || []).length > 0
          ? ` • ✨${character.statuses.length}`
          : ''}
      </div>

      <div className="mt-1 flex gap-1" onClick={(event) => event.stopPropagation()}>
        <button
          className="btn px-2 py-0.5 text-[10px]"
          title="Редактировать персонажа"
          onClick={() => openModal('editCharacter', { characterId: character.id })}
        >
          ✏️
        </button>

        <button
          className="btn px-2 py-0.5 text-[10px]"
          title="Добавить статус"
          onClick={() => openModal('addStatus', { targetId: character.id })}
        >
          ✨
        </button>

        <button
          className="btn btn-danger px-2 py-0.5 text-[10px]"
          title="Удалить персонажа"
          onClick={() => removeCharacter(character.side, character.id)}
        >
          ✕
        </button>
      </div>
    </article>
  );
}

function SidebarCharacters() {
  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const openModal = useAppStore((state) => state.openModal);

  const [tab, setTab] = useState('player');

  const list = tab === 'player' ? players : npcs;

  return (
    <aside className="flex w-56 min-h-0 flex-col gap-2 md:w-64">
      <div className="flex gap-1">
        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'player' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('player')}
        >
          🛡️ Игроки {players.length}
        </button>

        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'npc' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('npc')}
        >
          👹 NPC {npcs.length}
        </button>
      </div>

      <button
        className="btn btn-primary px-2 py-1 text-xs"
        onClick={() => openModal('addCharacter', { side: tab })}
      >
        + Добавить {tab === 'player' ? 'игрока' : 'NPC'}
      </button>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        {list.map((character) => (
          <CharacterCompact key={character.id} character={character} />
        ))}

        {list.length === 0 && (
          <p className="text-xs text-slate-500">Пока пусто.</p>
        )}
      </div>
    </aside>
  );
}

function InitiativeTab() {
  const state = useAppStore();

  const allCharacters = [...state.players, ...state.npcs];
  const byId = new Map(allCharacters.map((character) => [character.id, character]));

  const activeOrder = state.initiativeOrder.filter((id) => byId.has(id));

  const previewOrder = [...allCharacters]
    .sort((a, b) => Number(b.initiative || 0) - Number(a.initiative || 0))
    .map((character) => character.id);

  const visibleOrder = activeOrder.length
    ? [
        ...activeOrder,
        ...allCharacters
          .filter((character) => !activeOrder.includes(character.id))
          .map((character) => character.id),
      ]
    : previewOrder;

  return (
    <div className="card flex h-full flex-col gap-2 overflow-hidden">
      <div className="flex flex-wrap gap-1">
        <button
          className="btn btn-primary px-2 py-1 text-xs"
          onClick={state.startCombat}
        >
          ⚔️ Начать
        </button>

        <button className="btn px-2 py-1 text-xs" onClick={state.nextTurn}>
          ▶ Ход
        </button>

        <button className="btn px-2 py-1 text-xs" onClick={state.resetCombat}>
          🔄 Сброс
        </button>

        <button
          className="btn px-2 py-1 text-xs"
          title="Пересчитать инициативу"
          onClick={() => state.refreshInitiative?.()}
        >
          🔁
        </button>
      </div>

      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto">
        {visibleOrder.map((id, index) => {
          const character = byId.get(id);

          if (!character) {
            return null;
          }

          const isCurrent =
            activeOrder.length > 0 &&
            index < activeOrder.length &&
            state.turnIndex === index;

          return (
            <button
              key={id}
              onClick={() => state.selectCharacter(id)}
              className={`w-full rounded-lg border px-2 py-1 text-left text-xs ${
                isCurrent
                  ? 'border-amber-400 bg-amber-950/20'
                  : state.selectedCharacterId === id
                    ? 'border-indigo-400 bg-indigo-950/20'
                    : 'border-slate-800 bg-slate-900'
              }`}
            >
              <span className="text-slate-500">{index + 1}.</span> {character.name}{' '}
              <span className="text-slate-500">
                • {character.initiative || 0} • HP {character.hpCurrent}/
                {character.hpMax}
              </span>
            </button>
          );
        })}

        {visibleOrder.length === 0 && (
          <p className="text-xs text-slate-500">Добавьте персонажей.</p>
        )}
      </div>
    </div>
  );
}

function DiceTab() {
  const state = useAppStore();

  const [quickDie, setQuickDie] = useState('d6');

  const allCharacters = [...state.players, ...state.npcs];
  const targetId =
    state.selectedCharacterId || state.initiativeOrder[state.turnIndex ?? -1];
  const targetCharacter = allCharacters.find((character) => character.id === targetId);

  const canApply = Boolean(targetCharacter && state.dice.lastResult?.total > 0);

  return (
    <div className="card flex h-full flex-col gap-2 overflow-hidden">
      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
        <div className="text-xs text-slate-400">
          💾Персонаж{targetCharacter ? targetCharacter.name : '0'}
        </div>

        <div className="flex flex-wrap items-center gap-1">
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
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter}
            onClick={() =>
              targetCharacter && rollAndApplyToCharacter(targetCharacter, quickDie, 'damage')
            }
          >
            ⚔️ Урон
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter}
            onClick={() =>
              targetCharacter && rollAndApplyToCharacter(targetCharacter, quickDie, 'healing')
            }
          >
            💚 Лечение
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter}
            onClick={() =>
              targetCharacter && rollAndApplyToCharacter(targetCharacter, quickDie, 'temp')
            }
          >
            🛡️ Врем. HP
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {diceButtons.map((button) => (
            <button
              key={button.token}
              className="btn px-1 py-1 text-[10px]"
              onClick={() => state.appendFormula(button.token)}
            >
              {button.label}
            </button>
          ))}

          <button
            className="btn px-1 py-1 text-[10px]"
            onClick={() => state.appendFormula('+')}
          >
            +
          </button>

          <button
            className="btn px-1 py-1 text-[10px]"
            onClick={() => state.appendFormula('-')}
          >
            -
          </button>
        </div>

        <div className="flex flex-wrap gap-1">
          {modes.map((mode) => (
            <button
              key={mode.value}
              className={`btn px-2 py-1 text-[10px] ${
                state.dice.mode === mode.value ? 'btn-primary' : ''
              }`}
              onClick={() => state.setDice({ mode: mode.value })}
            >
              {mode.label}
            </button>
          ))}

          <button
            className="btn btn-danger px-2 py-1 text-[10px]"
            onClick={() =>
              state.setDice({ formula: '', lastResult: null, mode: 'single' })
            }
          >
            ✕ Сбросить ?
          </button>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-1">
          <input
            className="input h-8 px-2 py-1 text-xs"
            value={state.dice.formula}
            onChange={(event) => state.setDice({ formula: event.target.value })}
            placeholder="Например: 2d6+3"
          />

          <button
            className="btn btn-primary px-2 py-1 text-xs"
            onClick={() => state.rollFormula()}
          >
            🎲 Бросить
          </button>
        </div>

        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-1">
            <span className="text-xs text-slate-500">Быстрые броски:</span>

            <button
              className="btn px-2 py-1 text-[10px]"
              onClick={() => state.openModal('addQuickRoll')}
            >
              + Добавить
            </button>
          </div>

          <div className="flex flex-wrap gap-1">
            {state.quickRolls.map((quickRoll) => (
              <div
                key={quickRoll.id}
                className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-1 py-0.5 text-[10px]"
              >
                <button onClick={() => rollQuick(quickRoll.formula)}>
                  {quickRoll.name}: {quickRoll.formula}
                </button>

                <button
                  className="text-slate-500 hover:text-red-400"
                  title="Удалить быстрый бросок"
                  onClick={() => state.removeQuickRoll(quickRoll.id)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {state.dice.lastResult && (
          <div className="rounded-lg border border-slate-800 bg-slate-950 p-2 text-xs">
            {state.dice.lastResult.error ? (
              <span className="text-red-400">{state.dice.lastResult.error}</span>
            ) : (
              <>
                <div className="font-bold">
                  {state.dice.lastResult.formula} = {state.dice.lastResult.total}
                </div>

                <div className="text-slate-500">
                  {state.dice.lastResult.details.join(' | ')}
                </div>
              </>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!canApply}
            title="Горячая клавиша: D"
            onClick={() => state.applyLastRollToCharacter('damage')}
          >
            ⚔️ УронD
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!canApply}
            title="Горячая клавиша: H"
            onClick={() => state.applyLastRollToCharacter('healing')}
          >
            💚 ЛечениеH
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!canApply}
            title="Горячая клавиша: T"
            onClick={() => state.applyLastRollToCharacter('temp')}
          >
            🛡️ Временные HPT
          </button>
        </div>
      </div>
    </div>
  );
}

function LogsTab() {
  const logs = useAppStore((state) => state.logs);

  return (
    <div className="card h-full space-y-1 overflow-y-auto text-xs">
      {logs.length === 0 && <p className="text-slate-500">Пока пусто.</p>}

      {logs.map((log) => (
        <div key={log.id} className="text-slate-300">
          <span className="mr-2 text-slate-500">{log.time}</span>
          {log.text}
        </div>
      ))}
    </div>
  );
}

function RightPanel() {
  const [tab, setTab] = useState('dice');

  return (
    <aside className="flex w-72 min-h-0 flex-col gap-2 xl:w-80">
      <div className="flex gap-1">
        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'initiative' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('initiative')}
        >
          Инициатива
        </button>

        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'dice' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('dice')}
        >
          Кубики
        </button>

        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'logs' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('logs')}
        >
          Логи
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'initiative' && <InitiativeTab />}
        {tab === 'dice' && <DiceTab />}
        {tab === 'logs' && <LogsTab />}
      </div>
    </aside>
  );
}

export default function App() {
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
    <main className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopBar />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <SidebarCharacters />
        <MapBoard />
        <RightPanel />
      </div>

      <GlobalModals />
      <EditCharacterModal />
      <PresetsModal />
    </main>
  );
}

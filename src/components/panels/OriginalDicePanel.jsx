import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { useActiveRollStore } from '../../store/activeRollStore.js';
import {
  getSelectedSum,
  validateExpression,
} from '../../utils/originalDice.js';
import { applyAmountToCharacterStore } from '../../utils/diceActions.js';

const DICE_BUTTONS = [
  { sides: 4, icon: '🔺', label: 'd4' },
  { sides: 6, icon: '🎲', label: 'd6' },
  { sides: 8, icon: '💎', label: 'd8' },
  { sides: 10, icon: '🔷', label: 'd10' },
  { sides: 12, icon: '⬡', label: 'd12' },
  { sides: 20, icon: '⚔️', label: 'd20' },
  { sides: 100, icon: '💯', label: 'd100' },
];

const EXAMPLES = [
  '1d20+5',
  '2d6+3',
  '4d6kh3',
  '2d20kl1+2',
  '1d8+1d6',
  '8d6kh5',
];

export default function OriginalDicePanel() {
  const activeRoll = useActiveRollStore((state) => state.activeRoll);
  const diceHistory = useActiveRollStore((state) => state.diceHistory);
  const savedRolls = useActiveRollStore((state) => state.savedRolls);

  const rollDice = useActiveRollStore((state) => state.rollDice);
  const rollInput = useActiveRollStore((state) => state.rollInput);
  const rollQuickFormula = useActiveRollStore((state) => state.rollQuickFormula);
  const toggleDie = useActiveRollStore((state) => state.toggleDie);
  const clearSelection = useActiveRollStore((state) => state.clearSelection);
  const clearActiveRoll = useActiveRollStore((state) => state.clearActiveRoll);
  const setRollMode = useActiveRollStore((state) => state.setRollMode);
  const saveCurrentExpression = useActiveRollStore(
    (state) => state.saveCurrentExpression
  );
  const deleteSavedRoll = useActiveRollStore((state) => state.deleteSavedRoll);

  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const logs = useAppStore((state) => state.logs);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );

  const [modifier, setModifier] = useState('0');
  const [expression, setExpression] = useState('');
  const [error, setError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);

  const allCharacters = [...players, ...npcs];
  const targetId = selectedCharacterId || currentId || '';
  const targetCharacter = allCharacters.find((character) => character.id === targetId);

  const selectedSum = activeRoll ? getSelectedSum(activeRoll) : 0;

  const liveValidation = expression.trim()
    ? validateExpression(expression)
    : { valid: true, error: null };

  const handleRollClick = () => {
    const result = rollInput(expression);

    if (!result.valid) {
      setError(result.error || 'Неверная формула');
    } else {
      setError('');
    }
  };

  const handleSaveExpression = () => {
    const result = saveCurrentExpression(expression.trim());

    if (!result.valid) {
      setError(result.error || 'Нельзя сохранить формулу');
    } else {
      setError('');
    }
  };

  const applySelected = (type) => {
    if (!targetCharacter || selectedSum <= 0) {
      return;
    }

    applyAmountToCharacterStore(targetCharacter.id, type, selectedSum);
    clearSelection();

    const label =
      type === 'damage'
        ? 'урон'
        : type === 'healing'
          ? 'лечение'
          : 'временные HP';

    useAppStore
      .getState()
      .addLog(`${targetCharacter.name}: ${label} ${selectedSum}`);
  };

  const isSingleD20 =
    activeRoll &&
    activeRoll.dice.length === 1 &&
    activeRoll.dice[0].sides === 20;

  const nat20 = Boolean(isSingleD20 && activeRoll.dice[0].value === 20);
  const nat1 = Boolean(isSingleD20 && activeRoll.dice[0].value === 1);

  return (
    <footer className="max-h-64 overflow-y-auto border-t border-slate-800 bg-slate-950 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          {DICE_BUTTONS.map((button) => (
            <button
              key={button.sides}
              className="btn flex h-12 w-12 flex-col items-center justify-center px-1 py-1 text-xs"
              title={`Бросить 1${button.label} с модификатором`}
              onClick={() => rollDice(button.sides, modifier)}
            >
              <span>{button.icon}</span>
              <span className="text-[10px] text-slate-400">{button.label}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 text-xs text-slate-400">
          <span>+</span>

          <input
            type="number"
            className="input h-8 w-14 px-2 py-1 text-center text-xs"
            value={modifier}
            min="-20"
            max="20"
            onChange={(event) => setModifier(event.target.value)}
            title="Модификатор для быстрых кнопок кубиков"
          />
        </div>

        <div className="flex min-w-44 flex-1 flex-col items-center gap-1">
          <button
            className={`px-3 text-2xl font-bold ${
              nat20
                ? 'text-emerald-400'
                : nat1
                  ? 'text-red-500'
                  : 'text-amber-300'
            }`}
            title="Клик сбрасывает выбор кубиков"
            onClick={clearSelection}
          >
            {activeRoll ? selectedSum : '—'}
          </button>

          <div className="text-[10px] text-slate-500">
            {activeRoll ? activeRoll.expression : 'Бросьте кубик'}
          </div>

          <div className="flex flex-wrap justify-center gap-1">
            {activeRoll &&
              activeRoll.dice.map((die) => (
                <button
                  key={die.id}
                  className={`h-7 w-7 rounded border text-xs font-bold transition ${
                    die.selected && !die.spent
                      ? 'border-amber-400 bg-amber-500/20 text-amber-300'
                      : 'border-slate-600 bg-slate-900 text-slate-400'
                  } ${die.spent ? 'pointer-events-none line-through opacity-20' : ''} ${
                    die.dropped && !die.selected ? 'border-dashed opacity-30' : ''
                  }`}
                  title={`d${die.sides}: ${die.value}${die.sign === '-' ? ' (вычитается)' : ''}`}
                  onClick={() => toggleDie(die.id)}
                >
                  {die.value}
                </button>
              ))}
          </div>

          {activeRoll && (
            <div className="flex flex-wrap items-center gap-1">
              <button
                className={`btn px-2 py-0.5 text-[10px] ${
                  activeRoll.mode === 'single' ? 'btn-primary' : ''
                }`}
                onClick={() => setRollMode('single')}
              >
                ⚔️ Одиночный 1
              </button>

              <button
                className={`btn px-2 py-0.5 text-[10px] ${
                  activeRoll.mode === 'aoe' ? 'btn-primary' : ''
                }`}
                onClick={() => setRollMode('aoe')}
              >
                💥 AoE 2
              </button>

              <button
                className={`btn px-2 py-0.5 text-[10px] ${
                  activeRoll.mode === 'spread' ? 'btn-primary' : ''
                }`}
                onClick={() => setRollMode('spread')}
              >
                🎯 Разброс 3
              </button>

              <button
                className="btn btn-danger px-2 py-0.5 text-[10px]"
                onClick={clearActiveRoll}
              >
                ✕ Сбросить
              </button>
            </div>
          )}
        </div>

        <div className="flex max-w-40 items-center gap-1 overflow-x-auto">
          {diceHistory.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="shrink-0 rounded bg-slate-900 px-2 py-0.5 text-[10px] text-slate-500"
            >
              {item}
            </span>
          ))}
        </div>

        <button
          className="btn px-2 py-1 text-xs"
          title="Логи"
          onClick={() => setLogsOpen(true)}
        >
          📜
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <input
            className={`input h-8 px-2 py-1 text-xs ${
              expression.trim()
                ? liveValidation.valid
                  ? 'border-emerald-600'
                  : 'border-red-600'
                : ''
            }`}
            value={expression}
            placeholder="Например: 2d6+5, 4d6kh3, 2d20kl1+3"
            onChange={(event) => {
              setExpression(event.target.value);
              setError('');
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                handleRollClick();
              }
            }}
          />

          <button
            className="absolute right-1 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border border-slate-700 bg-slate-900 text-[10px] text-slate-400"
            title="Справка по синтаксису"
            onClick={() => setHelpOpen((prev) => !prev)}
          >
            ?
          </button>

          {helpOpen && (
            <div className="card absolute bottom-full left-0 z-50 mb-2 w-full max-w-md space-y-2">
              <div className="text-sm font-semibold text-amber-300">
                📜 Синтаксис бросков
              </div>

              <div className="grid gap-1 md:grid-cols-2">
                <div className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <code className="text-amber-300">2d6</code>
                  <div className="text-slate-400">2 кубика d6</div>
                </div>

                <div className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <code className="text-amber-300">1d20+5</code>
                  <div className="text-slate-400">d20 с модификатором</div>
                </div>

                <div className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <code className="text-amber-300">4d6kh3</code>
                  <div className="text-slate-400">бросить 4d6, лучшие 3</div>
                </div>

                <div className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <code className="text-amber-300">2d20kl1</code>
                  <div className="text-slate-400">бросить 2d20, худший</div>
                </div>

                <div className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <code className="text-amber-300">2d6+1d4+3</code>
                  <div className="text-slate-400">смесь костей</div>
                </div>

                <div className="rounded border border-slate-800 bg-slate-900 p-2 text-xs">
                  <code className="text-amber-300">8</code>
                  <div className="text-slate-400">просто число</div>
                </div>
              </div>

              <div className="text-xs text-slate-400">
                Операторы: <code>+</code> сложение, <code>-</code> вычитание.
                Keep: <code>kh</code> — лучшие, <code>kl</code> — худшие. Порядок:{' '}
                <code>NdM[kh|kl]K</code>.
              </div>

              <div className="flex flex-wrap gap-1">
                {EXAMPLES.map((example) => (
                  <button
                    key={example}
                    className="rounded border border-amber-700 bg-amber-950/20 px-2 py-0.5 text-[10px] text-amber-300"
                    onClick={() => {
                      setExpression(example);
                      setError('');
                      setHelpOpen(false);
                    }}
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <button className="btn btn-primary px-3 py-1 text-xs" onClick={handleRollClick}>
          🎲 Бросить
        </button>

        <button
          className="btn px-3 py-1 text-xs"
          title="Сохранить формулу"
          onClick={handleSaveExpression}
        >
          💾
        </button>

        {error && <span className="text-xs text-red-400">{error}</span>}
        {!error && expression.trim() && !liveValidation.valid && (
          <span className="text-xs text-red-400">{liveValidation.error}</span>
        )}
      </div>

      {savedRolls.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {savedRolls.map((roll) => (
            <span
              key={roll.id}
              className="inline-flex items-center gap-1 rounded border border-amber-700 bg-amber-950/20 px-2 py-0.5 text-[10px] text-amber-300"
            >
              <button onClick={() => rollQuickFormula(roll.formula)}>
                {roll.formula}
              </button>

              <button
                className="text-slate-500 hover:text-red-400"
                title="Удалить сохранённую формулу"
                onClick={() => deleteSavedRoll(roll.id)}
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}

      {activeRoll && activeRoll.mode === 'single' && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">💾Персонаж</span>

          <select
            className="input h-8 w-auto max-w-44 px-2 py-1 text-xs"
            value={targetId}
            onChange={(event) => {
              useAppStore.setState({
                selectedCharacterId: event.target.value || null,
              });
            }}
          >
            <option value="">не выбран</option>

            {allCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter || selectedSum <= 0}
            title="Применить выбранные кубики как урон (D)"
            onClick={() => applySelected('damage')}
          >
            ⚔️ УронD
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter || selectedSum <= 0}
            title="Применить выбранные кубики как лечение (H)"
            onClick={() => applySelected('healing')}
          >
            💚 ЛечениеH
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter || selectedSum <= 0}
            title="Применить выбранные кубики как временные HP (T)"
            onClick={() => applySelected('temp')}
          >
            🛡️ Временные HPT
          </button>
        </div>
      )}

      {activeRoll && activeRoll.mode === 'aoe' && (
        <div className="mt-2 text-xs text-slate-500">
          💥 AoE: выбор целей кликами по карточкам будет добавлен в следующем шаге.
        </div>
      )}

      {activeRoll && activeRoll.mode === 'spread' && (
        <div className="mt-2 text-xs text-slate-500">
          🎯 Разброс: раздача выбранных кубиков по карточкам будет добавлена в следующем шаге.
        </div>
      )}

      {logsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setLogsOpen(false)}
        >
          <div
            className="card max-h-[70vh] w-full max-w-lg overflow-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between gap-2">
              <h3 className="text-lg font-semibold">Логи</h3>

              <button className="btn px-2 py-1" onClick={() => setLogsOpen(false)}>
                ✕
              </button>
            </div>

            <div className="space-y-1 text-xs">
              {logs.length === 0 && <p className="text-slate-500">Пока пусто.</p>}

              {logs.map((log) => (
                <div key={log.id} className="text-slate-300">
                  <span className="mr-2 text-slate-500">{log.time}</span>
                  {log.text}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </footer>
  );
}

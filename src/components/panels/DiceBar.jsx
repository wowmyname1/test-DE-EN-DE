import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { diceButtons, modes } from '../../constants/dice.js';
import {
  rollManual,
  rollQuick,
  rollAndApplyToCharacter,
} from '../../utils/diceActions.js';
import { applyLastDiceByMode } from '../../utils/applyFlow.js';

export default function DiceBar() {
  const state = useAppStore();

  const [quickDie, setQuickDie] = useState('d6');
  const [quickRollId, setQuickRollId] = useState('');
  const [logsOpen, setLogsOpen] = useState(false);

  const allCharacters = [...state.players, ...state.npcs];

  const targetId =
    state.selectedCharacterId || state.initiativeOrder[state.turnIndex ?? -1] || '';

  const targetCharacter = allCharacters.find((character) => character.id === targetId);

  const setTarget = (id) => {
    useAppStore.setState({
      selectedCharacterId: id || null,
    });
  };

  const handleQuickRollChange = (event) => {
    const id = event.target.value;

    setQuickRollId('');

    const quickRoll = state.quickRolls.find((item) => item.id === id);

    if (quickRoll) {
      rollQuick(quickRoll);
    }
  };

  const mode = state.dice.mode || 'single';

  const sideLabel =
    targetCharacter?.side === 'player'
      ? 'игрокам'
      : targetCharacter?.side === 'npc'
        ? 'NPC'
        : 'персонажам';

  const modeHint =
    mode === 'single'
      ? 'Применяется к выбранной цели.'
      : mode === 'aoe'
        ? `Применяется ко всем ${sideLabel} одной стороной.`
        : `Отдельный бросок по каждому из ${sideLabel} той же стороны.`;

  const canApplyLast = Boolean(
    state.dice.lastResult &&
      !state.dice.lastResult.error &&
      state.dice.lastResult.formula
  );

  return (
    <footer className="border-t border-slate-800 bg-slate-950 p-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <span className="text-xs text-slate-400">💾Персонаж</span>

          <select
            className="input h-8 w-auto max-w-44 px-2 py-1 text-xs"
            value={targetId}
            onChange={(event) => setTarget(event.target.value)}
            title="Выбрать цель"
          >
            <option value="">не выбран</option>

            {allCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <select
            className="input h-8 w-auto px-2 py-1 text-xs"
            value={quickDie}
            onChange={(event) => setQuickDie(event.target.value)}
            title="Быстрый кубик для выбранного персонажа"
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
            title="Бросить кубик и нанести урон выбранной цели"
            onClick={() =>
              targetCharacter && rollAndApplyToCharacter(targetCharacter, quickDie, 'damage')
            }
          >
            ⚔️
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter}
            title="Бросить кубик и вылечить выбранную цель"
            onClick={() =>
              targetCharacter && rollAndApplyToCharacter(targetCharacter, quickDie, 'healing')
            }
          >
            💚
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!targetCharacter}
            title="Бросить кубик и дать временные HP выбранной цели"
            onClick={() =>
              targetCharacter && rollAndApplyToCharacter(targetCharacter, quickDie, 'temp')
            }
          >
            🛡️
          </button>
        </div>

        <div className="flex items-center gap-1">
          {diceButtons.map((button) => (
            <button
              key={button.token}
              className="btn px-2 py-1 text-[10px]"
              title={button.label}
              onClick={() => state.appendFormula(button.token)}
            >
              {button.token}
            </button>
          ))}

          <button
            className="btn px-2 py-1 text-[10px]"
            onClick={() => state.appendFormula('+')}
          >
            +
          </button>

          <button
            className="btn px-2 py-1 text-[10px]"
            onClick={() => state.appendFormula('-')}
          >
            -
          </button>
        </div>

        <div className="flex items-center gap-1">
          <input
            className="input h-8 w-40 px-2 py-1 text-xs"
            value={state.dice.formula}
            onChange={(event) => state.setDice({ formula: event.target.value })}
            placeholder="Например: 2d6+3"
          />

          <button
            className="btn btn-primary px-2 py-1 text-xs"
            onClick={() => rollManual(state.dice.formula)}
          >
            🎲 Бросить
          </button>
        </div>

        <div className="flex flex-col gap-0">
          <div className="flex items-center gap-1">
            {modes.map((modeItem) => (
              <button
                key={modeItem.value}
                className={`btn px-2 py-1 text-[10px] ${
                  state.dice.mode === modeItem.value ? 'btn-primary' : ''
                }`}
                title={modeItem.label}
                onClick={() => state.setDice({ mode: modeItem.value })}
              >
                {modeItem.value === 'single' ? '1' : modeItem.value === 'aoe' ? '2' : '3'}
              </button>
            ))}

            <button
              className="btn btn-danger px-2 py-1 text-[10px]"
              title="Сбросить кубики"
              onClick={() =>
                state.setDice({ formula: '', lastResult: null, mode: 'single' })
              }
            >
              ✕ Сбросить ?
            </button>
          </div>

          <div className="text-[10px] text-slate-500">{modeHint}</div>
        </div>

        <div className="flex items-center gap-1">
          <select
            className="input h-8 w-auto max-w-44 px-2 py-1 text-xs"
            value={quickRollId}
            onChange={handleQuickRollChange}
            title="Быстрые броски"
          >
            <option value="">Быстрые броски</option>

            {state.quickRolls.map((quickRoll) => (
              <option key={quickRoll.id} value={quickRoll.id}>
                {quickRoll.name}: {quickRoll.formula}
              </option>
            ))}
          </select>

          <button
            className="btn px-2 py-1 text-xs"
            title="Добавить быстрый бросок"
            onClick={() => state.openModal('addQuickRoll')}
          >
            +
          </button>
        </div>

        {state.dice.lastResult && (
          <div className="max-w-44 truncate text-xs">
            {state.dice.lastResult.error ? (
              <span className="text-red-400">Ошибка</span>
            ) : (
              <span className="font-bold">
                {state.dice.lastResult.formula} = {state.dice.lastResult.total}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center gap-1">
          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!canApplyLast}
            title="Применить последний бросок как урон с учётом режима (D)"
            onClick={() => applyLastDiceByMode('damage')}
          >
            ⚔️D
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!canApplyLast}
            title="Применить последний бросок как лечение с учётом режима (H)"
            onClick={() => applyLastDiceByMode('healing')}
          >
            💚H
          </button>

          <button
            className="btn px-2 py-1 text-xs disabled:opacity-50"
            disabled={!canApplyLast}
            title="Применить последний бросок как временные HP с учётом режима (T)"
            onClick={() => applyLastDiceByMode('temp')}
          >
            🛡️T
          </button>
        </div>

        <button
          className="btn px-2 py-1 text-xs"
          title="Логи"
          onClick={() => setLogsOpen(true)}
        >
          📜
        </button>
      </div>

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
          </div>
        </div>
      )}
    </footer>
  );
}

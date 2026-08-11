import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { diceButtons, modes } from '../../constants/dice.js';
import { rollQuick, rollAndApplyToCharacter } from '../../utils/diceActions.js';

export default function DiceTab() {
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

import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { useDiceTrayStore } from '../../store/diceTrayStore.js';
import {
  applyAmountToCharacterStore,
  effectTypeLabel,
} from '../../utils/diceActions.js';

const effectIcon = (type) => {
  if (type === 'damage') {
    return '⚔️';
  }

  if (type === 'healing') {
    return '💚';
  }

  if (type === 'temp') {
    return '🛡️';
  }

  if (type === 'attack') {
    return '🎯';
  }

  return '🎲';
};

export default function DiceTray() {
  const rolls = useDiceTrayStore((state) => state.rolls);
  const selectedRollId = useDiceTrayStore((state) => state.selectedRollId);
  const selectRoll = useDiceTrayStore((state) => state.selectRoll);
  const removeRoll = useDiceTrayStore((state) => state.removeRoll);
  const clearRolls = useDiceTrayStore((state) => state.clearRolls);
  const markApplied = useDiceTrayStore((state) => state.markApplied);

  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );

  const allCharacters = [...players, ...npcs];
  const defaultTargetId = selectedCharacterId || currentId || '';

  const [manualTargetId, setManualTargetId] = useState('');

  const targetId = manualTargetId || defaultTargetId;
  const targetExists = Boolean(
    targetId && allCharacters.some((character) => character.id === targetId)
  );

  const selectedRoll = rolls.find((roll) => roll.id === selectedRollId);

  const applySelected = (type) => {
    if (!selectedRoll || !targetExists) {
      return;
    }

    applyAmountToCharacterStore(targetId, type, selectedRoll.total);
    markApplied(selectedRoll.id);

    const targetCharacter = allCharacters.find(
      (character) => character.id === targetId
    );

    useAppStore
      .getState()
      .addLog(
        `${targetCharacter?.name || 'Персонаж'}: применён бросок ${selectedRoll.formula} как ${effectTypeLabel(type)} ${selectedRoll.total}`
      );
  };

  return (
    <section className="border-t border-slate-800 bg-slate-950/90 px-2 py-1">
      <div className="flex items-center gap-2 overflow-x-auto">
        <span className="shrink-0 text-xs font-semibold text-slate-400">
          🎲 Лоток кубиков
        </span>

        {rolls.length === 0 && (
          <span className="text-xs text-slate-500">Бросков пока нет</span>
        )}

        {rolls.map((roll) => (
          <button
            key={roll.id}
            onClick={() => selectRoll(roll.id)}
            className={`shrink-0 rounded border px-2 py-0.5 text-[10px] ${
              selectedRollId === roll.id
                ? 'border-amber-400 bg-amber-950/20'
                : roll.applied
                  ? 'border-emerald-700 bg-emerald-950/20'
                  : 'border-slate-700 bg-slate-900'
            } ${roll.applied ? 'line-through opacity-80' : ''}`}
            title={`${roll.source || 'Бросок'}: ${roll.details.join(' | ')}`}
          >
            {effectIcon(roll.effectType)} {roll.label}: {roll.total}
            {roll.applied ? ' ✓' : ''}
          </button>
        ))}

        {rolls.length > 0 && (
          <button
            className="btn shrink-0 px-2 py-0.5 text-[10px]"
            onClick={clearRolls}
          >
            ✕ Очистить
          </button>
        )}
      </div>

      {selectedRoll && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-300">
            Выбрано: {selectedRoll.label} = {selectedRoll.total}
          </span>

          <select
            className="input h-7 w-auto max-w-44 px-2 py-0 text-xs"
            value={targetId}
            onChange={(event) => setManualTargetId(event.target.value)}
          >
            <option value="">Цель не выбрана</option>

            {allCharacters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name}
              </option>
            ))}
          </select>

          <button
            className="btn px-2 py-0.5 text-xs disabled:opacity-50"
            disabled={!targetExists}
            title="Применить выбранный бросок как урон"
            onClick={() => applySelected('damage')}
          >
            ⚔️ Урон
          </button>

          <button
            className="btn px-2 py-0.5 text-xs disabled:opacity-50"
            disabled={!targetExists}
            title="Применить выбранный бросок как лечение"
            onClick={() => applySelected('healing')}
          >
            💚 Лечение
          </button>

          <button
            className="btn px-2 py-0.5 text-xs disabled:opacity-50"
            disabled={!targetExists}
            title="Применить выбранный бросок как временные HP"
            onClick={() => applySelected('temp')}
          >
            🛡️ Врем. HP
          </button>

          <button
            className="btn px-2 py-0.5 text-xs"
            onClick={() => removeRoll(selectedRoll.id)}
          >
            Удалить бросок
          </button>
        </div>
      )}
    </section>
  );
}

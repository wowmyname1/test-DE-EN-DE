import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { useActiveRollStore } from '../../store/activeRollStore.js';
import { useTargetingStore } from '../../store/targetingStore.js';
import { getSelectedSum } from '../../utils/originalDice.js';
import {
  applyHpInputString,
  applyOriginalDamage,
  applyOriginalHeal,
  applyOriginalTempHp,
} from '../../utils/hpEffects.js';
import { applySpreadToCharacter } from '../../utils/rollApplication.js';
import { deleteQuickRollFromCharacter } from '../../utils/characterQuickRolls.js';

export default function CharacterCardOriginal({ character }) {
  const activeRoll = useActiveRollStore((state) => state.activeRoll);
  const toggleAoeTarget = useActiveRollStore((state) => state.toggleAoeTarget);
  const rollQuickFormula = useActiveRollStore((state) => state.rollQuickFormula);

  const openHpPopup = useTargetingStore((state) => state.openHpPopup);
  const setLastTarget = useTargetingStore((state) => state.setLastTarget);

  const currentId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );
  const openModal = useAppStore((state) => state.openModal);
  const removeCharacter = useAppStore((state) => state.removeCharacter);
  const removeStatusFromCharacter = useAppStore(
    (state) => state.removeStatusFromCharacter
  );

  const [inlineOpen, setInlineOpen] = useState(false);
  const [inlineValue, setInlineValue] = useState('');

  const hpMax = Number(character.hpMax || 0);
  const hpCurrent = Number(character.hpCurrent || 0);
  const tempHp = Number(character.tempHp || 0);

  const pct = hpMax > 0 ? Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100)) : 0;
  const tempPct =
    hpMax > 0 && tempHp > 0
      ? Math.max(0, Math.min(100 - pct, (tempHp / hpMax) * 100))
      : 0;

  const isActiveTurn = currentId === character.id;
  const isDead = hpCurrent <= 0;
  const isAoeTarget =
    activeRoll &&
    activeRoll.mode === 'aoe' &&
    activeRoll.aoeTargets.includes(character.id);

  const selectedSum = activeRoll ? getSelectedSum(activeRoll) : 0;

  const hpBarColor =
    pct > 50 ? '#4ecca3' : pct > 25 ? '#f5a623' : '#e94560';

  let preview = null;

  if (activeRoll && selectedSum > 0) {
    if (activeRoll.mode === 'single') {
      preview = `-${selectedSum}`;
    } else if (activeRoll.mode === 'aoe') {
      preview = `💥-${selectedSum}`;
    } else if (activeRoll.mode === 'spread') {
      preview = '🎯';
    }
  }

  const onHpBarClick = (event) => {
    event.stopPropagation();

    const roll = useActiveRollStore.getState().activeRoll;

    if (roll && roll.mode === 'spread') {
      return;
    }

    if (!roll) {
      setInlineOpen(true);
      return;
    }

    setLastTarget(character.id);

    if (roll.mode === 'single') {
      const rect = event.currentTarget.getBoundingClientRect();

      openHpPopup(
        character.id,
        rect.left + rect.width / 2 - 96,
        rect.bottom + 6
      );
    } else if (roll.mode === 'aoe') {
      toggleAoeTarget(character.id);
    }
  };

  const handleCardClick = (event) => {
    if (event.target.closest('button,input,select,textarea')) {
      return;
    }

    applySpreadToCharacter(character.id);
  };

  const handleInlineKeyDown = (event) => {
    if (event.key === 'Enter') {
      applyHpInputString(character.id, inlineValue);
      setInlineValue('');
      setInlineOpen(false);
    }

    if (event.key === 'Escape') {
      setInlineValue('');
      setInlineOpen(false);
    }
  };

  const promptTempHp = () => {
    const value = window.prompt('Временные HP:', '5');

    if (value === null) {
      return;
    }

    const parsed = parseInt(value, 10);

    if (!Number.isFinite(parsed) || parsed <= 0) {
      return;
    }

    applyOriginalTempHp(character.id, parsed);
  };

  const quickRolls = character.quickRolls || [];

  return (
    <article
      data-char-card={character.id}
      onClick={handleCardClick}
      className={`card cursor-pointer border-2 p-2 ${
        isActiveTurn
          ? 'border-amber-400 bg-amber-950/20'
          : isAoeTarget
            ? 'border-red-500 bg-red-950/20'
            : 'border-slate-800'
      } ${isDead ? 'opacity-40' : ''}`}
    >
      <div className="flex items-center gap-2">
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold uppercase text-white"
          style={{ background: character.color }}
        >
          {(character.name || '?').substring(0, 2)}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold">{character.name}</div>

          <div className="truncate text-[10px] text-slate-500">
            {character.type || '—'}
            {character.level ? ` • Ур. ${character.level}` : ''} • AC {character.ac}
          </div>
        </div>

        <div className="shrink-0 rounded bg-slate-800 px-2 py-0.5 text-[10px] font-bold text-amber-300">
          {character.initiative || '—'}
        </div>
      </div>

      <div className="mt-2">
        <div
          className={`hp-bar-container group relative h-6 cursor-pointer overflow-hidden rounded border bg-black/40 ${
            activeRoll ? 'animate-pulse border-amber-500/40' : 'border-white/5'
          }`}
          onClick={onHpBarClick}
        >
          <div
            className="absolute left-0 top-0 h-full rounded transition-all"
            style={{
              width: `${pct}%`,
              background: hpBarColor,
            }}
          />

          {tempHp > 0 && (
            <div
              className="absolute top-0 h-full bg-cyan-400/70"
              style={{
                left: `${pct}%`,
                width: `${tempPct}%`,
              }}
            />
          )}

          <div className="absolute inset-0 z-10 flex items-center justify-center gap-1 text-[11px] font-bold">
            <span>
              {hpCurrent}/{hpMax}
            </span>

            {tempHp > 0 && (
              <span className="rounded bg-black/50 px-1 text-[9px] text-cyan-300">
                🛡️{tempHp}
              </span>
            )}
          </div>

          {preview && (
            <div className="absolute right-2 top-1/2 z-20 -translate-y-1/2 text-xs font-bold text-red-400 opacity-0 transition group-hover:opacity-100">
              {preview}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-1">
          <button
            className="btn px-2 py-0.5 text-[10px]"
            onClick={() => applyOriginalDamage(character.id, 1)}
          >
            -1
          </button>

          <button
            className="btn px-2 py-0.5 text-[10px]"
            onClick={() => applyOriginalDamage(character.id, 5)}
          >
            -5
          </button>

          <button
            className="btn px-2 py-0.5 text-[10px]"
            onClick={() => applyOriginalHeal(character.id, 1)}
          >
            +1
          </button>

          <button
            className="btn px-2 py-0.5 text-[10px]"
            onClick={() => applyOriginalHeal(character.id, 5)}
          >
            +5
          </button>

          <button
            className="btn px-2 py-0.5 text-[10px]"
            onClick={promptTempHp}
          >
            🛡️ Темп
          </button>

          <button
            className="btn px-2 py-0.5 text-[10px]"
            onClick={() => setInlineOpen((prev) => !prev)}
          >
            ✏️
          </button>
        </div>

        {inlineOpen && (
          <input
            className="input mt-1 h-7 px-2 py-1 text-xs"
            value={inlineValue}
            autoFocus
            placeholder="+5, -3, t10, 25"
            onChange={(event) => setInlineValue(event.target.value)}
            onKeyDown={handleInlineKeyDown}
            onBlur={() => setInlineOpen(false)}
          />
        )}
      </div>

      {(character.statuses || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(character.statuses || []).map((status) => (
            <button
              key={status.id}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ background: status.color || '#a855f7' }}
              title={`${status.name}${status.duration ? ` (${status.duration})` : ''}`}
              onClick={() => removeStatusFromCharacter(character.id, status.id)}
            >
              {status.icon}
              {status.duration ? <span>{status.duration}</span> : null}
            </button>
          ))}
        </div>
      )}

      <div className="mt-1 flex flex-wrap gap-1">
        <button
          className="btn px-2 py-0.5 text-[10px]"
          onClick={() => openModal('addStatus', { targetId: character.id })}
        >
          + статус
        </button>

        {quickRolls.map((quickRoll) => (
          <div
            key={quickRoll.id}
            className="inline-flex items-center gap-1 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-[10px]"
          >
            <button onClick={() => rollQuickFormula(quickRoll.formula)}>
              {quickRoll.name}: {quickRoll.formula}
            </button>

            <button
              className="text-slate-500 hover:text-red-400"
              title="Удалить быстрый бросок"
              onClick={(event) => {
                event.stopPropagation();
                deleteQuickRollFromCharacter(character.id, quickRoll.id);
              }}
            >
              ✕
            </button>
          </div>
        ))}

        <button
          className="btn px-2 py-0.5 text-[10px]"
          onClick={() =>
            openModal('quickRollCharacter', { characterId: character.id })
          }
        >
          + бросок
        </button>
      </div>

      <div className="mt-2 flex gap-1">
        <button
          className="btn flex-1 px-2 py-1 text-[10px]"
          onClick={() => openModal('characterDetail', { characterId: character.id })}
        >
          ✏️ Ред.
        </button>

        <button
          className="btn btn-danger flex-1 px-2 py-1 text-[10px]"
          onClick={() => removeCharacter(character.side, character.id)}
        >
          🗑️
        </button>
      </div>
    </article>
  );
}

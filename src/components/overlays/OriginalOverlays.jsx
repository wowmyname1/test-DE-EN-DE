import { useEffect } from 'react';
import { useFloatingTextStore } from '../../store/floatingTextStore.js';
import { useTargetingStore } from '../../store/targetingStore.js';
import { useActiveRollStore } from '../../store/activeRollStore.js';
import { useAppStore } from '../../store/useAppStore.js';
import { getSelectedSum } from '../../utils/originalDice.js';
import { applyOriginalHpEffect } from '../../utils/hpEffects.js';
import { applyAoE } from '../../utils/rollApplication.js';

const floatingCss = `
@keyframes originalFloatUp {
  0% {
    transform: translate(-50%, 0) scale(0.8);
    opacity: 0;
  }
  20% {
    transform: translate(-50%, -10px) scale(1.1);
    opacity: 1;
  }
  100% {
    transform: translate(-50%, -60px) scale(1);
    opacity: 0;
  }
}

.original-floating-text {
  position: fixed;
  font-weight: 800;
  font-size: 1.4rem;
  pointer-events: none;
  z-index: 5000;
  white-space: nowrap;
  text-shadow: 0 2px 8px rgba(0,0,0,0.9), 0 0 20px currentColor;
  animation: originalFloatUp 1.5s ease forwards;
}
`;

function FloatingTextLayer() {
  const texts = useFloatingTextStore((state) => state.texts);

  return (
    <>
      <style>{floatingCss}</style>

      {texts.map((text) => (
        <div
          key={text.id}
          className="original-floating-text"
          style={{
            color: text.color,
            left: text.x,
            top: text.y,
          }}
        >
          {text.text}
        </div>
      ))}
    </>
  );
}

function HpPopup() {
  const hpPopup = useTargetingStore((state) => state.hpPopup);
  const closeHpPopup = useTargetingStore((state) => state.closeHpPopup);

  const activeRoll = useActiveRollStore((state) => state.activeRoll);

  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);

  const character = [...players, ...npcs].find(
    (item) => item.id === hpPopup.characterId
  );

  useEffect(() => {
    if (!hpPopup.open) {
      return;
    }

    const handler = (event) => {
      const popup = document.getElementById('original-hp-popup');

      if (
        popup &&
        !popup.contains(event.target) &&
        !event.target.closest('.hp-bar-container')
      ) {
        closeHpPopup();
      }
    };

    document.addEventListener('click', handler);

    return () => {
      document.removeEventListener('click', handler);
    };
  }, [hpPopup.open, closeHpPopup]);

  if (!hpPopup.open || !character || !activeRoll) {
    return null;
  }

  const selectedSum = getSelectedSum(activeRoll);

  const apply = (type) => {
    applyOriginalHpEffect(character.id, type, selectedSum);
    closeHpPopup();
    useActiveRollStore.getState().clearSelection();
  };

  return (
    <div
      id="original-hp-popup"
      className="fixed z-[2000] w-48 rounded-xl border border-amber-500 bg-slate-900 p-2 shadow-2xl"
      style={{
        left: hpPopup.x,
        top: hpPopup.y,
      }}
    >
      <div className="mb-2 flex items-center justify-between border-b border-slate-700 px-2 pb-1 text-xs text-slate-400">
        <span>{character.name}</span>
        <span className="font-bold text-amber-300">{selectedSum}</span>
      </div>

      <div className="space-y-1">
        <button
          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm hover:border-red-500 hover:bg-red-950/30 hover:text-red-300"
          onClick={() => apply('damage')}
        >
          ⚔️ Урон <span className="float-right text-xs text-slate-500">D</span>
        </button>

        <button
          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm hover:border-emerald-500 hover:bg-emerald-950/30 hover:text-emerald-300"
          onClick={() => apply('heal')}
        >
          💚 Лечение <span className="float-right text-xs text-slate-500">H</span>
        </button>

        <button
          className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-left text-sm hover:border-cyan-500 hover:bg-cyan-950/30 hover:text-cyan-300"
          onClick={() => apply('temp')}
        >
          🛡️ Временные HP{' '}
          <span className="float-right text-xs text-slate-500">T</span>
        </button>
      </div>
    </div>
  );
}

function AoeApplyButton() {
  const activeRoll = useActiveRollStore((state) => state.activeRoll);

  if (
    !activeRoll ||
    activeRoll.mode !== 'aoe' ||
    !activeRoll.aoeTargets.length
  ) {
    return null;
  }

  const amount = getSelectedSum(activeRoll);

  return (
    <button
      className="fixed bottom-28 left-1/2 z-[1500] -translate-x-1/2 rounded-lg bg-red-600 px-6 py-3 font-bold text-white shadow-lg hover:bg-red-500"
      onClick={applyAoE}
    >
      💥 Применить {amount} урона к {activeRoll.aoeTargets.length} целям
    </button>
  );
}

export default function OriginalOverlays() {
  return (
    <>
      <FloatingTextLayer />
      <HpPopup />
      <AoeApplyButton />
    </>
  );
}

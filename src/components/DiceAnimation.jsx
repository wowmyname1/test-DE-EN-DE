import { useEffect, useRef, useState } from 'react';
import { useAppStore } from '../store/useAppStore.js';

export default function DiceAnimation() {
  const lastResult = useAppStore((state) => state.dice.lastResult);

  const [visible, setVisible] = useState(false);
  const [current, setCurrent] = useState(null);
  const [rollKey, setRollKey] = useState(0);

  const timerRef = useRef(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }

    if (!lastResult) {
      return;
    }

    setCurrent(lastResult);
    setVisible(true);
    setRollKey((key) => key + 1);

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    timerRef.current = setTimeout(() => {
      setVisible(false);
    }, 1800);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [lastResult]);

  if (!visible || !current) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <div
        key={rollKey}
        className="dice-toast card flex items-center gap-3 border-amber-500/40 bg-slate-950/90"
      >
        <div className="dice-roll-animation text-3xl">🎲</div>

        <div>
          <div className="text-xs text-slate-400">{current.formula}</div>

          {current.error ? (
            <div className="text-lg font-bold text-red-400">Ошибка</div>
          ) : (
            <div className="dice-result-pop text-2xl font-bold text-amber-300">
              {current.total}
            </div>
          )}

          {!current.error && current.details?.length > 0 && (
            <div className="max-w-xs truncate text-xs text-slate-400">
              {current.details.join(' | ')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

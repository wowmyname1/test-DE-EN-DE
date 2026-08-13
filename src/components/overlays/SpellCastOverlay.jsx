import { useEffect } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import { useSpellCastStore } from '../../store/spellCastStore.js';
import { parseDiceExpression } from '../../utils/originalDice.js';

function SpellCastLogView() {
  const castLog = useSpellCastStore((state) => state.castLog);
  const clearCastLog = useSpellCastStore((state) => state.clearCastLog);
  const cancelSpellCast = useSpellCastStore((state) => state.cancelSpellCast);

  useEffect(() => {
    if (!castLog) return;
    const timer = setTimeout(() => {
      clearCastLog();
      cancelSpellCast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [castLog, clearCastLog, cancelSpellCast]);

  if (!castLog) return null;

  return (
    <div
      className="fixed bottom-5 right-5 z-[1600] min-w-[280px] rounded-xl border-2 border-amber-500 bg-slate-800 p-4 shadow-2xl"
      style={{ animation: 'spellCastIn 0.4s ease' }}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="font-bold text-amber-400">
          {castLog.spell.icon} {castLog.spell.name}
        </span>
        <span className="text-xs text-slate-400">DC {castLog.dc}</span>
      </div>

      <div className="space-y-1">
        {castLog.results.map((result, index) => (
          <div
            key={index}
            className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
              result.success
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'bg-red-500/15 text-red-400'
            }`}
          >
            <span>{result.name}</span>
            <span>
              {result.success ? '✅' : '❌'} {result.details}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SpellCastButton() {
  const activeSpell = useSpellCastStore((state) => state.activeSpell);
  const targets = useSpellCastStore((state) => state.targets);
  const selecting = useSpellCastStore((state) => state.selecting);
  const cancelSpellCast = useSpellCastStore((state) => state.cancelSpellCast);
  const executeSpell = useSpellCastStore((state) => state.executeSpell);

  const players = useAppStore((state) => state.players);
  const npcs = useAppStore((state) => state.npcs);
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const currentTurnId = useAppStore(
    (state) => state.initiativeOrder[state.turnIndex ?? -1]
  );
  const applyDamage = useAppStore((state) => state.applyDamage);
  const applyHeal = useAppStore((state) => state.applyHeal);
  const applyTempHp = useAppStore((state) => state.applyTempHp);
  const addStatusToCharacter = useAppStore((state) => state.addStatusToCharacter);
  const addLog = useAppStore((state) => state.addLog);

  if (!activeSpell) return null;

  const allCharacters = [...players, ...npcs];
  const targetId = selectedCharacterId || currentTurnId;

  const handleCast = () => {
    if (!activeSpell) return;

    const spellTargets = targets.length > 0 ? targets : targetId ? [targetId] : [];

    if (spellTargets.length === 0) {
      addLog('Выберите цель для заклинания');
      return;
    }

    const dc = activeSpell.logic?.save ? 13 : 10;

    const log = { spell: activeSpell, dc, results: [] };

    spellTargets.forEach((charId) => {
      const character = allCharacters.find((c) => c.id === charId);
      if (!character) return;

      let success = true;
      let details = 'Без спасброска';

      if (activeSpell.logic?.save) {
        const saveRoll = Math.floor(Math.random() * 20) + 1;
        success = saveRoll >= dc;
        details = `d20=${saveRoll} (DC ${dc})`;
      }

      log.results.push({ characterId: charId, name: character.name, success, details });

      const effectKey = success ? 'onSuccess' : 'onFail';
      const effect = activeSpell.logic?.[effectKey] || activeSpell.logic?.onFail;

      if (effect) {
        applySpellEffect(charId, effect, success);
      }
    });

    useSpellCastStore.getState().clearCastLog();
    useSpellCastStore.setState({ castLog: log });

    setTimeout(() => {
      useSpellCastStore.getState().clearCastLog();
      useSpellCastStore.getState().cancelSpellCast();
    }, 4000);
  };

  const applySpellEffect = (charId, effect, success) => {
    if (effect.type === 'damage') {
      const formula = effect.formula || '1d6';
      const result = parseDiceExpression(formula);
      const damage = success && effect.type === 'damage' && activeSpell.logic?.onSuccess
        ? Math.ceil(result.total / 2)
        : result.total;
      applyDamage(charId, damage);
    } else if (effect.type === 'heal') {
      const formula = effect.formula || '1d8';
      const result = parseDiceExpression(formula);
      applyHeal(charId, result.total);
    } else if (effect.type === 'applyStatus') {
      addStatusToCharacter(charId, {
        name: effect.statusId || 'Статус',
        icon: '✨',
        color: '#a855f7',
        duration: effect.duration || 3,
      });
    }
  };

  return (
    <>
      <button
        className="fixed bottom-28 left-1/2 z-[1500] -translate-x-1/2 rounded-lg bg-purple-600 px-6 py-3 font-bold text-white shadow-lg transition hover:bg-purple-500"
        onClick={handleCast}
      >
        🔮 Применить заклинание
      </button>

      <button
        className="fixed bottom-16 left-1/2 z-[1500] -translate-x-1/2 rounded-lg bg-white/10 px-4 py-2 text-sm text-slate-300 transition hover:bg-white/20"
        onClick={cancelSpellCast}
      >
        ✕ Отмена
      </button>

      <SpellCastLogView />
    </>
  );
}

export default function SpellCastOverlay() {
  return (
    <>
      <SpellCastButton />
      <SpellCastLogView />
    </>
  );
}

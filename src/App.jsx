import { useState } from 'react';
import { useAppStore } from './store/useAppStore.js';

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
  { label: '⚔️ Одиночный', value: 'single' },
  { label: '💥 AoE', value: 'aoe' },
  { label: '🎯 Разброс', value: 'spread' },
];

const emptyForm = {
  name: '',
  type: '',
  level: '',
  hpMax: '',
  hpCurrent: '',
  ac: '',
  initiative: '',
  color: '#64748b',
};

function InlineAddCharacter({ side, buttonLabel }) {
  const addCharacter = useAppStore((state) => state.addCharacter);

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const setField = (field) => (event) => {
    setForm((prev) => ({
      ...prev,
      [field]: event.target.value,
    }));
  };

  const submit = (event) => {
    event.preventDefault();
    addCharacter(side, form);
    setForm(emptyForm);
    setOpen(false);
  };

  if (!open) {
    return (
      <button className="btn btn-primary" onClick={() => setOpen(true)}>
        {buttonLabel}
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-slate-700 bg-slate-950 p-3">
      <div className="grid gap-2 md:grid-cols-4">
        <label className="text-sm">
          <span className="label">Имя</span>
          <input className="input" value={form.name} onChange={setField('name')} required />
        </label>

        <label className="text-sm">
          <span className="label">Класс / Тип</span>
          <input className="input" value={form.type} onChange={setField('type')} />
        </label>

        <label className="text-sm">
          <span className="label">Уровень / CR</span>
          <input className="input" value={form.level} onChange={setField('level')} />
        </label>

        <label className="text-sm">
          <span className="label">HP Макс</span>
          <input className="input" type="number" value={form.hpMax} onChange={setField('hpMax')} />
        </label>

        <label className="text-sm">
          <span className="label">HP Текущие</span>
          <input className="input" type="number" value={form.hpCurrent} onChange={setField('hpCurrent')} />
        </label>

        <label className="text-sm">
          <span className="label">AC</span>
          <input className="input" type="number" value={form.ac} onChange={setField('ac')} />
        </label>

        <label className="text-sm">
          <span className="label">Инициатива</span>
          <input className="input" type="number" value={form.initiative} onChange={setField('initiative')} />
        </label>

        <label className="text-sm">
          <span className="label">Цвет</span>
          <input
            className="h-10 w-full rounded-lg border border-slate-700 bg-slate-950 p-1"
            type="color"
            value={form.color}
            onChange={setField('color')}
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn btn-primary">
          Сохранить
        </button>

        <button
          type="button"
          className="btn"
          onClick={() => {
            setForm(emptyForm);
            setOpen(false);
          }}
        >
          Отмена
        </button>
      </div>
    </form>
  );
}

function CharacterCard({ character }) {
  const selectedCharacterId = useAppStore((state) => state.selectedCharacterId);
  const selectCharacter = useAppStore((state) => state.selectCharacter);
  const removeCharacter = useAppStore((state) => state.removeCharacter);
  const currentId = useAppStore((state) => state.initiativeOrder[state.turnIndex ?? -1]);

  const isCurrent = currentId === character.id;
  const isSelected = selectedCharacterId === character.id;

  return (
    <article
      id={character.id}
      onClick={() => selectCharacter(character.id)}
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

        <button
          className="btn btn-danger px-2 py-1"
          onClick={(event) => {
            event.stopPropagation();
            removeCharacter(character.side, character.id);
          }}
        >
          ✕
        </button>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-slate-300 md:grid-cols-4">
        <div>HP: {character.hpCurrent}/{character.hpMax}</div>
        <div>AC: {character.ac}</div>
        <div>Инициатива: {character.initiative}</div>
        <div>Врем. HP: {character.tempHp || 0}</div>
      </div>

      {(character.statuses || []).length > 0 && (
        <div className="mt-2 text-xs text-slate-400">Статусы: {character.statuses.length}</div>
      )}
    </article>
  );
}

export default function App() {
  const state = useAppStore();

  const currentId = state.initiativeOrder[state.turnIndex ?? -1];
  const allCharacters = [...state.players, ...state.npcs];
  const currentCharacter = allCharacters.find((item) => item.id === currentId);

  const targetId = state.selectedCharacterId || currentId;
  const targetCharacter = allCharacters.find((item) => item.id === targetId);

  const canApply = Boolean(targetCharacter && state.dice.lastResult?.total > 0);

  const centerCurrent = () => {
    if (!currentId) {
      return;
    }

    document.getElementById(currentId)?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 p-4 text-slate-100">
      <div className="mx-auto max-w-7xl space-y-4">
        <header className="card flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">⚔️ D&D Encounter</h1>

            <p className="mt-1 text-sm text-slate-300">
              Ход: {currentCharacter ? currentCharacter.name : '—'} • Раунд {state.round}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button className="btn btn-primary" onClick={state.startCombat}>
              ⚔️ Начать бой
            </button>

            <button className="btn" onClick={state.nextTurn}>
              ▶ Следующий ход
            </button>

            <button className="btn" onClick={state.resetCombat}>
              🔄 Сброс
            </button>

            <button className="btn" onClick={centerCurrent}>
              🎯 Центрировать
            </button>
          </div>
        </header>

        <div className="grid gap-4 lg:grid-cols-2">
          <section className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">🛡️ Игроки {state.players.length}</h2>
              <InlineAddCharacter side="player" buttonLabel="+ Добавить игрока" />
            </div>

            <div className="space-y-2">
              {state.players.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          </section>

          <section className="card space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-lg font-semibold">👹 NPC / Монстры {state.npcs.length}</h2>
              <InlineAddCharacter side="npc" buttonLabel="+ Добавить NPC" />
            </div>

            <div className="space-y-2">
              {state.npcs.map((character) => (
                <CharacterCard key={character.id} character={character} />
              ))}
            </div>
          </section>
        </div>

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

            <button
              className="btn btn-danger"
              onClick={() => state.setDice({ formula: '', lastResult: null })}
            >
              ✕ Очистить
            </button>
          </div>

          <div className="grid gap-2 md:grid-cols-[2fr_auto]">
            <input
              className="input"
              value={state.dice.formula}
              onChange={(event) => state.setDice({ formula: event.target.value })}
              placeholder="Например: 2d6+1d4+3"
            />

            <button className="btn btn-primary" onClick={() => state.rollFormula()}>
              🎲 Бросить
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {modes.map((mode) => (
              <button
                key={mode.value}
                className={`btn ${state.dice.mode === mode.value ? 'btn-primary' : ''}`}
                onClick={() => state.setDice({ mode: mode.value })}
              >
                {mode.label}
              </button>
            ))}
          </div>

          {state.quickRolls.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {state.quickRolls.map((quickRoll) => (
                <button
                  key={quickRoll.id}
                  className="btn"
                  onClick={() => state.rollFormula(quickRoll.formula)}
                >
                  {quickRoll.name}: {quickRoll.formula}
                </button>
              ))}
            </div>
          )}

          {state.dice.lastResult && (
            <div className="card bg-slate-950">
              {state.dice.lastResult.error ? (
                <p className="text-red-400">Ошибка: {state.dice.lastResult.error}</p>
              ) : (
                <>
                  <p className="text-lg font-bold">
                    {state.dice.lastResult.formula} = {state.dice.lastResult.total}
                  </p>

                  <p className="mt-1 text-sm text-slate-400">
                    {state.dice.lastResult.details.join(' | ')}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-400">
              Персонаж: {targetCharacter ? targetCharacter.name : 'не выбран'}
            </span>

            <button
              className="btn disabled:opacity-50"
              disabled={!canApply}
              onClick={() => state.applyLastRollToCharacter('damage')}
            >
              ⚔️ Урон
            </button>

            <button
              className="btn disabled:opacity-50"
              disabled={!canApply}
              onClick={() => state.applyLastRollToCharacter('healing')}
            >
              💚 Лечение
            </button>

            <button
              className="btn disabled:opacity-50"
              disabled={!canApply}
              onClick={() => state.applyLastRollToCharacter('temp')}
            >
              🛡️ Временные HP
            </button>
          </div>

          <details className="card bg-slate-950">
            <summary className="cursor-pointer font-medium">📜 Синтаксис бросков</summary>

            <div className="mt-2 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
              <div>2d6 — 2 кубика d6</div>
              <div>1d20+5 — d20 с модификатором</div>
              <div>4d6kh3 — бросить 4d6, лучшие 3</div>
              <div>2d20kl1 — бросить 2d20, худший</div>
              <div>2d6+1d4+3 — смесь костей</div>
              <div>8 — просто число</div>
            </div>
          </details>
        </section>

        <section className="card space-y-2">
          <h2 className="text-lg font-semibold">Логи</h2>

          <div className="max-h-48 space-y-1 overflow-auto text-sm">
            {state.logs.length === 0 && <p className="text-slate-500">Пока пусто.</p>}

            {state.logs.map((log) => (
              <div key={log.id} className="text-slate-300">
                <span className="mr-2 text-slate-500">{log.time}</span>
                {log.text}
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

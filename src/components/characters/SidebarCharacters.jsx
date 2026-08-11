import { useState } from 'react';
import { useAppStore } from '../../store/useAppStore.js';
import CharacterCompact from './CharacterCompact.jsx';

export default function SidebarCharacters() {
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

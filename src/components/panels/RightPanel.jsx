import { useState } from 'react';
import InitiativeTab from './InitiativeTab.jsx';
import DiceTab from './DiceTab.jsx';
import LogsTab from './LogsTab.jsx';

export default function RightPanel() {
  const [tab, setTab] = useState('dice');

  return (
    <aside className="flex w-72 min-h-0 flex-col gap-2 xl:w-80">
      <div className="flex gap-1">
        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'initiative' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('initiative')}
        >
          Инициатива
        </button>

        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'dice' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('dice')}
        >
          Кубики
        </button>

        <button
          className={`btn flex-1 px-2 py-1 text-xs ${
            tab === 'logs' ? 'btn-primary' : ''
          }`}
          onClick={() => setTab('logs')}
        >
          Логи
        </button>
      </div>

      <div className="min-h-0 flex-1">
        {tab === 'initiative' && <InitiativeTab />}
        {tab === 'dice' && <DiceTab />}
        {tab === 'logs' && <LogsTab />}
      </div>
    </aside>
  );
}

import { useAppStore } from '../../store/useAppStore.js';

export default function LogsTab() {
  const logs = useAppStore((state) => state.logs);

  return (
    <div className="card h-full space-y-1 overflow-y-auto text-xs">
      {logs.length === 0 && <p className="text-slate-500">Пока пусто.</p>}

      {logs.map((log) => (
        <div key={log.id} className="text-slate-300">
          <span className="mr-2 text-slate-500">{log.time}</span>
          {log.text}
        </div>
      ))}
    </div>
  );
}

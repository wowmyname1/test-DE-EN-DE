#!/usr/bin/env bash
set -euo pipefail

PROJECT="dnd-encounter-builder"
PROTO_FILE="refactor.html"   # путь к прототипу относительно места запуска

# ── 1. Проверки окружения ─────────────────────────────
command -v node >/dev/null || { echo "❌ Нужен Node.js ≥ 20"; exit 1; }
command -v npm  >/dev/null || { echo "❌ Нужен npm"; exit 1; }

NODE_MAJOR=$(node -v | sed 's/v//' | cut -d. -f1)
[ "$NODE_MAJOR" -ge 20 ] || { echo "❌ Node $(node -v) староват, нужен ≥ 20"; exit 1; }
echo "✅ Node $(node -v)"

# ── 2. Скаффолд Vite + React + TS ─────────────────────
if [ -d "$PROJECT" ]; then
  echo "❌ Папка $PROJECT уже существует"; exit 1
fi
npm create vite@latest "$PROJECT" -- --template react-ts
cd "$PROJECT"

# ── 3. Зависимости ────────────────────────────────────
npm install
npm install zustand
npm install -D tailwindcss @tailwindcss/vite

# ── 4. Tailwind (v4, через vite-плагин) ───────────────
cat > vite.config.ts <<'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
EOF

cat > src/index.css <<'EOF'
@import "tailwindcss";
EOF

# ── 5. Структура по доменам прототипа ─────────────────
mkdir -p src/{components,features/{initiative,dice,characters,statuses,spells},store,types,lib}

# Типы — вынесены из прототипа как точка входа рефакторинга
cat > src/types/index.ts <<'EOF'
export type Die = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20' | 'd100';

export interface Combatant {
  id: string;
  name: string;
  kind: 'player' | 'npc';
  classOrType: string;
  levelOrCr: string;
  hpMax: number;
  hpCurrent: number;
  tempHp: number;
  ac: number;
  initiative: number;
  color: string;
  statuses: StatusInstance[];
}

export interface StatusInstance {
  id: string;
  name: string;
  icon: string;
  duration: number | null; // null = бессрочный
}

export interface Spell {
  id: string;
  name: string;
  level: number; // 0 = заговор
  icon: string;
  school: string;
  castTime: string;
  range: string;
  duration: string;
  targeting: 'single' | 'aoe' | 'scatter';
  description: string;
}
EOF

cat > src/store/combat.ts <<'EOF'
import { create } from 'zustand';
import type { Combatant } from '../types';

interface CombatState {
  round: number;
  turnIndex: number;
  combatants: Combatant[];
  addCombatant: (c: Combatant) => void;
  nextTurn: () => void;
  reset: () => void;
}

export const useCombat = create<CombatState>((set, get) => ({
  round: 1,
  turnIndex: 0,
  combatants: [],
  addCombatant: (c) => set((s) => ({ combatants: [...s.combatants, c] })),
  nextTurn: () => {
    const { turnIndex, combatants } = get();
    if (turnIndex + 1 >= combatants.length) {
      set({ turnIndex: 0, round: get().round + 1 });
    } else {
      set({ turnIndex: turnIndex + 1 });
    }
  },
  reset: () => set({ round: 1, turnIndex: 0 }),
}));
EOF

# Заглушки фич, чтобы структура сразу была видна
for f in initiative dice characters statuses spells; do
  echo "export {} from './$f';" > "src/features/$f/index.ts"
done

# Минимальный App-каркас
cat > src/App.tsx <<'EOF'
export default function App() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 p-8">
      <h1 className="text-2xl font-bold">⚔️ D&amp;D Encounter Builder</h1>
      <p className="text-zinc-400 mt-2">
        Каркас готов. Прототип — в <code>reference/refactor.html</code>
      </p>
    </main>
  );
}
EOF

# ── 6. Прототип как референс ──────────────────────────
mkdir -p reference
if [ -f "../$PROTO_FILE" ]; then
  cp "../$PROTO_FILE" reference/
elif [ -f "$PROTO_FILE" ]; then
  cp "$PROTO_FILE" reference/
else
  echo "⚠️  $PROTO_FILE не найден — положи его рядом со скриптом и скопируй вручную в reference/"
fi

# ── 7. Git ────────────────────────────────────────────
git init -b main
git add -A
git commit -m "chore: scaffold Vite + React + TS from refactor.html prototype"

echo ""
echo "🎉 Готово! Далее:"
echo "   cd $PROJECT && npm run dev"

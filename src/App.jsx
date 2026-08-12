import GlobalModals from './components/Modals.jsx';
import EditCharacterModal from './components/EditCharacterModal.jsx';
import PresetsModal from './components/PresetsModal.jsx';
import CharacterDetailModal from './components/characters/CharacterDetailModal.jsx';
import MapBoard from './components/MapBoard.jsx';
import TopBar from './components/layout/TopBar.jsx';
import CharacterPanel from './components/characters/CharacterPanel.jsx';
import DiceBar from './components/panels/DiceBar.jsx';
import { useCombatHotkeys } from './hooks/useCombatHotkeys.js';

export default function App() {
  useCombatHotkeys();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopBar />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <CharacterPanel side="player" />
        <MapBoard />
        <CharacterPanel side="npc" />
      </div>

      <DiceBar />

      <GlobalModals />
      <EditCharacterModal />
      <PresetsModal />
      <CharacterDetailModal />
    </main>
  );
}

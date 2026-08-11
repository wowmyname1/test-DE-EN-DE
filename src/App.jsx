import GlobalModals from './components/Modals.jsx';
import EditCharacterModal from './components/EditCharacterModal.jsx';
import PresetsModal from './components/PresetsModal.jsx';
import MapBoard from './components/MapBoard.jsx';
import TopBar from './components/layout/TopBar.jsx';
import SidebarCharacters from './components/characters/SidebarCharacters.jsx';
import RightPanel from './components/panels/RightPanel.jsx';
import { useCombatHotkeys } from './hooks/useCombatHotkeys.js';

export default function App() {
  useCombatHotkeys();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopBar />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <SidebarCharacters />
        <MapBoard />
        <RightPanel />
      </div>

      <GlobalModals />
      <EditCharacterModal />
      <PresetsModal />
    </main>
  );
}

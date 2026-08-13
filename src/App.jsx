import GlobalModals from './components/Modals.jsx';
import EditCharacterModal from './components/EditCharacterModal.jsx';
import PresetsModal from './components/PresetsModal.jsx';
import CharacterDetailModal from './components/characters/CharacterDetailModal.jsx';
import CharacterQuickRollModal from './components/modals/CharacterQuickRollModal.jsx';
import MapBoard from './components/MapBoard.jsx';
import TopBar from './components/layout/TopBar.jsx';
import CharacterPanel from './components/characters/CharacterPanel.jsx';
import OriginalDicePanel from './components/panels/OriginalDicePanel.jsx';
import OriginalOverlays from './components/overlays/OriginalOverlays.jsx';
import ToastLayer from './components/effects/ToastLayer.jsx';
import AddStatusModalOriginal from './components/modals/AddStatusModalOriginal.jsx';
import SpellCatalogModalOriginal from './components/modals/SpellCatalogModalOriginal.jsx';
import StatusCatalogModalOriginal from './components/modals/StatusCatalogModalOriginal.jsx';
import { useOriginalDiceHotkeys } from './hooks/useOriginalDiceHotkeys.js';

export default function App() {
  useOriginalDiceHotkeys();

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopBar />

      <div className="flex min-h-0 flex-1 gap-2 p-2">
        <CharacterPanel side="player" />
        <MapBoard />
        <CharacterPanel side="npc" />
      </div>

      <OriginalDicePanel />

      <GlobalModals />
      <EditCharacterModal />
      <PresetsModal />
      <CharacterDetailModal />
      <CharacterQuickRollModal />
      <OriginalOverlays />
      <ToastLayer />
          <AddStatusModalOriginal />
      <SpellCatalogModalOriginal />
      <StatusCatalogModalOriginal />
    </main>
  );
}

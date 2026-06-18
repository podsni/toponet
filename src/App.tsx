import { useEffect, useState } from 'react';
import { useStore } from './store';
import { Toolbar, ConnectionLegend } from './components/Toolbar';
import { TopologyCanvas } from './components/TopologyCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { NodeEditor, ConnectionEditor, HelpModal } from './components/Editors';
import { MobileFAB, MobileStatusBar, ConnectBanner, AddHint } from './components/MobileUI';
import { exportJson, importJsonFile } from './lib/export';
import { PlusIcon, DownloadIcon, UploadIcon, HelpIcon } from './lib/icons';

export default function App() {
  const loadFromStorage = useStore(s => s.loadFromStorage);
  const editingNodeId = useStore(s => s.editingNodeId);
  const editingConnectionId = useStore(s => s.editingConnectionId);
  const helpOpen = useStore(s => s.helpOpen);
  const closeEditor = useStore(s => s.closeEditor);
  const toggleHelp = useStore(s => s.toggleHelp);
  const isAddingNode = useStore(s => s.isAddingNode);
  const setAddingNode = useStore(s => s.setAddingNode);
  const setPendingConnectSource = useStore(s => s.setPendingConnectSource);
  const cancelConnecting = useStore(s => s.cancelConnecting);
  const pendingConnectSource = useStore(s => s.pendingConnectSource);
  const connectingFromNodeId = useStore(s => s.connectingFromNodeId);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const selectedConnectionId = useStore(s => s.selectedConnectionId);
  const metadata = useStore(s => s.metadata);
  const nodes = useStore(s => s.nodes);
  const connections = useStore(s => s.connections);
  const importJson = useStore(s => s.importJson);

  const [toast, setToast] = useState<string | null>(null);

  // Track mobile viewport for body class (so CSS can lift FAB above bottom sheet)
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 900px)');
    const update = () => {
      const hasSelection = !!(selectedNodeId || selectedConnectionId);
      document.body.classList.toggle('has-open-panel-mobile', mq.matches && hasSelection);
    };
    update();
    mq.addEventListener('change', update);
    // Also re-run when selection changes (handled by re-render below)
    return () => mq.removeEventListener('change', update);
  }, [selectedNodeId, selectedConnectionId]);

  // Initial load
  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  // Toast helper
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      // Ignore when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.key === 'Escape') {
        if (helpOpen) { toggleHelp(); return; }
        if (editingNodeId || editingConnectionId) { closeEditor(); return; }
        if (isAddingNode) { setAddingNode(null); return; }
        if (pendingConnectSource) { setPendingConnectSource(false); return; }
        if (connectingFromNodeId) { cancelConnecting(); return; }
      }
      if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        toggleHelp();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [helpOpen, editingNodeId, editingConnectionId, isAddingNode, toggleHelp, closeEditor, setAddingNode]);

  const handleExport = () => {
    exportJson(nodes, connections, metadata);
    showToast('Topology exported');
  };

  const handleImport = async () => {
    const data = await importJsonFile();
    if (!data) {
      showToast('Invalid JSON file');
      return;
    }
    if (importJson(JSON.stringify(data))) {
      showToast('Topology imported');
    } else {
      showToast('Failed to import');
    }
  };

  // Count PPPoE links for header badge
  const pppoeCount = connections.filter(c => c.type === 'pppoe').length;

  return (
    <>
      <header className="app-header">
        <div className="flex-row">
          <div className="app-title">
            <span className="app-title-mark">
              <svg width="16" height="16" viewBox="0 0 32 32" fill="none">
                <circle cx="8" cy="8" r="3" fill="#7A5C36"/>
                <circle cx="24" cy="8" r="3" fill="#C49856"/>
                <circle cx="16" cy="24" r="3" fill="#7A5C36"/>
                <path d="M8 8 L24 8 M8 8 L16 24 M24 8 L16 24" stroke="#7A5C36" strokeWidth="1.5" opacity="0.55"/>
              </svg>
            </span>
            TopoNet
            <span className="app-meta">· {metadata.name}</span>
            {pppoeCount > 0 && (
              <span style={{
                fontSize: 11,
                background: 'var(--accent)',
                color: 'var(--bg)',
                padding: '2px 8px',
                borderRadius: 999,
                fontWeight: 600,
                fontStyle: 'normal',
                marginLeft: 4,
              }}>
                {pppoeCount} PPPoE
              </span>
            )}
          </div>
        </div>
        <div className="app-header-actions">
          <button
            className="btn"
            onClick={() => setAddingNode('router')}
            title="Quick-add a router (or use toolbar)"
          >
            <PlusIcon size={14} />
            <span className="btn-text">Add</span>
          </button>
          <button className="btn" onClick={handleImport} title="Import JSON">
            <UploadIcon size={14} />
            <span className="btn-text">Import</span>
          </button>
          <button className="btn" onClick={handleExport} title="Export JSON">
            <DownloadIcon size={14} />
            <span className="btn-text">Export</span>
          </button>
          <button className="btn btn-icon btn-icon-only-mobile" onClick={toggleHelp} title="Help (?)">
            <HelpIcon size={16} />
          </button>
        </div>
      </header>

      <div className="app-main">
        <Toolbar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <TopologyCanvas />
          <ConnectionLegend />
        </div>
        <PropertiesPanel />
      </div>

      {/* Mobile-specific UI */}
      <MobileFAB />
      <MobileStatusBar />
      <ConnectBanner />
      <AddHint />

      {editingNodeId && <NodeEditor nodeId={editingNodeId} onClose={closeEditor} />}
      {editingConnectionId && <ConnectionEditor connId={editingConnectionId} onClose={closeEditor} />}
      {helpOpen && <HelpModal onClose={toggleHelp} />}

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
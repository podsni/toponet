import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { NODE_TYPE_META } from '../types';
import type { NodeType } from '../types';
import { NodeIcon, PlusIcon, CloseIcon, LinkIcon } from '../lib/icons';

// ─── Mobile FAB (quick-add) ─────────────────────────────────────────────
// Opens a small picker grid with the most common device types.
export const MobileFAB = () => {
  const [open, setOpen] = useState(false);
  const setAddingNode = useStore(s => s.setAddingNode);
  const isAddingNode = useStore(s => s.isAddingNode);
  // cancelConnecting is exposed via the ConnectBanner instead

  // Close the picker when add-mode starts
  useEffect(() => {
    if (isAddingNode) setOpen(false);
  }, [isAddingNode]);

  const handlePick = (type: NodeType) => {
    setAddingNode(type);
    setOpen(false);
  };

  const QUICK: { label: string; types: NodeType[] }[] = [
    { label: 'Network', types: ['router', 'switch', 'ap', 'firewall'] },
    { label: 'WAN',     types: ['cloud', 'modem'] },
    { label: 'Devices', types: ['pc', 'laptop', 'phone', 'camera', 'printer'] },
    { label: 'Services',types: ['server', 'nas'] },
  ];

  return (
    <>
      <button
        className="fab"
        onClick={() => setOpen(true)}
        title="Tambah device"
        aria-label="Tambah device"
      >
        <PlusIcon size={26} color="currentColor" />
      </button>

      {open && (
        <div className="fab-picker-backdrop" onClick={() => setOpen(false)}>
          <div className="fab-picker" onClick={(e) => e.stopPropagation()}>
            <div className="fab-picker-header">
              <span className="fab-picker-title">Tambah device</span>
              <button className="btn btn-icon" onClick={() => setOpen(false)} aria-label="Tutup">
                <CloseIcon size={16} />
              </button>
            </div>
            <div className="fab-picker-body">
              {QUICK.map(group => (
                <div key={group.label} className="fab-picker-group">
                  <div className="fab-picker-group-label">{group.label}</div>
                  <div className="fab-picker-grid">
                    {group.types.map(type => {
                      const meta = NODE_TYPE_META[type];
                      return (
                        <button
                          key={type}
                          className="fab-picker-item"
                          onClick={() => handlePick(type)}
                        >
                          <div className="fab-picker-item-icon">
                            <NodeIcon type={type} size={22} color={meta.color} />
                          </div>
                          <span>{meta.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ─── Mobile Status Bar ──────────────────────────────────────────────────
// Always-visible info strip on mobile with network stats + tips.
export const MobileStatusBar = () => {
  const nodes = useStore(s => s.nodes);
  const connections = useStore(s => s.connections);
  const isAddingNode = useStore(s => s.isAddingNode);
  const connectingFromNodeId = useStore(s => s.connectingFromNodeId);

  const pppoeCount = connections.filter(c => c.type === 'pppoe').length;

  let tip: string;
  if (isAddingNode) {
    tip = 'Tap canvas untuk tempatkan device';
  } else if (connectingFromNodeId) {
    tip = 'Tap node target untuk hubungkan';
  } else if (nodes.length === 0) {
    tip = 'Tap + untuk tambah device pertama';
  } else {
    tip = 'Tap node untuk edit · tahan untuk connect';
  }

  return (
    <div className="mobile-status-bar">
      <div className="mobile-status-bar-left">
        <span className="mobile-status-pill">{nodes.length} nodes</span>
        <span className="mobile-status-pill">{connections.length} links</span>
        {pppoeCount > 0 && <span className="mobile-status-pill pppoe">{pppoeCount} PPPoE</span>}
      </div>
      <span className="mobile-status-tip">{tip}</span>
    </div>
  );
};

// ─── Connect-mode banner (mobile) ───────────────────────────────────────
export const ConnectBanner = () => {
  const connectingFromNodeId = useStore(s => s.connectingFromNodeId);
  const nodes = useStore(s => s.nodes);
  const cancelConnecting = useStore(s => s.cancelConnecting);

  if (!connectingFromNodeId) return null;
  const source = nodes.find(n => n.id === connectingFromNodeId);

  return (
    <div className="connect-banner">
      <LinkIcon size={14} />
      <span>Tap target untuk hubungkan <strong>{source?.label || 'node'}</strong></span>
      <button
        className="btn btn-sm"
        style={{ background: 'var(--bg)', color: 'var(--accent)', marginLeft: 8 }}
        onClick={cancelConnecting}
      >
        Batal
      </button>
    </div>
  );
};

// ─── Add-mode hint (mobile) ─────────────────────────────────────────────
export const AddHint = () => {
  const isAddingNode = useStore(s => s.isAddingNode);
  const NODE_TYPE_META_local = NODE_TYPE_META;

  if (!isAddingNode) return null;
  const meta = NODE_TYPE_META_local[isAddingNode];

  return (
    <div className="add-hint">
      <NodeIcon type={isAddingNode} size={14} color="currentColor" />
      <span style={{ marginLeft: 6 }}>Tap canvas untuk tambah <strong>{meta.label}</strong></span>
    </div>
  );
};
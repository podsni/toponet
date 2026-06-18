import { useStore } from '../store';
import { NODE_TYPE_META, CONNECTION_TYPE_META } from '../types';
import type { NodeType } from '../types';
import { NodeIcon, ConnectionIcon, ResetIcon, ZoomInIcon, ZoomOutIcon, HelpIcon } from '../lib/icons';

const NODE_GROUPS: { label: string; types: NodeType[] }[] = [
  { label: 'WAN',      types: ['cloud', 'modem', 'firewall'] },
  { label: 'Network',  types: ['router', 'switch', 'ap'] },
  { label: 'Devices',  types: ['pc', 'laptop', 'phone'] },
  { label: 'Services', types: ['server', 'nas', 'printer', 'camera'] },
];

export const Toolbar = () => {
  const isAddingNode = useStore(s => s.isAddingNode);
  const setAddingNode = useStore(s => s.setAddingNode);
  const selectNode = useStore(s => s.selectNode);
  const selectConnection = useStore(s => s.selectConnection);
  const resetViewport = useStore(s => s.resetViewport);
  const zoom = useStore(s => s.zoom);
  const toggleHelp = useStore(s => s.toggleHelp);

  const handleAddClick = (type: NodeType) => {
    if (isAddingNode === type) {
      // Toggle off
      setAddingNode(null);
    } else {
      setAddingNode(type);
      selectNode(null);
      selectConnection(null);
    }
  };

  return (
    <div className="toolbar">
      {NODE_GROUPS.map((group, gi) => (
        <div key={group.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
          <div className="toolbar-section-label">{group.label}</div>
          {group.types.map(type => {
            const meta = NODE_TYPE_META[type];
            const isActive = isAddingNode === type;
            return (
              <button
                key={type}
                className={`tool-btn ${isActive ? 'active-pending' : ''}`}
                onClick={() => handleAddClick(type)}
                title={`Add ${meta.label}`}
                aria-label={`Add ${meta.label}`}
              >
                <NodeIcon type={type} size={20} color={isActive ? 'currentColor' : meta.color} />
                <span>{meta.label.split(' ')[0]}</span>
              </button>
            );
          })}
          {gi < NODE_GROUPS.length - 1 && <div className="toolbar-divider" />}
        </div>
      ))}

      <div className="toolbar-divider" />
      <div className="toolbar-section-label">View</div>

      <button className="tool-btn" onClick={() => zoom(1.2)} title="Zoom in">
        <ZoomInIcon size={18} />
        <span>In</span>
      </button>
      <button className="tool-btn" onClick={() => zoom(1 / 1.2)} title="Zoom out">
        <ZoomOutIcon size={18} />
        <span>Out</span>
      </button>
      <button className="tool-btn" onClick={resetViewport} title="Reset view">
        <ResetIcon size={18} />
        <span>Reset</span>
      </button>

      <div className="toolbar-divider" />
      <button className="tool-btn" onClick={toggleHelp} title="Help">
        <HelpIcon size={18} />
        <span>Help</span>
      </button>
    </div>
  );
};

// ─── Connection type legend for the toolbar (compact) ─────────────────
export const ConnectionLegend = () => {
  return (
    <div style={{
      padding: '8px 12px',
      borderTop: '1px solid var(--border)',
      background: 'var(--surface)',
      display: 'flex',
      flexWrap: 'wrap',
      gap: 6,
      flexShrink: 0,
    }} className="connection-legend">
      {(Object.keys(CONNECTION_TYPE_META) as Array<keyof typeof CONNECTION_TYPE_META>).map(key => {
        const meta = CONNECTION_TYPE_META[key];
        return (
          <div key={key} style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 6px',
            background: 'var(--bg-soft)',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 10,
            color: 'var(--text-soft)',
          }}>
            <ConnectionIcon type={key} size={10} color={meta.color} />
            <span>{meta.label}</span>
          </div>
        );
      })}
    </div>
  );
};
import { useStore } from '../store';
import { NODE_TYPE_META, CONNECTION_TYPE_META } from '../types';
import { NodeIcon, ConnectionIcon, CloseIcon, TrashIcon, LinkIcon } from '../lib/icons';

// ─── Empty panel ────────────────────────────────────────────────────────
const EmptyPanel = ({ onLoadDemo }: { onLoadDemo: () => void }) => (
  <div className="panel">
    <div className="panel-header">
      <h2 className="panel-title">Properties</h2>
    </div>
    <div className="panel-empty">
      <div className="panel-empty-icon">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="9" />
          <path d="M9 9a3 3 0 0 1 6 0c0 1.5-2 2-2 3.5" />
          <circle cx="12" cy="17" r=".5" fill="currentColor" />
        </svg>
      </div>
      <p className="panel-empty-text">
        Pilih node atau koneksi di canvas untuk mengedit detail di sini — termasuk username PPPoE, IP address, dan bandwidth.
      </p>
      <button className="btn btn-sm" onClick={onLoadDemo}>
        Muat contoh jaringan
      </button>
    </div>
  </div>
);

// ─── Node properties panel ──────────────────────────────────────────────
const NodePropertiesPanel = ({ nodeId }: { nodeId: string }) => {
  const node = useStore(s => s.nodes.find(n => n.id === nodeId));
  const updateNode = useStore(s => s.updateNode);
  const deleteNode = useStore(s => s.deleteNode);
  const openNodeEditor = useStore(s => s.openNodeEditor);
  const startConnecting = useStore(s => s.startConnecting);
  const connections = useStore(s => s.connections);

  if (!node) return null;
  const meta = NODE_TYPE_META[node.type];

  const onPropChange = (key: string, value: string) => {
    updateNode(node.id, { properties: { ...node.properties, [key]: value } });
  };

  const relatedConnections = connections.filter(c => c.sourceId === node.id || c.targetId === node.id);

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <NodeIcon type={node.type} size={18} color={meta.color} />
          {node.label}
        </h2>
        <button className="btn btn-icon" onClick={() => useStore.getState().selectNode(null)} aria-label="Close">
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="panel-body">
        <div className="panel-section">
          <div className="panel-section-title">Device</div>
          <div className="field">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              value={node.label}
              onChange={(e) => updateNode(node.id, { label: e.target.value })}
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Type</label>
              <div className="field-input" style={{ background: 'var(--bg-soft)', color: 'var(--text-soft)' }}>
                {meta.label}
              </div>
            </div>
            <div className="field">
              <label className="field-label">Category</label>
              <div className="field-input" style={{ background: 'var(--bg-soft)', color: 'var(--text-soft)' }}>
                {meta.category}
              </div>
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title">Network</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">IP Address</label>
              <input
                className="field-input"
                placeholder="192.168.1.1"
                value={node.properties.ip || ''}
                onChange={(e) => onPropChange('ip', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">MAC</label>
              <input
                className="field-input"
                placeholder="00:11:22:33:44:55"
                value={node.properties.mac || ''}
                onChange={(e) => onPropChange('mac', e.target.value)}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Vendor</label>
              <input
                className="field-input"
                placeholder="TP-Link"
                value={node.properties.vendor || ''}
                onChange={(e) => onPropChange('vendor', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Model</label>
              <input
                className="field-input"
                placeholder="Archer C7"
                value={node.properties.model || ''}
                onChange={(e) => onPropChange('model', e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label className="field-label">Location</label>
            <input
              className="field-input"
              placeholder="Living room, rack 2U, etc."
              value={node.properties.location || ''}
              onChange={(e) => onPropChange('location', e.target.value)}
            />
          </div>
          <div className="field">
            <label className="field-label">Notes</label>
            <textarea
              className="field-textarea"
              placeholder="Anything else worth noting…"
              value={node.properties.notes || ''}
              onChange={(e) => onPropChange('notes', e.target.value)}
            />
          </div>
        </div>

        {relatedConnections.length > 0 && (
          <div className="panel-section">
            <div className="panel-section-title">Connections ({relatedConnections.length})</div>
            {relatedConnections.map(c => {
              const cMeta = CONNECTION_TYPE_META[c.type];
              const otherId = c.sourceId === node.id ? c.targetId : c.sourceId;
              const other = useStore.getState().nodes.find(n => n.id === otherId);
              return (
                <div key={c.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 10px',
                  background: 'var(--bg-soft)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  marginBottom: 6,
                  fontSize: 12,
                }}>
                  <ConnectionIcon type={c.type} size={14} color={cMeta.color} />
                  <span style={{ flex: 1, color: 'var(--text-soft)' }}>
                    → {other?.label || 'Unknown'}
                  </span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{cMeta.label}</span>
                </div>
              );
            })}
          </div>
        )}

        <div className="panel-section">
          <div className="panel-section-title">Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={() => openNodeEditor(node.id)}>
              Edit lengkap
            </button>
            <button className="btn btn-sm" onClick={() => startConnecting(node.id)} title="Click another node to connect">
              <LinkIcon size={12} /> Connect
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => {
              if (confirm(`Hapus "${node.label}"?`)) deleteNode(node.id);
            }}>
              <TrashIcon size={12} /> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Connection properties panel ────────────────────────────────────────
const ConnectionPropertiesPanel = ({ connId }: { connId: string }) => {
  const conn = useStore(s => s.connections.find(c => c.id === connId));
  const updateConnection = useStore(s => s.updateConnection);
  const deleteConnection = useStore(s => s.deleteConnection);
  const openConnectionEditor = useStore(s => s.openConnectionEditor);
  const source = useStore(s => s.nodes.find(n => n.id === conn?.sourceId));
  const target = useStore(s => s.nodes.find(n => n.id === conn?.targetId));

  if (!conn) return null;
  const meta = CONNECTION_TYPE_META[conn.type];
  const isPppoe = conn.type === 'pppoe';

  const onPropChange = (key: string, value: string) => {
    updateConnection(conn.id, { properties: { ...conn.properties, [key]: value } });
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">
          <ConnectionIcon type={conn.type} size={18} color={meta.color} />
          {meta.label}
        </h2>
        <button className="btn btn-icon" onClick={() => useStore.getState().selectConnection(null)} aria-label="Close">
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="panel-body">
        <div className="panel-section">
          <div className="panel-section-title">Endpoints</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--bg-soft)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: 12 }}>
            <span style={{ flex: 1 }}>{source?.label}</span>
            <span style={{ color: meta.color }}>→</span>
            <span style={{ flex: 1, textAlign: 'right' }}>{target?.label}</span>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title">Connection</div>
          <div className="field">
            <label className="field-label">Type</label>
            <select
              className="field-select"
              value={conn.type}
              onChange={(e) => updateConnection(conn.id, { type: e.target.value as any })}
            >
              {(Object.keys(CONNECTION_TYPE_META) as Array<keyof typeof CONNECTION_TYPE_META>).map(k => (
                <option key={k} value={k}>{CONNECTION_TYPE_META[k].label}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="field-label">Label</label>
            <input
              className="field-input"
              placeholder="WAN, LAN1, trunk…"
              value={conn.label || ''}
              onChange={(e) => updateConnection(conn.id, { label: e.target.value })}
            />
          </div>
        </div>

        {isPppoe && (
          <div className="panel-section">
            <div className="pppoe-callout">
              <span className="pppoe-callout-icon">⚡</span>
              <div>
                <strong>PPPoE link.</strong> Isi kredensial ISP dan IP publik yang di-assign ke interface ini.
              </div>
            </div>
            <div className="panel-section-title">PPPoE Credentials</div>
            <div className="field">
              <label className="field-label">Username</label>
              <input
                className="field-input"
                placeholder="user@isp.com"
                value={conn.properties.username || ''}
                onChange={(e) => onPropChange('username', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Password</label>
              <input
                type="password"
                className="field-input"
                placeholder="••••••••"
                value={conn.properties.password || ''}
                onChange={(e) => onPropChange('password', e.target.value)}
              />
            </div>
            <div className="field-row">
              <div className="field">
                <label className="field-label">Service Name</label>
                <input
                  className="field-input"
                  placeholder="(optional)"
                  value={conn.properties.service || ''}
                  onChange={(e) => onPropChange('service', e.target.value)}
                />
              </div>
              <div className="field">
                <label className="field-label">AC Name</label>
                <input
                  className="field-input"
                  placeholder="(optional)"
                  value={conn.properties.acName || ''}
                  onChange={(e) => onPropChange('acName', e.target.value)}
                />
              </div>
            </div>
          </div>
        )}

        <div className="panel-section">
          <div className="panel-section-title">IP Configuration</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">IP Address</label>
              <input
                className="field-input"
                placeholder={isPppoe ? '203.0.113.42 (public)' : '10.0.0.1'}
                value={conn.properties.ip || ''}
                onChange={(e) => onPropChange('ip', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">Subnet</label>
              <input
                className="field-input"
                placeholder="255.255.255.0"
                value={conn.properties.subnet || ''}
                onChange={(e) => onPropChange('subnet', e.target.value)}
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Gateway</label>
              <input
                className="field-input"
                placeholder="203.0.113.1"
                value={conn.properties.gateway || ''}
                onChange={(e) => onPropChange('gateway', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">DNS</label>
              <input
                className="field-input"
                placeholder="8.8.8.8, 1.1.1.1"
                value={conn.properties.dns || ''}
                onChange={(e) => onPropChange('dns', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title">Performance</div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Bandwidth</label>
              <input
                className="field-input"
                placeholder="100 Mbps"
                value={conn.properties.bandwidth || ''}
                onChange={(e) => onPropChange('bandwidth', e.target.value)}
              />
            </div>
            <div className="field">
              <label className="field-label">VLAN</label>
              <input
                className="field-input"
                placeholder="10, 20, trunk…"
                value={conn.properties.vlan || ''}
                onChange={(e) => onPropChange('vlan', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="panel-section">
          <div className="panel-section-title">Actions</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="btn btn-sm" onClick={() => openConnectionEditor(conn.id)}>
              Edit lengkap
            </button>
            <button className="btn btn-sm btn-danger" onClick={() => {
              if (confirm(`Hapus koneksi ${meta.label} ini?`)) deleteConnection(conn.id);
            }}>
              <TrashIcon size={12} /> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main switcher ──────────────────────────────────────────────────────
export const PropertiesPanel = () => {
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const selectedConnectionId = useStore(s => s.selectedConnectionId);
  const loadDemo = useStore(s => s.loadDemo);

  if (selectedNodeId) {
    return <NodePropertiesPanel nodeId={selectedNodeId} />;
  }
  if (selectedConnectionId) {
    return <ConnectionPropertiesPanel connId={selectedConnectionId} />;
  }
  return <EmptyPanel onLoadDemo={loadDemo} />;
};
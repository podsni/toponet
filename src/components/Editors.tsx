import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { NODE_TYPE_META } from '../types';
import { CloseIcon, TrashIcon, NodeIcon } from '../lib/icons';

// ─── Generic modal wrapper ──────────────────────────────────────────────
interface ModalShellProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const ModalShell = ({ title, onClose, children, footer }: ModalShellProps) => (
  <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <div className="modal-header">
        <h3 className="modal-title">{title}</h3>
        <button className="btn btn-icon" onClick={onClose} aria-label="Close">
          <CloseIcon size={16} />
        </button>
      </div>
      <div className="modal-body">{children}</div>
      {footer && <div className="modal-footer">{footer}</div>}
    </div>
  </div>
);

// ─── Node Editor ────────────────────────────────────────────────────────
export const NodeEditor = ({ nodeId, onClose }: { nodeId: string; onClose: () => void }) => {
  const node = useStore(s => s.nodes.find(n => n.id === nodeId));
  const updateNode = useStore(s => s.updateNode);
  const deleteNode = useStore(s => s.deleteNode);

  const [label, setLabel] = useState(node?.label || '');
  const [type, setType] = useState(node?.type || 'router');
  const [ip, setIp] = useState(node?.properties.ip || '');
  const [mac, setMac] = useState(node?.properties.mac || '');
  const [vendor, setVendor] = useState(node?.properties.vendor || '');
  const [model, setModel] = useState(node?.properties.model || '');
  const [serial, setSerial] = useState(node?.properties.serial || '');
  const [location, setLocation] = useState(node?.properties.location || '');
  const [notes, setNotes] = useState(node?.properties.notes || '');

  useEffect(() => {
    if (node) {
      setLabel(node.label);
      setType(node.type);
      setIp(node.properties.ip || '');
      setMac(node.properties.mac || '');
      setVendor(node.properties.vendor || '');
      setModel(node.properties.model || '');
      setSerial(node.properties.serial || '');
      setLocation(node.properties.location || '');
      setNotes(node.properties.notes || '');
    }
  }, [nodeId]);

  if (!node) return null;
  const meta = NODE_TYPE_META[type];

  const handleSave = () => {
    updateNode(nodeId, {
      label,
      type,
      properties: {
        ip: ip || undefined,
        mac: mac || undefined,
        vendor: vendor || undefined,
        model: model || undefined,
        serial: serial || undefined,
        location: location || undefined,
        notes: notes || undefined,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm(`Hapus "${node.label}" dan semua koneksinya?`)) {
      deleteNode(nodeId);
      onClose();
    }
  };

  return (
    <ModalShell
      title={`Edit ${meta.label}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger" onClick={handleDelete}>
            <TrashIcon size={14} /> Hapus
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
        </>
      }
    >
      <div className="flex-row" style={{ marginBottom: 16, padding: 12, background: 'var(--bg-soft)', borderRadius: 'var(--radius-sm)' }}>
        <div style={{
          width: 40, height: 40, borderRadius: '50%',
          background: 'var(--surface)', border: '1px solid var(--border-strong)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: meta.color,
        }}>
          <NodeIcon type={type} size={22} color={meta.color} />
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>ID</div>
          <div style={{ fontFamily: 'monospace', fontSize: 12 }}>{node.id}</div>
        </div>
      </div>

      <div className="field">
        <label className="field-label">Label</label>
        <input className="field-input" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Device Type</label>
        <select className="field-select" value={type} onChange={(e) => setType(e.target.value as any)}>
          {(Object.keys(NODE_TYPE_META) as Array<keyof typeof NODE_TYPE_META>).map(k => (
            <option key={k} value={k}>{NODE_TYPE_META[k].label}</option>
          ))}
        </select>
      </div>

      <hr className="hairline" />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
        Network
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">IP Address</label>
          <input className="field-input" placeholder="192.168.1.1" value={ip} onChange={(e) => setIp(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">MAC</label>
          <input className="field-input" placeholder="00:11:22:33:44:55" value={mac} onChange={(e) => setMac(e.target.value)} />
        </div>
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Vendor</label>
          <input className="field-input" placeholder="TP-Link" value={vendor} onChange={(e) => setVendor(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Model</label>
          <input className="field-input" placeholder="Archer C7" value={model} onChange={(e) => setModel(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Serial Number</label>
        <input className="field-input" value={serial} onChange={(e) => setSerial(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Location</label>
        <input className="field-input" placeholder="Rack 2U, server room…" value={location} onChange={(e) => setLocation(e.target.value)} />
      </div>

      <div className="field">
        <label className="field-label">Notes</label>
        <textarea className="field-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </ModalShell>
  );
};

// ─── Connection Editor ──────────────────────────────────────────────────
export const ConnectionEditor = ({ connId, onClose }: { connId: string; onClose: () => void }) => {
  const conn = useStore(s => s.connections.find(c => c.id === connId));
  const updateConnection = useStore(s => s.updateConnection);
  const deleteConnection = useStore(s => s.deleteConnection);

  const [type, setType] = useState(conn?.type || 'lan');
  const [label, setLabel] = useState(conn?.label || '');
  const [username, setUsername] = useState(conn?.properties.username || '');
  const [password, setPassword] = useState(conn?.properties.password || '');
  const [service, setService] = useState(conn?.properties.service || '');
  const [acName, setAcName] = useState(conn?.properties.acName || '');
  const [ip, setIp] = useState(conn?.properties.ip || '');
  const [subnet, setSubnet] = useState(conn?.properties.subnet || '');
  const [gateway, setGateway] = useState(conn?.properties.gateway || '');
  const [dns, setDns] = useState(conn?.properties.dns || '');
  const [bandwidth, setBandwidth] = useState(conn?.properties.bandwidth || '');
  const [vlan, setVlan] = useState(conn?.properties.vlan || '');
  const [notes, setNotes] = useState(conn?.properties.notes || '');

  useEffect(() => {
    if (conn) {
      setType(conn.type);
      setLabel(conn.label || '');
      setUsername(conn.properties.username || '');
      setPassword(conn.properties.password || '');
      setService(conn.properties.service || '');
      setAcName(conn.properties.acName || '');
      setIp(conn.properties.ip || '');
      setSubnet(conn.properties.subnet || '');
      setGateway(conn.properties.gateway || '');
      setDns(conn.properties.dns || '');
      setBandwidth(conn.properties.bandwidth || '');
      setVlan(conn.properties.vlan || '');
      setNotes(conn.properties.notes || '');
    }
  }, [connId]);

  if (!conn) return null;
  const isPppoe = type === 'pppoe';

  const handleSave = () => {
    updateConnection(connId, {
      type,
      label: label || undefined,
      properties: {
        username: username || undefined,
        password: password || undefined,
        service: service || undefined,
        acName: acName || undefined,
        ip: ip || undefined,
        subnet: subnet || undefined,
        gateway: gateway || undefined,
        dns: dns || undefined,
        bandwidth: bandwidth || undefined,
        vlan: vlan || undefined,
        notes: notes || undefined,
      },
    });
    onClose();
  };

  const handleDelete = () => {
    if (confirm('Hapus koneksi ini?')) {
      deleteConnection(connId);
      onClose();
    }
  };

  return (
    <ModalShell
      title="Edit Connection"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger" onClick={handleDelete}>
            <TrashIcon size={14} /> Hapus
          </button>
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose}>Batal</button>
          <button className="btn btn-primary" onClick={handleSave}>Simpan</button>
        </>
      }
    >
      <div className="field">
        <label className="field-label">Connection Type</label>
        <select className="field-select" value={type} onChange={(e) => setType(e.target.value as any)}>
          <option value="pppoe">PPPoE (WAN dial-up)</option>
          <option value="static">Static IP</option>
          <option value="dhcp">DHCP</option>
          <option value="lan">LAN (Ethernet)</option>
          <option value="wifi">WiFi (802.11)</option>
          <option value="fiber">Fiber</option>
          <option value="vpn">VPN tunnel</option>
          <option value="serial">Serial / Console</option>
        </select>
      </div>

      <div className="field">
        <label className="field-label">Label (optional)</label>
        <input className="field-input" placeholder="WAN, LAN1, trunk…" value={label} onChange={(e) => setLabel(e.target.value)} />
      </div>

      {isPppoe && (
        <>
          <hr className="hairline" />
          <div className="pppoe-callout">
            <span className="pppoe-callout-icon">⚡</span>
            <div>
              <strong>PPPoE credentials.</strong> Username dan password untuk ISP dial-up.
              Password disimpan di localStorage browser saja.
            </div>
          </div>

          <div className="field">
            <label className="field-label">Username</label>
            <input className="field-input" placeholder="user@isp.com" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div className="field">
            <label className="field-label">Password</label>
            <input type="password" className="field-input" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <div className="field-row">
            <div className="field">
              <label className="field-label">Service Name</label>
              <input className="field-input" placeholder="(optional)" value={service} onChange={(e) => setService(e.target.value)} />
            </div>
            <div className="field">
              <label className="field-label">AC Name</label>
              <input className="field-input" placeholder="(optional)" value={acName} onChange={(e) => setAcName(e.target.value)} />
            </div>
          </div>
        </>
      )}

      <hr className="hairline" />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
        IP Configuration
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">IP Address</label>
          <input className="field-input" placeholder={isPppoe ? '203.0.113.42 (public)' : '10.0.0.1'} value={ip} onChange={(e) => setIp(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">Subnet</label>
          <input className="field-input" placeholder="255.255.255.0" value={subnet} onChange={(e) => setSubnet(e.target.value)} />
        </div>
      </div>
      <div className="field-row">
        <div className="field">
          <label className="field-label">Gateway</label>
          <input className="field-input" placeholder="203.0.113.1" value={gateway} onChange={(e) => setGateway(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">DNS</label>
          <input className="field-input" placeholder="8.8.8.8, 1.1.1.1" value={dns} onChange={(e) => setDns(e.target.value)} />
        </div>
      </div>

      <hr className="hairline" />
      <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600, marginBottom: 8 }}>
        Performance
      </div>

      <div className="field-row">
        <div className="field">
          <label className="field-label">Bandwidth</label>
          <input className="field-input" placeholder="100 Mbps" value={bandwidth} onChange={(e) => setBandwidth(e.target.value)} />
        </div>
        <div className="field">
          <label className="field-label">VLAN</label>
          <input className="field-input" placeholder="10, 20, trunk…" value={vlan} onChange={(e) => setVlan(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label className="field-label">Notes</label>
        <textarea className="field-textarea" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </ModalShell>
  );
};

// ─── Help Modal ─────────────────────────────────────────────────────────
export const HelpModal = ({ onClose }: { onClose: () => void }) => (
  <ModalShell title="Cara Pakai TopoNet" onClose={onClose}>
    <div className="help-content">
      <h4>Tambah Node</h4>
      <ul>
        <li>Pilih device di toolbar (Router, Modem, Switch, dll).</li>
        <li>Klik di canvas untuk menempatkan node.</li>
        <li>Klik tombol device yang sama lagi untuk batal.</li>
      </ul>

      <h4>Gerakan & Lihat</h4>
      <ul>
        <li><strong>Tarik</strong> node untuk pindahkan.</li>
        <li><strong>Tarik background</strong> dengan mouse atau satu jari untuk pan.</li>
        <li><strong>Scroll wheel</strong> atau <strong>pinch dua jari</strong> untuk zoom.</li>
        <li>Tombol <kbd>Reset</kbd> di toolbar untuk kembali ke posisi awal.</li>
      </ul>

      <h4>Hubungkan Node</h4>
      <ul>
        <li>Klik kanan pada node, atau klik tombol <em>Connect</em> di panel.</li>
        <li>Klik node target — koneksi default LAN dibuat.</li>
        <li>Edit tipe koneksi (PPPoE, WiFi, Fiber, dll) di panel kanan.</li>
      </ul>

      <h4>Edit Properti</h4>
      <ul>
        <li>Klik node / koneksi untuk lihat detail di panel kanan.</li>
        <li>Double-click atau klik <em>Edit lengkap</em> untuk form lengkap.</li>
        <li>Koneksi PPPoE menampilkan field username, password, IP publik, gateway, DNS.</li>
      </ul>

      <h4>Simpan & Export</h4>
      <ul>
        <li>Data tersimpan otomatis di <strong>localStorage</strong>.</li>
        <li>Export JSON untuk backup atau pindah device.</li>
        <li>Import JSON untuk restore.</li>
      </ul>

      <h4>Mobile</h4>
      <ul>
        <li>Satu jari drag node = pindahkan.</li>
        <li>Dua jari pinch = zoom. Dua jari drag = pan.</li>
        <li>Tap node = select. Tap background = deselect.</li>
      </ul>
    </div>
  </ModalShell>
);
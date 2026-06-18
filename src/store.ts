import { create } from 'zustand';
import type { NetworkNode, NetworkConnection, Viewport, NodeType, ConnectionType, TopologyMetadata } from './types';

const STORAGE_KEY = 'toponet:v1';

interface PersistedState {
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  metadata: TopologyMetadata;
}

interface AppState {
  // Data
  nodes: NetworkNode[];
  connections: NetworkConnection[];
  metadata: TopologyMetadata;

  // UI
  selectedNodeId: string | null;
  selectedConnectionId: string | null;
  connectingFromNodeId: string | null;
  pendingConnectSource: boolean;       // user tapped [Connect] in toolbar — next node tap becomes source
  editingNodeId: string | null;
  editingConnectionId: string | null;
  isAddingNode: NodeType | null;
  helpOpen: boolean;

  // Canvas
  viewport: Viewport;

  // Actions — nodes
  addNode: (type: NodeType, x: number, y: number) => string;
  updateNode: (id: string, updates: Partial<NetworkNode>) => void;
  moveNode: (id: string, x: number, y: number) => void;
  deleteNode: (id: string) => void;

  // Actions — connections
  addConnection: (sourceId: string, targetId: string, type?: ConnectionType) => string;
  updateConnection: (id: string, updates: Partial<NetworkConnection>) => void;
  deleteConnection: (id: string) => void;

  // Actions — UI
  selectNode: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  startConnecting: (nodeId: string) => void;
  completeConnecting: (targetNodeId: string) => void;
  cancelConnecting: () => void;
  setPendingConnectSource: (val: boolean) => void;
  openNodeEditor: (id: string) => void;
  openConnectionEditor: (id: string) => void;
  closeEditor: () => void;
  setAddingNode: (type: NodeType | null) => void;
  toggleHelp: () => void;

  // Canvas
  setViewport: (v: Partial<Viewport>) => void;
  pan: (dx: number, dy: number) => void;
  zoom: (factor: number, cx?: number, cy?: number) => void;
  resetViewport: () => void;

  // Persistence
  loadFromStorage: () => void;
  saveToStorage: () => void;
  importJson: (json: string) => boolean;
  exportJson: () => string;
  loadDemo: () => void;
  clearAll: () => void;
}

const newId = (prefix: string): string =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const defaultMetadata = (): TopologyMetadata => {
  const now = new Date().toISOString();
  return { name: 'My Network', description: '', createdAt: now, updatedAt: now };
};

const touchMetadata = (m: TopologyMetadata): TopologyMetadata => ({
  ...m,
  updatedAt: new Date().toISOString(),
});

export const useStore = create<AppState>((set, get) => ({
  nodes: [],
  connections: [],
  metadata: defaultMetadata(),

  selectedNodeId: null,
  selectedConnectionId: null,
  connectingFromNodeId: null,
  pendingConnectSource: false,
  editingNodeId: null,
  editingConnectionId: null,
  isAddingNode: null,
  helpOpen: false,

  viewport: { x: 0, y: 0, zoom: 1 },

  addNode: (type, x, y) => {
    const id = newId('n');
    const node: NetworkNode = {
      id,
      type,
      label: `${type.charAt(0).toUpperCase()}${type.slice(1)} ${get().nodes.filter(n => n.type === type).length + 1}`,
      x,
      y,
      properties: {},
    };
    set(state => ({
      nodes: [...state.nodes, node],
      selectedNodeId: id,
      isAddingNode: null,
      metadata: touchMetadata(state.metadata),
    }));
    get().saveToStorage();
    return id;
  },

  updateNode: (id, updates) => {
    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? { ...n, ...updates } : n)),
      metadata: touchMetadata(state.metadata),
    }));
    get().saveToStorage();
  },

  moveNode: (id, x, y) => {
    set(state => ({
      nodes: state.nodes.map(n => (n.id === id ? { ...n, x, y } : n)),
    }));
    // Don't save on every move — save on pointer up instead
  },

  deleteNode: (id) => {
    set(state => ({
      nodes: state.nodes.filter(n => n.id !== id),
      connections: state.connections.filter(c => c.sourceId !== id && c.targetId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
      editingNodeId: state.editingNodeId === id ? null : state.editingNodeId,
      metadata: touchMetadata(state.metadata),
    }));
    get().saveToStorage();
  },

  addConnection: (sourceId, targetId, type = 'lan') => {
    if (sourceId === targetId) return '';
    const exists = get().connections.find(
      c => (c.sourceId === sourceId && c.targetId === targetId) ||
           (c.sourceId === targetId && c.targetId === sourceId),
    );
    if (exists) return exists.id;
    const id = newId('c');
    const conn: NetworkConnection = {
      id,
      sourceId,
      targetId,
      type,
      properties: {},
    };
    set(state => ({
      connections: [...state.connections, conn],
      connectingFromNodeId: null,
      selectedConnectionId: id,
      metadata: touchMetadata(state.metadata),
    }));
    get().saveToStorage();
    return id;
  },

  updateConnection: (id, updates) => {
    set(state => ({
      connections: state.connections.map(c => (c.id === id ? { ...c, ...updates } : c)),
      metadata: touchMetadata(state.metadata),
    }));
    get().saveToStorage();
  },

  deleteConnection: (id) => {
    set(state => ({
      connections: state.connections.filter(c => c.id !== id),
      selectedConnectionId: state.selectedConnectionId === id ? null : state.selectedConnectionId,
      editingConnectionId: state.editingConnectionId === id ? null : state.editingConnectionId,
      metadata: touchMetadata(state.metadata),
    }));
    get().saveToStorage();
  },

  selectNode: (id) => set({ selectedNodeId: id, selectedConnectionId: null }),
  selectConnection: (id) => set({ selectedConnectionId: id, selectedNodeId: null }),
  startConnecting: (nodeId) => set({ connectingFromNodeId: nodeId }),
  completeConnecting: (targetNodeId) => {
    const from = get().connectingFromNodeId;
    if (from && from !== targetNodeId) {
      get().addConnection(from, targetNodeId);
    } else {
      set({ connectingFromNodeId: null });
    }
  },
  cancelConnecting: () => set({ connectingFromNodeId: null }),
  setPendingConnectSource: (val) => set({
    pendingConnectSource: val,
    isAddingNode: val ? null : get().isAddingNode, // cancel add mode if starting connect
  }),
  openNodeEditor: (id) => set({ editingNodeId: id, editingConnectionId: null }),
  openConnectionEditor: (id) => set({ editingConnectionId: id, editingNodeId: null }),
  closeEditor: () => set({ editingNodeId: null, editingConnectionId: null }),
  setAddingNode: (type) => set({ isAddingNode: type }),
  toggleHelp: () => set(state => ({ helpOpen: !state.helpOpen })),

  setViewport: (v) => set(state => ({ viewport: { ...state.viewport, ...v } })),
  pan: (dx, dy) => set(state => ({
    viewport: { ...state.viewport, x: state.viewport.x + dx, y: state.viewport.y + dy },
  })),
  zoom: (factor, cx, cy) => {
    const { viewport } = get();
    const newZoom = Math.max(0.25, Math.min(3, viewport.zoom * factor));
    if (cx !== undefined && cy !== undefined) {
      // Zoom around point (cx, cy) in world coordinates
      const k = newZoom / viewport.zoom;
      set({
        viewport: {
          zoom: newZoom,
          x: cx - (cx - viewport.x) * k,
          y: cy - (cy - viewport.y) * k,
        },
      });
    } else {
      set({ viewport: { ...viewport, zoom: newZoom } });
    }
  },
  resetViewport: () => set({ viewport: { x: 0, y: 0, zoom: 1 } }),

  saveToStorage: () => {
    try {
      const data: PersistedState = {
        nodes: get().nodes,
        connections: get().connections,
        metadata: get().metadata,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save', e);
    }
  },

  loadFromStorage: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const data = JSON.parse(raw) as PersistedState;
      if (data.nodes && data.connections) {
        set({
          nodes: data.nodes,
          connections: data.connections,
          metadata: data.metadata || defaultMetadata(),
        });
      }
    } catch (e) {
      console.error('Failed to load', e);
    }
  },

  importJson: (json) => {
    try {
      const data = JSON.parse(json) as PersistedState;
      if (!Array.isArray(data.nodes) || !Array.isArray(data.connections)) return false;
      set({
        nodes: data.nodes,
        connections: data.connections,
        metadata: data.metadata || defaultMetadata(),
        selectedNodeId: null,
        selectedConnectionId: null,
      });
      get().saveToStorage();
      return true;
    } catch {
      return false;
    }
  },

  exportJson: () => {
    const data: PersistedState = {
      nodes: get().nodes,
      connections: get().connections,
      metadata: get().metadata,
    };
    return JSON.stringify(data, null, 2);
  },

  loadDemo: () => {
    const now = new Date().toISOString();
    set({
      nodes: [
        { id: 'demo-cloud',   type: 'cloud',    label: 'Internet',       x: 0,   y: 0,   properties: { notes: 'Public internet' } },
        { id: 'demo-modem',   type: 'modem',    label: 'ISP Modem',      x: 200, y: 0,   properties: { vendor: 'ZTE', model: 'F660' } },
        { id: 'demo-router',  type: 'router',   label: 'Main Router',    x: 400, y: 0,   properties: { ip: '192.168.1.1', vendor: 'TP-Link', model: 'Archer C7' } },
        { id: 'demo-switch',  type: 'switch',   label: 'Office Switch',  x: 600, y: 0,   properties: { ip: '192.168.1.2', vendor: 'TP-Link', model: 'TL-SG1024' } },
        { id: 'demo-ap',      type: 'ap',       label: 'WiFi AP',        x: 600, y: -160, properties: { ip: '192.168.1.3', vendor: 'Ubiquiti', model: 'UAP-AC-LR' } },
        { id: 'demo-server',  type: 'server',   label: 'Home Server',    x: 600, y: 160, properties: { ip: '192.168.1.10', vendor: 'Dell', model: 'PowerEdge T30' } },
        { id: 'demo-nas',     type: 'nas',      label: 'NAS',            x: 800, y: 160, properties: { ip: '192.168.1.11', vendor: 'Synology', model: 'DS220+' } },
        { id: 'demo-pc',      type: 'pc',       label: 'Workstation',    x: 800, y: 0,   properties: { ip: '192.168.1.20' } },
        { id: 'demo-laptop',  type: 'laptop',   label: 'Laptop',         x: 800, y: -160, properties: { ip: '192.168.1.30' } },
        { id: 'demo-phone',   type: 'phone',    label: 'Phone',          x: 800, y: 80,  properties: { ip: '192.168.1.40' } },
      ],
      connections: [
        { id: 'demo-c1', sourceId: 'demo-cloud',  targetId: 'demo-modem',  type: 'fiber',  properties: { bandwidth: '1 Gbps' } },
        { id: 'demo-c2', sourceId: 'demo-modem',  targetId: 'demo-router', type: 'pppoe',  label: 'WAN', properties: { username: 'user@isp', ip: '203.0.113.42', gateway: '203.0.113.1', dns: '8.8.8.8, 1.1.1.1', bandwidth: '100 Mbps' } },
        { id: 'demo-c3', sourceId: 'demo-router', targetId: 'demo-switch', type: 'lan',    properties: { bandwidth: '1 Gbps' } },
        { id: 'demo-c4', sourceId: 'demo-router', targetId: 'demo-ap',     type: 'lan',    properties: { bandwidth: '1 Gbps' } },
        { id: 'demo-c5', sourceId: 'demo-switch', targetId: 'demo-server', type: 'lan',    properties: { bandwidth: '1 Gbps' } },
        { id: 'demo-c6', sourceId: 'demo-switch', targetId: 'demo-pc',     type: 'lan',    properties: { bandwidth: '1 Gbps' } },
        { id: 'demo-c7', sourceId: 'demo-ap',     targetId: 'demo-laptop', type: 'wifi',   properties: { bandwidth: '300 Mbps' } },
        { id: 'demo-c8', sourceId: 'demo-ap',     targetId: 'demo-phone',  type: 'wifi',   properties: { bandwidth: '150 Mbps' } },
        { id: 'demo-c9', sourceId: 'demo-server', targetId: 'demo-nas',    type: 'lan',    properties: { bandwidth: '1 Gbps' } },
      ],
      metadata: { name: 'Home Network', description: 'Sample home topology with PPPoE WAN link', createdAt: now, updatedAt: now },
      selectedNodeId: null,
      selectedConnectionId: null,
    });
    get().saveToStorage();
  },

  clearAll: () => {
    set({
      nodes: [],
      connections: [],
      metadata: defaultMetadata(),
      selectedNodeId: null,
      selectedConnectionId: null,
      editingNodeId: null,
      editingConnectionId: null,
    });
    get().saveToStorage();
  },
}));
// TopoNet type definitions
// All device metadata, connection info, and PPPoE tracking

export type NodeType =
  | 'router'
  | 'modem'
  | 'switch'
  | 'ap'
  | 'server'
  | 'pc'
  | 'laptop'
  | 'phone'
  | 'cloud'
  | 'firewall'
  | 'printer'
  | 'nas'
  | 'camera';

export interface NetworkNode {
  id: string;
  type: NodeType;
  label: string;
  x: number;
  y: number;
  // Visual size (radius in canvas units)
  size?: number;
  properties: {
    ip?: string;
    mac?: string;
    vendor?: string;
    model?: string;
    serial?: string;
    location?: string;
    notes?: string;
    [key: string]: string | undefined;
  };
}

export type ConnectionType =
  | 'pppoe'      // PPPoE dial-up (typically WAN from modem)
  | 'static'     // Static IP link
  | 'dhcp'       // DHCP-allocated link
  | 'lan'        // Wired Ethernet
  | 'wifi'       // Wireless
  | 'fiber'      // Fiber optic
  | 'vpn'        // VPN tunnel
  | 'serial';    // Serial/console

export interface NetworkConnection {
  id: string;
  sourceId: string;
  targetId: string;
  type: ConnectionType;
  label?: string;
  properties: {
    // PPPoE specific
    username?: string;
    password?: string;
    service?: string;        // PPPoE service name
    acName?: string;         // Access concentrator

    // IP info (PPPoE / static)
    ip?: string;
    subnet?: string;
    gateway?: string;
    dns?: string;

    // Performance
    bandwidth?: string;
    latency?: string;

    // General
    vlan?: string;
    notes?: string;
    [key: string]: string | undefined;
  };
}

export interface TopologyMetadata {
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export const NODE_TYPE_META: Record<NodeType, {
  label: string;
  icon: string;
  category: 'wan' | 'infrastructure' | 'endpoint' | 'service';
  defaultIp?: string;
  color: string;
}> = {
  router:    { label: 'Router',    icon: 'router',    category: 'infrastructure', color: '#7A5C36' },
  modem:     { label: 'Modem',     icon: 'modem',     category: 'wan',            color: '#C49856' },
  switch:    { label: 'Switch',    icon: 'switch',    category: 'infrastructure', color: '#8B6F47' },
  ap:        { label: 'Access Pt', icon: 'ap',        category: 'infrastructure', color: '#A67C52' },
  server:    { label: 'Server',    icon: 'server',    category: 'service',        color: '#5C4530' },
  pc:        { label: 'PC',        icon: 'pc',        category: 'endpoint',       color: '#7A5C36' },
  laptop:    { label: 'Laptop',    icon: 'laptop',    category: 'endpoint',       color: '#8B6F47' },
  phone:     { label: 'Phone',     icon: 'phone',     category: 'endpoint',       color: '#A67C52' },
  cloud:     { label: 'Cloud',     icon: 'cloud',     category: 'wan',            color: '#C49856' },
  firewall:  { label: 'Firewall',  icon: 'firewall',  category: 'infrastructure', color: '#5C4530' },
  printer:   { label: 'Printer',   icon: 'printer',   category: 'endpoint',       color: '#8B6F47' },
  nas:       { label: 'NAS',       icon: 'nas',       category: 'service',        color: '#5C4530' },
  camera:    { label: 'Camera',    icon: 'camera',    category: 'endpoint',       color: '#7A5C36' },
};

export const CONNECTION_TYPE_META: Record<ConnectionType, {
  label: string;
  description: string;
  color: string;
  dashArray?: string;
  width: number;
  icon: string;
}> = {
  pppoe:  { label: 'PPPoE',    description: 'PPP over Ethernet — typically WAN dial-up', color: '#C49856', width: 3,    icon: 'pppoe' },
  static: { label: 'Static',   description: 'Static IP address link',                   color: '#7A5C36', width: 2.5,  icon: 'static' },
  dhcp:   { label: 'DHCP',     description: 'Dynamic IP allocation',                   color: '#8B6F47', width: 2,    dashArray: '6 4', icon: 'dhcp' },
  lan:    { label: 'LAN',      description: 'Wired Ethernet',                          color: '#7A5C36', width: 2,    icon: 'lan' },
  wifi:   { label: 'WiFi',     description: 'Wireless 802.11',                         color: '#A67C52', width: 2,    dashArray: '2 4', icon: 'wifi' },
  fiber:  { label: 'Fiber',    description: 'Fiber optic link',                        color: '#5C4530', width: 3.5,  icon: 'fiber' },
  vpn:    { label: 'VPN',      description: 'Encrypted tunnel',                        color: '#8B6F47', width: 2.5,  dashArray: '8 3 2 3', icon: 'vpn' },
  serial: { label: 'Serial',   description: 'Serial / console cable',                  color: '#5C4530', width: 1.5,  dashArray: '1 3', icon: 'serial' },
};
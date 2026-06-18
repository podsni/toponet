import type { NetworkNode, NetworkConnection } from '../types';

// Download a Blob as a file
const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const exportJson = (
  nodes: NetworkNode[],
  connections: NetworkConnection[],
  metadata: { name: string; description?: string; createdAt: string; updatedAt: string },
) => {
  const json = JSON.stringify({ nodes, connections, metadata }, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const safeName = (metadata.name || 'topology').replace(/[^a-z0-9_-]+/gi, '_');
  downloadBlob(blob, `${safeName}-${new Date().toISOString().slice(0, 10)}.json`);
};

export const importJsonFile = (): Promise<{ nodes: NetworkNode[]; connections: NetworkConnection[]; metadata: any } | null> => {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json,.json';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) { resolve(null); return; }
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result as string);
          if (Array.isArray(data.nodes) && Array.isArray(data.connections)) {
            resolve(data);
          } else {
            resolve(null);
          }
        } catch {
          resolve(null);
        }
      };
      reader.onerror = () => resolve(null);
      reader.readAsText(file);
    };
    input.click();
  });
};

// Export the visible SVG + nodes as an SVG file (no rasterization — stays sharp)
export const exportSvg = (
  nodes: NetworkNode[],
  connections: NetworkConnection[],
  _viewport: { x: number; y: number; zoom: number },
) => {
  // Compute bounding box of all nodes (with padding)
  const padding = 80;
  if (nodes.length === 0) return;
  const xs = nodes.map(n => n.x);
  const ys = nodes.map(n => n.y);
  const minX = Math.min(...xs) - padding;
  const minY = Math.min(...ys) - padding;
  const maxX = Math.max(...xs) + padding;
  const maxY = Math.max(...ys) + padding;
  const width = maxX - minX;
  const height = maxY - minY;

  // We render a simplified SVG without viewport transform — absolute coords
  const nodeSvgs = nodes.map(n => {
    const r = 26;
    return `
  <g transform="translate(${n.x - minX}, ${n.y - minY})">
    <circle r="${r}" fill="#FBF7EE" stroke="#7A5C36" stroke-width="1.5"/>
    <text y="4" text-anchor="middle" font-family="Inter Tight, sans-serif" font-size="11" font-weight="600" fill="#7A5C36">${escapeXml(n.label)}</text>
    ${n.properties.ip ? `<text y="44" text-anchor="middle" font-family="Inter Tight, sans-serif" font-size="10" fill="#948368">${escapeXml(n.properties.ip)}</text>` : ''}
  </g>`;
  }).join('\n');

  const connSvgs = connections.map(c => {
    const s = nodes.find(n => n.id === c.sourceId);
    const t = nodes.find(n => n.id === c.targetId);
    if (!s || !t) return '';
    const x1 = s.x - minX, y1 = s.y - minY;
    const x2 = t.x - minX, y2 = t.y - minY;
    const color = ({ pppoe: '#C49856', static: '#7A5C36', dhcp: '#8B6F47', lan: '#7A5C36', wifi: '#A67C52', fiber: '#5C4530', vpn: '#8B6F47', serial: '#5C4530' } as Record<string, string>)[c.type];
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="2" opacity="0.85"/>`;
  }).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} ${height}" width="${width}" height="${height}">
  <rect width="${width}" height="${height}" fill="#F5EFE3"/>
  ${connSvgs}
  ${nodeSvgs}
</svg>`;
  const blob = new Blob([svg], { type: 'image/svg+xml' });
  downloadBlob(blob, `topology-${new Date().toISOString().slice(0, 10)}.svg`);
};

const escapeXml = (s: string): string =>
  s.replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' }[c] || c));
import { useRef, useState, useCallback, useEffect, useMemo, memo } from 'react';
import { useStore } from '../store';
import { CONNECTION_TYPE_META, NODE_TYPE_META } from '../types';
import type { NetworkConnection, NetworkNode } from '../types';
import { ConnectionIcon, NodeIcon } from '../lib/icons';

// ─── Helpers ────────────────────────────────────────────────────────────
const buildPath = (x1: number, y1: number, x2: number, y2: number): string => {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 1) return `M ${x1} ${y1} L ${x2} ${y2}`;
  const curve = Math.min(dist * 0.2, 60);
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const px = -dy / dist;
  const py = dx / dist;
  return `M ${x1} ${y1} Q ${mx + px * curve} ${my + py * curve} ${x2} ${y2}`;
};

// ─── Connection (SVG) ──────────────────────────────────────────────────
interface ConnectionProps {
  conn: NetworkConnection;
  source: NetworkNode;
  target: NetworkNode;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}

const Connection = ({ conn, source, target, selected, onSelect, onOpen }: ConnectionProps) => {
  const meta = CONNECTION_TYPE_META[conn.type];
  const isPppoe = conn.type === 'pppoe';
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const path = buildPath(source.x, source.y, target.x, target.y);

  return (
    <g
      style={{ cursor: 'pointer' }}
      onPointerDown={(e) => e.stopPropagation()}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(conn.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen(conn.id);
      }}
    >
      <path d={path} stroke="transparent" strokeWidth={20} fill="none" />
      <path
        className={`connection-line ${isPppoe ? 'is-pppoe' : ''} ${selected ? 'selected' : ''}`}
        d={path}
        stroke={meta.color}
        strokeWidth={selected ? meta.width + 1.5 : meta.width}
        strokeDasharray={meta.dashArray}
        strokeLinecap="round"
        opacity={selected ? 1 : 0.85}
      />
      <g transform={`translate(${midX}, ${midY})`} style={{ pointerEvents: 'none' }}>
        <circle
          r={isPppoe ? 12 : 10}
          fill="var(--bg)"
          stroke={meta.color}
          strokeWidth="1.5"
        />
        <g transform="translate(-7, -7)">
          <ConnectionIcon type={conn.type} size={14} color={meta.color} />
        </g>
      </g>
      {(conn.label || (isPppoe && conn.properties.username)) && (
        <text
          x={midX}
          y={midY - 22}
          textAnchor="middle"
          className="connection-label"
        >
          {conn.label || conn.properties.username || meta.label}
        </text>
      )}
    </g>
  );
};

// ─── Node (memoized for perf) ───────────────────────────────────────────
interface NodeItemProps {
  node: NetworkNode;
  selected: boolean;
  dragging: boolean;
  isConnectingSource: boolean;
  isConnectTarget: boolean;
  hasPppoe: boolean;
  onPointerDown: (e: React.PointerEvent, node: NetworkNode) => void;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onConnect: (id: string) => void;
}

const NODE_SIZE = 52;

const NodeItemBase = ({
  node,
  selected,
  dragging,
  isConnectingSource,
  isConnectTarget,
  hasPppoe,
  onPointerDown,
  onSelect,
  onOpen,
  onConnect,
}: NodeItemProps) => {
  const meta = NODE_TYPE_META[node.type];
  const ip = node.properties.ip;

  const style: React.CSSProperties = {
    position: 'absolute',
    left: node.x - NODE_SIZE / 2,
    top: node.y - NODE_SIZE / 2,
    width: NODE_SIZE,
    pointerEvents: 'auto',
    transform: dragging ? 'scale(1.08)' : 'scale(1)',
    transition: dragging ? 'none' : 'transform 0.15s var(--ease)',
    zIndex: dragging || selected ? 50 : 'auto',
    willChange: dragging ? 'left, top' : 'auto',
  };

  const className = [
    'node',
    selected && 'selected',
    dragging && 'dragging',
    isConnectingSource && 'connecting-source',
    isConnectTarget && 'connect-target',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      style={style}
      onPointerDown={(e) => onPointerDown(e, node)}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(node.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen(node.id);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onConnect(node.id);
      }}
    >
      <div className="node-body" style={{ color: meta.color }}>
        <NodeIcon type={node.type} size={24} color={meta.color} />
        {hasPppoe && <div className="node-pppoe-badge" title="Connected via PPPoE">P</div>}
      </div>
      <div className="node-label">{node.label}</div>
      {ip && <div className="node-sublabel">{ip}</div>}
    </div>
  );
};

// React.memo with custom comparison — only re-render when THIS node's
// relevant props change (not when any other node moves)
const NodeItem = memo(NodeItemBase, (prev, next) => {
  return (
    prev.node.x === next.node.x &&
    prev.node.y === next.node.y &&
    prev.node.label === next.node.label &&
    prev.node.type === next.node.type &&
    prev.node.properties.ip === next.node.properties.ip &&
    prev.selected === next.selected &&
    prev.dragging === next.dragging &&
    prev.isConnectingSource === next.isConnectingSource &&
    prev.isConnectTarget === next.isConnectTarget &&
    prev.hasPppoe === next.hasPppoe &&
    prev.onPointerDown === next.onPointerDown &&
    prev.onSelect === next.onSelect &&
    prev.onOpen === next.onOpen &&
    prev.onConnect === next.onConnect
  );
});

// ─── Main canvas ────────────────────────────────────────────────────────
export const TopologyCanvas = () => {
  const nodes = useStore(s => s.nodes);
  const connections = useStore(s => s.connections);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const selectedConnectionId = useStore(s => s.selectedConnectionId);
  const connectingFromNodeId = useStore(s => s.connectingFromNodeId);
  const pendingConnectSource = useStore(s => s.pendingConnectSource);
  const isAddingNode = useStore(s => s.isAddingNode);
  const viewport = useStore(s => s.viewport);
  const moveNode = useStore(s => s.moveNode);
  const selectNode = useStore(s => s.selectNode);
  const selectConnection = useStore(s => s.selectConnection);
  const completeConnecting = useStore(s => s.completeConnecting);
  const startConnecting = useStore(s => s.startConnecting);
  const addNode = useStore(s => s.addNode);
  const setViewport = useStore(s => s.setViewport);
  const setPendingConnectSource = useStore(s => s.setPendingConnectSource);
  const cancelConnecting = useStore(s => s.cancelConnecting);
  const openNodeEditor = useStore(s => s.openNodeEditor);
  const openConnectionEditor = useStore(s => s.openConnectionEditor);
  const saveToStorage = useStore(s => s.saveToStorage);
  const loadDemo = useStore(s => s.loadDemo);

  const wrapRef = useRef<HTMLDivElement>(null);

  // ─── Refs for drag state (no React re-renders during drag) ────────
  const dragRef = useRef<{
    type: 'node' | 'pan';
    pointerId: number;
    nodeId?: string;
    startClientX: number;
    startClientY: number;
    startNodeX?: number;
    startNodeY?: number;
    startViewportX?: number;
    startViewportY?: number;
    zoom: number;
  } | null>(null);

  // Track which node is currently being dragged (for visual feedback)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  // rAF batching for drag updates
  const rafRef = useRef<number | null>(null);
  const pendingMoveRef = useRef<{ clientX: number; clientY: number } | null>(null);

  // Click-vs-drag discrimination — don't fire select on small movements
  const downAtRef = useRef<{ x: number; y: number; t: number; nodeId: string } | null>(null);

  // Stable callbacks ──────────────────────────────────────────────────
  const handleNodePointerDown = useCallback((e: React.PointerEvent, node: NetworkNode) => {
    e.stopPropagation();

    // Connect-mode: tap node = source OR target
    if (pendingConnectSource) {
      startConnecting(node.id);
      setPendingConnectSource(false);
      return;
    }
    if (connectingFromNodeId) {
      completeConnecting(node.id);
      return;
    }

    // Set pointer capture so we get all subsequent moves even if finger leaves the node
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // some browsers throw if not directly attached; ignore
    }

    dragRef.current = {
      type: 'node',
      pointerId: e.pointerId,
      nodeId: node.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
      zoom: viewport.zoom,
    };
    downAtRef.current = { x: e.clientX, y: e.clientY, t: Date.now(), nodeId: node.id };
    selectNode(node.id);
  }, [pendingConnectSource, connectingFromNodeId, startConnecting, setPendingConnectSource, completeConnecting, viewport.zoom, selectNode]);

  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    const target = e.target as HTMLElement;
    if (target.closest('.node')) return;
    if (target.closest('.connection-line, g[style*="cursor: pointer"]')) return;

    // Cancel connect-mode by tapping empty
    if (pendingConnectSource) {
      setPendingConnectSource(false);
      return;
    }
    if (connectingFromNodeId) {
      cancelConnecting();
      return;
    }

    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    dragRef.current = {
      type: 'pan',
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startViewportX: viewport.x,
      startViewportY: viewport.y,
      zoom: viewport.zoom,
    };
  }, [pendingConnectSource, connectingFromNodeId, setPendingConnectSource, cancelConnecting, viewport.x, viewport.y, viewport.zoom]);

  // ─── rAF-batched pointer move (no per-event React re-render) ──────
  useEffect(() => {
    const flushMove = () => {
      rafRef.current = null;
      const pending = pendingMoveRef.current;
      if (!pending) return;
      pendingMoveRef.current = null;
      const ds = dragRef.current;
      if (!ds) return;

      if (ds.type === 'pan' && ds.startViewportX !== undefined && ds.startViewportY !== undefined) {
        setViewport({
          x: ds.startViewportX + (pending.clientX - ds.startClientX),
          y: ds.startViewportY + (pending.clientY - ds.startClientY),
        });
      } else if (ds.type === 'node' && ds.nodeId && ds.startNodeX !== undefined && ds.startNodeY !== undefined) {
        const dx = (pending.clientX - ds.startClientX) / ds.zoom;
        const dy = (pending.clientY - ds.startClientY) / ds.zoom;
        moveNode(ds.nodeId, ds.startNodeX + dx, ds.startNodeY + dy);
      }
    };

    const onMove = (e: PointerEvent) => {
      const ds = dragRef.current;
      if (!ds || e.pointerId !== ds.pointerId) return;
      pendingMoveRef.current = { clientX: e.clientX, clientY: e.clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushMove);
      }
    };

    const onUp = (e: PointerEvent) => {
      const ds = dragRef.current;
      if (!ds || e.pointerId !== ds.pointerId) return;
      // Flush any pending move
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
        flushMove();
      }
      if (ds.type === 'node') {
        saveToStorage();
        setDraggingNodeId(null);
      }
      dragRef.current = null;
      downAtRef.current = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [moveNode, setViewport, saveToStorage]);

  // Sync the dragging visual state when a node drag begins
  useEffect(() => {
    const ds = dragRef.current;
    if (ds && ds.type === 'node' && ds.nodeId) {
      setDraggingNodeId(ds.nodeId);
    }
  }, [draggingNodeId]); // intentionally narrow — fires when setDraggingNodeId changes

  // ─── Click handler: add node OR cancel pending OR deselect ────────
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.node')) return;
    if (target.closest('g[style*="cursor: pointer"]')) return;

    // If a node drag just finished (small movement), treat as click → already selected in pointerdown
    // For deselect: only fire if we didn't just finish a pan
    if (dragRef.current === null) {
      if (isAddingNode) {
        const rect = wrapRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
        const y = (e.clientY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
        addNode(isAddingNode, x, y);
      } else {
        selectNode(null);
        selectConnection(null);
      }
    }
  }, [isAddingNode, addNode, selectNode, selectConnection, viewport.x, viewport.y, viewport.zoom]);

  // ─── Wheel zoom ───────────────────────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const cx = (e.clientX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
      const cy = (e.clientY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newZoom = Math.max(0.25, Math.min(3, viewport.zoom * factor));
      const k = newZoom / viewport.zoom;
      setViewport({
        zoom: newZoom,
        x: cx - (cx - viewport.x) * k,
        y: cy - (cy - viewport.y) * k,
      });
    };
    wrap.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', handleWheel);
  }, [viewport.x, viewport.y, viewport.zoom, setViewport]);

  // ─── Touch pinch + two-finger pan ─────────────────────────────────
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    let lastPinchDist = 0;
    let lastCenter = { x: 0, y: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        lastPinchDist = Math.sqrt(dx * dx + dy * dy);
        lastCenter = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dx = t1.clientX - t2.clientX;
        const dy = t1.clientY - t2.clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

        if (lastPinchDist > 0 && dist > 0) {
          const factor = dist / lastPinchDist;
          const rect = wrap.getBoundingClientRect();
          const cx = (center.x - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
          const cy = (center.y - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
          const newZoom = Math.max(0.25, Math.min(3, viewport.zoom * factor));
          const k = newZoom / viewport.zoom;
          setViewport({
            zoom: newZoom,
            x: cx - (cx - viewport.x) * k,
            y: cy - (cy - viewport.y) * k,
          });
        }
        if (lastCenter.x > 0 || lastCenter.y > 0) {
          const panDx = center.x - lastCenter.x;
          const panDy = center.y - lastCenter.y;
          setViewport({ x: viewport.x + panDx, y: viewport.y + panDy });
        }
        lastPinchDist = dist;
        lastCenter = center;
      }
    };

    const onTouchEnd = () => {
      lastPinchDist = 0;
      lastCenter = { x: 0, y: 0 };
    };

    wrap.addEventListener('touchstart', onTouchStart, { passive: true });
    wrap.addEventListener('touchmove', onTouchMove, { passive: false });
    wrap.addEventListener('touchend', onTouchEnd, { passive: true });
    wrap.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      wrap.removeEventListener('touchstart', onTouchStart);
      wrap.removeEventListener('touchmove', onTouchMove);
      wrap.removeEventListener('touchend', onTouchEnd);
      wrap.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [viewport.x, viewport.y, viewport.zoom, setViewport]);

  // Memo: which node IDs are endpoints of PPPoE connections
  const nodeIdsWithPppoe = useMemo(() => {
    const s = new Set<string>();
    connections.forEach(c => {
      if (c.type === 'pppoe') {
        s.add(c.sourceId);
        s.add(c.targetId);
      }
    });
    return s;
  }, [connections]);

  // ─── Render ───────────────────────────────────────────────────────
  const transform = `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`;
  const canvasClass = [
    'canvas-wrap',
    isAddingNode && 'canvas-add-mode',
    pendingConnectSource && 'canvas-connect-mode',
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={wrapRef}
      className={canvasClass}
      onPointerDown={handleCanvasPointerDown}
      onClick={handleCanvasClick}
      onContextMenu={(e) => {
        if (!(e.target as HTMLElement).closest('.node')) e.preventDefault();
      }}
    >
      <div className="canvas-grid" />

      <svg className="canvas-svg">
        <g transform={transform}>
          {connections.map(conn => {
            const source = nodes.find(n => n.id === conn.sourceId);
            const target = nodes.find(n => n.id === conn.targetId);
            if (!source || !target) return null;
            return (
              <Connection
                key={conn.id}
                conn={conn}
                source={source}
                target={target}
                selected={selectedConnectionId === conn.id}
                onSelect={selectConnection}
                onOpen={openConnectionEditor}
              />
            );
          })}
        </g>
      </svg>

      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 0,
          height: 0,
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`,
          transformOrigin: 'center',
        }}
      >
        {nodes.map(node => (
          <NodeItem
            key={node.id}
            node={node}
            selected={selectedNodeId === node.id}
            dragging={draggingNodeId === node.id}
            isConnectingSource={connectingFromNodeId === node.id}
            isConnectTarget={!!connectingFromNodeId && connectingFromNodeId !== node.id && !pendingConnectSource}
            hasPppoe={nodeIdsWithPppoe.has(node.id)}
            onPointerDown={handleNodePointerDown}
            onSelect={selectNode}
            onOpen={openNodeEditor}
            onConnect={startConnecting}
          />
        ))}
      </div>

      {nodes.length === 0 && (
        <div className="canvas-empty">
          <div style={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'var(--bg-soft)', border: '1.5px dashed var(--border-strong)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', marginBottom: 8,
          }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="8" cy="8" r="3" />
              <circle cx="16" cy="8" r="3" />
              <circle cx="12" cy="18" r="3" />
              <path d="M8 8 L16 8 M8 8 L12 18 M16 8 L12 18" opacity="0.5" />
            </svg>
          </div>
          <h3>Mulai topologi jaringanmu</h3>
          <p>
            Pilih device di toolbar kiri, atau klik tombol di bawah untuk memuat contoh jaringan dengan PPPoE.
            Tarik node untuk memindahkan. Tap node lalu tap "Connect" untuk menghubungkan.
          </p>
          <button className="btn btn-primary" onClick={loadDemo}>
            Muat contoh jaringan
          </button>
        </div>
      )}

      <div className="canvas-zoom-badge">{Math.round(viewport.zoom * 100)}%</div>
    </div>
  );
};
import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { CONNECTION_TYPE_META, NODE_TYPE_META } from '../types';
import type { NetworkConnection, NetworkNode } from '../types';
import { ConnectionIcon, NodeIcon } from '../lib/icons';

// Build a curved SVG path between two points. Curvature scales with distance.
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

// ─── Connection (SVG) ───────────────────────────────────────────────────────
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
      onClick={(e) => {
        e.stopPropagation();
        onSelect(conn.id);
      }}
      onDoubleClick={(e) => {
        e.stopPropagation();
        onOpen(conn.id);
      }}
    >
      {/* Wide invisible hit area for easier clicking */}
      <path d={path} stroke="transparent" strokeWidth={20} fill="none" />
      {/* Visible line */}
      <path
        className={`connection-line ${isPppoe ? 'is-pppoe' : ''} ${selected ? 'selected' : ''}`}
        d={path}
        stroke={meta.color}
        strokeWidth={selected ? meta.width + 1.5 : meta.width}
        strokeDasharray={meta.dashArray}
        strokeLinecap="round"
        opacity={selected ? 1 : 0.85}
      />
      {/* Mid-point badge */}
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
      {/* Label */}
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

// ─── Node (HTML div over SVG) ──────────────────────────────────────────────
interface NodeItemProps {
  node: NetworkNode;
  selected: boolean;
  isConnectingSource: boolean;
  isConnectTarget: boolean;
  hasPppoe: boolean;
  onPointerDown: (e: React.PointerEvent, node: NetworkNode) => void;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  onConnect: (id: string) => void;
}

const NodeSize = 52;
const NodeItem = ({
  node,
  selected,
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
  const longPressTimer = useRef<number | null>(null);
  const longPressFired = useRef(false);

  const style: React.CSSProperties = {
    position: 'absolute',
    left: node.x - NodeSize / 2,
    top: node.y - NodeSize / 2,
    width: NodeSize,
    transform: 'translate(0,0)', // anchor is at center via left/top
    pointerEvents: 'auto',
  };

  const className = [
    'node',
    selected && 'selected',
    isConnectingSource && 'connecting-source',
    isConnectTarget && 'connect-target',
  ].filter(Boolean).join(' ');

  // Start long-press timer to enter connection mode (mobile: no right-click)
  const startLongPress = () => {
    longPressFired.current = false;
    longPressTimer.current = window.setTimeout(() => {
      longPressFired.current = true;
      onConnect(node.id);
      // Haptic feedback if available
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        (navigator as any).vibrate?.(15);
      }
    }, 500);
  };

  const cancelLongPress = () => {
    if (longPressTimer.current !== null) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  return (
    <div
      className={className}
      style={style}
      onPointerDown={(e) => {
        startLongPress();
        onPointerDown(e, node);
      }}
      onPointerUp={cancelLongPress}
      onPointerCancel={cancelLongPress}
      onPointerLeave={cancelLongPress}
      onClick={(e) => {
        // If long press fired, suppress the click that follows
        if (longPressFired.current) {
          longPressFired.current = false;
          e.stopPropagation();
          return;
        }
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

// ─── Main canvas ───────────────────────────────────────────────────────────
export const TopologyCanvas = () => {
  const nodes = useStore(s => s.nodes);
  const connections = useStore(s => s.connections);
  const selectedNodeId = useStore(s => s.selectedNodeId);
  const selectedConnectionId = useStore(s => s.selectedConnectionId);
  const connectingFromNodeId = useStore(s => s.connectingFromNodeId);
  const isAddingNode = useStore(s => s.isAddingNode);
  const viewport = useStore(s => s.viewport);
  const moveNode = useStore(s => s.moveNode);
  const selectNode = useStore(s => s.selectNode);
  const selectConnection = useStore(s => s.selectConnection);
  const completeConnecting = useStore(s => s.completeConnecting);
  const addNode = useStore(s => s.addNode);
  const pan = useStore(s => s.pan);
  const zoom = useStore(s => s.zoom);
  const setViewport = useStore(s => s.setViewport);
  const openNodeEditor = useStore(s => s.openNodeEditor);
  const openConnectionEditor = useStore(s => s.openConnectionEditor);
  const saveToStorage = useStore(s => s.saveToStorage);
  const startConnecting = useStore(s => s.startConnecting);
  const loadDemo = useStore(s => s.loadDemo);

  const wrapRef = useRef<HTMLDivElement>(null);

  const [dragState, setDragState] = useState<{
    type: 'node' | 'pan';
    nodeId?: string;
    pointerId: number;
    lastX: number;
    lastY: number;
    startNodeX?: number;
    startNodeY?: number;
  } | null>(null);

  // Convert client coords to world coords (relative to canvas center)
  const clientToWorld = useCallback((clientX: number, clientY: number) => {
    const wrap = wrapRef.current;
    if (!wrap) return { x: 0, y: 0 };
    const rect = wrap.getBoundingClientRect();
    const x = (clientX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
    const y = (clientY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
    return { x, y };
  }, [viewport]);

  // ─── Node drag start ───
  const handleNodePointerDown = useCallback((e: React.PointerEvent, node: NetworkNode) => {
    if (connectingFromNodeId) {
      e.stopPropagation();
      completeConnecting(node.id);
      return;
    }
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      type: 'node',
      nodeId: node.id,
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
      startNodeX: node.x,
      startNodeY: node.y,
    });
    selectNode(node.id);
  }, [connectingFromNodeId, completeConnecting, selectNode]);

  // ─── Canvas pan start ───
  const handleCanvasPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return; // only left button / primary touch
    const target = e.target as HTMLElement;
    if (target.closest('.node')) return; // node handles its own
    if (target.closest('.connection-line') || target.closest('g[style*="cursor: pointer"]')) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setDragState({
      type: 'pan',
      pointerId: e.pointerId,
      lastX: e.clientX,
      lastY: e.clientY,
    });
  }, []);

  // ─── Pointer move / up (node drag + canvas pan) ───
  useEffect(() => {
    if (!dragState) return;
    const handleMove = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      const dxScreen = e.clientX - dragState.lastX;
      const dyScreen = e.clientY - dragState.lastY;

      if (dragState.type === 'pan') {
        setViewport({
          x: viewport.x + dxScreen,
          y: viewport.y + dyScreen,
        });
      } else if (dragState.type === 'node' && dragState.nodeId && dragState.startNodeX !== undefined && dragState.startNodeY !== undefined) {
        moveNode(
          dragState.nodeId,
          dragState.startNodeX + dxScreen / viewport.zoom,
          dragState.startNodeY + dyScreen / viewport.zoom,
        );
      }
      setDragState(s => s ? { ...s, lastX: e.clientX, lastY: e.clientY } : s);
    };
    const handleUp = (e: PointerEvent) => {
      if (e.pointerId !== dragState.pointerId) return;
      if (dragState.type === 'node') saveToStorage();
      setDragState(null);
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, [dragState, viewport, moveNode, setViewport, saveToStorage]);

  // ─── Wheel zoom ───
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = wrap.getBoundingClientRect();
      const cx = (e.clientX - rect.left - rect.width / 2 - viewport.x) / viewport.zoom;
      const cy = (e.clientY - rect.top - rect.height / 2 - viewport.y) / viewport.zoom;
      const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      zoom(factor, cx, cy);
    };
    wrap.addEventListener('wheel', handleWheel, { passive: false });
    return () => wrap.removeEventListener('wheel', handleWheel);
  }, [viewport, zoom]);

  // ─── Touch pinch + two-finger pan ───
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
          zoom(factor, cx, cy);
        }

        // Two-finger pan
        if (lastCenter.x > 0 || lastCenter.y > 0) {
          const panDx = center.x - lastCenter.x;
          const panDy = center.y - lastCenter.y;
          pan(panDx, panDy);
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
  }, [viewport, zoom, pan]);

  // ─── Click handler (add node or deselect) ───
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('.node')) return;
    if (target.closest('.connection-line, g[style*="cursor: pointer"]')) return;

    if (isAddingNode) {
      const { x, y } = clientToWorld(e.clientX, e.clientY);
      addNode(isAddingNode, x, y);
    } else {
      selectNode(null);
      selectConnection(null);
    }
  }, [isAddingNode, addNode, selectNode, selectConnection, clientToWorld]);

  // Which nodes participate in PPPoE
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

  // ─── Render ───
  return (
    <div
      ref={wrapRef}
      className={`canvas-wrap ${isAddingNode ? 'canvas-add-mode' : ''}`}
      onPointerDown={handleCanvasPointerDown}
      onClick={handleCanvasClick}
      onContextMenu={(e) => {
        if (!(e.target as HTMLElement).closest('.node')) e.preventDefault();
      }}
    >
      <div className="canvas-grid" />

      {/* Connections layer (SVG) */}
      <svg className="canvas-svg">
        <g transform={`translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.zoom})`}>
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

      {/* Nodes layer (HTML divs for crisper text + easier drag) */}
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
            isConnectingSource={connectingFromNodeId === node.id}
            isConnectTarget={!!connectingFromNodeId && connectingFromNodeId !== node.id}
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
            Tarik node untuk memindahkan. Tahan lalu klik node lain untuk membuat koneksi.
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
import type { NodeType, ConnectionType } from '../types';

// Inline SVG icons for each node type. Designed at 24x24 viewBox,
// fill="none" stroke="currentColor" so parent can color via CSS.

interface IconProps {
  size?: number;
  color?: string;
}

const wrap = (size: number, children: React.ReactNode, color = 'currentColor') => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="1.6"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

export const NodeIcon = ({ type, size = 22, color = 'currentColor' }: IconProps & { type: NodeType }) => {
  switch (type) {
    case 'router':
      return wrap(size, <>
        <rect x="3" y="9" width="18" height="8" rx="1.5" />
        <path d="M7 13h.01M10 13h.01M13 13h.01" />
        <path d="M16 9V7M19 9V5" />
      </>, color);
    case 'modem':
      return wrap(size, <>
        <rect x="4" y="7" width="16" height="12" rx="1.5" />
        <circle cx="8" cy="13" r="1" />
        <circle cx="11" cy="13" r="1" />
        <path d="M14 13h4" />
      </>, color);
    case 'switch':
      return wrap(size, <>
        <rect x="2.5" y="7" width="19" height="10" rx="1.5" />
        <path d="M6 11v2M9 11v2M12 11v2M15 11v2M18 11v2" />
      </>, color);
    case 'ap':
      return wrap(size, <>
        <circle cx="12" cy="14" r="2" />
        <path d="M8.5 10.5a5 5 0 0 1 7 0" />
        <path d="M6 8a8 8 0 0 1 12 0" />
        <path d="M3.5 5.5a11 11 0 0 1 17 0" />
      </>, color);
    case 'server':
      return wrap(size, <>
        <rect x="4" y="3" width="16" height="6" rx="1" />
        <rect x="4" y="11" width="16" height="6" rx="1" />
        <path d="M7 6h.01M7 14h.01" />
      </>, color);
    case 'pc':
      return wrap(size, <>
        <rect x="3" y="4" width="18" height="12" rx="1.5" />
        <path d="M8 20h8M12 16v4" />
      </>, color);
    case 'laptop':
      return wrap(size, <>
        <rect x="4" y="5" width="16" height="11" rx="1.5" />
        <path d="M2 19h20" />
      </>, color);
    case 'phone':
      return wrap(size, <>
        <rect x="6" y="2" width="12" height="20" rx="2" />
        <path d="M10 18h4" />
      </>, color);
    case 'cloud':
      return wrap(size, <>
        <path d="M7 18a4 4 0 0 1-.9-7.9 6 6 0 0 1 11.7 1.6A4.5 4.5 0 0 1 17 18H7Z" />
      </>, color);
    case 'firewall':
      return wrap(size, <>
        <rect x="3" y="4" width="18" height="16" rx="1.5" />
        <path d="M3 8h18M3 12h18M3 16h18" />
        <path d="M8 4v4M12 12v4M16 4v4" />
      </>, color);
    case 'printer':
      return wrap(size, <>
        <path d="M6 9V3h12v6" />
        <rect x="3" y="9" width="18" height="8" rx="1.5" />
        <rect x="6" y="14" width="12" height="7" />
      </>, color);
    case 'nas':
      return wrap(size, <>
        <rect x="3" y="6" width="18" height="5" rx="1" />
        <rect x="3" y="13" width="18" height="5" rx="1" />
        <circle cx="6.5" cy="8.5" r=".5" fill={color} />
        <circle cx="6.5" cy="15.5" r=".5" fill={color} />
      </>, color);
    case 'camera':
      return wrap(size, <>
        <path d="M3 7h4l2-2h6l2 2h4v12H3z" />
        <circle cx="12" cy="13" r="3.5" />
      </>, color);
  }
};

// Connection decoration — small badge mid-line
export const ConnectionIcon = ({ type, size = 14, color = 'currentColor' }: IconProps & { type: ConnectionType }) => {
  switch (type) {
    case 'pppoe':
      // Globe with a "P" indicator
      return wrap(size, <>
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
      </>, color);
    case 'static':
      return wrap(size, <>
        <rect x="4" y="4" width="16" height="16" rx="2" />
        <path d="M8 12h8M12 8v8" />
      </>, color);
    case 'dhcp':
      return wrap(size, <>
        <rect x="3" y="6" width="18" height="12" rx="2" />
        <path d="M7 12l3 3 7-7" />
      </>, color);
    case 'lan':
      return wrap(size, <>
        <rect x="2" y="9" width="20" height="6" rx="1" />
      </>, color);
    case 'wifi':
      return wrap(size, <>
        <path d="M5 12.55a11 11 0 0 1 14 0" />
        <path d="M8.5 16a6 6 0 0 1 7 0" />
        <circle cx="12" cy="19" r="1" fill={color} />
      </>, color);
    case 'fiber':
      return wrap(size, <>
        <path d="M4 12h16M14 7l6 5-6 5" />
      </>, color);
    case 'vpn':
      return wrap(size, <>
        <rect x="5" y="11" width="14" height="9" rx="1.5" />
        <path d="M8 11V7a4 4 0 0 1 8 0v4" />
      </>, color);
    case 'serial':
      return wrap(size, <>
        <rect x="2" y="9" width="20" height="6" rx="1" />
        <path d="M6 9V6M9 9V6M12 9V6M15 9V6M18 9V6" />
      </>, color);
  }
};

export const ChevronIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M9 6l6 6-6 6" />
</>, color);

export const CloseIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M6 6l12 12M18 6L6 18" />
</>, color);

export const TrashIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6l1 14a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1l1-14" />
</>, color);

export const PlusIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M12 5v14M5 12h14" />
</>, color);

export const DownloadIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M12 3v12M7 10l5 5 5-5M5 21h14" />
</>, color);

export const UploadIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M12 21V9M7 14l5-5 5 5M5 3h14" />
</>, color);

export const HelpIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <circle cx="12" cy="12" r="9" />
  <path d="M9.5 9a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 4" />
  <circle cx="12" cy="17" r=".5" fill={color} />
</>, color);

export const ZoomInIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <circle cx="11" cy="11" r="7" />
  <path d="M21 21l-4.3-4.3M11 8v6M8 11h6" />
</>, color);

export const ZoomOutIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <circle cx="11" cy="11" r="7" />
  <path d="M21 21l-4.3-4.3M8 11h6" />
</>, color);

export const ResetIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M3 12a9 9 0 1 0 3-6.7L3 8M3 3v5h5" />
</>, color);

export const LinkIcon = ({ size = 16, color = 'currentColor' }: IconProps) => wrap(size, <>
  <path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1" />
  <path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1" />
</>, color);
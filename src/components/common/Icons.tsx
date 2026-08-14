import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

function svgProps(size: number) {
  return {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
}

export const IconFiles: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <path d="M2 2.5h4l1 1.5h5a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1Z" />
    <path d="M2 5.5h12" />
  </svg>
);

export const IconBranch: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <circle cx="3.5" cy="3.5" r="1.8" />
    <circle cx="3.5" cy="12.5" r="1.8" />
    <circle cx="12.5" cy="5.5" r="1.8" />
    <path d="M3.5 5.3v5.4" />
    <path d="M5.3 5.5h4a2 2 0 0 1 1.9 1.4l.5 1.6a2 2 0 0 0 1.8 1.4h1" />
  </svg>
);

export const IconSearch: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <circle cx="7" cy="7" r="4.5" />
    <path d="m10.5 10.5 3.5 3.5" />
  </svg>
);

export const IconSettings: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <circle cx="8" cy="8" r="2.2" />
    <path d="M8 1.5v2M8 12.5v2M1.5 8h2M12.5 8h2M3.4 3.4l1.4 1.4M11.2 11.2l1.4 1.4M12.6 3.4l-1.4 1.4M4.8 11.2l-1.4 1.4" />
  </svg>
);

export const IconGlobe: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <circle cx="8" cy="8" r="5.5" />
    <path d="M2.5 8h11M8 2.5c1.5 1.5 2 4 2 5.5s-.5 4-2 5.5c-1.5-1.5-2-4-2-5.5s.5-4 2-5.5Z" />
  </svg>
);

export const IconCode: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <path d="M5.5 4 2 8l3.5 4M10.5 4 14 8l-3.5 4M9.5 3l-3 10" />
  </svg>
);

export const IconKey: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <circle cx="5.5" cy="8" r="3.5" />
    <path d="M8 8l4.5 4.5M10.5 10.5 12 12" />
    <path d="M9.5 7.5h2.5l1 1" />
  </svg>
);

export const IconPalette: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <path d="M8 2a6 6 0 0 0 0 12c1 0 1.5-.7 1.5-1.4 0-.6-.4-1-1-1.4-.3-.3-.6-.6-.6-1 0-.7.5-1.2 1.2-1.2h1.4C12.5 9 14 8.2 14 6.5 14 4 11.3 2 8 2Z" />
    <circle cx="5" cy="6" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="7.5" cy="4.5" r="0.8" fill="currentColor" stroke="none" />
    <circle cx="10.5" cy="5.5" r="0.8" fill="currentColor" stroke="none" />
  </svg>
);

export const IconClose: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <path d="m3.5 3.5 9 9M12.5 3.5l-9 9" />
  </svg>
);

export const IconSend: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <path d="M14 2 6.5 9.5M14 2l-4.5 12-3-5-5-3 12-4Z" />
  </svg>
);

export const IconStop: React.FC<IconProps> = ({ size = 16, className }) => (
  <svg {...svgProps(size)} className={className}>
    <rect x="3.5" y="3.5" width="9" height="9" rx="1.5" />
  </svg>
);

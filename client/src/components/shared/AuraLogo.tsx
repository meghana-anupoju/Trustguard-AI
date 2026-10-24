interface AuraLogoProps {
  size?: number;
  className?: string;
}

export function AuraLogo({ size = 40, className = '' }: AuraLogoProps) {
  return (
    <img
      src="/aura-x-logo.svg"
      alt="AURA_X Logo"
      width={size}
      height={size}
      className={`object-contain ${className}`}
      style={{ maxWidth: `${size}px`, maxHeight: `${size}px` }}
    />
  );
}

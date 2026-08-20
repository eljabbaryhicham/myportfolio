import Image from 'next/image';
import { cn } from '@/lib/utils';

function hexToFilter(hex: string) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  const bFactor = max > 0 ? 255 / (max * 255) : 1;
  return `brightness(0) sepia(1) saturate(${Math.round(s * 1000)}%) hue-rotate(${Math.round(h * 360)}deg) brightness(${Math.round(bFactor * 100)}%)`;
}

const Logo = (props: { src: string; className?: string; color?: string }) => (
    <Image
      src={props.src}
      alt="belofted logo"
      width={384}
      height={104}
      className={cn("w-full h-auto", props.className)}
      style={props.color ? { filter: hexToFilter(props.color) } : undefined}
      priority
    />
);

export default Logo;

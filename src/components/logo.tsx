import Image from 'next/image';
import { cn } from '@/lib/utils';

const Logo = (props: { src: string; className?: string }) => (
    <Image
      src={props.src}
      alt="belofted logo"
      width={384}
      height={104}
      className={cn("w-full h-auto", props.className)}
      priority
    />
);

export default Logo;

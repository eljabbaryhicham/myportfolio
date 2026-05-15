import Image from 'next/image';
import { cn } from '@/lib/utils';
import { DEFAULT_LOGO_URL } from '@/lib/constants';

const Logo = (props: { src?: string; className?: string }) => (
    <Image
      src={props.src || DEFAULT_LOGO_URL}
      alt="belofted logo"
      width={384}
      height={104}
      className={cn("w-full h-auto", props.className)}
      priority
    />
);

export default Logo;

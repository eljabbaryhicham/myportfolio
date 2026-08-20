import Image from 'next/image';
import { cn } from '@/lib/utils';

const Logo = (props: { src: string; className?: string; color?: string }) => {
    if (!props.color) {
      return (
        <Image
          src={props.src}
          alt="belofted logo"
          width={384}
          height={104}
          className={cn("w-full h-auto", props.className)}
          priority
        />
      );
    }
    return (
      <div
        className={cn("w-full", props.className)}
        style={{
          aspectRatio: '384/104',
          backgroundColor: props.color,
          WebkitMaskImage: `url("${props.src}")`,
          maskImage: `url("${props.src}")`,
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    );
};

export default Logo;

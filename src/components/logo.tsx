import Image from 'next/image';
import * as React from 'react';

const Logo = (props: { className?: string }) => (
    <Image
      src="https://i.imgur.com/N9c8oEJ.png"
      alt="belofted logo"
      width={384}
      height={104}
      className="w-full h-auto"
      priority
    />
);

export default Logo;

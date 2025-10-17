import Image from 'next/image';
import * as React from 'react';

const Logo = (props: { className?: string }) => (
    <Image
      src="https://i.imgur.com/N9c8oEJ.png"
      alt="belofted logo"
      width={192}
      height={52}
      className={props.className}
      priority
    />
);

export default Logo;

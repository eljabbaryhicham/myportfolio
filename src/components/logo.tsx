import Image from 'next/image';
import * as React from 'react';

const Logo = (props: { className?: string }) => (
  <Image
    src="/logo.png"
    alt="belofted logo"
    width={128}
    height={35}
    className={props.className}
    priority
  />
);

export default Logo;

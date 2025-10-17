import * as React from 'react';

const Logo = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 160 90"
    width="128"
    height="72"
    {...props}
  >
    <path
      fill="hsl(var(--primary))"
      d="M59.3,0.5L0,48.2h28.3c15.4,0,27.9-12.5,27.9-27.9S43.7,2.4,28.3,2.4H19.5L59.3,0.5z M100.7,0.5L160,48.2h-28.3 c-15.4,0-27.9-12.5-27.9-27.9S116.3,2.4,131.7,2.4h8.8L100.7,0.5z"
    />
    <text
      x="50%"
      y="80"
      fontFamily="Arial, sans-serif"
      fontSize="34"
      fill="hsl(var(--foreground))"
      fontWeight="bold"
      textAnchor="middle"
    >
      belofted
    </text>
  </svg>
);

export default Logo;

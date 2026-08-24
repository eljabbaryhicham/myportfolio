import { Bungee, Quicksand, Dancing_Script } from 'next/font/google';

export const bungee = Bungee({
  weight: '400',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-bungee',
});

export const quicksand = Quicksand({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-quicksand',
});

export const dancingScript = Dancing_Script({
  weight: '700',
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dancing-script',
});

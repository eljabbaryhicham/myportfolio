import localFont from 'next/font/local';

// These font files are installed with the app, so production builds do not
// need network access to Google Fonts.
export const bungee = localFont({
  src: '../../node_modules/@fontsource/bungee/files/bungee-latin-400-normal.woff2',
  weight: '400',
  display: 'swap',
  variable: '--font-bungee',
});

export const quicksand = localFont({
  src: [
    { path: '../../node_modules/@fontsource/quicksand/files/quicksand-latin-400-normal.woff2', weight: '400' },
    { path: '../../node_modules/@fontsource/quicksand/files/quicksand-latin-500-normal.woff2', weight: '500' },
    { path: '../../node_modules/@fontsource/quicksand/files/quicksand-latin-700-normal.woff2', weight: '700' },
  ],
  display: 'swap',
  variable: '--font-quicksand',
});

export const dancingScript = localFont({
  src: '../../node_modules/@fontsource/dancing-script/files/dancing-script-latin-700-normal.woff2',
  weight: '700',
  display: 'swap',
  variable: '--font-dancing-script',
});

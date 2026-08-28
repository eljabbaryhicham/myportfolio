/* eslint-disable @next/next/no-img-element */
import { ImageResponse } from 'next/og';
import { getHomePageSettings } from '@/lib/home-page-settings';

export const alt = 'MelliVision — Premium motion design, VFX and creative production';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image() {
  const settings = await getHomePageSettings();
  const logoUrl =
    settings?.menubarLogoUrl ||
    settings?.homePageLogoUrl ||
    settings?.faviconUrl ||
    '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(ellipse at top, #1a0a0a 0%, #000 70%)',
          color: '#fff',
          fontFamily: 'sans-serif',
        }}
      >
        {logoUrl ? (
          <img
            src={logoUrl}
            alt="MelliVision"
            width={720}
            height={195}
            style={{ width: '60%', height: 'auto', objectFit: 'contain' }}
          />
        ) : (
          <div
            style={{
              fontSize: 96,
              fontWeight: 800,
              letterSpacing: '-0.02em',
            }}
          >
            MelliVision
          </div>
        )}
        <div
          style={{
            marginTop: 32,
            fontSize: 32,
            color: '#fca5a5',
            fontWeight: 600,
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
          }}
        >
          Driven By Detail
        </div>
        <div
          style={{
            marginTop: 16,
            fontSize: 22,
            color: 'rgba(255,255,255,0.6)',
            maxWidth: 900,
            textAlign: 'center',
            lineHeight: 1.4,
          }}
        >
          Premium motion design, VFX and creative production for brands worldwide
        </div>
      </div>
    ),
    { ...size }
  );
}

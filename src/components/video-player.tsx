'use client';

import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface SmoothVideoProps {
    src?: string;
    poster?: string;
    className?: string;
    autoPlay?: boolean;
    muted?: boolean;
    loop?: boolean;
    controls?: boolean;
    playsInline?: boolean;
}

const SmoothVideo = React.memo(({
    src,
    poster,
    className,
    autoPlay = false,
    muted = false,
    loop = false,
    controls = false,
    playsInline = true,
}: SmoothVideoProps) => {
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const video = videoRef.current;
        if (video && autoPlay) {
            video.play().catch(() => {
                // Autoplay was prevented. This is a common browser policy.
            });
        }
    }, [autoPlay, src]); // Re-run if src changes

    return (
        <video
            ref={videoRef}
            src={src}
            poster={poster}
            muted={muted}
            autoPlay={autoPlay}
            playsInline={playsInline}
            loop={loop}
            controls={controls}
            preload="metadata"
            className={cn('w-full h-full object-contain', className)}
            style={{
                transform: "translateZ(0)",
                willChange: "transform",
                backfaceVisibility: "hidden",
                display: "block",
            }}
        />
    );
});

SmoothVideo.displayName = 'SmoothVideo';

export default SmoothVideo;


'use client';

import { H5Player } from 'h5player';
import { useEffect, useState } from 'react';

const HomePageVideo = () => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return null; // Don't render on the server
    }

    return (
        <H5Player
            source="https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4"
            className="w-full h-full"
            config={{
                isLive: false,
                autoplay: true,
                muted: true,
                loop: true,
                fluid: true,
                'x5-video-player-fullscreen': false,
                'x5-playsinline': true,
                playsinline: true,
                'x-webkit-airplay': false,
                'airplay-fullscreen': false,
                controls: false, // hide controls
                ignores: ['error', 'volume', 'playbackrate', 'play'],
            }}
        />
    );
};

export default HomePageVideo;


'use client';
import Player from 'dplayer';
import { useEffect, useRef } from 'react';

const H5Player = (props: {
  source: string;
  options: any
}) => {
  const { options, source } = props;
  const h5player = useRef(null);

  useEffect(() => {
    if (h5player.current) {
        const dp = new Player({
            ...options,
            container: h5player.current,
            video: {
                url: source
            },
        });
        return () => {
            dp.destroy();
        };
    }
  }, [source, options, h5player]);

  return (
    <div ref={h5player} className="w-full h-full" />
  );
};
export default H5Player;

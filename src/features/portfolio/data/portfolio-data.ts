import { placeholderImages } from './placeholder-images';

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  thumbnailUrl: string;
  thumbnailHint: string;
  sourceUrl?: string; // For images
  sources?: { src: string; size: number }[]; // For videos
  featured?: boolean;
  details?: string;
}

export const portfolioItems: PortfolioItem[] = [
  {
    id: 'vid1',
    type: 'video',
    title: 'Kinetic Motion',
    description: 'An exploration of dynamic typography and fluid motion.',
    thumbnailUrl: placeholderImages['vid1-thumb'].imageUrl,
    thumbnailHint: placeholderImages['vid1-thumb'].imageHint,
    sources: [
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4', size: 1080 },
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4', size: 720 },
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', size: 576 },
    ],
    featured: true,
    details: `This project was created using a combination of Adobe After Effects and Cinema 4D. The goal was to create a visceral experience through motion. 

**Client:** Fictional Brand Inc.
**Year:** 2023`
  },
  {
    id: 'img1',
    type: 'image',
    title: 'Chromatic Flow',
    description: 'A study of color interaction in a fluid, abstract form.',
    thumbnailUrl: placeholderImages['img1'].imageUrl,
    thumbnailHint: placeholderImages['img1'].imageHint,
    sourceUrl: 'https://picsum.photos/seed/liquid1/1600/1200',
    featured: true,
    details: 'Created with a mix of digital painting and procedural generation techniques in Processing.'
  },
  {
    id: 'img2',
    type: 'image',
    title: 'Bloom',
    description: 'Portraiture blending natural elements with human form.',
    thumbnailUrl: placeholderImages['img2'].imageUrl,
    thumbnailHint: placeholderImages['img2'].imageHint,
    sourceUrl: 'https://picsum.photos/seed/liquid2/1200/1600',
    featured: false,
    details: 'A personal project exploring the themes of growth and nature. Photoshoot combined with digital illustration.'
  },
  {
    id: 'vid2',
    type: 'video',
    title: 'The Wanderer',
    description: 'A short cinematic piece about solitude and nature.',
    thumbnailUrl: placeholderImages['vid2-thumb'].imageUrl,
    thumbnailHint: placeholderImages['vid2-thumb'].imageHint,
    sources: [
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-1080p.mp4', size: 1080 },
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4', size: 720 },
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', size: 576 },
    ],
    featured: false,
  },
  {
    id: 'img3',
    type: 'image',
    title: 'Stillness',
    description: 'Capturing the serene and silent moment of a landscape.',
    thumbnailUrl: placeholderImages['img3'].imageUrl,
    thumbnailHint: placeholderImages['img3'].imageHint,
    sourceUrl: 'https://picsum.photos/seed/liquid3/1600/1200',
    featured: true,
  },
  {
    id: 'img4',
    type: 'image',
    title: 'Night Glow',
    description: 'The vibrant energy of city lights after dark.',
    thumbnailUrl: placeholderImages['img4'].imageUrl,
    thumbnailHint: placeholderImages['img4'].imageHint,
    sourceUrl: 'https://picsum.photos/seed/liquid4/1200/1600',
    featured: false,
  },
  {
    id: 'img5',
    type: 'image',
    title: 'Oceanic',
    description: 'The powerful waves of the sea.',
    thumbnailUrl: 'https://picsum.photos/seed/ocean/800/800',
    thumbnailHint: 'ocean waves',
    sourceUrl: 'https://picsum.photos/seed/ocean/1600/1600',
    featured: false,
  },
  {
    id: 'img6',
    type: 'image',
    title: 'Metropolis',
    description: 'A bustling city from above.',
    thumbnailUrl: 'https://picsum.photos/seed/city/800/800',
    thumbnailHint: 'city aerial',
    sourceUrl: 'https://picsum.photos/seed/city/1600/1600',
    featured: false,
  },
  {
    id: 'vid3',
    type: 'video',
    title: 'Forest Path',
    description: 'A peaceful walk through the woods.',
    thumbnailUrl: 'https://picsum.photos/seed/forest/800/800',
    thumbnailHint: 'forest path',
    sources: [
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-720p.mp4', size: 720 },
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', size: 576 },
    ],
    featured: false,
  },
  {
    id: 'img7',
    type: 'image',
    title: 'Desert Dunes',
    description: 'The shifting sands of the desert.',
    thumbnailUrl: 'https://picsum.photos/seed/desert/800/800',
    thumbnailHint: 'desert dunes',
    sourceUrl: 'https://picsum.photos/seed/desert/1600/1600',
    featured: false,
  },
  {
    id: 'img8',
    type: 'image',
    title: 'Mountain Peak',
    description: 'The view from the top.',
    thumbnailUrl: 'https://picsum.photos/seed/mountain/800/800',
    thumbnailHint: 'mountain peak',
    sourceUrl: 'https://picsum.photos/seed/mountain/1600/1600',
    featured: false,
  },
  {
    id: 'vid4',
    type: 'video',
    title: 'City Lights',
    description: 'A timelapse of a city at night.',
    thumbnailUrl: 'https://picsum.photos/seed/nightcity/800/800',
    thumbnailHint: 'city timelapse',
    sources: [
        { src: 'https://cdn.plyr.io/static/demo/View_From_A_Blue_Moon_Trailer-576p.mp4', size: 576 },
    ],
    featured: false,
  },
];

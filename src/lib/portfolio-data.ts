
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
    description: `
"Bloom" is a deeply personal project that delves into the intricate and symbiotic relationship between humanity and the natural world. It is an exploration of growth, decay, and rebirth, themes that are mirrored in both human life and the cycles of nature.

**Concept & Inspiration**
The series was born from a period of introspection and a renewed connection with the wild landscapes of my childhood. I wanted to visually represent the feeling of being simultaneously rooted and ephemeral, grounded in the earth yet constantly in a state of change. The primary inspiration came from the Pre-Raphaelite painters, particularly their use of symbolism and their detailed, reverent depiction of flora. I sought to bring a contemporary, photographic sensibility to these classical themes.

**Process & Technique**
The creation of "Bloom" was a multi-stage process that blended traditional photography with digital artistry. Each portrait began with a carefully planned photoshoot. Models were selected for their ability to convey a sense of quiet contemplation and inner strength.

The shoots took place in a variety of natural settings, from dense forests to overgrown gardens, allowing the environment itself to become a character in the narrative. We used a combination of natural light and subtle, diffused strobes to create a soft, ethereal quality.

Post-production was where the images truly came to life. I meticulously layered digital illustrations of flowers, vines, and other botanical elements over the portraits. Each flower was chosen for its symbolic meaning—lilies for purity, roses for passion, ivy for memory and fidelity. This was not merely a decorative process; it was a form of storytelling, with each element adding a new layer of meaning to the portrait. The final composite images were then color-graded to unify the photographic and illustrative components, resulting in a painterly, dreamlike aesthetic.

**Challenges**
The main challenge was to ensure that the digital additions felt organic and integrated, rather than simply superimposed. This required a delicate touch and a deep understanding of light, shadow, and texture. Countless hours were spent ensuring that every leaf and petal seemed to grow naturally from the subject, blurring the line between the human and the botanical.

**Meaning & Reflection**
Ultimately, "Bloom" is a meditation on our place within the ecosystem. It asks the viewer to consider how we are connected to the world around us, how we grow, and how we leave our mark. It is a celebration of life in all its beautiful, fleeting forms.
`,
    thumbnailUrl: placeholderImages['img2'].imageUrl,
    thumbnailHint: placeholderImages['img2'].imageHint,
    sourceUrl: 'https://picsum.photos/seed/liquid2/1200/1600',
    featured: false,
    details: 'A series of portraits that merges the human form with botanical elements, exploring the symbiotic relationship between humanity and the natural world through a blend of photography and digital illustration.'
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


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

    
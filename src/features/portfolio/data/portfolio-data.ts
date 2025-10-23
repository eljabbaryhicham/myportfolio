
export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  thumbnailUrl: string;
  thumbnailHint?: string;
  sourceUrl?: string; // For images or single-source videos
  details?: string;
  order?: number;
  isVisible?: boolean;
  useVideoFrameAsPoster?: boolean;
  [key: string]: any; // Allow other properties
}


export const defaultPortfolioItems: PortfolioItem[] = [];

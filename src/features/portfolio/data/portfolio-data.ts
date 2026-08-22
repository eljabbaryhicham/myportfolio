
export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  title: string;
  description: string;
  thumbnailUrl: string;
  thumbnailVttUrl?: string; // For video preview thumbnails
  thumbnailHint?: string;
  sourceUrl?: string; // For images or single-source videos
  previewUrl?: string; // Optional media for card hover previews (falls back to sourceUrl)
  details?: string;
  order?: number;
  isVisible?: boolean;
  useVideoFrameAsPoster?: boolean;
  [key: string]: any; // Allow other properties
}


export const defaultPortfolioItems: PortfolioItem[] = [];

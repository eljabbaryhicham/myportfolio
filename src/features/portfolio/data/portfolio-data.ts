
import { type MultilingualString } from '@/lib/i18n/multilingual';

export interface PortfolioItem {
  id: string;
  type: 'image' | 'video';
  title: MultilingualString;
  description: MultilingualString;
  thumbnailUrl: string;
  thumbnailVttUrl?: string;
  thumbnailHint?: string;
  sourceUrl?: string;
  previewUrl?: string;
  details?: MultilingualString;
  order?: number;
  isVisible?: boolean;
  useVideoFrameAsPoster?: boolean;
  [key: string]: any;
}


export const defaultPortfolioItems: PortfolioItem[] = [];

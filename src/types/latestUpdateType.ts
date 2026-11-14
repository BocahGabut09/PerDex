export interface LatestUpdateType {
  manga_slug: string;
  banner: string;
  bannerFallback?: string;
  rating: string;
  title: string;
  chapter?: string;
  hasNext: boolean;
  hasPrev: boolean;
}
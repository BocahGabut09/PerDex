export interface ChapterPageImage {
  src: string;
  fallbackSrc?: string;
  alt?: string;
}

export interface chapterType {
  status: string;
  title: string;
  comicTitle?: string;
  comicSlug?: string;
  data: Array<string | ChapterPageImage>;
  has_next: { has_next_link: null | string; is_next_link: boolean };
  has_prev: {
    has_prev_link: null | string;
    is_prev_link: boolean;
  };
}

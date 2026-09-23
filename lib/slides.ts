// Legacy synchronous slide helpers. Slides are owned by the backend now; callers
// should use curriculumApi.getSlides() for real data. These helpers intentionally
// return no fabricated content while older screens are migrated.
import type { TopicId, BlockId } from "./curriculum";

export type SlideId = string;
export type Slide = {
  id: SlideId;
  title: string;
  topicId?: TopicId;
  blockId?: BlockId;
  pages: number;
  uploadedBy: string;
  uploadedAt: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  content?: SlideContent[];
};
export type SlideContent = { pageNumber: number; imageUrl: string; text?: string };

export function getSlidesByTopic(_topicId: TopicId): Slide[] { return []; }
export function getSlidesByBlock(_blockId: BlockId): Slide[] { return []; }
export function getSlideById(_slideId: SlideId): Slide | undefined { return undefined; }
export function getSlidesForCourse(_courseId: string): Slide[] { return []; }

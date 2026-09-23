// lib/slides.ts
// Slide management system linked to curriculum
// Fetches real slide data from the backend API.

import type { TopicId, BlockId } from "./curriculum"
import { curriculumApi } from "./api"

export type SlideId = string

export type Slide = {
  id: SlideId
  title: string
  // Link to curriculum
  topicId?: TopicId // For anatomy & physiology
  blockId?: BlockId // For biochemistry (no topic)
  // Metadata
  pages: number
  uploadedBy: string
  uploadedAt: string
  fileUrl?: string
  thumbnailUrl?: string
  // Content (for reader)
  content?: SlideContent[]
}

export type SlideContent = {
  pageNumber: number
  imageUrl: string // Base64 or URL
  text?: string // Extracted text for AI
}

// Adapt API response to local Slide type
function mapApiSlide(apiSlide: any): Slide {
  return {
    id: apiSlide.id?.toString() || apiSlide.slug || "",
    title: apiSlide.title || "",
    topicId: apiSlide.topic || apiSlide.sub_block || undefined,
    blockId: apiSlide.block || undefined,
    pages: apiSlide.page_count || apiSlide.pages || 0,
    uploadedBy: apiSlide.uploaded_by_name || apiSlide.uploaded_by || "",
    uploadedAt: apiSlide.created_at || "",
    fileUrl: apiSlide.file_url || undefined,
    thumbnailUrl: apiSlide.thumbnail_url || undefined,
  }
}

// Get all slides for a topic
export async function getSlidesByTopic(topicId: TopicId): Promise<Slide[]> {
  try {
    const apiSlides = await curriculumApi.getSlides({ topic: topicId })
    return apiSlides.map(mapApiSlide)
  } catch (error) {
    console.warn(`Failed to fetch slides for topic ${topicId}`, error)
    return []
  }
}

// Get all slides for a block (biochemistry)
export async function getSlidesByBlock(blockId: BlockId): Promise<Slide[]> {
  try {
    const apiSlides = await curriculumApi.getSlides({ block: blockId })
    return apiSlides.map(mapApiSlide)
  } catch (error) {
    console.warn(`Failed to fetch slides for block ${blockId}`, error)
    return []
  }
}

// Get a specific slide by ID
export async function getSlideById(slideId: SlideId): Promise<Slide | undefined> {
  try {
    const apiSlide = await curriculumApi.getSlide(slideId)
    return mapApiSlide(apiSlide)
  } catch (error) {
    console.warn(`Failed to fetch slide ${slideId}`, error)
    return undefined
  }
}

// Get all slides for a course (topic or block)
export async function getSlidesForCourse(courseId: string): Promise<Slide[]> {
  // Try as topic first
  const topicSlides = await getSlidesByTopic(courseId)
  if (topicSlides.length > 0) return topicSlides
  
  // Try as block
  const blockSlides = await getSlidesByBlock(courseId)
  return blockSlides
}

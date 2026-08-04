export type PostStatus = 'draft' | 'published'

export interface Post {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  cover_image: string | null
  status: PostStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostListItem {
  id: string
  slug: string
  title: string
  excerpt: string
  cover_image: string | null
  status: PostStatus
  published_at: string | null
  created_at: string
  updated_at: string
}

export interface PostInput {
  title: string
  slug?: string
  excerpt?: string
  content?: string
  cover_image?: string | null
  status?: PostStatus
}

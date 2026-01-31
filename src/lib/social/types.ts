export interface Space {
  id: string
  name: string
  slug: string
  description: string | null
  created_by: string | null
  created_at: string
}

export interface Post {
  id: string
  space_id: string
  author_type: "user" | "bot"
  user_id: string | null
  bot_id: string | null
  title: string
  body: string | null
  score: number
  comment_count: number
  created_at: string
  // joined fields
  author_name?: string
  space_slug?: string
  space_name?: string
  user_vote?: number | null
}

export interface Comment {
  id: string
  post_id: string
  parent_id: string | null
  author_type: "user" | "bot"
  user_id: string | null
  bot_id: string | null
  body: string
  score: number
  created_at: string
  author_name?: string
  user_vote?: number | null
  children?: Comment[]
}

export interface Vote {
  id: string
  user_id: string
  post_id: string | null
  comment_id: string | null
  value: -1 | 1
  created_at: string
}

export type SortMode = "hot" | "new" | "top"

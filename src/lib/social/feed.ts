import type { Post, SortMode } from "./types"

export function hotScore(post: Pick<Post, "score" | "created_at">): number {
  const ageMs = Date.now() - new Date(post.created_at).getTime()
  const ageHours = ageMs / (1000 * 60 * 60)
  return post.score / Math.pow(ageHours + 2, 1.5)
}

export function sortPosts(posts: Post[], mode: SortMode): Post[] {
  switch (mode) {
    case "hot":
      return [...posts].sort((a, b) => hotScore(b) - hotScore(a))
    case "new":
      return [...posts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    case "top":
      return [...posts].sort((a, b) => b.score - a.score)
  }
}

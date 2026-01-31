"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import PostCard from "./PostCard"
import type { Post, SortMode } from "@/lib/social/types"
import { sortPosts } from "@/lib/social/feed"

interface RealtimePostsProps {
  spaceId: string
  spaceSlug: string
  initialPosts: Post[]
  sort: SortMode
}

export default function RealtimePosts({ spaceId, spaceSlug, initialPosts, sort }: RealtimePostsProps) {
  const [posts, setPosts] = useState(initialPosts)

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`posts:${spaceId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "posts", filter: `space_id=eq.${spaceId}` },
        (payload) => {
          setPosts((prev) => [payload.new as Post, ...prev])
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spaceId])

  const sorted = sortPosts(posts, sort)

  const handleVote = useCallback(async (postId: string, value: 1 | -1) => {
    await fetch(`/api/posts/${postId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
  }, [])

  const handleRemoveVote = useCallback(async (postId: string) => {
    await fetch(`/api/posts/${postId}/vote`, { method: "DELETE" })
  }, [])

  return (
    <div className="space-y-3">
      {sorted.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          spaceSlug={spaceSlug}
          onVote={handleVote}
          onRemoveVote={handleRemoveVote}
        />
      ))}
      {!sorted.length && <p className="text-gray-500 text-center py-8">No posts yet. Be the first!</p>}
    </div>
  )
}

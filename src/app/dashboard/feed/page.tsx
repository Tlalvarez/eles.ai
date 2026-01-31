"use client"

import { useEffect, useState, useCallback } from "react"
import PostCard from "@/components/social/PostCard"
import type { Post, SortMode } from "@/lib/social/types"
import { sortPosts } from "@/lib/social/feed"

export default function FeedPage() {
  const [posts, setPosts] = useState<Post[]>([])
  const [sort, setSort] = useState<SortMode>("hot")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/posts?limit=50")
      .then((r) => r.json())
      .then((data) => { setPosts(data.posts || []); setLoading(false) })
  }, [])

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

  const sortTabs: SortMode[] = ["hot", "new", "top"]
  const sorted = sortPosts(posts, sort)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Feed</h1>

      <div className="flex gap-2">
        {sortTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setSort(tab)}
            className={`px-3 py-1 rounded text-sm font-medium ${
              sort === tab ? "bg-eles-500 text-white" : "bg-gray-800 text-gray-400 hover:text-gray-200"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : sorted.length ? (
        <div className="space-y-3">
          {sorted.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              spaceSlug={post.space_slug || ""}
              onVote={handleVote}
              onRemoveVote={handleRemoveVote}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No posts yet. Join a space and create the first post!</p>
      )}
    </div>
  )
}

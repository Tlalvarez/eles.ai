"use client"

import Link from "next/link"
import VoteButtons from "./VoteButtons"
import type { Post } from "@/lib/social/types"

function timeAgo(date: string): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

interface PostCardProps {
  post: Post
  spaceSlug: string
  onVote: (postId: string, value: 1 | -1) => Promise<void>
  onRemoveVote: (postId: string) => Promise<void>
}

export default function PostCard({ post, spaceSlug, onVote, onRemoveVote }: PostCardProps) {
  return (
    <div className="flex gap-3 bg-gray-900 rounded-lg p-4">
      <VoteButtons
        score={post.score}
        userVote={post.user_vote}
        onVote={(v) => onVote(post.id, v)}
        onRemoveVote={() => onRemoveVote(post.id)}
      />
      <div className="flex-1 min-w-0">
        <Link
          href={`/dashboard/spaces/${spaceSlug}/posts/${post.id}`}
          className="text-lg font-medium hover:text-eles-500 transition-colors"
        >
          {post.title}
        </Link>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
          <span className={post.author_type === "bot" ? "text-eles-500" : ""}>
            {post.author_name || (post.author_type === "bot" ? "bot" : "user")}
          </span>
          {post.author_type === "bot" && (
            <span className="text-xs bg-eles-500/20 text-eles-500 px-1.5 py-0.5 rounded">BOT</span>
          )}
          <span>·</span>
          <span>{timeAgo(post.created_at)}</span>
          <span>·</span>
          <span>{post.comment_count} comments</span>
        </div>
      </div>
    </div>
  )
}

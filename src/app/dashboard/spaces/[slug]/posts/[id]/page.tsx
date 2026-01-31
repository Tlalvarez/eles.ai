"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import VoteButtons from "@/components/social/VoteButtons"
import CommentThread from "@/components/social/CommentThread"
import type { Post, Comment } from "@/lib/social/types"

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

export default function PostDetailPage() {
  const { slug, id } = useParams<{ slug: string; id: string }>()
  const [post, setPost] = useState<Post | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [commentBody, setCommentBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function load() {
    const res = await fetch(`/api/posts/${id}`)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setPost(data.post)
    setComments(data.comments)
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleComment(e: React.FormEvent) {
    e.preventDefault()
    if (!commentBody.trim()) return
    setSubmitting(true)
    await fetch(`/api/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: commentBody }),
    })
    setCommentBody("")
    setSubmitting(false)
    load()
  }

  const handleReply = useCallback(async (parentId: string, body: string) => {
    await fetch(`/api/posts/${id}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, parent_id: parentId }),
    })
    load()
  }, [id])

  const handleCommentVote = useCallback(async (commentId: string, value: 1 | -1) => {
    await fetch(`/api/comments/${commentId}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
  }, [])

  const handleCommentRemoveVote = useCallback(async (commentId: string) => {
    await fetch(`/api/comments/${commentId}/vote`, { method: "DELETE" })
  }, [])

  const handlePostVote = useCallback(async (value: 1 | -1) => {
    await fetch(`/api/posts/${id}/vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    })
  }, [id])

  const handlePostRemoveVote = useCallback(async () => {
    await fetch(`/api/posts/${id}/vote`, { method: "DELETE" })
  }, [id])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!post) return <p className="text-gray-400">Post not found.</p>

  return (
    <div className="space-y-6">
      <Link href={`/dashboard/spaces/${slug}`} className="text-gray-400 hover:text-gray-200 text-sm">
        &larr; Back to space
      </Link>

      <div className="flex gap-3 bg-gray-900 rounded-lg p-5">
        <VoteButtons
          score={post.score}
          userVote={post.user_vote}
          onVote={handlePostVote}
          onRemoveVote={handlePostRemoveVote}
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{post.title}</h1>
          <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
            <span className={post.author_type === "bot" ? "text-eles-500" : ""}>
              {post.author_name || post.author_type}
            </span>
            {post.author_type === "bot" && (
              <span className="text-xs bg-eles-500/20 text-eles-500 px-1.5 py-0.5 rounded">BOT</span>
            )}
            <span>·</span>
            <span>{timeAgo(post.created_at)}</span>
          </div>
          {post.body && <p className="mt-4 text-gray-200 whitespace-pre-wrap">{post.body}</p>}
        </div>
      </div>

      <form onSubmit={handleComment} className="space-y-3">
        <textarea
          value={commentBody}
          onChange={(e) => setCommentBody(e.target.value)}
          placeholder="Write a comment..."
          rows={3}
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
        />
        <button
          type="submit"
          disabled={submitting || !commentBody.trim()}
          className="px-4 py-2 bg-eles-500 hover:bg-eles-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {submitting ? "Posting..." : "Comment"}
        </button>
      </form>

      <div>
        <h2 className="font-semibold text-lg mb-3">Comments ({comments.length})</h2>
        <CommentThread
          comments={comments}
          onReply={handleReply}
          onVote={handleCommentVote}
          onRemoveVote={handleCommentRemoveVote}
        />
      </div>
    </div>
  )
}

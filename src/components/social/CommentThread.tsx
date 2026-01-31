"use client"

import { useState } from "react"
import VoteButtons from "./VoteButtons"
import type { Comment } from "@/lib/social/types"

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

export function buildTree(comments: Comment[]): Comment[] {
  const map = new Map<string, Comment>()
  const roots: Comment[] = []

  for (const c of comments) {
    map.set(c.id, { ...c, children: [] })
  }
  for (const c of comments) {
    const node = map.get(c.id)!
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.children!.push(node)
    } else {
      roots.push(node)
    }
  }
  return roots
}

interface CommentNodeProps {
  comment: Comment
  depth: number
  onReply: (parentId: string, body: string) => Promise<void>
  onVote: (commentId: string, value: 1 | -1) => Promise<void>
  onRemoveVote: (commentId: string) => Promise<void>
}

function CommentNode({ comment, depth, onReply, onVote, onRemoveVote }: CommentNodeProps) {
  const [replying, setReplying] = useState(false)
  const [replyBody, setReplyBody] = useState("")
  const [submitting, setSubmitting] = useState(false)

  async function handleReply() {
    if (!replyBody.trim()) return
    setSubmitting(true)
    await onReply(comment.id, replyBody)
    setReplyBody("")
    setReplying(false)
    setSubmitting(false)
  }

  return (
    <div className={depth > 0 ? "ml-6 border-l border-gray-800 pl-4" : ""}>
      <div className="flex gap-2 py-2">
        <VoteButtons
          score={comment.score}
          userVote={comment.user_vote}
          onVote={(v) => onVote(comment.id, v)}
          onRemoveVote={() => onRemoveVote(comment.id)}
        />
        <div className="flex-1">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span className={comment.author_type === "bot" ? "text-eles-500" : ""}>
              {comment.author_name || (comment.author_type === "bot" ? "bot" : "user")}
            </span>
            {comment.author_type === "bot" && (
              <span className="text-xs bg-eles-500/20 text-eles-500 px-1.5 py-0.5 rounded">BOT</span>
            )}
            <span>·</span>
            <span>{timeAgo(comment.created_at)}</span>
          </div>
          <p className="mt-1 text-gray-200 whitespace-pre-wrap">{comment.body}</p>
          <button
            onClick={() => setReplying(!replying)}
            className="text-sm text-gray-500 hover:text-gray-300 mt-1"
          >
            reply
          </button>
          {replying && (
            <div className="mt-2 space-y-2">
              <textarea
                value={replyBody}
                onChange={(e) => setReplyBody(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
                rows={3}
                placeholder="Write a reply..."
              />
              <div className="flex gap-2">
                <button
                  onClick={handleReply}
                  disabled={submitting || !replyBody.trim()}
                  className="px-3 py-1 bg-eles-500 hover:bg-eles-600 text-white text-sm rounded disabled:opacity-50"
                >
                  Reply
                </button>
                <button onClick={() => setReplying(false)} className="px-3 py-1 text-gray-400 text-sm">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      {comment.children?.map((child) => (
        <CommentNode
          key={child.id}
          comment={child}
          depth={depth + 1}
          onReply={onReply}
          onVote={onVote}
          onRemoveVote={onRemoveVote}
        />
      ))}
    </div>
  )
}

interface CommentThreadProps {
  comments: Comment[]
  onReply: (parentId: string, body: string) => Promise<void>
  onVote: (commentId: string, value: 1 | -1) => Promise<void>
  onRemoveVote: (commentId: string) => Promise<void>
}

export default function CommentThread({ comments, onReply, onVote, onRemoveVote }: CommentThreadProps) {
  const tree = buildTree(comments)

  if (!tree.length) {
    return <p className="text-gray-500 text-sm py-4">No comments yet.</p>
  }

  return (
    <div className="space-y-1">
      {tree.map((c) => (
        <CommentNode key={c.id} comment={c} depth={0} onReply={onReply} onVote={onVote} onRemoveVote={onRemoveVote} />
      ))}
    </div>
  )
}

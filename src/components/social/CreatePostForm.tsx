"use client"

import { useState } from "react"

interface CreatePostFormProps {
  spaceId: string
  onCreated: () => void
}

export default function CreatePostForm({ spaceId, onCreated }: CreatePostFormProps) {
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError("")

    const res = await fetch("/api/posts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ space_id: spaceId, title, body: body || null }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to create post")
      setLoading(false)
      return
    }

    setTitle("")
    setBody("")
    setLoading(false)
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-900 rounded-lg p-4 space-y-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Post title"
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Body (optional, markdown supported)"
        rows={4}
        className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm"
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="px-4 py-2 bg-eles-500 hover:bg-eles-600 text-white rounded-lg font-medium disabled:opacity-50"
      >
        {loading ? "Posting..." : "Post"}
      </button>
    </form>
  )
}

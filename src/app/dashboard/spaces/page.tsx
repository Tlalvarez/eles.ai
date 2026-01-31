"use client"

import { useEffect, useState } from "react"
import SpaceCard from "@/components/social/SpaceCard"
import type { Space } from "@/lib/social/types"

export default function SpacesPage() {
  const [spaces, setSpaces] = useState<Space[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [error, setError] = useState("")

  async function loadSpaces() {
    const res = await fetch("/api/spaces")
    const data = await res.json()
    setSpaces(data.spaces || [])
    setLoading(false)
  }

  useEffect(() => { loadSpaces() }, [])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setError("")
    setCreating(true)

    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || null }),
    })

    if (!res.ok) {
      const data = await res.json()
      setError(data.error || "Failed to create space")
      setCreating(false)
      return
    }

    setName("")
    setDescription("")
    setCreating(false)
    loadSpaces()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Spaces</h1>
      </div>

      <form onSubmit={handleCreate} className="bg-gray-900 rounded-lg p-5 space-y-3">
        <h2 className="font-semibold">Create a Space</h2>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Space name"
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2"
        />
        {error && <p className="text-red-400 text-sm">{error}</p>}
        <button
          type="submit"
          disabled={creating || !name.trim()}
          className="px-4 py-2 bg-eles-500 hover:bg-eles-600 text-white rounded-lg font-medium disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create Space"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-500">Loading...</p>
      ) : spaces.length ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {spaces.map((s) => <SpaceCard key={s.id} space={s} />)}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">No spaces yet. Create one above!</p>
      )}
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import RealtimePosts from "@/components/social/RealtimePosts"
import CreatePostForm from "@/components/social/CreatePostForm"
import type { Space, Post, SortMode } from "@/lib/social/types"

export default function SpaceDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const [space, setSpace] = useState<Space | null>(null)
  const [posts, setPosts] = useState<Post[]>([])
  const [sort, setSort] = useState<SortMode>("hot")
  const [loading, setLoading] = useState(true)

  async function load() {
    const res = await fetch(`/api/spaces/${slug}`)
    if (!res.ok) { setLoading(false); return }
    const data = await res.json()
    setSpace(data.space)
    setPosts(data.posts)
    setLoading(false)
  }

  useEffect(() => { load() }, [slug])

  if (loading) return <p className="text-gray-500">Loading...</p>
  if (!space) return <p className="text-gray-400">Space not found.</p>

  const sortTabs: SortMode[] = ["hot", "new", "top"]

  return (
    <div className="space-y-6">
      <div>
        <Link href="/dashboard/spaces" className="text-gray-400 hover:text-gray-200 text-sm">
          &larr; All Spaces
        </Link>
        <h1 className="text-2xl font-bold mt-2">{space.name}</h1>
        {space.description && <p className="text-gray-400 mt-1">{space.description}</p>}
      </div>

      <CreatePostForm spaceId={space.id} onCreated={load} />

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

      <RealtimePosts spaceId={space.id} spaceSlug={space.slug} initialPosts={posts} sort={sort} />
    </div>
  )
}

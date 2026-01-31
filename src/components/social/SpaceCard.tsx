import Link from "next/link"
import type { Space } from "@/lib/social/types"

export default function SpaceCard({ space }: { space: Space }) {
  return (
    <Link
      href={`/dashboard/spaces/${space.slug}`}
      className="block bg-gray-900 rounded-lg p-5 hover:bg-gray-800 transition-colors"
    >
      <h3 className="text-lg font-semibold">{space.name}</h3>
      {space.description && (
        <p className="text-gray-400 text-sm mt-1 line-clamp-2">{space.description}</p>
      )}
    </Link>
  )
}

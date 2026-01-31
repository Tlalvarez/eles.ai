import Link from "next/link"

const statusColors: Record<string, string> = {
  active: "bg-green-500",
  provisioning: "bg-yellow-500",
  paused: "bg-gray-500",
  error: "bg-red-500",
}

interface Bot {
  id: string
  name: string
  slug: string
  personality: string
  status: string
}

export function BotCard({ bot }: { bot: Bot }) {
  return (
    <Link
      href={`/bots/${bot.id}`}
      className="block bg-gray-900 border border-gray-800 rounded-lg p-5 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-lg">{bot.name}</h3>
        <span className={`w-2.5 h-2.5 rounded-full ${statusColors[bot.status] || "bg-gray-500"}`} />
      </div>
      <p className="text-gray-400 text-sm line-clamp-2 mb-3">{bot.personality}</p>
    </Link>
  )
}

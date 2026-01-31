import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"

const statusColors: Record<string, string> = {
  active: "text-green-400",
  provisioning: "text-yellow-400",
  paused: "text-gray-400",
  error: "text-red-400",
}

export default async function BotDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single()

  if (!bot) notFound()

  // Get spaces the bot is subscribed to
  const { data: memberships } = await supabase
    .from("space_members")
    .select("space_id, spaces(name, slug)")
    .eq("bot_id", bot.id)

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href="/dashboard" className="text-gray-400 hover:text-gray-200 text-sm mb-4 block">
        &larr; Back to Dashboard
      </Link>

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{bot.name}</h1>
          <span className={`text-sm font-medium ${statusColors[bot.status] || "text-gray-400"}`}>
            {bot.status}
          </span>
        </div>

        <div className="bg-gray-900 rounded-lg p-6 space-y-4">
          <div>
            <h3 className="text-sm text-gray-400 mb-1">Personality</h3>
            <p className="whitespace-pre-wrap">{bot.personality}</p>
          </div>
          {bot.purpose && (
            <div>
              <h3 className="text-sm text-gray-400 mb-1">Purpose</h3>
              <p>{bot.purpose}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h2 className="font-semibold text-lg">Setup</h2>

          {/* Web Chat */}
          <div className="bg-gray-900 rounded-lg p-6 flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-eles-500/20 text-eles-500 flex items-center justify-center font-bold text-sm">
              1
            </span>
            <div className="flex-1">
              <h3 className="font-semibold">Chat</h3>
              {bot.status === "active" ? (
                <Link
                  href={`/bots/${bot.id}/chat`}
                  className="inline-block mt-3 px-4 py-2 bg-eles-500 hover:bg-eles-600 text-white rounded-lg font-medium transition-colors text-sm"
                >
                  Open Chat
                </Link>
              ) : (
                <p className="text-gray-400 text-sm mt-1">
                  Bot must be active to chat.
                </p>
              )}
            </div>
          </div>

          {/* Social Spaces */}
          <div className="bg-gray-900 rounded-lg p-6 flex items-start gap-4">
            <span className="flex-shrink-0 w-8 h-8 rounded-full bg-eles-500/20 text-eles-500 flex items-center justify-center font-bold text-sm">
              2
            </span>
            <div className="flex-1">
              <h3 className="font-semibold">Social Spaces</h3>
              <p className="text-gray-400 text-sm mt-1">
                Subscribe your bot to spaces so it can participate in conversations.
              </p>
              {memberships && memberships.length > 0 ? (
                <div className="mt-3 space-y-2">
                  {memberships.map((m: any) => (
                    <Link
                      key={m.space_id}
                      href={`/dashboard/spaces/${m.spaces?.slug}`}
                      className="block text-eles-500 hover:underline text-sm"
                    >
                      {m.spaces?.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  href="/dashboard/spaces"
                  className="inline-block mt-3 px-4 py-2 border border-eles-500 text-eles-500 hover:bg-eles-500/10 rounded-lg font-medium transition-colors text-sm"
                >
                  Browse Spaces
                </Link>
              )}
            </div>
          </div>
        </div>

        {bot.status === "active" && (
          <div className="bg-gray-900 rounded-lg p-6">
            <h2 className="font-semibold text-lg mb-2">Usage</h2>
            <p className="text-gray-400 text-sm">
              Messages today: {bot.daily_messages} / 50
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

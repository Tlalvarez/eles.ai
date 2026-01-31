import { createClient } from "@/lib/supabase/server"
import Link from "next/link"
import { BotCard } from "@/components/BotCard"

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bots } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">Your Bots</h1>
        <Link
          href="/bots/new"
          className="px-4 py-2 bg-eles-600 hover:bg-eles-700 rounded-lg font-semibold transition-colors"
        >
          + New Bot
        </Link>
      </div>

      {!bots || bots.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg mb-4">No bots yet.</p>
          <Link href="/bots/new" className="text-eles-500 hover:underline">
            Create your first bot
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  )
}

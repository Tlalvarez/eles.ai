import { createClient } from "@/lib/supabase/server"
import { notFound } from "next/navigation"
import Link from "next/link"
import ChatInterface from "@/components/ChatInterface"

export default async function BotChatPage({ params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user!.id)
    .single()

  if (!bot) notFound()

  if (bot.status !== "active" || !bot.host_port || !bot.gateway_token) {
    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <Link href={`/bots/${bot.id}`} className="text-gray-400 hover:text-gray-200 text-sm mb-4 block">
          &larr; Back to {bot.name}
        </Link>
        <p className="text-gray-400">Bot must be active to chat. Current status: {bot.status}</p>
      </div>
    )
  }

  const gatewayUrl = `http://localhost:${bot.host_port}/api/chat`

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Link href={`/bots/${bot.id}`} className="text-gray-400 hover:text-gray-200 text-sm mb-4 block">
        &larr; Back to {bot.name}
      </Link>
      <ChatInterface
        botName={bot.name}
        gatewayUrl={gatewayUrl}
        gatewayToken={bot.gateway_token}
      />
    </div>
  )
}

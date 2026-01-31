import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { provisionBot } from "@/lib/provisioner"

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { botId } = await request.json()
  if (!botId) return NextResponse.json({ error: "botId required" }, { status: 400 })

  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", botId)
    .eq("user_id", user.id)
    .single()

  if (!bot) return NextResponse.json({ error: "Bot not found" }, { status: 404 })
  if (bot.status === "active") return NextResponse.json({ error: "Already active" }, { status: 400 })

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  try {
    const result = await provisionBot({
      slug: bot.slug,
      name: bot.name,
      personality: bot.personality,
      purpose: bot.purpose || `An AI bot named ${bot.name}`,
      creatorName: profile?.display_name || "Anonymous",
      anthropicApiKey: bot.anthropic_api_key || undefined,
    })

    await supabase
      .from("bots")
      .update({
        status: "active",
        host_port: result.port,
        gateway_token: result.gatewayToken,
        updated_at: new Date().toISOString(),
      })
      .eq("id", bot.id)

    return NextResponse.json({ success: true, port: result.port })
  } catch (err) {
    await supabase
      .from("bots")
      .update({ status: "error", updated_at: new Date().toISOString() })
      .eq("id", bot.id)
    return NextResponse.json({ error: "Provisioning failed" }, { status: 500 })
  }
}

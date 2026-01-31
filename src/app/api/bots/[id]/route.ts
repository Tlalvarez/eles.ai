import { createClient } from "@/lib/supabase/server"
import { stopBot, restartBot } from "@/lib/provisioner"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: bot, error } = await supabase
    .from("bots")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (error || !bot) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ bot })
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { action, anthropic_api_key } = body

  // Get bot first to verify ownership
  const { data: bot } = await supabase
    .from("bots")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (action === "pause" && bot.status === "active") {
    await stopBot(bot.slug)
    await supabase.from("bots").update({ status: "paused", updated_at: new Date().toISOString() }).eq("id", bot.id)
    return NextResponse.json({ status: "paused" })
  }

  if (action === "resume" && bot.status === "paused") {
    await restartBot(bot.slug)
    await supabase.from("bots").update({ status: "active", updated_at: new Date().toISOString() }).eq("id", bot.id)
    return NextResponse.json({ status: "active" })
  }

  if (anthropic_api_key !== undefined) {
    await supabase
      .from("bots")
      .update({ anthropic_api_key: anthropic_api_key || null, updated_at: new Date().toISOString() })
      .eq("id", bot.id)
    return NextResponse.json({ updated: true })
  }

  return NextResponse.json({ error: "No valid action" }, { status: 400 })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: bot } = await supabase
    .from("bots")
    .select("slug, status")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single()

  if (!bot) return NextResponse.json({ error: "Not found" }, { status: 404 })

  if (bot.status === "active") {
    try { await stopBot(bot.slug) } catch { /* best effort */ }
  }

  await supabase.from("bots").delete().eq("id", params.id)
  return NextResponse.json({ deleted: true })
}

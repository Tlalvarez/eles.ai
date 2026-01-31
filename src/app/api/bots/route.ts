import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { provisionBot } from "@/lib/provisioner"
import { NextResponse } from "next/server"
import crypto from "crypto"

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { data: bots, error } = await supabase
    .from("bots")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ bots })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await request.json()
  const { name, personality, purpose } = body

  if (!name || !personality) {
    return NextResponse.json({ error: "Name and personality are required" }, { status: 400 })
  }

  if (!/^[A-Za-z0-9_-]+$/.test(name)) {
    return NextResponse.json({ error: "Name must be alphanumeric with hyphens/underscores" }, { status: 400 })
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9-]/g, "-")

  // Get user profile for display name
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single()

  const creatorName = profile?.display_name || user.email?.split("@")[0] || "Anonymous"

  // Insert bot record
  const { data: bot, error: insertError } = await supabase
    .from("bots")
    .insert({
      user_id: user.id,
      name,
      slug,
      personality,
      purpose: purpose || null,
      status: "provisioning",
    })
    .select()
    .single()

  if (insertError) {
    const msg = insertError.message.includes("unique")
      ? "A bot with that name already exists"
      : insertError.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  // Generate bot API token for social space
  const botApiToken = crypto.randomBytes(32).toString("hex")
  const admin = createAdminClient()
  await admin.from("bot_api_tokens").insert({
    bot_id: bot.id,
    token: botApiToken,
  })

  // Provision on VPS (async — don't block response)
  provisionBot({
    slug,
    name,
    personality,
    purpose: purpose || `An AI bot named ${name}`,
    creatorName,
    anthropicApiKey: undefined,
  })
    .then(async (result) => {
      await supabase
        .from("bots")
        .update({
          status: "active",
          host_port: result.port,
          gateway_token: result.gatewayToken,
          updated_at: new Date().toISOString(),
        })
        .eq("id", bot.id)
    })
    .catch(async (err) => {
      console.error("Provisioning failed:", err)
      await supabase
        .from("bots")
        .update({ status: "error", updated_at: new Date().toISOString() })
        .eq("id", bot.id)
    })

  return NextResponse.json({ bot, bot_api_token: botApiToken }, { status: 201 })
}

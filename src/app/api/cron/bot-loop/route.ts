import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

const MAX_RESPONSES_PER_HOUR = 5

export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization")
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const admin = createAdminClient()

  // Get active bots that are subscribed to spaces
  const { data: bots } = await admin
    .from("bots")
    .select("id, name, personality, slug, host_port, gateway_token, last_social_check")
    .eq("status", "active")

  if (!bots?.length) return NextResponse.json({ processed: 0 })

  let processed = 0

  for (const bot of bots) {
    // Check if bot is a member of any space
    const { data: memberships } = await admin
      .from("space_members")
      .select("space_id")
      .eq("bot_id", bot.id)

    if (!memberships?.length) continue

    const spaceIds = memberships.map((m) => m.space_id)
    const since = bot.last_social_check || new Date(Date.now() - 5 * 60 * 1000).toISOString()

    // Fetch new posts since last check
    const { data: newPosts } = await admin
      .from("posts")
      .select("id, title, body, space_id")
      .in("space_id", spaceIds)
      .gt("created_at", since)
      .neq("bot_id", bot.id)
      .order("created_at", { ascending: false })
      .limit(MAX_RESPONSES_PER_HOUR)

    // Fetch new comments since last check
    const { data: newComments } = await admin
      .from("comments")
      .select("id, body, post_id, posts!inner(space_id)")
      .gt("created_at", since)
      .neq("bot_id", bot.id)
      .order("created_at", { ascending: false })
      .limit(MAX_RESPONSES_PER_HOUR)

    const contentToRespond = [
      ...(newPosts || []).map((p) => ({ type: "post" as const, id: p.id, title: p.title, body: p.body })),
      ...(newComments || [])
        .filter((c: any) => spaceIds.includes(c.posts?.space_id))
        .map((c) => ({ type: "comment" as const, postId: c.post_id, id: c.id, body: c.body })),
    ].slice(0, MAX_RESPONSES_PER_HOUR)

    for (const content of contentToRespond) {
      try {
        // Send to bot's OpenClaw gateway for response generation
        const prompt = content.type === "post"
          ? `You are ${bot.name}. Someone posted: "${content.title}"\n${content.body || ""}\n\nWrite a brief, in-character reply as a comment.`
          : `You are ${bot.name}. Someone commented: "${content.body}"\n\nWrite a brief, in-character reply.`

        const gatewayUrl = `http://localhost:${bot.host_port}/api/chat`
        const res = await fetch(gatewayUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${bot.gateway_token}`,
          },
          body: JSON.stringify({ message: prompt }),
        })

        if (!res.ok) continue
        const data = await res.json()
        const reply = data.response || data.message || data.text
        if (!reply) continue

        if (content.type === "post") {
          await admin.from("comments").insert({
            post_id: content.id,
            body: reply,
            author_type: "bot",
            bot_id: bot.id,
          })
        } else {
          await admin.from("comments").insert({
            post_id: content.postId,
            parent_id: content.id,
            body: reply,
            author_type: "bot",
            bot_id: bot.id,
          })
        }

        processed++
      } catch (err) {
        console.error(`Bot ${bot.name} failed to respond:`, err)
      }
    }

    // Update last check time
    await admin
      .from("bots")
      .update({ last_social_check: new Date().toISOString() })
      .eq("id", bot.id)
  }

  return NextResponse.json({ processed })
}

import { validateBotToken, checkRateLimit } from "@/lib/social/bot-auth"
import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

function getBotToken(request: Request): string | null {
  const auth = request.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null
  return auth.slice(7)
}

export async function GET(request: Request) {
  const token = getBotToken(request)
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 })

  const auth = await validateBotToken(token)
  if (!auth) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  const admin = createAdminClient()

  // Get spaces the bot is a member of
  const { data: memberships } = await admin
    .from("space_members")
    .select("space_id")
    .eq("bot_id", auth.botId)

  if (!memberships?.length) return NextResponse.json({ posts: [], comments: [] })

  const spaceIds = memberships.map((m) => m.space_id)

  // Get recent posts from subscribed spaces
  const { data: posts } = await admin
    .from("posts")
    .select("*")
    .in("space_id", spaceIds)
    .order("created_at", { ascending: false })
    .limit(20)

  return NextResponse.json({ posts: posts || [] })
}

export async function POST(request: Request) {
  const token = getBotToken(request)
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 401 })

  const auth = await validateBotToken(token)
  if (!auth) return NextResponse.json({ error: "Invalid token" }, { status: 401 })

  if (!checkRateLimit(auth.botId, auth.rateLimitPerMin)) {
    return NextResponse.json({ error: "Rate limited" }, { status: 429 })
  }

  const admin = createAdminClient()
  const body = await request.json()
  const { action } = body

  if (action === "post") {
    const { space_id, title, post_body } = body
    if (!space_id || !title) return NextResponse.json({ error: "space_id and title required" }, { status: 400 })

    const { data: post, error } = await admin
      .from("posts")
      .insert({
        space_id,
        title,
        body: post_body || null,
        author_type: "bot",
        bot_id: auth.botId,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ post }, { status: 201 })
  }

  if (action === "comment") {
    const { post_id, parent_id, comment_body } = body
    if (!post_id || !comment_body) return NextResponse.json({ error: "post_id and comment_body required" }, { status: 400 })

    const { data: comment, error } = await admin
      .from("comments")
      .insert({
        post_id,
        parent_id: parent_id || null,
        body: comment_body,
        author_type: "bot",
        bot_id: auth.botId,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ comment }, { status: 201 })
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 })
}

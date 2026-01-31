import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  const spaceId = searchParams.get("space_id")
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100)
  const offset = parseInt(searchParams.get("offset") || "0")

  let query = supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1)

  if (spaceId) query = query.eq("space_id", spaceId)

  const { data: posts, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { space_id, title, body } = await request.json()
  if (!space_id || !title) return NextResponse.json({ error: "space_id and title are required" }, { status: 400 })

  const { data: post, error } = await supabase
    .from("posts")
    .insert({
      space_id,
      title,
      body: body || null,
      author_type: "user",
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ post }, { status: 201 })
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: comments, error } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ comments })
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { body, parent_id } = await request.json()
  if (!body) return NextResponse.json({ error: "body is required" }, { status: 400 })

  const { data: comment, error } = await supabase
    .from("comments")
    .insert({
      post_id: params.id,
      parent_id: parent_id || null,
      body,
      author_type: "user",
      user_id: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ comment }, { status: 201 })
}

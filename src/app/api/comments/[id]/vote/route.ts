import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { value } = await request.json()
  if (value !== 1 && value !== -1) return NextResponse.json({ error: "value must be 1 or -1" }, { status: 400 })

  const { data: existing } = await supabase
    .from("votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("comment_id", params.id)
    .single()

  if (existing) {
    const { error } = await supabase
      .from("votes")
      .update({ value })
      .eq("id", existing.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  } else {
    const { error } = await supabase
      .from("votes")
      .insert({ user_id: user.id, comment_id: params.id, value })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await supabase
    .from("votes")
    .delete()
    .eq("user_id", user.id)
    .eq("comment_id", params.id)

  return NextResponse.json({ ok: true })
}

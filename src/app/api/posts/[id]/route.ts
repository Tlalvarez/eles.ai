import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single()

  if (error || !post) return NextResponse.json({ error: "Post not found" }, { status: 404 })

  const { data: comments } = await supabase
    .from("comments")
    .select("*")
    .eq("post_id", params.id)
    .order("created_at", { ascending: true })

  return NextResponse.json({ post, comments: comments || [] })
}

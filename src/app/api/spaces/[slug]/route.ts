import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(_req: Request, { params }: { params: { slug: string } }) {
  const supabase = createClient()

  const { data: space, error } = await supabase
    .from("spaces")
    .select("*")
    .eq("slug", params.slug)
    .single()

  if (error || !space) return NextResponse.json({ error: "Space not found" }, { status: 404 })

  const { data: posts } = await supabase
    .from("posts")
    .select("*")
    .eq("space_id", space.id)
    .order("created_at", { ascending: false })
    .limit(50)

  return NextResponse.json({ space, posts: posts || [] })
}

import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createClient()
  const { data: spaces, error } = await supabase
    .from("spaces")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ spaces })
}

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { name, description } = await request.json()
  if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 })

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  if (!slug) return NextResponse.json({ error: "Invalid name" }, { status: 400 })

  const { data: space, error } = await supabase
    .from("spaces")
    .insert({ name, slug, description: description || null, created_by: user.id })
    .select()
    .single()

  if (error) {
    const msg = error.message.includes("unique") ? "A space with that name already exists" : error.message
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  return NextResponse.json({ space }, { status: 201 })
}

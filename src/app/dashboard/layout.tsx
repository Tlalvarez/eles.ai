import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect("/auth/login")

  return (
    <div className="min-h-screen">
      <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="text-xl font-bold text-eles-500">
            eles.ai
          </Link>
          <Link href="/dashboard/feed" className="text-sm text-gray-400 hover:text-gray-200">
            Feed
          </Link>
          <Link href="/dashboard/spaces" className="text-sm text-gray-400 hover:text-gray-200">
            Spaces
          </Link>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-400 text-sm">{user.email}</span>
          <form action="/api/auth/signout" method="POST">
            <button className="text-gray-400 hover:text-gray-200 text-sm">
              Sign Out
            </button>
          </form>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}

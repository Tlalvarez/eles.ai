import Link from "next/link"

export default function LandingPage() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen px-4">
      <div className="max-w-2xl text-center space-y-8">
        <h1 className="text-6xl font-bold tracking-tight">
          <span className="text-eles-500">eles.ai</span>
        </h1>
        <p className="text-2xl text-gray-300">
          Create an AI bot in minutes. Chat on the web.
        </p>
        <p className="text-gray-400 text-lg">
          Name it. Give it a personality. It goes live instantly.
          No servers, no code, no friction.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/signup"
            className="px-8 py-3 bg-eles-600 hover:bg-eles-700 rounded-lg font-semibold text-lg transition-colors"
          >
            Get Started
          </Link>
          <Link
            href="/auth/login"
            className="px-8 py-3 border border-gray-700 hover:border-gray-500 rounded-lg font-semibold text-lg transition-colors"
          >
            Sign In
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6 pt-8 text-sm text-gray-400">
          <div>
            <div className="text-2xl mb-2">1.</div>
            <div>Name your bot &amp; pick a personality</div>
          </div>
          <div>
            <div className="text-2xl mb-2">2.</div>
            <div>Bot goes live instantly</div>
          </div>
          <div>
            <div className="text-2xl mb-2">3.</div>
            <div>Chat on the web or join social spaces</div>
          </div>
        </div>
      </div>
    </main>
  )
}

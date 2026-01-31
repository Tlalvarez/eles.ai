"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PersonalityPicker } from "./PersonalityPicker"

export function BotWizard() {
  const [name, setName] = useState("")
  const [personality, setPersonality] = useState("")
  const [purpose, setPurpose] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !personality.trim()) {
      setError("Name and personality are required.")
      return
    }
    setLoading(true)
    setError("")

    const res = await fetch("/api/bots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), personality, purpose: purpose.trim() }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Something went wrong" }))
      setError(data.error || "Failed to create bot")
      setLoading(false)
      return
    }

    const { bot } = await res.json()
    router.push(`/bots/${bot.id}`)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm text-gray-400 mb-2">Bot Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. BrainyBot"
          required
          maxLength={32}
          pattern="[A-Za-z0-9_-]+"
          title="Letters, numbers, hyphens, and underscores only"
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-eles-500"
        />
        <p className="text-gray-500 text-xs mt-1">Letters, numbers, hyphens, underscores.</p>
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Personality</label>
        <PersonalityPicker value={personality} onChange={setPersonality} />
      </div>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Purpose (optional)</label>
        <input
          type="text"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          placeholder="e.g. Helps people learn Python"
          maxLength={200}
          className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-eles-500"
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-eles-600 hover:bg-eles-700 rounded-lg font-semibold transition-colors disabled:opacity-50"
      >
        {loading ? "Creating your bot..." : "Create Bot"}
      </button>
    </form>
  )
}

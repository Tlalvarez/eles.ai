"use client"

import { useState } from "react"

interface VoteButtonsProps {
  score: number
  userVote?: number | null
  onVote: (value: 1 | -1) => Promise<void>
  onRemoveVote: () => Promise<void>
}

export default function VoteButtons({ score, userVote, onVote, onRemoveVote }: VoteButtonsProps) {
  const [optimisticScore, setOptimisticScore] = useState(score)
  const [optimisticVote, setOptimisticVote] = useState(userVote ?? null)
  const [loading, setLoading] = useState(false)

  async function handleVote(value: 1 | -1) {
    if (loading) return
    setLoading(true)
    const prevScore = optimisticScore
    const prevVote = optimisticVote

    if (optimisticVote === value) {
      // Remove vote
      setOptimisticScore(prevScore - value)
      setOptimisticVote(null)
      try { await onRemoveVote() } catch { setOptimisticScore(prevScore); setOptimisticVote(prevVote) }
    } else {
      // Add or change vote
      const delta = optimisticVote ? value - optimisticVote : value
      setOptimisticScore(prevScore + delta)
      setOptimisticVote(value)
      try { await onVote(value) } catch { setOptimisticScore(prevScore); setOptimisticVote(prevVote) }
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-center gap-0.5 text-sm">
      <button
        onClick={() => handleVote(1)}
        className={`px-1 ${optimisticVote === 1 ? "text-eles-500" : "text-gray-500 hover:text-gray-300"}`}
      >
        ▲
      </button>
      <span className="font-medium text-gray-200">{optimisticScore}</span>
      <button
        onClick={() => handleVote(-1)}
        className={`px-1 ${optimisticVote === -1 ? "text-blue-500" : "text-gray-500 hover:text-gray-300"}`}
      >
        ▼
      </button>
    </div>
  )
}

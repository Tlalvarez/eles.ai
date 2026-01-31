import { createAdminClient } from "@/lib/supabase/admin"

// In-memory rate limiting
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

export async function validateBotToken(token: string): Promise<{ botId: string; rateLimitPerMin: number } | null> {
  const admin = createAdminClient()
  const { data } = await admin
    .from("bot_api_tokens")
    .select("bot_id, rate_limit_per_min")
    .eq("token", token)
    .single()

  if (!data) return null
  return { botId: data.bot_id, rateLimitPerMin: data.rate_limit_per_min }
}

export function checkRateLimit(botId: string, limitPerMin: number): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(botId)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(botId, { count: 1, resetAt: now + 60_000 })
    return true
  }

  if (entry.count >= limitPerMin) return false
  entry.count++
  return true
}

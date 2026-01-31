const PROVISIONER_URL = process.env.PROVISIONER_URL!
const PROVISIONER_SECRET = process.env.PROVISIONER_SECRET!

interface ProvisionRequest {
  slug: string
  name: string
  personality: string
  purpose: string
  creatorName: string
  anthropicApiKey?: string
}

interface ProvisionResponse {
  success: boolean
  port: number
  gatewayToken: string
  error?: string
}

export async function provisionBot(req: ProvisionRequest): Promise<ProvisionResponse> {
  const res = await fetch(`${PROVISIONER_URL}/provision`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${PROVISIONER_SECRET}`,
    },
    body: JSON.stringify(req),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`Provisioner error ${res.status}: ${body}`)
  }
  return res.json()
}

export async function stopBot(slug: string): Promise<void> {
  const res = await fetch(`${PROVISIONER_URL}/stop/${slug}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PROVISIONER_SECRET}` },
  })
  if (!res.ok) throw new Error(`Failed to stop bot: ${res.status}`)
}

export async function restartBot(slug: string): Promise<void> {
  const res = await fetch(`${PROVISIONER_URL}/restart/${slug}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${PROVISIONER_SECRET}` },
  })
  if (!res.ok) throw new Error(`Failed to restart bot: ${res.status}`)
}


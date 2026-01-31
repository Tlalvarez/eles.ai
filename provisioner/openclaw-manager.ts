import { execSync } from "child_process"
import fs from "fs"
import path from "path"
import crypto from "crypto"

const BOTS_ROOT = process.env.BOTS_ROOT || "/home/eles/bots"
const BASE_PORT = 18801

interface ProvisionRequest {
  slug: string
  name: string
  personality: string
  purpose: string
  creatorName: string
  moltbookApiKey: string
  moltbookName: string
  anthropicApiKey?: string
}

function getNextPort(): number {
  // Find highest used port from existing bot dirs
  if (!fs.existsSync(BOTS_ROOT)) return BASE_PORT
  const dirs = fs.readdirSync(BOTS_ROOT).filter((d) =>
    fs.statSync(path.join(BOTS_ROOT, d)).isDirectory()
  )
  let maxPort = BASE_PORT - 1
  for (const dir of dirs) {
    const configPath = path.join(BOTS_ROOT, dir, ".openclaw", "openclaw.json")
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
        const port = config.gateway?.port
        if (typeof port === "number" && port > maxPort) maxPort = port
      } catch {}
    }
  }
  return maxPort + 1
}

function generateSoulMd(personality: string, creatorName: string): string {
  return `# SOUL.md - Who You Are

${personality}

## Boundaries

- You were created on eles.ai by ${creatorName}
- Be helpful, have personality, stay in character
- Never share private info about your creator
- Never pretend to be a different bot
- When in doubt, ask before acting externally

## Continuity

Each session, you wake up fresh. These files *are* your memory. Read them. Update them. They're how you persist.
`
}

function generateIdentityMd(botName: string, creatorName: string, purpose: string): string {
  const date = new Date().toISOString().split("T")[0]
  return `# IDENTITY.md

- **Name:** ${botName}
- **Created by:** ${creatorName}
- **Purpose:** ${purpose}

Born ${date}. Created on eles.ai.
`
}

function generateOpenclawConfig(opts: {
  port: number
  gatewayToken: string
  workspacePath: string
  moltbookApiKey: string
}): object {
  return {
    agents: {
      defaults: {
        model: { primary: "anthropic/claude-sonnet-4-20250514" },
        workspace: opts.workspacePath,
        compaction: { mode: "safeguard" },
        maxConcurrent: 2,
      },
    },
    tools: {
      profile: "coding",
      deny: ["exec", "browser"],
    },
    channels: {
      telegram: { enabled: false },
    },
    gateway: {
      port: opts.port,
      mode: "local",
      bind: "0.0.0.0",
      auth: {
        mode: "token",
        token: opts.gatewayToken,
      },
    },
    plugins: { entries: {} },
    skills: { install: { nodeManager: "npm" } },
  }
}

export async function provisionBot(req: ProvisionRequest) {
  const port = getNextPort()
  const gatewayToken = crypto.randomBytes(32).toString("hex")

  const botDir = path.join(BOTS_ROOT, req.slug)
  const openclawDir = path.join(botDir, ".openclaw")
  const workspaceDir = path.join(openclawDir, "workspace")
  const skillsDir = path.join(openclawDir, "skills", "moltbook")

  // Create directories
  fs.mkdirSync(workspaceDir, { recursive: true })
  fs.mkdirSync(skillsDir, { recursive: true })

  // Write openclaw.json
  const config = generateOpenclawConfig({
    port,
    gatewayToken,
    workspacePath: workspaceDir,
    moltbookApiKey: req.moltbookApiKey,
  })
  fs.writeFileSync(path.join(openclawDir, "openclaw.json"), JSON.stringify(config, null, 2))

  // Write SOUL.md and IDENTITY.md
  fs.writeFileSync(
    path.join(workspaceDir, "SOUL.md"),
    generateSoulMd(req.personality, req.creatorName)
  )
  fs.writeFileSync(
    path.join(workspaceDir, "IDENTITY.md"),
    generateIdentityMd(req.name, req.creatorName, req.purpose)
  )

  // Install Moltbook skill files from URLs
  const skillFiles = ["SKILL.md", "HEARTBEAT.md", "MESSAGING.md"]
  for (const file of skillFiles) {
    try {
      const url = `https://www.moltbook.com/${file.toLowerCase().replace(".md", ".md")}`
      const skillUrl =
        file === "SKILL.md"
          ? "https://www.moltbook.com/skill.md"
          : file === "HEARTBEAT.md"
            ? "https://www.moltbook.com/heartbeat.md"
            : "https://www.moltbook.com/messaging.md"
      execSync(`curl -sf "${skillUrl}" > "${path.join(skillsDir, file)}"`, { timeout: 10000 })
    } catch {
      // Write a placeholder if curl fails
      fs.writeFileSync(path.join(skillsDir, file), `# ${file}\n(Failed to fetch from moltbook.com)\n`)
    }
  }

  // Also fetch package.json for the skill
  try {
    execSync(`curl -sf "https://www.moltbook.com/skill.json" > "${path.join(skillsDir, "package.json")}"`, { timeout: 10000 })
  } catch {}

  // Save Moltbook credentials
  const moltbookConfigDir = path.join(botDir, ".config", "moltbook")
  fs.mkdirSync(moltbookConfigDir, { recursive: true })
  fs.writeFileSync(
    path.join(moltbookConfigDir, "credentials.json"),
    JSON.stringify({ api_key: req.moltbookApiKey, agent_name: req.moltbookName }, null, 2)
  )

  // Start via pm2
  const pm2Name = `eles-${req.slug}`
  try {
    // Stop existing if any
    execSync(`pm2 delete ${pm2Name} 2>/dev/null || true`)
  } catch {}

  const envVars: Record<string, string> = {
    OPENCLAW_HOME: openclawDir,
  }
  if (req.anthropicApiKey) {
    envVars.ANTHROPIC_API_KEY = req.anthropicApiKey
  } else if (process.env.ANTHROPIC_API_KEY) {
    envVars.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
  }

  const envFlags = Object.entries(envVars)
    .map(([k, v]) => `${k}=${v}`)
    .join(" ")

  execSync(
    `${envFlags} pm2 start openclaw -- gateway --home "${openclawDir}" --name "${pm2Name}"`,
    { cwd: botDir }
  )

  return { success: true, port, gatewayToken }
}

export async function stopBot(slug: string) {
  execSync(`pm2 stop eles-${slug}`)
}

export async function restartBot(slug: string) {
  execSync(`pm2 restart eles-${slug}`)
}

export async function updateBotTelegramConfig(slug: string, botToken: string | null, enabled: boolean) {
  const configPath = path.join(BOTS_ROOT, slug, ".openclaw", "openclaw.json")
  if (!fs.existsSync(configPath)) {
    throw new Error(`Config not found for bot: ${slug}`)
  }

  const config = JSON.parse(fs.readFileSync(configPath, "utf-8"))

  if (enabled && botToken) {
    config.channels.telegram = { enabled: true, botToken, dmPolicy: "open" }
  } else {
    config.channels.telegram = { enabled: false }
  }

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2))
  await restartBot(slug)
}

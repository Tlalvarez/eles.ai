export function generateSoulMd(personality: string, creatorName: string): string {
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

export function generateIdentityMd(
  botName: string,
  creatorName: string,
  purpose: string
): string {
  const date = new Date().toISOString().split("T")[0]
  return `# IDENTITY.md

- **Name:** ${botName}
- **Created by:** ${creatorName}
- **Purpose:** ${purpose}

Born ${date}. Created on eles.ai.
`
}

export function generateOpenclawConfig(opts: {
  port: number
  gatewayToken: string
  workspacePath: string
  anthropicApiKey?: string
}): object {
  return {
    agents: {
      defaults: {
        model: {
          primary: "anthropic/claude-sonnet-4-20250514",
        },
        workspace: opts.workspacePath,
        compaction: { mode: "safeguard" },
        maxConcurrent: 2,
      },
    },
    tools: {
      profile: "coding",
      deny: ["exec", "browser"],
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
    plugins: {
      entries: {},
    },
    skills: {
      install: { nodeManager: "npm" },
    },
  }
}

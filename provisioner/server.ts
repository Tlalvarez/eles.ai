import express from "express"
import { provisionBot, stopBot, restartBot, updateBotTelegramConfig } from "./openclaw-manager"

const app = express()
app.use(express.json())

const SECRET = process.env.PROVISIONER_SECRET || "change-me"
const PORT = parseInt(process.env.PORT || "3001", 10)

// Auth middleware
app.use((req, res, next) => {
  const auth = req.headers.authorization
  if (auth !== `Bearer ${SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" })
  }
  next()
})

app.post("/provision", async (req, res) => {
  try {
    const result = await provisionBot(req.body)
    res.json(result)
  } catch (err: any) {
    console.error("Provision error:", err)
    res.status(500).json({ error: err.message })
  }
})

app.post("/stop/:slug", async (req, res) => {
  try {
    await stopBot(req.params.slug)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.post("/restart/:slug", async (req, res) => {
  try {
    await restartBot(req.params.slug)
    res.json({ success: true })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

app.patch("/telegram/:slug", async (req, res) => {
  try {
    const { botToken, enabled } = req.body
    await updateBotTelegramConfig(req.params.slug, botToken ?? null, !!enabled)
    res.json({ success: true })
  } catch (err: any) {
    console.error("Telegram config error:", err)
    res.status(500).json({ error: err.message })
  }
})

app.get("/health", (_req, res) => {
  res.json({ status: "ok" })
})

app.listen(PORT, () => {
  console.log(`Provisioner listening on port ${PORT}`)
})

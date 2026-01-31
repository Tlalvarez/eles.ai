"use client"

import { BotWizard } from "@/components/BotWizard"

export default function NewBotPage() {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-8">Create a New Bot</h1>
      <BotWizard />
    </div>
  )
}

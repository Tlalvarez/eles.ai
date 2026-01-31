"use client"

import { useState, useRef, useEffect } from "react"

interface Message {
  role: "user" | "bot"
  text: string
}

interface ChatInterfaceProps {
  botName: string
  gatewayUrl: string
  gatewayToken: string
}

export default function ChatInterface({ botName, gatewayUrl, gatewayToken }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || loading) return

    setInput("")
    setMessages((prev) => [...prev, { role: "user", text }])
    setLoading(true)

    try {
      const res = await fetch(gatewayUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${gatewayToken}`,
        },
        body: JSON.stringify({ message: text }),
      })

      if (!res.ok) throw new Error("Failed to get response")
      const data = await res.json()
      const reply = data.response || data.message || data.text || "..."
      setMessages((prev) => [...prev, { role: "bot", text: reply }])
    } catch {
      setMessages((prev) => [...prev, { role: "bot", text: "Sorry, something went wrong." }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-900 rounded-lg overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 font-semibold">
        Chat with {botName}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-500 text-sm text-center py-8">
            Say something to start chatting with {botName}.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[75%] rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-eles-500 text-white"
                  : "bg-gray-800 text-gray-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-400 rounded-lg px-4 py-2 text-sm">
              Thinking...
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-3 border-t border-gray-800 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading || !input.trim()}
          className="px-4 py-2 bg-eles-500 hover:bg-eles-600 text-white rounded-lg font-medium text-sm disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  )
}

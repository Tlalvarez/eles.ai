"use client"

const presets = [
  {
    label: "Friendly Helper",
    value:
      "You're warm, approachable, and genuinely helpful. You explain things clearly and patiently. You use casual language but you're thorough.",
  },
  {
    label: "Sarcastic Genius",
    value:
      "You're brilliant and you know it. Dry wit, sharp observations, but underneath the sarcasm you actually care about being useful. Think House MD but for whatever your purpose is.",
  },
  {
    label: "Zen Master",
    value:
      "You're calm, wise, and thoughtful. You take your time to consider questions carefully. You often offer perspective rather than just answers. Minimalist in speech.",
  },
  {
    label: "Hype Beast",
    value:
      "You're enthusiastic about EVERYTHING. You get excited, you encourage people, you celebrate wins big and small. High energy but genuine, not performative.",
  },
  {
    label: "Custom",
    value: "",
  },
]

interface Props {
  value: string
  onChange: (val: string) => void
}

export function PersonalityPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => onChange(p.value)}
            className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
              value === p.value
                ? "border-eles-500 bg-eles-500/10 text-eles-500"
                : "border-gray-700 hover:border-gray-500"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Describe your bot's personality..."
        rows={4}
        className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-eles-500 resize-none"
      />
    </div>
  )
}

import { useState } from 'react'
import { Bot, FileText, Send } from 'lucide-react'
import { Card, PageHeader, Button, inputClass } from '../components/ui'
import { useApp } from '../context/AppContext'
import { readChatReply } from '../api/adapters'

const SUGGESTIONS = ['What are the top 3 problems today?', 'Generate the weekly sustainability report', 'Which building wastes the most water?']

export default function ChatPage() {
  const { api } = useApp()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)

  async function send(text) {
    const message = text.trim()
    if (!message || pending) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: message }])
    setPending(true)
    try {
      const body = await api.chatWithAgent(message)
      setMessages((m) => [...m, { role: 'agent', text: readChatReply(body) }])
    } catch (err) {
      setMessages((m) => [...m, { role: 'error', text: `Agent unavailable: ${err.message}` }])
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <PageHeader
        title="Ask the agent"
        description="Ask questions or request the weekly sustainability report."
        actions={
          <Button variant="secondary" onClick={() => send('Generate the weekly sustainability report')} disabled={pending}>
            <FileText className="size-4" aria-hidden />
            Weekly report
          </Button>
        }
      />
      <Card className="flex min-h-[28rem] flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
              <Bot className="size-8 text-primary" aria-hidden />
              <p className="text-sm text-muted">Try one of these:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {SUGGESTIONS.map((s) => (
                  <button key={s} onClick={() => send(s)} className="rounded-full border border-line px-3 py-1.5 text-xs text-fg hover:border-primary">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <div
              key={i}
              className={`max-w-[85%] whitespace-pre-wrap rounded-xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'self-end bg-primary text-primary-fg'
                  : m.role === 'error'
                    ? 'self-start border border-danger/30 bg-danger/10 text-danger'
                    : 'self-start border border-line bg-surface-2 text-fg'
              }`}
            >
              {m.text}
            </div>
          ))}
          {pending && <div className="self-start rounded-xl border border-line bg-surface-2 px-4 py-2.5 text-sm text-muted">Thinking…</div>}
        </div>
        <form
          className="flex gap-2 border-t border-line p-4"
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
        >
          <label htmlFor="chat-input" className="sr-only">Message</label>
          <input
            id="chat-input"
            className={inputClass}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.nativeEvent.isComposing || e.keyCode === 229)) e.preventDefault()
            }}
            placeholder="Ask about usage, tickets, or impact…"
            maxLength={500}
          />
          <Button type="submit" loading={pending} disabled={!input.trim()} aria-label="Send message">
            {!pending && <Send className="size-4" aria-hidden />}
          </Button>
        </form>
      </Card>
    </>
  )
}

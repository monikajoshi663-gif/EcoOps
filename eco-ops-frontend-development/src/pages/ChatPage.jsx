import { useState } from 'react'
import { Bot, FileText, Send, Sparkles, Copy, Check, Printer } from 'lucide-react'
import { marked } from 'marked'
import { Card, PageHeader, Button, inputClass } from '../components/ui'
import { useApp } from '../context/AppContext'
import { readChatReply } from '../api/adapters'

const SUGGESTIONS = [
  'What are the top 3 problems today?',
  'Generate the weekly sustainability report',
  'Which building wastes the most water?',
]

function MessageBubble({ message }) {
  const [copied, setCopied] = useState(false)
  const isUser = message.role === 'user'
  const isError = message.role === 'error'

  if (isUser) {
    return (
      <div className="self-end max-w-[85%] whitespace-pre-wrap rounded-xl bg-primary px-4 py-2.5 text-sm leading-relaxed text-primary-fg shadow-sm">
        {message.text}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="self-start max-w-[85%] whitespace-pre-wrap rounded-xl border border-danger/30 bg-danger/10 px-4 py-2.5 text-sm leading-relaxed text-danger">
        {message.text}
      </div>
    )
  }

  const html = marked.parse(message.text || '', { breaks: true, gfm: true })

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.text || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="self-start flex gap-3 max-w-[95%] md:max-w-[90%] group">
      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20 shadow-xs">
        <Bot className="size-4" />
      </div>
      <div className="flex-1 rounded-xl border border-line bg-surface-2 p-4 text-sm leading-relaxed text-fg shadow-sm overflow-hidden">
        <div
          className="prose-chat"
          dangerouslySetInnerHTML={{ __html: html }}
        />
        <div className="mt-3.5 flex items-center justify-between border-t border-line/70 pt-2.5 text-[11px] text-muted">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-primary">
            <span className="size-1.5 rounded-full bg-primary" /> Gemini 3.5 Flash Diagnostic
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-muted hover:bg-surface hover:text-fg transition-colors cursor-pointer"
              title="Copy response"
            >
              {copied ? <Check className="size-3 text-primary" /> : <Copy className="size-3" />}
              {copied ? 'Copied' : 'Copy'}
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-muted hover:bg-surface hover:text-fg transition-colors cursor-pointer"
              title="Print report"
            >
              <Printer className="size-3" />
              Print / PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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
      <Card className="flex min-h-[30rem] flex-col">
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5" aria-live="polite">
          {messages.length === 0 && (
            <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center my-8">
              <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary border border-primary/20">
                <Sparkles className="size-6" aria-hidden />
              </div>
              <div>
                <p className="text-base font-medium text-fg">EcoOps Campus Sustainability Assistant</p>
                <p className="text-sm text-muted mt-1">Ask questions about telemetry anomalies, maintenance tickets, or campus reports.</p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 mt-2 max-w-xl">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border border-line bg-surface-2 px-3.5 py-1.5 text-xs text-fg hover:border-primary hover:text-primary transition-colors cursor-pointer"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((m, i) => (
            <MessageBubble key={i} message={m} />
          ))}
          {pending && (
            <div className="self-start flex gap-3 max-w-[85%]">
              <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary border border-primary/20">
                <Bot className="size-4 animate-pulse" />
              </div>
              <div className="rounded-xl border border-line bg-surface-2 px-4 py-3 text-sm text-muted flex items-center gap-2">
                <span className="size-2 rounded-full bg-primary animate-ping" />
                Thinking & analyzing campus telemetry…
              </div>
            </div>
          )}
        </div>
        <form
          className="flex gap-2 border-t border-line p-4 bg-surface"
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

import { useState } from 'react'
import { Bot } from 'lucide-react'
import { Button } from './ui'
import { useApp } from '../context/AppContext'
import { useToast } from '../context/ToastContext'

export function RunAgentButton() {
  const { api, refreshAll } = useApp()
  const toast = useToast()
  const [running, setRunning] = useState(false)

  async function handleRun() {
    setRunning(true)
    try {
      await api.runAgent()
      toast.success('Agent run started. Watch the activity log for its steps.')
      refreshAll()
      setTimeout(refreshAll, 3000)
    } catch (err) {
      toast.error(`Agent run failed: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  return (
    <Button onClick={handleRun} loading={running}>
      {!running && <Bot className="size-4" aria-hidden />}
      Run agent now
    </Button>
  )
}

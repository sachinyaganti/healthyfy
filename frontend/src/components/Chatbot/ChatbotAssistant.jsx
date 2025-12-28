import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { GLOBAL_DISCLAIMER } from '../../constants/disclaimer.js'
import { useAuth } from '../../auth/AuthContext.jsx'
import { loadChatState, saveChatState } from './chatbotStorage.js'
import { nextConversationStep } from './intentEngine.js'
import { canExecuteAction, executeAction } from './chatbotActions.js'
import { api } from '../../services/api.js'
import './ChatbotAssistant.css'

function nowIso() {
  return new Date().toISOString()
}

function makeId() {
  return `m_${Math.random().toString(16).slice(2)}_${Date.now()}`
}

function defaultState() {
  return {
    open: false,
    mode: 'idle',
    pending: null,
    messages: [
      {
        id: makeId(),
        role: 'assistant',
        text:
          `Hi — I’m Healthyfy AI Assistant.\n\n${GLOBAL_DISCLAIMER}\n\nI can navigate, export PDFs, and add logs (workouts, meals, water, mood, symptoms, reminders). I’ll ask for missing details and confirm before saving.\n\nTry: “open dashboard”, “log water 500 ml today”, or “add workout”.`,
        createdAt: nowIso(),
        chips: [
          { label: 'Open dashboard', value: 'open dashboard' },
          { label: 'Open nutrition', value: 'open nutrition' },
          { label: 'Log water (500ml)', value: 'log water 500 ml today' },
          { label: 'Add workout', value: 'add workout' },
        ],
      },
    ],
  }
}

export default function ChatbotAssistant() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  const persisted = useMemo(() => loadChatState(), [])
  const [state, setState] = useState(() => (persisted?.messages?.length ? persisted : defaultState()))
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)

  const bodyRef = useRef(null)
  const inputRef = useRef(null)

  // Persist state across reloads.
  useEffect(() => {
    saveChatState(state)
  }, [state])

  // Auto scroll.
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [state.messages.length, busy, state.open])

  // ESC to close.
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape' && state.open) {
        setState((s) => ({ ...s, open: false }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [state.open])

  function pushMessage({ role, text, chips }) {
    setState((s) => ({
      ...s,
      messages: [...s.messages, { id: makeId(), role, text, createdAt: nowIso(), chips: chips || null }],
    }))
  }

  function openAndFocus() {
    setState((s) => ({ ...s, open: true }))
    setTimeout(() => inputRef.current?.focus?.(), 0)
  }

  function toggleOpen() {
    setState((s) => ({ ...s, open: !s.open }))
    setTimeout(() => inputRef.current?.focus?.(), 0)
  }

  function suggestionsForState(s) {
    if (s.mode === 'confirming') {
      return [
        { label: 'Yes', value: 'yes' },
        { label: 'No', value: 'no' },
      ]
    }

    return [
      { label: 'Open dashboard', value: 'open dashboard' },
      { label: 'Open fitness', value: 'open fitness' },
      { label: 'Open nutrition', value: 'open nutrition' },
      { label: 'Export fitness PDF', value: 'export fitness pdf' },
      { label: 'Log water (500ml)', value: 'log water 500 ml today' },
      { label: 'Log mood', value: 'log mood' },
    ]
  }

  async function handleUserSend(textRaw) {
    const text = String(textRaw || '').trim()
    if (!text || busy) return

    // Used by the form-fill action to parse the next user message.
    window.__healthyfyLastChatUserText = text

    pushMessage({ role: 'user', text })
    setInput('')

    setBusy(true)
    // Smooth typing indicator.
    await new Promise((r) => setTimeout(r, 420))

    const step = nextConversationStep({ mode: state.mode, pending: state.pending }, text)

    if (step.type === 'execute') {
      const guard = canExecuteAction({ pending: step.pending, user })
      if (!guard.ok) {
        pushMessage({ role: 'assistant', text: guard.reason || 'I can’t do that right now.' })
        setState((s) => ({ ...s, mode: 'idle', pending: null }))
        setBusy(false)
        return
      }

      try {
        const result = await executeAction({
          pending: step.pending,
          navigate,
          user,
          getVisibleRoute: () => location.pathname,
        })

        pushMessage({
          role: 'assistant',
          text: result.ok ? (result.message || 'Done.') : (result.message || 'Something went wrong.'),
          chips: suggestionsForState({ mode: 'idle' }),
        })
      } catch (err) {
        pushMessage({
          role: 'assistant',
          text: err?.message || 'I hit an error while doing that. Please try again.',
        })
      } finally {
        setState((s) => ({ ...s, mode: 'idle', pending: null }))
        setBusy(false)
      }
      return
    }

    // If we're in a local multi-step flow (collecting/confirming), keep local messaging.
    const nextMode = step.nextState?.mode || 'idle'
    const nextPending = step.nextState?.pending || null

    if (nextMode !== 'idle' || nextPending) {
      pushMessage({
        role: 'assistant',
        text: step.message,
        chips: suggestionsForState(step.nextState || { mode: 'idle' }),
      })
      setState((s) => ({ ...s, mode: nextMode, pending: nextPending }))
      setBusy(false)
      return
    }

    // Otherwise, use backend agentic chat (guardrails + domain agents).
    try {
      const user_context = {
        user_id: user?.id ?? null,
        email: user?.email ?? null,
        display_name: user?.displayName ?? user?.name ?? null,
        route: location.pathname,
      }

      const resp = await api.chat({ message: text, user_context })
      pushMessage({
        role: 'assistant',
        text: resp?.reply || step.message,
        chips: suggestionsForState({ mode: 'idle' }),
      })
    } catch (err) {
      pushMessage({
        role: 'assistant',
        text: `${step.message}\n\n(Backend unavailable: ${err?.message || 'unknown error'})`,
        chips: suggestionsForState({ mode: 'idle' }),
      })
    } finally {
      setState((s) => ({ ...s, mode: 'idle', pending: null }))
      setBusy(false)
    }
  }

  return (
    <div className="aiFabWrap" aria-live="polite">
      <div className={`aiPanel${state.open ? ' open' : ''}`} role="dialog" aria-label="AI Assistant" aria-modal="false">
        <div className="aiHeader">
          <div className="aiHeaderTitle">
            <div className="aiNameRow">
              <span>AI Assistant</span>
              <span className="aiOnlineDot" aria-label="online" />
            </div>
            <div className="aiSub">Online • non-medical support</div>
          </div>
          <button className="aiClose" type="button" onClick={() => setState((s) => ({ ...s, open: false }))}>
            Close
          </button>
        </div>

        <div className="aiBody" ref={bodyRef}>
          {state.messages.map((m) => (
            <div key={m.id} className={`aiMsgRow ${m.role === 'user' ? 'user' : 'assistant'}`}>
              <div>
                <div className="aiBubble">{m.text}</div>
                {Array.isArray(m.chips) && m.chips.length ? (
                  <div className="aiChips">
                    {m.chips.map((c) => (
                      <button
                        key={`${m.id}_${c.value}`}
                        type="button"
                        className="aiChip"
                        onClick={() => {
                          if (!state.open) openAndFocus()
                          handleUserSend(c.value)
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}

          {busy ? (
            <div className="aiMsgRow assistant">
              <div className="aiBubble">
                <span className="aiTyping" aria-label="typing">
                  <span className="aiTypingDot" />
                  <span className="aiTypingDot" />
                  <span className="aiTypingDot" />
                </span>
              </div>
            </div>
          ) : null}
        </div>

        <form
          className="aiComposer"
          onSubmit={(e) => {
            e.preventDefault()
            handleUserSend(input)
          }}
        >
          <input
            ref={inputRef}
            className="aiInput"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me to do something…"
            aria-label="Message"
          />
          <button className="aiSend" type="submit" disabled={busy || !String(input).trim()}>
            Send
          </button>
        </form>
      </div>

      <button className="aiFab" type="button" onClick={toggleOpen} aria-label="Open AI Assistant">
        <span className="aiFabIcon" aria-hidden="true">🤖</span>
      </button>
    </div>
  )
}

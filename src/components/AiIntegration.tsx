import { useRef, useState } from 'react'

const initialPrompt = `Help me use Virtual Buoys data in a project. Explain briefly in plain language for a high school student, then ask what I want to build and which language or tool I am using. Give me a short, step-by-step solution with runnable code adapted to my answer, explain where to put it and how to test it, and explain how to change the buoy, parameter, time range, and depth. Do not assume I already know APIs or programming jargon.

The Virtual Buoys API contains synthetic, educational Lake Erie buoy readings, not real observations or operational data. It is public, read-only, requires no API key, and updates every 10 minutes. Base URL: https://dbsuryesimzatxhznurh.supabase.co/functions/v1/public-api

Available GET routes: /v1/health, /v1/buoys, /v1/buoys/{slug}, /v1/buoys/{slug}/latest, /v1/buoys/{slug}/observations, and /v1/parameters. Buoy slugs are west, central, and east. Observations require parameter and accept hours (default 24, maximum 168) OR UTC start and end, plus optional depth_m. Results are oldest first. For example: /v1/buoys/central/observations?parameter=water_temperature&hours=24. Direction readings include degrees and compass: wind and waves are FROM, currents are TO. CDOM is a relative synthetic signal, not an absolute concentration. Use the returned units and depth values; don't invent readings or parameters. If data cannot be fetched, say so and show how I can check the response myself.`

export function AiIntegration() {
  const dialog = useRef<HTMLDialogElement>(null)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [copyStatus, setCopyStatus] = useState('')
  const chatgptUrl = `https://chatgpt.com/?${new URLSearchParams({ q: prompt })}`
  const claudeUrl = `https://claude.ai/new?${new URLSearchParams({ q: prompt })}`
  async function copyPrompt() {
    try { await navigator.clipboard.writeText(prompt); setCopyStatus('Prompt copied. Paste it into your chosen chatbot.') }
    catch { setCopyStatus('Copy was unavailable. Select the prompt below and copy it manually.') }
  }
  return <div className="ai-integration">
    <div className="ai-integration-copy"><span className="ai-integration-icon" aria-hidden="true">✦</span><div><h3>Need a little help getting started?</h3><p>Ask an AI assistant to help you use the buoy data in your own project, step by step.</p></div></div>
    <button type="button" className="button button-primary ai-launch" onClick={() => dialog.current?.showModal()}>Ask AI to integrate the data <span aria-hidden="true">↗</span></button>
    <dialog ref={dialog} className="ai-dialog" aria-labelledby="ai-dialog-title" aria-describedby="ai-dialog-description">
      <div className="ai-dialog-header"><div><span className="eyebrow">Your project, your choice</span><h2 id="ai-dialog-title">Ask AI to integrate the data</h2></div><button type="button" className="ai-dialog-close" aria-label="Close" onClick={() => dialog.current?.close()}>×</button></div>
      <p id="ai-dialog-description">Choose an assistant. We’ve prepared a prompt that explains the data and asks for beginner-friendly guidance. You can edit it below.</p>
      <div className="ai-providers">
        <a href={chatgptUrl} target="_blank" rel="noopener noreferrer" className="ai-provider"><span className="ai-provider-logo ai-chatgpt"><img src="/brand/chatgpt.svg" alt="" /></span><span><strong>ChatGPT</strong><small>Open with prompt</small></span><span className="ai-provider-arrow" aria-hidden="true">↗</span></a>
        <a href="https://gemini.google.com/app" target="_blank" rel="noopener noreferrer" className="ai-provider" onClick={() => void copyPrompt()}><span className="ai-provider-logo ai-gemini"><img src="/brand/gemini.svg" alt="" /></span><span><strong>Gemini</strong><small>Copy prompt &amp; paste there</small></span><span className="ai-provider-arrow" aria-hidden="true">↗</span></a>
        <a href={claudeUrl} target="_blank" rel="noopener noreferrer" className="ai-provider"><span className="ai-provider-logo ai-claude"><img src="/brand/claude.svg" alt="" /></span><span><strong>Claude</strong><small>Open with prompt</small></span><span className="ai-provider-arrow" aria-hidden="true">↗</span></a>
      </div>
      <p className="ai-dialog-note">These services open in a new tab and may require an account. Your prompt is shared with the chosen service. If it doesn’t appear, copy and paste it below; Gemini requires pasting.</p>
      <div className="ai-prompt-header"><label htmlFor="ai-prompt">Your prompt</label><button type="button" onClick={() => void copyPrompt()}>Copy prompt</button></div>
      <textarea id="ai-prompt" value={prompt} onChange={event => { setPrompt(event.target.value); setCopyStatus('') }} rows={7} />
      <p className="ai-copy-status" role="status">{copyStatus}</p>
    </dialog>
  </div>
}

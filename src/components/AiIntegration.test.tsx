import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AiIntegration } from './AiIntegration'

describe('AI integration chooser', () => {
  it('links to the chosen services with editable API context and a Gemini copy fallback', () => {
    render(<AiIntegration />)
    screen.getByRole('dialog', { hidden: true }).setAttribute('open', '')
    const prompt = screen.getByLabelText('Your prompt') as HTMLTextAreaElement
    expect(prompt.value).toContain('/v1/buoys/central/observations?parameter=water_temperature&hours=24')
    expect(prompt.value).toContain('synthetic')
    fireEvent.change(prompt, { target: { value: 'Help me build a chart' } })
    for (const provider of ['ChatGPT', 'Claude']) {
      const link = screen.getByRole('link', { name: new RegExp(provider) }) as HTMLAnchorElement
      expect(new URL(link.href).searchParams.get('q')).toBe('Help me build a chart')
      expect(link.target).toBe('_blank')
    }
    expect(screen.getByRole('link', { name: /Gemini/ })).toHaveAttribute('href', 'https://gemini.google.com/app')
    expect(screen.getByText(/Gemini requires pasting/)).toBeInTheDocument()
  })
  it('opens and closes the dialog', () => {
    const open = vi.fn(), close = vi.fn()
    HTMLDialogElement.prototype.showModal = open
    HTMLDialogElement.prototype.close = close
    render(<AiIntegration />)
    fireEvent.click(screen.getByRole('button', { name: /Ask AI to integrate/i }))
    expect(open).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('button', { name: 'Close', hidden: true }))
    expect(close).toHaveBeenCalledOnce()
  })
})

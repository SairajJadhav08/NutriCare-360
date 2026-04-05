// Feature: jinja2-to-react-migration, Property 6: Toast auto-dismiss
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, cleanup } from '@testing-library/react'
import * as fc from 'fast-check'
import Toast from './Toast.jsx'

describe('Property 6: Toast auto-dismiss', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    cleanup()
  })

  it('**Validates: Requirements 6.8** - For any toast message shown (regardless of type or content), the toast element SHALL no longer be visible in the DOM after 3000 milliseconds have elapsed', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1 }),
        fc.constantFrom('success', 'error', 'info', undefined),
        (message, type) => {
          const onDismiss = vi.fn()
          
          render(
            <Toast message={message} type={type} onDismiss={onDismiss} />
          )

          // Toast should be visible initially
          const toastElement = screen.getByRole('alert')
          expect(toastElement).toBeInTheDocument()
          expect(toastElement).toHaveTextContent(message)

          // Advance time by 3000ms
          vi.advanceTimersByTime(3000)

          // onDismiss should have been called
          expect(onDismiss).toHaveBeenCalledTimes(1)

          // Clean up for next iteration
          cleanup()
          vi.clearAllTimers()
        }
      ),
      { numRuns: 100 }
    )
  })
})

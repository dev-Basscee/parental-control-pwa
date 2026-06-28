/**
 * src/lib/utils.ts
 * Shared utilities used across the frontend.
 */

/** Deterministic PIN hash using djb2 — client-side only, never sent to server */
export function hashPin (pin: string): string {
  let h = 5381
  for (let i = 0; i < pin.length; i++) {
    h = ((h << 5) + h) ^ pin.charCodeAt(i)
    h = h >>> 0   // keep unsigned 32-bit
  }
  return h.toString(16)
}

/** Merge CSS class names, filtering falsy values */
export function cn (...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ')
}

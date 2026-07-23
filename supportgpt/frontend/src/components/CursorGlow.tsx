import { useEffect, useRef } from 'react'

/**
 * CursorGlow — renders a soft radial indigo light that follows the cursor.
 * Fixed overlay, pointer-events: none so it never blocks clicks.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = glowRef.current
    if (!el) return

    let rafId: number
    let tx = -999, ty = -999
    let cx = -999, cy = -999

    const onMove = (e: MouseEvent) => {
      tx = e.clientX
      ty = e.clientY
    }

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const animate = () => {
      cx = lerp(cx, tx, 0.08)
      cy = lerp(cy, ty, 0.08)
      el.style.transform = `translate(${cx - 300}px, ${cy - 300}px)`
      rafId = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', onMove, { passive: true })
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', onMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: 600,
        height: 600,
        borderRadius: '50%',
        background:
          'radial-gradient(circle at center, rgba(99,102,241,0.07) 0%, rgba(99,102,241,0.03) 40%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 9999,
        willChange: 'transform',
        mixBlendMode: 'screen',
      }}
    />
  )
}

import { useEffect, useRef } from 'react'

/**
 * AtmosphereBackground — canvas-based animated atmospheric background.
 * Renders slow-drifting vertical light folds with additive blending,
 * concentrated glow toward bottom-left for cinematic depth.
 */
export default function AtmosphereBackground({ opacity = 1 }: { opacity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let t = 0

    const folds = [
      { x: 0.08, w: 0.22, speed: 0.0003, phase: 0.0,  amp: 0.04, bright: 0.18 },
      { x: 0.20, w: 0.18, speed: 0.0002, phase: 1.2,  amp: 0.05, bright: 0.12 },
      { x: 0.35, w: 0.25, speed: 0.00025,phase: 2.5,  amp: 0.03, bright: 0.10 },
      { x: 0.60, w: 0.20, speed: 0.00018,phase: 0.8,  amp: 0.06, bright: 0.08 },
      { x: 0.78, w: 0.28, speed: 0.00035,phase: 3.7,  amp: 0.04, bright: 0.07 },
    ]

    const resize = () => {
      canvas.width  = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    const draw = () => {
      const { width: W, height: H } = canvas

      // Base background
      ctx.fillStyle = '#070711'
      ctx.fillRect(0, 0, W, H)

      ctx.globalCompositeOperation = 'screen'

      for (const fold of folds) {
        const cx = (fold.x + Math.sin(t * fold.speed + fold.phase) * fold.amp) * W
        const fw = fold.w * W

        const grad = ctx.createLinearGradient(cx - fw / 2, 0, cx + fw / 2, 0)
        const a = fold.bright
        grad.addColorStop(0,   `rgba(99,102,241,0)`)
        grad.addColorStop(0.3, `rgba(99,102,241,${(a * 0.5).toFixed(3)})`)
        grad.addColorStop(0.5, `rgba(99,102,241,${a.toFixed(3)})`)
        grad.addColorStop(0.7, `rgba(99,102,241,${(a * 0.5).toFixed(3)})`)
        grad.addColorStop(1,   `rgba(99,102,241,0)`)

        // Vertical fade: brighter toward bottom
        const vGrad = ctx.createLinearGradient(0, 0, 0, H)
        vGrad.addColorStop(0,   'rgba(0,0,0,0)')
        vGrad.addColorStop(0.3, 'rgba(0,0,0,0)')
        vGrad.addColorStop(1,   'rgba(0,0,0,0.6)')

        ctx.fillStyle = grad
        ctx.fillRect(cx - fw / 2, 0, fw, H)
      }

      // Focal glow — bottom-left cinematic bloom
      ctx.globalCompositeOperation = 'screen'
      const radial = ctx.createRadialGradient(W * 0.15, H * 0.85, 0, W * 0.15, H * 0.85, W * 0.55)
      radial.addColorStop(0,   'rgba(99,102,241,0.22)')
      radial.addColorStop(0.4, 'rgba(99,102,241,0.08)')
      radial.addColorStop(1,   'rgba(99,102,241,0)')
      ctx.fillStyle = radial
      ctx.fillRect(0, 0, W, H)

      // Secondary glow — top-right subtle
      const radial2 = ctx.createRadialGradient(W * 0.9, H * 0.05, 0, W * 0.9, H * 0.05, W * 0.35)
      radial2.addColorStop(0,   'rgba(129,140,248,0.10)')
      radial2.addColorStop(1,   'rgba(129,140,248,0)')
      ctx.fillStyle = radial2
      ctx.fillRect(0, 0, W, H)

      ctx.globalCompositeOperation = 'source-over'

      t++
      animId = requestAnimationFrame(draw)
    }

    const handleVisibility = () => {
      if (document.hidden) cancelAnimationFrame(animId)
      else animId = requestAnimationFrame(draw)
    }
    document.addEventListener('visibilitychange', handleVisibility)

    animId = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(animId)
      ro.disconnect()
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity,
        zIndex: 0,
      }}
    />
  )
}

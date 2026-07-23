import { useEffect, useRef } from 'react'
import { animate } from 'framer-motion'

interface AnimatedCounterProps {
  value: number
  duration?: number
  className?: string
  suffix?: string
  prefix?: string
}

/**
 * AnimatedCounter — smoothly counts from 0 → value on mount.
 */
export default function AnimatedCounter({
  value,
  duration = 1.2,
  className = '',
  suffix = '',
  prefix = '',
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const controls = animate(0, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate(v) {
        el.textContent = `${prefix}${Math.round(v).toLocaleString()}${suffix}`
      },
    })

    return () => controls.stop()
  }, [value, duration, prefix, suffix])

  return (
    <span ref={ref} className={className}>
      {prefix}0{suffix}
    </span>
  )
}

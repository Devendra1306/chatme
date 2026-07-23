import { motion } from 'framer-motion'
import type { HTMLMotionProps } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlassCardProps extends Omit<HTMLMotionProps<'div'>, 'children'> {
  children: ReactNode
  /** Renders an indigo glow ring around the card */
  glow?: boolean
  /** Card size determines padding and border-radius */
  size?: 'sm' | 'md' | 'lg'
  /** Whether to apply lift + glow on hover */
  hover?: boolean
  className?: string
}

const sizeMap = {
  sm: { padding: '12px 16px', borderRadius: '10px' },
  md: { padding: '20px 24px', borderRadius: '16px' },
  lg: { padding: '28px 32px', borderRadius: '20px' },
}

export default function GlassCard({
  children,
  glow = false,
  size = 'md',
  hover = true,
  className = '',
  style,
  ...rest
}: GlassCardProps) {
  const { padding, borderRadius } = sizeMap[size]

  return (
    <motion.div
      {...rest}
      whileHover={hover ? { y: -3, scale: 1.005 } : undefined}
      whileTap={hover ? { scale: 0.995 } : undefined}
      transition={{ type: 'spring', stiffness: 320, damping: 28 }}
      className={className}
      style={{
        background: 'rgba(13,13,26,0.72)',
        backdropFilter: 'blur(20px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(20px) saturate(1.5)',
        border: `1px solid ${glow ? 'rgba(99,102,241,0.30)' : 'rgba(99,102,241,0.12)'}`,
        borderRadius,
        padding,
        boxShadow: glow
          ? '0 0 0 1px rgba(99,102,241,0.18), 0 4px 16px rgba(0,0,0,0.35), 0 0 40px rgba(99,102,241,0.18)'
          : '0 0 0 1px rgba(99,102,241,0.08), 0 4px 16px rgba(0,0,0,0.30), 0 16px 48px rgba(0,0,0,0.18)',
        position: 'relative',
        overflow: 'hidden',
        ...style,
      }}
    >
      {/* Inner highlight rim */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius,
          background:
            'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </motion.div>
  )
}

import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import AnimatedCounter from './AnimatedCounter'
import GlassCard from './GlassCard'

interface PremiumStatCardProps {
  icon: ReactNode
  value: number
  label: string
  change?: number
  accentColor?: string
  suffix?: string
  delay?: number
}

/**
 * PremiumStatCard — glass card with animated counter, trend badge, accent glow line.
 */
export default function PremiumStatCard({
  icon,
  value,
  label,
  change,
  accentColor = '#6366f1',
  suffix = '',
  delay = 0,
}: PremiumStatCardProps) {
  const isPositive = (change ?? 0) >= 0
  const changeAbs = Math.abs(change ?? 0)

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      <GlassCard size="md" hover style={{ padding: '20px 24px', overflow: 'hidden' }}>
        {/* Accent left bar */}
        <div
          style={{
            position: 'absolute',
            top: 20,
            bottom: 20,
            left: 0,
            width: 3,
            borderRadius: '0 4px 4px 0',
            background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}88)`,
            boxShadow: `0 0 10px ${accentColor}88`,
          }}
        />

        {/* Icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            fontSize: 22,
            color: accentColor,
            boxShadow: `0 0 16px ${accentColor}22`,
          }}
        >
          {icon}
        </div>

        {/* Value */}
        <div style={{ fontSize: 40, fontWeight: 800, lineHeight: 1, color: '#f0f0ff', marginBottom: 6 }}>
          <AnimatedCounter value={value} suffix={suffix} />
        </div>

        {/* Label & change */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ fontSize: 13, color: '#9896bb', fontWeight: 500 }}>{label}</span>
          {change !== undefined && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: 99,
                background: isPositive ? 'rgba(52,211,153,0.15)' : 'rgba(248,113,113,0.15)',
                color: isPositive ? '#34d399' : '#f87171',
                letterSpacing: '0.02em',
              }}
            >
              {isPositive ? '+' : '-'}{changeAbs}%
            </span>
          )}
        </div>
      </GlassCard>
    </motion.div>
  )
}

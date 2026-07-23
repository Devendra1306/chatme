import { motion } from 'framer-motion'

/**
 * ThinkingDots — three phase-offset pulsing dots used while AI is generating.
 */
export default function ThinkingDots() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 0' }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            duration: 1.2,
            repeat: Infinity,
            delay: i * 0.2,
            ease: 'easeInOut',
          }}
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            boxShadow: '0 0 8px rgba(99,102,241,0.6)',
          }}
        />
      ))}
    </div>
  )
}

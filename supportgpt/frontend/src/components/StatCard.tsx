import React from 'react'

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  change?: number
  iconBg?: string
}

export default function StatCard({ icon, value, label, change, iconBg = 'bg-emerald-100' }: StatCardProps) {
  const isPositive = change !== undefined && change >= 0

  return (
    <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-2xl font-bold text-slate-900">{value}</div>
        <div className="text-sm text-slate-500 mt-0.5">{label}</div>
        {change !== undefined && (
          <div
            className={`inline-flex items-center gap-1 text-xs font-medium mt-1.5 px-2 py-0.5 rounded-full ${
              isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
            }`}
          >
            {isPositive ? '↑' : '↓'} {Math.abs(change)}% vs last month
          </div>
        )}
      </div>
    </div>
  )
}

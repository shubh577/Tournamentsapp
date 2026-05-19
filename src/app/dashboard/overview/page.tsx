
"use client"

import { useEffect, useState } from 'react'
import GlassCard from "@/components/glass/GlassCard"
import { Users, Trophy, DollarSign, Activity, ArrowUpRight, TrendingUp } from "lucide-react"
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts'

const CHART_DATA = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 1100 },
]

export default function DashboardOverview() {
  const [tournaments, setTournaments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadTournaments() {
      try {
        const res = await fetch('/api/tournaments')
        const json = await res.json()

        if (!res.ok) {
          throw new Error(json.error || 'Failed to load tournaments')
        }

        setTournaments(json.tournaments ?? [])
      } catch (err) {
        setError((err as Error).message)
      } finally {
        setLoading(false)
      }
    }

    loadTournaments()
  }, [])

  return (
    <div className="space-y-8">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Active Players', value: '1,284', icon: Users, color: 'text-primary', trend: '+12%' },
          { label: 'Live Matches', value: '24', icon: Activity, color: 'text-red-500', trend: '+5' },
          { label: 'Total Revenue', value: '$48,250', icon: DollarSign, color: 'text-accent', trend: '+18%' },
          { label: 'Tournaments', value: '12', icon: Trophy, color: 'text-yellow-600', trend: '0' },
        ].map((stat, i) => (
          <GlassCard key={stat.label} className="flex items-center gap-6 relative overflow-hidden group">
            <div className={`p-4 rounded-2xl bg-black/5 border border-black/5 group-hover:neon-glow-blue transition-all duration-500`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <div>
              <div className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest mb-1">{stat.label}</div>
              <div className="flex items-baseline gap-2">
                <div className="text-2xl font-headline font-bold text-foreground">{stat.value}</div>
                <div className="text-[10px] font-bold text-accent">{stat.trend}</div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main Chart */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-headline font-bold text-foreground flex items-center gap-2">
              <TrendingUp className="text-primary w-5 h-5" />
              Arena Density
            </h3>
            <select className="bg-black/5 border border-black/10 rounded-lg text-xs p-2 text-muted-foreground focus:outline-none">
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
            </select>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E61FF" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#1E61FF" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: 'rgba(0,0,0,0.3)', fontSize: 10 }}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                    border: '1px solid rgba(0,0,0,0.05)',
                    borderRadius: '12px',
                    color: '#000',
                    boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                  }} 
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#1E61FF" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Upcoming Tournaments */}
        <GlassCard>
          <h3 className="text-lg font-headline font-bold text-foreground mb-6">Upcoming Tournaments</h3>

          {loading ? (
            <div className="text-sm text-muted-foreground">Loading tournament data…</div>
          ) : error ? (
            <div className="text-sm text-red-500">Error: {error}</div>
          ) : tournaments.length === 0 ? (
            <div className="text-sm text-muted-foreground">No upcoming tournaments found.</div>
          ) : (
            <div className="space-y-4">
              {tournaments.map((tournament) => (
                <div key={tournament.id} className="flex gap-4 group">
                  <div className="w-1 h-12 bg-black/5 rounded-full overflow-hidden">
                    <div className="w-full h-full bg-primary" />
                  </div>
                  <div>
                    <div className="text-foreground font-bold text-xs uppercase tracking-[0.2em] mb-1">{tournament.status || 'Scheduled'}</div>
                    <div className="text-sm font-semibold text-foreground">{tournament.name}</div>
                    <div className="text-muted-foreground text-[11px] mt-1">{tournament.starts_at ? new Date(tournament.starts_at).toLocaleDateString() : 'Start date not set'}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  )
}

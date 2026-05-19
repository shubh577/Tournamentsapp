
"use client"

import GlassCard from "@/components/glass/GlassCard"
import { Activity, Signal, Users, Timer } from "lucide-react"
import { MOCK_MATCHES } from "@/lib/mock-data"
import Link from "next/link"

export default function PulseDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">LIVE PULSE</h1>
        <p className="text-muted-foreground text-sm">Real-time match telemetry and active arena monitoring.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold text-primary tracking-[0.3em] uppercase flex items-center gap-2">
            <Signal className="w-4 h-4" />
            Active Streams
          </h3>
          
          <div className="grid gap-4">
            {MOCK_MATCHES.filter(m => m.status === 'Live').map((match) => (
              <GlassCard key={match.id} className="group hover:border-primary/20 transition-all">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-1 flex items-center justify-between px-4">
                    <div className="text-right">
                      <div className="text-lg font-bold text-foreground">{match.teamA}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">HOME</div>
                    </div>
                    <div className="text-3xl font-headline font-black text-primary px-8">{match.scoreA}</div>
                  </div>

                  <div className="shrink-0 flex flex-col items-center gap-2 py-4 px-6 border-x border-black/5">
                    <div className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>
                    <div className="text-xs font-bold text-foreground font-mono">{match.time}</div>
                  </div>

                  <div className="flex-1 flex items-center justify-between px-4">
                    <div className="text-3xl font-headline font-black text-primary px-8">{match.scoreB}</div>
                    <div className="text-left">
                      <div className="text-lg font-bold text-foreground">{match.teamB}</div>
                      <div className="text-[10px] text-muted-foreground font-bold">AWAY</div>
                    </div>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-black/5 flex justify-end">
                   <Link href={`/dashboard/referee/${match.id}`}>
                      <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                        Enter Referee Mode <Timer className="w-3 h-3" />
                      </button>
                   </Link>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        <div className="space-y-6">
           <h3 className="text-xs font-bold text-muted-foreground tracking-[0.3em] uppercase">Arena Stats</h3>
           <GlassCard className="space-y-6">
              {[
                { label: 'Active Spectators', value: '4,281', icon: Users, color: 'text-blue-500' },
                { label: 'Network Latency', value: '18ms', icon: Activity, color: 'text-green-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl bg-black/5 ${stat.color}`}>
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase">{stat.label}</div>
                    <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  </div>
                </div>
              ))}
           </GlassCard>
        </div>
      </div>
    </div>
  )
}

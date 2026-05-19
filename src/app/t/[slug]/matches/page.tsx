
"use client"

import GlassCard from "@/components/glass/GlassCard"
import { MOCK_MATCHES } from "@/lib/mock-data"
import { PlayCircle, Clock, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

export default function TournamentMatches() {
  return (
    <div className="max-w-5xl mx-auto p-6 lg:p-12">
      <div className="mb-12">
        <h1 className="text-4xl font-headline font-bold text-white mb-2">MATCH CENTER</h1>
        <p className="text-white/50">Live updates and historical match data.</p>
      </div>

      <div className="space-y-12">
        {/* Live Section */}
        <section>
          <h2 className="text-xs font-bold text-primary tracking-[0.3em] uppercase mb-6 flex items-center gap-2">
            <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
            Live Matches
          </h2>
          <div className="grid gap-6">
            {MOCK_MATCHES.filter(m => m.status === 'Live').map(match => (
              <GlassCard key={match.id} className="relative overflow-hidden group hover:border-primary/40 transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-[60px] pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center gap-8 md:gap-4 py-4">
                  <div className="flex-1 text-center md:text-right">
                    <div className="text-white font-headline text-2xl font-bold mb-1">{match.teamA}</div>
                    <div className="text-white/40 text-xs">Home</div>
                  </div>
                  
                  <div className="flex flex-col items-center gap-4 px-8 border-x border-white/5">
                    <div className="bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded animate-pulse">LIVE</div>
                    <div className="flex items-center gap-6">
                      <span className="text-5xl font-headline font-black text-white">{match.scoreA}</span>
                      <span className="text-white/20 font-light text-2xl">:</span>
                      <span className="text-5xl font-headline font-black text-white">{match.scoreB}</span>
                    </div>
                    <div className="text-xs text-primary font-bold">{match.time}</div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <div className="text-white font-headline text-2xl font-bold mb-1">{match.teamB}</div>
                    <div className="text-white/40 text-xs">Away</div>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Previous Section */}
        <section>
          <h2 className="text-xs font-bold text-white/40 tracking-[0.3em] uppercase mb-6">Past Matches</h2>
          <div className="grid gap-4">
            {MOCK_MATCHES.filter(m => m.status === 'Finished').map(match => (
              <GlassCard key={match.id} className="p-4 border-white/5 hover:border-white/10 transition-colors">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full glass-surface flex items-center justify-center text-white/40">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">{match.teamA} vs {match.teamB}</div>
                      <div className="text-[10px] text-white/40 uppercase tracking-widest">{match.status}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="flex items-center gap-4 text-2xl font-headline font-bold text-white/80">
                      <span>{match.scoreA}</span>
                      <span className="text-white/10">-</span>
                      <span>{match.scoreB}</span>
                    </div>
                    <button className="text-xs text-accent hover:underline">Match Details</button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>

        {/* Upcoming Section */}
        <section>
          <h2 className="text-xs font-bold text-white/40 tracking-[0.3em] uppercase mb-6">Upcoming Matches</h2>
          <div className="grid gap-4">
            {MOCK_MATCHES.filter(m => m.status === 'Upcoming').map(match => (
              <GlassCard key={match.id} className="p-4 border-white/5">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full glass-surface flex items-center justify-center text-white/40">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div className="text-sm font-bold text-white">{match.teamA} vs {match.teamB}</div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-xs text-white/60">{match.time}</div>
                    <button className="px-4 py-2 glass-surface rounded-lg text-xs hover:bg-white/10 transition-all">Set Reminder</button>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

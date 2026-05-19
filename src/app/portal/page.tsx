
"use client"

import GlassCard from "@/components/glass/GlassCard"
import { Trophy, Star, TrendingUp, Calendar, Zap } from "lucide-react"
import { MOCK_MATCHES } from "@/lib/mock-data"
import Link from "next/link"

export default function PlayerPortalHome() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">WELCOME BACK</h1>
          <p className="text-muted-foreground text-sm italic">"Champions train, losers complain."</p>
        </div>
        <div className="flex -space-x-2">
           {[1,2,3].map(i => (
             <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-slate-200" />
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <GlassCard className="bg-primary text-white border-none relative overflow-hidden">
           <div className="relative z-10">
              <div className="text-[10px] font-black tracking-widest uppercase mb-4 opacity-60">Next Up</div>
              <h3 className="text-2xl font-headline font-bold mb-1">Nebula Knights</h3>
              <p className="text-sm opacity-80 mb-6">vs Solar Flares @ 18:00</p>
              <Link href="/portal/schedule">
                <button className="bg-white/20 hover:bg-white/30 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold transition-all">
                   VIEW DETAILS
                </button>
              </Link>
           </div>
           <Zap className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
        </GlassCard>

        <div className="grid grid-cols-2 gap-4">
           <GlassCard className="flex flex-col items-center justify-center text-center p-4">
              <Trophy className="text-yellow-500 w-8 h-8 mb-2" />
              <div className="text-xl font-headline font-bold">1st</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Division Rank</div>
           </GlassCard>
           <GlassCard className="flex flex-col items-center justify-center text-center p-4">
              <TrendingUp className="text-accent w-8 h-8 mb-2" />
              <div className="text-xl font-headline font-bold">15-3</div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase">Season Record</div>
           </GlassCard>
        </div>
      </div>

      <section className="space-y-4">
         <h3 className="text-xs font-bold text-muted-foreground tracking-[0.3em] uppercase px-1">Recent Performance</h3>
         <div className="space-y-3">
            {MOCK_MATCHES.filter(m => m.status === 'Finished').map(match => (
              <GlassCard key={match.id} className="p-4 flex items-center justify-between border-black/5">
                 <div className="flex items-center gap-3">
                    <div className="p-2 bg-black/5 rounded-lg">
                       <Star className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                       <div className="text-sm font-bold text-foreground">{match.teamA} vs {match.teamB}</div>
                       <div className="text-[10px] text-muted-foreground font-bold">WINNER: {match.scoreA > match.scoreB ? match.teamA : match.teamB}</div>
                    </div>
                 </div>
                 <div className="text-sm font-bold font-headline">{match.scoreA} - {match.scoreB}</div>
              </GlassCard>
            ))}
         </div>
      </section>
    </div>
  )
}

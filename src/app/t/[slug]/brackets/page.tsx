
"use client"

import BracketEngine from "@/components/bracket/BracketEngine"
import GlassCard from "@/components/glass/GlassCard"
import { Trophy, ZoomIn, Info } from "lucide-react"

export default function TournamentBrackets() {
  return (
    <div className="p-6 lg:p-12 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="max-w-7xl mx-auto w-full mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-4xl font-headline font-bold text-white mb-2">TOURNAMENT FLOW</h1>
          <p className="text-white/50">Track the path to championship glory.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 glass-surface rounded-xl text-xs text-white/60">
            <Info className="w-4 h-4 text-accent" />
            Click on a match for stats
          </div>
          <button className="p-2.5 glass-surface rounded-xl text-white/60 hover:text-white transition-colors">
            <ZoomIn className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 flex items-center">
        <BracketEngine />
      </div>

      <div className="mt-12 max-w-7xl mx-auto w-full grid grid-cols-1 md:grid-cols-3 gap-6 opacity-60">
         <GlassCard className="p-4 flex items-center gap-4 border-white/5">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Trophy className="text-accent w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Grand Prize</div>
              <div className="text-white font-bold font-headline">$15,000 + Trophy</div>
            </div>
         </GlassCard>
         <GlassCard className="p-4 flex items-center gap-4 border-white/5">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
              <Trophy className="text-primary w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Runner Up</div>
              <div className="text-white font-bold font-headline">$7,000</div>
            </div>
         </GlassCard>
         <GlassCard className="p-4 flex items-center gap-4 border-white/5">
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
              <Trophy className="text-white/60 w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest">Third Place</div>
              <div className="text-white font-bold font-headline">$3,000</div>
            </div>
         </GlassCard>
      </div>
    </div>
  )
}

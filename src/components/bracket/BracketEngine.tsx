
"use client"

import GlassCard from "@/components/glass/GlassCard"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const BRACKET_DATA = [
  {
    round: "Quarter Finals",
    matches: [
      { id: 1, teamA: "Nebula Knights", teamB: "Solar Flares", scoreA: 88, scoreB: 84 },
      { id: 2, teamA: "Void Runners", teamB: "Glitch Squad", scoreA: 72, scoreB: 91 },
      { id: 3, teamA: "Titan Pulse", teamB: "Quantum Force", scoreA: 95, scoreB: 82 },
      { id: 4, teamA: "Cortex Prime", teamB: "Aether Edge", scoreA: 81, scoreB: 85 }
    ]
  },
  {
    round: "Semi Finals",
    matches: [
      { id: 5, teamA: "Nebula Knights", teamB: "Glitch Squad", scoreA: null, scoreB: null },
      { id: 6, teamA: "Titan Pulse", teamB: "Aether Edge", scoreA: null, scoreB: null }
    ]
  },
  {
    round: "Grand Finals",
    matches: [
      { id: 7, teamA: "TBD", teamB: "TBD", scoreA: null, scoreB: null }
    ]
  }
]

export default function BracketEngine() {
  return (
    <div className="bracket-scroll overflow-x-auto pb-8 pt-4 px-4">
      <div className="flex gap-16 min-w-max items-center">
        {BRACKET_DATA.map((round, rIndex) => (
          <div key={round.round} className="flex flex-col gap-12 relative">
            <h3 className="text-muted-foreground text-xs font-headline uppercase tracking-widest text-center mb-4 font-bold">
              {round.round}
            </h3>
            <div className="flex flex-col justify-around gap-20 h-full">
              {round.matches.map((match, mIndex) => (
                <div key={match.id} className="relative">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: rIndex * 0.2 + mIndex * 0.1 }}
                  >
                    <GlassCard className="w-64 p-0 overflow-hidden border-black/5 bg-white/60 hover:border-primary/40 transition-colors shadow-xl">
                      <div className="p-3 border-b border-black/5 flex justify-between items-center group">
                        <span className={cn(
                          "text-sm font-bold",
                          match.scoreA !== null && match.scoreA > (match.scoreB ?? 0) ? "text-primary" : "text-foreground/70"
                        )}>
                          {match.teamA}
                        </span>
                        <span className="font-code text-xs font-black text-foreground">
                          {match.scoreA ?? "-"}
                        </span>
                      </div>
                      <div className="p-3 flex justify-between items-center">
                        <span className={cn(
                          "text-sm font-bold",
                          match.scoreB !== null && match.scoreB > (match.scoreA ?? 0) ? "text-primary" : "text-foreground/70"
                        )}>
                          {match.teamB}
                        </span>
                        <span className="font-code text-xs font-black text-foreground">
                          {match.scoreB ?? "-"}
                        </span>
                      </div>
                    </GlassCard>
                  </motion.div>

                  {/* Liquid Connectors */}
                  {rIndex < BRACKET_DATA.length - 1 && (
                    <div className="absolute top-1/2 left-full w-16 h-full flex items-center pointer-events-none">
                      <svg width="64" height="200" viewBox="0 0 64 200" className="stroke-black/10 fill-none overflow-visible">
                        <path 
                          d={mIndex % 2 === 0 
                            ? "M0,100 C32,100 32,150 64,150" 
                            : "M0,100 C32,100 32,50 64,50"} 
                          strokeWidth="2"
                          className="animate-pulse"
                        />
                      </svg>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}


"use client"

import { useState } from "react"
import GlassCard from "@/components/glass/GlassCard"
import { ArrowLeft, Clock, AlertTriangle, Play, Pause, RotateCcw } from "lucide-react"
import Link from "next/link"

export default function RefereePulse() {
  const [scoreA, setScoreA] = useState(88)
  const [scoreB, setScoreB] = useState(84)
  const [isRunning, setIsRunning] = useState(true)

  return (
    <div className="max-w-md mx-auto min-h-screen pb-20 pt-4 px-4 flex flex-col bg-background/50">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <Link href="/dashboard/pulse" className="p-2 glass-surface rounded-xl">
          <ArrowLeft className="w-6 h-6" />
        </Link>
        <div className="flex items-center gap-2 px-4 py-2 bg-red-600/20 text-red-500 rounded-full border border-red-500/30 text-xs font-bold animate-pulse">
           <span className="w-2 h-2 bg-red-500 rounded-full" />
           LIVE PULSE
        </div>
        <div className="p-2 glass-surface rounded-xl">
          <Clock className="w-6 h-6 text-accent" />
        </div>
      </div>

      {/* Main Scores */}
      <div className="grid grid-cols-2 gap-4 mb-8">
        <GlassCard className="p-4 text-center border-primary/20 bg-primary/5">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2">Nebula Knights</div>
          <div className="text-7xl font-headline font-black text-white">{scoreA}</div>
        </GlassCard>
        <GlassCard className="p-4 text-center border-accent/20 bg-accent/5">
          <div className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2">Solar Flares</div>
          <div className="text-7xl font-headline font-black text-white">{scoreB}</div>
        </GlassCard>
      </div>

      {/* Big Score Buttons - Optimized for touch */}
      <div className="grid grid-cols-2 gap-4 mb-8 flex-1">
        <div className="space-y-4">
           <button 
             onClick={() => setScoreA(s => s + 2)}
             className="w-full h-32 glass-surface-strong rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all neon-glow-blue border-primary/40"
           >
             <span className="text-3xl font-bold text-white">+2</span>
             <span className="text-xs text-white/40 font-bold">HOME</span>
           </button>
           <button 
             onClick={() => setScoreA(s => s + 3)}
             className="w-full h-24 glass-surface rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all text-primary"
           >
             <span className="text-2xl font-bold">+3</span>
           </button>
        </div>
        <div className="space-y-4">
           <button 
             onClick={() => setScoreB(s => s + 2)}
             className="w-full h-32 glass-surface-strong rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all neon-glow-cyan border-accent/40"
           >
             <span className="text-3xl font-bold text-white">+2</span>
             <span className="text-xs text-white/40 font-bold">AWAY</span>
           </button>
           <button 
             onClick={() => setScoreB(s => s + 3)}
             className="w-full h-24 glass-surface rounded-3xl flex flex-col items-center justify-center active:scale-95 transition-all text-accent"
           >
             <span className="text-2xl font-bold">+3</span>
           </button>
        </div>
      </div>

      {/* Action Tray */}
      <div className="grid grid-cols-3 gap-4">
        <button 
          onClick={() => setIsRunning(!isRunning)}
          className={`h-20 rounded-3xl flex items-center justify-center transition-all active:scale-95 ${isRunning ? 'bg-amber-500/20 text-amber-500' : 'bg-green-600/20 text-green-500'}`}
        >
          {isRunning ? <Pause className="w-8 h-8 fill-current" /> : <Play className="w-8 h-8 fill-current" />}
        </button>
        <button className="h-20 glass-surface rounded-3xl flex items-center justify-center text-red-500 active:bg-red-500/20 transition-all">
          <AlertTriangle className="w-8 h-8" />
        </button>
        <button 
          onClick={() => { setScoreA(0); setScoreB(0); }}
          className="h-20 glass-surface rounded-3xl flex items-center justify-center text-white/40 active:text-white transition-all"
        >
          <RotateCcw className="w-8 h-8" />
        </button>
      </div>

      <div className="mt-8 text-center">
         <div className="text-4xl font-headline font-black text-white tabular-nums">12:45</div>
         <div className="text-[10px] text-white/40 font-bold tracking-[0.4em] uppercase">Quarter 4</div>
      </div>
    </div>
  )
}


"use client"

import GlassCard from "@/components/glass/GlassCard"
import { Calendar, MapPin, Zap } from "lucide-react"

const SCHEDULE = [
  { day: 'TODAY', time: '18:00', tournament: 'Cyber Strike Masters', vs: 'Solar Flares', location: 'Abyss Arena' },
  { day: 'TOMORROW', time: '14:30', tournament: 'Cyber Strike Masters', vs: 'Titan Pulse', location: 'Abyss Arena' },
  { day: 'OCT 18', time: '20:00', tournament: 'Cyber Strike Masters', vs: 'Glitch Squad', location: 'Abyss Arena' },
]

export default function PlayerSchedule() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-headline font-bold text-white">SCHEDULE</h1>
        <p className="text-white/40">Your upcoming match itinerary.</p>
      </div>

      <div className="space-y-6 relative pl-8">
        {/* Timeline Line */}
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-white/10" />

        {SCHEDULE.map((item, i) => (
          <div key={i} className="relative">
            {/* Dot */}
            <div className="absolute -left-[2.35rem] top-4 w-5 h-5 rounded-full bg-background border-2 border-primary z-10 flex items-center justify-center">
               <div className="w-1.5 h-1.5 bg-primary rounded-full" />
            </div>

            <GlassCard className="p-4 border-white/5">
               <div className="flex items-center justify-between mb-4">
                  <div className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-black text-white/60 tracking-widest">
                    {item.day}
                  </div>
                  <div className="text-primary font-bold text-sm">{item.time}</div>
               </div>
               
               <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl glass-surface flex items-center justify-center">
                    <Zap className="text-accent w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs text-white/40 font-bold uppercase tracking-widest">{item.tournament}</div>
                    <div className="text-white font-bold text-lg">vs {item.vs}</div>
                  </div>
               </div>

               <div className="flex items-center gap-2 text-white/40 text-[10px] font-bold uppercase">
                  <MapPin className="w-3.5 h-3.5" />
                  {item.location}
               </div>
            </GlassCard>
          </div>
        ))}
      </div>

      <GlassCard className="bg-accent/5 border-accent/10 p-6 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <Calendar className="text-accent w-8 h-8" />
            <div>
               <div className="text-white font-bold">Sync to Calendar</div>
               <div className="text-white/40 text-xs">Apple, Google, Outlook</div>
            </div>
         </div>
         <button className="p-3 glass-surface rounded-xl text-accent">
            <Calendar className="w-5 h-5" />
         </button>
      </GlassCard>
    </div>
  )
}

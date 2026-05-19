
"use client"

import GlassCard from "@/components/glass/GlassCard"
import { Trophy, Calendar, MapPin, Share2 } from "lucide-react"
import { motion } from "framer-motion"

export default function TournamentOverview() {
  return (
    <div className="max-w-7xl mx-auto p-6 lg:p-12">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative h-[400px] w-full rounded-3xl overflow-hidden mb-12 border border-black/5 shadow-2xl"
      >
        <img 
          src="https://picsum.photos/seed/sports/1200/400" 
          className="w-full h-full object-cover grayscale opacity-40"
          alt="Banner"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
        <div className="absolute bottom-12 left-12 right-12 flex flex-col md:flex-row justify-between items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="bg-accent/20 text-accent text-xs font-bold px-3 py-1 rounded-full border border-accent/30 backdrop-blur-md">BASKETBALL</span>
              <span className="flex items-center gap-1.5 text-foreground/70 text-sm font-semibold">
                <Calendar className="w-4 h-4" />
                Oct 15 - Oct 20, 2024
              </span>
            </div>
            <h1 className="text-5xl md:text-7xl font-headline font-bold text-foreground tracking-tighter">CYBER STRIKE <br/> MASTERS</h1>
          </div>
          <div className="flex gap-4">
            <button className="w-12 h-12 glass-surface-strong rounded-2xl flex items-center justify-center text-foreground hover:bg-black/5 transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
            <button className="px-8 h-12 bg-primary text-white rounded-2xl font-bold flex items-center gap-2 neon-glow-blue transition-all active:scale-95 shadow-lg">
              REGISTER NOW
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <GlassCard>
            <h2 className="text-2xl font-headline font-bold text-foreground mb-6 flex items-center gap-3">
              <Trophy className="text-primary" />
              About the Tournament
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-6 font-medium">
              The Cyber Strike Masters is the premier basketball invitational for the world's most innovative tech hubs. 
              Featuring 16 elite teams competing in a high-intensity, knockout format under the glow of neon arenas.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-black/[0.03] border border-black/5">
                <div className="text-xs text-muted-foreground mb-1 font-bold">Prize Pool</div>
                <div className="text-xl font-headline font-bold text-accent">$25,000</div>
              </div>
              <div className="p-4 rounded-2xl bg-black/[0.03] border border-black/5">
                <div className="text-xs text-muted-foreground mb-1 font-bold">Teams</div>
                <div className="text-xl font-headline font-bold text-foreground">16 Teams</div>
              </div>
              <div className="p-4 rounded-2xl bg-black/[0.03] border border-black/5">
                <div className="text-xs text-muted-foreground mb-1 font-bold">Venue</div>
                <div className="text-xl font-headline font-bold text-foreground">Abyss Arena</div>
              </div>
            </div>
          </GlassCard>
          
          <GlassCard>
            <h2 className="text-2xl font-headline font-bold text-foreground mb-6">Tournament Rules</h2>
            <ul className="space-y-4">
              {[
                "Standard FIBA regulations apply for all matches.",
                "Single elimination knockout bracket.",
                "15-minute quarters with a 10-minute halftime.",
                "Final game features extended 20-minute quarters."
              ].map((rule, i) => (
                <li key={i} className="flex gap-4 items-start text-muted-foreground font-medium">
                  <div className="w-6 h-6 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 text-xs font-bold shadow-sm">
                    {i+1}
                  </div>
                  {rule}
                </li>
              ))}
            </ul>
          </GlassCard>
        </div>

        <div className="space-y-8">
          <GlassCard className="bg-primary/5 border-primary/20">
            <h3 className="text-lg font-headline font-bold text-foreground mb-4">Location</h3>
            <div className="relative h-48 w-full rounded-2xl overflow-hidden mb-4 border border-black/5">
              <img src="https://picsum.photos/seed/map/400/200" className="w-full h-full object-cover opacity-50 grayscale" alt="Map" />
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="text-primary w-8 h-8 drop-shadow-xl" />
              </div>
            </div>
            <div className="text-foreground font-bold">Abyss Arena, Sector 7</div>
            <div className="text-muted-foreground text-sm mt-1 font-medium">Industrial District, Neo-City</div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

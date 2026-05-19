
"use client"

import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { Users, Search, Plus, MoreHorizontal, Trophy, Mail } from "lucide-react"
import { MOCK_TEAMS } from "@/lib/mock-data"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

export default function TeamsDashboard() {
  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">SQUAD REGISTRY</h1>
          <p className="text-muted-foreground text-sm">Manage participating teams and their rosters.</p>
        </div>
        <GlassButton className="neon-glow-blue">
          <Plus className="w-4 h-4" />
          REGISTER TEAM
        </GlassButton>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Search teams or players..." 
          className="pl-10 h-12 bg-white/50 border-black/5 rounded-xl"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_TEAMS.map((team) => (
          <GlassCard key={team.id} className="group hover:border-primary/20 transition-all p-0 overflow-hidden">
            <div className="h-2 bg-primary w-full opacity-20 group-hover:opacity-100 transition-opacity" />
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="w-16 h-16 rounded-2xl bg-black/5 flex items-center justify-center border border-black/5 overflow-hidden">
                  <img src={team.logo} alt={team.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all" />
                </div>
                <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                  <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>

              <h3 className="text-xl font-headline font-bold text-foreground mb-1">{team.name}</h3>
              <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground mb-6">
                 <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5 text-primary" /> {team.players} Players</span>
                 <span className="flex items-center gap-1"><Trophy className="w-3.5 h-3.5 text-accent" /> {team.wins} Wins</span>
              </div>

              <div className="flex gap-2">
                 <GlassButton variant="outline" size="sm" className="flex-1 text-[10px] border-black/10 text-foreground">VIEW ROSTER</GlassButton>
                 <GlassButton variant="ghost" size="sm" className="text-[10px] text-muted-foreground"><Mail className="w-3 h-3" /></GlassButton>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  )
}

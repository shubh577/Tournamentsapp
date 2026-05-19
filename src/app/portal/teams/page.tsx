
"use client"

import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { MOCK_TEAMS } from "@/lib/mock-data"
import { Users, ChevronRight, Plus } from "lucide-react"
import Link from "next/link"

export default function PlayerTeams() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-headline font-bold text-white">MY TEAMS</h1>
        <button className="w-10 h-10 glass-surface rounded-xl flex items-center justify-center text-primary">
          <Plus className="w-6 h-6" />
        </button>
      </div>

      <div className="grid gap-4">
        {MOCK_TEAMS.map((team) => (
          <Link key={team.id} href={`/portal/teams/${team.id}/roster`}>
            <GlassCard className="p-4 flex items-center gap-4 border-white/5 active:bg-white/10 active:scale-[0.98] transition-all">
              <img src={team.logo} className="w-14 h-14 rounded-2xl object-cover bg-white/5" alt={team.name} />
              <div className="flex-1">
                <h3 className="text-lg font-headline font-bold text-white">{team.name}</h3>
                <div className="flex items-center gap-3 mt-1 text-white/40 text-xs">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {team.players} Players</span>
                  <span className="text-accent">{team.wins}W - {team.losses}L</span>
                </div>
              </div>
              <ChevronRight className="text-white/20 w-5 h-5" />
            </GlassCard>
          </Link>
        ))}
      </div>

      <GlassCard className="bg-primary/5 border-primary/10 p-6 flex flex-col items-center text-center">
         <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Users className="text-primary w-8 h-8" />
         </div>
         <h4 className="text-white font-bold mb-2">Build Your Dynasty</h4>
         <p className="text-white/40 text-sm mb-6">Create a new team and start inviting players to join your roster.</p>
         <GlassButton className="w-full">Create New Team</GlassButton>
      </GlassCard>
    </div>
  )
}

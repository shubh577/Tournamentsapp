
"use client"

import { useState } from "react"
import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { ArrowLeft, UserPlus, Mail, MoreVertical, ShieldCheck } from "lucide-react"
import Link from "next/link"

const ROSTER = [
  { name: 'Marcus Chen', role: 'Captain', position: 'Point Guard', status: 'Active' },
  { name: 'Sarah Jenkins', role: 'Player', position: 'Shooting Guard', status: 'Active' },
  { name: 'Alex Rivera', role: 'Player', position: 'Small Forward', status: 'Injured' },
  { name: 'David Kim', role: 'Player', position: 'Power Forward', status: 'Active' },
  { name: 'Elena Rossi', role: 'Player', position: 'Center', status: 'Away' },
]

export default function TeamRoster() {
  const [showInvite, setShowInvite] = useState(false)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/portal/teams" className="p-2 glass-surface rounded-xl">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-headline font-bold text-white">NEBULA KNIGHTS</h1>
      </div>

      <GlassCard className="p-0 border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5 bg-white/5 flex items-center justify-between">
          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest">Active Roster</h3>
          <button onClick={() => setShowInvite(true)} className="text-accent text-xs font-bold flex items-center gap-1">
             <UserPlus className="w-4 h-4" />
             INVITE
          </button>
        </div>
        <div className="divide-y divide-white/5">
          {ROSTER.map((player) => (
            <div key={player.name} className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full glass-surface flex items-center justify-center font-bold text-xs">
                  {player.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1.5">
                    {player.name}
                    {player.role === 'Captain' && <ShieldCheck className="w-3 h-3 text-primary" />}
                  </div>
                  <div className="text-[10px] text-white/40 uppercase tracking-tighter">{player.position}</div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 <div className={cn(
                   "text-[10px] px-2 py-0.5 rounded-full border",
                   player.status === 'Active' ? "border-green-500/20 text-green-500 bg-green-500/10" : "border-amber-500/20 text-amber-500 bg-amber-500/10"
                 )}>
                   {player.status}
                 </div>
                 <button className="text-white/20">
                   <MoreVertical className="w-5 h-5" />
                 </button>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Glass Bottom Sheet (Mock) */}
      {showInvite && (
        <div className="fixed inset-0 z-[100] flex flex-col justify-end p-4 animate-in fade-in duration-300">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowInvite(false)} />
           <GlassCard className="glass-surface-strong relative z-10 w-full rounded-3xl animate-in slide-in-from-bottom-10">
              <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6" />
              <h3 className="text-xl font-headline font-bold text-white mb-2">Invite Player</h3>
              <p className="text-white/40 text-sm mb-6">Send an invite link to their email or Vortex Arena ID.</p>
              
              <div className="space-y-4 mb-8">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 w-5 h-5" />
                  <input 
                    type="email" 
                    placeholder="player@email.com" 
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                 <GlassButton variant="outline" className="flex-1" onClick={() => setShowInvite(false)}>Cancel</GlassButton>
                 <GlassButton className="flex-1" onClick={() => setShowInvite(false)}>Send Invite</GlassButton>
              </div>
           </GlassCard>
        </div>
      )}
    </div>
  )
}

import { cn } from "@/lib/utils"

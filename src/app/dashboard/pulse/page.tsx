"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import GlassCard from "@/components/glass/GlassCard"
import { Activity, Signal, Users, ExternalLink, Loader2, Trophy, Tv } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function PulseDashboard() {
  const [liveMatches, setLiveMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeSpectators, setActiveSpectators] = useState(0)

  useEffect(() => {
    // 1. Fetch initial live matches
    const fetchLiveMatches = async () => {
      setLoading(true)
      const { data, error } = await supabase
        .from('match_details')
        .select('*, tournaments(name, sport)')
        .eq('status', 'live')
        .order('start_time', { ascending: false })

      if (!error && data) {
        setLiveMatches(data)
        // Simulate spectator count based on live matches for the arena stats
        setActiveSpectators(data.length > 0 ? Math.floor(Math.random() * 500) + (data.length * 1200) : 0)
      }
      setLoading(false)
    }

    fetchLiveMatches()

    // 2. Subscribe to REALTIME score updates
    const channel = supabase.channel('live-pulse')
      .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'matches', 
          filter: "status=eq.'live'" 
      }, (payload) => {
          // Instantly update the score in the UI when the database changes
          setLiveMatches(currentMatches => 
             currentMatches.map(match => 
                match.id === payload.new.id 
                ? { ...match, score_data: payload.new.score_data } 
                : match
             )
          )
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // Dynamic JSONB Score Parser
  const displayScore = (scoreData: any, teamKey: 'team_a' | 'team_b') => {
     if (!scoreData || !scoreData[teamKey]) return '0'
     const s = scoreData[teamKey]
     
     // Generic (Football, Badminton, etc.)
     if (typeof s === 'number' || typeof s === 'string') return s
     // Cricket format
     if (s.runs !== undefined) return `${s.runs}/${s.wickets || 0}`
     // Fallbacks
     if (s.goals !== undefined) return s.goals
     if (s.points !== undefined) return s.points
     
     return '0'
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-8">
      
      {/* Header */}
      <div className="border-b border-white/10 pb-6">
        <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-foreground tracking-tight flex items-center gap-3">
            LIVE SCORING <Signal className="w-8 h-8 text-red-500 animate-pulse" />
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Real-time match telemetry and active arena monitoring.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 lg:gap-10">
        
        {/* LEFT COLUMN: The Matches */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="text-xs font-bold text-red-400 tracking-[0.3em] uppercase flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Active Streams
          </h3>
          
          <div className="grid gap-6">
            {loading ? (
                <div className="py-32 flex justify-center items-center">
                    <Loader2 className="w-10 h-10 text-primary animate-spin" />
                </div>
            ) : liveMatches.length > 0 ? (
                <AnimatePresence>
                    {liveMatches.map((match, i) => (
                        <motion.div 
                            key={match.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <GlassCard className="p-0 overflow-hidden group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] transition-all">
                                
                                {/* Match Context Bar */}
                                <div className="bg-white/5 border-b border-white/10 px-4 py-2 flex justify-between items-center text-xs text-muted-foreground">
                                    <span className="font-semibold text-foreground/80 flex items-center gap-2">
                                        <Trophy className="w-3.5 h-3.5 text-primary" /> {match.tournaments?.name || 'Tournament Match'}
                                    </span>
                                    <span className="uppercase tracking-widest font-bold text-[10px]">{match.round_name || `Round ${match.round_number}`}</span>
                                </div>

                                {/* Main Scoreboard Layout (Mobile-First) */}
                                <div className="flex flex-col sm:flex-row items-center justify-between p-6 gap-6 relative">
                                    
                                    {/* Team A */}
                                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto text-center sm:text-right justify-end">
                                        <div className="order-2 sm:order-1">
                                            <div className="text-xl sm:text-2xl font-bold text-foreground line-clamp-1">{match.team_a_name || 'Team A'}</div>
                                            <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">HOME</div>
                                        </div>
                                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white/10 order-1 sm:order-2 shadow-lg">
                                            <AvatarImage src={match.team_a_logo} />
                                            <AvatarFallback className="bg-white/5 text-xl font-black">{match.team_a_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="text-4xl sm:text-5xl font-headline font-black text-primary px-4 order-3 sm:order-3 w-full sm:w-auto text-center">
                                            {displayScore(match.score_data, 'team_a')}
                                        </div>
                                    </div>

                                    {/* Middle Status Indicator */}
                                    <div className="shrink-0 flex flex-col items-center gap-2 px-4 py-2 sm:border-x border-white/10 w-full sm:w-auto border-y sm:border-y-0">
                                        <div className="bg-red-500 text-white text-[10px] font-bold px-3 py-1 rounded-sm animate-pulse tracking-widest">LIVE</div>
                                        <div className="text-xs font-bold text-muted-foreground uppercase">{match.tournaments?.sport || 'Sport'}</div>
                                    </div>

                                    {/* Team B */}
                                    <div className="flex-1 flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto text-center sm:text-left justify-start">
                                        <div className="text-4xl sm:text-5xl font-headline font-black text-primary px-4 w-full sm:w-auto text-center">
                                            {displayScore(match.score_data, 'team_b')}
                                        </div>
                                        <Avatar className="w-16 h-16 sm:w-20 sm:h-20 border-2 border-white/10 shadow-lg">
                                            <AvatarImage src={match.team_b_logo} />
                                            <AvatarFallback className="bg-white/5 text-xl font-black">{match.team_b_name?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <div className="text-xl sm:text-2xl font-bold text-foreground line-clamp-1">{match.team_b_name || 'Team B'}</div>
                                            <div className="text-[10px] text-muted-foreground font-bold tracking-widest uppercase mt-1">AWAY</div>
                                        </div>
                                    </div>

                                </div>
                                
                                {/* Public Action Bar */}
                                <div className="bg-black/20 border-t border-white/5 p-3 flex justify-center sm:justify-end">
                                    <Link href={`/tournament/${match.tournament_id}`}>
                                        <button className="text-xs font-bold text-primary hover:text-primary/80 transition-colors flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-lg">
                                            Enter Match Center <ExternalLink className="w-3.5 h-3.5" />
                                        </button>
                                    </Link>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </AnimatePresence>
            ) : (
                <GlassCard className="p-12 text-center border-dashed border-white/20">
                    <Tv className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">No Live Matches</h3>
                    <p className="text-muted-foreground text-sm">There are no matches currently being played across the network. Check back soon!</p>
                </GlassCard>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Arena Stats */}
        <div className="space-y-6">
           <h3 className="text-xs font-bold text-muted-foreground tracking-[0.3em] uppercase">Network Stats</h3>
           <GlassCard className="space-y-6 border-white/10 bg-background/40 backdrop-blur-3xl">
              {[
                { label: 'Active Matches', value: liveMatches.length.toString(), icon: Signal, color: 'text-red-500' },
                { label: 'Active Spectators', value: activeSpectators.toLocaleString(), icon: Users, color: 'text-blue-500' },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center gap-4 p-2">
                  <div className={`p-4 rounded-xl bg-white/5 border border-white/10 ${stat.color} shadow-inner`}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</div>
                    <div className="text-2xl font-black text-foreground font-mono">{stat.value}</div>
                  </div>
                </div>
              ))}
           </GlassCard>
        </div>
      </div>
    </div>
  )
}
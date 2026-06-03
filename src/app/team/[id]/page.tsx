'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import DashboardLayout from '@/app/dashboard/layout'
import GlassCard from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { motion } from 'framer-motion'
import { ChevronLeft, Loader2, Trophy, Users, Calendar, ShieldCheck, MapPin, Swords, Activity } from 'lucide-react'

export default function TeamDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const teamId = params.id as string

  const [team, setTeam] = useState<any>(null)
  const [roster, setRoster] = useState<any[]>([])
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTeamData = async () => {
      setLoading(true)

      // 1. Fetch Core Team & Coach Info
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .select(`
          *,
          coach:coach_id(name, avatar_url, city),
          tournaments(name, sport, level)
        `)
        .eq('id', teamId)
        .single()

      if (teamData) setTeam(teamData)

      // 2. Fetch Team Roster (Assuming you have a team_rosters table linking to profiles)
      // If you haven't created team_rosters yet, this will safely return an empty array.
      const { data: rosterData } = await supabase
        .from('team_rosters')
        .select(`
          id,
          player:player_id(id, name, avatar_url, city)
        `)
        .eq('team_id', teamId)

      if (rosterData) setRoster(rosterData)

      // 3. Fetch Match History (Using our magical match_details view)
      const { data: matchData } = await supabase
        .from('match_details')
        .select('*')
        .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`)
        .order('start_time', { ascending: false })

      if (matchData) setMatches(matchData)

      setLoading(false)
    }

    if (teamId) fetchTeamData()
  }, [teamId])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-[80vh]">
          <Loader2 className="w-12 h-12 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    )
  }

  if (!team) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[80vh]">
          <ShieldCheck className="w-16 h-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Team Not Found</h1>
          <Button variant="outline" onClick={() => router.back()}>Go Back</Button>
        </div>
      </DashboardLayout>
    )
  }

  // Calculate quick stats
  const totalMatches = matches.length
  const completedMatches = matches.filter(m => m.status === 'completed')

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 sm:p-8 space-y-8 animate-in fade-in duration-500">
        
        {/* --- NAVIGATION & HEADER --- */}
        <div>
          <Button variant="ghost" onClick={() => router.back()} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>

        {/* --- HERO PROFILE CARD --- */}
        <GlassCard className="relative overflow-hidden p-0 border-white/10">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-r from-primary/20 to-transparent" />
          
          <div className="relative z-10 p-6 sm:p-10 flex flex-col sm:flex-row items-center sm:items-end gap-6 sm:gap-8 mt-12">
            <Avatar className="w-32 h-32 sm:w-40 sm:h-40 border-4 border-background shadow-2xl bg-black/50">
              <AvatarImage src={team.logo_url} className="object-cover" />
              <AvatarFallback className="text-5xl font-black text-primary bg-primary/10">{team.name.charAt(0)}</AvatarFallback>
            </Avatar>

            <div className="flex-1 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mb-3">
                <Badge className="bg-primary/20 text-primary border-primary/30 uppercase tracking-widest text-[10px]">
                  {team.tournaments?.sport || 'Sport'}
                </Badge>
                <Badge className={`uppercase tracking-widest text-[10px] ${team.status === 'approved' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-white/10 text-muted-foreground'}`}>
                  {team.status || 'Pending'}
                </Badge>
              </div>
              
              <h1 className="text-4xl sm:text-5xl font-black font-headline tracking-tight mb-2">{team.name}</h1>
              
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm font-medium text-muted-foreground">
                <span className="flex items-center gap-1.5"><Trophy className="w-4 h-4 text-primary" /> {team.tournaments?.name || 'Independent'}</span>
                <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> {roster.length} Players</span>
              </div>
            </div>

            {/* Coach Widget */}
            <div className="shrink-0 p-4 bg-black/40 rounded-xl border border-white/5 flex items-center gap-4 min-w-[200px]">
              <Avatar className="w-12 h-12 border border-white/10">
                <AvatarImage src={team.coach?.avatar_url} />
                <AvatarFallback className="bg-white/5 text-sm">{team.coach?.name?.charAt(0) || 'C'}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-0.5">Head Coach</p>
                <p className="font-bold text-sm truncate">{team.coach?.name || 'Unknown'}</p>
              </div>
            </div>
          </div>
        </GlassCard>

        {/* --- MAIN CONTENT GRID --- */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: Roster */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6 text-primary" /> Active Roster</h2>
            
            <GlassCard className="p-2 sm:p-6">
              {roster.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-bold mb-1">Roster Empty</h3>
                  <p className="text-sm text-muted-foreground">No players have been assigned to this team yet.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {roster.map((member, i) => (
                    <motion.div 
                      key={member.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-4 p-3 bg-white/5 rounded-xl border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                      onClick={() => router.push(`/user/${member.player?.id}`)}
                    >
                      <Avatar className="w-12 h-12 border border-white/10">
                        <AvatarImage src={member.player?.avatar_url} />
                        <AvatarFallback className="bg-primary/10 text-primary">{member.player?.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="overflow-hidden">
                        <p className="font-bold text-sm truncate">{member.player?.name}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {member.player?.city || 'Unknown'}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </GlassCard>
          </div>

          {/* RIGHT COLUMN: Stats & Match History */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-2"><Activity className="w-6 h-6 text-primary" /> Team Record</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <GlassCard className="p-4 text-center border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Matches</p>
                <p className="text-3xl font-black">{totalMatches}</p>
              </GlassCard>
              <GlassCard className="p-4 text-center border-white/10">
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold mb-1">Completed</p>
                <p className="text-3xl font-black">{completedMatches.length}</p>
              </GlassCard>
            </div>

            <GlassCard className="p-0 overflow-hidden">
              <div className="p-4 bg-white/5 border-b border-white/10">
                <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Match History</h3>
              </div>
              
              <div className="p-2 space-y-2 max-h-[400px] overflow-y-auto no-scrollbar">
                {matches.length === 0 ? (
                  <div className="text-center py-8">
                    <Swords className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">No matches scheduled yet.</p>
                  </div>
                ) : (
                  matches.map((match) => {
                    const isTeamA = match.team_a_id === teamId;
                    const opponentName = isTeamA ? match.team_b_name : match.team_a_name;
                    const opponentLogo = isTeamA ? match.team_b_logo : match.team_a_logo;

                    return (
                      <div 
                        key={match.id} 
                        onClick={() => router.push(`/organizer/match/${match.id}`)}
                        className="p-4 bg-black/20 rounded-lg border border-white/5 hover:border-primary/30 transition-colors cursor-pointer"
                      >
                        <div className="flex justify-between items-center mb-3">
                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-sm ${match.status === 'live' ? 'bg-red-500/20 text-red-400 animate-pulse' : match.status === 'completed' ? 'bg-white/10 text-muted-foreground' : 'bg-blue-500/10 text-blue-400'}`}>
                            {match.status}
                          </span>
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {match.start_time ? new Date(match.start_time).toLocaleDateString() : 'TBA'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2">
                            <Avatar className="w-6 h-6"><AvatarImage src={team.logo_url} /><AvatarFallback>{team.name.charAt(0)}</AvatarFallback></Avatar>
                            <span className="font-bold text-sm">VS</span>
                            <Avatar className="w-6 h-6"><AvatarImage src={opponentLogo} /><AvatarFallback>{opponentName?.charAt(0) || '?'}</AvatarFallback></Avatar>
                          </div>
                          <span className="font-medium text-sm text-right line-clamp-1 flex-1">{opponentName || 'TBA'}</span>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </GlassCard>

          </div>
        </div>

      </div>
    </DashboardLayout>
  )
}
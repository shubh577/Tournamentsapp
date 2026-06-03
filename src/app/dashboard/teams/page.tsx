"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabaseClient"
import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { Users, Search, Plus, Trophy, Mail, Loader2, ShieldCheck, MapPin } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { motion, AnimatePresence } from "framer-motion"

const SPORTS = ['Cricket','Karate', 'Football', 'Badminton', 'Wrestling', 'Kabaddi']

export default function TeamsDashboard() {
  const [teams, setTeams] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  
  // Role & Filter States
  const [userRole, setUserRole] = useState<string | null>(null)
  const [userSport, setUserSport] = useState<string | null>(null)
  const [selectedSportFilter, setSelectedSportFilter] = useState("All")

  useEffect(() => {
    const fetchTeamsData = async () => {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return setLoading(false)

      // 1. Determine User Role
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
      
      const role = profile?.role || 'player'
      setUserRole(role)

      // 2. Fetch Sport Context if they are not an Organizer
      let mySport = null
      if (role === 'player') {
        const { data: p } = await supabase.from('players').select('sport').eq('id', user.id).single()
        mySport = p?.sport
      } else if (role === 'coach') {
        const { data: c } = await supabase.from('coaches').select('sport').eq('id', user.id).single()
        mySport = c?.sport
      }
      if (mySport) setUserSport(mySport)

      // 3. Fetch Teams (Joining Profiles for Coach name, Tournaments for Sport & Name, and Rosters for Player Count)
      let query = supabase.from('teams').select(`
        id, name, logo_url, status,
        profiles!coach_id(name),
        tournaments!inner(name, sport, level),
        team_rosters(id)
      `)

      // Auto-filter at the database level if the user is a player/coach
      if (role !== 'organizer' && mySport) {
        query = query.ilike('tournaments.sport', mySport)
      }

      const { data, error } = await query

      if (!error && data) {
        setTeams(data)
      } else {
        console.error("Error fetching teams:", error)
      }
      setLoading(false)
    }

    fetchTeamsData()
  }, [])

  // --- Client-Side Filtering ---
  const filteredTeams = teams.filter(team => {
    const searchMatch = 
      team.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
      team.tournaments?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      team.profiles?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    // Organizers can use the dropdown. Players/Coaches are already filtered by DB.
    const sportMatch = (userRole === 'organizer' && selectedSportFilter !== 'All')
      ? team.tournaments?.sport?.toLowerCase() === selectedSportFilter.toLowerCase()
      : true

    return searchMatch && sportMatch
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-7xl mx-auto p-4 sm:p-8">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-extrabold text-foreground tracking-tight uppercase">Squad Gallery</h1>
          <p className="text-lg text-muted-foreground mt-2">
            {userRole === 'organizer' 
              ? 'Oversee all registered teams and rosters across the network.' 
              : `Explore and connect with elite teams in the world of ${userSport || 'your sport'}.`
            }
          </p>
        </div>
        
        {userRole === 'coach' && (
          <GlassButton className="neon-glow-blue shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
            <Plus className="w-5 h-5 mr-2" />
            REGISTER TEAM
          </GlassButton>
        )}
      </div>

      {/* Control Bar: Search & Dynamic Filters */}
      <div className="flex flex-col sm:flex-row gap-4 sticky top-4 z-20 bg-background/80 backdrop-blur-xl p-4 rounded-2xl border border-white/10 shadow-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input 
            placeholder="Search teams, tournaments, or coaches..." 
            className="pl-12 h-12 text-base bg-white/5 border-white/10 focus-visible:ring-primary placeholder:text-muted-foreground/60 rounded-xl"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        {/* Organizer-Exclusive Sport Filter */}
        {userRole === 'organizer' && (
          <Select value={selectedSportFilter} onValueChange={setSelectedSportFilter}>
            <SelectTrigger className="w-full sm:w-[220px] h-12 bg-white/5 border-white/10 rounded-xl">
              <SelectValue placeholder="Filter by Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Sports</SelectItem>
              {SPORTS.map(s => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-32 flex justify-center items-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin" />
          </div>
        ) : filteredTeams.length > 0 ? (
          <AnimatePresence>
            {filteredTeams.map((team, i) => (
              <motion.div 
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <GlassCard className="group hover:border-primary/40 hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)] transition-all p-0 overflow-hidden h-full flex flex-col">
                  
                  {/* Decorative Header Line */}
                  <div className="h-1.5 bg-primary w-full opacity-20 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-start justify-between mb-4">
                      <Avatar className="w-16 h-16 rounded-2xl border-2 border-white/10 shadow-lg group-hover:scale-105 transition-transform bg-black/50">
                        <AvatarImage src={team.logo_url} className="object-cover" />
                        <AvatarFallback className="text-xl font-black text-primary bg-primary/10">{team.name?.charAt(0) || 'T'}</AvatarFallback>
                      </Avatar>
                      
                      {/* Sport Badge */}
                      <Badge className="bg-white/5 hover:bg-white/10 border-white/10 text-[10px] uppercase tracking-widest text-muted-foreground">
                        {team.tournaments?.sport}
                      </Badge>
                    </div>

                    <h3 className="text-2xl font-headline font-bold text-foreground mb-1 line-clamp-1">{team.name}</h3>
                    <p className="text-xs text-muted-foreground mb-6 line-clamp-1">
                      Coach: <span className="font-semibold text-foreground/80">{team.profiles?.name || 'Unknown'}</span>
                    </p>
                    
                    {/* Event Banner Snippet */}
                    <div className="mb-6 p-3 bg-black/20 rounded-lg border border-white/5 flex items-center gap-3">
                      <Trophy className="w-8 h-8 text-primary/50 shrink-0" />
                      <div className="overflow-hidden">
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Competing In</p>
                        <p className="text-sm font-semibold truncate">{team.tournaments?.name || 'Unknown Event'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-sm font-bold text-muted-foreground mb-6 mt-auto">
                       <span className="flex items-center gap-2"><Users className="w-4 h-4 text-primary" /> {team.team_rosters?.length || 0} Players</span>
                       <span className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${team.status === 'approved' ? 'text-green-500' : 'text-yellow-500'}`} /> 
                          <span className="capitalize">{team.status || 'Pending'}</span>
                       </span>
                    </div>

                    <div className="flex gap-3 pt-4 border-t border-black/10 dark:border-white/10">
                     <Link href={`/team/${team.id}`} className="flex-1">
                       <GlassButton 
                         variant="outline" 
                         size="sm" 
                         className="w-full text-[10px] font-bold tracking-widest text-foreground border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
                       >
                         VIEW ROSTER
                       </GlassButton>
                     </Link>
                    </div>
                  </div>
                </GlassCard>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="col-span-full py-24 flex flex-col items-center text-center bg-white/5 rounded-3xl border border-white/10"
          >
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-2xl font-headline font-bold text-foreground mb-2">No Squads Found</h3>
            <p className="text-muted-foreground text-base max-w-md mx-auto">
              We couldn't find any teams matching your search or filter criteria. 
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}
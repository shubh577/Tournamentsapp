
"use client"

import { useState } from "react"
import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { 
  Trophy, 
  Plus, 
  Search, 
  MoreVertical, 
  Calendar, 
  Users, 
  Filter,
  ArrowUpRight,
  Trash2,
  Edit2,
  Eye
} from "lucide-react"
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { CreateTournamentDialog } from "@/components/dashboard/CreateTournamentDialog"
import { MOCK_TOURNAMENTS } from "@/lib/mock-data"
import Link from "next/link"

export default function CoachTournaments() {
  const [tournaments, setTournaments] = useState(MOCK_TOURNAMENTS)
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)

  const filteredTournaments = tournaments.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.sport.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const deleteTournament = (id: string) => {
    setTournaments(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-headline font-bold text-foreground">TOURNEY MANAGER</h1>
          <p className="text-muted-foreground text-sm">Create, monitor, and scale your athletic events.</p>
        </div>
        <GlassButton 
          onClick={() => setIsCreateDialogOpen(true)}
          className="neon-glow-blue h-12 px-6"
        >
          <Plus className="w-5 h-5" />
          NEW TOURNAMENT
        </GlassButton>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search your arenas..." 
            className="pl-10 h-11 bg-white/50 border-black/5 rounded-xl focus:ring-primary/20"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <GlassButton variant="secondary" className="h-11 border-black/5">
          <Filter className="w-4 h-4" />
          Filters
        </GlassButton>
      </div>

      <div className="grid gap-4">
        {filteredTournaments.length > 0 ? (
          filteredTournaments.map((tournament) => (
            <GlassCard key={tournament.id} className="p-0 overflow-hidden group hover:border-primary/20 transition-all duration-300">
              <div className="flex flex-col lg:flex-row lg:items-center p-4 gap-6">
                <div className="w-full lg:w-48 h-32 relative rounded-xl overflow-hidden shrink-0">
                  <img 
                    src={tournament.image} 
                    alt={tournament.name}
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <Badge className="absolute bottom-2 left-2 bg-primary/80 backdrop-blur-md border-none text-[10px]">
                    {tournament.sport.toUpperCase()}
                  </Badge>
                </div>

                <div className="flex-1 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-headline font-bold text-foreground group-hover:text-primary transition-colors">
                        {tournament.name}
                      </h3>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Calendar className="w-4 h-4 text-accent" />
                          {tournament.date}
                        </span>
                        <span className="flex items-center gap-1.5 font-medium">
                          <Users className="w-4 h-4 text-accent" />
                          {tournament.participants} Teams
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`px-3 py-1 rounded-full text-[10px] font-bold tracking-widest ${
                        tournament.status === 'Live' 
                          ? 'bg-red-50 text-red-500 border border-red-100 animate-pulse' 
                          : 'bg-blue-50 text-primary border border-blue-100'
                      }`}>
                        {tournament.status.toUpperCase()}
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="p-2 hover:bg-black/5 rounded-lg transition-colors">
                            <MoreVertical className="w-5 h-5 text-muted-foreground" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48 rounded-xl p-2">
                          <DropdownMenuItem className="rounded-lg gap-2 cursor-pointer">
                            <Edit2 className="w-4 h-4" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild className="rounded-lg gap-2 cursor-pointer">
                            <Link href={`/t/${tournament.slug}/overview`}>
                              <Eye className="w-4 h-4" /> View Public Page
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => deleteTournament(tournament.id)}
                            className="rounded-lg gap-2 text-red-500 focus:text-red-500 focus:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" /> Delete Tournament
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center justify-between border-t border-black/5">
                    <div className="flex -space-x-2">
                      {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[8px] font-bold">
                          {String.fromCharCode(64 + i)}
                        </div>
                      ))}
                      <div className="w-7 h-7 rounded-full border-2 border-white bg-slate-50 flex items-center justify-center text-[8px] font-bold text-muted-foreground">
                        +12
                      </div>
                    </div>
                    <Link href={`/t/${tournament.slug}/brackets`}>
                      <GlassButton variant="ghost" size="sm" className="text-primary font-bold group/btn">
                        Open Bracket <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                      </GlassButton>
                    </Link>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="py-20 flex flex-col items-center text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-headline font-bold text-foreground">No matches found</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mt-2">
              Try adjusting your search or create your first elite tournament to get started.
            </p>
            <GlassButton 
              onClick={() => setIsCreateDialogOpen(true)}
              className="mt-8"
            >
              <Plus className="w-5 h-5" />
              CREATE TOURNAMENT
            </GlassButton>
          </div>
        )}
      </div>

      <CreateTournamentDialog 
        isOpen={isCreateDialogOpen} 
        onClose={() => setIsCreateDialogOpen(false)} 
        onCreated={(newTourney) => {
          setTournaments(prev => [newTourney, ...prev])
          setIsCreateDialogOpen(false)
        }}
      />
    </div>
  )
}

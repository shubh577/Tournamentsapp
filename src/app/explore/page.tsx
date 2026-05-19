
"use client"

import GlassButton from "@/components/glass/GlassButton"
import GlassCard from "@/components/glass/GlassCard"
import { MOCK_TOURNAMENTS } from "@/lib/mock-data"
import { Search, MapPin, Users, Calendar } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function ExplorePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="py-12 px-6 max-w-7xl mx-auto w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-headline font-bold text-foreground mb-2">ACTIVE ARENAS</h1>
            <p className="text-muted-foreground">Discover tournaments happening across the globe right now.</p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search tournaments, sports, cities..." 
              className="w-full h-12 bg-white/40 border border-black/10 rounded-xl pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {MOCK_TOURNAMENTS.map((t) => (
            <Link key={t.id} href={`/t/${t.slug}/overview`}>
              <GlassCard className="p-0 overflow-hidden group hover:border-primary/40 transition-all duration-500 hover:-translate-y-2">
                <div className="relative h-48 w-full">
                  <Image 
                    src={t.image} 
                    alt={t.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                    data-ai-hint="sports tournament"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/40 to-transparent" />
                  {t.status === 'Live' && (
                    <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded flex items-center gap-1.5 animate-pulse-glow">
                      <span className="w-1.5 h-1.5 bg-white rounded-full" />
                      LIVE NOW
                    </div>
                  )}
                  <div className="absolute bottom-4 left-4">
                    <span className="bg-primary/20 text-primary text-[10px] font-bold px-2 py-1 rounded-full border border-primary/30 backdrop-blur-md">
                      {t.sport.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-headline font-bold text-foreground mb-4 group-hover:text-primary transition-colors">{t.name}</h3>
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <Calendar className="w-4 h-4 text-accent" />
                      {t.date}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
                      <Users className="w-4 h-4 text-accent" />
                      {t.participants} Teams Participating
                    </div>
                  </div>
                  <GlassButton className="w-full">View Tournament</GlassButton>
                </div>
              </GlassCard>
            </Link>
          ))}
        </div>
      </header>
    </div>
  )
}

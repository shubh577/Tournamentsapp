
"use client"

import { useState } from "react"
import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { BrainCircuit, Sparkles, Loader2, Trophy, ListOrdered } from "lucide-react"
import { generateTournamentSeeding, type GenerateTournamentSeedingOutput } from "@/ai/flows/generate-tournament-seeding"
import { MOCK_PARTICIPANTS_FOR_SEEDING } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export default function SeedingPage() {
  const [loading, setLoading] = useState(false)
  const [seeding, setSeeding] = useState<GenerateTournamentSeedingOutput | null>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const result = await generateTournamentSeeding({
        tournamentName: "Cyber Strike Masters 2024",
        participants: MOCK_PARTICIPANTS_FOR_SEEDING
      })
      setSeeding(result)
    } catch (error) {
      console.error("Failed to generate seeding", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold text-foreground mb-2">SMART SEEDING</h1>
        <p className="text-muted-foreground">Evaluate historical performance and generate optimal brackets with AI.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <GlassCard className="border-primary/20 bg-primary/5">
            <h3 className="text-lg font-headline font-bold text-foreground mb-4 flex items-center gap-2">
              <ListOrdered className="text-primary w-5 h-5" />
              Participants
            </h3>
            <div className="space-y-3">
              {MOCK_PARTICIPANTS_FOR_SEEDING.map((p, i) => (
                <div key={p.name} className="p-3 rounded-xl bg-black/[0.03] border border-black/5 flex items-center justify-between text-sm">
                  <span className="text-foreground font-medium">{p.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase px-2 py-0.5 rounded-full bg-black/5 border border-black/10">
                    {p.type}
                  </span>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassButton 
            className="w-full h-16 text-lg neon-glow-blue" 
            onClick={handleGenerate}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit className="w-6 h-6" />}
            {loading ? "ANALYZING DATA..." : "GENERATE AI SEEDING"}
          </GlassButton>
        </div>

        <div className="lg:col-span-2">
          <GlassCard className="min-h-[500px] flex flex-col">
            {!seeding && !loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 opacity-60">
                <Sparkles className="w-16 h-16 mb-6 text-primary" />
                <h3 className="text-xl font-headline font-bold text-foreground mb-2">Ready to Seed</h3>
                <p className="text-sm max-w-sm text-muted-foreground">Connect historical performance metrics and our AI will suggest the most competitive seeding for your bracket.</p>
              </div>
            )}

            {loading && (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12">
                <div className="relative w-24 h-24 mb-6">
                   <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                   <BrainCircuit className="absolute inset-0 m-auto text-primary w-10 h-10 animate-pulse" />
                </div>
                <h3 className="text-xl font-headline font-bold text-foreground mb-2">Analyzing Performance</h3>
                <p className="text-sm text-muted-foreground animate-pulse">Running Monte Carlo simulations for 100,000 match outcomes...</p>
              </div>
            )}

            {seeding && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center justify-between mb-8 pb-4 border-b border-black/5">
                  <h3 className="text-xl font-headline font-bold text-foreground flex items-center gap-3">
                    <Sparkles className="text-accent w-5 h-5" />
                    Suggested Seeding
                  </h3>
                  <GlassButton variant="outline" size="sm" className="text-foreground border-black/10">Apply Seeding</GlassButton>
                </div>
                
                <div className="space-y-4">
                  {seeding.seeding.map((s, i) => (
                    <div key={s.participantName} className="group relative">
                      <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-1 h-0 bg-accent group-hover:h-full transition-all duration-300 rounded-full" />
                      <div className="p-4 rounded-2xl bg-black/[0.03] border border-black/5 hover:bg-black/[0.05] transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-primary/20 text-primary flex items-center justify-center font-headline font-bold">
                            #{s.seed}
                          </div>
                          <div className="flex-1">
                            <div className="text-foreground font-bold">{s.participantName}</div>
                            <div className="text-muted-foreground text-xs mt-1 leading-relaxed italic">"{s.reasoning}"</div>
                          </div>
                          <Trophy className={cn("w-5 h-5", i === 0 ? "text-yellow-500" : "text-black/10")} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </GlassCard>
        </div>
      </div>
    </div>
  )
}

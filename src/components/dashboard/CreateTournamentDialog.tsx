
"use client"

import { useState } from "react"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import GlassButton from "@/components/glass/GlassButton"
import { Trophy, Calendar, Users, Target } from "lucide-react"

interface CreateTournamentDialogProps {
  isOpen: boolean
  onClose: () => void
  onCreated: (tournament: any) => void
}

export function CreateTournamentDialog({ isOpen, onClose, onCreated }: CreateTournamentDialogProps) {
  const [name, setName] = useState("")
  const [sport, setSport] = useState("Basketball")
  const [participants, setParticipants] = useState("16")
  const [date, setDate] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !date) return

    const newTournament = {
      id: Math.random().toString(36).substr(2, 9),
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      sport,
      status: 'Upcoming',
      participants: parseInt(participants),
      date,
      image: `https://picsum.photos/seed/${Math.random()}/800/400`
    }

    onCreated(newTournament)
    setName("")
    setDate("")
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-3xl border-black/5 bg-white/90 backdrop-blur-2xl">
        <DialogHeader>
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-4">
            <Trophy className="w-6 h-6 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-headline font-bold text-foreground">Launch Arena</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Configure your next elite athletic event. All details can be modified later.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tournament Name</Label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="name" 
                placeholder="e.g. Winter Slam Invitational" 
                className="pl-10 h-12 bg-black/5 border-black/5 rounded-xl"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sport Type</Label>
              <Select value={sport} onValueChange={setSport}>
                <SelectTrigger className="h-12 bg-black/5 border-black/5 rounded-xl">
                  <SelectValue placeholder="Select sport" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="Basketball">Basketball</SelectItem>
                  <SelectItem value="Soccer">Soccer</SelectItem>
                  <SelectItem value="Volleyball">Volleyball</SelectItem>
                  <SelectItem value="E-Sports">E-Sports</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Bracket Size</Label>
              <Select value={participants} onValueChange={setParticipants}>
                <SelectTrigger className="h-12 bg-black/5 border-black/5 rounded-xl">
                  <SelectValue placeholder="Teams" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="8">8 Teams</SelectItem>
                  <SelectItem value="16">16 Teams</SelectItem>
                  <SelectItem value="32">32 Teams</SelectItem>
                  <SelectItem value="64">64 Teams</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Event Schedule</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                id="date" 
                placeholder="e.g. Oct 15 - Oct 20" 
                className="pl-10 h-12 bg-black/5 border-black/5 rounded-xl"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter className="pt-4">
            <GlassButton 
              type="button" 
              variant="secondary" 
              onClick={onClose}
              className="flex-1 h-12"
            >
              Cancel
            </GlassButton>
            <GlassButton 
              type="submit"
              className="flex-1 h-12 neon-glow-blue"
            >
              Launch Tourney
            </GlassButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

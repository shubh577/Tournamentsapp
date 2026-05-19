
"use client"

import GlassCard from "@/components/glass/GlassCard"
import GlassButton from "@/components/glass/GlassButton"
import { Settings, User, Bell, Shield, Palette } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsDashboard() {
  const sections = [
    { id: 'profile', label: 'Profile Settings', icon: User, desc: 'Manage your organization profile and public identity.' },
    { id: 'notifications', label: 'Notifications', icon: Bell, desc: 'Configure real-time alerts for match events.' },
    { id: 'security', label: 'Security', icon: Shield, desc: 'Two-factor authentication and API access keys.' },
    { id: 'appearance', label: 'Appearance', icon: Palette, desc: 'Customize dashboard themes and branding colors.' },
  ]

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-headline font-bold text-foreground">SYSTEM CONFIG</h1>
        <p className="text-muted-foreground text-sm">Fine-tune your Vortex Arena experience.</p>
      </div>

      <div className="grid gap-6">
        {sections.map((section) => (
          <GlassCard key={section.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
               <div className="p-3 rounded-2xl bg-black/5 text-primary">
                  <section.icon className="w-6 h-6" />
               </div>
               <div>
                  <h3 className="text-lg font-bold text-foreground">{section.label}</h3>
                  <p className="text-sm text-muted-foreground">{section.desc}</p>
               </div>
            </div>
            <GlassButton variant="outline" size="sm" className="text-foreground border-black/10 shrink-0">Configure</GlassButton>
          </GlassCard>
        ))}

        <GlassCard className="border-primary/10">
           <div className="flex items-center justify-between">
              <div>
                 <Label className="text-base font-bold text-foreground">Developer Mode</Label>
                 <p className="text-xs text-muted-foreground">Enable advanced analytics and debug telemetry.</p>
              </div>
              <Switch />
           </div>
        </GlassCard>
      </div>
    </div>
  )
}

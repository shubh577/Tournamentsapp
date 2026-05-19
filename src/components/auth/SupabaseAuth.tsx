"use client"

import { useEffect, useState } from "react"
import { LogOut, UserCheck } from "lucide-react"
import GlassButton from "@/components/glass/GlassButton"
import { supabase } from "@/lib/supabaseClient"

type Session = import("@supabase/supabase-js").Session | null

export default function SupabaseAuth() {
  const [session, setSession] = useState<Session>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true

    async function loadSession() {
      const { data, error } = await supabase.auth.getSession()
      if (!mounted) return
      if (error) {
        setError(error.message)
      } else {
        setSession(data.session)
      }
    }

    loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setSession(session)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleGoogleSignIn = async () => {
    setError(null)
    setLoading(true)

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    const { error } = await supabase.auth.signOut()
    if (error) {
      setError(error.message)
    } else {
      setSession(null)
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col items-start gap-3">
      {session ? (
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-2xl border border-white/10 bg-white/10 px-4 py-2 text-sm">
            <div className="text-[0.65rem] uppercase tracking-[0.3em] text-muted-foreground">Signed in as</div>
            <div className="font-semibold text-foreground">
              {session.user.email ?? session.user.user_metadata?.full_name ?? "Google user"}
            </div>
          </div>
          <GlassButton variant="ghost" onClick={handleSignOut} disabled={loading}>
            <LogOut className="w-4 h-4" /> Sign out
          </GlassButton>
        </div>
      ) : (
        <GlassButton onClick={handleGoogleSignIn} disabled={loading}>
          <UserCheck className="w-4 h-4" /> Sign in with Google
        </GlassButton>
      )}
      {error ? <p className="text-xs text-red-300">{error}</p> : null}
    </div>
  )
}

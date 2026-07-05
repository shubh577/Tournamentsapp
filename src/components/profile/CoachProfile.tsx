'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GlassCard from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Pencil, Trophy, UserPlus, LogOut, Ghost, Activity, Scale, CalendarDays } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression';

// 1. Helper components live OUTSIDE the main component (This is fine!)
const EditableField = ({ value, onSave, label }: { value: string, onSave: (newValue: string) => Promise<void>, label: string }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value);

  const handleSave = async () => {
    await onSave(currentValue);
    setIsEditing(false);
  }

  return (
    <div className="flex items-center gap-4 group">
      <motion.div layout className="flex-1">
        {isEditing ? (
          <input 
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="bg-transparent border-b-2 border-primary/50 focus:outline-none w-full text-lg"
            autoFocus
          />
        ) : (
          <p className="text-lg text-foreground/80">{label}: <span className="font-bold">{value}</span></p>
        )}
      </motion.div>
      <button onClick={() => setIsEditing(!isEditing)} className="opacity-0 group-hover:opacity-100 transition-opacity">
        <Pencil className="w-4 h-4 text-primary" />
      </button>
    </div>
  )
}

// 2. Main component
export default function CoachProfile({ profile, setProfile }: { profile: any, setProfile: (newProfile: any) => void}) {
  // ALL HOOKS MUST LIVE HERE (INSIDE THE BODY)
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);
  
  // FIX: Moved inside the function body!
  const [trainedPlayers, setTrainedPlayers] = useState<any[]>([]);
  const [loadingPlayers, setLoadingPlayers] = useState(true);

  useEffect(() => {
    const fetchTrainedPlayers = async () => {
      setLoadingPlayers(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: realRoster } = await supabase
        .from('profiles')
        .select(`
            id, name, avatar_url, city, age, gender,
            players!players_id_fkey!inner(weight_kg)
        `)
        .eq('players.coach_id', user.id);

      const { data: shadowRoster } = await supabase
        .from('shadow_profiles')
        .select('*')
        .eq('coach_id', user.id);

      let mergedList: any[] = [];

      if (realRoster) {
        mergedList = [...mergedList, ...realRoster.map((p: any) => {
          const playerData = Array.isArray(p.players) ? p.players[0] : p.players;
          return {
            id: p.id,
            name: p.name,
            avatar_url: p.avatar_url,
            isShadow: false,
            stats: { gender: p.gender, weight_kg: playerData?.weight_kg, age: p.age }
          };
        })];
      }

      if (shadowRoster) {
        mergedList = [...mergedList, ...shadowRoster.map((sp: any) => ({
          id: sp.id,
          name: sp.name,
          avatar_url: null,
          isShadow: true,
          stats: { gender: sp.gender, weight_kg: sp.weight_kg, age: sp.age }
        }))];
      }

      setTrainedPlayers(mergedList);
      setLoadingPlayers(false);
    };

    fetchTrainedPlayers();
  }, []);

  const handleSave = async (field: string, value: any) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from('profiles').update({ [field]: value }).eq('id', user.id).select().single();
      if(error) {
        console.error(`Error updating ${field}:`, error);
      } else {
        setProfile(data);
      }
    }
  }
  
  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true
    }

    try {
      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressedFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await handleSave('avatar_url', publicUrl);
      setAvatarUrl(publicUrl);

    } catch (error) {
      console.error('Error uploading avatar: ', error);
    } finally {
      setUploading(false);
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  }

  return (
    <GlassCard className="w-full max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-8">
        <div className="relative">
            <label htmlFor="avatar-upload" className="cursor-pointer">
                <img src={avatarUrl || 'https://via.placeholder.com/150'} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
                {uploading && <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"><div className="loader"></div></div>}
            </label>
            <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarUpload} />
        </div>
        <div>
          <h1 className="text-4xl font-bold">{profile.name}</h1>
          <p className="text-xl text-primary/80">Coach</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary/20 pb-2">Personal Info</h2>
              <div className="space-y-4">
                  <EditableField label="Name" value={profile.name} onSave={(newValue) => handleSave('name', newValue)} />
                  <EditableField label="Age" value={profile.age ? profile.age.toString() : 'N/A'} onSave={async (newValue) => {await handleSave('age', parseInt(newValue, 10))}} />
                  <EditableField label="Gender" value={profile.gender || 'N/A'} onSave={(newValue) => handleSave('gender', newValue)} />
              </div>
          </div>
          <div>
              <h2 className="text-2xl font-bold mb-4 border-b-2 border-primary/20 pb-2">Professional Info</h2>
              <div className="space-y-4">
                  <EditableField label="Certifications" value={profile.certifications || 'N/A'} onSave={(newValue) => handleSave('certifications', newValue)} />
              </div>
          </div>
      </div>

      {/* RENDER BULLETPROOF TRAINED PLAYERS LIST */}
      <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 border-b-2 border-primary/20 pb-2 flex items-center gap-2">
            <Trophy /> Trained Players 
            <span className="bg-primary/20 text-primary text-sm px-2.5 py-0.5 rounded-full ml-2">{trainedPlayers.length}</span>
          </h2>
          
          {loadingPlayers ? (
              <div className="flex justify-center py-6 text-muted-foreground gap-2 items-center"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div> Loading squad roster...</div>
          ) : trainedPlayers.length === 0 ? (
              <p className="text-muted-foreground text-sm italic py-4">No active players assigned to your roster yet.</p>
          ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {trainedPlayers.map((player) => (
                      <div key={player.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-4 overflow-hidden">
                              <Avatar className="w-12 h-12 border border-white/20 shadow-sm shrink-0">
                                  <AvatarImage src={player.avatar_url} />
                                  <AvatarFallback className="bg-primary/10 text-primary font-bold">{player.name?.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div className="overflow-hidden">
                                  <div className="flex items-center gap-2">
                                      <h4 className="font-bold text-base text-foreground truncate">{player.name}</h4>
                                      {player.isShadow && (
                                          <span className="bg-white/10 text-muted-foreground text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-widest border border-white/5 flex items-center shrink-0">
                                              <Ghost className="w-2.5 h-2.5 mr-1"/> Proxy
                                          </span>
                                      )}
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                      {player.stats.gender && <span className="flex items-center gap-0.5"><Activity className="w-3 h-3 text-primary/70"/> {player.stats.gender}</span>}
                                      {player.stats.weight_kg && <span className="flex items-center gap-0.5"><Scale className="w-3 h-3 text-primary/70"/> {player.stats.weight_kg}kg</span>}
                                      {player.stats.age && <span className="flex items-center gap-0.5"><CalendarDays className="w-3 h-3 text-primary/70"/> Age {player.stats.age}</span>}
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      <div className="flex justify-between items-center mt-12">
          <Button variant="outline" onClick={handleLogout}><LogOut className="mr-2" /> Log Out</Button>
          <Button onClick={() => window.location.href = '/dashboard/players'}><UserPlus className="mr-2" /> Manage Roster</Button>
      </div>
    </GlassCard>
  )
}
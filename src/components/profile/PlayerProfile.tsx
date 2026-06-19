'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import GlassCard from '@/components/glass/GlassCard'
import { Button } from '@/components/ui/button'
import { Pencil, Trophy, Shield, Calendar, LogOut, Star } from 'lucide-react'
import { motion } from 'framer-motion'
import imageCompression from 'browser-image-compression';

// A new component for inline editing
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

// Enhanced Badge Component
const ExpertiseBadge = ({ badge }: { badge: string }) => {
    const badgeStyles: any = {
        Zonal: { bg: 'bg-amber-800', text: 'text-amber-200', shadow: 'shadow-amber-900/50' },
        District: { bg: 'bg-orange-700', text: 'text-orange-200', shadow: 'shadow-orange-900/50' },
        State: { bg: 'bg-gray-500', text: 'text-gray-100', shadow: 'shadow-gray-700/50' },
        National: { bg: 'bg-yellow-500', text: 'text-yellow-900', shadow: 'shadow-yellow-600/50' },
        International: { bg: 'bg-purple-600', text: 'text-purple-100', shadow: 'shadow-purple-700/50' },
    };

    const style = badgeStyles[badge] || { bg: 'bg-gray-400', text: 'text-gray-900', shadow: 'shadow-gray-500/50' };

    // Special case for Gold to create a gradient effect
    const backgroundClass = badge === 'Gold' 
        ? `bg-gradient-to-br from-yellow-400 to-yellow-600` 
        : style.bg;

    return (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm ${backgroundClass} ${style.text} shadow-lg ${style.shadow} transform hover:scale-105 transition-transform`}>
            <Star className="w-4 h-4" />
            <span>{badge}</span>
        </div>
    );
}


export default function PlayerProfile({ profile, setProfile }: { profile: any, setProfile: (newProfile: any) => void}) {
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [uploading, setUploading] = useState(false);

  const handleSave = async (field: string, value: any, table: string = 'profiles') => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data, error } = await supabase.from(table).update({ [field]: value }).eq('id', user.id).select().single();
      if(error) {
        console.error(`Error updating ${field}:`, error);
      } else {
        // When updating, we need to merge the new data with the existing profile
        setProfile({ ...profile, ...data });
      }
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);

    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1080,
      useWebWorker: true
    }

    try {
      const compressedFile = await imageCompression(file, options);
      const fileExt = compressedFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      let { error: uploadError } = await supabase.storage.from('avatars').upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(filePath);
      await handleSave('avatar_url', publicUrl);
      setAvatarUrl(publicUrl);

    } catch (error) {
      console.error('Error uploading avatar: ', error);
    } finally {
      setUploading(false);
    }
  }
  
  const renderSportSpecifics = () => {
    if (!profile.sport_specifics) return null;
    
    return Object.entries(profile.sport_specifics).map(([key, value]) => (
      <p key={key} className="capitalize text-lg text-foreground/80">{key.replace('_', ' ')}: <span className="font-bold">{value as string}</span></p>
    ));
  }

  return (
    <GlassCard className="w-full max-w-4xl mx-auto p-4 sm:p-8">
      <div className="flex flex-col sm:flex-row items-center gap-6 mb-10">
        <div className="relative group">
            <label htmlFor="avatar-upload" className="cursor-pointer">
                <img src={avatarUrl || 'https://via.placeholder.com/150'} alt="Avatar" className="w-32 h-32 rounded-full object-cover border-4 border-white/10 shadow-lg group-hover:border-primary/50 transition-colors" />
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                    <Pencil className="w-8 h-8 text-white"/>
                </div>
                {uploading && <div className="absolute inset-0 bg-black/70 flex items-center justify-center rounded-full"><div className="loader"></div></div>}
            </label>
            <input type="file" id="avatar-upload" hidden accept="image/*" onChange={handleAvatarUpload} />
        </div>
        <div className="text-center sm:text-left">
          <h1 className="text-4xl font-bold font-headline tracking-tight">{profile.name}</h1>
          <p className="text-xl text-primary/80 mb-4">Player</p>
          {profile.expertise_badge && <ExpertiseBadge badge={profile.expertise_badge} />}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-headline mb-4 border-b-2 border-primary/20 pb-2">Personal Info</h2>
           <EditableField label="Name" value={profile.name} onSave={(newValue) => handleSave('name', newValue)} />
           <EditableField label="Age" value={profile.age.toString()} onSave={async (newValue) => {await handleSave('age', parseInt(newValue, 10))}} />
           <EditableField label="Gender" value={profile.gender} onSave={(newValue) => handleSave('gender', newValue)} />
        </div>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold font-headline mb-4 border-b-2 border-primary/20 pb-2">Professional Info</h2>
           <EditableField label="Primary Sport" value={profile.sport} onSave={(newValue) => handleSave('sport', newValue, 'players')} />
           {renderSportSpecifics()}
           <p className="text-lg text-foreground/80">Team: <span className="font-bold">{profile.team || 'N/A'}</span></p>
        </div>
      </div>

      <div className="mt-12">
          <h2 className="text-3xl font-bold font-headline mb-4 pb-2 flex items-center gap-3"><Shield className="text-primary"/> Current Hustle</h2>
          <div className="p-6 rounded-xl bg-white/5">
            <p className="text-center text-muted-foreground">No active tournaments right now. Time to train!</p>
          </div>
      </div>
      
      <div className="mt-10">
          <h2 className="text-3xl font-bold font-headline mb-4 pb-2 flex items-center gap-3"><Trophy className="text-primary"/> Past Tournaments</h2>
           <div className="p-6 rounded-xl bg-white/5">
            <p className="text-center text-muted-foreground">No tournament history yet.</p>
          </div>
      </div>

    </GlassCard>
  )
}

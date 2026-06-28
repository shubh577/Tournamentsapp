'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/glass/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Users, MapPin, Trophy, Shield, ChevronLeft, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreateTeamPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: '',
        sport: '', // Silently auto-populated from coach profile
        city: '',
        logo_url: '',
        bio: ''
    });

    // Auto-fetch the coach's primary sport on mount
    useEffect(() => {
        const fetchCoachData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('coaches').select('sport').eq('id', user.id).single();
                if (data?.sport) {
                    setFormData(prev => ({ ...prev, sport: data.sport }));
                }
            }
        };
        fetchCoachData();
    }, []);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        setErrorMsg(null); // Clear errors when user types
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `team_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage
                .from('team_logos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('team_logos').getPublicUrl(fileName);
            handleInputChange('logo_url', data.publicUrl);
        } catch (error) {
            console.error('Error uploading team logo:', error);
            setErrorMsg("Failed to upload image. Please check file size and type.");
        } finally {
            setUploading(false);
        }
    };

    const isFormValid = formData.name.trim() !== '' && formData.city.trim() !== '';

    const handleSubmit = async () => {
        if (!isFormValid) {
            setErrorMsg("Please fill out the Team Name and City to continue.");
            return;
        }

        setLoading(true);
        setErrorMsg(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setErrorMsg("You must be logged in to create a team.");
            setLoading(false);
            return;
        }

        // Fallback fetch if the sport didn't load fast enough on mount
        let finalSport = formData.sport;
        if (!finalSport) {
            const { data } = await supabase.from('coaches').select('sport').eq('id', user.id).single();
            finalSport = data?.sport || 'unassigned';
        }

        // Insert into the persistent teams/squad registry table
        const { data, error } = await supabase.from('teams').insert({
            coach_id: user.id,
            name: formData.name,
            sport: finalSport.toLowerCase(),
            city: formData.city,
            logo_url: formData.logo_url,
            bio: formData.bio,
            status: 'active'
        }).select().single();

        if (error) {
            console.error("Team Creation Error:", error);
            setErrorMsg(error.message || "Failed to create team. Please try again.");
            setLoading(false);
        } else {
            // Success! Route them to their new team's dashboard/roster page
            router.push(`/team/${data.id}`);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500">
            
            {/* Header */}
            <div className="mb-8">
                <Button variant="ghost" onClick={() => router.push('/dashboard/teams')} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to My Teams
                </Button>
                <h1 className="text-4xl font-extrabold font-headline tracking-tight flex items-center gap-3">
                    <Shield className="w-8 h-8 text-primary" /> Create New Squad
                </h1>
                <p className="text-muted-foreground mt-2">Establish your persistent team identity. Build your roster once, and apply to tournaments with a single click.</p>
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
                <GlassCard className="p-0 overflow-hidden border-white/10 shadow-2xl">
                    
                    {/* Abstract Top Banner */}
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-blue-500/10 to-transparent relative border-b border-white/5" />

                    <div className="p-6 sm:p-10">
                        
                        {/* Logo Upload (Overlapping Banner) */}
                        <div className="flex flex-col sm:flex-row gap-8 items-start sm:items-end -mt-20 mb-10 relative z-10">
                            <div className="relative group shrink-0">
                                <div className="w-32 h-32 rounded-2xl border-4 border-background bg-black/60 shadow-2xl flex items-center justify-center overflow-hidden transition-all group-hover:border-primary/50">
                                    {formData.logo_url ? (
                                        <img src={formData.logo_url} alt="Team Logo" className="w-full h-full object-cover" />
                                    ) : (
                                        <Users className="w-12 h-12 text-muted-foreground opacity-50" />
                                    )}
                                    <label className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity backdrop-blur-sm">
                                        {uploading ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <Camera className="w-6 h-6 text-white" />}
                                        <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} disabled={uploading} />
                                    </label>
                                </div>
                            </div>
                            <div className="flex-1 pb-2">
                                <h3 className="font-bold text-lg">Team Crest</h3>
                                <p className="text-sm text-muted-foreground">Upload a high-quality logo (1:1 ratio recommended).</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            
                            {/* Core Identity Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Team Name <span className="text-red-500">*</span></Label>
                                    <Input 
                                        placeholder="e.g., The Jaipur Jaguars" 
                                        value={formData.name} 
                                        onChange={e => handleInputChange('name', e.target.value)} 
                                        className="h-14 bg-white/5 border-white/10 text-lg font-bold" 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Base City / Location <span className="text-red-500">*</span></Label>
                                    <div className="relative">
                                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                        <Input 
                                            placeholder="e.g., Jaipur, Rajasthan" 
                                            value={formData.city} 
                                            onChange={e => handleInputChange('city', e.target.value)} 
                                            className="h-14 pl-12 bg-white/5 border-white/10" 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2 pt-2">
                                <Label className="text-muted-foreground">Team Bio / Description <span className="text-xs font-normal">(Optional)</span></Label>
                                <Textarea 
                                    placeholder="A brief history of your squad, your philosophy, or your major achievements..." 
                                    value={formData.bio} 
                                    onChange={e => handleInputChange('bio', e.target.value)} 
                                    className="min-h-[120px] bg-white/5 border-white/10" 
                                />
                            </div>

                            {/* Error Banner */}
                            <AnimatePresence>
                                {errorMsg && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start text-red-400 text-sm">
                                            <AlertCircle className="w-5 h-5 mr-3 shrink-0 mt-0.5" />
                                            <p>{errorMsg}</p>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Submit Area */}
                            <div className="pt-8 mt-8 border-t border-white/10 flex justify-end">
                                <Button 
                                    size="lg" 
                                    onClick={handleSubmit} 
                                    disabled={loading || !isFormValid}
                                    className="w-full sm:w-auto px-8 h-14 text-lg font-bold shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-all"
                                >
                                    {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Trophy className="w-5 h-5 mr-2" />}
                                    Initialize Squad
                                </Button>
                            </div>

                        </div>
                    </div>
                </GlassCard>
            </motion.div>
        </div>
    );
}
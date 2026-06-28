'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import GlassCard from '@/components/glass/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Users, Loader2, X, Shield, Clock, AlertCircle, UserMinus, Send, CheckCircle2, XCircle, Edit2, Scale, CalendarDays, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SquadManagementPage() {
    const router = useRouter();
    const { toast } = useToast();

    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [coachProfile, setCoachProfile] = useState<any>(null);
    const [coachSport, setCoachSport] = useState<string>('');

    // Roster & Stats States
    const [activePlayers, setActivePlayers] = useState<any[]>([]);
    const [pendingInvites, setPendingInvites] = useState<any[]>([]);
    const [inviteStats, setInviteStats] = useState({ total: 0, pending: 0, accepted: 0, rejected: 0 });

    // Search & Recruit States
    const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [invitingId, setInvitingId] = useState<string | null>(null);

    // Edit Player Stats States
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingPlayer, setEditingPlayer] = useState<any>(null);
    const [editForm, setEditForm] = useState({ gender: '', weight_kg: '', age: '' });
    const [isSavingStats, setIsSavingStats] = useState(false);

    useEffect(() => {
        fetchRosterData();
    }, []);

    const fetchRosterData = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (profile?.role !== 'coach') {
            router.push('/dashboard/overview');
            return;
        }

        const { data: coachData } = await supabase.from('coaches').select('sport').eq('id', user.id).single();
        const sport = coachData?.sport || '';
        
        setCurrentUser(user);
        setCoachProfile(profile);
        setCoachSport(sport);

        // 1. FETCH ROSTER WITH SMART DEMOGRAPHICS (Age/Gender from profiles, Weight from players)
        const { data: rosterData, error: rosterError } = await supabase
            .from('profiles')
            .select(`
                id, name, avatar_url, city, age, gender,
                players!players_id_fkey!inner(coach_id, weight_kg)
            `)
            .eq('players.coach_id', user.id);

        if (rosterError) console.error("Roster Fetch Error:", rosterError);
        
        if (rosterData) {
            const formattedRoster = rosterData.map((p: any) => {
                const playerData = Array.isArray(p.players) ? p.players[0] : p.players;
                return {
                    id: p.id,
                    profiles: { name: p.name, avatar_url: p.avatar_url, city: p.city },
                    stats: {
                        gender: p.gender,
                        weight_kg: playerData?.weight_kg,
                        age: p.age
                    }
                };
            });
            setActivePlayers(formattedRoster);
        }

        // 2. FETCH INVITES
        const { data: invitesData } = await supabase
            .from('team_invitations')
            .select('*')
            .eq('coach_id', user.id)
            .order('created_at', { ascending: false });

        if (invitesData) {
            setInviteStats({
                total: invitesData.length,
                pending: invitesData.filter(i => i.status === 'pending').length,
                accepted: invitesData.filter(i => i.status === 'accepted').length,
                rejected: invitesData.filter(i => i.status === 'declined').length,
            });

            const pending = invitesData.filter(i => i.status === 'pending');
            
            if (pending.length > 0) {
                const playerIds = pending.map(i => i.player_id);
                const { data: profilesData } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .in('id', playerIds);
                
                const enrichedPending = pending.map(inv => {
                    const matchedProfile = profilesData?.find(p => p.id === inv.player_id);
                    return { ...inv, profiles: matchedProfile || { name: 'Unknown Player' } };
                });
                
                setPendingInvites(enrichedPending);
            } else {
                setPendingInvites([]);
            }
        }

        setLoading(false);
    };

    // --- RECRUITMENT ENGINE ---
    const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim().length < 3) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                id, name, avatar_url, city, age, gender,
                players!players_id_fkey!inner ( sport, coach_id, weight_kg )
            `)
            .eq('role', 'player')
            .ilike('name', `%${query}%`)
            .ilike('players.sport', `%${coachSport}%`)
            .is('players.coach_id', null) 
            .limit(5);

        if (data) {
            const formattedResults = data.map((p: any) => {
                const pData = Array.isArray(p.players) ? p.players[0] : p.players;
                return {
                    id: p.id, name: p.name, avatar_url: p.avatar_url, city: p.city,
                    stats: { gender: p.gender, weight_kg: pData?.weight_kg, age: p.age }
                }
            });
            setSearchResults(formattedResults);
        }
        setIsSearching(false);
    };

    const handleSendInvite = async (playerId: string, playerName: string) => {
        setInvitingId(playerId);
        try {
            if (activePlayers.some(p => p.id === playerId)) {
                toast({ title: "Already in Squad", description: "Player is on your active roster.", variant: "destructive" });
                return;
            }
            if (pendingInvites.some(p => p.player_id === playerId)) {
                toast({ title: "Invite Pending", description: "Invite already sent.", variant: "destructive" });
                return;
            }

            const { data: invite, error: inviteError } = await supabase.from('team_invitations').insert({
                coach_id: currentUser.id, player_id: playerId, status: 'pending'
            }).select().single();

            if (inviteError) throw inviteError;

            await supabase.from('notifications').insert({
                user_id: playerId, type: 'team_invite',
                message: `Coach ${coachProfile.name} has invited you to join their squad!`,
                metadata: { team_invitation_id: invite.id, coach_id: currentUser.id, coach_name: coachProfile.name }
            });

            toast({ title: "Offer Sent", description: `Invitation dispatched to ${playerName}.` });
            fetchRosterData(); 
            setIsRecruitModalOpen(false);
            setSearchQuery('');
            setSearchResults([]);
        } catch (error) {
            toast({ title: "Action Blocked", description: "Failed to send invitation.", variant: "destructive" });
        } finally {
            setInvitingId(null);
        }
    };

    const handleRemovePlayer = async (playerId: string) => {
        if (!confirm("Are you sure you want to release this player from your squad?")) return;
        const { error } = await supabase.from('players').update({ coach_id: null }).eq('id', playerId);
        if (error) {
            toast({ title: "Action Blocked", description: "Failed to release player.", variant: "destructive" });
            return;
        }
        toast({ title: "Player Released", description: "They have been removed from your roster." });
        setActivePlayers(prev => prev.filter(p => p.id !== playerId));
        fetchRosterData(); 
    };

    const handleCancelInvite = async (inviteId: string) => {
        await supabase.from('team_invitations').delete().eq('id', inviteId);
        toast({ title: "Invite Cancelled", description: "The pending offer has been withdrawn." });
        fetchRosterData(); 
    };

    // --- PLAYER STATS ENGINE ---
    const openEditModal = (player: any) => {
        setEditingPlayer(player);
        setEditForm({
            gender: player.stats?.gender || '',
            weight_kg: player.stats?.weight_kg || '',
            age: player.stats?.age || ''
        });
        setIsEditModalOpen(true);
    };

    const savePlayerStats = async () => {
        if (!editingPlayer) return;
        setIsSavingStats(true);

        // Update Profiles Table (Age & Gender)
        const { error: profileError } = await supabase.from('profiles').update({
            gender: editForm.gender || null,
            age: editForm.age ? parseInt(editForm.age) : null
        }).eq('id', editingPlayer.id);

        // Update Players Table (Weight)
        const { error: playerError } = await supabase.from('players').update({
            weight_kg: editForm.weight_kg ? parseFloat(editForm.weight_kg) : null
        }).eq('id', editingPlayer.id);

        setIsSavingStats(false);

        if (profileError || playerError) {
            toast({ title: "Error Saving", description: profileError?.message || playerError?.message, variant: "destructive" });
        } else {
            toast({ title: "Stats Updated", description: `${editingPlayer.profiles.name}'s profile synced.` });
            setIsEditModalOpen(false);
            fetchRosterData(); 
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div>;

    return (
        <div className="max-w-6xl mx-auto p-4 sm:p-8 animate-in fade-in duration-500 relative">
            
            {/* EDIT STATS MODAL */}
            <AnimatePresence>
                {isEditModalOpen && editingPlayer && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md">
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)]">
                                <div className="flex justify-between items-center mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">Update Demographics</h2>
                                        <p className="text-sm text-primary font-bold mt-1">{editingPlayer.profiles.name}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsEditModalOpen(false)} className="rounded-full"><X className="w-5 h-5" /></Button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Gender</Label>
                                        <Select onValueChange={(v) => setEditForm(prev => ({...prev, gender: v}))} value={editForm.gender}>
                                            <SelectTrigger className="bg-black/40"><SelectValue placeholder="Select Gender" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Male">Male</SelectItem>
                                                <SelectItem value="Female">Female</SelectItem>
                                                <SelectItem value="Other">Other</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Weight (kg)</Label>
                                        <div className="relative">
                                            <Scale className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input type="number" step="0.1" value={editForm.weight_kg} onChange={(e) => setEditForm(prev => ({...prev, weight_kg: e.target.value}))} className="pl-10 bg-black/40" placeholder="e.g. 65.5" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-muted-foreground">Age</Label>
                                        <div className="relative">
                                            <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                            <Input type="number" value={editForm.age} onChange={(e) => setEditForm(prev => ({...prev, age: e.target.value}))} className="pl-10 bg-black/40" placeholder="e.g. 24" />
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-4 border-t border-white/10 flex justify-end gap-3">
                                    <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
                                    <Button onClick={savePlayerStats} disabled={isSavingStats} className="shadow-[0_0_15px_rgba(var(--primary-rgb),0.4)]">
                                        {isSavingStats ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />} Save Stats
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* RECRUITMENT MODAL */}
            <AnimatePresence>
                {isRecruitModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-lg">
                            <GlassCard className="p-6 border-primary/30 shadow-[0_0_50px_rgba(var(--primary-rgb),0.1)] overflow-hidden flex flex-col max-h-[80vh]">
                                <div className="flex justify-between items-center mb-4">
                                    <div><h2 className="text-2xl font-bold font-headline">Recruit Player</h2><p className="text-sm text-muted-foreground mt-1">Search the registry for athletes.</p></div>
                                    <Button variant="ghost" size="icon" onClick={() => setIsRecruitModalOpen(false)} className="rounded-full"><X className="w-5 h-5" /></Button>
                                </div>
                                <div className="mb-6 flex items-center"><span className="text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-md">Filter: {coachSport} Only</span></div>
                                <div className="relative mb-6 shrink-0"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input placeholder={`Search ${coachSport || ''} players...`} value={searchQuery} onChange={handleSearch} className="h-14 pl-12 bg-black/40 border-white/10 text-lg rounded-xl focus-visible:ring-primary" autoFocus /></div>
                                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
                                    {isSearching ? <div className="flex justify-center py-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div> : searchResults.length > 0 ? (
                                        searchResults.map(player => (
                                            <div key={player.id} className="p-4 bg-white/5 rounded-xl border border-white/10 hover:border-primary/50 transition-colors">
                                                <div className="flex items-center justify-between mb-3">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <Avatar className="w-10 h-10 border border-white/20"><AvatarImage src={player.avatar_url} /><AvatarFallback className="bg-primary/20 text-primary font-bold">{player.name.charAt(0)}</AvatarFallback></Avatar>
                                                        <div className="overflow-hidden"><Link href={`/user/${player.id}`} target="_blank"><h4 className="font-bold text-sm truncate hover:text-primary transition-colors cursor-pointer">{player.name}</h4></Link><p className="text-[10px] text-muted-foreground truncate">{player.city || 'Location Unknown'}</p></div>
                                                    </div>
                                                    <Button size="sm" onClick={() => handleSendInvite(player.id, player.name)} disabled={invitingId === player.id} className="shadow-[0_0_15px_rgba(var(--primary-rgb),0.3)] shrink-0 h-8">{invitingId === player.id ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Send Offer'}</Button>
                                                </div>
                                                {/* Mini Stats Banner for Search Results */}
                                                <div className="flex items-center gap-3 pt-2 border-t border-white/5 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                                    {player.stats?.gender && <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-primary"/> {player.stats.gender}</span>}
                                                    {player.stats?.weight_kg && <span className="flex items-center gap-1"><Scale className="w-3 h-3 text-primary"/> {player.stats.weight_kg}kg</span>}
                                                    {player.stats?.age && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-primary"/> Age {player.stats.age}</span>}
                                                </div>
                                            </div>
                                        ))
                                    ) : searchQuery.length >= 3 ? (
                                        <div className="text-center py-12 text-muted-foreground"><AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" /><p>No {coachSport} players found matching "{searchQuery}".</p></div>
                                    ) : <div className="text-center py-12 text-muted-foreground opacity-50"><Users className="w-12 h-12 mx-auto mb-3" /><p>Type at least 3 letters to search.</p></div>}
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* HEADER */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tight flex items-center gap-3">
                        <Shield className="w-8 h-8 text-primary" /> Squad Management
                    </h1>
                    <p className="text-muted-foreground mt-2">Manage your active roster, update player physicals, and recruit new talent.</p>
                </div>
                <Button size="lg" onClick={() => setIsRecruitModalOpen(true)} className="w-full sm:w-auto shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]"><UserPlus className="w-5 h-5 mr-2" /> Recruit Player</Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* ACTIVE ROSTER (LEFT COL) */}
                <div className="lg:col-span-2 space-y-6">
                    <GlassCard className="p-6 sm:p-8">
                        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
                            <h2 className="text-2xl font-bold flex items-center gap-2">Active Roster <span className="bg-primary/20 text-primary text-sm px-3 py-1 rounded-full">{activePlayers.length}</span></h2>
                        </div>

                        {activePlayers.length === 0 ? (
                            <div className="text-center py-16 bg-black/20 rounded-2xl border border-dashed border-white/10">
                                <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-50" />
                                <h3 className="text-xl font-bold mb-2">Your roster is empty</h3>
                                <p className="text-muted-foreground mb-6 max-w-md mx-auto">You haven't signed any players yet. Use the recruit button to find athletes.</p>
                                <Button variant="outline" onClick={() => setIsRecruitModalOpen(true)}>Find Players</Button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-4">
                                {activePlayers.map((player) => (
                                    <motion.div key={player.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors gap-4">
                                        <div className="flex items-center gap-4 overflow-hidden">
                                            <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-lg">
                                                <AvatarImage src={player.profiles?.avatar_url} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">{player.profiles?.name?.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div className="overflow-hidden">
                                                <Link href={`/user/${player.id}`}><h4 className="font-bold text-lg truncate text-foreground hover:text-primary transition-colors cursor-pointer">{player.profiles?.name}</h4></Link>
                                                
                                                {/* Demographics Display */}
                                                <div className="flex flex-wrap items-center gap-2 mt-1 text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
                                                    <span className={`px-2 py-0.5 rounded-sm ${player.stats.gender ? 'bg-white/10 text-foreground' : 'border border-dashed border-white/20'}`}>
                                                        {player.stats.gender || 'No Gender'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-sm ${player.stats.weight_kg ? 'bg-white/10 text-foreground' : 'border border-dashed border-white/20'}`}>
                                                        {player.stats.weight_kg ? `${player.stats.weight_kg}kg` : 'No Wt'}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-sm ${player.stats.age ? 'bg-white/10 text-foreground' : 'border border-dashed border-white/20'}`}>
                                                        {player.stats.age ? `Age ${player.stats.age}` : 'No Age'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <Button variant="secondary" size="sm" onClick={() => openEditModal(player)} className="h-8 text-xs bg-white/10 hover:bg-white/20">
                                                <Edit2 className="w-3 h-3 mr-1.5" /> Edit Stats
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer(player.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10" title="Release Player">
                                                <UserMinus className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </div>

                {/* INVITATION CENTER (RIGHT COL) */}
                <div className="space-y-6">
                    <GlassCard className="p-6">
                        <h2 className="text-xl font-bold mb-4 border-b border-white/10 pb-4">Invitation Center</h2>
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center"><Send className="w-5 h-5 mx-auto mb-1 text-muted-foreground opacity-50"/><p className="text-3xl font-black text-foreground">{inviteStats.total}</p><p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1 font-bold">Total Sent</p></div>
                            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center"><Clock className="w-5 h-5 mx-auto mb-1 text-yellow-500 opacity-70"/><p className="text-3xl font-black text-yellow-500">{inviteStats.pending}</p><p className="text-[10px] uppercase tracking-widest text-yellow-500/70 mt-1 font-bold">Pending</p></div>
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-center"><div className="flex items-center justify-center gap-1.5 mb-1 text-green-400"><CheckCircle2 className="w-4 h-4"/><span className="text-lg font-black">{inviteStats.accepted}</span></div><p className="text-[10px] uppercase tracking-widest text-green-400/70 font-bold">Accepted</p></div>
                            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-center"><div className="flex items-center justify-center gap-1.5 mb-1 text-red-400"><XCircle className="w-4 h-4"/><span className="text-lg font-black">{inviteStats.rejected}</span></div><p className="text-[10px] uppercase tracking-widest text-red-400/70 font-bold">Declined</p></div>
                        </div>

                        <div className="border-t border-white/10 pt-6">
                            <h3 className="text-xs uppercase tracking-widest text-muted-foreground font-bold mb-4">Awaiting Reply</h3>
                            {pendingInvites.length === 0 ? (
                                <div className="text-center py-6 opacity-50"><p className="text-sm text-muted-foreground">No active pending offers.</p></div>
                            ) : (
                                <div className="space-y-3">
                                    <AnimatePresence>
                                        {pendingInvites.map((invite) => (
                                            <motion.div key={invite.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }} className="p-3 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between group">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    <Avatar className="w-10 h-10 border border-white/10"><AvatarImage src={invite.profiles?.avatar_url} /><AvatarFallback className="bg-white/5 text-muted-foreground">{invite.profiles?.name?.charAt(0)}</AvatarFallback></Avatar>
                                                    <div className="overflow-hidden">
                                                        <Link href={`/user/${invite.player_id}`}><h4 className="font-bold text-sm truncate hover:text-primary transition-colors cursor-pointer">{invite.profiles?.name}</h4></Link>
                                                        <p className="text-[10px] text-yellow-500/70 font-bold uppercase tracking-wider flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</p>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleCancelInvite(invite.id)} className="h-8 w-8 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" title="Withdraw Offer"><X className="w-4 h-4" /></Button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                </div>

            </div>
        </div>
    );
}
'use client'

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Trophy, ChevronLeft, Swords, Clock, AlertCircle, Plus, Trash2, Layers, Settings, X, Calendar, UserPlus, ArrowRight, GitMerge, List, Save } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast } from '@/hooks/use-toast';

const INDIVIDUAL_SPORTS = ['tennis', 'badminton', 'karate', 'judo', 'wrestling'];

export default function BracketsPage() {
    const params = useParams();
    const router = useRouter();
    const tournamentId = params.id as string;
    const { toast } = useToast();

    const [tournament, setTournament] = useState<any>(null);
    const [participants, setParticipants] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // --- PRO BRACKET STATES ---
    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('Open Class');
    const [viewMode, setViewMode] = useState<'canvas' | 'list'>('canvas');
    
    // --- MODAL STATES ---
    const [assignSlot, setAssignSlot] = useState<{ matchId: string, slot: 'a' | 'b', roundNum: number, section: string, isInd: boolean } | null>(null);
    const [editMatchSettings, setEditMatchSettings] = useState<any>(null);
    const [addMatchModal, setAddMatchModal] = useState(false);
    const [newMatchSection, setNewMatchSection] = useState('Pool A');

    useEffect(() => {
        if (tournamentId) fetchData();
    }, [tournamentId]);

    const fetchData = async () => {
        setLoading(true);
        const { data: tData } = await supabase.from('tournaments').select('*').eq('id', tournamentId).single();
        if (tData) setTournament(tData);

        const isIndSport = INDIVIDUAL_SPORTS.includes(tData?.sport?.toLowerCase() || '');
        const combined: any[] = [];
        const uniqueCategories = new Set<string>();

        if (isIndSport) {
            const { data: rosterData } = await supabase.from('tournament_roster').select('*').eq('tournament_id', tournamentId).eq('status', 'approved');
            if (rosterData && rosterData.length > 0) {
                const playerIds = [...new Set(rosterData.map(r => r.player_id))];
                const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', playerIds);
                rosterData.forEach((r: any) => {
                    const profile = profiles?.find(p => p.id === r.player_id);
                    const catString = Object.values(r.selected_categories || {}).join(' / ') || 'Open Class';
                    uniqueCategories.add(catString);
                    combined.push({ id: r.player_id, name: profile?.name || 'Unknown Athlete', logo_url: profile?.avatar_url, category: catString, isIndividual: true });
                });
            }
        } else {
            const { data: teamData } = await supabase.from('teams').select('*').eq('tournament_id', tournamentId).eq('status', 'approved');
            if (teamData) {
                uniqueCategories.add('Open Class');
                teamData.forEach(t => combined.push({ id: t.id, name: t.name, logo_url: t.logo_url, category: 'Open Class', isIndividual: false }));
            }
        }

        setParticipants(combined);
        const catArray = Array.from(uniqueCategories);
        setCategories(catArray);
        if (catArray.length > 0 && !catArray.includes(selectedCategory)) setSelectedCategory(catArray[0]);

        await fetchMatches();
        setLoading(false);
    };

    const fetchMatches = async () => {
        const { data: matchData, error } = await supabase
            .from('matches')
            .select('*')
            .eq('tournament_id', tournamentId);
            
    
        if (error) {
            console.error('Error fetching matches:', error);
            return;
        }
    
        if (!matchData) return;
    
        // Fetch team data separately instead of relying on FK joins
        const teamIds = [
            ...new Set(
                matchData
                    .flatMap(m => [m.team_a_id, m.team_b_id])
                    .filter(Boolean)
            )
        ];
    
        let teamsMap = new Map();
    
        if (teamIds.length > 0) {
            const { data: teams } = await supabase
                .from('teams')
                .select('id, name, logo_url')
                .in('id', teamIds);
    
            teamsMap = new Map(
                (teams || []).map(team => [team.id, team])
            );
        }
    
        matchData.forEach(match => {
            match.team_a = match.team_a_id
                ? teamsMap.get(match.team_a_id) || null
                : null;
    
            match.team_b = match.team_b_id
                ? teamsMap.get(match.team_b_id) || null
                : null;
        });
    
        const isIndSport = INDIVIDUAL_SPORTS.includes(
            tournament?.sport?.toLowerCase() || ''
        );
    
        if (isIndSport) {
            const matchPlayerIds = new Set<string>();
    
            matchData.forEach(m => {
                if (m.player_a_id) matchPlayerIds.add(m.player_a_id);
                if (m.player_b_id) matchPlayerIds.add(m.player_b_id);
            });
    
            if (matchPlayerIds.size > 0) {
                const { data: matchProfiles } = await supabase
                    .from('profiles')
                    .select('id, name, avatar_url')
                    .in('id', Array.from(matchPlayerIds));
    
                matchData.forEach(m => {
                    const pA = matchProfiles?.find(
                        p => p.id === m.player_a_id
                    );
    
                    const pB = matchProfiles?.find(
                        p => p.id === m.player_b_id
                    );
    
                    m.player_a = pA
                        ? {
                              name: pA.name,
                              avatar_url: pA.avatar_url,
                          }
                        : null;
    
                    m.player_b = pB
                        ? {
                              name: pB.name,
                              avatar_url: pB.avatar_url,
                          }
                        : null;
                });
            }
        }
    
        setMatches(matchData);
    };

    const categoryParticipants = useMemo(() => participants.filter(p => p.category === selectedCategory), [participants, selectedCategory]);
    const categoryMatches = useMemo(() => matches.filter(m => m.category === selectedCategory), [matches, selectedCategory]);

    // --- MANUAL MATCH INJECTION ---
    const handleAddManualMatch = async () => {
        setSaving(true);
        const newMatch = {
            tournament_id: tournamentId,
            category: selectedCategory,
            section: newMatchSection,
            round_number: 1, 
            round_name: 'Round 1',
            status: 'scheduled'
        };

        const { error } = await supabase.from('matches').insert([newMatch]);
        setSaving(false);

        if (!error) {
            toast({ title: "Match Added", description: `Empty match added to ${newMatchSection}.` });
            setAddMatchModal(false);
            fetchMatches();
        } else {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    // --- PROGRESS ROUND ENGINE (WINNER LINKS) ---
    const handleNextRound = async (sectionName: string, currentRoundNum: number) => {
        setSaving(true);
        const sectionMatches = categoryMatches.filter(m => m.section === sectionName && m.round_number === currentRoundNum);
        if (sectionMatches.length === 0) return setSaving(false);

        const newMatches = [];
        const nextRoundNum = currentRoundNum + 1;
        const roundName = sectionMatches.length === 2 ? 'Finals' : sectionMatches.length === 4 ? 'Semi-Finals' : `Round ${nextRoundNum}`;

        for (let i = 0; i < sectionMatches.length; i += 2) {
            const m1 = sectionMatches[i];
            const m2 = sectionMatches[i + 1]; 

            newMatches.push({
                tournament_id: tournamentId,
                category: selectedCategory,
                section: sectionName,
                round_number: nextRoundNum,
                round_name: roundName,
                status: 'scheduled',
                prereq_match_a_id: m1.id,
                prereq_match_b_id: m2 ? m2.id : null,
                is_bye: !m2 
            });
        }

        const { error } = await supabase.from('matches').insert(newMatches);
        setSaving(false);
        if (!error) {
            toast({ title: "Round Generated", description: `Next round created and linked for ${sectionName}.` });
            fetchMatches();
        }
    };

    // --- CLICK TO ASSIGN LOGIC ---
    const handleAssignPlayer = async (entityId: string) => {
        if (!assignSlot) return;
        setSaving(true);

        const { matchId, slot, isInd } = assignSlot;
        const column = isInd ? (slot === 'a' ? 'player_a_id' : 'player_b_id') : (slot === 'a' ? 'team_a_id' : 'team_b_id');

        const { error } = await supabase.from('matches').update({ [column]: entityId }).eq('id', matchId);
        setSaving(false);

        if (!error) {
            toast({ title: "Slot Filled", description: "Participant assigned to match." });
            setAssignSlot(null);
            fetchMatches();
        } else {
            toast({ title: "Error", description: "Failed to assign participant.", variant: "destructive" });
        }
    };

    const handleClearSlot = async (matchId: string, slot: 'a' | 'b', isInd: boolean) => {
        setSaving(true);
        const column = isInd ? (slot === 'a' ? 'player_a_id' : 'player_b_id') : (slot === 'a' ? 'team_a_id' : 'team_b_id');
        await supabase.from('matches').update({ [column]: null }).eq('id', matchId);
        setSaving(false);
        fetchMatches();
    };

    const saveMatchSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editMatchSettings) return;
        setSaving(true);

        const formData = new FormData(e.target as HTMLFormElement);
        const updates = {
            start_date: formData.get('start_date'),
            start_time: formData.get('start_time') ? `1970-01-01T${formData.get('start_time')}:00Z` : null
        };

        await supabase.from('matches').update(updates).eq('id', editMatchSettings.id);
        setSaving(false);
        setEditMatchSettings(null);
        toast({ title: "Settings Saved", description: "Match details updated." });
        fetchMatches();
    };

    const deleteMatch = async (matchId: string) => {
        if (!confirm("Delete this matchup completely?")) return;
        await supabase.from('matches').delete().eq('id', matchId);
        setMatches(prev => prev.filter(m => m.id !== matchId));
        toast({ title: "Match Deleted", description: "Bracket updated." });
    };

    const getMatchNumber = (matchId: string) => {
        const index = categoryMatches.findIndex(m => m.id === matchId);
        return index !== -1 ? index + 1 : '?';
    };

    const getAvailableParticipants = () => {
        if (!assignSlot) return [];
        const usedIdsInRound = categoryMatches
            .filter(m => m.round_number === assignSlot.roundNum && m.section === assignSlot.section)
            .flatMap(m => [m.player_a_id, m.player_b_id, m.team_a_id, m.team_b_id])
            .filter(Boolean);
        return categoryParticipants.filter(p => !usedIdsInRound.includes(p.id));
    };

    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;

    const sections = Array.from(new Set(categoryMatches.map(m => m.section)));
    const isIndSport = INDIVIDUAL_SPORTS.includes(tournament?.sport?.toLowerCase() || '');

    // Card Renderer extracted to avoid massive code duplication
    const renderMatchCard = (rawMatch: any, roundNum: string, section: string, hasNextRound: boolean = false) => {
        const isInd = isIndSport;
        const a_id = isInd ? rawMatch.player_a_id : rawMatch.team_a_id;
        const b_id = isInd ? rawMatch.player_b_id : rawMatch.team_b_id;
        const a_name = rawMatch.player_a?.name || rawMatch.team_a?.name;
        const b_name = rawMatch.player_b?.name || rawMatch.team_b?.name;
        const a_logo = rawMatch.player_a?.avatar_url || rawMatch.team_a?.logo_url;
        const b_logo = rawMatch.player_b?.avatar_url || rawMatch.team_b?.logo_url;
        
        const matchNumber = getMatchNumber(rawMatch.id);

        return (
            <div key={rawMatch.id} className="relative group">
                {/* Visual Canvas Connecting Lines */}
                {viewMode === 'canvas' && hasNextRound && (
                    <div className="absolute top-1/2 -right-12 w-12 h-[2px] bg-white/10 -translate-y-1/2 pointer-events-none group-hover:bg-primary/50 transition-colors" />
                )}

                <GlassCard className={`p-0 overflow-hidden border-white/10 hover:border-white/20 transition-all flex flex-col shadow-lg relative z-10 bg-[#0a0a0a] ${viewMode === 'canvas' ? 'w-[320px]' : ''}`}>
                    
                    {/* MATCH HEADER */}
                    <div className="flex justify-between items-center p-3 bg-white/5 border-b border-white/5">
                        <div className="flex items-center gap-3">
                            <span className="bg-white/10 text-[10px] font-mono px-2 py-0.5 rounded font-bold text-muted-foreground">M-{matchNumber}</span>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3.5 h-3.5" />
                                {rawMatch.start_date || 'TBA'}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => setEditMatchSettings(rawMatch)} className="text-muted-foreground hover:text-primary transition-colors p-1" title="Match Settings"><Settings className="w-4 h-4"/></button>
                            <button onClick={() => deleteMatch(rawMatch.id)} className="text-muted-foreground hover:text-red-400 transition-colors p-1" title="Delete Match"><Trash2 className="w-4 h-4"/></button>
                        </div>
                    </div>

                    {/* MATCH SLOTS */}
                    <div className="flex flex-col flex-1">
                        
                        {/* SLOT A */}
                        <div 
                            onClick={() => setAssignSlot({ matchId: rawMatch.id, slot: 'a', roundNum: parseInt(roundNum), section, isInd })}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors border-b border-white/5 ${a_id ? 'bg-transparent hover:bg-red-500/5' : rawMatch.prereq_match_a_id ? 'bg-primary/5 hover:bg-primary/10' : 'bg-black/40 hover:bg-white/5 border-dashed'}`}
                        >
                            {a_id ? (
                                <>
                                    <Avatar className="w-10 h-10 border border-white/20"><AvatarImage src={a_logo} /><AvatarFallback className="bg-primary/20 text-primary text-xs">{a_name?.charAt(0)}</AvatarFallback></Avatar>
                                    <span className="font-bold truncate text-base">{a_name}</span>
                                </>
                            ) : rawMatch.prereq_match_a_id ? (
                                <>
                                    <Trophy className="w-6 h-6 text-primary/50 shrink-0" />
                                    <span className="font-bold text-primary/70 text-sm truncate">Winner of Match {getMatchNumber(rawMatch.prereq_match_a_id)}</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-6 h-6 text-muted-foreground shrink-0 opacity-50" />
                                    <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest opacity-50">Tap to Assign (TBA)</span>
                                </>
                            )}
                        </div>

                        {/* SLOT B */}
                        <div 
                            onClick={() => !rawMatch.is_bye && setAssignSlot({ matchId: rawMatch.id, slot: 'b', roundNum: parseInt(roundNum), section, isInd })}
                            className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${rawMatch.is_bye ? 'bg-primary/5 opacity-80 cursor-default' : b_id ? 'bg-transparent hover:bg-blue-500/5' : rawMatch.prereq_match_b_id ? 'bg-primary/5 hover:bg-primary/10' : 'bg-black/40 hover:bg-white/5 border-dashed border-t'}`}
                        >
                            {rawMatch.is_bye ? (
                                <>
                                    <Clock className="w-6 h-6 text-primary/50 shrink-0" />
                                    <span className="font-bold text-primary/70 text-sm tracking-widest uppercase italic">BYE (Advances)</span>
                                </>
                            ) : b_id ? (
                                <>
                                    <Avatar className="w-10 h-10 border border-white/20"><AvatarImage src={b_logo} /><AvatarFallback className="bg-primary/20 text-primary text-xs">{b_name?.charAt(0)}</AvatarFallback></Avatar>
                                    <span className="font-bold truncate text-base">{b_name}</span>
                                </>
                            ) : rawMatch.prereq_match_b_id ? (
                                <>
                                    <Trophy className="w-6 h-6 text-primary/50 shrink-0" />
                                    <span className="font-bold text-primary/70 text-sm truncate">Winner of Match {getMatchNumber(rawMatch.prereq_match_b_id)}</span>
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-6 h-6 text-muted-foreground shrink-0 opacity-50" />
                                    <span className="font-bold text-muted-foreground text-sm uppercase tracking-widest opacity-50">Tap to Assign (TBA)</span>
                                </>
                            )}
                        </div>
                    </div>
                    
                    {/* MATCH SCORE ROUTER */}
                    <div className="p-3 bg-black/40 border-t border-white/5">
                        <Button size="sm" className="w-full text-xs font-bold" onClick={() => router.push(`/organizer/match/${rawMatch.id}`)}>
                            Manage Scoring
                        </Button>
                    </div>
                </GlassCard>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-screen-2xl mx-auto p-4 sm:p-8">
                
                {/* --- MODALS --- */}
                <AnimatePresence>
                    {addMatchModal && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md">
                                <GlassCard className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Plus className="w-5 h-5 text-primary"/> Add Match</h2>
                                        <Button variant="ghost" size="icon" onClick={() => setAddMatchModal(false)}><X className="w-4 h-4"/></Button>
                                    </div>
                                    <div className="space-y-4 mb-6">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Which Pool / Section?</Label>
                                            <Input value={newMatchSection} onChange={e => setNewMatchSection(e.target.value)} className="bg-black/40 h-12" placeholder="e.g. Pool A" />
                                        </div>
                                        <p className="text-xs text-muted-foreground">A TBA vs TBA match will be injected into Round 1 of this pool. You can assign participants afterward.</p>
                                    </div>
                                    <Button className="w-full h-12 font-bold" onClick={handleAddManualMatch} disabled={saving}>
                                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Swords className="w-4 h-4 mr-2"/>} Create Match
                                    </Button>
                                </GlassCard>
                            </motion.div>
                        </motion.div>
                    )}

                    {editMatchSettings && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md">
                                <GlassCard className="p-6">
                                    <div className="flex justify-between items-center mb-6">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><Settings className="w-5 h-5 text-primary"/> Match Settings</h2>
                                        <Button variant="ghost" size="icon" onClick={() => setEditMatchSettings(null)}><X className="w-4 h-4"/></Button>
                                    </div>
                                    <form onSubmit={saveMatchSettings} className="space-y-4 mb-6">
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Match Date</Label>
                                            <Input name="start_date" type="date" defaultValue={editMatchSettings.start_date || ''} min={tournament.start_date} max={tournament.end_date} className="bg-black/40 h-12" />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground">Match Time (Local)</Label>
                                            <Input name="start_time" type="time" defaultValue={editMatchSettings.start_time ? new Date(editMatchSettings.start_time).toISOString().substring(11, 16) : ''} className="bg-black/40 h-12" />
                                        </div>
                                        <Button type="submit" className="w-full h-12 font-bold mt-4" disabled={saving}>
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2"/>} Save Settings
                                        </Button>
                                    </form>
                                </GlassCard>
                            </motion.div>
                        </motion.div>
                    )}

                    {assignSlot && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="w-full max-w-md">
                                <GlassCard className="p-6 max-h-[80vh] flex flex-col">
                                    <div className="flex justify-between items-center mb-4 shrink-0">
                                        <h2 className="text-xl font-bold flex items-center gap-2"><UserPlus className="w-5 h-5 text-primary"/> Assign Participant</h2>
                                        <Button variant="ghost" size="icon" onClick={() => setAssignSlot(null)}><X className="w-4 h-4"/></Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-4 shrink-0">Athletes already booked in Round {assignSlot.roundNum} of this pool are hidden to prevent double-booking.</p>
                                    
                                    <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {getAvailableParticipants().map((p: any) => (
                                            <div key={p.id} onClick={() => handleAssignPlayer(p.id)} className="flex items-center gap-3 p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-primary/50 cursor-pointer transition-all">
                                                <Avatar className="w-10 h-10 border border-white/20"><AvatarImage src={p.logo_url}/><AvatarFallback className="bg-primary/20 text-primary font-bold">{p.name.charAt(0)}</AvatarFallback></Avatar>
                                                <span className="font-bold">{p.name}</span>
                                            </div>
                                        ))}
                                        {getAvailableParticipants().length === 0 && (
                                            <div className="text-center py-8 text-muted-foreground italic text-sm">No free participants left in this category.</div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-6 pt-4 border-t border-white/10 shrink-0">
                                        <Button variant="destructive" className="w-full bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/30" onClick={() => { handleClearSlot(assignSlot.matchId, assignSlot.slot, assignSlot.isInd); setAssignSlot(null); }}>
                                            Clear Slot / Reset to TBA
                                        </Button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b border-white/10 pb-6">
                    <div>
                        <Button variant="ghost" onClick={() => router.push(`/organizer/manage-tournament/${tournamentId}`)} className="mb-2 -ml-4 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Manage Details
                        </Button>
                        <h1 className="text-4xl font-extrabold font-headline tracking-tight">{tournament?.name} <span className="text-primary">Command Desk</span></h1>
                        <p className="text-muted-foreground mt-1">Manual match builder. Inject matches, assign athletes, and progress rounds.</p>
                    </div>
                </div>

                {/* CONTROLS & VIEWS */}
                <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/10">
                        <Layers className="w-5 h-5 ml-2 text-primary" />
                        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                            <SelectTrigger className="w-[250px] border-none bg-transparent shadow-none font-bold text-lg focus:ring-0">
                                <SelectValue placeholder="Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                {categories.length === 0 && <SelectItem value="Open Class">Open Class</SelectItem>}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* View Toggle */}
                        <div className="flex items-center bg-white/5 rounded-xl border border-white/10 p-1">
                            <Button variant={viewMode === 'canvas' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('canvas')} className="rounded-lg">
                                <GitMerge className="w-4 h-4 mr-2" /> Canvas
                            </Button>
                            <Button variant={viewMode === 'list' ? 'default' : 'ghost'} size="sm" onClick={() => setViewMode('list')} className="rounded-lg">
                                <List className="w-4 h-4 mr-2" /> List
                            </Button>
                        </div>
                        
                        <Button onClick={() => setAddMatchModal(true)} className="shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]">
                            <Plus className="w-4 h-4 mr-2" /> Add Match
                        </Button>
                    </div>
                </div>

                {categoryMatches.length === 0 ? (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                        <GlassCard className="p-16 text-center border-primary/30 border-dashed">
                            <Swords className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-4" />
                            <h2 className="text-2xl font-bold mb-2">Bracket Empty</h2>
                            <p className="text-muted-foreground mb-6 max-w-md mx-auto">There are no matches for {selectedCategory}. Start building the bracket manually.</p>
                            <Button size="lg" onClick={() => setAddMatchModal(true)}><Plus className="w-5 h-5 mr-2" /> Inject First Match</Button>
                        </GlassCard>
                    </motion.div>
                ) : (
                    <div className="space-y-16">
                        {sections.map((section: any) => {
                            const sectionMatches = categoryMatches.filter(m => m.section === section);
                            const matchesByRound = sectionMatches.reduce((acc: any, match: any) => {
                                if (!acc[match.round_number]) acc[match.round_number] = [];
                                acc[match.round_number].push(match);
                                return acc;
                            }, {});
                            
                            const roundNumbers = Object.keys(matchesByRound).sort((a,b) => parseInt(a) - parseInt(b));
                            const highestRound = parseInt(roundNumbers[roundNumbers.length - 1]);

                            return (
                                <div key={section} className="bg-black/20 p-4 sm:p-8 rounded-3xl border border-white/5 relative">
                                    <h2 className="text-3xl font-black mb-8 border-b border-white/10 pb-4 text-primary tracking-widest uppercase flex items-center justify-between">
                                        {section}
                                        <Button variant="outline" size="sm" onClick={() => handleNextRound(section, highestRound)} disabled={saving} className="bg-white/5 border-white/20 hover:bg-primary/20 hover:border-primary/50 hover:text-primary transition-all">
                                            Proceed to Next Round <ArrowRight className="w-4 h-4 ml-2" />
                                        </Button>
                                    </h2>
                                    
                                    {/* --- CANVAS VIEW --- */}
                                    {viewMode === 'canvas' && (
                                        <div className="overflow-x-auto pb-8 custom-scrollbar">
                                            <div className="flex flex-row gap-16 min-w-max">
                                                {roundNumbers.map((roundNum, index) => {
                                                    const roundMatches = matchesByRound[roundNum];
                                                    const hasNextRound = index < roundNumbers.length - 1;
                                                    return (
                                                        <div key={roundNum} className="flex flex-col justify-around gap-8 relative min-w-[320px]">
                                                            <div className="text-center mb-4">
                                                                <h3 className="font-bold uppercase tracking-widest text-muted-foreground">{roundMatches[0].round_name || `Round ${roundNum}`}</h3>
                                                            </div>
                                                            <div className="flex flex-col justify-around h-full gap-8">
                                                                {roundMatches.map((rawMatch: any) => renderMatchCard(rawMatch, roundNum, section, hasNextRound))}
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}

                                    {/* --- LIST VIEW --- */}
                                    {viewMode === 'list' && (
                                        <div className="space-y-12">
                                            {roundNumbers.map((roundNum) => {
                                                const roundMatches = matchesByRound[roundNum];
                                                return (
                                                    <div key={roundNum}>
                                                        <h3 className="text-xl font-bold font-headline mb-4 flex items-center gap-3 text-muted-foreground">
                                                            <span className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-xs">{roundNum}</span>
                                                            {roundMatches[0].round_name || `Round ${roundNum}`}
                                                        </h3>
                                                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                                            {roundMatches.map((rawMatch: any) => renderMatchCard(rawMatch, roundNum, section, false))}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
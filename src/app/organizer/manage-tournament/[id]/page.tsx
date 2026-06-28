'use client'

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import GlassButton from '@/components/glass/GlassButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ChevronLeft, Loader2, Edit, Users, ShieldCheck, Trophy, Settings, Clock, ArrowRight, Save, Calendar, MapPin, UserPlus, X, CheckCircle2, AlertCircle, AlertTriangle, Plus, Trash2, Layers, UserX, Lock, CheckCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const INDIVIDUAL_SPORTS = ['tennis', 'badminton', 'karate', 'judo', 'wrestling'];

const ManageTournamentPage = () => {
    const router = useRouter();
    const params = useParams();
    const tournamentId = params.id as string;

    const [tournament, setTournament] = useState<any>(null);
    const [initialTournament, setInitialTournament] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    
    const [activeTab, setActiveTab] = useState('details');
    
    // Data States
    const [participants, setParticipants] = useState<any[]>([]);
    const [matches, setMatches] = useState<any[]>([]);
    const [matrixRoster, setMatrixRoster] = useState<any[]>([]);
    
    // Invite System States
    const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
    const [pendingInvites, setPendingInvites] = useState<string[]>([]);
    const [showInviteSection, setShowInviteSection] = useState(false);
    const [invitingCoachId, setInvitingCoachId] = useState<string | null>(null);

    // Dynamic Category Builder Input States
    const [categoryInputVals, setCategoryInputVals] = useState<Record<string, string>>({});

    // Loading States
    const [matchLoading, setMatchLoading] = useState(false);
    const [participantLoading, setParticipantLoading] = useState(false);
    const [matrixLoading, setMatrixLoading] = useState(false);

    // --- CUSTOM UI STATES ---
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [itemToRemove, setItemToRemove] = useState<{ id: string; coachId?: string; type: string, name: string } | null>(null);
    
    // --- REJECTION ENGINE STATES ---
    const [rejectingRosterItem, setRejectingRosterItem] = useState<any>(null);
    const [rejectionNote, setRejectionNote] = useState("");

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const fetchTournament = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('tournaments')
            .select('*')
            .eq('id', tournamentId)
            .single();

        if (data) {
            setTournament(data);
            setInitialTournament(data);
        } else {
            console.error("Error fetching tournament:", error);
        }
        setLoading(false);
    }, [tournamentId]);

    // --- UPGRADED PARTICIPANT FETCH (STRICTLY APPROVED ONLY) ---
    // --- UPGRADED PARTICIPANT FETCH (SMART SORTING FOR INDIVIDUAL VS TEAM SPORTS) ---
    // --- UPGRADED PARTICIPANT FETCH (SMART SORTING & BULLETPROOF PROFILE FETCH) ---
    const fetchParticipants = useCallback(async () => {
        setParticipantLoading(true);
        
        const { data: tData } = await supabase.from('tournaments').select('sport').eq('id', tournamentId).single();
        const isIndSport = INDIVIDUAL_SPORTS.includes(tData?.sport?.toLowerCase() || '');

        const combined = [];

        if (isIndSport) {
            // FOR INDIVIDUAL SPORTS: Fetch all active roster entries
            const { data: rosterData, error: rosterErr } = await supabase
                .from('tournament_roster')
                .select('*')
                .eq('tournament_id', tournamentId)
                .in('status', ['registered', 'approved']); // Show them even before Approve All is clicked!

            if (rosterErr) console.error("Roster fetch error:", rosterErr);

            if (rosterData && rosterData.length > 0) {
                // Bulletproof: Fetch profiles manually to avoid silent FK failures
                const playerIds = [...new Set(rosterData.map(r => r.player_id))];
                const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', playerIds);

                combined.push(...rosterData.map((r: any) => {
                    const profile = profiles?.find(p => p.id === r.player_id);
                    return {
                        id: r.id, 
                        coach_id: r.coach_id,
                        player_id: r.player_id,
                        name: profile?.name || 'Unknown Athlete',
                        logo_url: profile?.avatar_url,
                        status: r.status,
                        type: 'individual'
                    };
                }));
            }
        } else {
            // FOR TEAM SPORTS: Fetch Approved Teams
            const { data: teamData } = await supabase
                .from('teams')
                .select(`id, coach_id, name, logo_url, status`)
                .eq('tournament_id', tournamentId)
                .eq('status', 'approved');

            if (teamData) combined.push(...teamData.map(t => ({ ...t, type: 'team' })));

            // Fetch Independent Free Agents
            const { data: indData } = await supabase
                .from('tournament_roster')
                .select('*')
                .eq('tournament_id', tournamentId)
                .is('team_id', null)
                .is('coach_id', null)
                .in('status', ['registered', 'approved']);

            if (indData && indData.length > 0) {
                const playerIds = [...new Set(indData.map(r => r.player_id))];
                const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', playerIds);

                combined.push(...indData.map((r: any) => {
                    const profile = profiles?.find(p => p.id === r.player_id);
                    return {
                        id: r.id, 
                        coach_id: null,
                        player_id: r.player_id,
                        name: profile?.name || 'Unknown Athlete',
                        logo_url: profile?.avatar_url,
                        status: r.status,
                        type: 'individual'
                    };
                }));
            }
        }

        setParticipants(combined);
        setParticipantLoading(false);
    }, [tournamentId]);

    const fetchMatches = useCallback(async () => {
        setMatchLoading(true);
        const { data } = await supabase
            .from('match_details')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: true });

        if (data) setMatches(data);
        setMatchLoading(false);
    }, [tournamentId]);

    const fetchMatrixRoster = useCallback(async () => {
        setMatrixLoading(true);
        const { data, error } = await supabase
            .from('tournament_roster')
            .select('*')
            .eq('tournament_id', tournamentId)
            .neq('status', 'withdrawn');

        if (error) {
            console.error("Matrix Roster Fetch Error:", error);
            setMatrixLoading(false);
            return;
        }

        if (data && data.length > 0) {
            const playerIds = [...new Set(data.map(r => r.player_id))];
            const coachIds = [...new Set(data.map(r => r.coach_id).filter(Boolean))];
            
            const { data: profiles } = await supabase.from('profiles').select('id, name, avatar_url').in('id', playerIds);
            
            let coachProfiles: any[] = [];
            if (coachIds.length > 0) {
                const { data: cp } = await supabase.from('profiles').select('id, name').in('id', coachIds);
                coachProfiles = cp || [];
            }

            const enriched = data.map(r => ({
                ...r,
                profiles: profiles?.find(p => p.id === r.player_id) || { name: 'Unknown Athlete' },
                coach_name: coachProfiles.find(c => c.id === r.coach_id)?.name || 'Independent Entry'
            }));
            
            setMatrixRoster(enriched);
        } else {
            setMatrixRoster([]);
        }
        setMatrixLoading(false);
    }, [tournamentId]);

    const fetchCoachesAndInvites = useCallback(async () => {
        if (!tournament?.sport) return;
        const { data: coaches } = await supabase
            .from('coaches')
            .select('id, team_name, team_logo, profiles!inner(name, city)')
            .ilike('sport', tournament.sport);
            
        if (coaches) setAvailableCoaches(coaches);

        const { data: invites } = await supabase
            .from('tournament_invitations')
            .select('coach_id')
            .eq('tournament_id', tournamentId)
            .eq('status', 'pending');
            
        if (invites) setPendingInvites(invites.map(i => i.coach_id));
    }, [tournament?.sport, tournamentId]);

    useEffect(() => {
        if (tournamentId) {
            fetchTournament();
            fetchParticipants();
            fetchMatches();
        }
    }, [tournamentId, fetchTournament, fetchParticipants, fetchMatches]);

    useEffect(() => {
        if (activeTab === 'participants' && tournament?.sport) fetchCoachesAndInvites();
        if (activeTab === 'matrix') fetchMatrixRoster();
    }, [activeTab, tournament?.sport, fetchCoachesAndInvites, fetchMatrixRoster]);

    // --- TOURNAMENT SETTINGS LOGIC ---
    const handleDetailChange = (field: string, value: any) => setTournament((prev: any) => ({ ...prev, [field]: value }));
    const handleRuleChange = (field: string, value: any) => setTournament((prev: any) => ({ ...prev, rules: { ...prev.rules, [field]: value } }));

    const getCategories = () => tournament?.rules?.registration_categories || [];
    const updateCategories = (newCategories: any[]) => setTournament((prev: any) => ({ ...prev, rules: { ...prev.rules, registration_categories: newCategories } }));
    const handleAddCategory = () => updateCategories([...getCategories(), { id: Math.random().toString(36).substring(7), name: '', options: [] }]);
    const handleCategoryNameChange = (id: string, name: string) => updateCategories(getCategories().map((c: any) => c.id === id ? { ...c, name } : c));
    const handleRemoveCategory = (id: string) => {
        updateCategories(getCategories().filter((c: any) => c.id !== id));
        setCategoryInputVals(prev => { const next = { ...prev }; delete next[id]; return next; });
    };
    const handleAddCategoryOption = (id: string) => {
        const val = categoryInputVals[id]?.trim();
        if (!val) return;
        updateCategories(getCategories().map((c: any) => c.id === id ? { ...c, options: [...(c.options || []), val] } : c));
        setCategoryInputVals(prev => ({ ...prev, [id]: '' }));
    };
    const handleRemoveCategoryOption = (id: string, optIndex: number) => updateCategories(getCategories().map((c: any) => c.id === id ? { ...c, options: c.options.filter((_: any, idx: number) => idx !== optIndex) } : c));

    const saveChanges = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('tournaments')
            .update({
                name: tournament.name, location: tournament.location,
                start_date: tournament.start_date, end_date: tournament.end_date,
                max_teams: tournament.max_teams, registration_mode: tournament.registration_mode,
                additional_rules: tournament.additional_rules, prize_pool: tournament.prize_pool,
                rules: tournament.rules 
            })
            .eq('id', tournamentId);

        setSaving(false);
        if (!error) {
            setInitialTournament(tournament);
            showToast("Changes saved successfully!", "success");
        } else {
            showToast(`Error saving: ${error.message}`, "error");
        }
    };

    // --- UPGRADED REMOVAL ENGINE (Handles both Teams & Individuals) ---
    const promptRemoveParticipant = (id: string, coachId: string | undefined, type: string, name: string) => {
        setItemToRemove({ id, coachId, type, name });
    };

    const executeRemoveParticipant = async () => {
        if (!itemToRemove) return;
        const { id, coachId, type } = itemToRemove;

        if (type === 'team') {
            await supabase.from('teams').delete().eq('id', id);
            if (coachId) {
                await supabase.from('tournament_invitations').update({ status: 'rejected' }).eq('tournament_id', tournamentId).eq('coach_id', coachId);
            }
            showToast("Team removed.", "success");
        } else {
            await supabase.from('tournament_roster').delete().eq('id', id);
            showToast("Player removed.", "success");
            fetchMatrixRoster(); 
        }
        
        setParticipants(prev => prev.filter(p => p.id !== id));
        setItemToRemove(null);
    };

    const handleSendInvite = async (coachId: string) => {
        const limit = tournament.max_teams || 0;
        if (limit > 0 && participants.length + pendingInvites.length >= limit) return showToast("You have reached the maximum number of teams.", "error");
        setInvitingCoachId(coachId);
        try {
            const { data: existingInvite } = await supabase.from('tournament_invitations').select('id').eq('tournament_id', tournamentId).eq('coach_id', coachId).maybeSingle();
            let inviteId = existingInvite?.id;
            if (existingInvite) {
                const { error: updErr } = await supabase.from('tournament_invitations').update({ status: 'pending' }).eq('id', existingInvite.id);
                if (updErr) throw updErr;
            } else {
                const { error: insErr } = await supabase.from('tournament_invitations').insert({ tournament_id: tournamentId, organizer_id: tournament.organizer_id, coach_id: coachId, status: 'pending' });
                if (insErr) throw insErr;
                const { data: newInv } = await supabase.from('tournament_invitations').select('id').eq('tournament_id', tournamentId).eq('coach_id', coachId).maybeSingle();
                if (newInv) inviteId = newInv.id;
            }
            await supabase.from('notifications').insert({
                user_id: coachId, type: 'tournament_invite',
                message: `You have been invited to participate in ${tournament.name}!`,
                metadata: { tournament_invite_id: inviteId, tournament_name: tournament.name, organizer_id: tournament.organizer_id }
            });
            setPendingInvites(prev => [...prev, coachId]);
            showToast("Invite sent successfully!", "success");
        } catch (error) {
            console.error("Invite Database Error:", error);
            showToast("Action blocked by database security. Check RLS policies.", "error");
        } finally {
            setInvitingCoachId(null);
        }
    };

    // --- REJECTION ENGINE ---
    const executeRejection = async () => {
        if (!rejectionNote.trim()) return showToast("A rejection note is mandatory.", "error");
        if (!rejectingRosterItem) return;

        setSaving(true);
        const { error } = await supabase
            .from('tournament_roster')
            .update({ status: 'rejected', rejection_note: rejectionNote })
            .eq('id', rejectingRosterItem.id);

        if (!error) {
            const notifications = [
                {
                    user_id: rejectingRosterItem.player_id,
                    type: 'system',
                    message: `Registration Rejected (${tournament.name}): ${rejectionNote}`
                }
            ];

            if (rejectingRosterItem.coach_id) {
                notifications.push({
                    user_id: rejectingRosterItem.coach_id,
                    type: 'system',
                    message: `Roster Rejected (${rejectingRosterItem.profiles.name}): ${rejectionNote}`
                });
            }

            await supabase.from('notifications').insert(notifications);

            showToast("Athlete entry rejected and notified.", "success");
            setRejectingRosterItem(null);
            setRejectionNote("");
            fetchMatrixRoster(); 
        } else {
            showToast(`Rejection failed: ${error.message}`, "error");
        }
        setSaving(false);
    };

    // --- NEW: APPROVE ALL ENGINE ---
    const handleApproveAll = async () => {
        if (!confirm("Are you sure you want to approve all registered entries? This will lock them in for brackets.")) return;
        
        setSaving(true);
        
        // Approve all 'registered' entries in the roster
        const { error: rosterError } = await supabase
            .from('tournament_roster')
            .update({ status: 'approved' })
            .eq('tournament_id', tournamentId)
            .eq('status', 'registered');

        // Approve any pending teams just in case
        const { error: teamError } = await supabase
            .from('teams')
            .update({ status: 'approved' })
            .eq('tournament_id', tournamentId)
            .eq('status', 'pending');

        if (!rosterError && !teamError) {
            showToast("All eligible entries have been officially approved!", "success");
            fetchMatrixRoster();
            fetchParticipants();
        } else {
            showToast("Failed to approve entries.", "error");
        }
        setSaving(false);
    };

    // --- RENDER BLOCKERS ---
    if (loading) return <DashboardLayout><div className="flex justify-center items-center h-screen"><Loader2 className="w-12 h-12 animate-spin text-primary" /></div></DashboardLayout>;
    if (!tournament) return <DashboardLayout><div className="flex justify-center items-center h-screen text-xl font-bold">Tournament not found.</div></DashboardLayout>;

    // Logical Status Configurations
    const maxTeamsDisplay = tournament.max_teams > 0 ? tournament.max_teams : '∞';
    const hasChanges = JSON.stringify(tournament) !== JSON.stringify(initialTournament);
    const isDeadlinePassed = tournament.registration_deadline && new Date(tournament.registration_deadline).getTime() < new Date().getTime();
    
    const isIndividualSport = INDIVIDUAL_SPORTS.includes(tournament.sport?.toLowerCase());
    const participantLabel = isIndividualSport ? 'Players' : 'Teams';

    const groupedMatrix = matrixRoster.reduce((acc, roster) => {
        const catString = Object.values(roster.selected_categories || {}).join(' / ') || 'Open Class';
        if (!acc[catString]) acc[catString] = [];
        acc[catString].push(roster);
        return acc;
    }, {} as Record<string, any[]>);

    const renderSportRules = () => {
        const sport = tournament.sport?.toLowerCase();
        
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                {sport === 'cricket' && (
                    <>
                        <div className="space-y-2"><Label>Overs</Label><Input type="number" className="bg-white/5" value={tournament.rules?.overs || ''} onChange={(e) => handleRuleChange('overs', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Squad Size</Label><Input type="number" className="bg-white/5" value={tournament.rules?.squad_size || ''} onChange={(e) => handleRuleChange('squad_size', e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Ball Type</Label>
                            <Select onValueChange={v => handleRuleChange('ball_type', v)} value={tournament.rules?.ball_type || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Ball Type" /></SelectTrigger>
                                <SelectContent><SelectItem value="Tennis">Tennis Ball</SelectItem><SelectItem value="Leather">Leather Ball</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Pitch Type</Label>
                            <Select onValueChange={v => handleRuleChange('pitch_type', v)} value={tournament.rules?.pitch_type || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Pitch Type" /></SelectTrigger>
                                <SelectContent><SelectItem value="Turf">Turf</SelectItem><SelectItem value="Matting">Matting</SelectItem><SelectItem value="Cement">Cement</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </>
                )}
                {sport === 'football' && (
                    <>
                        <div className="space-y-2"><Label>Half Duration (mins)</Label><Input type="number" className="bg-white/5" value={tournament.rules?.half_duration || ''} onChange={(e) => handleRuleChange('half_duration', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Max Substitutions</Label><Input type="number" className="bg-white/5" value={tournament.rules?.subs || ''} onChange={(e) => handleRuleChange('subs', e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Match Format</Label>
                            <Select onValueChange={v => handleRuleChange('match_type', v)} value={tournament.rules?.match_type || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Format" /></SelectTrigger>
                                <SelectContent><SelectItem value="5v5">5-a-side</SelectItem><SelectItem value="7v7">7-a-side</SelectItem><SelectItem value="11v11">11-a-side</SelectItem></SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Offside Rule</Label>
                            <Select onValueChange={v => handleRuleChange('offside', v)} value={tournament.rules?.offside || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Offside" /></SelectTrigger>
                                <SelectContent><SelectItem value="Yes">Enforced</SelectItem><SelectItem value="No">Not Enforced</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </>
                )}
                {sport === 'badminton' && (
                    <>
                        <div className="space-y-2"><Label>Points per Game</Label><Input type="number" className="bg-white/5" value={tournament.rules?.points || ''} onChange={(e) => handleRuleChange('points', e.target.value)} /></div>
                        <div className="space-y-2"><Label>Best of (Sets)</Label><Input type="number" className="bg-white/5" value={tournament.rules?.best_of || ''} onChange={(e) => handleRuleChange('best_of', e.target.value)} /></div>
                        <div className="space-y-2">
                            <Label>Match Format</Label>
                            <Select onValueChange={v => handleRuleChange('match_format', v)} value={tournament.rules?.match_format || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Format" /></SelectTrigger>
                                <SelectContent><SelectItem value="Singles">Singles Only</SelectItem><SelectItem value="Doubles">Doubles Only</SelectItem><SelectItem value="Team Event">Team Event</SelectItem></SelectContent>
                            </Select>
                        </div>
                    </>
                )}
                {sport === 'karate' && (
                    <>
                        <div className="space-y-2">
                            <Label>Competition Category</Label>
                            <Select onValueChange={v => handleRuleChange('competition_type', v)} value={tournament.rules?.competition_type || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Category" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kumite">Kumite (Sparring Only)</SelectItem>
                                    <SelectItem value="Kata">Kata (Forms Only)</SelectItem>
                                    <SelectItem value="Kata + Kumite">Kata + Kumite (Both)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Match Duration (Mins)</Label>
                            <Input type="number" className="bg-white/5" value={tournament.rules?.match_duration || ''} onChange={(e) => handleRuleChange('match_duration', e.target.value)} />
                        </div>
                    </>
                )}
                {sport === 'judo' && (
                    <>
                        <div className="space-y-2">
                            <Label>Golden Score Rules</Label>
                            <Select onValueChange={v => handleRuleChange('golden_score', v)} value={tournament.rules?.golden_score || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Golden Score Rules" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Unlimited">Unlimited Time</SelectItem>
                                    <SelectItem value="Time Limit">Time Limit Applied</SelectItem>
                                    <SelectItem value="None">No Golden Score (Draws allowed)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Standard Match Time (Mins)</Label>
                            <Input type="number" className="bg-white/5" value={tournament.rules?.match_duration || ''} onChange={(e) => handleRuleChange('match_duration', e.target.value)} />
                        </div>
                        <div className="space-y-2 col-span-full">
                            <Label>Allowed Grades</Label>
                            <Select onValueChange={v => handleRuleChange('allowed_grades', v)} value={tournament.rules?.allowed_grades || ''}>
                                <SelectTrigger className="bg-white/5"><SelectValue placeholder="Allowed Grades" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Kyu Only">Kyu Grades Only</SelectItem>
                                    <SelectItem value="Dan Only">Dan Grades Only</SelectItem>
                                    <SelectItem value="Open">Open to All Grades</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                )}
                
                <div className="col-span-full space-y-2">
                    <Label>Additional Rules / Notes</Label>
                    <Textarea className="bg-white/5 min-h-[100px]" value={tournament.additional_rules || ''} onChange={(e) => handleDetailChange('additional_rules', e.target.value)} />
                </div>
            </div>
        );
    };

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto p-4 sm:p-8">
                
                {/* TOASTS & MODALS */}
                <AnimatePresence>
                    {toast && (
                        <motion.div initial={{ opacity: 0, y: 50, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 50, scale: 0.9 }} className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-2xl font-bold flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
                            {toast.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                            {toast.message}
                        </motion.div>
                    )}

                    {itemToRemove && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                                <GlassCard className="p-8 max-w-md w-full border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full bg-red-500/5 blur-[80px] pointer-events-none" />
                                    <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4 relative z-10" />
                                    <h2 className="text-2xl font-bold mb-2 relative z-10">Remove {itemToRemove.type === 'team' ? 'Team' : 'Player'}?</h2>
                                    <p className="text-muted-foreground mb-8 relative z-10">Are you sure you want to remove <strong>{itemToRemove.name}</strong> from the tournament? You can re-invite them later if needed.</p>
                                    <div className="flex gap-4 justify-center relative z-10">
                                        <Button variant="outline" onClick={() => setItemToRemove(null)} className="w-full bg-white/5 hover:bg-white/10">Cancel</Button>
                                        <Button variant="destructive" onClick={executeRemoveParticipant} className="w-full bg-red-500 hover:bg-red-600 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                            Remove {itemToRemove.type === 'team' ? 'Team' : 'Player'}
                                        </Button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </motion.div>
                    )}

                    {rejectingRosterItem && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}>
                                <GlassCard className="p-8 max-w-lg w-full border-red-500/30 shadow-[0_0_40px_rgba(239,68,68,0.15)] relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-6">
                                        <div>
                                            <h2 className="text-2xl font-bold flex items-center gap-2"><UserX className="w-6 h-6 text-red-500" /> Reject Entry</h2>
                                            <p className="text-sm text-primary font-bold mt-1">{rejectingRosterItem.profiles?.name}</p>
                                        </div>
                                        <Button variant="ghost" size="icon" onClick={() => { setRejectingRosterItem(null); setRejectionNote(''); }} className="rounded-full"><X className="w-5 h-5" /></Button>
                                    </div>
                                    <div className="space-y-4 mb-8">
                                        <p className="text-sm text-muted-foreground">Please provide a mandatory reason for this rejection. The athlete and their coach will receive an automated notification with this exact note.</p>
                                        <div className="space-y-2">
                                            <Label className="text-red-400 font-bold">Reason for Rejection *</Label>
                                            <Textarea 
                                                placeholder="e.g., Failed official weigh-in, Invalid ID proof provided..." 
                                                value={rejectionNote} 
                                                onChange={e => setRejectionNote(e.target.value)} 
                                                className="bg-black/40 border-red-500/30 h-24 text-sm" 
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="flex justify-end gap-3 border-t border-white/10 pt-4">
                                        <Button variant="ghost" onClick={() => { setRejectingRosterItem(null); setRejectionNote(''); }}>Cancel</Button>
                                        <Button variant="destructive" onClick={executeRejection} disabled={saving || !rejectionNote.trim()} className="shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Confirm Rejection
                                        </Button>
                                    </div>
                                </GlassCard>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
                    <div>
                        <Button variant="ghost" onClick={() => router.push('/dashboard/overview')} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
                            <ChevronLeft className="w-4 h-4 mr-1" /> Back to Dashboard
                        </Button>
                        <div className="flex items-center gap-3 mb-2">
                            <span className="px-3 py-1 bg-primary/20 border border-primary/30 rounded-md text-xs font-bold text-primary uppercase tracking-widest">{tournament.sport}</span>
                            <span className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-widest ${tournament.status === 'live' ? 'bg-green-500/20 text-green-400 border border-green-500/30 animate-pulse' : 'bg-white/10 border border-white/20'}`}>
                                {tournament.status || 'Upcoming'}
                            </span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl font-extrabold font-headline tracking-tight">{tournament.name}</h1>
                    </div>
                    
                    <AnimatePresence>
                        {hasChanges && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                <Button size="lg" onClick={saveChanges} disabled={saving} className="shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]">
                                    {saving ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Save className="w-5 h-5 mr-2" />}
                                    Save Changes
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Tabs */}
                <GlassCard className="p-2 mb-8 flex overflow-x-auto no-scrollbar gap-2 border-white/10">
                    {[
                        { id: 'details', icon: Edit, label: 'Core Details' },
                        { id: 'settings', icon: Settings, label: 'Sport Config' },
                        { id: 'participants', icon: Users, label: `Approved ${participantLabel} (${participants.length}/${maxTeamsDisplay})` },
                        { id: 'matrix', icon: Layers, label: 'Category Matrix' },
                        { id: 'matches', icon: Trophy, label: 'Brackets' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary/20 text-primary border border-primary/30 shadow-sm' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'}`}
                        >
                            <tab.icon className="w-4 h-4" /> {tab.label}
                        </button>
                    ))}
                </GlassCard>

                {/* Content Area */}
                <motion.div key={activeTab} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    
                    {/* DETAILS TAB */}
                    {activeTab === 'details' && (
                        <GlassCard className="p-6 sm:p-10 space-y-8">
                            <div>
                                <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4">Tournament Details</h2>
                                <div className="space-y-6">
                                    <div><Label>Tournament Name</Label><Input className="bg-white/5 h-12 text-lg" value={tournament.name || ''} onChange={(e) => handleDetailChange('name', e.target.value)} /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label>Location / Venue</Label><div className="relative"><MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input className="bg-white/5 h-12 pl-10" value={tournament.location || ''} onChange={(e) => handleDetailChange('location', e.target.value)} /></div></div>
                                        <div className="space-y-2"><Label>Max Teams Allowed (0 for Infinite)</Label><Input type="number" className="bg-white/5 h-12" value={tournament.max_teams || ''} onChange={(e) => handleDetailChange('max_teams', e.target.value ? parseInt(e.target.value, 10) : 0)} /></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2"><Label>Start Date</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input type="date" className="bg-white/5 h-12 pl-10" value={tournament.start_date || ''} onChange={(e) => handleDetailChange('start_date', e.target.value)} /></div></div>
                                        <div className="space-y-2"><Label>End Date</Label><div className="relative"><Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"/><Input type="date" className="bg-white/5 h-12 pl-10" value={tournament.end_date || ''} onChange={(e) => handleDetailChange('end_date', e.target.value)} /></div></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-2">
                                            <Label>Registration Mode</Label>
                                            <Select onValueChange={(value) => handleDetailChange('registration_mode', value)} value={tournament.registration_mode}>
                                                <SelectTrigger className="bg-white/5 h-12"><SelectValue placeholder='Select Mode' /></SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="open">Open / Announcement</SelectItem>
                                                    <SelectItem value="invite">Invite Only</SelectItem>
                                                    <SelectItem value="final">Final / Closed</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2"><Label>Total Prize Pool <span className="text-muted-foreground text-xs">(Optional)</span></Label><Input type="number" className="bg-white/5 h-12 font-bold text-green-400" value={tournament.prize_pool || ''} onChange={(e) => handleDetailChange('prize_pool', e.target.value)} /></div>
                                    </div>
                                </div>
                            </div>
                        </GlassCard>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <div className="space-y-6">
                            <GlassCard className="p-6 sm:p-10">
                                <h2 className="text-2xl font-bold mb-6 border-b border-white/10 pb-4 capitalize">{tournament.sport} specific Rules</h2>
                                {renderSportRules()}
                            </GlassCard>

                            <GlassCard className="p-6 sm:p-10">
                                <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold">Registration Categories</h2>
                                        <p className="text-sm text-muted-foreground mt-1">Manage groups for coaches to register their players under (e.g., Weight Classes, Age, Gender).</p>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleAddCategory} className="bg-white/5 hover:bg-white/10 shrink-0">
                                        <Plus className="w-4 h-4 mr-2" /> Add Category
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {getCategories().map((cat: any) => (
                                        <div key={cat.id} className="p-5 bg-black/20 border border-white/10 rounded-xl space-y-4 relative group">
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                <div className="flex-1 space-y-2 w-full">
                                                    <Label className="text-muted-foreground">Category Name</Label>
                                                    <Input placeholder="e.g., Weight Class, Gender, Belt" value={cat.name} onChange={e => handleCategoryNameChange(cat.id, e.target.value)} className="bg-white/5 border-white/10 h-12 font-bold" />
                                                </div>
                                                <Button variant="ghost" size="icon" onClick={() => handleRemoveCategory(cat.id)} className="mt-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"><Trash2 className="w-4 h-4" /></Button>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Add Sub-Categories / Options</Label>
                                                <div className="flex gap-2">
                                                    <Input placeholder="e.g., -61kg, +55kg, Male, U18..." value={categoryInputVals[cat.id] || ''} onChange={e => setCategoryInputVals(prev => ({...prev, [cat.id]: e.target.value}))} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategoryOption(cat.id); } }} className="bg-white/5 border-white/10" />
                                                    <Button variant="secondary" onClick={() => handleAddCategoryOption(cat.id)} className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30"><Plus className="w-5 h-5" /></Button>
                                                </div>
                                                
                                                {(cat.options || []).length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-4 pt-2">
                                                        {cat.options.map((opt: string, optIdx: number) => (
                                                            <span key={optIdx} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-sm font-medium">
                                                                {opt}
                                                                <X className="w-3 h-3 cursor-pointer text-muted-foreground hover:text-red-400 transition-colors" onClick={() => handleRemoveCategoryOption(cat.id, optIdx)} />
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {getCategories().length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground text-sm italic border border-dashed border-white/10 rounded-xl">
                                            No custom categories added.
                                        </div>
                                    )}
                                </div>
                            </GlassCard>
                        </div>
                    )}

                    {/* NEW: MATRIX ROSTER TAB */}
                    {activeTab === 'matrix' && (
                        <GlassCard className="p-6 sm:p-10">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 border-b border-white/10 pb-6">
                                <div>
                                    <h2 className="text-2xl font-bold flex items-center gap-3"><Layers className="w-6 h-6 text-primary"/> Category Matrix</h2>
                                    <p className="text-sm text-muted-foreground mt-1">Live bird's-eye view of all registered athletes grouped by their classes.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="outline" onClick={fetchMatrixRoster} disabled={matrixLoading}>
                                        {matrixLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Clock className="w-4 h-4 mr-2" />} Refresh
                                    </Button>
                                    
                                    {/* The Smart Approve All Button */}
                                    {isDeadlinePassed && matrixRoster.some(r => r.status === 'registered') && (
                                        <Button onClick={handleApproveAll} disabled={saving} className="bg-green-600 hover:bg-green-700 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]">
                                            {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCheck className="w-5 h-5 mr-2" />} Approve All Entries
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {matrixLoading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : Object.keys(groupedMatrix).length === 0 ? (
                                <div className="text-center py-16 bg-white/5 rounded-xl border border-dashed border-white/10">
                                    <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                                    <h3 className="text-lg font-bold">No Athletes Registered</h3>
                                    <p className="text-sm text-muted-foreground">As teams build their lineups, they will automatically appear here grouped by category.</p>
                                </div>
                            ) : (
                                <div className="space-y-8">
                                    {(Object.entries(groupedMatrix) as [string, any[]][]).map(([categoryName, entries]) => (
                                        <div key={categoryName} className="bg-black/20 rounded-2xl border border-white/5 overflow-hidden">
                                            <div className="bg-white/5 px-6 py-4 flex justify-between items-center border-b border-white/5">
                                                <h3 className="font-bold text-lg text-primary tracking-wide">{categoryName}</h3>
                                                <span className="text-xs font-bold uppercase tracking-widest bg-white/10 px-3 py-1 rounded-full">{entries.length} Athletes</span>
                                            </div>

                                            <div className="p-4 space-y-2">
                                                {entries.map((roster: any) => (
                                                    <div key={roster.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                                                        <div className="flex items-center gap-4">
                                                            <Avatar className="w-10 h-10 border border-white/20">
                                                                <AvatarImage src={roster.profiles?.avatar_url} />
                                                                <AvatarFallback className="bg-primary/20 text-primary font-bold">{roster.profiles?.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div>
                                                                <h4 className="font-bold text-sm">{roster.profiles?.name}</h4>
                                                                <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{roster.coach_name}</p>
                                                            </div>
                                                        </div>
                                                        
                                                        {roster.status === 'rejected' ? (
                                                            <div className="text-right">
                                                                <span className="text-[10px] font-bold uppercase tracking-widest text-red-400 bg-red-500/10 px-2 py-1 rounded">Rejected</span>
                                                                <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] truncate" title={roster.rejection_note}>Note: {roster.rejection_note}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center gap-2">
                                                                {roster.status === 'approved' && <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 bg-green-500/10 px-2 py-1 rounded">Approved</span>}
                                                                <Button size="sm" variant="ghost" onClick={() => setRejectingRosterItem(roster)} className="text-muted-foreground hover:text-red-400 hover:bg-red-500/10 h-8 text-xs font-bold">
                                                                    <X className="w-3 h-3 mr-1" /> Reject
                                                                </Button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    )}

                    {/* PARTICIPANTS & TEAMS TAB (Upgraded for Individuals and Lockdown) */}
                    {activeTab === 'participants' && (
                        <div className="space-y-6">
                            <GlassCard className="p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/10 pb-4">
                                    <div>
                                        <h2 className="text-2xl font-bold">Approved {participantLabel} ({participants.length}/{maxTeamsDisplay})</h2>
                                        <p className="text-sm text-muted-foreground">Entries currently fully approved for the tournament brackets.</p>
                                    </div>
                                    
                                    {!isDeadlinePassed ? (
                                        <div className="flex gap-2">
                                            {/* Hide Invite button for completely individual sports where teams don't exist */}
                                            {!isIndividualSport && (
                                                <Button variant={showInviteSection ? "secondary" : "default"} onClick={() => setShowInviteSection(!showInviteSection)}>
                                                    {showInviteSection ? 'Hide Invites' : <><UserPlus className="w-4 h-4 mr-2"/> Invite Coaches</>}
                                                </Button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 text-red-400 bg-red-500/10 px-4 py-2 rounded-lg border border-red-500/20">
                                            <Lock className="w-4 h-4" />
                                            <span className="text-xs font-bold uppercase tracking-widest">Registration Closed</span>
                                        </div>
                                    )}
                                </div>
                                
                                {participantLoading ? (
                                    <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                                ) : participants.length === 0 ? (
                                    <div className="text-center py-12 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                        <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground mb-3" />
                                        <h3 className="text-lg font-bold">No {participantLabel} Approved</h3>
                                        <p className="text-muted-foreground text-sm">
                                            {isDeadlinePassed 
                                                ? 'Registration ended with no approved participants. Check your Matrix Tab.' 
                                                : (isIndividualSport ? 'Waiting for independent athletes to register and be approved.' : 'Use the Invite button to add coaches to your roster.')}
                                        </p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {participants.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    <Avatar className="w-12 h-12 border border-white/20">
                                                        <AvatarImage src={item.logo_url} />
                                                        <AvatarFallback className="bg-primary/20 text-primary">{item.name?.charAt(0)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="overflow-hidden">
                                                        <Link href={item.type === 'team' ? `/team/${item.id}` : `/user/${item.player_id}`}>
                                                            <h4 className="font-bold text-lg truncate hover:text-primary transition-colors cursor-pointer">
                                                                {item.name}
                                                            </h4>
                                                        </Link>
                                                        <p className="text-xs text-muted-foreground truncate uppercase tracking-widest font-bold flex items-center gap-2 mt-1">
                                                            <CheckCircle2 className="w-3 h-3 text-green-400" /> {item.status} 
                                                            {item.type === 'individual' && <span className="bg-white/10 px-1.5 py-0.5 rounded text-[9px]">INDIVIDUAL</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button size="icon" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0" onClick={() => promptRemoveParticipant(item.id, item.coach_id, item.type, item.name)}>
                                                    <X className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </GlassCard>

                            <AnimatePresence>
                                {showInviteSection && !isDeadlinePassed && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                                        <GlassCard className="p-6 border-primary/30 shadow-[0_0_30px_rgba(var(--primary-rgb),0.05)]">
                                            <h3 className="font-bold text-lg mb-4">Available {tournament.sport} Coaches</h3>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                                {availableCoaches.map(coach => {
                                                    const isAlreadyApproved = participants.some(p => p.coach_id === coach.id);
                                                    const isPending = pendingInvites.includes(coach.id);
                    
                                                    return (
                                                        <div key={coach.id} className="p-4 bg-black/40 rounded-xl border border-white/5 flex items-center justify-between">
                                                            <div className="overflow-hidden pr-2">
                                                                <p className="font-bold truncate text-sm">{coach.profiles?.name}</p>
                                                                <p className="text-xs text-muted-foreground truncate">{coach.team_name || 'No Team Name'}</p>
                                                            </div>
                                                            
                                                            {isAlreadyApproved ? (
                                                                <span className="text-[10px] uppercase font-bold text-green-400 bg-green-400/10 px-2 py-1 rounded">Joined</span>
                                                            ) : isPending ? (
                                                                <span className="text-[10px] uppercase font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded flex items-center gap-1">
                                                                    <Clock className="w-3 h-3" /> Pending
                                                                </span>
                                                            ) : (
                                                                <Button size="sm" onClick={() => handleSendInvite(coach.id)} disabled={invitingCoachId === coach.id}>
                                                                    {invitingCoachId === coach.id ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Invite'}
                                                                </Button>
                                                            )}
                                                        </div>
                                                    )
                                                })}
                                                {availableCoaches.length === 0 && <p className="text-muted-foreground text-sm col-span-full">No available coaches found for this sport.</p>}
                                            </div>
                                        </GlassCard>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}

                    {/* MATCHES TAB */}
                    {activeTab === 'matches' && (
                        <GlassCard className="p-6">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-white/10 pb-4">
                                <div>
                                    <h2 className="text-2xl font-bold">Tournament Brackets</h2>
                                    <p className="text-sm text-muted-foreground">Manage and score scheduled matchups.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={fetchMatches} disabled={matchLoading}>
                                        {matchLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync'}
                                    </Button>
                                    <Button size="sm" onClick={() => router.push(`/tournament/${tournamentId}/brackets`)}>
                                        Open Bracket Engine <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                </div>
                            </div>

                            {matchLoading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                            ) : matches.length === 0 ? (
                                <div className="text-center py-16 bg-white/5 rounded-xl border border-white/10 border-dashed">
                                    <Trophy className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                                    <h3 className="text-xl font-bold mb-1">Brackets Not Generated</h3>
                                    <p className="text-muted-foreground text-sm mb-6">You need to generate the brackets to schedule matchups.</p>
                                    <Button onClick={() => router.push(`/tournament/${tournamentId}/brackets`)}>Go to Brackets Engine</Button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {matches.map(match => (
                                        <div key={match.id} className="p-5 bg-white/5 rounded-xl border border-white/10 relative overflow-hidden group hover:border-primary/30 transition-colors">
                                            <div className="flex justify-between items-center mb-4">
                                                <span className="text-xs font-bold text-primary uppercase tracking-widest bg-primary/10 px-2 py-1 rounded-sm">{match.round_name || `Round ${match.round_number}`}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-sm ${match.status === 'live' ? 'bg-green-500/10 text-green-400 animate-pulse' : 'bg-white/10 text-muted-foreground'}`}>{match.status}</span>
                                            </div>
                                            <div className="space-y-3 relative z-10">
                                                <div className="flex items-center gap-3"><Avatar className="w-8 h-8"><AvatarImage src={match.team_a_logo}/><AvatarFallback className="text-xs bg-white/10">{match.team_a_name?.charAt(0)}</AvatarFallback></Avatar><span className="font-bold truncate">{match.team_a_name || 'TBA'}</span></div>
                                                <div className="flex items-center gap-3"><Avatar className="w-8 h-8"><AvatarImage src={match.team_b_logo}/><AvatarFallback className="text-xs bg-white/10">{match.team_b_name?.charAt(0)}</AvatarFallback></Avatar><span className="font-bold truncate">{match.team_b_name || 'TBA'}</span></div>
                                            </div>
                                            <div className="mt-6 pt-4 border-t border-white/5 flex gap-2">
                                                <GlassButton variant="secondary" size="sm" className="w-full text-xs py-1 h-auto"><Clock className="w-3 h-3 mr-1"/> Reschedule</GlassButton>
                                                <Button size="sm" className="w-full text-xs py-1 h-auto font-bold" onClick={() => router.push(`/organizer/match/${match.id}`)}>Score Match</Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </GlassCard>
                    )}

                </motion.div>
            </div>
        </DashboardLayout>
    );
};

export default ManageTournamentPage;
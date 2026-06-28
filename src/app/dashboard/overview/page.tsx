'use client'

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import GlassCard from '@/components/glass/GlassCard';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Plus, BarChart2, Shield, Settings, Users, ArrowRight, Trophy, Search, Play } from 'lucide-react';
import Link from 'next/link';

// Common Components
const StatCard = ({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) => (
    <GlassCard className="p-6 flex flex-col justify-between">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-muted-foreground">{title}</h3>
            {icon}
        </div>
        <p className="text-4xl font-bold mt-2">{value}</p>
    </GlassCard>
);

const TournamentCard = ({ tournament, teamCount, userRole }: { tournament: any, teamCount: number, userRole: string }) => {
    const getStatus = () => {
        const now = new Date();
        const start = new Date(tournament.start_date);
        const end = new Date(tournament.end_date);
        if (now > end) return { text: 'Completed', color: 'text-gray-400' };
        if (now >= start && now <= end) return { text: 'Live', color: 'text-green-400 animate-pulse' };
        return { text: 'Upcoming', color: 'text-yellow-400' };
    };

    const status = getStatus();
    const manageLink = userRole === 'organizer' ? `/organizer/manage-tournament/${tournament.id}` : `/tournament/${tournament.id}`;

    return (
        <GlassCard className="p-5 flex flex-col justify-between hover:border-primary/50 transition-all duration-300">
            <div>
                <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-xl mb-1">{tournament.name}</h4>
                    <span className={`font-bold text-sm ${status.color}`}>{status.text}</span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1 mb-4">
                    <p>{tournament.sport} | {tournament.level}</p>
                    <p>{new Date(tournament.start_date).toLocaleDateString()} - {new Date(tournament.end_date).toLocaleDateString()}</p>
                </div>
            </div>
            <div>
                <div className="flex justify-between items-center text-xs mb-1">
                    <span className="text-muted-foreground">Registrations</span>
                    <span>{teamCount} / {tournament.max_teams}</span>
                </div>
                <Progress value={(teamCount / tournament.max_teams) * 100} />
                <div className="mt-4 flex gap-2">
                    <Link href={manageLink} className="shrink-0">
                        <Button size="icon" className="w-10 h-10">
                            <Settings className="w-5 h-5" />
                        </Button>
                    </Link>
                    <Link href={`/tournament/${tournament.id}/brackets`} className="flex-1">
                        <Button variant="outline" className="w-full">
                            View Brackets
                        </Button>
                    </Link>
                </div>
            </div>
        </GlassCard>
    );
};


const OverviewPage = () => {
    const [user, setUser] = useState<any>(null);
    const [profile, setProfile] = useState<any>(null);
    const [tournaments, setTournaments] = useState<any[]>([]);
    const [teams, setTeams] = useState<any[]>([]);
    const [relatedData, setRelatedData] = useState<any>({}); 
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('Upcoming');
    const router = useRouter();

    // --- DEMO MATCH STATES ---
    const [showDemoModal, setShowDemoModal] = useState(false);
    const [demoPlayerA, setDemoPlayerA] = useState('');
    const [demoPlayerB, setDemoPlayerB] = useState('');
    const [demoSport, setDemoSport] = useState('karate');
    const [isStartingDemo, setIsStartingDemo] = useState(false);

    const fetchOrganizerData = useCallback(async (userId: string) => {
        const { data: tournamentData } = await supabase.from('tournaments').select('*').eq('organizer_id', userId);
        setTournaments(tournamentData || []);
        if (tournamentData && tournamentData.length > 0) {
            const tournamentIds = tournamentData.map(t => t.id);
            const { data: teamData } = await supabase.from('teams').select('id, tournament_id').in('tournament_id', tournamentIds);
            setTeams(teamData || []);
        }
    }, []);

    const fetchCoachData = useCallback(async (userId: string) => {
        // 1. Fetch Teams
        const { data: coachTeams } = await supabase.from('teams').select('id, name, tournament_id').eq('coach_id', userId);
        
        // 2. Fetch Players (Get IDs first, then their names from profiles to avoid join errors)
        const { data: coachPlayers } = await supabase.from('players').select('id').eq('coach_id', userId);
        let fetchedPlayers: any[] = [];
        
        if (coachPlayers && coachPlayers.length > 0) {
            const playerIds = coachPlayers.map(p => p.id);
            const { data: profiles } = await supabase.from('profiles').select('id, name').in('id', playerIds);
            fetchedPlayers = profiles || [];
        }

        setRelatedData({ 
            myTeams: coachTeams || [],
            myPlayers: fetchedPlayers 
        });

        if (coachTeams && coachTeams.length > 0) {
            const tournamentIds = [...new Set(coachTeams.map(t => t.tournament_id))];
            const { data: tournamentData } = await supabase.from('tournaments').select('*').in('id', tournamentIds);
            setTournaments(tournamentData || []);
        }
    }, []);

    const fetchPlayerData = useCallback(async (userId: string) => {
        const { data: teamRosters } = await supabase.from('team_rosters').select('team_id').eq('player_id', userId);
        if (!teamRosters) { setTournaments([]); return; }

        const teamIds = teamRosters.map(tr => tr.team_id);
        const { data: playerTeams } = await supabase.from('teams').select('id, name, tournament_id').in('id', teamIds);
        setRelatedData({ teamsJoined: playerTeams || [] });

        if (playerTeams && playerTeams.length > 0) {
            const tournamentIds = [...new Set(playerTeams.map(t => t.tournament_id))];
            const { data: tournamentData } = await supabase.from('tournaments').select('*').in('id', tournamentIds);
            setTournaments(tournamentData || []);
        }
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { setLoading(false); router.push('/login'); return; }

            const { data: profileData } = await supabase.from('profiles').select('name, role').eq('id', user.id).single();
            
            setUser(user);
            setProfile(profileData);

            if (profileData?.role === 'organizer') {
                await fetchOrganizerData(user.id);
            } else if (profileData?.role === 'coach') {
                await fetchCoachData(user.id);
            } else if (profileData?.role === 'player') {
                await fetchPlayerData(user.id);
            }
            setLoading(false);
        };
        fetchData();
    }, [router, fetchOrganizerData, fetchCoachData, fetchPlayerData]);

    const handleStartDemoMatch = async () => {
        setIsStartingDemo(true);
        try {
            // 1. Look for an existing demo sandbox tournament for this coach
            let { data: demoTourney } = await supabase
                .from('tournaments')
                .select('id')
                .eq('organizer_id', user.id)
                .eq('name', 'Coach Demo Sandbox')
                .maybeSingle(); // Safely returns null instead of throwing an error if 0 rows found

            if (!demoTourney) {
                const { data: newTourney, error: tErr } = await supabase.from('tournaments').insert({
                    name: 'Coach Demo Sandbox',
                    organizer_id: user.id, 
                    sport: demoSport,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
                    status: 'upcoming'
                }).select('id').single();
                
                if (tErr) throw tErr;
                demoTourney = newTourney;
            }

            // 2. Identify if the sport uses individual players or teams
            const isIndSport = ['tennis', 'badminton', 'karate', 'judo', 'wrestling'].includes(demoSport.toLowerCase());

            const matchInsertData: any = {
                tournament_id: demoTourney.id,
                category: 'Demo',
                section: 'Practice',
                round_number: 1,
                round_name: 'Demo Match',
                status: 'scheduled',
                score_data: {} // Pre-initialize empty object to prevent frontend state crashes
            };

            if (isIndSport) {
                // Assign the valid profile UUIDs directly to the match row
                matchInsertData.player_a_id = demoPlayerA || user.id;
                matchInsertData.player_b_id = demoPlayerB || user.id;
            } else {
                // Team sports fallback: Use coach's actual registered team IDs
                const teamAId = relatedData?.myTeams?.[0]?.id || null;
                const teamBId = relatedData?.myTeams?.[1]?.id || null;
                
                if (!teamAId || !teamBId) {
                    throw new Error("For team sports, please register at least 2 teams under your account first.");
                }
                matchInsertData.team_a_id = teamAId;
                matchInsertData.team_b_id = teamBId;
            }

            // 3. Insert directly into matches table
            const { data: match, error: mErr } = await supabase
                .from('matches')
                .insert(matchInsertData)
                .select('id')
                .single();

            if (mErr) throw mErr;

            // 4. Redirect to scoring page
            router.push(`/organizer/match/${match.id}`);
        } catch (error: any) {
            console.error("Demo Match Error Details:", error);
            alert(error.message || "Failed to start demo match. Check your browser console.");
            setIsStartingDemo(false);
        }
    };

    const filteredTournaments = tournaments.filter(t => {
        const now = new Date();
        const start = new Date(t.start_date);
        const end = new Date(t.end_date);
        if (activeTab === 'Live') return now >= start && now <= end;
        if (activeTab === 'Completed') return now > end;
        if (activeTab === 'Upcoming') return now < start;
        return true;
    });

    const containerVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

    const renderLoadingState = () => (
        <div className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => <GlassCard key={i} className="h-32 animate-pulse"></GlassCard>)}
            </div>
            <div className="mt-8">
                <GlassCard className="h-96 animate-pulse"></GlassCard>
            </div>
        </div>
    );

    const renderEmptyState = () => (
        <div className="text-center p-20">
            <h3 className="text-2xl font-bold">No Tournaments Found</h3>
            <p className="text-muted-foreground mb-6">It looks like you're not involved in any tournaments yet.</p>
            {profile.role === 'organizer' && <Link href="/organizer/create-tournament"><Button>Create First Tournament <ArrowRight className="ml-2" /></Button></Link>}
            
            {/* The Replaced Button for Coaches */}
            {profile.role === 'coach' && (
                <Button onClick={() => setShowDemoModal(true)} className="bg-primary/20 text-primary border-primary hover:bg-primary hover:text-white transition-all">
                    Start a Demo Match <Play className="ml-2 w-4 h-4" fill="currentColor" />
                </Button>
            )}
             
            {profile.role === 'player' && <Link href="/dashboard/tournaments"><Button>Find a Tournament <Search className="ml-2" /></Button></Link>}
        </div>
    );

    const renderOrganizerDashboard = () => (
        <>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Welcome back, {profile?.name || 'Organizer'}!</h1>
                <Link href="/organizer/create-tournament">
                    <Button size="lg" className="mt-4 sm:mt-0 neon-glow-primary"><Plus className="mr-2" /> Create New Tournament</Button>
                </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Total Tournaments" value={tournaments.length} icon={<BarChart2 className="text-primary" />} />
                <StatCard title="Active Events" value={tournaments.filter(t => new Date(t.end_date) >= new Date()).length} icon={<Shield className="text-green-400" />} />
                <StatCard title="Total Teams Registered" value={teams.length} icon={<Users className="text-yellow-400" />} />
            </motion.div>
        </>
    );

    const renderCoachDashboard = () => (
        <>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Welcome back, Coach {profile?.name || ''}!</h1>
                <Link href="/dashboard/teams/create">
                     <Button size="lg" className="mt-4 sm:mt-0 neon-glow-primary"><Plus className="mr-2" /> Register New Team</Button>
                </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="My Teams" value={relatedData.myTeams?.length || 0} icon={<Users className="text-primary" />} />
                <StatCard title="Tournaments Entered" value={tournaments.length} icon={<Trophy className="text-yellow-400" />} />
                <StatCard title="Upcoming Matches" value="0" icon={<Shield className="text-green-400" />} />
            </motion.div>
        </>
    );

    const renderPlayerDashboard = () => (
        <>
            <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-center mb-8">
                <h1 className="text-3xl font-bold font-headline">Welcome back, {profile?.name || 'Player'}!</h1>
                 <Link href="/dashboard/tournaments">
                    <Button size="lg" className="mt-4 sm:mt-0"><Search className="mr-2" /> Find Tournaments</Button>
                </Link>
            </motion.div>
            <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard title="Teams Joined" value={relatedData.teamsJoined?.length || 0} icon={<Users className="text-primary" />} />
                <StatCard title="Active Tournaments" value={tournaments.filter(t => new Date(t.end_date) >= new Date()).length} icon={<Trophy className="text-yellow-400" />} />
                <StatCard title="Upcoming Matches" value="0" icon={<Shield className="text-green-400" />} />
            </motion.div>
        </>
    );
    
    const renderDashboardHeader = () => {
      switch (profile?.role) {
        case 'organizer': return renderOrganizerDashboard();
        case 'coach': return renderCoachDashboard();
        case 'player': return renderPlayerDashboard();
        default: return null;
      }
    }

    if (loading || !profile) {
        return renderLoadingState();
    }

    return (
        <>
            {/* DEMO MATCH MODAL */}
            <AnimatePresence>
                {showDemoModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md">
                            <GlassCard className="p-6">
                                <h2 className="text-2xl font-bold mb-2 font-headline">Start a Demo Match</h2>
                                <p className="text-sm text-muted-foreground mb-6">Test the scoring engine live. A private sandbox match will be generated for you.</p>
                                
                                <div className="space-y-4 mb-8">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Sport</label>
                                        <select 
                                            value={demoSport} 
                                            onChange={e => setDemoSport(e.target.value)} 
                                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-primary/50"
                                        >
                                            <option value="karate">Karate</option>
                                            <option value="judo">Judo</option>
                                            <option value="wrestling">Wrestling</option>
                                            <option value="tennis">Tennis</option>
                                            <option value="badminton">Badminton</option>
                                            <option value="cricket">Cricket</option>
                                            <option value="football">Football</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-red-400 uppercase tracking-wider">Competitor 1 (AKA / Home)</label>
                                        <select 
                                            value={demoPlayerA} 
                                            onChange={e => setDemoPlayerA(e.target.value)} 
                                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-red-500/50"
                                        >
                                            <option value="">Select a player...</option>
                                            {relatedData?.myPlayers?.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                            {/* Secure placeholder utilizing coach profile to prevent foreign key constraint fails */}
                                            <option value={user?.id}>Myself (Coach Account)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-blue-400 uppercase tracking-wider">Competitor 2 (AO / Away)</label>
                                        <select 
                                            value={demoPlayerB} 
                                            onChange={e => setDemoPlayerB(e.target.value)} 
                                            className="w-full h-12 bg-black/40 border border-white/10 rounded-xl px-4 text-sm focus:outline-none focus:border-blue-500/50"
                                        >
                                            <option value="">Select a player...</option>
                                            {relatedData?.myPlayers?.map((p: any) => (
                                                <option key={p.id} value={p.id}>{p.name}</option>
                                            ))}
                                            <option value={user?.id}>Myself (Coach Account)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="flex gap-3 justify-end border-t border-white/10 pt-4">
                                    <Button variant="ghost" onClick={() => setShowDemoModal(false)}>Cancel</Button>
                                    <Button onClick={handleStartDemoMatch} disabled={!demoPlayerA || !demoPlayerB || isStartingDemo} className="font-bold">
                                        {isStartingDemo ? 'Generating Sandbox...' : 'Start Match'}
                                    </Button>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* MAIN DASHBOARD */}
            <motion.div variants={containerVariants} initial="hidden" animate="visible" className="p-4 sm:p-8">
                {renderDashboardHeader()}
                <motion.div variants={itemVariants}>
                    <GlassCard>
                        <div className="p-4 border-b border-white/10 flex gap-2">
                            {['Upcoming', 'Live', 'Completed'].map(tab => (
                                <Button key={tab} variant={activeTab === tab ? 'default' : 'ghost'} onClick={() => setActiveTab(tab)}>{tab}</Button>
                            ))}
                        </div>
                        {tournaments.length === 0 ? renderEmptyState() : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                                {filteredTournaments.map(t => (
                                    <TournamentCard key={t.id} tournament={t} teamCount={teams.filter(team => team.tournament_id === t.id).length} userRole={profile.role} />
                                ))}
                            </div>
                        )}
                    </GlassCard>
                </motion.div>
            </motion.div>
        </>
    );
};

export default OverviewPage;
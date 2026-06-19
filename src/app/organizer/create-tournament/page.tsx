'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { AnimatePresence, motion } from 'framer-motion';
import DashboardLayout from '@/app/dashboard/layout';
import GlassCard from '@/components/glass/GlassCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Trophy, Upload, Calendar, MapPin, IndianRupee, DollarSign, Euro, PoundSterling, Loader2, Info, ChevronRight, ChevronLeft, Settings, AlertCircle, CheckCircle2, Plus, X, Trash2 } from 'lucide-react';

const steps = [
    { id: 1, name: 'Identity', icon: Trophy },
    { id: 2, name: 'Logistics', icon: Calendar },
    { id: 3, name: 'Operations', icon: Settings },
    { id: 4, name: 'Financials', icon: IndianRupee },
    { id: 5, name: 'Rules', icon: Info },
    { id: 6, name: 'Publish', icon: Upload },
];

const SPORTS = ['Cricket', 'Football', 'Badminton', 'Wrestling', 'Kabaddi', 'Karate', 'Judo', 'Tennis', 'Basketball', 'Volleyball'];
const LEVELS = ['Zonal', 'District', 'State', 'National', 'International'];
const FORMATS = ['Knockout', 'League', 'Group Stage + Knockout'];
const CURRENCIES = [
    { label: 'INR (₹)', value: 'INR', icon: IndianRupee },
    { label: 'USD ($)', value: 'USD', icon: DollarSign },
    { label: 'EUR (€)', value: 'EUR', icon: Euro },
    { label: 'GBP (£)', value: 'GBP', icon: PoundSterling },
];

export default function CreateTournamentPage() {
    const router = useRouter();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    
    // Coach Invite State
    const [availableCoaches, setAvailableCoaches] = useState<any[]>([]);
    const [fetchingCoaches, setFetchingCoaches] = useState(false);
    const [invitedCoaches, setInvitedCoaches] = useState<string[]>([]);
    
    // Dynamic Category Builder Input States
    const [categoryInputVals, setCategoryInputVals] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        name: '', sport: '', level: '', banner_url: '',
        location: '', start_date: '', end_date: '', format: '', max_teams: 8, 
        registration_mode: '', registration_deadline: '', contact_email: '',
        currency: 'INR', entry_fee: '', prize_pool: '',
        prizes: { first: '', second: '', mvp: '' },
        rules: {} as any, additional_rules: '',
        // New Dynamic Categories Array
        custom_categories: [] as Array<{ id: string, name: string, options: string[] }>
    });

    // Fetch coaches dynamically when a sport is selected
    useEffect(() => {
        const fetchCoaches = async () => {
            if (!formData.sport) return;
            setFetchingCoaches(true);
            
            const { data, error } = await supabase
                .from('coaches')
                .select('id, sport, certifications, profiles!inner(name, avatar_url, city)')
                .ilike('sport', formData.sport);
                
            if (!error && data) {
                setAvailableCoaches(data);
            }
            setFetchingCoaches(false);
        };
        fetchCoaches();
        setInvitedCoaches([]); 
    }, [formData.sport]);

    const handleInputChange = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleNestedChange = (category: 'prizes' | 'rules', field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            [category]: { ...prev[category], [field]: value }
        }));
    };

    const toggleCoachInvite = (coachId: string) => {
        setInvitedCoaches(prev => 
            prev.includes(coachId) ? prev.filter(id => id !== coachId) : [...prev, coachId]
        );
    };

    // --- DYNAMIC CATEGORY BUILDER LOGIC ---
    const handleAddCategory = () => {
        const newId = Math.random().toString(36).substring(7);
        setFormData(prev => ({
            ...prev,
            custom_categories: [...prev.custom_categories, { id: newId, name: '', options: [] }]
        }));
    };

    const handleCategoryNameChange = (id: string, name: string) => {
        setFormData(prev => ({
            ...prev,
            custom_categories: prev.custom_categories.map(c => c.id === id ? { ...c, name } : c)
        }));
    };

    const handleRemoveCategory = (id: string) => {
        setFormData(prev => ({
            ...prev,
            custom_categories: prev.custom_categories.filter(c => c.id !== id)
        }));
        setCategoryInputVals(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const handleAddCategoryOption = (id: string) => {
        const val = categoryInputVals[id]?.trim();
        if (!val) return;

        setFormData(prev => ({
            ...prev,
            custom_categories: prev.custom_categories.map(c => 
                c.id === id ? { ...c, options: [...c.options, val] } : c
            )
        }));
        
        // Clear the input
        setCategoryInputVals(prev => ({ ...prev, [id]: '' }));
    };

    const handleRemoveCategoryOption = (id: string, optIndex: number) => {
        setFormData(prev => ({
            ...prev,
            custom_categories: prev.custom_categories.map(c => 
                c.id === id ? { ...c, options: c.options.filter((_, idx) => idx !== optIndex) } : c
            )
        }));
    };

    // --- DATA SANITIZATION & VALIDATION ENGINE ---
    const isStepValid = () => {
        switch (currentStep) {
            case 0: return formData.name.trim() !== '' && formData.sport !== '' && formData.level !== '';
            case 1: 
                if (!formData.location || !formData.start_date || !formData.end_date || !formData.format || formData.max_teams === null) return false;
                if (new Date(formData.end_date) < new Date(formData.start_date)) return false;
                return true;
            case 2: 
                if (!formData.registration_mode) return false;
                if (['open', 'invite'].includes(formData.registration_mode) && !formData.registration_deadline) return false;
                if (formData.registration_deadline && new Date(formData.registration_deadline) > new Date(formData.start_date)) return false;
                if (formData.registration_mode === 'invite' && formData.max_teams > 0 && invitedCoaches.length > formData.max_teams) return false;
                return true;
            case 3: 
                return formData.entry_fee !== '';
            case 4: return true; 
            default: return true;
        }
    };

    const getValidationError = () => {
        if (currentStep === 1 && formData.end_date && formData.start_date && new Date(formData.end_date) < new Date(formData.start_date)) {
            return "End Date cannot be before Start Date.";
        }
        if (currentStep === 2 && formData.registration_deadline && formData.start_date && new Date(formData.registration_deadline) > new Date(formData.start_date)) {
            return "Registration deadline must be before the tournament starts.";
        }
        if (currentStep === 2 && formData.registration_mode === 'invite' && formData.max_teams > 0 && invitedCoaches.length > formData.max_teams) {
            return `You cannot invite more coaches (${invitedCoaches.length}) than the max team limit (${formData.max_teams}).`;
        }
        return "Please fill in all required fields to continue.";
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = e.target.files?.[0];
            if (!file) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
            
            const { error: uploadError } = await supabase.storage.from('tournament_banners').upload(fileName, file);
            if (uploadError) throw uploadError;

            const { data } = supabase.storage.from('tournament_banners').getPublicUrl(fileName);
            handleInputChange('banner_url', data.publicUrl);
        } catch (error) {
            console.error('Error uploading image:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleNext = () => {
        if (isStepValid()) setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
    };
    const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 0));

    // --- DATABASE LOGIC ---
    const handleSubmit = async () => {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Package the dynamic categories inside the JSON rules column so coaches can fetch them later
        const finalRules = { 
            ...formData.rules,
            registration_categories: formData.custom_categories 
        };

        const { data: tournament, error } = await supabase.from('tournaments').insert({
            organizer_id: user.id,
            name: formData.name, 
            sport: formData.sport.toLowerCase(), 
            level: formData.level.toLowerCase(),
            banner_url: formData.banner_url, 
            location: formData.location,
            start_date: formData.start_date, 
            end_date: formData.end_date, 
            format: formData.format.toLowerCase(), 
            max_teams: formData.max_teams,
            registration_mode: formData.registration_mode, 
            registration_deadline: formData.registration_deadline || null, 
            contact_email: formData.contact_email,
            currency: formData.currency, 
            entry_fee: parseFloat(formData.entry_fee) || 0, 
            prize_pool: parseFloat(formData.prize_pool) || 0, 
            prizes: formData.prizes, 
            rules: finalRules, 
            additional_rules: formData.additional_rules
        }).select().single();

        if (error || !tournament) {
            console.error("Supabase Insert Error:", error);
            alert(`Failed to create tournament: ${error?.message || 'Unknown error'}`);
            setLoading(false);
            return;
        }

        if (formData.registration_mode === 'invite' && invitedCoaches.length > 0) {
            const inviteRecords = invitedCoaches.map(coachId => ({
                tournament_id: tournament.id,
                organizer_id: user.id,
                coach_id: coachId,
                status: 'pending'
            }));

            const { data: insertedInvites, error: inviteError } = await supabase.from('tournament_invitations').insert(inviteRecords).select();

            if (insertedInvites && insertedInvites.length > 0) {
                const notificationRecords = insertedInvites.map(invite => ({
                    user_id: invite.coach_id,
                    type: 'tournament_invite',
                    message: `You have been invited to participate in ${tournament.name}!`,
                    metadata: { tournament_invite_id: invite.id, tournament_name: tournament.name, organizer_id: user.id }
                }));
                await supabase.from('notifications').insert(notificationRecords);
            }
        }

        setLoading(false);
        if (formData.registration_mode === 'final') {
            router.push(`/tournament/${tournament.id}/brackets`);
        } else {
            router.push(`/dashboard/overview`);
        }
    };

    // --- Dynamic Sport Rules Renderer ---
    const renderSportRules = () => {
        const sportLower = formData.sport?.toLowerCase();
        
        if (sportLower === 'cricket') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'ball_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Ball Type" /></SelectTrigger>
                        <SelectContent><SelectItem value="Tennis">Tennis Ball</SelectItem><SelectItem value="Leather">Leather Ball</SelectItem></SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'pitch_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Pitch Type" /></SelectTrigger>
                        <SelectContent><SelectItem value="Turf">Turf</SelectItem><SelectItem value="Matting">Matting</SelectItem><SelectItem value="Cement">Cement</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Overs per Innings" onChange={e => handleNestedChange('rules', 'overs', e.target.value)} />
                    <Input type="number" placeholder="Squad Size (e.g. 15)" onChange={e => handleNestedChange('rules', 'squad_size', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'football') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'match_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Match Format" /></SelectTrigger>
                        <SelectContent><SelectItem value="5v5">5-a-side</SelectItem><SelectItem value="7v7">7-a-side</SelectItem><SelectItem value="11v11">11-a-side</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Half Duration (Mins)" onChange={e => handleNestedChange('rules', 'half_duration', e.target.value)} />
                    <Select onValueChange={v => handleNestedChange('rules', 'offside', v)}>
                        <SelectTrigger><SelectValue placeholder="Offside Rule" /></SelectTrigger>
                        <SelectContent><SelectItem value="Yes">Enforced</SelectItem><SelectItem value="No">Not Enforced</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Max Substitutions" onChange={e => handleNestedChange('rules', 'subs', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'badminton') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'match_format', v)}>
                        <SelectTrigger><SelectValue placeholder="Match Format" /></SelectTrigger>
                        <SelectContent><SelectItem value="Singles">Singles Only</SelectItem><SelectItem value="Doubles">Doubles Only</SelectItem><SelectItem value="Team Event">Team Event</SelectItem></SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'shuttle_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Shuttle Type" /></SelectTrigger>
                        <SelectContent><SelectItem value="Feather">Feather (Professional)</SelectItem><SelectItem value="Nylon">Nylon (Synthetic)</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Points per Game (e.g. 21)" onChange={e => handleNestedChange('rules', 'points', e.target.value)} />
                    <Input type="number" placeholder="Best of (e.g. 3 Sets)" onChange={e => handleNestedChange('rules', 'best_of', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'wrestling') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'style', v)}>
                        <SelectTrigger><SelectValue placeholder="Wrestling Style" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Freestyle">Freestyle</SelectItem>
                            <SelectItem value="Greco-Roman">Greco-Roman</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Period Duration (Mins)" onChange={e => handleNestedChange('rules', 'period_duration', e.target.value)} />
                    <Input type="number" placeholder="Number of Periods (e.g. 2)" onChange={e => handleNestedChange('rules', 'periods', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'kabaddi') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'style', v)}>
                        <SelectTrigger><SelectValue placeholder="Kabaddi Style" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Standard">Standard Style</SelectItem>
                            <SelectItem value="Circle">Circle Style</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Half Duration (Mins)" onChange={e => handleNestedChange('rules', 'half_duration', e.target.value)} />
                    <Input type="number" placeholder="Squad Size (e.g. 12)" onChange={e => handleNestedChange('rules', 'squad_size', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'karate') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'competition_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Competition Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Kumite">Kumite (Sparring Only)</SelectItem>
                            <SelectItem value="Kata">Kata (Forms Only)</SelectItem>
                            <SelectItem value="Kata + Kumite">Kata + Kumite (Both)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'belt_category', v)}>
                        <SelectTrigger><SelectValue placeholder="Belt Category" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="White/Yellow">White / Yellow Belt</SelectItem>
                            <SelectItem value="Orange/Green">Orange / Green Belt</SelectItem>
                            <SelectItem value="Blue/Brown">Blue / Brown Belt</SelectItem>
                            <SelectItem value="Black">Black Belt</SelectItem>
                            <SelectItem value="Open">Open Belt (All Levels)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'rule_set', v)}>
                        <SelectTrigger><SelectValue placeholder="Rule Set" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="WKF">WKF Rules</SelectItem>
                            <SelectItem value="Traditional">Traditional Ippon</SelectItem>
                            <SelectItem value="Kyokushin">Kyokushin Full Contact</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Match Duration (Mins)" onChange={e => handleNestedChange('rules', 'match_duration', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'judo') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'golden_score', v)}>
                        <SelectTrigger><SelectValue placeholder="Golden Score Rules" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Unlimited">Unlimited Time</SelectItem>
                            <SelectItem value="Time Limit">Time Limit Applied</SelectItem>
                            <SelectItem value="None">No Golden Score (Draws allowed)</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input type="number" placeholder="Standard Match Time (Mins)" onChange={e => handleNestedChange('rules', 'match_duration', e.target.value)} />
                    <Select onValueChange={v => handleNestedChange('rules', 'allowed_grades', v)}>
                        <SelectTrigger><SelectValue placeholder="Allowed Grades" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Kyu Only">Kyu Grades Only</SelectItem>
                            <SelectItem value="Dan Only">Dan Grades Only</SelectItem>
                            <SelectItem value="Open">Open to All Grades</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            );
        }
        if (sportLower === 'tennis') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'surface', v)}>
                        <SelectTrigger><SelectValue placeholder="Court Surface" /></SelectTrigger>
                        <SelectContent><SelectItem value="Hard">Hard Court</SelectItem><SelectItem value="Clay">Clay Court</SelectItem><SelectItem value="Grass">Grass Court</SelectItem></SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'format', v)}>
                        <SelectTrigger><SelectValue placeholder="Match Format" /></SelectTrigger>
                        <SelectContent><SelectItem value="Best of 3">Best of 3 Sets</SelectItem><SelectItem value="Best of 5">Best of 5 Sets</SelectItem><SelectItem value="Pro Set">Pro Set (8 Games)</SelectItem></SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'tiebreak', v)}>
                        <SelectTrigger><SelectValue placeholder="Tiebreak Rules" /></SelectTrigger>
                        <SelectContent><SelectItem value="Standard">Standard (First to 7)</SelectItem><SelectItem value="Super">Super Tiebreak (First to 10)</SelectItem></SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'event_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Event Type" /></SelectTrigger>
                        <SelectContent><SelectItem value="Singles">Singles</SelectItem><SelectItem value="Doubles">Doubles</SelectItem></SelectContent>
                    </Select>
                </div>
            );
        }
        if (sportLower === 'basketball') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'court_size', v)}>
                        <SelectTrigger><SelectValue placeholder="Court Type" /></SelectTrigger>
                        <SelectContent><SelectItem value="Full Court 5v5">Full Court (5v5)</SelectItem><SelectItem value="Half Court 3v3">Half Court (3v3)</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Quarter Duration (Mins)" onChange={e => handleNestedChange('rules', 'quarter_duration', e.target.value)} />
                    <Input type="number" placeholder="Overtime Duration (Mins)" onChange={e => handleNestedChange('rules', 'overtime_duration', e.target.value)} />
                    <Input type="number" placeholder="Shot Clock (Seconds)" onChange={e => handleNestedChange('rules', 'shot_clock', e.target.value)} />
                </div>
            );
        }
        if (sportLower === 'volleyball') {
            return (
                <div className="space-y-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Select onValueChange={v => handleNestedChange('rules', 'format', v)}>
                        <SelectTrigger><SelectValue placeholder="Match Format" /></SelectTrigger>
                        <SelectContent><SelectItem value="Best of 3">Best of 3 Sets</SelectItem><SelectItem value="Best of 5">Best of 5 Sets</SelectItem></SelectContent>
                    </Select>
                    <Select onValueChange={v => handleNestedChange('rules', 'court_type', v)}>
                        <SelectTrigger><SelectValue placeholder="Court Type" /></SelectTrigger>
                        <SelectContent><SelectItem value="Indoor">Indoor (Hardwood)</SelectItem><SelectItem value="Beach">Beach (Sand)</SelectItem><SelectItem value="Grass">Grass</SelectItem></SelectContent>
                    </Select>
                    <Input type="number" placeholder="Points per Set (Standard)" onChange={e => handleNestedChange('rules', 'points_per_set', e.target.value)} />
                    <Input type="number" placeholder="Points for Deciding Set" onChange={e => handleNestedChange('rules', 'deciding_set_points', e.target.value)} />
                </div>
            );
        }
        
        return <p className="text-muted-foreground text-center bg-white/5 p-4 rounded-lg col-span-full">Select a sport in Step 1 for deep configurations.</p>;
    };

    const CurrentCurrencyIcon = CURRENCIES.find(c => c.value === formData.currency)?.icon || IndianRupee;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto p-4 sm:p-8">
                
                <div className="mb-10 text-center">
                    <h1 className="text-4xl font-extrabold font-headline mb-4 tracking-tight">Create Tournament</h1>
                    <div className="flex justify-between items-center max-w-3xl mx-auto relative before:absolute before:top-1/2 before:w-full before:h-1 before:bg-white/10 before:-z-10">
                        {steps.map((step, index) => {
                            const isActive = index === currentStep;
                            const isPast = index < currentStep;
                            const Icon = step.icon;
                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-background px-2">
                                    <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${isActive ? 'border-primary bg-primary/20 text-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]' : isPast ? 'border-primary bg-primary text-primary-foreground' : 'border-white/20 bg-white/5 text-muted-foreground'}`}>
                                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                                    </div>
                                    <span className={`hidden sm:block text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>{step.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <GlassCard className="p-6 sm:p-10 border-white/10 shadow-2xl relative overflow-hidden">
                    <AnimatePresence mode="wait">
                        
                        {currentStep === 0 && (
                            <motion.div key="step0" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-6">Core Identity <span className="text-red-500">*</span></h2>
                                
                                <div className="border-2 border-dashed border-white/20 rounded-xl p-8 text-center hover:border-primary/50 transition-colors relative group">
                                    {formData.banner_url && <img src={formData.banner_url} alt="Banner" className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-40" />}
                                    <div className="relative z-10 flex flex-col items-center gap-3">
                                        <Upload className={`w-10 h-10 ${formData.banner_url ? 'text-white' : 'text-muted-foreground'}`} />
                                        <p className="font-medium">{uploading ? 'Uploading...' : 'Upload Tournament Banner (Optional)'}</p>
                                        <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    </div>
                                </div>

                                <Input className="h-14 text-lg bg-white/5" placeholder="Tournament Title (e.g., Summer Showdown)" value={formData.name} onChange={e => handleInputChange('name', e.target.value)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <Select onValueChange={v => handleInputChange('sport', v)} value={formData.sport}>
                                        <SelectTrigger className="h-14 bg-white/5"><SelectValue placeholder="Select Primary Sport" /></SelectTrigger>
                                        <SelectContent>{SPORTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select onValueChange={v => handleInputChange('level', v)} value={formData.level}>
                                        <SelectTrigger className="h-14 bg-white/5"><SelectValue placeholder="Tournament Tier" /></SelectTrigger>
                                        <SelectContent>{LEVELS.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 1 && (
                            <motion.div key="step1" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-6">Logistics & Scheduling <span className="text-red-500">*</span></h2>
                                <Input className="h-14 bg-white/5" placeholder="Venue / City" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2"><label className="text-sm font-semibold text-muted-foreground">Start Date</label><Input type="date" className="h-14 bg-white/5" value={formData.start_date} onChange={e => handleInputChange('start_date', e.target.value)} /></div>
                                    <div className="space-y-2"><label className="text-sm font-semibold text-muted-foreground">End Date</label><Input type="date" className="h-14 bg-white/5" value={formData.end_date} onChange={e => handleInputChange('end_date', e.target.value)} /></div>
                                </div>
                                <Select onValueChange={v => handleInputChange('format', v)} value={formData.format}>
                                    <SelectTrigger className="h-14 bg-white/5"><SelectValue placeholder="Tournament Format" /></SelectTrigger>
                                    <SelectContent>{FORMATS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
                                </Select>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Maximum Teams Allowed (Leave 0 for No Limit)</label>
                                    <Input 
                                        type="number" 
                                        min="0" 
                                        placeholder="e.g. 16, 32, 100" 
                                        className="h-14 bg-white/5" 
                                        value={formData.max_teams} 
                                        onChange={e => handleInputChange('max_teams', e.target.value ? parseInt(e.target.value, 10) : 0)} 
                                    />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 2 && (
                            <motion.div key="step2" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-6">Operations & Registration <span className="text-red-500">*</span></h2>
                                
                                <Select onValueChange={v => handleInputChange('registration_mode', v)} value={formData.registration_mode}>
                                    <SelectTrigger className="h-14 bg-white/5"><SelectValue placeholder="Registration Mode" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open / Announcement (Anyone can register or view)</SelectItem>
                                        <SelectItem value="invite">Invite Only (You invite specific coaches/teams)</SelectItem>
                                        <SelectItem value="final">Final Tournament (Teams ready, go straight to Bracketing)</SelectItem>
                                    </SelectContent>
                                </Select>

                                {formData.registration_mode === 'invite' && (
                                    <motion.div initial={{opacity:0, y:10}} animate={{opacity:1, y:0}} className="p-5 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                        <div>
                                            <h3 className="font-semibold text-sm">Select Coaches to Invite <span className="text-muted-foreground font-normal">(Optional)</span></h3>
                                            <p className="text-xs text-muted-foreground">We found coaches matching your selected sport ({formData.sport}). You can select up to {formData.max_teams || 'an unlimited number of'} teams.</p>
                                        </div>
                                        
                                        {fetchingCoaches ? (
                                            <div className="flex gap-4 overflow-hidden"><div className="w-48 h-20 bg-white/10 animate-pulse rounded-xl" /><div className="w-48 h-20 bg-white/10 animate-pulse rounded-xl" /></div>
                                        ) : availableCoaches.length > 0 ? (
                                            <div className="flex overflow-x-auto gap-4 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                                                {availableCoaches.map((coach: any) => {
                                                    const isSelected = invitedCoaches.includes(coach.id);
                                                    return (
                                                        <div 
                                                            key={coach.id} 
                                                            onClick={() => toggleCoachInvite(coach.id)}
                                                            className={`flex-shrink-0 w-56 p-3 rounded-xl border cursor-pointer transition-all flex items-center gap-3 
                                                                ${isSelected ? 'border-primary bg-primary/10 shadow-[0_0_15px_rgba(var(--primary-rgb),0.15)]' : 'border-white/10 bg-black/20 hover:bg-white/5'}`}
                                                        >
                                                            <Avatar className="w-10 h-10 border border-white/10">
                                                                <AvatarImage src={coach.profiles?.avatar_url} />
                                                                <AvatarFallback className="text-xs bg-white/5">{coach.profiles?.name?.charAt(0)}</AvatarFallback>
                                                            </Avatar>
                                                            <div className="overflow-hidden">
                                                                <h4 className="text-sm font-bold truncate">{coach.profiles?.name}</h4>
                                                                <p className="text-[10px] text-muted-foreground truncate">{coach.profiles?.city} • {coach.certifications || 'Coach'}</p>
                                                            </div>
                                                            {isSelected && <CheckCircle2 className="w-4 h-4 text-primary ml-auto shrink-0" />}
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-muted-foreground italic">No coaches found for {formData.sport} yet.</p>
                                        )}
                                    </motion.div>
                                )}

                                {formData.registration_mode !== 'final' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Registration Deadline <span className="text-red-500">*</span></label>
                                        <Input type="date" className="h-14 bg-white/5" value={formData.registration_deadline} onChange={e => handleInputChange('registration_deadline', e.target.value)} />
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-muted-foreground">Contact Email (For Queries)</label>
                                    <Input type="email" placeholder="organizer@example.com" className="h-14 bg-white/5" value={formData.contact_email} onChange={e => handleInputChange('contact_email', e.target.value)} />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 3 && (
                            <motion.div key="step3" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-6">Financials <span className="text-red-500">*</span></h2>
                                
                                <div className="space-y-2 mb-6">
                                    <label className="text-sm font-semibold text-muted-foreground">Currency</label>
                                    <Select onValueChange={v => handleInputChange('currency', v)} value={formData.currency}>
                                        <SelectTrigger className="h-14 bg-white/5 w-1/3"><SelectValue placeholder="Currency" /></SelectTrigger>
                                        <SelectContent>{CURRENCIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Entry Fee (Per Team/Player) <span className="text-red-500">*</span></label>
                                        <div className="relative"><CurrentCurrencyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" /><Input type="number" className="h-14 pl-10 bg-white/5 text-lg" placeholder="e.g. 5000 (0 for Free)" value={formData.entry_fee} onChange={e => handleInputChange('entry_fee', e.target.value)} /></div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-muted-foreground">Total Prize Pool <span className="text-muted-foreground font-normal">(Optional)</span></label>
                                        <div className="relative"><CurrentCurrencyIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-green-400" /><Input type="number" className="h-14 pl-10 bg-white/5 text-lg font-bold text-green-400" placeholder="e.g. 50000" value={formData.prize_pool} onChange={e => handleInputChange('prize_pool', e.target.value)} /></div>
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                    <h3 className="font-bold text-lg mb-2">Prize Breakdown <span className="text-muted-foreground font-normal text-sm">(Optional)</span></h3>
                                    <Input className="bg-background/50" placeholder="1st Place (e.g. 25000 + Trophy)" onChange={e => handleNestedChange('prizes', 'first', e.target.value)} />
                                    <Input className="bg-background/50" placeholder="2nd Place" onChange={e => handleNestedChange('prizes', 'second', e.target.value)} />
                                    <Input className="bg-background/50" placeholder="MVP / Best Player" onChange={e => handleNestedChange('prizes', 'mvp', e.target.value)} />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 4 && (
                            <motion.div key="step4" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-6">Rules & Deep Config</h2>
                                
                                {renderSportRules()}

                                {/* --- NEW DYNAMIC CATEGORY BUILDER --- */}
                                <div className="mt-12 space-y-4 bg-black/20 p-6 rounded-2xl border border-white/5">
                                    <div className="flex items-center justify-between border-b border-white/10 pb-4">
                                        <div>
                                            <h3 className="text-xl font-bold">Registration Categories</h3>
                                            <p className="text-xs text-muted-foreground mt-1">Create multiple groups for coaches to register their players under (e.g., Weight Classes, Age, Gender).</p>
                                        </div>
                                        <Button variant="outline" size="sm" onClick={handleAddCategory} className="bg-white/5 hover:bg-white/10 shrink-0">
                                            <Plus className="w-4 h-4 mr-2" /> Add Category
                                        </Button>
                                    </div>

                                    {formData.custom_categories.map((cat) => (
                                        <div key={cat.id} className="p-5 bg-white/5 border border-white/10 rounded-xl space-y-4 relative group">
                                            <div className="flex flex-col sm:flex-row gap-4 items-start">
                                                <div className="flex-1 space-y-2 w-full">
                                                    <Label className="text-muted-foreground">Category Name</Label>
                                                    <Input 
                                                        placeholder="e.g., Weight Class, Gender, Belt" 
                                                        value={cat.name} 
                                                        onChange={e => handleCategoryNameChange(cat.id, e.target.value)} 
                                                        className="bg-black/40 border-white/10 h-12 font-bold" 
                                                    />
                                                </div>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    onClick={() => handleRemoveCategory(cat.id)} 
                                                    className="mt-8 text-red-400 hover:text-red-300 hover:bg-red-500/10 shrink-0"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>

                                            <div className="space-y-2">
                                                <Label className="text-muted-foreground">Add Sub-Categories / Options</Label>
                                                <div className="flex gap-2">
                                                    <Input
                                                        placeholder="e.g., -61kg, +55kg, Male, U18..."
                                                        value={categoryInputVals[cat.id] || ''}
                                                        onChange={e => setCategoryInputVals(prev => ({...prev, [cat.id]: e.target.value}))}
                                                        onKeyDown={e => {
                                                            if (e.key === 'Enter') {
                                                                e.preventDefault();
                                                                handleAddCategoryOption(cat.id);
                                                            }
                                                        }}
                                                        className="bg-black/40 border-white/10"
                                                    />
                                                    <Button variant="secondary" onClick={() => handleAddCategoryOption(cat.id)} className="shrink-0 bg-primary/20 text-primary hover:bg-primary/30">
                                                        <Plus className="w-5 h-5" />
                                                    </Button>
                                                </div>
                                                
                                                {cat.options.length > 0 && (
                                                    <div className="flex flex-wrap gap-2 mt-4 pt-2">
                                                        {cat.options.map((opt, optIdx) => (
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
                                    {formData.custom_categories.length === 0 && (
                                        <div className="text-center py-8 text-muted-foreground text-sm italic">
                                            No custom categories added. (Players will register in one single open group).
                                        </div>
                                    )}
                                </div>

                                <div className="mt-8 space-y-2 border-t border-white/10 pt-8">
                                    <label className="text-sm font-semibold text-muted-foreground">Additional Rules & Notes</label>
                                    <Textarea 
                                        placeholder="Any specific instructions, dress codes, or behavior guidelines for participants..." 
                                        className="min-h-[120px] bg-white/5"
                                        value={formData.additional_rules}
                                        onChange={e => handleInputChange('additional_rules', e.target.value)}
                                    />
                                </div>
                            </motion.div>
                        )}

                        {currentStep === 5 && (
                            <motion.div key="step5" initial={{opacity:0, x:20}} animate={{opacity:1, x:0}} exit={{opacity:0, x:-20}} className="space-y-6">
                                <h2 className="text-2xl font-bold border-b border-white/10 pb-4 mb-6">Final Review</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10"><p className="text-xs text-muted-foreground uppercase">Tournament Name</p><p className="font-bold text-lg">{formData.name}</p></div>
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10"><p className="text-xs text-muted-foreground uppercase">Sport & Level</p><p className="font-bold text-lg capitalize">{formData.sport} ({formData.level})</p></div>
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10"><p className="text-xs text-muted-foreground uppercase">Mode</p><p className="font-bold text-lg capitalize text-primary">{formData.registration_mode}</p></div>
                                    <div className="p-4 bg-white/5 rounded-lg border border-white/10"><p className="text-xs text-muted-foreground uppercase">Prize Pool</p><p className="font-bold text-lg text-green-400">{formData.prize_pool ? `${formData.currency} ${formData.prize_pool}` : 'None Set'}</p></div>
                                </div>
                            </motion.div>
                        )}

                    </AnimatePresence>

                    {/* Validation Error Banner */}
                    {!isStepValid() && currentStep < steps.length - 1 && (
                        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-400 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2 shrink-0" /> {getValidationError()}
                        </div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="mt-8 flex justify-between items-center pt-6 border-t border-white/10">
                        <Button variant="ghost" className="hover:bg-white/5" onClick={handlePrev} disabled={currentStep === 0 || loading}>
                            <ChevronLeft className="w-5 h-5 mr-2" /> Back
                        </Button>

                        {currentStep < steps.length - 1 ? (
                            <Button size="lg" className="px-8" onClick={handleNext} disabled={!isStepValid()}>
                                Continue <ChevronRight className="w-5 h-5 ml-2" />
                            </Button>
                        ) : (
                            <Button size="lg" className="px-8 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)] transition-shadow" onClick={handleSubmit} disabled={loading}>
                                {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Upload className="w-5 h-5 mr-2" />}
                                {formData.registration_mode === 'final' ? 'Proceed to Bracketing' : 'Publish Tournament'}
                            </Button>
                        )}
                    </div>
                </GlassCard>
            </div>
        </DashboardLayout>
    );
}
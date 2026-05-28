'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabaseClient'
import { ArrowRight, ArrowLeft, User, Cake, VenetianMask, Trophy, Briefcase, Users, Shield, Zap, CircleDot, Hand, PersonStanding } from 'lucide-react'

import GlassCard from '@/components/glass/GlassCard'
import GlassButton from '@/components/glass/GlassButton'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const OnboardingPage = () => {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<any>({
    name: '',
    age: '',
    gender: '',
    role: '',
    sport: '',
    sportSpecifics: {},
    experience: '',
    team: '',
    organization: '',
    eventTypes: '',
    certifications: '',
  })
  const router = useRouter()

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      const { data: { user } } = await supabase.auth.getUser()

      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', user.id)
          .single()

        if (profile?.onboarding_completed) {
          router.push('/dashboard')
        }
      }
    }

    checkOnboardingStatus()
  }, [router])

  const handleNext = () => setStep(step + 1)
  const handlePrevious = () => setStep(step - 1)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }))
  }
  
  const handleSportSpecificsChange = (name: string, value: string) => {
    setFormData((prev: any) => ({ 
      ...prev, 
      sportSpecifics: {
        ...prev.sportSpecifics,
        [name]: value
      }
    }))
  }

  const handleSubmit = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // 1. Save the core profile data
      const { error: profileError } = await supabase.from('profiles').upsert({
        id: user.id,
        name: formData.name,
        age: parseInt(formData.age, 10),
        gender: formData.gender,
        role: formData.role, // Saving the role here is best practice
        onboarding_completed: true,
      })
    
      if (profileError) {
        console.error('Error saving profile:', profileError)
        setLoading(false);
        return;
      }
    
        // 2. Save Role-Specific Data explicitly
      if (formData.role === 'player') {
        const { error: playerError } = await supabase.from('players').upsert({
          id: user.id, // Using the same user ID to link tables
          sport: formData.sport,
          sport_specifics: formData.sportSpecifics,
          experience: formData.experience,
          team: formData.team,
        })
        if (playerError) console.error('Error saving player profile:', playerError)
      }
    
      if (formData.role === 'coach') {
        const { error: coachError } = await supabase.from('coaches').upsert({
          id: user.id,
          sport: formData.sport,
          // You can map other coach-specific fields here as your form grows
        })
        if (coachError) console.error('Error saving coach profile:', coachError)
      }
    
      if (formData.role === 'organizer') {
        const { error: organizerError } = await supabase.from('organizers').upsert({
          id: user.id,
          organization_name: formData.organization,
        })
        if (organizerError) console.error('Error saving organizer profile:', organizerError)
      }
    
      router.push('/dashboard')
    }
    setLoading(false);
  }

  const totalSteps = formData.role === 'player' ? 4 : 3;
  
  const isStepValid = (() => {
    switch (step) {
      case 1: {
        const ageNum = parseInt(formData.age, 10);
        const isAgeValid = !isNaN(ageNum) && ageNum >= 5 && ageNum <= 120;
        return !!(formData.name && formData.age && isAgeValid && formData.gender);
      }
      case 2:
        return !!formData.role;
      case 3:
        if (formData.role === 'player' || formData.role === 'coach') {
            return !!formData.sport;
        }
        if (formData.role === 'organizer') {
            return !!formData.organization;
        }
        return false;
      case 4:
        if (formData.role === 'player') {
            const specifics = formData.sportSpecifics as any;
            switch (formData.sport) {
                case 'cricket':
                    if (!specifics.role) return false;
                    if (specifics.role === 'batsman') return !!specifics.batting_style;
                    if (specifics.role === 'bowler') return !!specifics.bowling_style;
                    if (specifics.role === 'all_rounder') return !!(specifics.batting_style && specifics.bowling_style);
                    return false;
                case 'kabaddi':
                    return !!(specifics.position && specifics.specialty);
                case 'badminton':
                    return !!(specifics.playing_style && specifics.strong_hand);
                case 'football':
                    return !!(specifics.position && specifics.foot);
                case 'wrestling': {
                    const weightNum = parseInt(specifics.weight_class, 10);
                    const isWeightValid = !isNaN(weightNum) && weightNum >= 1 && weightNum <= 200;
                    return !!(specifics.style && specifics.weight_class && isWeightValid);
                }
                default:
                    return true;
            }
        }
        return true;
      default:
        return false;
    }
  })();

  const renderStep = () => {
     switch (step) {
      case 1:
        return (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
            <h2 className='text-3xl font-bold text-foreground'>Tell us about yourself</h2>
            <div className='flex items-center gap-4'>
              <User className='w-6 h-6 text-primary' />
              <div className='w-full'>
                <Label htmlFor='name'>Full Name</Label>
                <Input id='name' name='name' placeholder='e.g. John Doe' onChange={handleInputChange} value={formData.name} />
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <Cake className='w-6 h-6 text-primary' />
              <div className='w-full'>
                <Label htmlFor='age'>Age</Label>
                <Input id='age' name='age' type='number' placeholder='e.g. 25' onChange={handleInputChange} value={formData.age} />
              </div>
            </div>
            <div className='flex items-center gap-4'>
              <VenetianMask className='w-6 h-6 text-primary' />
              <div className='w-full'>
                <Label htmlFor='gender'>Gender</Label>
                <Select onValueChange={(value) => handleSelectChange('gender', value)} value={formData.gender}>
                  <SelectTrigger><SelectValue placeholder='Select your gender' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='male'>Male</SelectItem>
                    <SelectItem value='female'>Female</SelectItem>
                    <SelectItem value='other'>Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )
      case 2:
        return (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
            <h2 className='text-3xl font-bold text-foreground'>What is your role?</h2>
            <div className='flex items-center gap-4'>
              <Users className='w-6 h-6 text-primary' />
              <div className='w-full'>
                <Label htmlFor='role'>Role</Label>
                <Select onValueChange={(value) => handleSelectChange('role', value)} value={formData.role}>
                  <SelectTrigger><SelectValue placeholder='Select your role' /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value='player'>Player</SelectItem>
                    <SelectItem value='coach'>Coach</SelectItem>
                    <SelectItem value='organizer'>Organizer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </motion.div>
        )
      case 3:
        if (formData.role === 'player' || formData.role === 'coach') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground'>Select your Sport</h2>
                    <div className='flex items-center gap-4'>
                    <Trophy className='w-6 h-6 text-primary' />
                    <div className='w-full'>
                        <Label htmlFor='sport'>Primary Sport</Label>
                        <Select onValueChange={(value) => handleSelectChange('sport', value)} value={formData.sport}>
                        <SelectTrigger><SelectValue placeholder='Select your sport' /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value='cricket'>Cricket</SelectItem>
                            <SelectItem value='kabaddi'>Kabaddi</SelectItem>
                            <SelectItem value='badminton'>Badminton</SelectItem>
                            <SelectItem value='football'>Football</SelectItem>
                            <SelectItem value='wrestling'>Wrestling</SelectItem>
                        </SelectContent>
                        </Select>
                    </div>
                    </div>
                </motion.div>
            )
        }
        if (formData.role === 'organizer') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground'>Organization Details</h2>
                    <div className='flex items-center gap-4'>
                        <Briefcase className='w-6 h-6 text-primary' />
                        <div className='w-full'>
                            <Label htmlFor='organization'>Organization Name</Label>
                            <Input id='organization' name='organization' placeholder='e.g. Elite Sports Management' onChange={handleInputChange} value={formData.organization} />
                        </div>
                    </div>
                </motion.div>
            )
        }
        return null;
      case 4:
        if (formData.role === 'player') {
            return (
                <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5 }} className='space-y-6'>
                    <h2 className='text-3xl font-bold text-foreground'>Sport Specifics</h2>
                    {renderSportSpecificStep()}
                </motion.div>
            )
        }
        return null;
      default:
        return null
    }
  }
  
  const renderSportSpecificStep = () => {
    const specifics = formData.sportSpecifics as any;
     switch (formData.sport) {
      case 'cricket':
        return (
          <div className='space-y-4'>
            <Label>Role</Label>
            <Select onValueChange={(value) => handleSportSpecificsChange('role', value)} value={specifics.role}>
                <SelectTrigger><SelectValue placeholder='Select your role' /></SelectTrigger>
                <SelectContent>
                    <SelectItem value='batsman'>Batsman</SelectItem>
                    <SelectItem value='bowler'>Bowler</SelectItem>
                    <SelectItem value='all_rounder'>All-rounder</SelectItem>
                </SelectContent>
            </Select>

            {(specifics.role === 'batsman' || specifics.role === 'all_rounder') && (<>
                <Label>Batting Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('batting_style', value)} value={specifics.batting_style}><SelectTrigger><SelectValue placeholder='Select batting style' /></SelectTrigger><SelectContent><SelectItem value='right_handed'>Right-handed</SelectItem><SelectItem value='left_handed'>Left-handed</SelectItem></SelectContent></Select>
            </>)}

            {(specifics.role === 'bowler' || specifics.role === 'all_rounder') && (<>
                <Label>Bowling Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('bowling_style', value)} value={specifics.bowling_style}><SelectTrigger><SelectValue placeholder='Select bowling style' /></SelectTrigger><SelectContent><SelectItem value='right_arm'>Right-arm</SelectItem><SelectItem value='left_arm'>Left-arm</SelectItem></SelectContent></Select>
            </>)}
          </div>
        )
      case 'kabaddi':
        return (
            <div className='space-y-4'>
                <Label>Position</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('position', value)} value={specifics.position}><SelectTrigger><SelectValue placeholder='Select your position' /></SelectTrigger><SelectContent><SelectItem value='raider'>Raider</SelectItem><SelectItem value='defender'>Defender</SelectItem></SelectContent></Select>
                <Label>Specialty</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('specialty', value)} value={specifics.specialty}><SelectTrigger><SelectValue placeholder='Select your specialty' /></SelectTrigger><SelectContent><SelectItem value='toe_touch'>Toe Touch</SelectItem><SelectItem value='hand_touch'>Hand Touch</SelectItem><SelectItem value='ankle_hold'>Ankle Hold</SelectItem><SelectItem value='thigh_hold'>Thigh Hold</SelectItem></SelectContent></Select>
            </div>
        )
      case 'badminton':
        return (
            <div className='space-y-4'>
                <Label>Playing Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('playing_style', value)} value={specifics.playing_style}><SelectTrigger><SelectValue placeholder='Select playing style' /></SelectTrigger><SelectContent><SelectItem value='singles'>Singles</SelectItem><SelectItem value='doubles'>Doubles</SelectItem><SelectItem value='mixed_doubles'>Mixed Doubles</SelectItem></SelectContent></Select>
                <Label>Strong Hand</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('strong_hand', value)} value={specifics.strong_hand}><SelectTrigger><SelectValue placeholder='Select strong hand' /></SelectTrigger><SelectContent><SelectItem value='right'>Right</SelectItem><SelectItem value='left'>Left</SelectItem></SelectContent></Select>
            </div>
        )
      case 'football':
        return (
            <div className='space-y-4'>
                <Label>Preferred Position</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('position', value)} value={specifics.position}><SelectTrigger><SelectValue placeholder='Select preferred position' /></SelectTrigger><SelectContent><SelectItem value='goalkeeper'>Goalkeeper</SelectItem><SelectItem value='defender'>Defender</SelectItem><SelectItem value='midfielder'>Midfielder</SelectItem><SelectItem value='forward'>Forward</SelectItem></SelectContent></Select>
                <Label>Preferred Foot</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('foot', value)} value={specifics.foot}><SelectTrigger><SelectValue placeholder='Select preferred foot' /></SelectTrigger><SelectContent><SelectItem value='right'>Right</SelectItem><SelectItem value='left'>Left</SelectItem><SelectItem value='both'>Both</SelectItem></SelectContent></Select>
            </div>
        )
      case 'wrestling':
        return (
            <div className='space-y-4'>
                <Label>Style</Label>
                <Select onValueChange={(value) => handleSportSpecificsChange('style', value)} value={specifics.style}><SelectTrigger><SelectValue placeholder='Select wrestling style' /></SelectTrigger><SelectContent><SelectItem value='freestyle'>Freestyle</SelectItem><SelectItem value='greco_roman'>Greco-Roman</SelectItem></SelectContent></Select>
                <Label>Weight Class (kg)</Label>
                <Input name='weight_class' type='number' placeholder='e.g. 74' value={specifics.weight_class || ''} onChange={(e) => handleSportSpecificsChange(e.target.name, e.target.value)} />
            </div>
        )
      default:
        return <p className='text-muted-foreground'>Please select a sport in the previous step to see more options.</p>
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gray-100'>
      <GlassCard className='w-full max-w-2xl p-8'>
        <div className='flex justify-between items-center mb-8'>
          <h1 className='text-4xl font-headline font-bold text-foreground'>Setup Your Profile</h1>
          <div className='text-sm font-bold text-primary'>Step {step} of {totalSteps}</div>
        </div>

        {renderStep()}

        <div className='flex justify-between mt-12'>
          {step > 1 ? (
            <GlassButton onClick={handlePrevious} variant='outline' className='group text-foreground border-foreground/20 hover:bg-foreground/5'>
              <ArrowLeft className='mr-2 group-hover:-translate-x-1 transition-transform' /> Previous
            </GlassButton>
          ) : <div />} 

          {step < totalSteps ? (
            <GlassButton onClick={handleNext} disabled={!isStepValid} className='group'>
              Next <ArrowRight className='ml-2 group-hover:translate-x-1 transition-transform' />
            </GlassButton>
          ) : (
            <GlassButton onClick={handleSubmit} disabled={!isStepValid || loading} className='group'>
              {loading ? 'Saving...' : 'Finish'}
              {!loading && <ArrowRight className='ml-2 group-hover:translate-x-1 transition-transform' />}
            </GlassButton>
          )}
        </div>
      </GlassCard>
    </div>
  )
}

export default OnboardingPage

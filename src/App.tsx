import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import AuthScreen from './AuthScreen'
import PasswordResetScreen from './PasswordResetScreen'
import { supabase } from './supabase'
import { loadWorkoutLibrary, type Goal, type WorkoutExercise, type WorkoutLocation, type WorkoutSession } from './workoutLibrary'
import './App.css'

type CalorieBasis = 'female' | 'male' | 'neutral'
type Profile = {
  name: string
  email: string
  goal: Goal
  workoutLocation: WorkoutLocation
  weight: number
  height: number
  age: number
  calorieBasis: CalorieBasis
  sessions: number
  trainingDays: number[]
  gymTime: string
}
type Page = 'Overview' | 'Workouts' | 'Nutrition' | 'Progress'
type ExerciseProgress = { currentSet: number; restSeconds: number; isResting: boolean }

const initialProfile: Profile = {
  name: 'Friend',
  email: '',
  goal: 'Get fitter',
  workoutLocation: 'Gym',
  weight: 70,
  height: 170,
  age: 30,
  calorieBasis: 'neutral',
  sessions: 3,
  trainingDays: [0, 2, 5],
  gymTime: '18:00',
}

const quotes = [
  { text: 'The only bad workout is the one that didn’t happen.', author: 'Unknown' },
  { text: 'It never gets easier. You just get stronger.', author: 'Greg LeMond' },
  { text: 'You don’t have to be extreme, just consistent.', author: 'Unknown' },
  { text: 'The secret of getting ahead is getting started.', author: 'Mark Twain' },
]

const navItems: { label: Page; icon: string }[] = [
  { label: 'Overview', icon: 'grid' },
  { label: 'Workouts', icon: 'dumbbell' },
  { label: 'Nutrition', icon: 'leaf' },
  { label: 'Progress', icon: 'chart' },
]

const workoutDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']
const fullWeekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
function timeOfDay(time: string) {
  const hour = Number(time.split(':')[0])
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function formatGymTime(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return new Date(2000, 0, 1, hour, minute).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function restDurationSeconds(rest: string) {
  const match = rest.match(/(\d+)\s*(sec|min)/i)
  if (!match) return 0
  return Number(match[1]) * (match[2].toLowerCase() === 'min' ? 60 : 1)
}

function speakCoach(message: string) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const utterance = new SpeechSynthesisUtterance(message)
  utterance.lang = 'en-US'
  utterance.rate = 0.95
  window.speechSynthesis.speak(utterance)
}

function defaultTrainingDays(sessions: number) {
  const schedule: Record<number, number[]> = {
    2: [0, 3],
    3: [0, 2, 5],
    4: [0, 1, 3, 5],
    5: [0, 1, 3, 4, 5],
    6: [0, 1, 2, 4, 5, 6],
  }
  return schedule[sessions] ?? schedule[3]
}

function workoutWeekIndex(date = new Date()) {
  const monday = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
  monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7))
  return Math.floor((monday.getTime() - Date.UTC(1970, 0, 5)) / (7 * 24 * 60 * 60 * 1000))
}

function buildWorkouts(library: WorkoutSession[], selectedDays: number[], rotationOffset = 0) {
  const activeDays = new Set(selectedDays)
  let workoutIndex = rotationOffset

  return workoutDays.map((day, index) => {
    if (!activeDays.has(index)) {
      return {
        day,
        title: day === 'SUN' ? 'Rest & reset' : 'Rest & recover',
        meta: 'Stretch, walk, or take it easy',
        duration: 'Rest',
        icon: '♡',
      }
    }

    const session = library[workoutIndex % library.length]
    workoutIndex += 1
    return {
      day,
      title: session.title,
      meta: session.meta,
      duration: session.duration,
      icon: '↗',
      session,
    }
  })
}

function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.7,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true as const,
  }

  const paths: Record<string, ReactNode> = {
    grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
    dumbbell: <><path d="m6.5 6.5 11 11M5 9l4-4M15 19l4-4M3.5 7.5l3-3M17.5 19.5l3-3M3 11l3-3M16 21l3-3" /></>,
    leaf: <><path d="M20.5 3.5c-8 .2-14.7 2.6-15.4 8.4-.5 4.2 2.6 6.4 5.8 5.5 5.7-1.6 8.5-7.9 9.6-13.9Z" /><path d="M3.5 21c2.4-5.6 6.8-9.5 12.1-12.2" /></>,
    chart: <><path d="M4 19.5V11m5.3 8.5V5m5.4 14.5v-7m5.3 7V8" /><path d="M2.5 20.5h19" /></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    arrow: <><path d="M5 12h14m-6-6 6 6-6 6" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    close: <><path d="m18 6-12 12M6 6l12 12" /></>,
    flame: <><path d="M12 22a7 7 0 0 0 7-7c0-3-1.5-5.3-4-8-.3 2-1 3-2 4-1-4-3-7-6-9 .3 4-1 6-2 9a8 8 0 0 0 7 11Z" /><path d="M12 22a4 4 0 0 0 4-4c0-1.6-.8-2.8-2-4-.3 1-.8 1.6-1.5 2.1-.5-1.8-1.5-3.1-3-4-.1 1.8-.5 2.8-1.2 4A4.2 4.2 0 0 0 12 22Z" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    volume: <><path d="M11 5 6 9H3v6h3l5 4V5Z" /><path d="M15.5 8.5a5 5 0 0 1 0 7m3-10a9 9 0 0 1 0 13" /></>,
    spark: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z" /><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z" /></>,
    plate: <><circle cx="12" cy="12" r="8.5" /><circle cx="12" cy="12" r="5.5" /><path d="M3 4v6m-1.5-6v3m3-3v3M3 10v10m18-16v16m0-16c-2 2-2 5-2 7h2" /></>,
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.5-3.4 3.1-5.5 7-5.5s6.5 2.1 7 5.5" /></>,
    chevron: <path d="m9 18 6-6-6-6" />,
    heart: <path d="M20.8 8.8c0 5.4-8.8 10-8.8 10s-8.8-4.6-8.8-10a4.7 4.7 0 0 1 8.8-2.3 4.7 4.7 0 0 1 8.8 2.3Z" />,
    water: <path d="M12 22a7 7 0 0 0 7-7c0-4-7-13-7-13S5 11 5 15a7 7 0 0 0 7 7Z" />,
    logout: <><path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M12 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5" /></>,
  }
  return <svg {...common}>{paths[name] ?? paths.spark}</svg>
}

function ExerciseVisual({ exercise }: { exercise: WorkoutExercise }) {
  const [failedDemoId, setFailedDemoId] = useState<string | null>(null)
  const demoFailed = failedDemoId === exercise.id
  const demoId: Record<string, string> = {
    'bench-press': 'Barbell_Bench_Press_-_Medium_Grip',
    'shoulder-press': 'Seated_Dumbbell_Press',
    'bentover-row': 'Bent_Over_Barbell_Row',
    'back-squat': 'Barbell_Squat',
    'goblet-squat': 'Goblet_Squat',
    'romanian-deadlift': 'Romanian_Deadlift',
    'walking-lunge': 'Dumbbell_Lunges',
    plank: 'Plank',
    'dead-bug': 'Dead_Bug',
    'incline-press': 'Incline_Dumbbell_Press',
    'lateral-raise': 'Side_Lateral_Raise',
    'triceps-dip': 'Dips_-_Triceps_Version',
    'chin-up': 'Chin-Up',
    'face-pull': 'Face_Pull',
    'hammer-curl': 'Hammer_Curls',
    'leg-press': 'Leg_Press',
    'leg-curl': 'Lying_Leg_Curls',
    'calf-raise': 'Standing_Calf_Raises',
    'dumbbell-bench-press': 'Dumbbell_Bench_Press',
    'bodyweight-squat': 'Bodyweight_Squat',
    'low-impact-mountain-climber': 'Mountain_Climbers',
    'incline-push-up': 'Incline_Push-Up',
    pushups: 'Pushups',
    'backpack-row': 'Bent_Over_Barbell_Row',
    'backpack-rdl': 'Romanian_Deadlift',
    'backpack-curl': 'Barbell_Curl',
    crunches: 'Crunches',
    'air-bike': 'Air_Bike',
    'biceps-curl': 'Barbell_Curl',
    'triceps-pushdown': 'Triceps_Pushdown',
    'cable-row': 'Seated_Cable_Rows',
    row: 'Seated_Cable_Rows',
    'band-press': 'Band_Pull_Apart',
    'band-pull-apart': 'Band_Pull_Apart',
    'mountain-climber': 'Mountain_Climbers',
  }
  const sourceId = demoId[exercise.id]
  if (sourceId && !demoFailed) {
    const source = `https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/${sourceId}`
    return (
      <div className="guided-photo-demo" role="img" aria-label={`${exercise.name} form demonstration, alternating start and movement positions`}>
        <img className="guided-photo-frame guided-photo-start" src={`${source}/0.jpg`} alt={`${exercise.name} start position`} onError={() => setFailedDemoId(exercise.id)} />
        <img className="guided-photo-frame guided-photo-movement" src={`${source}/1.jpg`} alt={`${exercise.name} movement position`} onError={() => setFailedDemoId(exercise.id)} />
        <span className="guided-photo-caption">START <span>→</span> MOVE</span>
        <small className="guided-photo-credit">Free Exercise DB · Unlicense</small>
      </div>
    )
  }
  if (!sourceId || demoFailed) {
    return (
      <div className="guided-demo-unavailable">
        <Icon name="dumbbell" size={25} />
        <strong>No photo demo for this movement yet</strong>
        <span>Use the form steps below as your guide.</span>
        <small>Free Exercise DB · Unlicense</small>
      </div>
    )
  }

  const variant = exercise.visual ?? 'core'
  const accent = variant === 'press' ? '#7bb58d' : variant === 'pull' ? '#dca96a' : variant === 'squat' ? '#7fa8d9' : variant === 'cardio' ? '#e98a68' : variant === 'mobility' ? '#9f8ad0' : '#75b18a'
  const skin = '#f2d2b4'
  const gear = '#243c34'
  const gearLight = '#e3f0e6'
  const shadow = '#dfeae0'

  return (
    <svg viewBox="0 0 220 170" className="guided-illustration" role="img" aria-label={`${exercise.name} exercise illustration`}>
      <defs>
        <linearGradient id={`exercise-bg-${exercise.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor="#f7faf6" />
          <stop offset="100%" stopColor="#edf4ee" />
        </linearGradient>
        <linearGradient id={`exercise-accent-${exercise.id}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={accent} stopOpacity="0.9" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.55" />
        </linearGradient>
      </defs>
      <rect x="12" y="12" width="196" height="146" rx="22" fill={`url(#exercise-bg-${exercise.id})`} />
      <circle cx="52" cy="42" r="11" fill={accent} opacity="0.18" />
      <circle cx="164" cy="126" r="18" fill={accent} opacity="0.15" />

      <g opacity="0.8">
        <path d="M38 124c18-8 35-7 52 4 17 10 27 15 40 18 15 3 26-2 38-8 17-8 29-19 43-16" fill="none" stroke={shadow} strokeWidth="1.2" strokeLinecap="round" />
      </g>

      {variant === 'press' && (
        <>
          <g>
            <path d="M80 48c0-9 7-16 16-16h22c10 0 18 7 18 16v18h-56V48Z" fill={gear} opacity="0.95" />
            <path d="M94 66h32c8 0 14 6 14 14v18c0 11-9 20-20 20h-18c-11 0-20-9-20-20V80c0-8 6-14 14-14Z" fill={skin} />
            <path d="M88 69l-16 16 9 7 17-13" fill="none" stroke={gear} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M132 69l16 16-9 7-17-13" fill="none" stroke={gear} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M92 92l-16 22" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M128 92l16 22" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M76 116l-18 29" stroke={gear} strokeWidth="8" strokeLinecap="round" />
            <path d="M144 116l18 29" stroke={gear} strokeWidth="8" strokeLinecap="round" />
            <path d="M91 81v24M129 81v24" stroke={gearLight} strokeWidth="4" strokeLinecap="round" />
            <path d="M72 51h12l8 10-12 10H68l-4-10 8-10Z" fill={`url(#exercise-accent-${exercise.id})`} opacity="0.85" />
            <path d="M148 51h-12l-8 10 12 10h12l4-10-8-10Z" fill={`url(#exercise-accent-${exercise.id})`} opacity="0.85" />
            <path d="M109 42c6 0 11 4 11 10s-5 10-11 10-11-4-11-10 5-10 11-10Z" fill={skin} />
            <path d="M110 38c-5 0-8 3-8 7 0 2 2 4 4 5 3 2 5 4 8 4 3 0 5-2 8-4 2-1 4-3 4-5 0-4-3-7-8-7h-8Z" fill={skin} />
            <path d="M101 39c3 2 4 3 9 3s6-1 9-3" stroke={gear} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M78 129c12 8 17 11 32 14" stroke={accent} strokeWidth="7" strokeLinecap="round" fill="none" />
            <path d="M142 129c-12 8-17 11-32 14" stroke={accent} strokeWidth="7" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {variant === 'pull' && (
        <>
          <g>
            <path d="M90 35c-11 0-20 8-20 18v18h60V53c0-10-9-18-20-18h-20Z" fill={gear} />
            <path d="M92 74c0-8 7-15 16-15s16 7 16 15v33H92V74Z" fill={skin} />
            <path d="M78 79l-18 16" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M142 79l18 16" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M99 107l-17 28" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M121 107l17 28" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M94 64l12-12 12 12" stroke={gear} strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M56 101c9-11 18-14 31-15" stroke={accent} strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M164 101c-9-11-18-14-31-15" stroke={accent} strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M109 38c5 0 10 4 10 9 0 7-5 12-10 12s-10-5-10-12c0-5 5-9 10-9Z" fill={skin} />
            <path d="M99 40c3 2 5 3 10 3s7-1 10-3" stroke={gear} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {variant === 'squat' && (
        <>
          <g>
            <path d="M90 35c-11 0-19 8-19 18v18h58V53c0-10-8-18-19-18h-20Z" fill={gear} />
            <path d="M90 78c8-9 17-14 24-14 9 0 18 5 24 14l16 30H74l16-30Z" fill={skin} />
            <path d="M80 110l-18 25" stroke={gear} strokeWidth="8" strokeLinecap="round" />
            <path d="M140 110l18 25" stroke={gear} strokeWidth="8" strokeLinecap="round" />
            <path d="M101 110l-14 29" stroke={gear} strokeWidth="8" strokeLinecap="round" />
            <path d="M119 110l14 29" stroke={gear} strokeWidth="8" strokeLinecap="round" />
            <path d="M95 63l15-15 15 15" stroke={`url(#exercise-accent-${exercise.id})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M112 39c6 0 11 5 11 11 0 7-5 12-11 12s-11-5-11-12c0-6 5-11 11-11Z" fill={skin} />
            <path d="M95 41c3 2 5 3 10 3 5 0 7-1 10-3" stroke={gear} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M82 99l-11 11" stroke={accent} strokeWidth="7" strokeLinecap="round" />
            <path d="M138 99l11 11" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          </g>
        </>
      )}

      {variant === 'cardio' && (
        <>
          <g>
            <path d="M90 34c-11 0-19 8-19 18v17h58V52c0-10-8-18-19-18h-20Z" fill={gear} />
            <path d="M92 73c6-10 15-15 24-15 10 0 19 5 25 15v22H92V73Z" fill={skin} />
            <path d="M90 101l-18 20" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M130 101l18 20" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M78 94l-12 16M142 94l12 16" stroke={accent} strokeWidth="8" strokeLinecap="round" />
            <path d="M56 111h20l11-16 18 31 17-17h22" stroke={gear} strokeWidth="6" fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M103 38c5 0 9 4 9 8s-4 8-9 8-9-4-9-8 4-8 9-8Z" fill={skin} />
            <path d="M93 38c3 2 5 4 10 4s7-2 10-4" stroke={gear} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M97 72l-11 11" stroke={accent} strokeWidth="7" strokeLinecap="round" />
            <path d="M123 72l11 11" stroke={accent} strokeWidth="7" strokeLinecap="round" />
          </g>
        </>
      )}

      {variant === 'mobility' && (
        <>
          <g>
            <path d="M90 34c-12 0-21 9-21 20v18h62V54c0-11-9-20-21-20h-20Z" fill={gear} />
            <path d="M92 74c5-10 14-15 24-15s19 5 24 15v21H92V74Z" fill={skin} />
            <path d="M82 97l-20 18" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M138 97l20 18" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M93 103l-16 27" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M127 103l16 27" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M91 60l19-22 19 22" stroke={`url(#exercise-accent-${exercise.id})`} strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <path d="M110 65v22" stroke={accent} strokeWidth="7" strokeLinecap="round" />
            <path d="M110 39c6 0 11 5 11 11 0 7-5 12-11 12s-11-5-11-12c0-6 5-11 11-11Z" fill={skin} />
            <path d="M102 41c3 2 5 3 8 3 4 0 6-1 9-3" stroke={gear} strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      {variant === 'core' && (
        <>
          <g>
            <path d="M89 31c-11 0-20 8-20 19v18h62V50c0-11-9-19-20-19h-22Z" fill={gear} />
            <path d="M88 62h44c12 0 22 10 22 22v19H66V84c0-12 10-22 22-22Z" fill={skin} />
            <path d="M83 96l-11 18" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M137 96l11 18" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M99 98l-14 25" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M121 98l14 25" stroke={gear} strokeWidth="7" strokeLinecap="round" />
            <path d="M110 67v31" stroke={accent} strokeWidth="7" strokeLinecap="round" />
            <path d="M94 84h32" stroke={accent} strokeWidth="7" strokeLinecap="round" />
            <path d="M108 41c6 0 11 5 11 11 0 7-5 12-11 12s-11-5-11-12c0-6 5-11 11-11Z" fill={skin} />
            <path d="M99 42c3 2 5 3 9 3 4 0 7-1 9-3" stroke={gear} strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M70 70c10-13 18-18 30-18" stroke={accent} strokeWidth="8" strokeLinecap="round" fill="none" />
            <path d="M150 70c-10-13-18-18-30-18" stroke={accent} strokeWidth="8" strokeLinecap="round" fill="none" />
          </g>
        </>
      )}

      <text x="110" y="154" textAnchor="middle" fontSize="11" fontWeight="700" fill="#355a49">{exercise.name}</text>
    </svg>
  )
}

function readStored<T,>(key: string, fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    if (value === null) return fallback
    try {
      return JSON.parse(value) as T
    } catch (error) {
      if (typeof fallback === 'string') return value as T
      throw error
    }
  } catch (error) {
    console.error(`Could not load saved ${key}.`, error)
    return fallback
  }
}

function localDateKey(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function datesThisWeek(date = new Date()) {
  const monday = new Date(date)
  monday.setHours(0, 0, 0, 0)
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + index)
    return localDateKey(day)
  })
}

function calculateWorkoutStreak(dateKeys: string[], today = new Date()) {
  const completed = new Set(dateKeys)
  const cursor = new Date(today)
  cursor.setHours(0, 0, 0, 0)
  if (!completed.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1)
  let streak = 0
  while (completed.has(localDateKey(cursor))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

function decodeVapidPublicKey(key: string) {
  const padding = '='.repeat((4 - key.length % 4) % 4)
  const base64 = (key + padding).replace(/-/g, '+').replace(/_/g, '/')
  const decoded = window.atob(base64)
  const buffer = new ArrayBuffer(decoded.length)
  const bytes = new Uint8Array(buffer)
  for (let index = 0; index < decoded.length; index++) bytes[index] = decoded.charCodeAt(index)
  return buffer
}

function profileFromUser(user: User): Profile {
  const metadata = user.user_metadata
  const goal = metadata.goal === 'Lose weight' || metadata.goal === 'Build muscle' || metadata.goal === 'Get fitter'
    ? metadata.goal
    : initialProfile.goal
  const sessions = typeof metadata.sessions === 'number' && Number.isFinite(metadata.sessions) ? metadata.sessions : initialProfile.sessions
  const trainingDays = Array.isArray(metadata.training_days)
    ? metadata.training_days.filter((day: unknown): day is number => Number.isInteger(day) && Number(day) >= 0 && Number(day) <= 6)
    : defaultTrainingDays(sessions)
  return {
    name: typeof metadata.full_name === 'string' ? metadata.full_name : initialProfile.name,
    email: user.email ?? '',
    goal,
    workoutLocation: metadata.workout_location === 'Home' ? 'Home' : 'Gym',
    weight: typeof metadata.weight === 'number' && Number.isFinite(metadata.weight) ? metadata.weight : initialProfile.weight,
    height: typeof metadata.height === 'number' && Number.isFinite(metadata.height) ? metadata.height : initialProfile.height,
    age: typeof metadata.age === 'number' && Number.isInteger(metadata.age) && metadata.age >= 18 && metadata.age <= 100 ? metadata.age : initialProfile.age,
    calorieBasis: metadata.calorie_basis === 'female' || metadata.calorie_basis === 'male' || metadata.calorie_basis === 'neutral'
      ? metadata.calorie_basis
      : initialProfile.calorieBasis,
    sessions: trainingDays.length >= 2 && trainingDays.length <= 6 ? trainingDays.length : sessions,
    trainingDays: trainingDays.length >= 2 && trainingDays.length <= 6 ? trainingDays : defaultTrainingDays(sessions),
    gymTime: typeof metadata.gym_time === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(metadata.gym_time) ? metadata.gym_time : initialProfile.gymTime,
  }
}

function profileMetadata(profile: Profile) {
  return {
    full_name: profile.name,
    goal: profile.goal,
    workout_location: profile.workoutLocation,
    weight: profile.weight,
    height: profile.height,
    age: profile.age,
    calorie_basis: profile.calorieBasis,
    sessions: profile.sessions,
    training_days: profile.trainingDays,
    gym_time: profile.gymTime,
  }
}

function accountStorageKey(userId: string, item: string) {
  return `gains:${userId}:${item}`
}

function isMissingPushTable(error: unknown) {
  if (typeof error !== 'object' || error === null || !('code' in error)) return false
  const code = error.code
  return code === '42P01' || code === 'PGRST205'
}

function isCalorieBasis(value: string): value is CalorieBasis {
  return value === 'female' || value === 'male' || value === 'neutral'
}

function isWorkoutLocation(value: string): value is WorkoutLocation {
  return value === 'Gym' || value === 'Home'
}

function estimateCalories(profile: Profile) {
  const sexConstant = profile.calorieBasis === 'male' ? 5 : profile.calorieBasis === 'female' ? -161 : -78
  const restingCalories = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + sexConstant
  const activityMultiplier: Record<number, number> = {
    2: 1.375,
    3: 1.45,
    4: 1.55,
    5: 1.65,
    6: 1.725,
  }
  const maintenance = restingCalories * (activityMultiplier[profile.sessions] ?? 1.45)
  const goalAdjustment = profile.goal === 'Lose weight' ? -300 : profile.goal === 'Build muscle' ? 200 : 0
  return Math.round((maintenance + goalAdjustment) / 50) * 50
}

function estimateWaterTarget(weight: number) {
  const milliliters = Math.min(4000, Math.max(1500, weight * 35))
  return Math.round(milliliters / 250) * 250
}

function HydrationCard({ consumed, target, onLog }: { consumed: number; target: number; onLog: (amount: number) => void }) {
  const progress = Math.min(100, consumed / target * 100)
  const remaining = Math.max(0, target - consumed)
  return (
    <article className="panel hydration-card" aria-label="Water intake tracker">
      <div className="hydration-heading">
        <span className="hydration-icon"><Icon name="water" size={19} /></span>
        <div><p className="eyebrow">A SIP AT A TIME</p><h3>Water today</h3></div>
        <div className="hydration-count"><strong>{(consumed / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}</strong><span> / {(target / 1000).toFixed(2).replace(/0+$/, '').replace(/\.$/, '')} L</span></div>
      </div>
      <div className="hydration-progress" role="progressbar" aria-label="Daily water intake" aria-valuemin={0} aria-valuemax={target} aria-valuenow={Math.min(consumed, target)}>
        <span style={{ width: `${progress}%` }} />
      </div>
      <div className="hydration-footer">
        <span>{remaining > 0 ? `${Math.ceil(remaining / 250)} small glasses to your estimate` : 'You’ve reached your daily estimate!'}</span>
        <div className="hydration-actions">
          {consumed > 0 && <button className="water-undo" type="button" onClick={() => onLog(-250)} aria-label="Remove one 250 milliliter glass">−250 ml</button>}
          <button className="water-add" type="button" onClick={() => onLog(250)} aria-label="Log one 250 milliliter glass"><Icon name="plus" size={15} /> Add a glass</button>
        </div>
      </div>
      <p className="hydration-note">A gentle estimate based on your weight—not a medical target. Your needs may vary.</p>
    </article>
  )
}

function App() {
  const [account, setAccount] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(() => Boolean(supabase))
  const [passwordRecovery, setPasswordRecovery] = useState(false)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profile, setProfile] = useState<Profile>(initialProfile)
  const [page, setPage] = useState<Page>('Overview')
  const [dialog, setDialog] = useState<'plan' | 'weight' | null>(null)
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [workoutDone, setWorkoutDone] = useState(false)
  const [completedWorkoutDates, setCompletedWorkoutDates] = useState<string[]>([])
  const [activeWorkout, setActiveWorkout] = useState<WorkoutSession | null>(null)
  const [activeExerciseIndex, setActiveExerciseIndex] = useState(0)
  const [exerciseProgress, setExerciseProgress] = useState<Record<string, ExerciseProgress>>({})
  const [voiceEnabled, setVoiceEnabled] = useState(false)
  const [weightHistory, setWeightHistory] = useState<number[]>([initialProfile.weight])
  const [waterIntake, setWaterIntake] = useState(0)
  const [waterDate, setWaterDate] = useState(localDateKey)
  const [weightInput, setWeightInput] = useState('')
  const [notice, setNotice] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [pushEnabled, setPushEnabled] = useState(false)
  const [savingWorkout, setSavingWorkout] = useState(false)
  const reminderRef = useRef(new Set<string>())
  const workoutDateRef = useRef(localDateKey())
  const activeExercise = activeWorkout?.exercises[activeExerciseIndex] ?? null
  const activeExerciseId = activeExercise?.id
  const activeExerciseProgress = activeExerciseId ? exerciseProgress[activeExerciseId] : undefined
  const currentSet = activeExerciseProgress?.currentSet ?? 1
  const restSeconds = activeExerciseProgress?.restSeconds ?? 0
  const isResting = activeExerciseProgress?.isResting ?? false

  useEffect(() => {
    if (!activeWorkout || !activeExerciseId || !isResting || restSeconds <= 0) return
    const timer = window.setTimeout(() => {
      if (restSeconds === 1) {
        setExerciseProgress((progress) => {
          const current = progress[activeExerciseId] ?? { currentSet: 1, restSeconds: 0, isResting: false }
          return { ...progress, [activeExerciseId]: { ...current, currentSet: current.currentSet + 1, restSeconds: 0, isResting: false } }
        })
        if (voiceEnabled) speakCoach('Rest is over. Start your next set when you are ready.')
      } else {
        setExerciseProgress((progress) => {
          const current = progress[activeExerciseId] ?? { currentSet: 1, restSeconds: 0, isResting: false }
          return { ...progress, [activeExerciseId]: { ...current, restSeconds: current.restSeconds - 1 } }
        })
      }
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [activeWorkout, activeExerciseId, isResting, restSeconds, voiceEnabled])

  useEffect(() => {
    if (!activeExercise || !voiceEnabled) return
    speakCoach(`${activeExercise.name}. ${activeExercise.cue} ${activeExercise.instructions.join(' ')}`)
    return () => window.speechSynthesis.cancel()
  }, [activeExercise, voiceEnabled])

  useEffect(() => {
    if (!supabase) return

    let active = true
    const restoreAccount = (user: User | null) => {
      if (!active) return
      setAccount(user)
      if (user) {
        const key = (item: string) => accountStorageKey(user.id, item)
        setProfile(profileFromUser(user))
        setWeightHistory(readStored(key('weight-history'), [profileFromUser(user).weight]))
        const workoutDoneToday = readStored(key('workout-date'), '') === localDateKey() && readStored(key('workout-done'), false)
        setWorkoutDone(workoutDoneToday)
        const storedWorkoutDates = readStored<unknown>(key('workout-dates'), [])
        const completedDates = Array.isArray(storedWorkoutDates)
          ? storedWorkoutDates.filter((date): date is string => typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date))
          : []
        setCompletedWorkoutDates(workoutDoneToday
          ? [...new Set([...completedDates, localDateKey()])]
          : completedDates)
        workoutDateRef.current = localDateKey()
        const savedWaterDate = readStored(key('water-date'), '')
        setWaterDate(localDateKey())
        setWaterIntake(savedWaterDate === localDateKey() ? readStored(key('water-intake'), 0) : 0)
        setProfileLoaded(true)
      } else {
        setProfileLoaded(false)
        setPushEnabled(false)
      }
      setAuthLoading(false)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return
      if (event === 'TOKEN_REFRESHED') return
      if (event === 'PASSWORD_RECOVERY') setPasswordRecovery(true)
      if (event === 'SIGNED_OUT') setPushEnabled(false)
      restoreAccount(session?.user ?? null)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setQuoteIndex((index) => (index + 1) % quotes.length), 12000)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => {
      const today = localDateKey()
      if (waterDate !== today) {
        setWaterDate(today)
        setWaterIntake(0)
      }
      if (workoutDateRef.current !== today) {
        workoutDateRef.current = today
        setWorkoutDone(false)
      }
    }, 60000)
    return () => window.clearInterval(timer)
  }, [waterDate])

  useEffect(() => {
    const client = supabase
    if (!account || !profileLoaded || !pushEnabled || !client) return
    let active = true
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    const syncSchedule = async () => {
      try {
        // 1. Sync the main schedule
        const { error } = await client.from('gym_schedules').upsert({
          user_id: account.id,
          training_days: profile.trainingDays,
          gym_time: profile.gymTime,
          timezone,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' })
        
        if (error) throw error

        // 2. Queue reminder jobs for the next 7 days
        // First, clear any existing future jobs to prevent duplicates
        await client.from('gym_reminder_jobs')
          .delete()
          .eq('user_id', account.id)
          .gte('scheduled_at', new Date().toISOString())

        const jobsToInsert = []
        const [hours, minutes] = profile.gymTime.split(':').map(Number)

        for (let i = 0; i < 7; i++) {
          const targetDate = new Date()
          targetDate.setDate(targetDate.getDate() + i)
          const dayIndex = (targetDate.getDay() + 6) % 7 // Convert to Monday=0 index

          if (profile.trainingDays.includes(dayIndex)) {
            targetDate.setHours(hours, minutes, 0, 0)
            
            // Only queue if the workout is in the future
            if (targetDate > new Date()) {
              const workoutDateStr = localDateKey(targetDate)
              
              // Schedule reminder for 1 hour before workout
              const reminderTime = new Date(targetDate.getTime() - 60 * 60 * 1000)
              
              jobsToInsert.push({
                user_id: account.id,
                scheduled_at: reminderTime.toISOString(),
                workout_date: workoutDateStr,
                reminder_type: 'before'
              })
            }
          }
        }

        if (jobsToInsert.length > 0) {
          const { error: reminderError } = await client.from('gym_reminder_jobs').insert(jobsToInsert)
          if (reminderError) console.error("Failed to queue reminders:", reminderError)
        }

        if (!active) return
      } catch (error) {
        if (!active) return
        console.error('Could not sync your gym reminder schedule.', error)
        setNotice('Your gym schedule could not sync for push reminders. Please try refreshing Gains.')
      }
    }
    void syncSchedule()
    return () => { active = false }
  }, [account, profile, profileLoaded, pushEnabled])

  useEffect(() => {
    const client = supabase
    if (!account || !profileLoaded || !client) return
    let active = true
    const restoreCheckin = async () => {
      const week = datesThisWeek()
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { data, error } = await client
        .from('workout_checkins')
        .select('workout_date')
        .eq('user_id', account.id)
        .gte('workout_date', localDateKey(thirtyDaysAgo))
        .lte('workout_date', week[6])
      if (!active) return
      if (error) {
        console.error('Could not restore your workout check-in.', error)
        setNotice('Today’s workout check-in could not sync. Please try refreshing Gains.')
        return
      }
      const dateKeys = (data ?? []).map((checkin) => checkin.workout_date)
      const localDates = readStored<unknown>(accountStorageKey(account.id, 'workout-dates'), [])
      const localDateList = Array.isArray(localDates)
        ? localDates.filter((date): date is string => typeof date === 'string')
        : []
      const legacyWorkoutDone = readStored(accountStorageKey(account.id, 'workout-date'), '') === localDateKey() &&
        readStored(accountStorageKey(account.id, 'workout-done'), false)
      const mergedDates = [...new Set([
        ...localDateList,
        ...dateKeys,
        ...(legacyWorkoutDone ? [localDateKey()] : []),
      ])]
      setCompletedWorkoutDates(mergedDates)
      setWorkoutDone(mergedDates.includes(localDateKey()))
    }
    void restoreCheckin()
    return () => { active = false }
  }, [account, profileLoaded])

  useEffect(() => {
    const client = supabase
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!account || !profileLoaded || !client || !vapidPublicKey || !('serviceWorker' in navigator)) return
    let active = true
    const restorePushSubscription = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration('/')
        const subscription = await registration?.pushManager.getSubscription()
        if (!subscription) {
          if (active) setPushEnabled(false)
          return
        }
        if (window.Notification.permission !== 'granted') {
          if (active) setPushEnabled(false)
          return
        }
        const { data, error } = await client
          .from('push_subscriptions')
          .select('id')
          .eq('user_id', account.id)
          .eq('endpoint', subscription.endpoint)
          .maybeSingle()
        if (error) throw error
        if (active) setPushEnabled(Boolean(data))
      } catch (error) {
        console.error('Could not restore your push notification status.', error)
      }
    }
    void restorePushSubscription()
    return () => { active = false }
  }, [account, profileLoaded])

  useEffect(() => {
    if (!account || !profileLoaded) return
    try {
      localStorage.setItem(accountStorageKey(account.id, 'workout-done'), JSON.stringify(workoutDone))
      localStorage.setItem(accountStorageKey(account.id, 'workout-date'), localDateKey())
      localStorage.setItem(accountStorageKey(account.id, 'workout-dates'), JSON.stringify(completedWorkoutDates))
      localStorage.setItem(accountStorageKey(account.id, 'weight-history'), JSON.stringify(weightHistory))
      localStorage.setItem(accountStorageKey(account.id, 'water-intake'), JSON.stringify(waterIntake))
      localStorage.setItem(accountStorageKey(account.id, 'water-date'), waterDate)
    } catch (error) {
      console.error('Could not save your Gains progress.', error)
    }
  }, [account, profileLoaded, workoutDone, completedWorkoutDates, weightHistory, waterIntake, waterDate])

  useEffect(() => {
    if (!account || !profileLoaded) return

    const checkReminder = () => {
      const now = new Date()
      const [hours, minutes] = profile.gymTime.split(':').map(Number)
      const sendReminder = (storageItem: string, message: string, allowNewTime = false) => {
        const memoryKey = `${account.id}:${storageItem}:${profile.gymTime}`
        if (reminderRef.current.has(memoryKey)) return

        try {
          const savedTime = localStorage.getItem(accountStorageKey(account.id, storageItem))
          if (savedTime !== null && (!allowNewTime || savedTime === profile.gymTime)) {
            reminderRef.current.add(memoryKey)
            return
          }
          localStorage.setItem(accountStorageKey(account.id, storageItem), profile.gymTime)
        } catch (error) {
          console.error('Could not save today’s reminder state.', error)
        }

        reminderRef.current.add(memoryKey)
        setNotice(message)
      }

      const today = new Date(now)
      today.setHours(hours, minutes, 0, 0)
      const todayDate = localDateKey(today)
      if (!workoutDone && profile.trainingDays.includes((now.getDay() + 6) % 7) &&
        now >= new Date(today.getTime() + 2 * 60 * 60 * 1000)) {
        const missedQuote = [
          'Never miss two days in a row. Tomorrow is a fresh chance to show up for yourself.',
          'One missed session doesn’t erase your progress. Reset and keep going.',
          'Consistency is coming back, one workout at a time.',
        ][Math.floor(Math.random() * 3)]
        sendReminder(`missed-workout:${todayDate}`, missedQuote)
      }

      const upcomingGymTime = [0, 1].map((offset) => {
        const scheduled = new Date(now)
        scheduled.setDate(scheduled.getDate() + offset)
        if (!profile.trainingDays.includes((scheduled.getDay() + 6) % 7)) return null
        scheduled.setHours(hours, minutes, 0, 0)
        return scheduled
      }).find((scheduled) => scheduled !== null &&
        now >= new Date(scheduled.getTime() - 60 * 60 * 1000) &&
        now < scheduled)
      if (!upcomingGymTime) return

      const gymDate = localDateKey(upcomingGymTime)
      const quote = quotes[Math.floor(Math.random() * quotes.length)]
      const locationMessage = profile.workoutLocation === 'Home' ? 'Time to get ready for your home workout.' : 'Time to get ready for the gym.'
      sendReminder(`reminder:${gymDate}`, `${locationMessage} ${quote.text}`, true)
    }

    checkReminder()
    const interval = window.setInterval(checkReminder, 15000)
    document.addEventListener('visibilitychange', checkReminder)
    return () => {
      window.clearInterval(interval)
      document.removeEventListener('visibilitychange', checkReminder)
    }
  }, [account, profile, profileLoaded, workoutDone])

  if (authLoading) {
    return <main className="auth-loading"><span className="auth-loading-mark"><Icon name="dumbbell" size={22} /></span><span>Getting your space ready…</span></main>
  }
  if (passwordRecovery) return <PasswordResetScreen onComplete={() => setPasswordRecovery(false)} />
  if (!account) return <AuthScreen />

  const firstName = profile.name.trim().split(/\s+/)[0] || 'friend'
  const currentHour = new Date().getHours()
  const greeting = currentHour < 12 ? 'Good morning' : currentHour < 17 ? 'Good afternoon' : 'Good evening'
  const isWeightGoal = profile.goal === 'Lose weight'
  const activeLibrary = loadWorkoutLibrary(profile.goal, profile.workoutLocation)
  const rotationOffset = profile.goal === 'Build muscle'
    ? workoutWeekIndex() * profile.trainingDays.length % activeLibrary.length
    : 0
  const workouts = buildWorkouts(activeLibrary, profile.trainingDays, rotationOffset)
  const currentDayIndex = (new Date().getDay() + 6) % 7
  const weekDateKeys = datesThisWeek()
  const completedDateSet = new Set(completedWorkoutDates)
  const todayWorkout = workouts[currentDayIndex]
  const workoutProgress = activeWorkout ? ((activeExerciseIndex + 1) / activeWorkout.exercises.length) * 100 : 0
  const completedSessions = workouts.reduce((total, workout, index) =>
    total + (workout.session && completedDateSet.has(weekDateKeys[index]) ? 1 : 0), 0)
  const weeklyProgressPercent = Math.min(100, completedSessions / profile.sessions * 100)
  const workoutStreak = calculateWorkoutStreak(completedWorkoutDates)
  const weightChange = profile.weight - weightHistory[0]
  const hasWeightTrend = weightHistory.length > 1
  const weightTrend = hasWeightTrend
    ? `${weightChange > 0 ? '↗' : weightChange < 0 ? '↘' : '→'} ${Math.abs(weightChange).toFixed(1)} kg`
    : 'Baseline'
  const calorieEstimate = estimateCalories(profile)
  const waterTarget = estimateWaterTarget(profile.weight)
  const overviewWorkouts = workouts.filter((_, index) => index < 4 || index === currentDayIndex)
  const mealOptions = isWeightGoal
    ? [
        [
          { detail: 'Greek yogurt, berries & oats', kcal: '380 kcal' },
          { detail: 'Spinach omelet & wholegrain toast', kcal: '360 kcal' },
          { detail: 'Cottage cheese, fruit & walnuts', kcal: '390 kcal' },
        ],
        [
          { detail: 'Grilled chicken, greens & quinoa', kcal: '520 kcal' },
          { detail: 'Tuna, chickpea & cucumber salad', kcal: '480 kcal' },
          { detail: 'Tofu, edamame & vegetable bowl', kcal: '500 kcal' },
        ],
        [
          { detail: 'Salmon, roasted vegetables & rice', kcal: '560 kcal' },
          { detail: 'Chicken, broccoli & baked potato', kcal: '540 kcal' },
          { detail: 'Lentil stew with brown rice', kcal: '550 kcal' },
        ],
      ]
    : [
        [
          { detail: 'Eggs, avocado toast & fruit', kcal: '480 kcal' },
          { detail: 'Greek yogurt, granola & berries', kcal: '450 kcal' },
          { detail: 'Peanut butter banana oats & yogurt', kcal: '500 kcal' },
        ],
        [
          { detail: 'Chicken, brown rice & greens', kcal: '620 kcal' },
          { detail: 'Turkey, hummus & wholegrain wrap', kcal: '590 kcal' },
          { detail: 'Black bean, quinoa & avocado bowl', kcal: '610 kcal' },
        ],
        [
          { detail: 'Salmon, sweet potato & broccoli', kcal: '680 kcal' },
          { detail: 'Chicken stir-fry with rice', kcal: '650 kcal' },
          { detail: 'Chickpea curry with brown rice', kcal: '640 kcal' },
        ],
      ]
  const mealIcons = ['☀', '◉', '☾']
  const mealTitles = ['Breakfast', 'Lunch', 'Dinner']
  const mealRotation = new Date().getDay() % 3
  const meals = mealOptions.map((options, index) => ({
    icon: mealIcons[index],
    title: mealTitles[index],
    ...options[(mealRotation + index) % options.length],
  }))

  async function savePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const weight = Number(form.get('weight'))
    const height = Number(form.get('height'))
    const age = Number(form.get('age'))
    const trainingDays = form.getAll('trainingDays').map(Number).filter((day) => Number.isInteger(day) && day >= 0 && day <= 6)
    const gymTime = String(form.get('gymTime'))
    const calorieBasis = String(form.get('calorieBasis'))
    const workoutLocation = String(form.get('workoutLocation'))
    if (!Number.isFinite(weight) || weight < 30 || weight > 300 || !Number.isFinite(height) || height < 100 || height > 250 || !Number.isInteger(age) || age < 18 || age > 100) {
      setNotice('Enter a weight from 30–300 kg, height from 100–250 cm, and age from 18–100.')
      return
    }
    if (!isCalorieBasis(calorieBasis)) {
      setNotice('Choose a calorie-estimate option to update your plan.')
      return
    }
    if (!isWorkoutLocation(workoutLocation)) {
      setNotice('Choose whether you train at home or at a gym.')
      return
    }
    if (trainingDays.length < 2 || trainingDays.length > 6) {
      setNotice('Choose 2–6 days you can realistically make it to the gym.')
      return
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(gymTime)) {
      setNotice('Choose a valid time for your gym sessions.')
      return
    }
    const updatedProfile: Profile = {
      name: String(form.get('name')).trim() || 'Friend',
      email: profile.email,
      goal: String(form.get('goal')) as Goal,
      workoutLocation,
      weight,
      height,
      age,
      calorieBasis,
      sessions: trainingDays.length,
      trainingDays,
      gymTime,
    }
    if (!supabase) return
    setSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: profileMetadata(updatedProfile) })
      if (error) {
        console.error('Could not update your Gains profile.', error)
        setNotice('Your profile could not be updated. Please try again.')
        return
      }
      setProfile(updatedProfile)
      setWeightHistory((history) => [...history.slice(-6), weight])
      reminderRef.current.clear()
      setNotice('Your personal plan is ready. Let’s make it happen!')
      setDialog(null)
    } catch (error) {
      console.error('Could not update your Gains profile.', error)
      setNotice('We couldn’t reach your account. Check your connection and try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function saveWeight(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const weight = Number(weightInput)
    if (!Number.isFinite(weight) || weight < 30 || weight > 300) {
      setNotice('Enter a weight between 30 and 300 kg.')
      return
    }
    const updatedProfile = { ...profile, weight }
    if (!supabase) return
    setSavingProfile(true)
    try {
      const { error } = await supabase.auth.updateUser({ data: profileMetadata(updatedProfile) })
      if (error) {
        console.error('Could not save your weight check-in.', error)
        setNotice('Your check-in could not be saved. Please try again.')
        return
      }
      setProfile(updatedProfile)
      setWeightHistory((history) => [...history.slice(-6), weight])
      setWeightInput('')
      setDialog(null)
      setNotice('Progress logged. Showing up for yourself is a win.')
    } catch (error) {
      console.error('Could not save your weight check-in.', error)
      setNotice('We couldn’t reach your account. Check your connection and try again.')
    } finally {
      setSavingProfile(false)
    }
  }

  async function completeWorkout() {
    const client = supabase
    const currentAccount = account
    if (savingWorkout) return
    const workoutDate = localDateKey()
    const nextWorkoutDone = !workoutDone
    setWorkoutDone(nextWorkoutDone)
    setCompletedWorkoutDates((dates) => nextWorkoutDone
      ? [...new Set([...dates, workoutDate])]
      : dates.filter((date) => date !== workoutDate))
    if (!client || !currentAccount) {
      setNotice(nextWorkoutDone
        ? todayWorkout.duration === 'Rest'
          ? 'Rest-day check-in saved on this device. Recovery is progress, too!'
          : 'Workout check-in saved on this device. That’s you showing up!'
        : 'Today’s check-in was updated on this device.')
      return
    }

    setSavingWorkout(true)
    try {
      if (nextWorkoutDone) {
        const { error } = await client.from('workout_checkins').upsert({
          user_id: currentAccount.id,
          workout_date: workoutDate,
          completed_at: new Date().toISOString(),
        }, { onConflict: 'user_id,workout_date' })
        if (error) throw error
      } else {
        const { error } = await client.from('workout_checkins')
          .delete().eq('user_id', currentAccount.id).eq('workout_date', workoutDate)
        if (error) throw error
      }
      setNotice(nextWorkoutDone
        ? todayWorkout.duration === 'Rest'
          ? 'Rest-day check-in saved. Recovery is progress, too!'
          : 'Workout complete. That’s you showing up!'
        : 'Today’s check-in was updated.')
    } catch (error) {
      console.error('Could not save your workout check-in.', error)
      setNotice(isMissingPushTable(error)
        ? 'Your check-in is saved on this device, but workout sync is not set up yet. Apply the Supabase workout check-in migration to sync across devices.'
        : 'Your check-in is saved on this device, but could not sync. Check your connection and try again.')
    } finally {
      setSavingWorkout(false)
    }
  }

  function startGuidedWorkout(session: WorkoutSession) {
    setExerciseProgress({})
    setActiveWorkout(session)
    setActiveExerciseIndex(0)
  }

  function continueWorkout() {
    if (!activeWorkout) return
    if (activeExerciseIndex < activeWorkout.exercises.length - 1) {
      setActiveExerciseIndex((current) => current + 1)
      return
    }
    setActiveWorkout(null)
    setActiveExerciseIndex(0)
    completeWorkout()
  }

  function completeSet() {
    if (!activeExercise || isResting) return
    const progressKey = activeExercise.id
    if (currentSet >= activeExercise.sets) {
      setExerciseProgress((progress) => ({
        ...progress,
        [progressKey]: { currentSet: activeExercise.sets + 1, restSeconds: 0, isResting: false },
      }))
      if (voiceEnabled) speakCoach('All sets complete. Take a breath, then continue when you are ready.')
      return
    }
    const seconds = restDurationSeconds(activeExercise.rest)
    if (seconds > 0) {
      setExerciseProgress((progress) => ({
        ...progress,
        [progressKey]: { currentSet, restSeconds: seconds, isResting: true },
      }))
      if (voiceEnabled) speakCoach(`Set ${currentSet} complete. Rest for ${seconds} seconds, then we go again.`)
      return
    }
    setExerciseProgress((progress) => ({
      ...progress,
      [progressKey]: { currentSet: activeExercise.sets + 1, restSeconds: 0, isResting: false },
    }))
    if (voiceEnabled) speakCoach('All sets complete. Take a breath, then continue when you are ready.')
  }

  function skipRest() {
    if (!activeExercise) return
    setExerciseProgress((progress) => ({
      ...progress,
      [activeExercise.id]: {
        currentSet: Math.min(currentSet + 1, activeExercise.sets),
        restSeconds: 0,
        isResting: false,
      },
    }))
  }

  function logWater(amount: number) {
    setWaterIntake((current) => Math.max(0, Math.min(10000, current + amount)))
  }

  async function enableGymReminders() {
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY
    if (!supabase || !account) {
      setNotice('Sign in to enable gym push reminders.')
      return
    }
    if (pushEnabled) {
      try {
        const { error } = await supabase.from('push_subscriptions').delete().eq('user_id', account.id)
        if (error) throw error
        setPushEnabled(false)
        setNotice('Push reminders are disabled for your account.')
      } catch (error) {
        console.error('Could not disable gym push reminders.', error)
        setNotice('We couldn’t disable push reminders. Please try again.')
      }
      return
    }
    if (!vapidPublicKey) {
      setNotice('Push reminders need VITE_VAPID_PUBLIC_KEY configured in the app environment.')
      return
    }
    if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setNotice('Push notifications are not supported by this browser. In-app reminders still work while Gains is open.')
      return
    }
    try {
      const permission = window.Notification.permission === 'default'
        ? await window.Notification.requestPermission()
        : window.Notification.permission
      if (permission !== 'granted') {
        setNotice(permission === 'denied'
          ? 'Notifications are blocked by your browser. Allow them in this site’s settings, then try again.'
          : 'Notification permission was not granted. In-app reminders still work while Gains is open.')
        return
      }

      const registration = await navigator.serviceWorker.register('/sw.js')
      const subscription = await registration.pushManager.getSubscription() ??
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: decodeVapidPublicKey(vapidPublicKey),
        })
      const keys = subscription.toJSON().keys
      if (!keys?.p256dh || !keys.auth) throw new Error('The browser did not provide Web Push encryption keys.')
      const { error } = await supabase.from('push_subscriptions').upsert({
        user_id: account.id,
        endpoint: subscription.endpoint,
        p256dh: keys.p256dh,
        auth_key: keys.auth,
      }, { onConflict: 'user_id,endpoint' })
      if (error) throw error
      setPushEnabled(true)
      setNotice('Push reminders are enabled. Gains can now remind you even when it is closed.')
    } catch (error) {
      console.error('Could not enable gym reminder notifications.', error)
      setNotice(isMissingPushTable(error)
        ? 'Push reminders are not set up in Supabase yet. Apply the gym reminder database migration and try again.'
        : 'We couldn’t enable push reminders. Check your browser permission and push setup, then try again.')
    }
  }

  async function signOut() {
    if (!supabase) return
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        console.error('Could not sign out of Gains.', error)
        setNotice('We couldn’t sign you out. Please try again.')
      }
    } catch (error) {
      console.error('Could not sign out of Gains.', error)
      setNotice('We couldn’t sign you out. Check your connection and try again.')
    }
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#" onClick={(event) => { event.preventDefault(); setPage('Overview') }} aria-label="Gains home">
          <span className="brand-mark"><Icon name="dumbbell" size={22} /></span>
          <span>gains<span className="brand-period">.</span></span>
        </a>

        <div className="sidebar-label">YOUR SPACE</div>
        <nav className="side-nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <button className={`nav-link ${page === item.label ? 'active' : ''}`} key={item.label} onClick={() => setPage(item.label)}>
              <Icon name={item.icon} size={19} />
              <span>{item.label}</span>
              {item.label === 'Workouts' && <span className="nav-count">{profile.sessions}</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-push" />
        {page === 'Overview' && <div className="sidebar-quote">
          <div className="quote-mark">“</div>
          <p>{quotes[quoteIndex].text}</p>
          <span>— {quotes[quoteIndex].author}</span>
          <button className="quote-next" onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)} aria-label="Next motivational quote">
            <Icon name="arrow" size={16} />
          </button>
        </div>}
        <button className="profile-button" onClick={() => setDialog('plan')}>
          <span className="avatar">{firstName.slice(0, 1).toUpperCase()}</span>
          <span className="profile-details"><strong>{profile.name}</strong><small>{profile.goal}</small></span>
          <Icon name="chevron" size={17} />
        </button>
        <button className="signout-button" onClick={signOut}><Icon name="logout" size={16} /> Sign out</button>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Icon name="dumbbell" size={19} /></span>gains<span className="brand-period">.</span></div>
          <div className="breadcrumb">My space <span>/</span> <strong>{page}</strong></div>
          <div className="topbar-actions">
            <span className="today-date"><Icon name="clock" size={15} /> {new Intl.DateTimeFormat('en', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date())}</span>
            <button className={`icon-button notification-button ${pushEnabled ? 'notifications-enabled' : ''}`} onClick={enableGymReminders} aria-label={pushEnabled ? 'Disable push gym reminders' : 'Enable push gym reminders'} title={pushEnabled ? 'Disable push reminders' : 'Enable reminders, including when Gains is closed'}><Icon name="bell" size={19} />{!pushEnabled && <i />}</button>
            <button className="avatar top-avatar" onClick={() => setDialog('plan')} aria-label="Edit your profile">{firstName.slice(0, 1).toUpperCase()}</button>
            <button className="icon-button signout-icon" onClick={signOut} aria-label="Sign out"><Icon name="logout" size={17} /></button>
          </div>
        </header>

        {notice && <div className="notice" role="status"><Icon name="spark" size={16} /><span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><Icon name="close" size={15} /></button></div>}

        {page === 'Overview' && (
          <>
            <section className="welcome-row">
              <div><p className="eyebrow">YOUR FITNESS, YOUR PACE</p><h1>{greeting}, {firstName}<span className="wave">✳</span></h1><p className="welcome-subtitle">A little progress each day adds up to big results.</p></div>
              <button className="button button-dark" onClick={() => setDialog('plan')}><Icon name="spark" size={17} /> {profile.email ? 'Edit my plan' : 'Make it personal'}</button>
            </section>

            {todayWorkout.session && <section className="panel guided-preview">
              <div className="guided-preview-heading">
                <div>
                  <p className="eyebrow">COACH MODE</p>
                  <h3>{todayWorkout.session.title}</h3>
                </div>
                <button className="button button-dark" onClick={() => startGuidedWorkout(todayWorkout.session!)}>Start guided workout</button>
              </div>
              <p>{todayWorkout.session.summary}</p>
            </section>}
            <section className="hero-panel">
              <div className="hero-copy">
                <div className="hero-tag"><span className="live-dot" /> YOUR NEXT CHAPTER</div>
                <h2>Stronger than<br />yesterday.</h2>
                <p>Your goal: <strong>{profile.goal.toLowerCase()}</strong>. Your only competition is who you were yesterday.</p>
                <button className="hero-link" onClick={() => setPage('Workouts')}>See your weekly plan <Icon name="arrow" size={17} /></button>
              </div>
              <div className="hero-visual" aria-hidden="true">
                <div className="hero-orbit orbit-one" /><div className="hero-orbit orbit-two" />
                <div className="hero-big-number">{String(completedSessions).padStart(2, '0')}<span>/ {profile.sessions}</span></div>
                <div className="hero-number-label">WORKOUTS THIS WEEK</div>
                <div className="hero-spark spark-one">✳</div><div className="hero-spark spark-two">✳</div>
              </div>
              <div className="hero-bottom"><span><Icon name="flame" size={16} /> {workoutStreak} {workoutStreak === 1 ? 'day' : 'days'} streak</span><span className="hero-bottom-separator" /><span><Icon name="heart" size={16} /> Progress over perfection</span></div>
            </section>

            <section className="stats-grid" aria-label="Your statistics">
              <article className="stat-card"><div className="stat-heading"><span>Current weight</span><span className="stat-icon mint"><Icon name="chart" size={17} /></span></div><div className="stat-value">{profile.weight.toFixed(1)} <span>kg</span></div><div className="stat-caption"><span className="trend-pill">{weightTrend}</span><span>{hasWeightTrend ? 'since your first check-in' : 'log again to see a trend'}</span></div></article>
              <article className="stat-card"><div className="stat-heading"><span>Weekly goal</span><span className="stat-icon peach"><Icon name="dumbbell" size={17} /></span></div><div className="stat-value">{completedSessions} <span>/ {profile.sessions} sessions</span></div><div className="mini-progress" role="progressbar" aria-label="Weekly workout goal" aria-valuemin={0} aria-valuemax={profile.sessions} aria-valuenow={Math.min(completedSessions, profile.sessions)}><span style={{ width: `${weeklyProgressPercent}%` }} /></div><div className="stat-caption">One session at a time</div></article>
              <article className="stat-card"><div className="stat-heading"><span>Plan focus</span><span className="stat-icon lilac"><Icon name="spark" size={17} /></span></div><div className="focus-value">{profile.goal}</div><div className="stat-caption">Your plan, built around you</div></article>
            </section>

            <HydrationCard consumed={waterIntake} target={waterTarget} onLog={logWater} />

            <section className="content-grid">
              <article className="panel workout-panel">
                <div className="panel-heading"><div><p className="eyebrow">YOUR PLAN</p><h3>This week’s workouts</h3><p className="schedule-reminder-summary">{profile.workoutLocation} · {formatGymTime(profile.gymTime)} · 1-hour reminder · missed-workout nudge after 2 hours</p></div><button className="text-link" onClick={() => setPage('Workouts')}>Full schedule <Icon name="arrow" size={15} /></button></div>
                <div className="workout-list">
                  {overviewWorkouts.map((workout) => {
                    const isToday = workoutDays.indexOf(workout.day) === currentDayIndex
                    return (
                    <div className={`workout-row ${isToday ? 'today-workout' : ''}`} key={workout.day}>
                      <div className="day-badge"><strong>{workout.day}</strong><span>{isToday ? 'TODAY' : workout.duration === 'Rest' ? 'REST' : ' '}</span></div>
                      <div className="workout-info"><strong>{workout.title}</strong><span>{workout.meta}</span></div>
                      <span className="workout-duration"><Icon name="clock" size={14} /> {workout.duration}</span>
                      {isToday && <button className={`workout-check ${workoutDone ? 'checked' : ''}`} onClick={completeWorkout} disabled={savingWorkout} aria-label={workoutDone ? 'Undo today’s check-in' : 'Mark today complete'}><Icon name="check" size={16} /></button>}
                    </div>
                    )
                  })}
                </div>
                <button className={`button ${workoutDone ? 'button-complete' : 'button-dark'} workout-cta`} onClick={completeWorkout} disabled={savingWorkout}>
                  <Icon name={workoutDone ? 'check' : todayWorkout.duration === 'Rest' ? 'heart' : 'dumbbell'} size={17} /> {workoutDone ? 'Today’s check-in saved' : todayWorkout.duration === 'Rest' ? 'Check in for your rest day' : 'Mark today’s workout done'}
                </button>
              </article>

              <aside className="right-column">
                <article className="panel quote-card">
                  <div className="quote-card-top"><span className="quote-icon"><Icon name="spark" size={18} /></span><span className="eyebrow">A LITTLE REMINDER</span><button onClick={() => setQuoteIndex((quoteIndex + 1) % quotes.length)} aria-label="Next quote">↗</button></div>
                  <blockquote>“{quotes[quoteIndex].text}”</blockquote><div className="quote-attribution">— {quotes[quoteIndex].author}</div>
                  <div className="quote-dots">{quotes.map((_, index) => <button key={index} className={index === quoteIndex ? 'selected' : ''} onClick={() => setQuoteIndex(index)} aria-label={`Show quote ${index + 1}`} />)}</div>
                </article>
                <article className="panel progress-card">
                  <div className="panel-heading"><div><p className="eyebrow">LITTLE BY LITTLE</p><h3>Your progress</h3></div><span className="stat-icon mint"><Icon name="chart" size={17} /></span></div>
                  <div className="chart-summary"><strong>{profile.weight.toFixed(1)} <small>kg</small></strong><span className="trend-pill">{weightTrend}</span></div>
                  <div className="chart-wrap" aria-label="Weight trend chart">
                    <svg className="progress-chart" viewBox="0 0 300 92" role="img" aria-label="Your recent weight trend">
                      <defs><linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a9d5b3" stopOpacity=".38" /><stop offset="100%" stopColor="#a9d5b3" stopOpacity="0" /></linearGradient></defs>
                      <path d="M8 72H292M8 42H292M8 12H292" className="chart-gridline" />
                      <path d={chartPath(weightHistory)} className="chart-area" />
                      <path d={chartPath(weightHistory, false)} className="chart-line" />
                      {weightHistory.map((weight, index) => { const point = chartPoint(weightHistory, index); return <circle key={`${weight}-${index}`} cx={point.x} cy={point.y} r={index === weightHistory.length - 1 ? 4 : 2.5} className={index === weightHistory.length - 1 ? 'chart-point current' : 'chart-point'} /> })}
                    </svg>
                    <div className="chart-labels"><span>WEEK 1</span><span>WEEK 4</span></div>
                  </div>
                  <button className="button button-outline log-weight-button" onClick={() => setDialog('weight')}><Icon name="plus" size={16} /> Log today’s weight</button>
                </article>
              </aside>
            </section>

            <section className="panel nutrition-strip">
              <div className="nutrition-title"><span className="stat-icon peach"><Icon name="plate" size={18} /></span><div><p className="eyebrow">FUEL YOUR GOALS</p><h3>Good food, good energy</h3></div></div>
              <div className="meal-snippets">{meals.map((meal) => <div className="meal-snippet" key={meal.title}><span className="meal-emoji">{meal.icon}</span><div><strong>{meal.title}</strong><span>{meal.detail}</span></div></div>)}</div>
              <button className="text-link nutrition-link" onClick={() => setPage('Nutrition')}>View meal ideas <Icon name="arrow" size={15} /></button>
            </section>
          </>
        )}

        {page === 'Workouts' && (
          <>
            <section className="welcome-row page-welcome"><div><p className="eyebrow">ONE REP AT A TIME</p><h1>Your workout plan<span className="wave">✳</span></h1><p className="welcome-subtitle">A week for <strong>{profile.goal.toLowerCase()}</strong>, training at <strong>{profile.workoutLocation.toLowerCase()}</strong> around <strong>{formatGymTime(profile.gymTime)}</strong>.</p></div><button className="button button-dark" onClick={() => setDialog('plan')}><Icon name="spark" size={17} /> Customize plan</button></section>
            <section className="panel schedule-panel"><div className="panel-heading"><div><p className="eyebrow">YOUR PERSONAL SCHEDULE</p><h3>{profile.sessions} sessions, your own pace</h3></div><span className="schedule-badge"><Icon name="clock" size={15} /> Rest days included</span></div>
              <div className="schedule-list">{workouts.map((workout, index) => <article className={`schedule-row ${index === currentDayIndex ? 'schedule-today' : ''}`} key={workout.day}><div className="schedule-day"><strong>{workout.day}</strong><span>{index === currentDayIndex ? 'TODAY' : ''}</span></div><span className="schedule-mark">{workout.icon}</span><div className="workout-info"><strong>{workout.title}</strong><span>{workout.meta}</span></div><span className="workout-duration"><Icon name="clock" size={14} /> {workout.duration}</span>{workout.session && <button className="schedule-start-button" type="button" onClick={() => startGuidedWorkout(workout.session!)} aria-label={`Start ${workout.session.title}`} title={`Start ${workout.session.title}`}><Icon name="dumbbell" size={15} /></button>}{index === currentDayIndex && <button className={`workout-check ${workoutDone ? 'checked' : ''}`} onClick={completeWorkout} disabled={savingWorkout} aria-label={workoutDone ? 'Undo today’s check-in' : 'Mark today complete'}><Icon name="check" size={16} /></button>}</article>)}</div>
              <div className="schedule-footer"><span><Icon name="heart" size={17} /> Rest days count too. Listen to your body.</span>{todayWorkout.session && <button className="button button-dark" onClick={() => startGuidedWorkout(todayWorkout.session!)}><Icon name="dumbbell" size={17} /> Start your guided session</button>} {!todayWorkout.session && <button className={`button ${workoutDone ? 'button-complete' : 'button-dark'}`} onClick={completeWorkout} disabled={savingWorkout}><Icon name={workoutDone ? 'check' : 'heart'} size={17} /> {workoutDone ? 'Today’s check-in saved' : 'Check in for your rest day'}</button>}</div>
            </section>
          </>
        )}

        {page === 'Nutrition' && (
          <>
            <section className="welcome-row page-welcome"><div><p className="eyebrow">FUEL THE FEELING</p><h1>Eat well, feel good<span className="wave">✳</span></h1><p className="welcome-subtitle">Simple meal inspiration to support your {profile.goal.toLowerCase()} goal.</p></div><button className="button button-dark" onClick={() => setDialog('plan')}><Icon name="spark" size={17} /> Adjust my goal</button></section>
            <section className="nutrition-hero"><span className="nutrition-hero-icon"><Icon name="leaf" size={24} /></span><div><p className="eyebrow">NO RESTRICTIONS, JUST GOOD HABITS</p><h2>Build a plate that loves you back.</h2><p>Think protein, colorful plants, satisfying carbs, and plenty of water. These are ideas, not rules—adjust portions to your appetite and needs.</p></div></section>
            <section className="nutrition-summary-grid">
              <article className="panel calorie-card">
                <div className="nutrition-summary-icon"><Icon name="spark" size={19} /></div>
                <p className="eyebrow">PERSONAL STARTING ESTIMATE</p>
                <h3>{calorieEstimate.toLocaleString()} <span>calories / day</span></h3>
                <p>Estimated daily energy for your goal: <strong>{profile.goal.toLowerCase()}</strong>.</p>
                <small>Approximate adult estimate based on age, height, weight, formula selection and planned workouts. Not a prescription.</small>
                <button className="text-link" onClick={() => setDialog('plan')}>Update my details <Icon name="arrow" size={15} /></button>
              </article>
              <HydrationCard consumed={waterIntake} target={waterTarget} onLog={logWater} />
            </section>
            <div className="meal-grid">{meals.map((meal, index) => <article className="panel meal-card" key={meal.title}><div className={`meal-card-art meal-art-${index + 1}`}><span>{meal.icon}</span><small>{index === 0 ? 'A GOOD START' : index === 1 ? 'MIDDAY FUEL' : 'WIND DOWN'}</small></div><div className="meal-card-info"><span className="eyebrow">{meal.title.toUpperCase()}</span><h3>{meal.detail}</h3><p><Icon name="plate" size={15} /> A balanced, satisfying plate</p><div className="meal-card-bottom"><span>{meal.kcal} <small>approx.</small></span><span className="meal-tag">PLAN IDEA</span></div></div></article>)}</div>
            <p className="nutrition-note"><Icon name="heart" size={16} /> Calorie and water figures are general estimates, not medical advice. Hydration needs vary with health, climate, activity, and other factors. Ask a qualified professional for personalized guidance.</p>
          </>
        )}

        {page === 'Progress' && (
          <>
            <section className="welcome-row page-welcome"><div><p className="eyebrow">LOOK HOW FAR YOU’VE COME</p><h1>Your progress<span className="wave">✳</span></h1><p className="welcome-subtitle">Every check-in counts. There’s no such thing as too small a step.</p></div><button className="button button-dark" onClick={() => setDialog('weight')}><Icon name="plus" size={17} /> Log weight</button></section>
            <div className="progress-overview-grid"><article className="panel progress-main-card"><div className="panel-heading"><div><p className="eyebrow">YOUR JOURNEY</p><h3>Weight over time</h3></div><span className="trend-pill">{weightTrend}</span></div><div className="progress-large-value">{profile.weight.toFixed(1)} <small>kg</small></div><div className="large-chart-wrap"><svg className="progress-chart" viewBox="0 0 600 180" role="img" aria-label="Your recent weight trend"><defs><linearGradient id="largeChartFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#a9d5b3" stopOpacity=".38" /><stop offset="100%" stopColor="#a9d5b3" stopOpacity="0" /></linearGradient></defs><path d="M8 145H592M8 100H592M8 55H592M8 10H592" className="chart-gridline" /><path d={chartPath(weightHistory, true, 600, 180)} className="chart-area large-chart-area" /><path d={chartPath(weightHistory, false, 600, 180)} className="chart-line" />{weightHistory.map((weight, index) => { const point = chartPoint(weightHistory, index, 600, 180); return <circle key={`${weight}-${index}`} cx={point.x} cy={point.y} r={index === weightHistory.length - 1 ? 5 : 3} className={index === weightHistory.length - 1 ? 'chart-point current' : 'chart-point'} /> })}</svg></div><div className="chart-labels"><span>YOUR FIRST CHECK-IN</span><span>NOW</span></div></article><aside className="panel progress-side-card"><span className="stat-icon mint"><Icon name="flame" size={18} /></span><p className="eyebrow">YOUR WEEKLY GOAL</p><h3>{completedSessions ? 'You showed up.' : 'Every session counts.'}</h3><div className="goal-ring"><span><strong>{completedSessions}</strong><small>/{profile.sessions}</small></span></div><p className="goal-copy">{completedSessions ? 'You’ve taken the first step. Keep that feeling going.' : 'You don’t need a perfect week. Just start with one.'}</p><button className="text-link" onClick={() => setPage('Workouts')}>See your workout plan <Icon name="arrow" size={15} /></button></aside></div>
            <section className="panel checkin-panel"><div className="panel-heading"><div><p className="eyebrow">SHOWING UP IS THE WIN</p><h3>Your recent check-ins</h3></div><button className="text-link" onClick={() => setDialog('weight')}>+ Log weight</button></div><div className="checkin-list">{weightHistory.slice().reverse().slice(0, 5).map((weight, index) => <div className="checkin-row" key={`${weight}-${index}`}><span className="checkin-icon"><Icon name="chart" size={16} /></span><span className="checkin-description"><strong>Weight logged</strong><small>{index === 0 ? 'Today · Keep going!' : `${index + 1} days ago`}</small></span><strong>{weight.toFixed(1)} kg</strong></div>)}</div></section>
          </>
        )}

        <footer className="page-footer"><span>Made for the long game <span>✳</span></span><span>Small steps. Real strength.</span></footer>
      </main>

      <nav className="mobile-nav" aria-label="Mobile main navigation">
        {navItems.map((item) => (
          <button
            className={`mobile-nav-link ${page === item.label ? 'active' : ''}`}
            key={item.label}
            onClick={() => setPage(item.label)}
            aria-current={page === item.label ? 'page' : undefined}
          >
            <Icon name={item.icon} size={20} />
            <span>{item.label}</span>
            {item.label === 'Workouts' && <span className="mobile-nav-count">{profile.sessions}</span>}
          </button>
        ))}
      </nav>

      {activeWorkout && activeExercise && <div className="modal-backdrop coach-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) { setActiveWorkout(null); setActiveExerciseIndex(0) } }}>
        <section className="modal guided-session" role="dialog" aria-modal="true" aria-labelledby="coach-title">
          <button className="modal-close" onClick={() => { setActiveWorkout(null); setActiveExerciseIndex(0) }} aria-label="Close workout coach"><Icon name="close" size={19} /></button>
          <div className="guided-header">
            <div>
              <p className="eyebrow">GUIDED SESSION</p>
              <h2 id="coach-title">{activeWorkout.title}</h2>
            </div>
            <span className="guided-level">{activeWorkout.level}</span>
          </div>
          <div className="guided-progress" aria-label="Workout progress">
            <span style={{ width: `${workoutProgress}%` }} />
          </div>
          <div className="guided-coach-tools">
            <span>Form demo</span>
            <button
              className={`guided-voice-toggle ${voiceEnabled ? 'is-on' : ''}`}
              type="button"
              onClick={() => setVoiceEnabled((enabled) => !enabled)}
              aria-pressed={voiceEnabled}
              disabled={!('speechSynthesis' in window)}
            >
              <Icon name="volume" size={16} />
              {voiceEnabled ? 'Coach voice on' : 'Hear coach cues'}
            </button>
          </div>
          <div className="guided-visual">
            <div className="guided-animation-shell">
              {activeExercise.animationUrl ? <img src={activeExercise.animationUrl} alt={activeExercise.name} className="guided-animation" /> : <ExerciseVisual exercise={activeExercise} />}
            </div>
            <div className="guided-move-meta">
              <span>{activeExercise.name}</span>
              <strong>{activeExercise.sets} sets · {activeExercise.reps}</strong>
            </div>
          </div>

          <div className="guided-card">
            <div className="guided-card-top">
              <div>
                <p className="eyebrow">MOVE {activeExerciseIndex + 1}/{activeWorkout.exercises.length} · SET {Math.min(currentSet, activeExercise.sets)}/{activeExercise.sets}</p>
                <h3>{activeExercise.name}</h3>
              </div>
              <span className="guided-rest">Rest {activeExercise.rest} between sets</span>
            </div>
            <p className="guided-focus">Focus: {activeExercise.focus}</p>
            <p className="guided-cue">{activeExercise.cue}</p>
            <ul className="guided-instructions">
              {activeExercise.instructions.map((instruction) => <li key={instruction}>{instruction}</li>)}
            </ul>
            <div className="guided-set-actions">
              {isResting ? (
                <>
                  <div className="guided-rest-clock" role="timer" aria-live="off">
                    <span>REST</span>
                    <strong>{Math.floor(restSeconds / 60)}:{String(restSeconds % 60).padStart(2, '0')}</strong>
                    <small>Next: set {Math.min(currentSet + 1, activeExercise.sets)}</small>
                  </div>
                  <button className="button button-outline" type="button" onClick={skipRest}>Skip rest</button>
                </>
              ) : (
                <>
                  <span className="guided-set-hint">{currentSet < activeExercise.sets ? 'Finish this set, then take your rest.' : 'You’ve reached the final set.'}</span>
                  <button className="button button-dark" type="button" onClick={completeSet} disabled={currentSet > activeExercise.sets}>
                    {currentSet < activeExercise.sets ? 'Complete set' : currentSet === activeExercise.sets ? 'Finish sets' : 'All sets complete'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="guided-footer">
            <button className="button button-outline" type="button" onClick={() => setActiveExerciseIndex((current) => Math.max(0, current - 1))} disabled={activeExerciseIndex === 0}>Previous</button>
            <button className="button button-dark" type="button" onClick={continueWorkout}>{activeExerciseIndex === activeWorkout.exercises.length - 1 ? 'Finish workout' : 'Next exercise'}</button>
          </div>
        </section>
      </div>}

      {dialog && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDialog(null) }}>
        <section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="modal-close" onClick={() => setDialog(null)} aria-label="Close"><Icon name="close" size={19} /></button>
          {dialog === 'plan' ? <>
            <div className="modal-icon"><Icon name="spark" size={21} /></div><p className="eyebrow">YOUR GOALS, YOUR PLAN</p><h2 id="modal-title">{profile.email ? 'Make it yours.' : 'Let’s make it personal.'}</h2><p className="modal-description">A few details help us shape a routine that fits you. No pressure—your plan can change whenever you do.</p>
            <form className="plan-form" onSubmit={savePlan}>
              <label>Your name<input name="name" defaultValue={profile.name} autoComplete="name" required /></label>
              <label>Email address<input type="email" value={profile.email} autoComplete="email" readOnly /></label>
              <label>What’s your main goal?<select name="goal" defaultValue={profile.goal}><option>Build muscle</option><option>Lose weight</option><option>Get fitter</option></select></label>
              <label>Where do you train?<select name="workoutLocation" defaultValue={profile.workoutLocation}><option>Gym</option><option>Home</option></select></label>
              <div className="form-two-columns"><label>Weight (kg)<input name="weight" type="number" min="30" max="300" step="0.1" defaultValue={profile.weight} required /></label><label>Height (cm)<input name="height" type="number" min="100" max="250" defaultValue={profile.height} required /></label></div>
              <div className="form-two-columns"><label>Age<input name="age" type="number" min="18" max="100" defaultValue={profile.age} required /></label><label>Calorie formula<select name="calorieBasis" defaultValue={profile.calorieBasis}><option value="neutral">Neutral estimate</option><option value="female">Female equation</option><option value="male">Male equation</option></select></label></div>
              <p className="form-safety">The calorie equation uses a selectable estimate, not gender identity. Choose the neutral estimate if you prefer.</p>
              <fieldset className="profile-days-fieldset">
                <legend>Which days can you train?</legend>
                <p>Pick 2–6 days that work for your week.</p>
                <div className="profile-day-options">{fullWeekDays.map((day, index) => <label className={`profile-day-option ${profile.trainingDays.includes(index) ? 'selected' : ''}`} key={day}><input type="checkbox" name="trainingDays" value={index} defaultChecked={profile.trainingDays.includes(index)} /><span>{day.slice(0, 3)}</span></label>)}</div>
              </fieldset>
              <div className="auth-field">
                <label htmlFor="profile-gym-time">Usual workout time</label>
                <div className="gym-time-input-row"><input id="profile-gym-time" name="gymTime" type="time" defaultValue={profile.gymTime} required /><span className="gym-time-period">{timeOfDay(profile.gymTime)}</span></div>
                <p className="profile-time-help">Enable push reminders with the bell to get the 1-hour reminder and 2-hour missed-workout nudge even when Gains is closed.</p>
              </div>
              <p className="form-safety"><Icon name="heart" size={15} /> A helpful starting point, not medical advice. You’re in charge.</p>
              <button className="button button-dark modal-submit" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving your plan…' : 'Build my personal plan'} <Icon name="arrow" size={17} /></button>
            </form>
          </> : <>
            <div className="modal-icon"><Icon name="chart" size={21} /></div><p className="eyebrow">A MOMENT FOR YOU</p><h2 id="modal-title">Log your progress.</h2><p className="modal-description">A check-in is a win, whatever the number. Only log when it feels right for you.</p>
            <form className="plan-form" onSubmit={saveWeight}><label>Today’s weight (kg)<input type="number" min="30" max="300" step="0.1" value={weightInput} onChange={(event) => setWeightInput(event.target.value)} placeholder={profile.weight.toFixed(1)} autoFocus required /></label><p className="form-safety"><Icon name="heart" size={15} /> Your progress is personal. The scale doesn’t define your success.</p><button className="button button-dark modal-submit" type="submit" disabled={savingProfile}>{savingProfile ? 'Saving…' : 'Save my check-in'} <Icon name="check" size={17} /></button></form>
          </>}
        </section>
      </div>}
    </div>
  )
}

function chartPoint(values: number[], index: number, width = 300, height = 92) {
  const min = Math.min(...values) - 0.5
  const max = Math.max(...values) + 0.5
  return {
    x: values.length < 2 ? width / 2 : 8 + (index / (values.length - 1)) * (width - 16),
    y: height - 10 - ((values[index] - min) / (max - min || 1)) * (height - 22),
  }
}

function chartPath(values: number[], area = true, width = 300, height = 92) {
  const points = values.map((_, index) => chartPoint(values, index, width, height))
  if (!points.length) return ''
  const line = `M ${points.map((point) => `${point.x} ${point.y}`).join(' L ')}`
  return area ? `${line} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z` : line
}

export default App
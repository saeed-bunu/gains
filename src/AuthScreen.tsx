import { useState, type FormEvent } from 'react'
import { supabase, supabaseConfigured } from './supabase'
import type { WorkoutLocation } from './workoutLibrary'
import './AuthScreen.css'

type Goal = 'Lose weight' | 'Build muscle' | 'Get fitter'
type CalorieBasis = 'female' | 'male' | 'neutral'
type AuthMode = 'signup' | 'signin' | 'recovery' | 'confirmation'

const goals: { name: Goal; description: string; icon: string }[] = [
  { name: 'Lose weight', description: 'Feel lighter & build healthy habits', icon: '↘' },
  { name: 'Build muscle', description: 'Get stronger, one rep at a time', icon: '↗' },
  { name: 'Get fitter', description: 'Move more & find your rhythm', icon: '✳' },
]

const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const gymTimePresets = [
  { label: 'Morning', time: '07:00' },
  { label: 'Afternoon', time: '12:00' },
  { label: 'Evening', time: '18:00' },
  { label: 'Night', time: '21:00' },
]

function timeOfDay(time: string) {
  const hour = Number(time.split(':')[0])
  if (hour < 12) return 'morning'
  if (hour < 17) return 'afternoon'
  if (hour < 21) return 'evening'
  return 'night'
}

function friendlyAuthError(message: string) {
  const normalizedMessage = message.toLowerCase()
  if (
    normalizedMessage.includes('failed to fetch') ||
    normalizedMessage.includes('fetch failed') ||
    normalizedMessage.includes('network request failed') ||
    normalizedMessage.includes('networkerror')
  ) {
    return 'Gains couldn’t reach Supabase. Check that .env.local has your project’s HTTPS URL and publishable key, restart the app after changing it, and make sure your Supabase project is active and your internet connection is working.'
  }
  if (normalizedMessage.includes('invalid api key') || normalizedMessage.includes('apikey')) {
    return 'Supabase rejected the project key. Check VITE_SUPABASE_ANON_KEY in .env.local and use the project’s publishable (or legacy anon) key—not a service-role key.'
  }
  if (normalizedMessage.includes('already registered')) {
    return 'There’s already an account with that email. Try signing in instead.'
  }
  if (normalizedMessage.includes('invalid login credentials')) {
    return 'That email and password combination doesn’t match. Try again or reset your password.'
  }
  if (normalizedMessage.includes('email signups are disabled') || normalizedMessage.includes('signup is disabled')) {
    return 'Email sign-up is turned off for this Supabase project. Enable the Email provider under Authentication → Sign In / Providers in your Supabase dashboard.'
  }
  if (normalizedMessage.includes('password')) {
    return message
  }
  return message
}

export default function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>('signup')
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [goal, setGoal] = useState<Goal>('Build muscle')
  const [workoutLocation, setWorkoutLocation] = useState<WorkoutLocation>('Gym')
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [age, setAge] = useState('')
  const [calorieBasis, setCalorieBasis] = useState<CalorieBasis>('neutral')
  const [trainingDays, setTrainingDays] = useState<number[]>([0, 2, 5])
  const [gymTime, setGymTime] = useState('18:00')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function changeMode(nextMode: AuthMode) {
    setMode(nextMode)
    setStep(1)
    setPassword('')
    setShowPassword(false)
    setError('')
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (mode === 'signup' && step === 1) {
      setStep(2)
      return
    }

    if (!supabase) {
      setError('Account sign-up is not configured yet. Add your Supabase project settings to get started.')
      return
    }

    if (mode === 'signup') {
      const numericWeight = Number(weight)
      const numericHeight = Number(height)
      const numericAge = Number(age)
      if (!Number.isFinite(numericWeight) || numericWeight < 30 || numericWeight > 300 ||
        !Number.isFinite(numericHeight) || numericHeight < 100 || numericHeight > 250 ||
        !Number.isInteger(numericAge) || numericAge < 18 || numericAge > 100) {
        setError('Enter a weight from 30–300 kg, height from 100–250 cm, and age from 18–100.')
        return
      }
      if (trainingDays.length < 2 || trainingDays.length > 6) {
        setError('Choose 2–6 days that work for your week.')
        return
      }
      if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(gymTime)) {
        setError('Choose a valid time for your gym sessions.')
        return
      }
    }

    setBusy(true)
    try {
      if (mode === 'signup') {
        const { error: signupError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: name.trim(),
              goal,
              workout_location: workoutLocation,
              weight: Number(weight),
              height: Number(height),
              age: Number(age),
              calorie_basis: calorieBasis,
              sessions: trainingDays.length,
              training_days: trainingDays,
              gym_time: gymTime,
            },
          },
        })
        if (signupError) throw signupError
        setMode('confirmation')
      } else if (mode === 'signin') {
        const { error: signinError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (signinError) throw signinError
      } else if (mode === 'recovery') {
        const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: window.location.origin,
        })
        if (recoveryError) throw recoveryError
        setError('Password reset email sent. Check your inbox, including your spam folder.')
      }
    } catch (caughtError) {
      if (caughtError instanceof Error) {
        setError('status' in caughtError && caughtError.status === 429
          ? 'Too many attempts. Please wait a moment and try again.'
          : friendlyAuthError(caughtError.message))
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setBusy(false)
    }
  }

  async function resendConfirmation() {
    if (!supabase) return
    setBusy(true)
    setError('')
    try {
      const { error: resendError } = await supabase.auth.resend({ type: 'signup', email: email.trim() })
      if (resendError) throw resendError
      setError('A new confirmation link is on its way.')
    } catch (caughtError) {
      setError(caughtError instanceof Error ? friendlyAuthError(caughtError.message) : 'We couldn’t resend the link. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (!supabaseConfigured) {
    return (
      <main className="auth-page">
        <section className="auth-card auth-setup-card" aria-labelledby="setup-title">
          <a className="auth-brand" href="/" aria-label="Gains home">
            <span className="auth-brand-mark">↗</span><span>gains<span>.</span></span>
          </a>
          <div className="auth-setup-icon" aria-hidden="true">✳</div>
          <p className="auth-eyebrow">ONE SMALL STEP TO GET STARTED</p>
          <h1 id="setup-title">Supabase setup needed.</h1>
          <p className="auth-intro">This app can’t connect to an account service yet. Add your Supabase project settings to enable sign-up and sign-in.</p>
          <ol className="setup-steps">
            <li><span>1</span><div><strong>Create a Supabase project</strong><p>Start a free project at supabase.com.</p></div></li>
            <li><span>2</span><div><strong>Add your project settings</strong><p>Copy <code>.env.example</code> to <code>.env.local</code> in the project root. Replace both example values with your project URL and publishable key.</p></div></li>
            <li><span>3</span><div><strong>Restart and allow the app URL</strong><p>Restart <code>npm run dev</code>, then add your local or deployed URL to Supabase Auth’s redirect URLs.</p></div></li>
          </ol>
          <p className="auth-footnote">Use your Supabase publishable (or legacy anon) key—not a service-role key. Don’t share your key in chat.</p>
        </section>
        <p className="auth-bottom-line">A little progress, every day. <span>✳</span></p>
      </main>
    )
  }

  if (mode === 'confirmation') {
    return (
      <main className="auth-page">
        <section className="auth-card auth-confirm-card" aria-labelledby="confirm-title">
          <a className="auth-brand" href="/" aria-label="Gains home">
            <span className="auth-brand-mark">↗</span><span>gains<span>.</span></span>
          </a>
          <div className="auth-setup-icon" aria-hidden="true">✉</div>
          <p className="auth-eyebrow">CHECK YOUR INBOX</p>
          <h1 id="confirm-title">You’re nearly there.</h1>
          <p className="auth-intro">We sent a confirmation link to <strong>{email}</strong>. Open it to activate your account and start your plan.</p>
          {error && <p className={`auth-message ${error.startsWith('A new confirmation') ? 'auth-success' : ''}`} role="status">{error}</p>}
          <p className="auth-footnote">Can’t find it? Check your spam folder, or make sure you entered the right email.</p>
          <button className="auth-back-link" type="button" onClick={resendConfirmation} disabled={busy}>{busy ? 'Sending…' : 'Resend confirmation email'}</button>
          <br />
          <button className="auth-back-link" type="button" onClick={() => changeMode('signin')}>Already confirmed? Sign in</button>
        </section>
        <p className="auth-bottom-line">A little progress, every day. <span>✳</span></p>
      </main>
    )
  }

  const isSignup = mode === 'signup'
  const title = isSignup
    ? step === 1 ? 'Start where you are.' : 'What are you working toward?'
    : mode === 'recovery' ? 'Let’s get you back in.' : 'Welcome back.'
  const intro = isSignup
    ? step === 1 ? 'A few details, then we’ll make a plan that feels like yours.' : 'There’s no perfect starting point. We’ll meet you where you are.'
    : mode === 'recovery' ? 'We’ll email you a link to reset your password.' : 'Your next workout is waiting when you are.'

  return (
    <main className="auth-page">
      <section className={`auth-card ${isSignup && step === 2 ? 'auth-card-step-two' : ''}`} aria-labelledby="auth-title">
        <a className="auth-brand" href="/" aria-label="Gains home">
          <span className="auth-brand-mark">↗</span><span>gains<span>.</span></span>
        </a>
        {isSignup && <div className="signup-progress" aria-label={`Step ${step} of 2`}>
          <div className="signup-progress-label"><span>{step === 1 ? 'YOUR ACCOUNT' : 'YOUR STARTING POINT'}</span><span>STEP {step} OF 2</span></div>
          <div className="signup-progress-track"><span style={{ width: step === 1 ? '50%' : '100%' }} /></div>
        </div>}
        <p className="auth-eyebrow">{isSignup ? 'A FRESH START, YOUR WAY' : mode === 'recovery' ? 'NO WORRIES' : 'GOOD TO SEE YOU AGAIN'}</p>
        <h1 id="auth-title">{title}</h1>
        <p className="auth-intro">{intro}</p>
        {isSignup && step === 2 && <p className="auth-account-summary">Creating an account for <strong>{email}</strong></p>}

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && step === 1 && <>
            <label htmlFor="signup-name">Your name</label>
            <input id="signup-name" type="text" autoComplete="name" placeholder="Type in your name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={80} autoFocus />
            <label htmlFor="signup-email">Email address</label>
            <input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <label htmlFor="signup-password">Create a password</label>
            <div className="password-field">
              <input id="signup-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
            <p className="auth-field-hint">Use at least 8 characters. Your password stays private.</p>
          </>}

          {isSignup && step === 2 && <>
            <fieldset className="goal-fieldset">
              <legend>What would you like to focus on?</legend>
              <div className="goal-options">
                {goals.map((item) => <button key={item.name} type="button" className={`goal-option ${goal === item.name ? 'goal-option-selected' : ''}`} aria-pressed={goal === item.name} onClick={() => setGoal(item.name)}>
                  <span className="goal-option-icon" aria-hidden="true">{item.icon}</span>
                  <span className="goal-option-copy"><strong>{item.name}</strong><small>{item.description}</small></span>
                  <span className="goal-option-radio" aria-hidden="true" />
                </button>)}
              </div>
            </fieldset>
            <div className="auth-fields-row">
              <div className="auth-field"><label htmlFor="signup-weight">Current weight</label><div className="input-with-unit"><input id="signup-weight" type="number" min="30" max="300" step="0.1" inputMode="decimal" placeholder="70" value={weight} onChange={(event) => setWeight(event.target.value)} required /><span>kg</span></div></div>
              <div className="auth-field"><label htmlFor="signup-height">Height</label><div className="input-with-unit"><input id="signup-height" type="number" min="100" max="250" inputMode="numeric" placeholder="170" value={height} onChange={(event) => setHeight(event.target.value)} required /><span>cm</span></div></div>
            </div>
            <div className="auth-fields-row">
              <div className="auth-field"><label htmlFor="signup-age">Age</label><div className="input-with-unit"><input id="signup-age" type="number" min="18" max="100" inputMode="numeric" placeholder="30" value={age} onChange={(event) => setAge(event.target.value)} required /><span>years</span></div></div>
              <div className="auth-field"><label htmlFor="signup-calorie-basis">Calorie formula</label><select id="signup-calorie-basis" value={calorieBasis} onChange={(event) => setCalorieBasis(event.target.value as CalorieBasis)}><option value="neutral">Neutral estimate</option><option value="female">Female equation</option><option value="male">Male equation</option></select></div>
            </div>
            <p className="auth-privacy-note">Age and formula choice help estimate calories. These equations use sex-based averages, not gender identity. The neutral option is an approximate midpoint. Estimates are for adults only.</p>
            <div className="auth-field">
              <label htmlFor="signup-workout-location">Where do you train?</label>
              <select id="signup-workout-location" value={workoutLocation} onChange={(event) => setWorkoutLocation(event.target.value as WorkoutLocation)}>
                <option value="Gym">Gym</option>
                <option value="Home">Home</option>
              </select>
            </div>
            <fieldset className="training-days-fieldset">
              <legend>Which days can you train?</legend>
              <p className="training-days-hint">Pick 2–6 days that work for your week.</p>
              <div className="training-day-options">
                {weekDays.map((day, index) => (
                  <label className={`training-day-option ${trainingDays.includes(index) ? 'training-day-selected' : ''}`} key={day}>
                    <input type="checkbox" name="trainingDays" value={index} checked={trainingDays.includes(index)} onChange={() => setTrainingDays((selected) => selected.includes(index) ? selected.filter((value) => value !== index) : selected.length < 6 ? [...selected, index].sort((a, b) => a - b) : selected)} />
                    <span>{day.slice(0, 3)}</span>
                  </label>
                ))}
              </div>
              <p className="training-days-hint" aria-live="polite">{trainingDays.length} training days selected</p>
            </fieldset>
            <div className="auth-field gym-time-field">
              <label htmlFor="signup-gym-time">What time do you want to train?</label>
              <div className="gym-time-input-row">
                <input id="signup-gym-time" name="gymTime" type="time" value={gymTime} onChange={(event) => setGymTime(event.target.value)} required />
                <span className="gym-time-period">{timeOfDay(gymTime)}</span>
              </div>
              <div className="gym-time-presets" aria-label="Quick workout time choices">
                {gymTimePresets.map((preset) => <button type="button" key={preset.label} className={timeOfDay(gymTime) === preset.label.toLowerCase() ? 'selected' : ''} onClick={() => setGymTime(preset.time)}>{preset.label}</button>)}
              </div>
              <p className="auth-privacy-note">After sign-up, enable reminders with the bell for an encouragement before your workout and a supportive nudge if you miss it.</p>
            </div>
            <p className="auth-privacy-note">Your body, your pace. This is a starting point, not medical advice.</p>
          </>}

          {(mode === 'signin' || mode === 'recovery') && <>
            <label htmlFor="signin-email">Email address</label>
            <input id="signin-email" type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} required autoFocus />
          </>}

          {mode === 'signin' && <>
            <div className="password-label-row"><label htmlFor="signin-password">Password</label><button className="auth-inline-link" type="button" onClick={() => changeMode('recovery')}>Forgot password?</button></div>
            <div className="password-field">
              <input id="signin-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Your password" value={password} onChange={(event) => setPassword(event.target.value)} required />
              <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
            </div>
          </>}

          {error && <p className={`auth-message ${error.startsWith('Password reset email sent') ? 'auth-success' : ''}`} role="alert">{error}</p>}

          {isSignup && step === 2
            ? <div className="auth-step-actions"><button className="auth-secondary-button" type="button" onClick={() => { setStep(1); setError('') }}>Back</button><button className="auth-primary-button" type="submit" disabled={busy}>{busy ? 'Creating your account…' : 'Create my account'}<span aria-hidden="true">→</span></button></div>
            : <button className="auth-primary-button" type="submit" disabled={busy}>{busy ? 'One moment…' : mode === 'signup' ? 'Continue' : mode === 'recovery' ? 'Send reset link' : 'Sign in'}<span aria-hidden="true">→</span></button>}
        </form>

        <p className="auth-legal-text">
          By continuing, you agree to our{' '}
          <a href="/terms.html" target="_blank" rel="noopener noreferrer">
            Terms & Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy.html" target="_blank" rel="noopener noreferrer">
            Privacy Policy
          </a>.
          Gains is not a substitute for professional medical advice.
        </p>
        
        {mode === 'signup' && step === 1 && <p className="auth-terms">Your password is handled securely by Supabase authentication.</p>}
        <div className="auth-switch">
          {isSignup ? <>Already have an account? <button type="button" onClick={() => changeMode('signin')}>Sign in</button></>
            : mode === 'recovery' ? <button type="button" onClick={() => changeMode('signin')}>← Back to sign in</button>
              : <>New to Gains? <button type="button" onClick={() => changeMode('signup')}>Create an account</button></>}
        </div>
      </section>
      <p className="auth-bottom-line">A little progress, every day. <span>✳</span></p>
    </main>
  )
}

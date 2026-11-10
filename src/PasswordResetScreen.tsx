import { useState, type FormEvent } from 'react'
import { supabase } from './supabase'
import './AuthScreen.css'

export default function PasswordResetScreen({ onComplete }: { onComplete: () => void }) {
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [updated, setUpdated] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) {
      setError('Those passwords don’t match yet. Give it another try.')
      return
    }
    if (!supabase) {
      setError('Password reset is not configured. Please contact support.')
      return
    }

    setBusy(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setUpdated(true)
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'We couldn’t update your password. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card" aria-labelledby="reset-title">
        <a className="auth-brand" href="/" aria-label="Gains home">
          <span className="auth-brand-mark">↗</span><span>gains<span>.</span></span>
        </a>
        <p className="auth-eyebrow">{updated ? 'ALL SET' : 'A FRESH START'}</p>
        <h1 id="reset-title">{updated ? 'You’re back in.' : 'Choose a new password.'}</h1>
        <p className="auth-intro">{updated ? 'Your password has been updated. You can get back to your plan now.' : 'Pick something memorable to you and hard for anyone else to guess.'}</p>
        {!updated && <form className="auth-form" onSubmit={handleSubmit}>
          <label htmlFor="new-password">New password</label>
          <div className="password-field">
            <input id="new-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="At least 8 characters" value={password} onChange={(event) => setPassword(event.target.value)} required autoFocus />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button>
          </div>
          <label htmlFor="confirm-password">Confirm new password</label>
          <input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" minLength={8} placeholder="Type it one more time" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} required />
          {error && <p className="auth-message" role="alert">{error}</p>}
          <button className="auth-primary-button" type="submit" disabled={busy}>{busy ? 'Updating…' : 'Update password'}<span aria-hidden="true">→</span></button>
        </form>}
        {updated && <button className="auth-primary-button" type="button" onClick={onComplete}>Back to my plan <span aria-hidden="true">→</span></button>}
        <p className="auth-bottom-line">A little progress, every day. <span>✳</span></p>
      </section>
    </main>
  )
}

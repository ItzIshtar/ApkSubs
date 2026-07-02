import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Logo } from './Logo'
import { Illustration } from './Illustration'

export function AuthForm() {
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-in')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setMessage(null)

    const { error } =
      mode === 'sign-in'
        ? await supabase.auth.signInWithPassword({ email, password })
        : await supabase.auth.signUp({ email, password })

    if (error) {
      setError(error.message)
    } else if (mode === 'sign-up') {
      setMessage('Cuenta creada. Revisa tu correo para confirmar el registro.')
    }

    setLoading(false)
  }

  return (
    <div className="card">
      <Logo />
      <Illustration />
      <h2>{mode === 'sign-in' ? 'Inicia sesión' : 'Crea tu cuenta'}</h2>
      <p className="subtitle">
        {mode === 'sign-in'
          ? 'Ingresa para revisar y ahorrar en tus suscripciones'
          : 'Completa tus datos para empezar a ahorrar'}
      </p>

      <form onSubmit={handleSubmit} className="auth-form">
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
          />
        </label>

        <label>
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
          />
        </label>

        {error && <p className="auth-error">{error}</p>}
        {message && <p className="auth-message">{message}</p>}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Procesando…' : mode === 'sign-in' ? 'Entrar' : 'Registrarme'}
        </button>
      </form>

      <button
        type="button"
        className="auth-toggle"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
          setMessage(null)
        }}
      >
        {mode === 'sign-in' ? (
          <>¿No tienes cuenta? <span>Regístrate</span></>
        ) : (
          <>¿Ya tienes cuenta? <span>Inicia sesión</span></>
        )}
      </button>
    </div>
  )
}

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
    <div className="w-full max-w-[380px] rounded-[32px] bg-card p-8 pb-9 text-center shadow-[0_24px_48px_-12px_hsl(var(--accent)/0.25)] dark:shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
      <Logo />
      <Illustration />
      <h2 className="m-0 text-[1.35rem] font-semibold text-text-primary">
        {mode === 'sign-in' ? 'Inicia sesión' : 'Crea tu cuenta'}
      </h2>
      <p className="mb-6 mt-2 text-sm leading-snug text-text-tertiary">
        {mode === 'sign-in'
          ? 'Ingresa para revisar y ahorrar en tus suscripciones'
          : 'Completa tus datos para empezar a ahorrar'}
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 text-left">
        <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
            required
            className="rounded-full border-none bg-background-secondary px-[1.1rem] py-[0.85rem] text-[0.95rem] text-text-primary outline-none transition-shadow duration-150 focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.18)]"
          />
        </label>

        <label className="flex flex-col gap-1.5 text-xs font-semibold text-text-secondary">
          Contraseña
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            minLength={6}
            required
            className="rounded-full border-none bg-background-secondary px-[1.1rem] py-[0.85rem] text-[0.95rem] text-text-primary outline-none transition-shadow duration-150 focus:shadow-[0_0_0_3px_hsl(var(--accent)/0.18)]"
          />
        </label>

        {error && <p className="m-0 text-[0.82rem] text-danger">{error}</p>}
        {message && <p className="m-0 text-[0.82rem] text-success">{message}</p>}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded-full bg-accent px-[1.1rem] py-[0.9rem] text-base font-bold text-white shadow-[0_12px_20px_-8px_hsl(var(--accent)/0.65)] transition-[background-color,transform] duration-150 enabled:hover:bg-accent-hover enabled:active:scale-[0.98] disabled:cursor-default disabled:opacity-65"
        >
          {loading ? 'Procesando…' : mode === 'sign-in' ? 'Entrar' : 'Registrarme'}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === 'sign-in' ? 'sign-up' : 'sign-in')
          setError(null)
          setMessage(null)
        }}
        className="mt-1.5 cursor-pointer border-none bg-transparent text-center text-sm text-text-tertiary"
      >
        {mode === 'sign-in' ? (
          <>¿No tienes cuenta? <span className="font-bold text-accent">Regístrate</span></>
        ) : (
          <>¿Ya tienes cuenta? <span className="font-bold text-accent">Inicia sesión</span></>
        )}
      </button>
    </div>
  )
}

import { useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './lib/useAuth'
import { useTheme } from './lib/useTheme'
import { useProfile } from './lib/useProfile'
import { useSubscriptions } from './lib/useSubscriptions'
import { useMonthlySpend } from './lib/useMonthlySpend'
import { useRecommendations } from './lib/useRecommendations'
import { useNotifications } from './lib/useNotifications'
import { findDuplicateGroups } from './lib/duplicates'
import { AuthForm } from './components/AuthForm'
import { Logo } from './components/Logo'
import { SubscriptionForm } from './components/SubscriptionForm'
import { SubscriptionList } from './components/SubscriptionList'
import { SettingsForm } from './components/SettingsForm'
import { DuplicateWarning } from './components/DuplicateWarning'
import { MonthlySpendSummary } from './components/MonthlySpendSummary'
import { RecommendationsList } from './components/RecommendationsList'
import { NotificationsList } from './components/NotificationsList'
import { ThemeToggle } from './components/ThemeToggle'
import type { Tables } from './lib/database.types'
import './App.css'

function Dashboard({ userId }: { userId: string }) {
  const [editing, setEditing] = useState<Tables<'subscriptions'> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const { profile, error: profileError, updateProfile } = useProfile(userId)
  const { subscriptions, loading, error, addSubscription, updateSubscription, deleteSubscription } =
    useSubscriptions(userId)
  const { rows: spendRows } = useMonthlySpend(userId)
  const { recommendations, dismiss } = useRecommendations(userId)
  const { notifications, markRead } = useNotifications(userId)

  const duplicateGroups = findDuplicateGroups(subscriptions)

  return (
    <div className="card dashboard">
      <div className="dashboard-header">
        <Logo />
        <button type="button" className="auth-toggle" onClick={() => setShowSettings(!showSettings)}>
          {showSettings ? 'Ocultar configuración' : 'Configuración'}
        </button>
      </div>

      <h2>¡Hola de nuevo!</h2>
      <p className="dashboard-welcome">
        Sesión iniciada como <strong>{profile?.email ?? '…'}</strong>
      </p>
      {profileError && <p className="auth-error">Error al leer el perfil: {profileError}</p>}

      {showSettings && profile && (
        <SettingsForm
          profile={profile}
          onCancel={() => setShowSettings(false)}
          onSubmit={updateProfile}
        />
      )}

      <MonthlySpendSummary rows={spendRows} />
      <DuplicateWarning groups={duplicateGroups} />
      <NotificationsList notifications={notifications} onMarkRead={markRead} />
      <RecommendationsList recommendations={recommendations} onDismiss={dismiss} />

      <div className="dashboard-header">
        <h2>Tus suscripciones</h2>
        {!showForm && (
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setEditing(null)
              setShowForm(true)
            }}
          >
            + Agregar
          </button>
        )}
      </div>

      {showForm && (
        <SubscriptionForm
          initial={editing ?? undefined}
          onCancel={() => setShowForm(false)}
          onSubmit={async (input) => {
            const result = editing
              ? await updateSubscription(editing.id, input)
              : await addSubscription(input)
            if (!result) setShowForm(false)
            return result
          }}
        />
      )}

      {loading && <p className="subtitle">Cargando suscripciones…</p>}
      {error && <p className="auth-error">{error}</p>}

      {!loading && !showForm && (
        <SubscriptionList
          subscriptions={subscriptions}
          onEdit={(s) => {
            setEditing(s)
            setShowForm(true)
          }}
          onDelete={(id) => deleteSubscription(id)}
        />
      )}

      <button type="button" className="auth-toggle" onClick={() => supabase.auth.signOut()}>
        Cerrar sesión
      </button>
    </div>
  )
}

function App() {
  const { user, loading } = useAuth()
  const { theme, toggleTheme } = useTheme()

  return (
    <>
      <ThemeToggle theme={theme} onToggle={toggleTheme} />
      {loading ? (
        <div className="card">Cargando…</div>
      ) : !user ? (
        <AuthForm />
      ) : (
        <Dashboard userId={user.id} />
      )}
    </>
  )
}

export default App

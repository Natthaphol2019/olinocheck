import { useState, useEffect } from 'react'
import { getCurrentEmployee, onAuthStateChange, signOut as supabaseSignOut } from '../services/authService'

export function useAuth() {
  const [employee, setEmployee] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active session
    const initializeAuth = async () => {
      try {
        const emp = await getCurrentEmployee()
        setEmployee(emp)
      } catch (error) {
        console.error('Auth initialization error:', error)
        setEmployee(null)
      } finally {
        setLoading(false)
      }
    }

    initializeAuth()

    // Listen for auth changes
    const authSubscription = onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        setEmployee(null)
      } else if (event === 'SIGNED_IN' && session) {
        const emp = session.user
        setEmployee(emp)
      }
    })

    return () => {
      if (authSubscription && authSubscription.unsubscribe) {
        authSubscription.unsubscribe()
      }
    }
  }, [])

  const signOut = async () => {
    await supabaseSignOut()
    setEmployee(null)
  }

  return { employee, loading, signOut, isAuthenticated: !!employee }
}

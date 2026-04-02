import React from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import PinLogin from '@/components/PinLogin'

export default function Login() {
  const { employee } = useAuth()

  if (employee) {
    // Redirect based on role
    if (['supervisor', 'hr', 'admin'].includes(employee.role)) {
      return <Navigate to="/manager" replace />
    }
    return <Navigate to="/check-in" replace />
  }

  return <PinLogin />
}

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { verifyPinAndSignIn } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Lock, Fingerprint, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PinLogin() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [shaking, setShaking] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()
  const inputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (pin.length < 4 || pin.length > 6) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      toast({
        title: 'Invalid PIN',
        description: 'PIN must be 4-6 digits',
        variant: 'destructive',
      })
      return
    }

    setLoading(true)
    try {
      const result = await verifyPinAndSignIn(pin)

      if (result.success) {
        toast({
          title: 'Welcome back!',
          description: `Signed in as ${result.employee.name}`,
        })

        // Redirect based on role
        if (['supervisor', 'hr', 'admin'].includes(result.employee.role)) {
          navigate('/manager')
        } else {
          navigate('/check-in')
        }
      } else {
        setShaking(true)
        setTimeout(() => setShaking(false), 500)
        toast({
          title: 'Login Failed',
          description: result.error || 'Invalid PIN',
          variant: 'destructive',
        })
        setPin('')
      }
    } catch (error) {
      setShaking(true)
      setTimeout(() => setShaking(false), 500)
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handlePinChange = (e) => {
    const value = e.target.value.replace(/\D/g, '').slice(0, 6)
    setPin(value)
  }

  const handleNumberClick = (num) => {
    if (pin.length < 6) {
      setPin(prev => prev + num)
    }
  }

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1))
  }

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/20 via-purple-100 to-pink-100 p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-float" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md relative z-10">
        {/* Logo and Title */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl gradient-primary mb-6 shadow-2xl shadow-primary/40 animate-float">
            <Clock className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent mb-2">
            OlinoCheck
          </h1>
          <p className="text-muted-foreground text-lg flex items-center justify-center gap-2">
            <Sparkles className="h-4 w-4" />
            Employee Attendance System
            <Sparkles className="h-4 w-4" />
          </p>
        </div>

        {/* PIN Input Card */}
        <div className="card-glass p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* PIN Display */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-center text-muted-foreground flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                Enter your PIN
              </label>
              
              {/* PIN Dots Display */}
              <div className="flex justify-center gap-3 py-4">
                {[0, 1, 2, 3, 4, 5].map((index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-12 h-12 rounded-2xl border-2 transition-all duration-300 flex items-center justify-center",
                      index < pin.length
                        ? "border-primary bg-primary text-white scale-110 shadow-lg shadow-primary/30"
                        : "border-border bg-muted/50",
                      shaking && index < pin.length && "animate-pulse bg-destructive border-destructive"
                    )}
                  >
                    {index < pin.length && (
                      <div className="w-3 h-3 rounded-full bg-white animate-scale-in" />
                    )}
                  </div>
                ))}
              </div>

              {/* Hidden Input */}
              <input
                ref={inputRef}
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                value={pin}
                onChange={handlePinChange}
                className="sr-only"
                disabled={loading}
                autoFocus
              />

              <p className="text-xs text-center text-muted-foreground">
                {pin.length}/6 digits (minimum 4)
              </p>
            </div>

            {/* Numeric Keypad */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handleNumberClick(num.toString())}
                  disabled={loading}
                  className={cn(
                    "h-16 rounded-2xl font-semibold text-xl transition-all duration-200",
                    "bg-muted/50 hover:bg-primary/10 active:bg-primary/20",
                    "text-foreground hover:text-primary",
                    "active:scale-95 touch-target"
                  )}
                >
                  {num}
                </button>
              ))}
              {/* Empty, 0, Delete */}
              <div className="h-16" />
              <button
                type="button"
                onClick={() => handleNumberClick('0')}
                disabled={loading}
                className={cn(
                  "h-16 rounded-2xl font-semibold text-xl transition-all duration-200",
                  "bg-muted/50 hover:bg-primary/10 active:bg-primary/20",
                  "text-foreground hover:text-primary",
                  "active:scale-95 touch-target"
                )}
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={loading || pin.length === 0}
                className={cn(
                  "h-16 rounded-2xl font-semibold transition-all duration-200",
                  "bg-destructive/10 hover:bg-destructive/20 active:bg-destructive/30",
                  "text-destructive hover:text-destructive",
                  "active:scale-95 touch-target disabled:opacity-50"
                )}
              >
                <svg className="w-6 h-6 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                </svg>
              </button>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              className={cn(
                "w-full h-14 text-lg font-semibold rounded-2xl transition-all duration-300",
                "gradient-primary hover:shadow-2xl hover:shadow-primary/40",
                "active:scale-98 text-white",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
              )}
              disabled={pin.length < 4 || loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Fingerprint className="h-5 w-5" />
                  Sign In
                </div>
              )}
            </Button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          © 2024 OlinoCheck. All rights reserved.
        </p>
      </div>
    </div>
  )
}

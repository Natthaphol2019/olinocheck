import { supabase } from './supabase'

/**
 * Verify PIN and sign in employee
 * Uses bcrypt comparison in browser (simpler than RPC)
 * @param {string} pin - The PIN to verify
 * @returns {Promise<{success: boolean, error?: string, employee?: object}>}
 */
export async function verifyPinAndSignIn(pin) {
  try {
    // Fetch all active employees
    // Note: This fetches pin_hash which is safe (it's a bcrypt hash, not plain text)
    const { data: employees, error } = await supabase
      .from('employees')
      .select('id, name, role, department_id, pin_hash')
      .eq('is_active', true)

    if (error) throw error

    // Find matching employee by comparing PIN hash
    // We need to do this in browser since PostgreSQL crypt() doesn't support bcrypt
    let matchedEmployee = null
    for (const emp of employees) {
      // Use Web Crypto API for bcrypt comparison
      const isValid = await verifyBcrypt(pin, emp.pin_hash)
      if (isValid) {
        matchedEmployee = emp
        break
      }
    }

    if (!matchedEmployee) {
      return { success: false, error: 'Invalid PIN' }
    }

    // Store employee data in localStorage for session management
    const { pin_hash, ...employeeData } = matchedEmployee
    localStorage.setItem('olinocheck_employee', JSON.stringify(employeeData))
    localStorage.setItem('olinocheck_pin', pin)
    
    return {
      success: true,
      employee: employeeData,
    }
  } catch (error) {
    console.error('PIN verification error:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Verify bcrypt hash using Web Crypto API
 * This is a simplified bcrypt verify that works in browser
 */
async function verifyBcrypt(pin, hash) {
  try {
    // Use the bcryptjs library (works in browser)
    const bcrypt = await import('bcryptjs')
    return await bcrypt.compare(pin, hash)
  } catch (error) {
    console.error('Bcrypt verification error:', error)
    return false
  }
}

/**
 * Sign out current user
 */
export async function signOut() {
  localStorage.removeItem('olinocheck_employee')
  localStorage.removeItem('olinocheck_pin')
  // Also sign out from Supabase auth if logged in
  await supabase.auth.signOut().catch(() => {}) // Ignore errors
}

/**
 * Get current session (uses localStorage)
 */
export async function getCurrentSession() {
  const employeeData = localStorage.getItem('olinocheck_employee')
  if (employeeData) {
    return { user: JSON.parse(employeeData) }
  }
  return null
}

/**
 * Get current employee from localStorage
 */
export async function getCurrentEmployee() {
  try {
    const employeeData = localStorage.getItem('olinocheck_employee')
    if (employeeData) {
      return JSON.parse(employeeData)
    }
    return null
  } catch (error) {
    console.error('getCurrentEmployee error:', error)
    return null
  }
}

/**
 * Listen to auth state changes (simplified for PIN auth)
 */
export function onAuthStateChange(callback) {
  // Check localStorage on load
  const employeeData = localStorage.getItem('olinocheck_employee')
  if (employeeData) {
    callback('SIGNED_IN', { user: JSON.parse(employeeData) })
  }
  
  // Listen for storage events (logout from other tabs)
  const handleStorageChange = (e) => {
    if (e.key === 'olinocheck_employee') {
      if (!e.newValue) {
        callback('SIGNED_OUT', null)
      }
    }
  }
  
  window.addEventListener('storage', handleStorageChange)
  
  // Return subscription object
  return {
    unsubscribe: () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }
}

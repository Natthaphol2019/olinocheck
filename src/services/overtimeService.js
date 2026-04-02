import { supabase } from './supabase'
import { differenceInHours } from 'date-fns'

/**
 * Calculate hours between two times
 */
function calculateHours(startTime, endTime) {
  const start = new Date(`2000-01-01T${startTime}`)
  const end = new Date(`2000-01-01T${endTime}`)
  return parseFloat(differenceInHours(end, start).toFixed(2))
}

/**
 * Create a new overtime request
 */
export async function createOvertime(employeeId, date, startTime, endTime, reason) {
  const hours = calculateHours(startTime, endTime)

  const { data, error } = await supabase
    .from('overtime')
    .insert({
      employee_id: employeeId,
      date,
      start_time: startTime,
      end_time: endTime,
      reason,
      hours,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get overtime requests for an employee
 */
export async function getEmployeeOvertime(employeeId) {
  const { data, error } = await supabase
    .from('overtime')
    .select('*')
    .eq('employee_id', employeeId)
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get pending overtime requests for approval
 */
export async function getPendingOvertime(departmentId = null, role = 'employee') {
  let query = supabase
    .from('overtime')
    .select(`
      *,
      employee:employees!overtime_employee_id_fkey (
        id,
        name,
        role,
        department:departments (name)
      )
    `)
    .eq('status', 'pending')
    .order('date', { ascending: false })

  if (role === 'supervisor' && departmentId) {
    query = query.eq('employee.department_id', departmentId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Approve or reject an overtime request
 */
export async function updateOvertimeStatus(overtimeId, status, approvedBy, rejectionReason = null) {
  const { data, error } = await supabase
    .from('overtime')
    .update({
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq('id', overtimeId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all overtime for reports
 */
export async function getAllOvertime(startDate, endDate) {
  let query = supabase
    .from('overtime')
    .select(`
      *,
      employee:employees!overtime_employee_id_fkey (
        id,
        name,
        role,
        department:departments (name)
      )
    `)
    .order('date', { ascending: false })

  if (startDate) {
    query = query.gte('date', startDate)
  }
  if (endDate) {
    query = query.lte('date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

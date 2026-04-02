import { supabase } from './supabase'

/**
 * Create a new leave request
 */
export async function createLeaveRequest(employeeId, leaveType, startDate, endDate, reason, file = null) {
  let fileUrl = null
  
  if (file) {
    const fileName = `leave/${employeeId}/${Date.now()}.${file.name.split('.').pop()}`
    const { error: uploadError } = await supabase.storage
      .from('attendance')
      .upload(fileName, file, {
        contentType: file.type,
        cacheControl: '3600',
      })

    if (uploadError) throw uploadError
    
    const { data: urlData } = supabase.storage
      .from('attendance')
      .getPublicUrl(fileName)
    
    fileUrl = urlData.publicUrl
  }

  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employeeId,
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason,
      file_url: fileUrl,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get leave requests for an employee
 */
export async function getEmployeeLeaveRequests(employeeId) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get pending leave requests for approval
 */
export async function getPendingLeaveRequests(departmentId = null, role = 'employee') {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees!leave_requests_employee_id_fkey (
        id,
        name,
        role,
        department:departments (name)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (role === 'supervisor' && departmentId) {
    query = query.eq('employee.department_id', departmentId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Approve or reject a leave request
 */
export async function updateLeaveRequestStatus(requestId, status, approvedBy, rejectionReason = null) {
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status,
      approved_by: approvedBy,
      approved_at: new Date().toISOString(),
      rejection_reason: rejectionReason,
    })
    .eq('id', requestId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get all leave requests for reports
 */
export async function getAllLeaveRequests(startDate, endDate) {
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees!leave_requests_employee_id_fkey (
        id,
        name,
        role,
        department:departments (name)
      )
    `)
    .order('created_at', { ascending: false })

  if (startDate) {
    query = query.gte('start_date', startDate)
  }
  if (endDate) {
    query = query.lte('end_date', endDate)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

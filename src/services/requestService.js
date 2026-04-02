import { supabase } from './supabase'

/**
 * Create a new request (time correction, retroactive check-in/out)
 */
export async function createRequest(employeeId, type, reason, requestDate, requestedTime, file = null) {
  let fileUrl = null
  
  if (file) {
    const fileName = `requests/${employeeId}/${Date.now()}.${file.name.split('.').pop()}`
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
    .from('requests')
    .insert({
      employee_id: employeeId,
      type,
      reason,
      request_date: requestDate,
      requested_time: requestedTime,
      file_url: fileUrl,
      status: 'pending',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get requests for an employee
 */
export async function getEmployeeRequests(employeeId) {
  const { data, error } = await supabase
    .from('requests')
    .select('*')
    .eq('employee_id', employeeId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Get pending requests for approval (for supervisors/HR)
 */
export async function getPendingRequests(departmentId = null, role = 'employee') {
  let query = supabase
    .from('requests')
    .select(`
      *,
      employee:employees!requests_employee_id_fkey (
        id,
        name,
        role,
        department:departments (name)
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  // Supervisors only see their department
  if (role === 'supervisor' && departmentId) {
    query = query.eq('employee.department_id', departmentId)
  }

  const { data, error } = await query
  if (error) throw error
  return data
}

/**
 * Approve or reject a request
 */
export async function updateRequestStatus(requestId, status, approvedBy, rejectionReason = null) {
  const { data, error } = await supabase
    .from('requests')
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
 * Process approved request (update time_records)
 */
export async function processApprovedRequest(request) {
  const today = new Date().toISOString().split('T')[0]
  
  try {
    switch (request.type) {
      case 'time_correction':
        // Update check_in or check_out time based on request
        // This would need additional fields to specify which time to correct
        break
        
      case 'retroactive_checkin':
        // Create a new time record with the requested check-in time
        await supabase.from('time_records').insert({
          employee_id: request.employee_id,
          check_in: `${request.request_date}T${request.requested_time}`,
          date: request.request_date,
          status: 'normal',
        })
        break
        
      case 'retroactive_checkout':
        // Update or create time record with check-out time
        await supabase.from('time_records').upsert({
          employee_id: request.employee_id,
          check_out: `${request.request_date}T${request.requested_time}`,
          date: request.request_date,
        })
        break
        
      default:
        break
    }
  } catch (error) {
    console.error('Error processing request:', error)
    throw error
  }
}

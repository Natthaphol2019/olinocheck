import { supabase } from './supabase'
import bcrypt from 'bcryptjs'

/**
 * Get all employees (HR/Admin only)
 */
export async function getAllEmployees() {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments (name)
    `)
    .order('name')

  if (error) throw error
  return data
}

/**
 * Get employees by department
 */
export async function getEmployeesByDepartment(departmentId) {
  const { data, error } = await supabase
    .from('employees')
    .select(`
      *,
      department:departments (name)
    `)
    .eq('department_id', departmentId)
    .eq('is_active', true)
    .order('name')

  if (error) throw error
  return data
}

/**
 * Create a new employee
 * Note: This requires admin privileges via RLS
 */
export async function createEmployee(name, pin, role, departmentId) {
  // Hash the PIN
  const pinHash = await bcrypt.hash(pin, 10)

  // Create employee record (without auth_user_id for now)
  const { data: employee, error: empError } = await supabase
    .from('employees')
    .insert({
      name,
      pin_hash: pinHash,
      role,
      department_id: departmentId,
      auth_user_id: null, // Will be null since we're not using Supabase Auth
      is_active: true,
    })
    .select()
    .single()

  if (empError) throw empError

  return employee
}

/**
 * Update employee
 */
export async function updateEmployee(employeeId, updates) {
  const { data, error } = await supabase
    .from('employees')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', employeeId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update employee PIN
 */
export async function updateEmployeePin(employeeId, newPin) {
  const pinHash = await bcrypt.hash(newPin, 10)
  
  // Update employee pin_hash
  const { error: empError } = await supabase
    .from('employees')
    .update({ pin_hash: pinHash })
    .eq('id', employeeId)

  if (empError) throw empError

  // Get auth_user_id
  const { data: employee } = await supabase
    .from('employees')
    .select('auth_user_id')
    .eq('id', employeeId)
    .single()

  if (employee) {
    // Update auth user password
    await supabase.auth.admin.updateUserById(employee.auth_user_id, {
      password: pinHash,
    })
  }
}

/**
 * Deactivate employee
 */
export async function deactivateEmployee(employeeId) {
  return updateEmployee(employeeId, { is_active: false })
}

/**
 * Reactivate employee
 */
export async function reactivateEmployee(employeeId) {
  return updateEmployee(employeeId, { is_active: true })
}

/**
 * Get all departments
 */
export async function getDepartments() {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

/**
 * Create department
 */
export async function createDepartment(name) {
  const { data, error } = await supabase
    .from('departments')
    .insert({ name })
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0]

  // Get total active employees
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Get today's check-ins with employee info
  const { data: todayRecords } = await supabase
    .from('time_records')
    .select(`
      employee_id,
      check_in,
      check_out,
      status
    `)
    .eq('date', today)

  // Get unique employees who checked in today
  const uniqueEmployeesToday = new Set(todayRecords?.map(r => r.employee_id))
  const presentCount = uniqueEmployeesToday.size

  // Get pending requests count
  const { count: pendingRequests } = await supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get pending leave requests count
  const { count: pendingLeaves } = await supabase
    .from('leave_requests')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get pending overtime count
  const { count: pendingOvertime } = await supabase
    .from('overtime')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  // Get attendance data for last 7 days
  const last7Days = []
  for (let i = 6; i >= 0; i--) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    
    const { data: dayRecords } = await supabase
      .from('time_records')
      .select('employee_id, check_in, status')
      .eq('date', dateStr)
    
    const uniqueEmployees = new Set(dayRecords?.map(r => r.employee_id))
    const present = uniqueEmployees.size
    const late = dayRecords?.filter(r => r.status === 'late').length || 0
    const absent = totalEmployees - present

    last7Days.push({
      date: date.toLocaleDateString('th-TH', { weekday: 'short' }),
      date_full: dateStr,
      present,
      absent,
      late,
    })
  }

  const checkedOutCount = todayRecords?.filter(r => r.check_out).length || 0

  return {
    presentCount,
    checkedOutCount,
    absentCount: totalEmployees - presentCount,
    pendingRequests: pendingRequests || 0,
    pendingLeaves: pendingLeaves || 0,
    pendingOvertime: pendingOvertime || 0,
    totalEmployees: totalEmployees || 0,
    last7Days,
  }
}

/**
 * Get attendance data for a date range
 */
export async function getAttendanceData(startDate, endDate) {
  const { data: records } = await supabase
    .from('time_records')
    .select(`
      date,
      employee_id,
      check_in,
      check_out,
      status
    `)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  // Group by date
  const grouped = {}
  records?.forEach(record => {
    if (!grouped[record.date]) {
      grouped[record.date] = {
        present: 0,
        absent: 0,
        late: 0,
      }
    }
    grouped[record.date].present++
    if (record.status === 'late') {
      grouped[record.date].late++
    }
  })

  // Fill in missing dates and get total employees
  const { count: totalEmployees } = await supabase
    .from('employees')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  const result = []
  const start = new Date(startDate)
  const end = new Date(endDate)
  
  for (let d = start; d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0]
    const dayData = grouped[dateStr] || { present: 0, absent: 0, late: 0 }
    
    result.push({
      date: d.toLocaleDateString('th-TH', { weekday: 'short' }),
      date_full: dateStr,
      present: dayData.present,
      absent: totalEmployees - dayData.present,
      late: dayData.late,
    })
  }

  return result
}

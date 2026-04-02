export function useRole(employee) {
  const isEmployee = employee?.role === 'employee'
  const isSupervisor = employee?.role === 'supervisor'
  const isHr = employee?.role === 'hr'
  const isAdmin = employee?.role === 'admin'
  
  const isManager = isSupervisor || isHr || isAdmin
  const canApprove = isSupervisor || isHr || isAdmin
  const canManageEmployees = isHr || isAdmin

  return {
    isEmployee,
    isSupervisor,
    isHr,
    isAdmin,
    isManager,
    canApprove,
    canManageEmployees,
    role: employee?.role || null,
  }
}

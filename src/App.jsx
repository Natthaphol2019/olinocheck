import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from '@/components/ui/use-toast'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useRole } from '@/hooks/useRole'
import { useAuth } from '@/hooks/useAuth'

// Pages
import Login from '@/pages/Login'
import CheckInOut from '@/pages/CheckInOut'
import History from '@/pages/History'
import Requests from '@/pages/Requests'
import LeaveRequests from '@/pages/LeaveRequests'
import Overtime from '@/pages/Overtime'

// Manager Pages
import ManagerDashboard from '@/pages/manager/Dashboard'
import Employees from '@/pages/manager/Employees'
import PendingRequests from '@/pages/manager/PendingRequests'
import LeaveApprovals from '@/pages/manager/LeaveApprovals'
import Reports from '@/pages/manager/Reports'
import AttendanceToday from '@/pages/manager/AttendanceToday'
import ShiftManagement from '@/pages/manager/ShiftManagement'
import EmployeeAttendanceHistory from '@/pages/manager/EmployeeAttendanceHistory'

function Unauthorized() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">403</h1>
        <p className="text-muted-foreground">You do not have permission to access this page</p>
        <a href="/" className="text-primary hover:underline mt-4 inline-block">
          Go Home
        </a>
      </div>
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Login />} />

          {/* Employee Routes */}
          <Route
            path="/check-in"
            element={
              <ProtectedRoute allowedRoles={['isEmployee']}>
                <CheckInOut />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute allowedRoles={['isEmployee']}>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/requests"
            element={
              <ProtectedRoute allowedRoles={['isEmployee']}>
                <Requests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leave"
            element={
              <ProtectedRoute allowedRoles={['isEmployee']}>
                <LeaveRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/overtime"
            element={
              <ProtectedRoute allowedRoles={['isEmployee']}>
                <Overtime />
              </ProtectedRoute>
            }
          />

          {/* Manager Routes */}
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['isManager', 'isSupervisor', 'isHr', 'isAdmin']}>
                <ManagerDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employees"
            element={
              <ProtectedRoute allowedRoles={['isHr', 'isAdmin']}>
                <Employees />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/pending-requests"
            element={
              <ProtectedRoute allowedRoles={['isManager', 'isSupervisor', 'isHr', 'isAdmin']}>
                <PendingRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/leave-approvals"
            element={
              <ProtectedRoute allowedRoles={['isManager', 'isSupervisor', 'isHr', 'isAdmin']}>
                <LeaveApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/reports"
            element={
              <ProtectedRoute allowedRoles={['isManager', 'isSupervisor', 'isHr', 'isAdmin']}>
                <Reports />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/attendance"
            element={
              <ProtectedRoute allowedRoles={['isManager', 'isSupervisor', 'isHr', 'isAdmin']}>
                <AttendanceToday />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/shifts"
            element={
              <ProtectedRoute allowedRoles={['isHr', 'isAdmin']}>
                <ShiftManagement />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manager/employee-attendance"
            element={
              <ProtectedRoute allowedRoles={['isHr', 'isAdmin']}>
                <EmployeeAttendanceHistory />
              </ProtectedRoute>
            }
          />

          {/* Catch all */}
          <Route path="/unauthorized" element={<Unauthorized />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

export default App

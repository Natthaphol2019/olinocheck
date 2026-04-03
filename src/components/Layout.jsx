import React from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useRole } from '@/hooks/useRole'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Clock,
  History,
  FileText,
  Calendar,
  Users,
  ClipboardCheck,
  LogOut,
  Menu,
  X,
  Home,
  ClipboardList,
  FileCheck,
  Briefcase,
  CheckCircle2,
  UserCog,
  User,
  Building
} from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Layout({ children }) {
  const { employee, signOut } = useAuth()
  const role = useRole(employee)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const getNavItems = () => {
    const items = []

    if (role.isManager) {
      items.push({ to: '/manager', label: 'ภาพรวม', icon: LayoutDashboard, mobileIcon: Home })
      items.push({ to: '/manager/attendance', label: 'การเข้างาน', icon: Users, mobileIcon: Users })
      items.push({ to: '/manager/pending-requests', label: 'คำร้องรอพิจารณา', icon: ClipboardCheck, mobileIcon: ClipboardList })
      items.push({ to: '/manager/leave-approvals', label: 'อนุมัติลา', icon: Calendar, mobileIcon: Calendar })
      if (role.isHr || role.isAdmin) {
        items.push({ to: '/manager/employees', label: 'พนักงาน', icon: Users })
        items.push({ to: '/manager/departments', label: 'แผนก', icon: Building })
        items.push({ to: '/manager/shifts', label: 'กะงาน', icon: Clock })
        items.push({ to: '/manager/employee-attendance', label: 'ประวัติเข้างานพนักงาน', icon: UserCog })
      }
      items.push({ to: '/manager/reports', label: 'รายงาน', icon: FileText, mobileIcon: FileCheck })
    } else {
      items.push({ to: '/dashboard', label: 'แดชบอร์ด', icon: LayoutDashboard, mobileIcon: Home })
      items.push({ to: '/check-in', label: 'เช็คอิน/เอาท์', icon: Clock, mobileIcon: Clock })
      items.push({ to: '/profile', label: 'ข้อมูลส่วนตัว', icon: User })
      items.push({ to: '/history', label: 'ประวัติ', icon: History, mobileIcon: History })
      items.push({ to: '/requests', label: 'คำร้อง', icon: FileText, mobileIcon: ClipboardList })
      items.push({ to: '/leave', label: 'ลากิจ/ป่วย', icon: Calendar, mobileIcon: Calendar })
      items.push({ to: '/overtime', label: 'ทำล่วงเวลา', icon: ClipboardCheck, mobileIcon: Briefcase })
    }

    return items
  }

  const navItems = getNavItems()
  const mobileNavItems = navItems.filter(item => item.mobileIcon)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 pb-20 lg:pb-0">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 glass border-b border-border/50 safe-top">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
              <CheckCircle2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-lg bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                OlinoCheck
              </span>
              <p className="text-xs text-muted-foreground -mt-1">ระบบบันทึกเวลาทำงาน</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </Button>
        </div>
      </header>

      {/* Sidebar - Desktop */}
      <aside className="hidden lg:block fixed top-0 left-0 z-40 h-screen w-72 glass border-r border-border/50">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                  OlinoCheck
                </h1>
                <p className="text-xs text-muted-foreground">ระบบบันทึกเวลาทำงาน</p>
              </div>
            </div>
          </div>

          {/* User Info */}
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
              <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-lg">
                  {employee?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{employee?.name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {employee?.role === 'employee' ? 'พนักงาน' : 
                   employee?.role === 'manager' ? 'ผู้จัดการ' :
                   employee?.role === 'supervisor' ? 'หัวหน้างาน' :
                   employee?.role === 'hr' ? 'HR' :
                   employee?.role === 'admin' ? 'ผู้ดูแลระบบ' : employee?.role}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto custom-scrollbar">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.to ||
                (item.to !== '/' && location.pathname.startsWith(item.to))

              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                    isActive
                      ? "gradient-primary text-white shadow-lg shadow-primary/30"
                      : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              )
            })}
          </nav>

          {/* Sign Out */}
          <div className="p-4 border-t border-border/50">
            <Button
              variant="outline"
              className="w-full justify-start gap-2 rounded-xl h-12 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
              onClick={handleSignOut}
            >
              <LogOut className="h-5 w-5" />
              ออกจากระบบ
            </Button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Drawer */}
      <>
        {/* Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden animate-fade-in"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}
        
        {/* Drawer */}
        <div className={cn(
          "fixed top-0 left-0 z-50 h-full w-80 glass transform transition-transform duration-300 lg:hidden",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        )}>
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-white" />
                </div>
                <div>
                  <span className="font-bold">OlinoCheck</span>
                  <p className="text-xs text-muted-foreground">ระบบบันทึกเวลาทำงาน</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="h-5 w-5" />
              </Button>
            </div>

            {/* User Info */}
            <div className="p-4 border-b border-border/50">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/5 border border-primary/10">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-white font-bold">
                    {employee?.name?.charAt(0)?.toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="font-semibold">{employee?.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {employee?.role === 'employee' ? 'พนักงาน' : 
                     employee?.role === 'manager' ? 'ผู้จัดการ' :
                     employee?.role === 'supervisor' ? 'หัวหน้างาน' :
                     employee?.role === 'hr' ? 'HR' :
                     employee?.role === 'admin' ? 'ผู้ดูแลระบบ' : employee?.role}
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = location.pathname === item.to ||
                  (item.to !== '/' && location.pathname.startsWith(item.to))

                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "gradient-primary text-white shadow-lg"
                        : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>

            {/* Sign Out */}
            <div className="p-4 border-t border-border/50">
              <Button
                variant="outline"
                className="w-full gap-2 rounded-xl h-12 hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
                onClick={handleSignOut}
              >
                <LogOut className="h-5 w-5" />
                ออกจากระบบ
              </Button>
            </div>
          </div>
        </div>
      </>

      {/* Main Content */}
      <main className={cn(
        "transition-all duration-300",
        "lg:ml-72",
        "min-h-screen"
      )}>
        <div className="p-4 lg:p-8 safe-top">
          {children}
        </div>
      </main>

      {/* Bottom Navigation - Mobile */}
      <nav className="bottom-nav safe-bottom">
        <div className="flex items-center justify-around gap-1">
          {mobileNavItems.slice(0, 5).map((item) => {
            const MobileIcon = item.mobileIcon || item.icon
            const isActive = location.pathname === item.to ||
              (item.to !== '/' && location.pathname.startsWith(item.to))

            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "bottom-nav-item flex-1",
                  isActive && "active"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200",
                  isActive
                    ? "gradient-primary shadow-lg shadow-primary/30"
                    : "bg-transparent"
                )}>
                  <MobileIcon className={cn(
                    "h-5 w-5",
                    isActive ? "text-white" : ""
                  )} />
                </div>
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

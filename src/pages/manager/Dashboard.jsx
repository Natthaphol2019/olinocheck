import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { getDashboardStats } from '@/services/employeeService'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, CheckCircle, Clock, FileText, Calendar, ClipboardCheck, TrendingUp, ArrowRight } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'

export default function ManagerDashboard() {
  const { employee, loading: authLoading } = useAuth()
  const { toast } = useToast()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [chartData, setChartData] = useState([])

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const data = await getDashboardStats()
      setStats(data)
      // Use real data from API instead of generating mock data
      setChartData(data.last7Days || [])
    } catch (error) {
      console.error('Error fetching stats:', error)
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ไม่สามารถโหลดข้อมูลได้',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const StatCard = ({ title, value, icon: Icon, color, gradient, delay = '0s' }) => (
    <Card className={cn(
      "overflow-hidden hover:shadow-xl transition-all duration-300 active:scale-98",
      "border-border/50"
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold">{value}</p>
          </div>
          <div className={cn(
            "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
            gradient,
            "animate-scale-in"
          )} style={{ animationDelay: delay }}>
            <Icon className="h-7 w-7 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QuickActionCard = ({ title, subtitle, icon: Icon, color, href, pending }) => (
    <a
      href={href}
      className={cn(
        "block p-5 rounded-2xl border-2 transition-all duration-300",
        "hover:shadow-lg hover:scale-105 active:scale-95",
        "border-border/50 hover:border-primary/30"
      )}
    >
      <div className="flex items-center gap-4">
        <div className={cn(
          "w-14 h-14 rounded-xl flex items-center justify-center shadow-md",
          color
        )}>
          <Icon className="h-7 w-7 text-white" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-lg">{title}</p>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
        {pending !== undefined && (
          <div className="flex flex-col items-center gap-1">
            <span className="text-2xl font-bold text-primary">{pending}</span>
            <span className="text-xs text-muted-foreground">รอพิจารณา</span>
          </div>
        )}
        <ArrowRight className="h-5 w-5 text-muted-foreground" />
      </div>
    </a>
  )

  if (loading) {
    return (
      <Layout>
        <div className="flex flex-col items-center justify-center h-64">
          <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
          <p className="text-muted-foreground">กำลังโหลดแดชบอร์ด...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              ภาพรวม
            </h1>
            <p className="text-muted-foreground">
              สรุปการเข้างานและสถิติวันนี้
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="พนักงานทั้งหมด"
            value={stats?.totalEmployees || 0}
            icon={Users}
            color="text-blue-600"
            gradient="gradient-blue"
            delay="0s"
          />
          <StatCard
            title="มาทำงานวันนี้"
            value={stats?.presentCount || 0}
            icon={CheckCircle}
            color="text-green-600"
            gradient="gradient-success"
            delay="0.1s"
          />
          <StatCard
            title="ขาดงานวันนี้"
            value={stats?.absentCount || 0}
            icon={Clock}
            color="text-red-600"
            gradient="gradient-danger"
            delay="0.2s"
          />
          <StatCard
            title="คำร้องรอพิจารณา"
            value={stats?.pendingRequests || 0}
            icon={FileText}
            color="text-yellow-600"
            gradient="gradient-warning"
            delay="0.3s"
          />
          <StatCard
            title="ลารอพิจารณา"
            value={stats?.pendingLeaves || 0}
            icon={Calendar}
            color="text-purple-600"
            gradient="gradient-purple"
            delay="0.4s"
          />
          <StatCard
            title="OT รอพิจารณา"
            value={stats?.pendingOvertime || 0}
            icon={ClipboardCheck}
            color="text-orange-600"
            gradient="gradient-warning"
            delay="0.5s"
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="card-glass">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <CardTitle>แนวโน้มการเข้างาน</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">7 วันที่ผ่านมา</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="present" stroke="#22c55e" strokeWidth={3} name="มาทำงาน" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="absent" stroke="#ef4444" strokeWidth={3} name="ขาดงาน" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="late" stroke="#eab308" strokeWidth={3} name="สาย" dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="card-glass">
            <CardHeader className="border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
                <CardTitle>สรุปประจำวัน</CardTitle>
              </div>
              <p className="text-xs text-muted-foreground">7 วันที่ผ่านมา</p>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#9ca3af" fontSize={12} />
                  <YAxis stroke="#9ca3af" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: 'none',
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                    }}
                  />
                  <Legend />
                  <Bar dataKey="present" fill="#22c55e" radius={[8, 8, 0, 0]} name="มาทำงาน" />
                  <Bar dataKey="absent" fill="#ef4444" radius={[8, 8, 0, 0]} name="ขาดงาน" />
                  <Bar dataKey="late" fill="#eab308" radius={[8, 8, 0, 0]} name="สาย" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="card-glass">
          <CardHeader className="border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ClipboardCheck className="h-4 w-4 text-primary" />
              </div>
              <CardTitle>เมนูด่วน</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <QuickActionCard
                title="พิจารณาคำร้อง"
                subtitle="คำร้องรอการอนุมัติ"
                icon={FileText}
                color="gradient-warning"
                href="/manager/pending-requests"
                pending={stats?.pendingRequests}
              />
              <QuickActionCard
                title="อนุมัติการลา"
                subtitle="คำร้องลารอพิจารณา"
                icon={Calendar}
                color="gradient-purple"
                href="/manager/leave-approvals"
                pending={stats?.pendingLeaves}
              />
              <QuickActionCard
                title="จัดการพนักงาน"
                subtitle="ดูรายชื่อพนักงานทั้งหมด"
                icon={Users}
                color="gradient-blue"
                href="/manager/employees"
              />
              <QuickActionCard
                title="ดูรายงาน"
                subtitle="ส่งออกข้อมูลการเข้างาน"
                icon={ClipboardCheck}
                color="gradient-success"
                href="/manager/reports"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

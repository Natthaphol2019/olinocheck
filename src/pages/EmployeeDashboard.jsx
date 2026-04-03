import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { supabase } from '@/services/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Calendar, Clock, CheckCircle, AlertCircle, XCircle, TrendingUp, BarChart3 } from 'lucide-react'
import { format, startOfMonth, endOfMonth, subMonths, eachDayOfInterval } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { cn } from '@/lib/utils'

export default function EmployeeDashboard() {
  const { employee, loading } = useAuth()
  const [stats, setStats] = useState({
    totalDays: 0,
    normalDays: 0,
    lateDays: 0,
    absentDays: 0,
    totalHours: 0,
    otHours: 0,
  })
  const [monthlyData, setMonthlyData] = useState([])
  const [statusData, setStatusData] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchDashboardData()
    }
  }, [employee?.id, loading])

  const fetchDashboardData = async () => {
    setLoadingData(true)
    try {
      const today = new Date()
      const startDate = format(startOfMonth(subMonths(today, 5)), 'yyyy-MM-dd')
      const endDate = format(endOfMonth(today), 'yyyy-MM-dd')

      // Get all records for last 6 months
      const { data: records, error } = await supabase
        .from('time_records')
        .select('*')
        .eq('employee_id', employee.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: true })

      if (error) throw error

      if (!records || records.length === 0) {
        setLoadingData(false)
        return
      }

      // Calculate this month stats
      const thisMonthStart = format(startOfMonth(today), 'yyyy-MM-dd')
      const thisMonthEnd = format(endOfMonth(today), 'yyyy-MM-dd')
      const thisMonthRecords = records.filter(r => r.date >= thisMonthStart && r.date <= thisMonthEnd)

      let totalHours = 0
      let otHours = 0

      thisMonthRecords.forEach(record => {
        if (record.check_in && record.check_out) {
          const hours = (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
          totalHours += hours
        }
        if (record.ot_hours) {
          otHours += parseFloat(record.ot_hours)
        }
      })

      setStats({
        totalDays: thisMonthRecords.length,
        normalDays: thisMonthRecords.filter(r => r.status === 'normal').length,
        lateDays: thisMonthRecords.filter(r => r.status === 'late').length,
        absentDays: thisMonthRecords.filter(r => r.status === 'absent').length,
        totalHours: Math.round(totalHours * 10) / 10,
        otHours: Math.round(otHours * 10) / 10,
      })

      // Monthly trend data (last 6 months)
      const trendData = []
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(today, i)
        const monthStart = format(startOfMonth(monthDate), 'yyyy-MM-dd')
        const monthEnd = format(endOfMonth(monthDate), 'yyyy-MM-dd')
        const monthRecords = records.filter(r => r.date >= monthStart && r.date <= monthEnd)
        const monthName = format(monthDate, 'MMM')

        let monthHours = 0
        monthRecords.forEach(record => {
          if (record.check_in && record.check_out) {
            monthHours += (new Date(record.check_out) - new Date(record.check_in)) / (1000 * 60 * 60)
          }
        })

        trendData.push({
          month: monthName,
          days: monthRecords.length,
          hours: Math.round(monthHours * 10) / 10,
          normal: monthRecords.filter(r => r.status === 'normal').length,
          late: monthRecords.filter(r => r.status === 'late').length,
        })
      }
      setMonthlyData(trendData)

      // Status distribution
      const normalCount = thisMonthRecords.filter(r => r.status === 'normal').length
      const lateCount = thisMonthRecords.filter(r => r.status === 'late').length
      const absentCount = thisMonthRecords.filter(r => r.status === 'absent').length

      if (normalCount + lateCount + absentCount > 0) {
        setStatusData([
          { name: 'ปกติ', value: normalCount, color: '#10B981' },
          { name: 'สาย', value: lateCount, color: '#F59E0B' },
          { name: 'ขาด', value: absentCount, color: '#EF4444' },
        ])
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoadingData(false)
    }
  }

  if (loading || loadingData) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      </Layout>
    )
  }

  const COLORS = ['#10B981', '#F59E0B', '#EF4444']

  return (
    <Layout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              แดชบอร์ดของฉัน
            </h1>
            <p className="text-muted-foreground">สถิติและการเข้างานของคุณ</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border-2 border-blue-200 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">วันมาทำงาน</p>
                  <p className="text-3xl font-bold text-blue-600">{stats.totalDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">วันในเดือนนี้</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center">
                  <Calendar className="h-7 w-7 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-green-200 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">มาปกติ</p>
                  <p className="text-3xl font-bold text-green-600">{stats.normalDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">วัน</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-green-50 flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-yellow-200 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">มาสาย</p>
                  <p className="text-3xl font-bold text-yellow-600">{stats.lateDays}</p>
                  <p className="text-xs text-muted-foreground mt-1">วัน</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-yellow-50 flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-2 border-purple-200 hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">ชั่วโมงทำงาน</p>
                  <p className="text-3xl font-bold text-purple-600">{stats.totalHours}</p>
                  <p className="text-xs text-muted-foreground mt-1">ชั่วโมง</p>
                </div>
                <div className="w-14 h-14 rounded-xl bg-purple-50 flex items-center justify-center">
                  <Clock className="h-7 w-7 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Stats */}
        {(stats.lateDays > 0 || stats.otHours > 0) && (
          <div className="grid grid-cols-2 gap-4">
            {stats.lateDays > 0 && (
              <Card className="bg-white border-2 border-red-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">มาสาย</p>
                      <p className="text-2xl font-bold text-red-600">{stats.lateDays} วัน</p>
                    </div>
                    <XCircle className="h-10 w-10 text-red-300" />
                  </div>
                </CardContent>
              </Card>
            )}
            {stats.otHours > 0 && (
              <Card className="bg-white border-2 border-orange-200">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">OT ทั้งหมด</p>
                      <p className="text-2xl font-bold text-orange-600">{stats.otHours} ชม.</p>
                    </div>
                    <TrendingUp className="h-10 w-10 text-orange-300" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Charts */}
        {monthlyData.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Trend */}
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="text-lg">แนวโน้ม 6 เดือนล่าสุด</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="days" fill="#3B82F6" name="วันมาทำงาน" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status Distribution */}
            {statusData.length > 0 && (
              <Card className="bg-white">
                <CardHeader>
                  <CardTitle className="text-lg">สถานะเดือนนี้</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Empty State */}
        {monthlyData.length === 0 && (
          <Card className="bg-white">
            <CardContent className="py-16 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">ยังไม่มีข้อมูลการเข้างาน</p>
              <p className="text-sm text-gray-500 mt-1">เริ่มเช็คอินครั้งแรกเพื่อเห็นสถิติที่นี่</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

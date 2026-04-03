import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Calendar, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { format, addDays, startOfWeek } from 'date-fns'
import { supabase } from '@/services/supabase'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'

export default function MyShiftSchedule() {
  const { employee, loading } = useAuth()
  const { toast } = useToast()
  const [currentShift, setCurrentShift] = useState(null)
  const [upcomingShifts, setUpcomingShifts] = useState([])
  const [shiftHistory, setShiftHistory] = useState([])
  const [loadingData, setLoadingData] = useState(true)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchShiftData()
    }
  }, [employee?.id, loading])

  const fetchShiftData = async () => {
    try {
      setLoadingData(true)
      const today = format(new Date(), 'yyyy-MM-dd')

      // Get current shift
      const { data: currentShiftData, error: shiftError } = await supabase
        .from('employee_shifts')
        .select(`
          *,
          shifts:shift_id (*)
        `)
        .eq('employee_id', employee.id)
        .eq('is_active', true)
        .lte('start_date', today)
        .or(`end_date.is.null,end_date.gte.${today}`)
        .order('start_date', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (shiftError) throw shiftError

      if (currentShiftData?.shifts) {
        setCurrentShift(currentShiftData.shifts)
      }

      // Get shift history (last 30 days)
      const { data: historyData, error: historyError } = await supabase
        .from('time_records')
        .select(`
          *,
          shifts:shift_id (*)
        `)
        .eq('employee_id', employee.id)
        .gte('date', format(addDays(new Date(), -30), 'yyyy-MM-dd'))
        .order('date', { ascending: false })

      if (historyError) throw historyError
      setShiftHistory(historyData || [])

    } catch (error) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setLoadingData(false)
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5)
  }

  const formatTo12Hour = (time24h) => {
    if (!time24h) return ''
    const [hours, minutes] = time24h.split(':')
    const h = parseInt(hours)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${minutes || '00'} ${ampm}`
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'normal':
        return { label: 'ปกติ', color: 'bg-green-100 text-green-700', icon: CheckCircle }
      case 'late':
        return { label: 'สาย', color: 'bg-yellow-100 text-yellow-700', icon: AlertCircle }
      case 'absent':
        return { label: 'ขาดงาน', color: 'bg-red-100 text-red-700', icon: AlertCircle }
      default:
        return { label: status, color: 'bg-gray-100 text-gray-700', icon: Info }
    }
  }

  const calculateWorkHours = (checkIn, checkOut) => {
    if (!checkIn || !checkOut) return 0
    const checkInTime = new Date(checkIn)
    const checkOutTime = new Date(checkOut)
    return (checkOutTime - checkInTime) / (1000 * 60 * 60)
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              กะงานของฉัน
            </h1>
            <p className="text-muted-foreground">ดูเวลากะงานและประวัติการเข้างาน</p>
          </div>
        </div>

        {/* Current Shift Card */}
        <Card className="bg-white border-2 border-blue-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              กะงานปัจจุบัน
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : currentShift ? (
              <div className="space-y-4">
                <div 
                  className="p-6 rounded-xl border-2 text-white"
                  style={{ 
                    background: `linear-gradient(135deg, ${currentShift.color || '#3B82F6'}, ${currentShift.color || '#3B82F6'}dd)`,
                    borderColor: currentShift.color || '#3B82F6'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-2xl font-bold mb-2">{currentShift.name}</h3>
                      <div className="space-y-1">
                        <p className="flex items-center gap-2 text-white/90">
                          <Clock className="h-4 w-4" />
                          เวลาทำงาน: {formatTime(currentShift.start_time)} - {formatTime(currentShift.end_time)}
                        </p>
                        <p className="text-sm text-white/80">
                          12 ชั่วโมง: {formatTo12Hour(currentShift.start_time)} - {formatTo12Hour(currentShift.end_time)}
                        </p>
                        {currentShift.grace_period_minutes && (
                          <p className="text-sm text-white/80">
                            เวลาอนุญาตให้สาย: {currentShift.grace_period_minutes} นาที
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-bold">
                        {currentShift.end_time && currentShift.start_time && 
                          ((new Date(`2000-01-01 ${currentShift.end_time}`) - new Date(`2000-01-01 ${currentShift.start_time}`)) / (1000 * 60 * 60)).toFixed(1)
                        }
                      </div>
                      <div className="text-sm text-white/80">ชั่วโมง</div>
                    </div>
                  </div>
                </div>

                {currentShift.ot_start_time && currentShift.ot_end_time && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-orange-600" />
                      <span className="font-medium text-orange-900">เวลาทำ OT</span>
                    </div>
                    <p className="text-sm text-orange-700 mt-1">
                      {formatTime(currentShift.ot_start_time)} - {formatTime(currentShift.ot_end_time)}
                      ({formatTo12Hour(currentShift.ot_start_time)} - {formatTo12Hour(currentShift.ot_end_time)})
                    </p>
                  </div>
                )}

                {currentShift.description && (
                  <div className="flex items-start gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                    <p className="text-sm text-blue-900">{currentShift.description}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 font-medium">ยังไม่ได้จัดกะงาน</p>
                <p className="text-sm text-gray-500 mt-1">กรุณาติดต่อ HR เพื่อจัดกะงาน</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Attendance History */}
        <Card className="bg-white border border-gray-200 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              ประวัติการเข้างาน (30 วันล่าสุด)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingData ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
              </div>
            ) : shiftHistory.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600">ไม่พบประวัติการเข้างาน</p>
              </div>
            ) : (
              <div className="space-y-3">
                {shiftHistory.map((record) => {
                  const statusBadge = getStatusBadge(record.status)
                  const StatusIcon = statusBadge.icon
                  const workHours = calculateWorkHours(record.check_in, record.check_out)

                  return (
                    <div
                      key={record.id}
                      className="p-4 rounded-lg border-2 hover:shadow-md transition-shadow"
                      style={{
                        borderColor: record.shifts?.color || '#E5E7EB',
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-12 h-12 rounded-lg flex items-center justify-center text-white"
                            style={{ backgroundColor: record.shifts?.color || '#3B82F6' }}
                          >
                            <Calendar className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">
                              {format(new Date(record.date), 'd MMM yyyy')}
                            </p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(record.date), 'EEEE')}
                            </p>
                          </div>
                        </div>
                        <span className={cn("px-3 py-1.5 rounded-full text-xs font-medium", statusBadge.color)}>
                          <StatusIcon className="h-3 w-3 inline mr-1" />
                          {statusBadge.label}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="bg-green-50 rounded-lg p-3">
                          <p className="text-xs text-green-600 mb-1">เข้างาน</p>
                          <p className="font-bold text-green-700">
                            {record.check_in ? format(new Date(record.check_in), 'HH:mm') : '-'}
                          </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-xs text-blue-600 mb-1">เลิกงาน</p>
                          <p className="font-bold text-blue-700">
                            {record.check_out ? format(new Date(record.check_out), 'HH:mm') : '-'}
                          </p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-3">
                          <p className="text-xs text-purple-600 mb-1">ชั่วโมงทำงาน</p>
                          <p className="font-bold text-purple-700">
                            {workHours > 0 ? `${workHours.toFixed(1)} ชม.` : '-'}
                          </p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-3">
                          <p className="text-xs text-orange-600 mb-1">OT</p>
                          <p className="font-bold text-orange-700">
                            {record.ot_hours > 0 ? `${record.ot_hours} ชม.` : '-'}
                          </p>
                        </div>
                      </div>

                      {record.shifts && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: record.shifts.color }}
                          />
                          <span>{record.shifts.name}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

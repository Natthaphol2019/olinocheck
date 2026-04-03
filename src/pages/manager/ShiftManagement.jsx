import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { supabase } from '@/services/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Users, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'

export default function ShiftManagement() {
  const { employee } = useAuth()
  const [shifts, setShifts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    try {
      const { data: shiftsData } = await supabase
        .from('shifts')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true })
      setShifts(shiftsData || [])
    } catch (error) {
      console.error('Error fetching shifts:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (time) => {
    if (!time) return '-'
    return time.substring(0, 5)
  }

  const getEmployeesInShift = async (shiftId) => {
    const today = format(new Date(), 'yyyy-MM-dd')
    
    const { data } = await supabase
      .from('time_records')
      .select(`
        employee_id,
        employees!time_records_employee_id_fkey (id, name)
      `)
      .eq('shift_id', shiftId)
      .gte('date', today)
      .lte('date', today)
    
    return data || []
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Clock className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              จัดการกะงาน
            </h1>
            <p className="text-muted-foreground">ดูข้อมูลกะงาน (พนักงานเลือกเอง)</p>
          </div>
        </div>

        {/* Shifts Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {loading ? (
            <div className="col-span-2 flex justify-center py-16">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
            </div>
          ) : (
            shifts.map((shift) => (
              <Card 
                key={shift.id} 
                className="border-2 hover:shadow-lg transition-all"
                style={{ 
                  borderColor: shift.color || '#3B82F6',
                  borderLeftWidth: '4px'
                }}
              >
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
                        style={{ backgroundColor: shift.color || '#3B82F6' }}
                      >
                        <Clock className="h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-2xl">{shift.name}</CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          พนักงานเลือกเองได้
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-sm font-medium">
                      <CheckCircle className="h-4 w-4" />
                      เปิดใช้งาน
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Time Info */}
                  <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">เวลาเข้างาน:</span>
                      <span className="font-bold text-lg text-green-600">
                        {formatTime(shift.start_time)} น.
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">เวลาเลิกงาน:</span>
                      <span className="font-bold text-lg text-blue-600">
                        {formatTime(shift.end_time)} น.
                      </span>
                    </div>
                    {shift.ot_start_time && shift.ot_end_time && (
                      <>
                        <div className="border-t pt-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-orange-600 font-semibold">เวลา OT:</span>
                            <span className="font-bold text-orange-600">
                              {formatTime(shift.ot_start_time)} - {formatTime(shift.ot_end_time)} น.
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                    {shift.grace_period_minutes > 0 && (
                      <div className="border-t pt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">สายหลังจาก:</span>
                          <span className="font-bold text-yellow-600">
                            {(() => {
                              if (!shift.start_time || !shift.grace_period_minutes) return '-';
                              const [hours, minutes] = shift.start_time.split(':');
                              const h = parseInt(hours);
                              const m = parseInt(minutes);
                              const graceM = m + (shift.grace_period_minutes || 15);
                              const graceH = h + Math.floor(graceM / 60);
                              const graceMin = graceM % 60;
                              return `${String(graceH).padStart(2, '0')}:${String(graceMin).padStart(2, '0')} น.`;
                            })()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          (หลังจากเวลาเข้างาน {shift.grace_period_minutes} นาที)
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Description */}
                  {shift.description && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-900">{shift.description}</p>
                    </div>
                  )}

                  {/* Summary */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2">
                    <Users className="h-4 w-4" />
                    <span>พนักงานเลือกกะนี้ตอนเช็คอิน/เอาท์</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {shifts.length === 0 && !loading && (
          <Card>
            <CardContent className="py-16 text-center">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 font-medium">ยังไม่มีกะงาน</p>
              <p className="text-sm text-gray-500 mt-1">กรุณารันไฟล์ simple_shifts_seed.sql ใน Supabase</p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  )
}

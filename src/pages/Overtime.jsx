import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { createOvertime, getEmployeeOvertime } from '@/services/overtimeService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Clock, Plus, CheckCircle2, XCircle, AlertCircle, Calendar, Moon, Sun } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function Overtime() {
  const { employee, loading } = useAuth()
  const { toast } = useToast()
  const [overtimeRecords, setOvertimeRecords] = useState([])
  const [recordsLoading, setRecordsLoading] = useState(true)
  const [showNewOvertime, setShowNewOvertime] = useState(false)
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    start_time: '18:00',
    end_time: '20:00',
    reason: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchOvertime()
    }
  }, [employee?.id, loading])

  const fetchOvertime = async () => {
    if (!employee?.id) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ยังไม่ได้เข้าสู่ระบบ',
        variant: 'destructive',
      })
      return
    }

    setRecordsLoading(true)
    try {
      const data = await getEmployeeOvertime(employee.id)
      setOvertimeRecords(data || [])
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setRecordsLoading(false)
    }
  }

  const calculateHours = (start, end) => {
    const startDate = new Date(`2000-01-01T${start}`)
    const endDate = new Date(`2000-01-01T${end}`)
    const diff = (endDate - startDate) / (1000 * 60 * 60)
    return diff.toFixed(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!employee?.id) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ยังไม่ได้เข้าสู่ระบบ',
        variant: 'destructive',
      })
      return
    }

    if (!formData.reason.trim()) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'กรุณากรอกเหตุผล',
        variant: 'destructive',
      })
      return
    }

    const hours = parseFloat(calculateHours(formData.start_time, formData.end_time))
    if (hours <= 0) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'เวลาสิ้นสุดต้องหลังจากเวลาเริ่มต้น',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await createOvertime(
        employee.id,
        formData.date,
        formData.start_time,
        formData.end_time,
        formData.reason
      )

      toast({
        title: 'สำเร็จ',
        description: 'ส่งคำร้องล่วงเวลาเรียบร้อยแล้ว',
      })

      setShowNewOvertime(false)
      setFormData({
        date: format(new Date(), 'yyyy-MM-dd'),
        start_time: '18:00',
        end_time: '20:00',
        reason: '',
      })
      fetchOvertime()
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending':
        return (
          <span className="badge-warning">
            <AlertCircle className="h-3 w-3" />
            รอพิจารณา
          </span>
        )
      case 'approved':
        return (
          <span className="badge-success">
            <CheckCircle2 className="h-3 w-3" />
            อนุมัติแล้ว
          </span>
        )
      case 'rejected':
        return (
          <span className="badge-danger">
            <XCircle className="h-3 w-3" />
            ไม่อนุมัติ
          </span>
        )
      default:
        return <span className="text-muted-foreground">{status}</span>
    }
  }

  const getTimeIcon = (time) => {
    const hour = parseInt(time.split(':')[0])
    if (hour >= 6 && hour < 18) {
      return <Sun className="h-4 w-4 text-amber-500" />
    }
    return <Moon className="h-4 w-4 text-indigo-500" />
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center shadow-lg shadow-orange-500/30">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
                ทำล่วงเวลา (OT)
              </h1>
              <p className="text-muted-foreground">ส่งและติดตามคำร้องทำล่วงเวลาของคุณ</p>
            </div>
          </div>
          <Dialog open={showNewOvertime} onOpenChange={setShowNewOvertime}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all h-12 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                ส่งคำร้อง OT
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  สร้างคำร้องล่วงเวลาใหม่
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">วันที่</Label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">เวลาเริ่มต้น</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={formData.start_time}
                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                        className="h-12 rounded-xl pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">เวลาสิ้นสุด</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={formData.end_time}
                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                        className="h-12 rounded-xl pl-10"
                      />
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-orange-600" />
                    <span className="text-sm font-medium text-orange-700">จำนวนชั่วโมง</span>
                  </div>
                  <span className="text-2xl font-bold text-orange-600">
                    {calculateHours(formData.start_time, formData.end_time)} ชม.
                  </span>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">เหตุผล</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="อธิบายเหตุผลสำหรับการทำล่วงเวลา..."
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl gradient-primary hover:shadow-xl hover:shadow-primary/40">
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังส่งคำร้อง...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      ส่งคำร้อง OT
                    </div>
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Cards List */}
        <Card className="card-glass">
          <CardContent className="pt-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            ) : overtimeRecords.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Clock className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">ยังไม่มีคำร้อง OT</p>
                <p className="text-muted-foreground text-sm">เริ่มสร้างคำร้องล่วงเวลาแรกของคุณ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">วันที่</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เวลาเริ่ม</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เวลาสิ้นสุด</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">จำนวน ชม.</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เหตุผล</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">สถานะ</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ส่งเมื่อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {overtimeRecords.map((ot) => (
                        <tr key={ot.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(ot.date), 'd MMM yyyy')}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getTimeIcon(ot.start_time)}
                              <span className="font-mono">{ot.start_time}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              {getTimeIcon(ot.end_time)}
                              <span className="font-mono">{ot.end_time}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full bg-orange-100 text-orange-700 text-sm font-bold">
                              {ot.hours} ชม.
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                            {ot.reason}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(ot.status)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {format(new Date(ot.created_at), 'd MMM yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {overtimeRecords.map((ot) => (
                    <Card key={ot.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-14 h-14 rounded-xl gradient-warning flex items-center justify-center">
                              <Clock className="h-7 w-7 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold">
                                {format(new Date(ot.date), 'd MMM yyyy')}
                              </p>
                              <p className="text-xs text-muted-foreground flex items-center gap-2">
                                <span className="font-mono">{ot.start_time}</span>
                                <span>→</span>
                                <span className="font-mono">{ot.end_time}</span>
                              </p>
                            </div>
                          </div>
                          <div>{getStatusBadge(ot.status)}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-3 text-center">
                            <p className="text-xs text-muted-foreground">จำนวนชั่วโมง</p>
                            <p className="text-2xl font-bold text-orange-600">
                              {ot.hours}
                            </p>
                            <p className="text-xs text-orange-600">ชั่วโมง</p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground mb-1">เหตุผล</p>
                            <p className="text-sm text-foreground line-clamp-2">{ot.reason}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <p className="text-xs text-muted-foreground">
                            ส่งเมื่อ: {format(new Date(ot.created_at), 'd MMM yyyy')}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  )
}

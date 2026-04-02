import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { createLeaveRequest, getEmployeeLeaveRequests } from '@/services/leaveService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Calendar, Plus, CheckCircle2, XCircle, AlertCircle, FileText, Clock } from 'lucide-react'
import { format, differenceInDays } from 'date-fns'
import { cn } from '@/lib/utils'

const LEAVE_TYPES = [
  { value: 'annual', label: 'ลาพักร้อน', icon: '🏖️' },
  { value: 'sick', label: 'ลาป่วย', icon: '🤒' },
  { value: 'personal', label: 'ลากิจ', icon: '📋' },
  { value: 'maternity', label: 'ลาคลอด', icon: '👶' },
  { value: 'paternity', label: 'ลาพaternity', icon: '👨‍🍼' },
  { value: 'bereavement', label: 'ลาทุกข์', icon: '🕯️' },
  { value: 'unpaid', label: 'ลาโดยไม่รับเงินเดือน', icon: '💰' },
]

export default function LeaveRequests() {
  const { employee, loading } = useAuth()
  const { toast } = useToast()
  const [leaveRequests, setLeaveRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    end_date: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchLeaveRequests()
    }
  }, [employee?.id, loading])

  const fetchLeaveRequests = async () => {
    if (!employee?.id) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'ยังไม่ได้เข้าสู่ระบบ',
        variant: 'destructive',
      })
      return
    }

    setRequestsLoading(true)
    try {
      const data = await getEmployeeLeaveRequests(employee.id)
      setLeaveRequests(data || [])
    } catch (error) {
      toast({
        title: 'ข้อผิดพลาด',
        description: error.message,
        variant: 'destructive',
      })
    } finally {
      setRequestsLoading(false)
    }
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

    if (new Date(formData.end_date) < new Date(formData.start_date)) {
      toast({
        title: 'ข้อผิดพลาด',
        description: 'วันสิ้นสุดต้องหลังจากวันเริ่มต้น',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      await createLeaveRequest(
        employee.id,
        formData.leave_type,
        formData.start_date,
        formData.end_date,
        formData.reason,
        file
      )

      toast({
        title: 'สำเร็จ',
        description: 'ส่งคำร้องลาเรียบร้อยแล้ว',
      })

      setShowNewRequest(false)
      setFormData({
        leave_type: 'annual',
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: format(new Date(), 'yyyy-MM-dd'),
        reason: '',
      })
      setFile(null)
      fetchLeaveRequests()
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

  const getLeaveTypeLabel = (type) => {
    const leaveType = LEAVE_TYPES.find(t => t.value === type)
    return leaveType ? `${leaveType.icon} ${leaveType.label}` : type
  }

  const calculateDays = (start, end) => {
    return differenceInDays(new Date(end), new Date(start)) + 1
  }

  const getLeaveTypeIcon = (type) => {
    return LEAVE_TYPES.find(t => t.value === type)?.icon || '📄'
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-purple flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                คำร้องลา
              </h1>
              <p className="text-muted-foreground">ส่งและติดตามคำร้องการลาของคุณ</p>
            </div>
          </div>
          <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all h-12 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                ส่งคำร้องลา
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  สร้างคำร้องลาใหม่
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">ประเภทการลา</Label>
                  <Select
                    value={formData.leave_type}
                    onValueChange={(v) => setFormData({ ...formData, leave_type: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAVE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className="flex items-center gap-2">
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-semibold">วันเริ่มต้น</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="h-12 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-semibold">วันสิ้นสุด</Label>
                    <Input
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      min={formData.start_date}
                      className="h-12 rounded-xl"
                    />
                  </div>
                </div>
                <div className="bg-primary/5 rounded-xl p-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">
                    รวม {calculateDays(formData.start_date, formData.end_date)} วัน
                  </span>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">เหตุผล</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="อธิบายเหตุผลสำหรับการลา..."
                    rows={4}
                    className="rounded-xl resize-none"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">ไฟล์แนบ (ไม่บังคับ)</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={(e) => setFile(e.target.files[0])}
                      className="rounded-xl"
                    />
                    {file && (
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3 text-green-600" />
                        {file.name}
                      </span>
                    )}
                  </div>
                </div>
                <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl gradient-primary hover:shadow-xl hover:shadow-primary/40">
                  {submitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      กำลังส่งคำร้อง...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      ส่งคำร้องลา
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
            ) : leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <Calendar className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">ยังไม่มีคำร้องลา</p>
                <p className="text-muted-foreground text-sm">เริ่มสร้างคำร้องลาแรกของคุณ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ประเภท</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">วันเริ่มต้น</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">วันสิ้นสุด</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">จำนวนวัน</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เหตุผล</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">สถานะ</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ส่งเมื่อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leaveRequests.map((request) => (
                        <tr key={request.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 font-medium">
                            {getLeaveTypeLabel(request.leave_type)}
                          </td>
                          <td className="py-3 px-4">
                            {format(new Date(request.start_date), 'd MMM yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            {format(new Date(request.end_date), 'd MMM yyyy')}
                          </td>
                          <td className="py-3 px-4">
                            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                              {calculateDays(request.start_date, request.end_date)} วัน
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                            {request.reason}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {format(new Date(request.created_at), 'd MMM yyyy')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {leaveRequests.map((request) => (
                    <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-14 h-14 rounded-xl gradient-purple flex items-center justify-center text-2xl">
                              {getLeaveTypeIcon(request.leave_type)}
                            </div>
                            <div>
                              <p className="font-semibold">{getLeaveTypeLabel(request.leave_type)}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.start_date), 'd MMM yyyy')} - {format(new Date(request.end_date), 'd MMM yyyy')}
                              </p>
                            </div>
                          </div>
                          <div>{getStatusBadge(request.status)}</div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div className="bg-primary/5 rounded-xl p-3 text-center">
                            <p className="text-xs text-muted-foreground">จำนวนวัน</p>
                            <p className="text-lg font-bold text-primary">
                              {calculateDays(request.start_date, request.end_date)}
                            </p>
                          </div>
                          <div className="bg-muted/50 rounded-xl p-3">
                            <p className="text-xs text-muted-foreground">เหตุผล</p>
                            <p className="text-sm text-foreground truncate">{request.reason}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <p className="text-xs text-muted-foreground">
                            ส่งเมื่อ: {format(new Date(request.created_at), 'd MMM yyyy')}
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

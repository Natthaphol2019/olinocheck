import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Layout from '@/components/Layout'
import { createRequest, getEmployeeRequests } from '@/services/requestService'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { FileText, Plus, Upload, Clock, CheckCircle2, XCircle, AlertCircle, Calendar, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export default function Requests() {
  const { employee, loading } = useAuth()
  const { toast } = useToast()
  const [requests, setRequests] = useState([])
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [showNewRequest, setShowNewRequest] = useState(false)
  const [formData, setFormData] = useState({
    type: 'time_correction',
    reason: '',
    request_date: format(new Date(), 'yyyy-MM-dd'),
    requested_time: '09:00',
  })
  const [file, setFile] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && employee?.id) {
      fetchRequests()
    }
  }, [employee?.id, loading])

  const fetchRequests = async () => {
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
      const data = await getEmployeeRequests(employee.id)
      setRequests(data || [])
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

    setSubmitting(true)
    try {
      await createRequest(
        employee.id,
        formData.type,
        formData.reason,
        formData.request_date,
        formData.requested_time,
        file
      )

      toast({
        title: 'สำเร็จ',
        description: 'ส่งคำร้องเรียบร้อยแล้ว',
      })

      setShowNewRequest(false)
      setFormData({
        type: 'time_correction',
        reason: '',
        request_date: format(new Date(), 'yyyy-MM-dd'),
        requested_time: '09:00',
      })
      setFile(null)
      fetchRequests()
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

  const getTypeLabel = (type) => {
    switch (type) {
      case 'time_correction': return 'แก้ไขเวลาทำงาน'
      case 'retroactive_checkin': return 'ย้อนหลังการเช็คอิน'
      case 'retroactive_checkout': return 'ย้อนหลังการเช็คเอาท์'
      default: return type
    }
  }

  const getTypeIcon = (type) => {
    switch (type) {
      case 'time_correction': return <Edit3 className="h-4 w-4" />
      case 'retroactive_checkin': return <Clock className="h-4 w-4" />
      case 'retroactive_checkout': return <Clock className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <Layout>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl gradient-warning flex items-center justify-center shadow-lg shadow-orange-500/30">
              <FileText className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                คำร้องทั่วไป
              </h1>
              <p className="text-muted-foreground">ส่งและติดตามคำร้องเกี่ยวกับเวลาทำงาน</p>
            </div>
          </div>
          <Dialog open={showNewRequest} onOpenChange={setShowNewRequest}>
            <DialogTrigger asChild>
              <Button className="gradient-primary hover:shadow-xl hover:shadow-primary/40 active:scale-95 transition-all h-12 rounded-xl">
                <Plus className="h-4 w-4 mr-2" />
                สร้างคำร้อง
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg rounded-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  สร้างคำร้องใหม่
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-semibold">ประเภทคำร้อง</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(v) => setFormData({ ...formData, type: v })}
                  >
                    <SelectTrigger className="h-12 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="time_correction">แก้ไขเวลาทำงาน</SelectItem>
                      <SelectItem value="retroactive_checkin">ย้อนหลังการเช็คอิน</SelectItem>
                      <SelectItem value="retroactive_checkout">ย้อนหลังการเช็คเอาท์</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">วันที่ที่ต้องการ</Label>
                  <Input
                    type="date"
                    value={formData.request_date}
                    onChange={(e) => setFormData({ ...formData, request_date: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">เวลาที่ต้องการ</Label>
                  <Input
                    type="time"
                    value={formData.requested_time}
                    onChange={(e) => setFormData({ ...formData, requested_time: e.target.value })}
                    className="h-12 rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">เหตุผล</Label>
                  <Textarea
                    value={formData.reason}
                    onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                    placeholder="อธิบายเหตุผลที่ต้องการส่งคำร้อง..."
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
                      <Upload className="h-4 w-4" />
                      ส่งคำร้อง
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
            {loading || requestsLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                <p className="text-muted-foreground">กำลังโหลดข้อมูล...</p>
              </div>
            ) : !employee ? (
              <div className="flex flex-col items-center justify-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground text-lg">กรุณาเข้าสู่ระบบเพื่อดูคำร้อง</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <FileText className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-lg font-medium">ยังไม่มีคำร้อง</p>
                <p className="text-muted-foreground text-sm">เริ่มสร้างคำร้องแรกของคุณ</p>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border/50">
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">ประเภท</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">วันที่</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เวลา</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">เหตุผล</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">สถานะ</th>
                        <th className="text-left py-3 px-4 font-semibold text-muted-foreground">สร้างเมื่อ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {requests.map((request) => (
                        <tr key={request.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                                {getTypeIcon(request.type)}
                              </div>
                              <span className="font-medium">{getTypeLabel(request.type)}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 font-medium">
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              {format(new Date(request.request_date), 'd MMM yyyy')}
                            </div>
                          </td>
                          <td className="py-3 px-4">{request.requested_time || '-'}</td>
                          <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                            {request.reason}
                          </td>
                          <td className="py-3 px-4">
                            {getStatusBadge(request.status)}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-sm">
                            {format(new Date(request.created_at), 'd MMM yyyy HH:mm')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="lg:hidden space-y-3">
                  {requests.map((request) => (
                    <Card key={request.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-3 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                              {getTypeIcon(request.type)}
                            </div>
                            <div>
                              <p className="font-semibold">{getTypeLabel(request.type)}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(request.request_date), 'd MMM yyyy')} • {request.requested_time || '-'}
                              </p>
                            </div>
                          </div>
                          <div>{getStatusBadge(request.status)}</div>
                        </div>
                        
                        <div className="bg-muted/50 rounded-xl p-3 mb-3">
                          <p className="text-sm text-muted-foreground">{request.reason}</p>
                        </div>
                        
                        <div className="flex items-center justify-between pt-3 border-t border-border/30">
                          <p className="text-xs text-muted-foreground">
                            ส่งเมื่อ: {format(new Date(request.created_at), 'd MMM yyyy HH:mm')}
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
